using API.Data;
using API.ServicesAPI.Interfaces;
using iText.Kernel.Pdf;
using iText.Kernel.Colors;
using iText.Kernel.Geom;
using iText.Kernel.Font;
using iText.IO.Font.Constants;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Layout.Borders;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using ExcelColor = System.Drawing.Color;
using Tuco.Clases.DTOs.Inventario;

namespace API.ServicesAPI
{
    public class ReporteInventarioService : IReporteInventarioService
    {
        private readonly TucoContext _context;
        private readonly ILogger<ReporteInventarioService> _logger;

        public ReporteInventarioService(TucoContext context, ILogger<ReporteInventarioService> logger)
        {
            _context = context;
            _logger = logger;

            // ✅ CONFIGURAR EPPLUS PARA USO NO COMERCIAL
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        public async Task<ReporteInventarioDTO> GenerarReporteAsync(int inventarioProgramadoId)
        {
            try
            {
                // Obtener inventario
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .ThenInclude(a => a.Usuario)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioProgramadoId);

                if (inventario == null)
                    throw new ArgumentException("Inventario no encontrado");

                // Obtener usuario creador
                var usuarioCreador = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.UsuarioId == inventario.UsuarioCreadorId);

                // Obtener detalles del inventario con información de llantas
                var detalles = await _context.DetallesInventarioProgramado
                    .Include(d => d.Producto)
                        .ThenInclude(p => p.Llanta)
                    .Include(d => d.UsuarioConteo)
                    .Where(d => d.InventarioProgramadoId == inventarioProgramadoId)
                    .ToListAsync();

                // Crear lista de productos para el reporte con información completa
                var productos = detalles.Select(d =>
                {
                    var llanta = d.Producto?.Llanta?.FirstOrDefault();
                    string medidas = null;

                    // Formatear medidas si es llanta
                    if (llanta != null)
                    {
                        // Formatear medidas según estándar de neumáticos
                        // Formato: {Ancho}/{Perfil}/R{Diametro} o {Ancho}/R{Diametro} (sin perfil)
                        if (llanta.Ancho.HasValue && !string.IsNullOrEmpty(llanta.Diametro))
                        {
                            var anchoStr = FormatearMedida(llanta.Ancho.Value);

                            // Verificar si tiene perfil (y si es mayor que 0)
                            if (llanta.Perfil.HasValue && llanta.Perfil.Value > 0)
                            {
                                var perfilStr = FormatearMedida(llanta.Perfil.Value);
                                medidas = $"{anchoStr}/{perfilStr}/R{llanta.Diametro}";
                            }
                            else
                            {
                                // Sin perfil, solo ancho y diámetro
                                medidas = $"{anchoStr}/R{llanta.Diametro}";
                            }
                        }
                        else if (llanta.Ancho.HasValue)
                        {
                            // Solo tiene ancho, sin diámetro
                            medidas = FormatearMedida(llanta.Ancho.Value);
                        }
                    }

                    return new ProductoInventarioReporteDTO
                    {
                        // Información básica
                        ProductoId = d.Producto?.ProductoId ?? 0,
                        NombreProducto = d.Producto?.NombreProducto ?? "Producto Desconocido",
                        Descripcion = d.Producto?.Descripcion,

                        // Información de inventario
                        CantidadSistema = d.CantidadSistema,
                        CantidadFisica = d.CantidadFisica ?? 0,
                        Diferencia = d.Diferencia ?? 0,
                        StockMinimo = d.Producto?.StockMinimo,

                        // Información financiera
                        Costo = d.Producto?.Costo,
                        PorcentajeUtilidad = d.Producto?.PorcentajeUtilidad,
                        PrecioUnitario = d.Producto?.Precio ?? 0,
                        ImpactoEconomico = (d.Diferencia ?? 0) * (d.Producto?.Precio ?? 0),

                        // Información de llanta (si aplica)
                        Medidas = medidas,
                        TipoTerreno = llanta?.TipoTerreno,
                        Capas = llanta?.Capas,
                        Marca = llanta?.Marca,
                        Modelo = llanta?.Modelo,
                        IndiceVelocidad = llanta?.IndiceVelocidad,

                        // Información de conteo
                        Categoria = (d.Diferencia ?? 0) > 0 ? "Exceso" :
                                   (d.Diferencia ?? 0) < 0 ? "Faltante" : "Correcto",
                        UsuarioConteo = d.UsuarioConteo?.NombreUsuario ?? "Sin asignar",
                        FechaConteo = d.FechaConteo
                    };
                }).ToList();

                // Calcular estadísticas
                var totalProductos = productos.Count;
                var productosConDiscrepancia = productos.Count(p => p.Diferencia != 0);
                var productosExceso = productos.Count(p => p.Diferencia > 0);
                var productosFaltante = productos.Count(p => p.Diferencia < 0);

                var valorExceso = productos.Where(p => p.Diferencia > 0).Sum(p => p.ImpactoEconomico);
                var valorFaltante = Math.Abs(productos.Where(p => p.Diferencia < 0).Sum(p => p.ImpactoEconomico));
                var valorTotalDiscrepancia = valorExceso + valorFaltante;

                // Crear reporte
                var reporte = new ReporteInventarioDTO
                {
                    InventarioProgramadoId = inventarioProgramadoId,
                    Titulo = inventario.Titulo,
                    FechaInicio = inventario.FechaInicio,
                    FechaFin = inventario.FechaFin,
                    UsuarioCreador = usuarioCreador?.NombreUsuario ?? "Desconocido",
                    TotalProductosContados = totalProductos,
                    ProductosConDiscrepancia = productosConDiscrepancia,
                    PorcentajeDiscrepancia = totalProductos > 0 ? Math.Round((decimal)productosConDiscrepancia / totalProductos * 100, 2) : 0,
                    ValorTotalDiscrepancia = valorTotalDiscrepancia,
                    ProductosConExceso = productosExceso,
                    ProductosConFaltante = productosFaltante,
                    ValorExceso = valorExceso,
                    ValorFaltante = valorFaltante,
                    // ✅ ORDENAR POR MEDIDAS (alfanuméricamente), productos sin medidas al final
                    Productos = productos
                        .OrderBy(p => string.IsNullOrEmpty(p.Medidas) ? 1 : 0)  // Sin medidas al final
                        .ThenBy(p => p.Medidas ?? string.Empty)                   // Alfabéticamente por medidas
                        .ToList(),
                    FechaGeneracionReporte = DateTime.Now
                };

                return reporte;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generando reporte para inventario {InventarioId}", inventarioProgramadoId);
                throw;
            }
        }

        public async Task<byte[]> GenerarReporteExcelAsync(int inventarioProgramadoId)
        {
            var reporte = await GenerarReporteAsync(inventarioProgramadoId);

            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Reporte Inventario");

            // ✅ NÚMERO TOTAL DE COLUMNAS ACTUALIZADO
            int totalColumnas = 18; // ID, Nombre, Desc, Medidas, Terreno, Capas, Marca, Modelo, Índice, Stock Min, Sist, Fís, Dif, Costo, %, Precio, Impacto, Usuario

            // ======================
            // ENCABEZADO DE EMPRESA
            // ======================
            worksheet.Cells[1, 1, 1, totalColumnas].Merge = true;
            worksheet.Cells["A1"].Value = "MULTISERVICIOS TUCO";
            worksheet.Cells["A1"].Style.Font.Size = 20;
            worksheet.Cells["A1"].Style.Font.Bold = true;
            worksheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells["A1"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells["A1"].Style.Fill.BackgroundColor.SetColor(ExcelColor.DarkBlue);
            worksheet.Cells["A1"].Style.Font.Color.SetColor(ExcelColor.White);

            worksheet.Cells[2, 1, 2, totalColumnas].Merge = true;
            worksheet.Cells["A2"].Value = "Sistema de Gestión de Inventarios";
            worksheet.Cells["A2"].Style.Font.Size = 12;
            worksheet.Cells["A2"].Style.Font.Italic = true;
            worksheet.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells["A2"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells["A2"].Style.Fill.BackgroundColor.SetColor(ExcelColor.LightBlue);

            // ======================
            // TÍTULO DEL REPORTE
            // ======================
            worksheet.Cells[4, 1, 4, totalColumnas].Merge = true;
            worksheet.Cells["A4"].Value = "REPORTE DE INVENTARIO";
            worksheet.Cells["A4"].Style.Font.Size = 16;
            worksheet.Cells["A4"].Style.Font.Bold = true;
            worksheet.Cells["A4"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells["A4"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells["A4"].Style.Fill.BackgroundColor.SetColor(ExcelColor.LightGray);

            // ======================
            // INFORMACIÓN GENERAL
            // ======================
            int row = 6;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Inventario:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.Titulo;

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Fecha Inicio:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.FechaInicio.ToString("dd/MM/yyyy HH:mm");

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Fecha Fin:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.FechaFin.ToString("dd/MM/yyyy HH:mm");

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Creado por:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.UsuarioCreador;

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Generado el:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = DateTime.Now.ToString("dd/MM/yyyy HH:mm");

            // ======================
            // RESUMEN EJECUTIVO
            // ======================
            row += 2;
            worksheet.Cells[row, 1, row, totalColumnas].Merge = true;
            worksheet.Cells[$"A{row}"].Value = "RESUMEN EJECUTIVO";
            worksheet.Cells[$"A{row}"].Style.Font.Size = 14;
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"A{row}"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells[$"A{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.Orange);
            worksheet.Cells[$"A{row}"].Style.Font.Color.SetColor(ExcelColor.White);

            // Crear tabla de resumen en formato 2x4
            row++;
            var resumenData = new object[,] {
        { "Total Productos:", reporte.TotalProductosContados, "Productos con Discrepancia:", reporte.ProductosConDiscrepancia },
        { "% Discrepancia:", $"{reporte.PorcentajeDiscrepancia}%", "Valor Total Discrepancia:", $"₡{reporte.ValorTotalDiscrepancia:N2}" },
        { "Productos con Exceso:", reporte.ProductosConExceso, "Valor Exceso:", $"₡{reporte.ValorExceso:N2}" },
        { "Productos con Faltante:", reporte.ProductosConFaltante, "Valor Faltante:", $"₡{reporte.ValorFaltante:N2}" }
    };

            for (int i = 0; i < resumenData.GetLength(0); i++)
            {
                for (int j = 0; j < resumenData.GetLength(1); j++)
                {
                    var cell = worksheet.Cells[row + i, j + 1];
                    cell.Value = resumenData[i, j];

                    if (j % 2 == 0) // Etiquetas
                    {
                        cell.Style.Font.Bold = true;
                        cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                        cell.Style.Fill.BackgroundColor.SetColor(ExcelColor.LightYellow);
                    }
                    else // Valores
                    {
                        cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                        cell.Style.Fill.BackgroundColor.SetColor(ExcelColor.White);
                    }

                    // Bordes
                    cell.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    cell.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                    cell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    cell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                }
            }

            // ======================
            // DETALLE DE PRODUCTOS
            // ======================
            row += 6;
            worksheet.Cells[row, 1, row, totalColumnas].Merge = true;
            worksheet.Cells[$"A{row}"].Value = "DETALLE POR PRODUCTO";
            worksheet.Cells[$"A{row}"].Style.Font.Size = 14;
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"A{row}"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells[$"A{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}"].Style.Fill.BackgroundColor.SetColor(ExcelColor.Green);
            worksheet.Cells[$"A{row}"].Style.Font.Color.SetColor(ExcelColor.White);

            row += 2;

            // ✅ ENCABEZADOS ACTUALIZADOS CON TODAS LAS COLUMNAS
            string[] headers = {
                "ID",                   // 1
                "Producto",             // 2
                "Descripción",          // 3
                "Medidas",              // 4
                "Tipo Terreno",         // 5
                "Capas",                // 6
                "Marca",                // 7
                "Modelo",               // 8
                "Índice Vel.",          // 9
                "Stock Mín.",           // 10
                "Cant. Sistema",        // 11
                "Cant. Física",         // 12
                "Diferencia",           // 13
                "Costo",                // 14
                "% Utilidad",           // 15
                "Precio Venta",         // 16
                "Impacto $",            // 17
                "Usuario Conteo"        // 18
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var headerCell = worksheet.Cells[row, i + 1];
                headerCell.Value = headers[i];
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                headerCell.Style.Fill.BackgroundColor.SetColor(ExcelColor.DarkGray);
                headerCell.Style.Font.Color.SetColor(ExcelColor.White);
                headerCell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                headerCell.Style.WrapText = true; // Permitir texto en varias líneas

                // Bordes
                headerCell.Style.Border.Top.Style = ExcelBorderStyle.Thick;
                headerCell.Style.Border.Bottom.Style = ExcelBorderStyle.Thick;
                headerCell.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                headerCell.Style.Border.Right.Style = ExcelBorderStyle.Thin;
            }
            row++;

            // ✅ DATOS DE PRODUCTOS CON TODAS LAS COLUMNAS
            foreach (var producto in reporte.Productos)
            {
                int col = 1;

                // Información básica
                worksheet.Cells[row, col++].Value = producto.ProductoId;
                worksheet.Cells[row, col++].Value = producto.NombreProducto;
                worksheet.Cells[row, col++].Value = producto.Descripcion;

                // Información de llanta
                worksheet.Cells[row, col++].Value = producto.Medidas ?? "-";
                worksheet.Cells[row, col++].Value = producto.TipoTerreno ?? "-";
                worksheet.Cells[row, col++].Value = producto.Capas?.ToString() ?? "-";
                worksheet.Cells[row, col++].Value = producto.Marca ?? "-";
                worksheet.Cells[row, col++].Value = producto.Modelo ?? "-";
                worksheet.Cells[row, col++].Value = producto.IndiceVelocidad ?? "-";

                // Información de inventario
                worksheet.Cells[row, col++].Value = producto.StockMinimo?.ToString() ?? "-";
                worksheet.Cells[row, col++].Value = producto.CantidadSistema;
                worksheet.Cells[row, col++].Value = producto.CantidadFisica;
                worksheet.Cells[row, col++].Value = producto.Diferencia;

                // Información financiera
                var costoCel = worksheet.Cells[row, col++];
                if (producto.Costo.HasValue)
                {
                    costoCel.Value = producto.Costo.Value;
                    costoCel.Style.Numberformat.Format = "₡#,##0.00";
                }
                else
                {
                    costoCel.Value = "-";
                }

                var utilidadCel = worksheet.Cells[row, col++];
                if (producto.PorcentajeUtilidad.HasValue)
                {
                    utilidadCel.Value = producto.PorcentajeUtilidad.Value;
                    utilidadCel.Style.Numberformat.Format = "0.00\"%\"";
                }
                else
                {
                    utilidadCel.Value = "-";
                }

                var precioCel = worksheet.Cells[row, col++];
                precioCel.Value = producto.PrecioUnitario;
                precioCel.Style.Numberformat.Format = "₡#,##0.00";

                var impactoCel = worksheet.Cells[row, col++];
                impactoCel.Value = producto.ImpactoEconomico;
                impactoCel.Style.Numberformat.Format = "₡#,##0.00";

                // Usuario conteo
                worksheet.Cells[row, col++].Value = producto.UsuarioConteo;

                // Colorear según categoría
                if (producto.Categoria == "Faltante")
                {
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.BackgroundColor.SetColor(ExcelColor.MistyRose);
                }
                else if (producto.Categoria == "Exceso")
                {
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.BackgroundColor.SetColor(ExcelColor.LightGreen);
                }
                else
                {
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.BackgroundColor.SetColor(ExcelColor.White);
                }

                // Bordes para toda la fila
                for (int c = 1; c <= totalColumnas; c++)
                {
                    worksheet.Cells[row, c].Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    worksheet.Cells[row, c].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                    worksheet.Cells[row, c].Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    worksheet.Cells[row, c].Style.Border.Right.Style = ExcelBorderStyle.Thin;
                }

                row++;
            }

            // ✅ AJUSTES FINALES DE ANCHOS DE COLUMNA
            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

            // Ajustar anchos específicos de columnas
            worksheet.Column(1).Width = 8;   // ID
            worksheet.Column(2).Width = 30;  // Nombre Producto
            worksheet.Column(3).Width = 35;  // Descripción
            worksheet.Column(4).Width = 15;  // Medidas
            worksheet.Column(5).Width = 12;  // Tipo Terreno
            worksheet.Column(6).Width = 8;   // Capas
            worksheet.Column(7).Width = 15;  // Marca
            worksheet.Column(8).Width = 15;  // Modelo
            worksheet.Column(9).Width = 10;  // Índice Velocidad
            worksheet.Column(10).Width = 10; // Stock Mínimo
            worksheet.Column(11).Width = 12; // Cant. Sistema
            worksheet.Column(12).Width = 12; // Cant. Física
            worksheet.Column(13).Width = 10; // Diferencia
            worksheet.Column(14).Width = 12; // Costo
            worksheet.Column(15).Width = 10; // % Utilidad
            worksheet.Column(16).Width = 12; // Precio Venta
            worksheet.Column(17).Width = 12; // Impacto
            worksheet.Column(18).Width = 18; // Usuario Conteo

            // Ajustar altura de la fila de headers
            worksheet.Row(worksheet.Dimension.Start.Row + headers.Length - 1).Height = 30;

            return package.GetAsByteArray();
        }


        public async Task<byte[]> GenerarReportePdfAsync(int inventarioProgramadoId)
        {
            var reporte = await GenerarReporteAsync(inventarioProgramadoId);

            using var memoryStream = new MemoryStream();
            // ✅ CAMBIAR A ORIENTACIÓN HORIZONTAL
            var writer = new PdfWriter(memoryStream);
            var pdfDoc = new PdfDocument(writer);
            var document = new iText.Layout.Document(pdfDoc, PageSize.A4.Rotate());
            document.SetMargins(30, 25, 30, 25);

            try
            {
                // ======================
                // DEFINIR COLORES Y FUENTES
                // ======================
                var azulEmpresa = new DeviceRgb(25, 118, 210);  // Azul corporativo
                var grisClaro = new DeviceRgb(245, 245, 245);
                var rojoAlerta = new DeviceRgb(244, 67, 54);    // Rojo para faltantes
                var verdeOk = new DeviceRgb(76, 175, 80);       // Verde para excesos
                var naranjaAdvertencia = new DeviceRgb(255, 152, 0); // Naranja para alertas
                var blanco = new DeviceRgb(255, 255, 255);
                var negro = new DeviceRgb(0, 0, 0);
                var gris = new DeviceRgb(128, 128, 128);

                var titleFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                var subtitleFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
                var headerFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                var normalFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
                var boldFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                var smallFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
                var italicFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_OBLIQUE);

                // ======================
                // ENCABEZADO DE EMPRESA
                // ======================
                var headerTable = new Table(new float[] { 1f, 2f, 1f });
                headerTable.SetWidth(UnitValue.CreatePercentValue(100));

                // Logo placeholder
                var logoCell = new Cell();
                logoCell.Add(new Paragraph("LOGO\nTUCO").SetFont(boldFont).SetFontSize(12).SetFontColor(blanco));
                logoCell.SetBackgroundColor(azulEmpresa);
                logoCell.SetPadding(10f);
                logoCell.SetTextAlignment(TextAlignment.CENTER);
                logoCell.SetVerticalAlignment(VerticalAlignment.MIDDLE);
                logoCell.SetBorder(new SolidBorder(1));
                headerTable.AddCell(logoCell);

                // Información de empresa
                var empresaInfo = new Cell();
                empresaInfo.SetBorder(new SolidBorder(1));
                empresaInfo.SetPadding(10f);
                empresaInfo.Add(new Paragraph("MULTISERVICIOS TUCO").SetFont(titleFont).SetFontSize(20).SetFontColor(azulEmpresa));
                empresaInfo.Add(new Paragraph("Sistema de Gestión de Inventarios").SetFont(subtitleFont).SetFontSize(12).SetFontColor(gris));
                empresaInfo.Add(new Paragraph($"Reporte generado: {DateTime.Now:dd/MM/yyyy HH:mm}").SetFont(smallFont).SetFontSize(8).SetFontColor(negro));
                headerTable.AddCell(empresaInfo);

                // Información del reporte
                var reporteInfo = new Cell();
                reporteInfo.SetBorder(new SolidBorder(1));
                reporteInfo.SetPadding(10f);
                reporteInfo.SetBackgroundColor(grisClaro);
                reporteInfo.Add(new Paragraph("REPORTE DE INVENTARIO").SetFont(headerFont).SetFontSize(12));
                reporteInfo.Add(new Paragraph($"ID: {reporte.InventarioProgramadoId}").SetFont(normalFont).SetFontSize(9));
                reporteInfo.Add(new Paragraph($"Estado: COMPLETADO").SetFont(boldFont).SetFontSize(9).SetFontColor(verdeOk));
                headerTable.AddCell(reporteInfo);

                document.Add(headerTable);
                document.Add(new Paragraph(" ")); // Espacio

                // ======================
                // INFORMACIÓN DETALLADA DEL INVENTARIO
                // ======================
                var infoInventarioTable = new Table(new float[] { 1f, 1f, 1f, 1f });
                infoInventarioTable.SetWidth(UnitValue.CreatePercentValue(100));

                void AddInfoInventarioRow(string label1, string value1, string label2, string value2)
                {
                    // Columna 1 - Label
                    var labelCell1 = new Cell();
                    labelCell1.Add(new Paragraph(label1).SetFont(boldFont).SetFontSize(9));
                    labelCell1.SetBackgroundColor(grisClaro);
                    labelCell1.SetPadding(6f);
                    labelCell1.SetBorder(new SolidBorder(1));
                    infoInventarioTable.AddCell(labelCell1);

                    // Columna 2 - Value
                    var valueCell1 = new Cell();
                    valueCell1.Add(new Paragraph(value1).SetFont(normalFont).SetFontSize(9));
                    valueCell1.SetPadding(6f);
                    valueCell1.SetBorder(new SolidBorder(1));
                    infoInventarioTable.AddCell(valueCell1);

                    // Columna 3 - Label
                    var labelCell2 = new Cell();
                    labelCell2.Add(new Paragraph(label2).SetFont(boldFont).SetFontSize(9));
                    labelCell2.SetBackgroundColor(grisClaro);
                    labelCell2.SetPadding(6f);
                    labelCell2.SetBorder(new SolidBorder(1));
                    infoInventarioTable.AddCell(labelCell2);

                    // Columna 4 - Value
                    var valueCell2 = new Cell();
                    valueCell2.Add(new Paragraph(value2).SetFont(normalFont).SetFontSize(9));
                    valueCell2.SetPadding(6f);
                    valueCell2.SetBorder(new SolidBorder(1));
                    infoInventarioTable.AddCell(valueCell2);
                }

                // ✅ OBTENER USUARIOS QUE PARTICIPARON EN EL INVENTARIO
                var usuariosParticipantes = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioProgramadoId && d.UsuarioConteoId != null)
                    .Include(d => d.UsuarioConteo)
                    .Select(d => d.UsuarioConteo != null ? d.UsuarioConteo.NombreUsuario : "Sin nombre")
                    .Distinct()
                    .ToListAsync();

                var usuariosTexto = usuariosParticipantes != null && usuariosParticipantes.Any()
                    ? string.Join(", ", usuariosParticipantes.Where(u => !string.IsNullOrEmpty(u)))
                    : "Sin asignar";

                AddInfoInventarioRow("Inventario:", reporte.Titulo ?? "Sin título", "Creado por:", reporte.UsuarioCreador ?? "Desconocido");
                AddInfoInventarioRow("Fecha Inicio:", reporte.FechaInicio.ToString("dd/MM/yyyy HH:mm"), "Fecha Fin:", reporte.FechaFin.ToString("dd/MM/yyyy HH:mm"));
                AddInfoInventarioRow("Usuarios Participantes:", usuariosTexto ?? "Sin asignar", "Duración:", CalcularDuracion(reporte.FechaInicio, reporte.FechaFin));

                document.Add(infoInventarioTable);
                document.Add(new Paragraph(" ")); // Espacio

                // ======================
                // RESUMEN EJECUTIVO CON ALERTAS
                // ======================
                var resumenTitulo = new Paragraph("RESUMEN EJECUTIVO").SetFont(headerFont).SetFontSize(14);
                resumenTitulo.SetMarginBottom(10f);
                document.Add(resumenTitulo);

                var resumenTable = new Table(new float[] { 1f, 1f, 1f, 1f, 1f, 1f });
                resumenTable.SetWidth(UnitValue.CreatePercentValue(100));

                // Headers del resumen con colores
                void AddResumenHeader(string text, DeviceRgb color)
                {
                    var cell = new Cell();
                    cell.Add(new Paragraph(text).SetFont(boldFont).SetFontSize(9).SetFontColor(blanco));
                    cell.SetBackgroundColor(color);
                    cell.SetPadding(8f);
                    cell.SetBorder(new SolidBorder(1));
                    cell.SetTextAlignment(TextAlignment.CENTER);
                    resumenTable.AddCell(cell);
                }

                void AddResumenValue(string text, DeviceRgb? bgColor = null)
                {
                    var cell = new Cell();
                    cell.Add(new Paragraph(text).SetFont(boldFont).SetFontSize(10));
                    cell.SetBackgroundColor(bgColor ?? blanco);
                    cell.SetPadding(8f);
                    cell.SetBorder(new SolidBorder(1));
                    cell.SetTextAlignment(TextAlignment.CENTER);
                    resumenTable.AddCell(cell);
                }

                // Headers
                AddResumenHeader("Total Productos", azulEmpresa);
                AddResumenHeader("Con Discrepancia", naranjaAdvertencia);
                AddResumenHeader("% Discrepancia", naranjaAdvertencia);
                AddResumenHeader("Excesos", verdeOk);
                AddResumenHeader("Faltantes", rojoAlerta);
                AddResumenHeader("Impacto Total", azulEmpresa);

                // Valores con colores de alerta
                AddResumenValue(reporte.TotalProductosContados.ToString());
                AddResumenValue(reporte.ProductosConDiscrepancia.ToString(),
                    reporte.ProductosConDiscrepancia > 0 ? new DeviceRgb(255, 235, 238) : blanco);
                AddResumenValue($"{reporte.PorcentajeDiscrepancia}%",
                    reporte.PorcentajeDiscrepancia > 10 ? new DeviceRgb(255, 235, 238) : blanco);
                AddResumenValue(reporte.ProductosConExceso.ToString(),
                    reporte.ProductosConExceso > 0 ? new DeviceRgb(232, 245, 233) : blanco);
                AddResumenValue(reporte.ProductosConFaltante.ToString(),
                    reporte.ProductosConFaltante > 0 ? new DeviceRgb(255, 235, 238) : blanco);
                AddResumenValue($"₡{reporte.ValorTotalDiscrepancia:N0}",
                    reporte.ValorTotalDiscrepancia > 50000 ? new DeviceRgb(255, 243, 224) : blanco);

                document.Add(resumenTable);
                document.Add(new Paragraph(" ")); // Espacio

                // ======================
                // DETALLE DE PRODUCTOS CON COLORES
                // ======================
                var detalleTitulo = new Paragraph("DETALLE POR PRODUCTO (Ordenado por Medidas)").SetFont(headerFont).SetFontSize(14);
                detalleTitulo.SetMarginBottom(10f);
                document.Add(detalleTitulo);

                var productosTable = new Table(new float[] { 3f, 1f, 1f, 1f, 1.2f, 1.5f, 1f, 1.5f });
                productosTable.SetWidth(UnitValue.CreatePercentValue(100));

                // Headers de productos con colores
                string[] productHeaders = { "Producto", "Sistema", "Físico", "Diferencia", "Precio Unit.", "Impacto", "Estado", "Usuario" };
                foreach (var header in productHeaders)
                {
                    var headerCell = new Cell();
                    headerCell.Add(new Paragraph(header).SetFont(boldFont).SetFontSize(8).SetFontColor(blanco));
                    headerCell.SetBackgroundColor(azulEmpresa);
                    headerCell.SetPadding(6f);
                    headerCell.SetBorder(new SolidBorder(1));
                    headerCell.SetTextAlignment(TextAlignment.CENTER);
                    productosTable.AddCell(headerCell);
                }

                // Datos de productos (Todos los productos ordenados por medidas)
                foreach (var producto in reporte.Productos)
                {
                    // ✅ COLOR DE FONDO SEGÚN CATEGORÍA Y SEVERIDAD
                    DeviceRgb backgroundColor = blanco;
                    DeviceRgb textColor = negro;

                    if (producto.Categoria == "Faltante")
                    {
                        backgroundColor = new DeviceRgb(255, 235, 238); // Rosa claro
                        if (Math.Abs(producto.Diferencia) >= 5) backgroundColor = new DeviceRgb(255, 205, 210); // Rosa más fuerte
                    }
                    else if (producto.Categoria == "Exceso")
                    {
                        backgroundColor = new DeviceRgb(232, 245, 233); // Verde claro
                        if (producto.Diferencia >= 10) backgroundColor = new DeviceRgb(200, 230, 201); // Verde más fuerte
                    }

                    void AddProductCell(string text, bool isNumber = false, bool isCurrency = false)
                    {
                        var font = producto.Categoria != "Correcto" ? boldFont : normalFont;

                        var cell = new Cell();
                        cell.Add(new Paragraph(text).SetFont(font).SetFontSize(7).SetFontColor(textColor));
                        cell.SetBackgroundColor(backgroundColor);
                        cell.SetPadding(4f);
                        cell.SetBorder(new SolidBorder(1));
                        cell.SetTextAlignment(isNumber || isCurrency ? TextAlignment.RIGHT : TextAlignment.LEFT);
                        productosTable.AddCell(cell);
                    }

                    // Datos del producto
                    AddProductCell(producto.NombreProducto.Length > 30 ? producto.NombreProducto.Substring(0, 30) + "..." : producto.NombreProducto);
                    AddProductCell(producto.CantidadSistema.ToString(), true);
                    AddProductCell(producto.CantidadFisica.ToString(), true);
                    AddProductCell(producto.Diferencia.ToString(), true);
                    AddProductCell($"₡{producto.PrecioUnitario:N0}", true, true);
                    AddProductCell($"₡{producto.ImpactoEconomico:N0}", true, true);
                    AddProductCell(producto.Categoria);
                    AddProductCell(producto.UsuarioConteo?.Length > 12 ? producto.UsuarioConteo.Substring(0, 12) + "..." : producto.UsuarioConteo ?? "N/A");
                }

                document.Add(productosTable);

                // ======================
                // LEYENDA Y NOTAS FINALES
                // ======================
                document.Add(new Paragraph(" ")); // Espacio

                var leyendaTable = new Table(new float[] { 1f, 2f });
                leyendaTable.SetWidth(UnitValue.CreatePercentValue(60));
                leyendaTable.SetHorizontalAlignment(HorizontalAlignment.LEFT);

                var leyendaTitulo = new Cell(1, 2);
                leyendaTitulo.Add(new Paragraph("LEYENDA DE COLORES:").SetFont(boldFont).SetFontSize(9));
                leyendaTitulo.SetBackgroundColor(grisClaro);
                leyendaTitulo.SetPadding(5f);
                leyendaTitulo.SetTextAlignment(TextAlignment.CENTER);
                leyendaTable.AddCell(leyendaTitulo);

                void AddLeyendaItem(string texto, DeviceRgb color)
                {
                    var colorCell = new Cell();
                    colorCell.SetBackgroundColor(color);
                    colorCell.SetPadding(8f);
                    colorCell.SetBorder(new SolidBorder(1));
                    leyendaTable.AddCell(colorCell);

                    var textoCell = new Cell();
                    textoCell.Add(new Paragraph(texto).SetFont(normalFont).SetFontSize(9));
                    textoCell.SetPadding(8f);
                    textoCell.SetBorder(new SolidBorder(1));
                    leyendaTable.AddCell(textoCell);
                }

                AddLeyendaItem("Productos con faltantes", new DeviceRgb(255, 235, 238));
                AddLeyendaItem("Productos con excesos", new DeviceRgb(232, 245, 233));
                AddLeyendaItem("Productos correctos", blanco);

                document.Add(leyendaTable);

                // Nota final
                var nota = new Paragraph($"\n📋 Total de productos en el reporte: {reporte.Productos.Count}\n📊 Productos ordenados alfabéticamente por medidas de neumáticos.")
                    .SetFont(italicFont)
                    .SetFontSize(8)
                    .SetFontColor(gris);
                document.Add(nota);

                document.Close();
                return memoryStream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generando PDF para inventario {InventarioId}", inventarioProgramadoId);
                document.Close();
                throw;
            }
        }

        // ✅ MÉTODO AUXILIAR PARA CALCULAR DURACIÓN
        private string CalcularDuracion(DateTime inicio, DateTime fin)
        {
            var duracion = fin - inicio;
            if (duracion.TotalDays >= 1)
                return $"{duracion.Days} días, {duracion.Hours} horas";
            else if (duracion.TotalHours >= 1)
                return $"{duracion.Hours} horas, {duracion.Minutes} minutos";
            else
                return $"{duracion.Minutes} minutos";
        }

        // ✅ MÉTODO AUXILIAR PARA FORMATEAR MEDIDAS DE NEUMÁTICOS
        // Elimina decimales innecesarios (.00) pero conserva decimales significativos (.5, .50)
        private string FormatearMedida(decimal valor)
        {
            // Si el valor es un número entero (sin decimales), mostrarlo sin .00
            if (valor == Math.Floor(valor))
                return valor.ToString("0");

            // Si tiene decimales, mostrarlos (elimina ceros finales)
            return valor.ToString("0.##");
        }
    }
}