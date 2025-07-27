
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

        public ReportePedidosService(TucoContext context, ILogger<ReportePedidosService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<byte[]> GenerarPedidoPdfAsync(int pedidoId)
        {
            _logger.LogInformation("📄 Generando PDF para pedido ID: {PedidoId}", pedidoId);

            try
            {
                // Obtener datos del pedido con todos los includes necesarios
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
                    // Crear documento PDF
                    var document = new Document(PageSize.LETTER, 36, 36, 54, 36);
                    var writer = PdfWriter.GetInstance(document, memoryStream);
                    document.Open();

                    // Agregar contenido al PDF
                    await AgregarEncabezadoEmpresa(document);
                    AgregarTitulo(document, "PEDIDO A PROVEEDOR");
                    AgregarInformacionPedido(document, pedido);
                    AgregarInformacionProveedor(document, pedido.Proveedor);
                    AgregarDetallesProductos(document, pedido.DetallePedidos.ToList());
                    AgregarTotales(document, pedido);
                    AgregarPiePagina(document);

                    document.Close();
                    _logger.LogInformation("✅ PDF generado exitosamente para pedido ID: {PedidoId}", pedidoId);
                    
                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando PDF para pedido ID: {PedidoId}", pedidoId);
                throw;
            }
        }

        private async Task AgregarEncabezadoEmpresa(Document document)
        {
            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1, 2 });

            // Logo/Espacio para logo (puedes agregar logo después)
            var cellLogo = new PdfPCell(new Phrase("LOGO", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 16)))
            {
                HorizontalAlignment = Element.ALIGN_CENTER,
                VerticalAlignment = Element.ALIGN_MIDDLE,
                MinimumHeight = 60,
                Border = Rectangle.BOX
            };
            table.AddCell(cellLogo);

            // Información de la empresa
            var empresaInfo = new Phrase();
            empresaInfo.Add(new Chunk("GESTIÓN LLANTERA\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18)));
            empresaInfo.Add(new Chunk("Sistema de Gestión de Inventario\n", FontFactory.GetFont(FontFactory.HELVETICA, 12)));
            empresaInfo.Add(new Chunk("Tel: (506) 2XXX-XXXX\n", FontFactory.GetFont(FontFactory.HELVETICA, 10)));
            empresaInfo.Add(new Chunk("Email: info@gestionllantera.com", FontFactory.GetFont(FontFactory.HELVETICA, 10)));

            var cellEmpresa = new PdfPCell(empresaInfo)
            {
                HorizontalAlignment = Element.ALIGN_LEFT,
                VerticalAlignment = Element.ALIGN_MIDDLE,
                Border = Rectangle.BOX,
                Padding = 10
            };
            table.AddCell(cellEmpresa);

            document.Add(table);
            document.Add(new Paragraph(" "));
        }

        private void AgregarTitulo(Document document, string titulo)
        {
            var tituloFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20, BaseColor.DARK_GRAY);
            var tituloParagraph = new Paragraph(titulo, tituloFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 20
            };
            document.Add(tituloParagraph);
        }

        private void AgregarInformacionPedido(Document document, PedidosProveedor pedido)
        {
            var table = new PdfPTable(4) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1, 1, 1, 1 });

            // Headers
            var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
            var headerColor = new BaseColor(52, 73, 94);

            var headers = new[] { "Pedido #", "Fecha", "Estado", "Usuario" };
            foreach (var header in headers)
            {
                var cell = new PdfPCell(new Phrase(header, headerFont))
                {
                    BackgroundColor = headerColor,
                    HorizontalAlignment = Element.ALIGN_CENTER,
                    Padding = 8
                };
                table.AddCell(cell);
            }

            // Datos
            var dataFont = FontFactory.GetFont(FontFactory.HELVETICA, 10);
            var dataCells = new[]
            {
                pedido.PedidoId.ToString(),
                pedido.FechaPedido?.ToString("dd/MM/yyyy") ?? "N/A",
                pedido.Estado ?? "Pendiente",
                pedido.Usuario?.NombreUsuario ?? "N/A"
            };

            foreach (var data in dataCells)
            {
                var cell = new PdfPCell(new Phrase(data, dataFont))
                {
                    HorizontalAlignment = Element.ALIGN_CENTER,
                    Padding = 8
                };
                table.AddCell(cell);
            }

            document.Add(table);
            document.Add(new Paragraph(" "));
        }

        private void AgregarInformacionProveedor(Document document, Proveedore proveedor)
        {
            var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14);
            var title = new Paragraph("INFORMACIÓN DEL PROVEEDOR", titleFont)
            {
                SpacingBefore = 10,
                SpacingAfter = 10
            };
            document.Add(title);

            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1, 2 });

            var labelFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10);
            var dataFont = FontFactory.GetFont(FontFactory.HELVETICA, 10);

            var proveedorData = new[]
            {
                new[] { "Nombre:", proveedor.NombreProveedor ?? "N/A" },
                new[] { "Contacto:", proveedor.Contacto ?? "N/A" },
                new[] { "Teléfono:", proveedor.Telefono ?? "N/A" },
                new[] { "Email:", proveedor.Email ?? "N/A" },
                new[] { "Dirección:", proveedor.Direccion ?? "N/A" }
            };

            foreach (var row in proveedorData)
            {
                table.AddCell(new PdfPCell(new Phrase(row[0], labelFont)) { Border = Rectangle.NO_BORDER, Padding = 5 });
                table.AddCell(new PdfPCell(new Phrase(row[1], dataFont)) { Border = Rectangle.NO_BORDER, Padding = 5 });
            }

            document.Add(table);
            document.Add(new Paragraph(" "));
        }

        private void AgregarDetallesProductos(Document document, List<DetallePedido> detalles)
        {
            var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14);
            var title = new Paragraph("DETALLES DEL PEDIDO", titleFont)
            {
                SpacingBefore = 10,
                SpacingAfter = 10
            };
            document.Add(title);

            var table = new PdfPTable(5) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1, 1.5f, 2.5f, 1.5f, 1.5f });

            // Headers
            var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
            var headerColor = new BaseColor(52, 73, 94);

            var headers = new[] { "Cantidad", "Medida", "Producto", "Precio Unit.", "Subtotal" };
            foreach (var header in headers)
            {
                var cell = new PdfPCell(new Phrase(header, headerFont))
                {
                    BackgroundColor = headerColor,
                    HorizontalAlignment = Element.ALIGN_CENTER,
                    Padding = 8
                };
                table.AddCell(cell);
            }

            // Datos
            var dataFont = FontFactory.GetFont(FontFactory.HELVETICA, 9);
            foreach (var detalle in detalles)
            {
                // Cantidad
                table.AddCell(new PdfPCell(new Phrase(detalle.Cantidad.ToString(), dataFont))
                {
                    HorizontalAlignment = Element.ALIGN_CENTER,
                    Padding = 6
                });

                // Medida (para llantas)
                var medida = "N/A";
                if (detalle.Producto?.Llanta != null && detalle.Producto.Llanta.Any())
                {
                    var llanta = detalle.Producto.Llanta.First();
                    if (llanta.Perfil > 0)
                    {
                        medida = $"{llanta.Ancho}/{llanta.Perfil}/R{llanta.Diametro}";
                    }
                    else
                    {
                        medida = $"{llanta.Ancho}/R{llanta.Diametro}";
                    }
                }

                table.AddCell(new PdfPCell(new Phrase(medida, dataFont))
                {
                    HorizontalAlignment = Element.ALIGN_CENTER,
                    Padding = 6
                });

                // Producto
                table.AddCell(new PdfPCell(new Phrase(detalle.Producto?.NombreProducto?? "N/A", dataFont))
                {
                    HorizontalAlignment = Element.ALIGN_LEFT,
                    Padding = 6
                });

                // Precio unitario
                var precioUnitario = detalle.PrecioUnitario?.ToString("C", new CultureInfo("es-CR")) ?? "₡0.00";
                table.AddCell(new PdfPCell(new Phrase(precioUnitario, dataFont))
                {
                    HorizontalAlignment = Element.ALIGN_RIGHT,
                    Padding = 6
                });

                // Subtotal
                var subtotal = (detalle.Cantidad * (detalle.PrecioUnitario ?? 0));
                var subtotalStr = subtotal.ToString("C", new CultureInfo("es-CR"));
                table.AddCell(new PdfPCell(new Phrase(subtotalStr, dataFont))
                {
                    HorizontalAlignment = Element.ALIGN_RIGHT,
                    Padding = 6
                });
            }

            document.Add(table);
        }

        private void AgregarTotales(Document document, PedidosProveedor pedido)
        {
            var table = new PdfPTable(2) { WidthPercentage = 50, HorizontalAlignment = Element.ALIGN_RIGHT };
            table.SetWidths(new float[] { 1, 1 });

            var labelFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12);
            var totalFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLUE);

            // Calcular total
            var total = pedido.DetallePedidos?.Sum(d => d.Cantidad * (d.PrecioUnitario ?? 0)) ?? 0;
            var totalStr = total.ToString("C", new CultureInfo("es-CR"));

            table.AddCell(new PdfPCell(new Phrase("TOTAL:", labelFont))
            {
                Border = Rectangle.TOP_BORDER,
                HorizontalAlignment = Element.ALIGN_RIGHT,
                Padding = 10
            });

            table.AddCell(new PdfPCell(new Phrase(totalStr, totalFont))
            {
                Border = Rectangle.TOP_BORDER,
                HorizontalAlignment = Element.ALIGN_RIGHT,
                Padding = 10
            });

            document.Add(new Paragraph(" "));
            document.Add(table);
        }

        private void AgregarPiePagina(Document document)
        {
            document.Add(new Paragraph(" "));
            
            var pieFont = FontFactory.GetFont(FontFactory.HELVETICA, 8, BaseColor.GRAY);
            var pie = new Paragraph($"Documento generado el {DateTime.Now:dd/MM/yyyy HH:mm}", pieFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingBefore = 20
            };
            document.Add(pie);

            var firma = new Paragraph("_________________________\nFirma del Responsable", pieFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingBefore = 30
            };
            document.Add(firma);
        }
    }
}
