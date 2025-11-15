using API.Data;
using API.ServicesAPI.Interfaces;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using OfficeOpenXml.Style;
using System.Drawing;
using System.Drawing;
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
                        var partes = new List<string>();
                        if (llanta.Ancho.HasValue && llanta.Perfil.HasValue)
                            partes.Add($"{llanta.Ancho}/{llanta.Perfil}");
                        if (!string.IsNullOrEmpty(llanta.Diametro))
                            partes.Add(llanta.Diametro);
                        medidas = partes.Any() ? string.Join(" ", partes) : null;
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
                    Productos = productos.OrderByDescending(p => Math.Abs(p.ImpactoEconomico)).ToList(),
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
            worksheet.Cells["A1"].Style.Fill.BackgroundColor.SetColor(Color.DarkBlue);
            worksheet.Cells["A1"].Style.Font.Color.SetColor(Color.White);

            worksheet.Cells[2, 1, 2, totalColumnas].Merge = true;
            worksheet.Cells["A2"].Value = "Sistema de Gestión de Inventarios";
            worksheet.Cells["A2"].Style.Font.Size = 12;
            worksheet.Cells["A2"].Style.Font.Italic = true;
            worksheet.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells["A2"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells["A2"].Style.Fill.BackgroundColor.SetColor(Color.LightBlue);

            // ======================
            // TÍTULO DEL REPORTE
            // ======================
            worksheet.Cells[4, 1, 4, totalColumnas].Merge = true;
            worksheet.Cells["A4"].Value = "REPORTE DE INVENTARIO";
            worksheet.Cells["A4"].Style.Font.Size = 16;
            worksheet.Cells["A4"].Style.Font.Bold = true;
            worksheet.Cells["A4"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            worksheet.Cells["A4"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells["A4"].Style.Fill.BackgroundColor.SetColor(Color.LightGray);

            // ======================
            // INFORMACIÓN GENERAL
            // ======================
            int row = 6;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(Color.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Inventario:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.Titulo;

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(Color.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Fecha Inicio:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.FechaInicio.ToString("dd/MM/yyyy HH:mm");

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(Color.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Fecha Fin:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.FechaFin.ToString("dd/MM/yyyy HH:mm");

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(Color.WhiteSmoke);
            worksheet.Cells[$"A{row}"].Value = "Creado por:";
            worksheet.Cells[$"A{row}"].Style.Font.Bold = true;
            worksheet.Cells[$"B{row}"].Value = reporte.UsuarioCreador;

            row++;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[$"A{row}:B{row}"].Style.Fill.BackgroundColor.SetColor(Color.WhiteSmoke);
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
            worksheet.Cells[$"A{row}"].Style.Fill.BackgroundColor.SetColor(Color.Orange);
            worksheet.Cells[$"A{row}"].Style.Font.Color.SetColor(Color.White);

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
                        cell.Style.Fill.BackgroundColor.SetColor(Color.LightYellow);
                    }
                    else // Valores
                    {
                        cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                        cell.Style.Fill.BackgroundColor.SetColor(Color.White);
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
            worksheet.Cells[$"A{row}"].Style.Fill.BackgroundColor.SetColor(Color.Green);
            worksheet.Cells[$"A{row}"].Style.Font.Color.SetColor(Color.White);

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
                headerCell.Style.Fill.BackgroundColor.SetColor(Color.DarkGray);
                headerCell.Style.Font.Color.SetColor(Color.White);
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
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.BackgroundColor.SetColor(Color.MistyRose);
                }
                else if (producto.Categoria == "Exceso")
                {
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.BackgroundColor.SetColor(Color.LightGreen);
                }
                else
                {
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[row, 1, row, totalColumnas].Style.Fill.BackgroundColor.SetColor(Color.White);
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
            var document = new Document(PageSize.A4.Rotate(), 25, 25, 30, 30);
            var writer = PdfWriter.GetInstance(document, memoryStream);

            document.Open();

            try
            {
                // ======================
                // DEFINIR COLORES Y FUENTES
                // ======================
                var azulEmpresa = new BaseColor(25, 118, 210);  // Azul corporativo
                var grisClaro = new BaseColor(245, 245, 245);
                var rojoAlerta = new BaseColor(244, 67, 54);    // Rojo para faltantes
                var verdeOk = new BaseColor(76, 175, 80);       // Verde para excesos
                var naranjaAdvertencia = new BaseColor(255, 152, 0); // Naranja para alertas

                var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20, azulEmpresa);
                var subtitleFont = FontFactory.GetFont(FontFactory.HELVETICA, 12, BaseColor.GRAY);
                var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLACK);
                var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);
                var boldFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.BLACK);
                var smallFont = FontFactory.GetFont(FontFactory.HELVETICA, 8, BaseColor.BLACK);

                // ======================
                // ENCABEZADO DE EMPRESA
                // ======================
                var headerTable = new PdfPTable(3);
                headerTable.WidthPercentage = 100;
                headerTable.SetWidths(new float[] { 1f, 2f, 1f });

                // Logo placeholder
                var logoCell = new PdfPCell(new Phrase("LOGO\nTUCO", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE)));
                logoCell.BackgroundColor = azulEmpresa;
                logoCell.Padding = 10f;
                logoCell.HorizontalAlignment = Element.ALIGN_CENTER;
                logoCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                logoCell.Border = iTextSharp.text.Rectangle.BOX;
                headerTable.AddCell(logoCell);

                // Información de empresa
                var empresaInfo = new PdfPCell();
                empresaInfo.Border = iTextSharp.text.Rectangle.BOX;
                empresaInfo.Padding = 10f;
                empresaInfo.AddElement(new Paragraph("MULTISERVICIOS TUCO", titleFont));
                empresaInfo.AddElement(new Paragraph("Sistema de Gestión de Inventarios", subtitleFont));
                empresaInfo.AddElement(new Paragraph($"Reporte generado: {DateTime.Now:dd/MM/yyyy HH:mm}", smallFont));
                headerTable.AddCell(empresaInfo);

                // Información del reporte
                var reporteInfo = new PdfPCell();
                reporteInfo.Border = iTextSharp.text.Rectangle.BOX;
                reporteInfo.Padding = 10f;
                reporteInfo.BackgroundColor = grisClaro;
                reporteInfo.AddElement(new Paragraph("REPORTE DE INVENTARIO", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12)));
                reporteInfo.AddElement(new Paragraph($"ID: {reporte.InventarioProgramadoId}", normalFont));
                reporteInfo.AddElement(new Paragraph($"Estado: COMPLETADO", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, verdeOk)));
                headerTable.AddCell(reporteInfo);

                document.Add(headerTable);
                document.Add(new Paragraph(" ")); // Espacio

                // ======================
                // INFORMACIÓN DETALLADA DEL INVENTARIO
                // ======================
                var infoInventarioTable = new PdfPTable(4);
                infoInventarioTable.WidthPercentage = 100;
                infoInventarioTable.SetWidths(new float[] { 1f, 1f, 1f, 1f });

                void AddInfoInventarioRow(string label1, string value1, string label2, string value2)
                {
                    // Columna 1 - Label
                    var labelCell1 = new PdfPCell(new Phrase(label1, boldFont));
                    labelCell1.BackgroundColor = grisClaro;
                    labelCell1.Padding = 6f;
                    labelCell1.Border = iTextSharp.text.Rectangle.BOX;
                    infoInventarioTable.AddCell(labelCell1);

                    // Columna 2 - Value
                    var valueCell1 = new PdfPCell(new Phrase(value1, normalFont));
                    valueCell1.Padding = 6f;
                    valueCell1.Border = iTextSharp.text.Rectangle.BOX;
                    infoInventarioTable.AddCell(valueCell1);

                    // Columna 3 - Label
                    var labelCell2 = new PdfPCell(new Phrase(label2, boldFont));
                    labelCell2.BackgroundColor = grisClaro;
                    labelCell2.Padding = 6f;
                    labelCell2.Border = iTextSharp.text.Rectangle.BOX;
                    infoInventarioTable.AddCell(labelCell2);

                    // Columna 4 - Value
                    var valueCell2 = new PdfPCell(new Phrase(value2, normalFont));
                    valueCell2.Padding = 6f;
                    valueCell2.Border = iTextSharp.text.Rectangle.BOX;
                    infoInventarioTable.AddCell(valueCell2);
                }

                // ✅ OBTENER USUARIOS QUE PARTICIPARON EN EL INVENTARIO
                var usuariosParticipantes = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioProgramadoId && d.UsuarioConteoId != null)
                    .Include(d => d.UsuarioConteo)
                    .Select(d => d.UsuarioConteo.NombreUsuario)
                    .Distinct()
                    .ToListAsync();

                var usuariosTexto = usuariosParticipantes.Any() ? string.Join(", ", usuariosParticipantes) : "Sin asignar";

                AddInfoInventarioRow("Inventario:", reporte.Titulo, "Creado por:", reporte.UsuarioCreador);
                AddInfoInventarioRow("Fecha Inicio:", reporte.FechaInicio.ToString("dd/MM/yyyy HH:mm"), "Fecha Fin:", reporte.FechaFin.ToString("dd/MM/yyyy HH:mm"));
                AddInfoInventarioRow("Usuarios Participantes:", usuariosTexto, "Duración:", CalcularDuracion(reporte.FechaInicio, reporte.FechaFin));

                document.Add(infoInventarioTable);
                document.Add(new Paragraph(" ")); // Espacio

                // ======================
                // RESUMEN EJECUTIVO CON ALERTAS
                // ======================
                var resumenTitulo = new Paragraph("RESUMEN EJECUTIVO", headerFont);
                resumenTitulo.SpacingAfter = 10f;
                document.Add(resumenTitulo);

                var resumenTable = new PdfPTable(6);
                resumenTable.WidthPercentage = 100;
                resumenTable.SetWidths(new float[] { 1f, 1f, 1f, 1f, 1f, 1f });

                // Headers del resumen con colores
                void AddResumenHeader(string text, BaseColor color)
                {
                    var cell = new PdfPCell(new Phrase(text, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE)));
                    cell.BackgroundColor = color;
                    cell.Padding = 8f;
                    cell.Border = iTextSharp.text.Rectangle.BOX;
                    cell.HorizontalAlignment = Element.ALIGN_CENTER;
                    resumenTable.AddCell(cell);
                }

                void AddResumenValue(string text, BaseColor? bgColor = null)
                {
                    var cell = new PdfPCell(new Phrase(text, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10)));
                    cell.BackgroundColor = bgColor ?? BaseColor.WHITE;
                    cell.Padding = 8f;
                    cell.Border = iTextSharp.text.Rectangle.BOX;
                    cell.HorizontalAlignment = Element.ALIGN_CENTER;
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
                    reporte.ProductosConDiscrepancia > 0 ? new BaseColor(255, 235, 238) : BaseColor.WHITE);
                AddResumenValue($"{reporte.PorcentajeDiscrepancia}%",
                    reporte.PorcentajeDiscrepancia > 10 ? new BaseColor(255, 235, 238) : BaseColor.WHITE);
                AddResumenValue(reporte.ProductosConExceso.ToString(),
                    reporte.ProductosConExceso > 0 ? new BaseColor(232, 245, 233) : BaseColor.WHITE);
                AddResumenValue(reporte.ProductosConFaltante.ToString(),
                    reporte.ProductosConFaltante > 0 ? new BaseColor(255, 235, 238) : BaseColor.WHITE);
                AddResumenValue($"₡{reporte.ValorTotalDiscrepancia:N0}",
                    reporte.ValorTotalDiscrepancia > 50000 ? new BaseColor(255, 243, 224) : BaseColor.WHITE);

                document.Add(resumenTable);
                document.Add(new Paragraph(" ")); // Espacio

                // ======================
                // DETALLE DE PRODUCTOS CON COLORES
                // ======================
                var detalleTitulo = new Paragraph("DETALLE POR PRODUCTO (Top 25 por Impacto)", headerFont);
                detalleTitulo.SpacingAfter = 10f;
                document.Add(detalleTitulo);

                var productosTable = new PdfPTable(8);
                productosTable.WidthPercentage = 100;
                productosTable.SetWidths(new float[] { 3f, 1f, 1f, 1f, 1.2f, 1.5f, 1f, 1.5f });

                // Headers de productos con colores
                string[] productHeaders = { "Producto", "Sistema", "Físico", "Diferencia", "Precio Unit.", "Impacto", "Estado", "Usuario" };
                foreach (var header in productHeaders)
                {
                    var headerCell = new PdfPCell(new Phrase(header, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 8, BaseColor.WHITE)));
                    headerCell.BackgroundColor = azulEmpresa;
                    headerCell.Padding = 6f;
                    headerCell.Border = iTextSharp.text.Rectangle.BOX;
                    headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    productosTable.AddCell(headerCell);
                }

                // Datos de productos (Top 25)
                var productosParaPdf = reporte.Productos.Take(25).ToList();

                foreach (var producto in productosParaPdf)
                {
                    // ✅ COLOR DE FONDO SEGÚN CATEGORÍA Y SEVERIDAD
                    BaseColor backgroundColor = BaseColor.WHITE;
                    BaseColor textColor = BaseColor.BLACK;

                    if (producto.Categoria == "Faltante")
                    {
                        backgroundColor = new BaseColor(255, 235, 238); // Rosa claro
                        if (Math.Abs(producto.Diferencia) >= 5) backgroundColor = new BaseColor(255, 205, 210); // Rosa más fuerte
                    }
                    else if (producto.Categoria == "Exceso")
                    {
                        backgroundColor = new BaseColor(232, 245, 233); // Verde claro
                        if (producto.Diferencia >= 10) backgroundColor = new BaseColor(200, 230, 201); // Verde más fuerte
                    }

                    void AddProductCell(string text, bool isNumber = false, bool isCurrency = false)
                    {
                        var font = FontFactory.GetFont(FontFactory.HELVETICA, 7, textColor);
                        if (producto.Categoria != "Correcto") font = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 7, textColor);

                        var cell = new PdfPCell(new Phrase(text, font));
                        cell.BackgroundColor = backgroundColor;
                        cell.Padding = 4f;
                        cell.Border = iTextSharp.text.Rectangle.BOX;
                        cell.HorizontalAlignment = isNumber || isCurrency ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT;
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

                var leyendaTable = new PdfPTable(3);
                leyendaTable.WidthPercentage = 60;
                leyendaTable.HorizontalAlignment = Element.ALIGN_LEFT;

                var leyendaTitulo = new PdfPCell(new Phrase("LEYENDA DE COLORES:", boldFont));
                leyendaTitulo.Colspan = 3;
                leyendaTitulo.BackgroundColor = grisClaro;
                leyendaTitulo.Padding = 5f;
                leyendaTitulo.HorizontalAlignment = Element.ALIGN_CENTER;
                leyendaTable.AddCell(leyendaTitulo);

                void AddLeyendaItem(string texto, BaseColor color)
                {
                    var colorCell = new PdfPCell();
                    colorCell.BackgroundColor = color;
                    colorCell.Padding = 8f;
                    colorCell.Border = iTextSharp.text.Rectangle.BOX;
                    leyendaTable.AddCell(colorCell);

                    var textoCell = new PdfPCell(new Phrase(texto, normalFont));
                    textoCell.Padding = 8f;
                    textoCell.Border = iTextSharp.text.Rectangle.BOX;
                    textoCell.Colspan = 2;
                    leyendaTable.AddCell(textoCell);
                }

                AddLeyendaItem("Productos con faltantes", new BaseColor(255, 235, 238));
                AddLeyendaItem("Productos con excesos", new BaseColor(232, 245, 233));
                AddLeyendaItem("Productos correctos", BaseColor.WHITE);

                document.Add(leyendaTable);

                // Nota final
                if (reporte.Productos.Count > 25)
                {
                    var nota = new Paragraph($"\n📋 Nota: Se muestran los 25 productos con mayor impacto económico de {reporte.Productos.Count} total.\n📊 Para ver el reporte completo, descargue la versión en Excel.",
                        FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 8, BaseColor.GRAY));
                    document.Add(nota);
                }

                document.Close();
                return memoryStream.ToArray();
            }
            catch (Exception)
            {
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
    }
}