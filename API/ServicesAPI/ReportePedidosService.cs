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
using Tuco.Clases.Models;
using API.Data;
using tuco.Clases.Models;

namespace API.ServicesAPI
{
    public class ReportePedidosService : IReportePedidosService
    {
        private readonly TucoContext _context;
        private readonly ILogger<ReportePedidosService> _logger;

        // 🎨 PALETA DE COLORES MINIMALISTA Y PROFESIONAL
        private readonly DeviceRgb ColorPrincipal = new DeviceRgb(52, 58, 64);        // Gris oscuro elegante
        private readonly DeviceRgb ColorSecundario = new DeviceRgb(108, 117, 125);    // Gris medio
        private readonly DeviceRgb ColorAcento = new DeviceRgb(33, 37, 41);           // Negro suave
        private readonly DeviceRgb ColorFondoSutil = new DeviceRgb(248, 249, 250);    // Gris muy claro
        private readonly DeviceRgb ColorLinea = new DeviceRgb(206, 212, 218);         // Gris claro para líneas
        private readonly DeviceRgb ColorTextoSuave = new DeviceRgb(73, 80, 87);       // Gris para texto secundario
        private readonly DeviceRgb Blanco = new DeviceRgb(255, 255, 255);

        public ReportePedidosService(TucoContext context, ILogger<ReportePedidosService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<byte[]> GenerarPedidoPdfAsync(int pedidoId)
        {
            _logger.LogInformation("📄 Generando PDF minimalista para pedido ID: {PedidoId}", pedidoId);

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
                    var writer = new PdfWriter(memoryStream);
                    var pdfDoc = new PdfDocument(writer);
                    var document = new iText.Layout.Document(pdfDoc, PageSize.LETTER);
                    document.SetMargins(50, 40, 40, 40);

                    var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                    var fontNormal = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

                    // 🎨 AGREGAR CONTENIDO CON DISEÑO MINIMALISTA
                    AgregarEncabezadoMinimalista(document, fontBold, fontNormal);
                    AgregarSeparadorElegante(document);
                    AgregarTituloPrincipal(document, "ORDEN DE PEDIDO", fontBold);
                    AgregarInformacionPedido(document, pedido, fontBold, fontNormal);

                    // Información básica del proveedor y total
                    document.Add(new Paragraph(" "));
                    document.Add(new Paragraph("INFORMACIÓN DEL PROVEEDOR").SetFont(fontBold).SetFontSize(14).SetFontColor(ColorPrincipal));
                    document.Add(new Paragraph($"Proveedor: {pedido.Proveedor?.NombreProveedor ?? "N/A"}").SetFont(fontNormal).SetFontSize(10));
                    document.Add(new Paragraph($"Contacto: {pedido.Proveedor?.Contacto ?? "N/A"}").SetFont(fontNormal).SetFontSize(10));
                    document.Add(new Paragraph($"Teléfono: {pedido.Proveedor?.Telefono ?? "N/A"}").SetFont(fontNormal).SetFontSize(10));

                    document.Add(new Paragraph(" "));
                    document.Add(new Paragraph("RESUMEN DEL PEDIDO").SetFont(fontBold).SetFontSize(14).SetFontColor(ColorPrincipal));
                    document.Add(new Paragraph($"Total de productos: {pedido.DetallePedidos?.Count ?? 0}").SetFont(fontNormal).SetFontSize(10));

                    var total = pedido.DetallePedidos?.Sum(d => d.Cantidad * (d.PrecioUnitario ?? 0)) ?? 0;
                    document.Add(new Paragraph($"Total: ₡{total:N2}").SetFont(fontBold).SetFontSize(16).SetFontColor(ColorPrincipal));

                    document.Close();
                    _logger.LogInformation("✅ PDF minimalista generado exitosamente para pedido ID: {PedidoId}", pedidoId);

                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando PDF minimalista para pedido ID: {PedidoId}", pedidoId);
                throw;
            }
        }

        private void AgregarEncabezadoMinimalista(iText.Layout.Document document, PdfFont fontBold, PdfFont fontNormal)
        {
            // 🏢 ENCABEZADO LIMPIO Y PROFESIONAL
            var headerTable = new Table(new float[] { 2f, 1f });
            headerTable.SetWidth(UnitValue.CreatePercentValue(100));

            // Logo/Empresa con tipografía elegante
            var empresaCell = new Cell();
            empresaCell.SetBorder(Border.NO_BORDER);
            empresaCell.SetPadding(0);
            empresaCell.SetPaddingBottom(20);

            empresaCell.Add(new Paragraph("MULTISERVICIOS TUCO").SetFont(fontBold).SetFontSize(24).SetFontColor(ColorPrincipal));
            empresaCell.Add(new Paragraph("Sistema de Gestión Integral").SetFont(fontNormal).SetFontSize(11).SetFontColor(ColorSecundario));
            empresaCell.Add(new Paragraph("Tel: (506) 2XXX-XXXX | info@gestionllantera.com").SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorTextoSuave));
            headerTable.AddCell(empresaCell);

            // Información del documento - limpia y ordenada
            var infoCell = new Cell();
            infoCell.SetBorder(Border.NO_BORDER);
            infoCell.SetPadding(0);
            infoCell.SetPaddingBottom(20);

            infoCell.Add(new Paragraph("DOCUMENTO").SetFont(fontBold).SetFontSize(10).SetFontColor(ColorSecundario).SetTextAlignment(TextAlignment.RIGHT));
            infoCell.Add(new Paragraph($"Fecha: {DateTime.Now:dd/MM/yyyy}").SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorTextoSuave).SetTextAlignment(TextAlignment.RIGHT));
            infoCell.Add(new Paragraph($"Hora: {DateTime.Now:HH:mm}").SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorTextoSuave).SetTextAlignment(TextAlignment.RIGHT));
            infoCell.Add(new Paragraph("Estado: Activo").SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorTextoSuave).SetTextAlignment(TextAlignment.RIGHT));
            headerTable.AddCell(infoCell);

            document.Add(headerTable);
        }

        private void AgregarSeparadorElegante(iText.Layout.Document document)
        {
            // Línea sutil y elegante
            var separador = new Table(1);
            separador.SetWidth(UnitValue.CreatePercentValue(100));
            separador.SetMarginTop(10);
            separador.SetMarginBottom(20);
            var lineCell = new Cell();
            lineCell.SetBorder(Border.NO_BORDER);
            lineCell.SetBackgroundColor(ColorLinea);
            lineCell.SetHeight(1f);
            separador.AddCell(lineCell);
            document.Add(separador);
        }

        private void AgregarTituloPrincipal(iText.Layout.Document document, string titulo, PdfFont fontBold)
        {
            var tituloParrafo = new Paragraph(titulo).SetFont(fontBold).SetFontSize(20).SetFontColor(ColorPrincipal);
            tituloParrafo.SetTextAlignment(TextAlignment.CENTER);
            tituloParrafo.SetMarginBottom(25);
            document.Add(tituloParrafo);
        }

        private void AgregarInformacionPedido(iText.Layout.Document document, PedidosProveedor pedido, PdfFont fontBold, PdfFont fontNormal)
        {
            // Título de sección
            var tituloSeccion = new Paragraph("Información del Pedido").SetFont(fontBold).SetFontSize(14).SetFontColor(ColorPrincipal);
            tituloSeccion.SetMarginBottom(10);
            document.Add(tituloSeccion);

            var table = new Table(new float[] { 1f, 1f, 1f, 1f });
            table.SetWidth(UnitValue.CreatePercentValue(100));

            // Headers con estilo minimalista
            var headers = new[] { "Pedido #", "Fecha", "Estado", "Usuario" };
            foreach (var header in headers)
            {
                var headerCell = new Cell();
                headerCell.Add(new Paragraph(header).SetFont(fontBold).SetFontSize(10).SetFontColor(Blanco));
                headerCell.SetBackgroundColor(ColorPrincipal);
                headerCell.SetPadding(8);
                headerCell.SetTextAlignment(TextAlignment.CENTER);
                headerCell.SetBorder(Border.NO_BORDER);
                table.AddCell(headerCell);
            }

            // Datos con alternancia sutil
            var dataCells = new[]
            {
                $"{pedido.PedidoId:D6}",
                pedido.FechaPedido?.ToString("dd/MM/yyyy") ?? "N/A",
                pedido.Estado ?? "Pendiente",
                pedido.Usuario?.NombreUsuario ?? "N/A"
            };

            foreach (var data in dataCells)
            {
                var dataCell = new Cell();
                dataCell.Add(new Paragraph(data).SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorPrincipal));
                dataCell.SetBackgroundColor(Blanco);
                dataCell.SetPadding(8);
                dataCell.SetTextAlignment(TextAlignment.CENTER);
                dataCell.SetBorderBottom(new SolidBorder(ColorLinea, 1));
                dataCell.SetBorderTop(Border.NO_BORDER);
                dataCell.SetBorderLeft(Border.NO_BORDER);
                dataCell.SetBorderRight(Border.NO_BORDER);
                table.AddCell(dataCell);
            }

            document.Add(table);
            document.Add(new Paragraph(" ").SetMarginBottom(15));
        }
    }
}
