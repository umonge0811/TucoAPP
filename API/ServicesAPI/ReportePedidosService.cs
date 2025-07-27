
using API.ServicesAPI.Interfaces;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Tuco.Clases.Models;
using API.Data;
using tuco.Clases.Models;

namespace API.ServicesAPI
{
    public class ReportePedidosService : IReportePedidosService
    {
        private readonly TucoContext _context;
        private readonly ILogger<ReportePedidosService> _logger;

        // 🎨 DEFINIR PALETA DE COLORES MODERNA
        private readonly BaseColor ColorPrimario = new BaseColor(41, 128, 185);     // Azul profesional
        private readonly BaseColor ColorSecundario = new BaseColor(52, 73, 94);    // Gris azulado
        private readonly BaseColor ColorAccento = new BaseColor(231, 76, 60);      // Rojo elegante
        private readonly BaseColor ColorExito = new BaseColor(39, 174, 96);        // Verde éxito
        private readonly BaseColor ColorFondo = new BaseColor(248, 249, 250);      // Gris muy claro
        private readonly BaseColor ColorTexto = new BaseColor(44, 62, 80);         // Gris oscuro
        private readonly BaseColor ColorBorde = new BaseColor(189, 195, 199);      // Gris claro

        public ReportePedidosService(TucoContext context, ILogger<ReportePedidosService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<byte[]> GenerarPedidoPdfAsync(int pedidoId)
        {
            _logger.LogInformation("📄 Generando PDF mejorado para pedido ID: {PedidoId}", pedidoId);

            try
            {
                var pedido = await _context.PedidosProveedores
                    .Include(p => p.Proveedor)
                    .Include(p => p.DetallePedidos)
                        .ThenInclude(dp => dp.Producto)
                            .ThenInclude(prod => prod.Llanta)
                    .Include(p => p.Usuario)
                    .FirstOrDefaultAsync(p => p.PedidoId == pedidoId);

                if (pedido == null)
                {
                    throw new ArgumentException($"No se encontró el pedido con ID {pedidoId}");
                }

                using (var memoryStream = new MemoryStream())
                {
                    var document = new Document(PageSize.LETTER, 30, 30, 40, 30);
                    var writer = PdfWriter.GetInstance(document, memoryStream);
                    document.Open();

                    // 🎨 AGREGAR CONTENIDO CON NUEVO DISEÑO
                    await AgregarEncabezadoModerno(document);
                    AgregarSeparador(document);
                    AgregarTituloElegante(document, "ORDEN DE PEDIDO");
                    AgregarInformacionPedidoModerna(document, pedido);
                    AgregarSeparador(document);
                    AgregarInformacionProveedorModerna(document, pedido.Proveedor);
                    AgregarSeparador(document);
                    AgregarDetallesProductosModernos(document, pedido.DetallePedidos.ToList());
                    AgregarTotalesModernos(document, pedido);
                    AgregarPieModerno(document);

                    document.Close();
                    _logger.LogInformation("✅ PDF mejorado generado exitosamente para pedido ID: {PedidoId}", pedidoId);
                    
                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando PDF mejorado para pedido ID: {PedidoId}", pedidoId);
                throw;
            }
        }

        private async Task AgregarEncabezadoModerno(Document document)
        {
            // 🏢 ENCABEZADO CON DISEÑO MODERNO
            var headerTable = new PdfPTable(3) { WidthPercentage = 100 };
            headerTable.SetWidths(new float[] { 1.5f, 2f, 1.5f });

            // ✨ LOGO/MARCA CON ESTILO
            var logoCell = new PdfPCell();
            logoCell.Border = Rectangle.NO_BORDER;
            logoCell.Padding = 15;
            logoCell.BackgroundColor = ColorPrimario;

            var logoPhrase = new Phrase();
            logoPhrase.Add(new Chunk("GT", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 28, BaseColor.WHITE)));
            logoPhrase.Add(new Chunk("\nGESTIÓN\nLLANTERA", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 11, BaseColor.WHITE)));
            
            logoCell.AddElement(new Paragraph(logoPhrase) { Alignment = Element.ALIGN_CENTER });
            headerTable.AddCell(logoCell);

            // 🏢 INFORMACIÓN EMPRESA CENTRADA
            var empresaCell = new PdfPCell();
            empresaCell.Border = Rectangle.NO_BORDER;
            empresaCell.Padding = 15;
            empresaCell.BackgroundColor = ColorFondo;

            var empresaPhrase = new Phrase();
            empresaPhrase.Add(new Chunk("MULTISERVICIOS TUCO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, ColorSecundario)));
            empresaPhrase.Add(new Chunk("Sistema Integral de Gestión\n", FontFactory.GetFont(FontFactory.HELVETICA, 12, ColorTexto)));
            empresaPhrase.Add(new Chunk("📱 Tel: (506) 2XXX-XXXX\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTexto)));
            empresaPhrase.Add(new Chunk("✉️ info@gestionllantera.com", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTexto)));

            empresaCell.AddElement(new Paragraph(empresaPhrase) { Alignment = Element.ALIGN_CENTER });
            headerTable.AddCell(empresaCell);

            // 📅 INFORMACIÓN FECHA Y ESTADO
            var infoCell = new PdfPCell();
            infoCell.Border = Rectangle.NO_BORDER;
            infoCell.Padding = 15;
            infoCell.BackgroundColor = ColorExito;

            var infoPhrase = new Phrase();
            infoPhrase.Add(new Chunk("📄 DOCUMENTO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE)));
            infoPhrase.Add(new Chunk($"Fecha: {DateTime.Now:dd/MM/yyyy}\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.WHITE)));
            infoPhrase.Add(new Chunk($"Hora: {DateTime.Now:HH:mm}\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.WHITE)));
            infoPhrase.Add(new Chunk("Estado: ACTIVO", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));

            infoCell.AddElement(new Paragraph(infoPhrase) { Alignment = Element.ALIGN_CENTER });
            headerTable.AddCell(infoCell);

            document.Add(headerTable);
        }

        private void AgregarSeparador(Document document)
        {
            // ➖ SEPARADOR ELEGANTE
            var separador = new PdfPTable(1) { WidthPercentage = 100, SpacingBefore = 15, SpacingAfter = 15 };
            var lineCell = new PdfPCell();
            lineCell.Border = Rectangle.NO_BORDER;
            lineCell.BackgroundColor = ColorPrimario;
            lineCell.FixedHeight = 3f;
            separador.AddCell(lineCell);
            document.Add(separador);
        }

        private void AgregarTituloElegante(Document document, string titulo)
        {
            var tituloTable = new PdfPTable(1) { WidthPercentage = 80, HorizontalAlignment = Element.ALIGN_CENTER };
            
            var tituloCell = new PdfPCell();
            tituloCell.Border = Rectangle.BOX;
            tituloCell.BorderColor = ColorPrimario;
            tituloCell.BorderWidth = 2f;
            tituloCell.BackgroundColor = new BaseColor(250, 252, 255);
            tituloCell.Padding = 20;

            var tituloPhrase = new Phrase();
            tituloPhrase.Add(new Chunk("📋 ", FontFactory.GetFont(FontFactory.HELVETICA, 20, ColorPrimario)));
            tituloPhrase.Add(new Chunk(titulo, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 22, ColorSecundario)));

            tituloCell.AddElement(new Paragraph(tituloPhrase) { Alignment = Element.ALIGN_CENTER });
            tituloTable.AddCell(tituloCell);
            
            document.Add(tituloTable);
        }

        private void AgregarInformacionPedidoModerna(Document document, PedidosProveedor pedido)
        {
            var table = new PdfPTable(4) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1f, 1f, 1f, 1f });

            // 🎨 HEADERS CON GRADIENTE VISUAL
            var headers = new[] { "📋 Pedido #", "📅 Fecha", "⚡ Estado", "👤 Usuario" };
            foreach (var header in headers)
            {
                var headerCell = new PdfPCell(new Phrase(header, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 11, BaseColor.WHITE)));
                headerCell.BackgroundColor = ColorSecundario;
                headerCell.Padding = 12;
                headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                headerCell.Border = Rectangle.NO_BORDER;
                table.AddCell(headerCell);
            }

            // 📊 DATOS CON ESTILO
            var dataCells = new[]
            {
                $"#{pedido.PedidoId:D6}",
                pedido.FechaPedido?.ToString("dd/MM/yyyy") ?? "N/A",
                pedido.Estado ?? "Pendiente",
                pedido.Usuario?.NombreUsuario ?? "N/A"
            };

            var colores = new[] { ColorFondo, BaseColor.WHITE, ColorFondo, BaseColor.WHITE };

            for (int i = 0; i < dataCells.Length; i++)
            {
                var dataCell = new PdfPCell(new Phrase(dataCells[i], FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorTexto)));
                dataCell.BackgroundColor = colores[i];
                dataCell.Padding = 12;
                dataCell.HorizontalAlignment = Element.ALIGN_CENTER;
                dataCell.Border = Rectangle.BOTTOM_BORDER;
                dataCell.BorderColor = ColorBorde;
                table.AddCell(dataCell);
            }

            document.Add(table);
        }

        private void AgregarInformacionProveedorModerna(Document document, Proveedore proveedor)
        {
            // 🏢 TÍTULO PROVEEDOR
            var tituloProveedor = new Paragraph("🏢 INFORMACIÓN DEL PROVEEDOR", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 16, ColorSecundario));
            tituloProveedor.Alignment = Element.ALIGN_LEFT;
            tituloProveedor.SpacingAfter = 15;
            document.Add(tituloProveedor);

            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1f, 2f });

            var proveedorData = new[]
            {
                new[] { "🏷️ Nombre:", proveedor.NombreProveedor ?? "N/A" },
                new[] { "👤 Contacto:", proveedor.Contacto ?? "N/A" },
                new[] { "📞 Teléfono:", proveedor.Telefono ?? "N/A" },
                new[] { "✉️ Email:", proveedor.Email ?? "N/A" },
                new[] { "📍 Dirección:", proveedor.Direccion ?? "N/A" }
            };

            foreach (var row in proveedorData)
            {
                // Label con icono
                var labelCell = new PdfPCell(new Phrase(row[0], FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 11, ColorSecundario)));
                labelCell.BackgroundColor = ColorFondo;
                labelCell.Padding = 10;
                labelCell.Border = Rectangle.NO_BORDER;
                labelCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                table.AddCell(labelCell);

                // Valor
                var valueCell = new PdfPCell(new Phrase(row[1], FontFactory.GetFont(FontFactory.HELVETICA, 11, ColorTexto)));
                valueCell.BackgroundColor = BaseColor.WHITE;
                valueCell.Padding = 10;
                valueCell.Border = Rectangle.BOTTOM_BORDER;
                valueCell.BorderColor = ColorBorde;
                valueCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                table.AddCell(valueCell);
            }

            document.Add(table);
        }

        private void AgregarDetallesProductosModernos(Document document, List<DetallePedido> detalles)
        {
            // 📦 TÍTULO PRODUCTOS
            var tituloProductos = new Paragraph("📦 DETALLE DE PRODUCTOS", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 16, ColorSecundario));
            tituloProductos.Alignment = Element.ALIGN_LEFT;
            tituloProductos.SpacingBefore = 10;
            tituloProductos.SpacingAfter = 15;
            document.Add(tituloProductos);

            var table = new PdfPTable(6) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 0.8f, 1.2f, 3f, 1.2f, 1.3f, 1.3f });

            // 🎨 HEADERS MODERNOS
            var headers = new[] { "📊 Cant.", "📏 Medida", "🛞 Producto", "💰 Precio", "📈 Subtotal", "📋 Estado" };
            foreach (var header in headers)
            {
                var headerCell = new PdfPCell(new Phrase(header, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));
                headerCell.BackgroundColor = ColorPrimario;
                headerCell.Padding = 10;
                headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                headerCell.Border = Rectangle.NO_BORDER;
                table.AddCell(headerCell);
            }

            // 📊 DATOS DE PRODUCTOS CON ALTERNANCIA DE COLORES
            bool colorAlternado = false;
            foreach (var detalle in detalles)
            {
                var bgColor = colorAlternado ? ColorFondo : BaseColor.WHITE;
                colorAlternado = !colorAlternado;

                // Cantidad con círculo
                var cantCell = new PdfPCell(new Phrase($"✅ {detalle.Cantidad}", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorTexto)));
                cantCell.BackgroundColor = bgColor;
                cantCell.Padding = 8;
                cantCell.HorizontalAlignment = Element.ALIGN_CENTER;
                cantCell.Border = Rectangle.BOTTOM_BORDER;
                cantCell.BorderColor = ColorBorde;
                table.AddCell(cantCell);

                // Medida con formato elegante
                var medida = "N/A";
                if (detalle.Producto?.Llanta != null && detalle.Producto.Llanta.Any())
                {
                    var llanta = detalle.Producto.Llanta.First();
                    if (llanta.Perfil > 0)
                    {
                        medida = $"🔧 {llanta.Ancho}/{llanta.Perfil}/R{llanta.Diametro}";
                    }
                    else
                    {
                        medida = $"🔧 {llanta.Ancho}/R{llanta.Diametro}";
                    }
                }

                var medidaCell = new PdfPCell(new Phrase(medida, FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTexto)));
                medidaCell.BackgroundColor = bgColor;
                medidaCell.Padding = 8;
                medidaCell.HorizontalAlignment = Element.ALIGN_CENTER;
                medidaCell.Border = Rectangle.BOTTOM_BORDER;
                medidaCell.BorderColor = ColorBorde;
                table.AddCell(medidaCell);

                // Producto con icono
                var nombreProducto = detalle.Producto?.NombreProducto ?? "Producto no especificado";
                var productoCell = new PdfPCell(new Phrase($"🛞 {nombreProducto}", FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTexto)));
                productoCell.BackgroundColor = bgColor;
                productoCell.Padding = 8;
                productoCell.HorizontalAlignment = Element.ALIGN_LEFT;
                productoCell.Border = Rectangle.BOTTOM_BORDER;
                productoCell.BorderColor = ColorBorde;
                table.AddCell(productoCell);

                // Precio con formato moneda
                var precioUnitario = detalle.PrecioUnitario?.ToString("C", new CultureInfo("es-CR")) ?? "₡0.00";
                var precioCell = new PdfPCell(new Phrase($"💰 {precioUnitario}", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, ColorExito)));
                precioCell.BackgroundColor = bgColor;
                precioCell.Padding = 8;
                precioCell.HorizontalAlignment = Element.ALIGN_RIGHT;
                precioCell.Border = Rectangle.BOTTOM_BORDER;
                precioCell.BorderColor = ColorBorde;
                table.AddCell(precioCell);

                // Subtotal destacado
                var subtotal = (detalle.Cantidad * (detalle.PrecioUnitario ?? 0));
                var subtotalStr = subtotal.ToString("C", new CultureInfo("es-CR"));
                var subtotalCell = new PdfPCell(new Phrase($"📈 {subtotalStr}", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, ColorPrimario)));
                subtotalCell.BackgroundColor = bgColor;
                subtotalCell.Padding = 8;
                subtotalCell.HorizontalAlignment = Element.ALIGN_RIGHT;
                subtotalCell.Border = Rectangle.BOTTOM_BORDER;
                subtotalCell.BorderColor = ColorBorde;
                table.AddCell(subtotalCell);

                // Estado con icono
                var estadoCell = new PdfPCell(new Phrase("✅ Activo", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorExito)));
                estadoCell.BackgroundColor = bgColor;
                estadoCell.Padding = 8;
                estadoCell.HorizontalAlignment = Element.ALIGN_CENTER;
                estadoCell.Border = Rectangle.BOTTOM_BORDER;
                estadoCell.BorderColor = ColorBorde;
                table.AddCell(estadoCell);
            }

            document.Add(table);
        }

        private void AgregarTotalesModernos(Document document, PedidosProveedor pedido)
        {
            document.Add(new Paragraph(" "));

            // 💰 SECCIÓN TOTALES CON DISEÑO MODERNO
            var totalesTable = new PdfPTable(3) { WidthPercentage = 100 };
            totalesTable.SetWidths(new float[] { 2f, 1f, 1f });

            // Resumen de items
            var totalItems = pedido.DetallePedidos?.Sum(d => d.Cantidad) ?? 0;
            var resumenCell = new PdfPCell();
            resumenCell.Border = Rectangle.NO_BORDER;
            resumenCell.Padding = 15;
            resumenCell.BackgroundColor = ColorFondo;

            var resumenPhrase = new Phrase();
            resumenPhrase.Add(new Chunk("📊 RESUMEN DEL PEDIDO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, ColorSecundario)));
            resumenPhrase.Add(new Chunk($"Total de productos: {pedido.DetallePedidos?.Count ?? 0} items\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTexto)));
            resumenPhrase.Add(new Chunk($"Cantidad total: {totalItems} unidades\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTexto)));
            resumenPhrase.Add(new Chunk($"Estado: {pedido.Estado ?? "Pendiente"}", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorExito)));

            resumenCell.AddElement(new Paragraph(resumenPhrase));
            totalesTable.AddCell(resumenCell);

            // Espacio
            var espacioCell = new PdfPCell();
            espacioCell.Border = Rectangle.NO_BORDER;
            totalesTable.AddCell(espacioCell);

            // Total con diseño destacado
            var total = pedido.DetallePedidos?.Sum(d => d.Cantidad * (d.PrecioUnitario ?? 0)) ?? 0;
            var totalStr = total.ToString("C", new CultureInfo("es-CR"));

            var totalCell = new PdfPCell();
            totalCell.Border = Rectangle.BOX;
            totalCell.BorderColor = ColorPrimario;
            totalCell.BorderWidth = 2f;
            totalCell.BackgroundColor = new BaseColor(240, 248, 255);
            totalCell.Padding = 20;

            var totalPhrase = new Phrase();
            totalPhrase.Add(new Chunk("💰 TOTAL GENERAL\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, ColorSecundario)));
            totalPhrase.Add(new Chunk(totalStr, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20, ColorPrimario)));

            totalCell.AddElement(new Paragraph(totalPhrase) { Alignment = Element.ALIGN_CENTER });
            totalesTable.AddCell(totalCell);

            document.Add(totalesTable);
        }

        private void AgregarPieModerno(Document document)
        {
            document.Add(new Paragraph(" "));

            // 📋 PIE DE PÁGINA MODERNO
            var pieTable = new PdfPTable(2) { WidthPercentage = 100 };
            pieTable.SetWidths(new float[] { 1f, 1f });

            // Información del documento
            var infoCell = new PdfPCell();
            infoCell.Border = Rectangle.TOP_BORDER;
            infoCell.BorderColor = ColorBorde;
            infoCell.Padding = 15;

            var infoPhrase = new Phrase();
            infoPhrase.Add(new Chunk("📄 INFORMACIÓN DEL DOCUMENTO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorSecundario)));
            infoPhrase.Add(new Chunk($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTexto)));
            infoPhrase.Add(new Chunk("Sistema: Gestión Llantera v2.0\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTexto)));
            infoPhrase.Add(new Chunk("Válido por: 30 días", FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 8, ColorTexto)));

            infoCell.AddElement(new Paragraph(infoPhrase));
            pieTable.AddCell(infoCell);

            // Firmas
            var firmaCell = new PdfPCell();
            firmaCell.Border = Rectangle.TOP_BORDER;
            firmaCell.BorderColor = ColorBorde;
            firmaCell.Padding = 15;

            var firmaPhrase = new Phrase();
            firmaPhrase.Add(new Chunk("✍️ FIRMAS Y AUTORIZACIÓN\n\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorSecundario)));
            firmaPhrase.Add(new Chunk("_________________________\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTexto)));
            firmaPhrase.Add(new Chunk("Responsable de Compras\n\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTexto)));
            firmaPhrase.Add(new Chunk("_________________________\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTexto)));
            firmaPhrase.Add(new Chunk("Proveedor", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTexto)));

            firmaCell.AddElement(new Paragraph(firmaPhrase) { Alignment = Element.ALIGN_CENTER });
            pieTable.AddCell(firmaCell);

            document.Add(pieTable);

            // Nota final con estilo
            var notaFinal = new Paragraph("📌 Este documento es generado automáticamente por el Sistema de Gestión Llantera", 
                FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 8, ColorTexto));
            notaFinal.Alignment = Element.ALIGN_CENTER;
            notaFinal.SpacingBefore = 20;
            document.Add(notaFinal);
        }
    }
}
