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

        // 🎨 PALETA DE COLORES MINIMALISTA Y PROFESIONAL
        private readonly BaseColor ColorPrincipal = new BaseColor(52, 58, 64);        // Gris oscuro elegante
        private readonly BaseColor ColorSecundario = new BaseColor(108, 117, 125);    // Gris medio
        private readonly BaseColor ColorAcento = new BaseColor(33, 37, 41);           // Negro suave
        private readonly BaseColor ColorFondoSutil = new BaseColor(248, 249, 250);    // Gris muy claro
        private readonly BaseColor ColorLinea = new BaseColor(206, 212, 218);         // Gris claro para líneas
        private readonly BaseColor ColorTextoSuave = new BaseColor(73, 80, 87);       // Gris para texto secundario

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
                    var document = new Document(PageSize.LETTER, 40, 40, 50, 40);
                    var writer = PdfWriter.GetInstance(document, memoryStream);
                    document.Open();

                    // 🎨 AGREGAR CONTENIDO CON DISEÑO MINIMALISTA
                    AgregarEncabezadoMinimalista(document);
                    AgregarSeparadorElegante(document);
                    AgregarTituloPrincipal(document, "ORDEN DE PEDIDO");
                    AgregarInformacionPedido(document, pedido);
                    AgregarInformacionProveedor(document, pedido.Proveedor);
                    AgregarDetallesProductos(document, pedido.DetallePedidos.ToList());
                    AgregarResumenTotales(document, pedido);
                    AgregarPieProfesional(document);

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

        private void AgregarEncabezadoMinimalista(Document document)
        {
            // 🏢 ENCABEZADO LIMPIO Y PROFESIONAL
            var headerTable = new PdfPTable(2) { WidthPercentage = 100 };
            headerTable.SetWidths(new float[] { 2f, 1f });

            // Logo/Empresa con tipografía elegante
            var empresaCell = new PdfPCell();
            empresaCell.Border = Rectangle.NO_BORDER;
            empresaCell.Padding = 0;
            empresaCell.PaddingBottom = 20;

            var empresaPhrase = new Phrase();
            empresaPhrase.Add(new Chunk("MULTISERVICIOS TUCO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 24, ColorPrincipal)));
            empresaPhrase.Add(new Chunk("Sistema de Gestión Integral\n", FontFactory.GetFont(FontFactory.HELVETICA, 11, ColorSecundario)));
            empresaPhrase.Add(new Chunk("Tel: (506) 2XXX-XXXX | info@gestionllantera.com", FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTextoSuave)));

            empresaCell.AddElement(new Paragraph(empresaPhrase) { Alignment = Element.ALIGN_LEFT });
            headerTable.AddCell(empresaCell);

            // Información del documento - limpia y ordenada
            var infoCell = new PdfPCell();
            infoCell.Border = Rectangle.NO_BORDER;
            infoCell.Padding = 0;
            infoCell.PaddingBottom = 20;

            var infoPhrase = new Phrase();
            infoPhrase.Add(new Chunk("DOCUMENTO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorSecundario)));
            infoPhrase.Add(new Chunk($"Fecha: {DateTime.Now:dd/MM/yyyy}\n", FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTextoSuave)));
            infoPhrase.Add(new Chunk($"Hora: {DateTime.Now:HH:mm}\n", FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTextoSuave)));
            infoPhrase.Add(new Chunk("Estado: Activo", FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTextoSuave)));

            infoCell.AddElement(new Paragraph(infoPhrase) { Alignment = Element.ALIGN_RIGHT });
            headerTable.AddCell(infoCell);

            document.Add(headerTable);
        }

        private void AgregarSeparadorElegante(Document document)
        {
            // Línea sutil y elegante
            var separador = new PdfPTable(1) { WidthPercentage = 100, SpacingBefore = 10, SpacingAfter = 20 };
            var lineCell = new PdfPCell();
            lineCell.Border = Rectangle.NO_BORDER;
            lineCell.BackgroundColor = ColorLinea;
            lineCell.FixedHeight = 1f;
            separador.AddCell(lineCell);
            document.Add(separador);
        }

        private void AgregarTituloPrincipal(Document document, string titulo)
        {
            var tituloParrafo = new Paragraph(titulo, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20, ColorPrincipal));
            tituloParrafo.Alignment = Element.ALIGN_CENTER;
            tituloParrafo.SpacingAfter = 25;
            document.Add(tituloParrafo);
        }

        private void AgregarInformacionPedido(Document document, PedidosProveedor pedido)
        {
            // Título de sección
            var tituloSeccion = new Paragraph("Información del Pedido", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, ColorPrincipal));
            tituloSeccion.SpacingAfter = 10;
            document.Add(tituloSeccion);

            var table = new PdfPTable(4) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1f, 1f, 1f, 1f });

            // Headers con estilo minimalista
            var headers = new[] { "Pedido #", "Fecha", "Estado", "Usuario" };
            foreach (var header in headers)
            {
                var headerCell = new PdfPCell(new Phrase(header, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));
                headerCell.BackgroundColor = ColorPrincipal;
                headerCell.Padding = 8;
                headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                headerCell.Border = Rectangle.NO_BORDER;
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
                var dataCell = new PdfPCell(new Phrase(data, FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorPrincipal)));
                dataCell.BackgroundColor = BaseColor.WHITE;
                dataCell.Padding = 8;
                dataCell.HorizontalAlignment = Element.ALIGN_CENTER;
                dataCell.Border = Rectangle.BOTTOM_BORDER;
                dataCell.BorderColor = ColorLinea;
                table.AddCell(dataCell);
            }

            document.Add(table);
            document.Add(new Paragraph(" ") { SpacingAfter = 15 });
        }

        private void AgregarInformacionProveedor(Document document, Proveedore proveedor)
        {
            // Título de sección
            var tituloSeccion = new Paragraph("Información del Proveedor", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, ColorPrincipal));
            tituloSeccion.SpacingAfter = 10;
            document.Add(tituloSeccion);

            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 1f, 2f });

            var proveedorData = new[]
            {
                new[] { "Nombre:", proveedor?.NombreProveedor ?? "N/A" },
                new[] { "Contacto:", proveedor?.Contacto ?? "N/A" },
                new[] { "Teléfono:", proveedor?.Telefono ?? "N/A" },
                new[] { "Email:", proveedor?.Email ?? "N/A" },
                new[] { "Dirección:", proveedor?.Direccion ?? "N/A" }
            };

            foreach (var row in proveedorData)
            {
                // Etiqueta
                var labelCell = new PdfPCell(new Phrase(row[0], FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorSecundario)));
                labelCell.BackgroundColor = ColorFondoSutil;
                labelCell.Padding = 8;
                labelCell.Border = Rectangle.NO_BORDER;
                labelCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                table.AddCell(labelCell);

                // Valor
                var valueCell = new PdfPCell(new Phrase(row[1], FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorPrincipal)));
                valueCell.BackgroundColor = BaseColor.WHITE;
                valueCell.Padding = 8;
                valueCell.Border = Rectangle.BOTTOM_BORDER;
                valueCell.BorderColor = ColorLinea;
                valueCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                table.AddCell(valueCell);
            }

            document.Add(table);
            document.Add(new Paragraph(" ") { SpacingAfter = 15 });
        }

        private void AgregarDetallesProductos(Document document, List<DetallePedido> detalles)
        {
            // Título de sección
            var tituloSeccion = new Paragraph("Detalle de Productos", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, ColorPrincipal));
            tituloSeccion.SpacingAfter = 10;
            document.Add(tituloSeccion);

            var table = new PdfPTable(5) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 0.8f, 2.5f, 2f, 1.2f, 1.5f });

            // Headers elegantes
            var headers = new[] { "Cant.", "Producto", "Especificaciones", "Precio Unit.", "Subtotal" };
            foreach (var header in headers)
            {
                var headerCell = new PdfPCell(new Phrase(header, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));
                headerCell.BackgroundColor = ColorPrincipal;
                headerCell.Padding = 10;
                headerCell.HorizontalAlignment = Element.ALIGN_CENTER;
                headerCell.Border = Rectangle.NO_BORDER;
                table.AddCell(headerCell);
            }

            // Datos con estilo limpio
            bool filaAlterna = false;
            foreach (var detalle in detalles)
            {
                var bgColor = filaAlterna ? ColorFondoSutil : BaseColor.WHITE;
                filaAlterna = !filaAlterna;

                // Cantidad
                var cantCell = new PdfPCell(new Phrase(detalle.Cantidad.ToString(), FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorPrincipal)));
                cantCell.BackgroundColor = bgColor;
                cantCell.Padding = 8;
                cantCell.HorizontalAlignment = Element.ALIGN_CENTER;
                cantCell.Border = Rectangle.BOTTOM_BORDER;
                cantCell.BorderColor = ColorLinea;
                table.AddCell(cantCell);

                // Producto
                var nombreProducto = detalle.Producto?.NombreProducto ?? "Producto no especificado";
                var productoCell = new PdfPCell(new Phrase(nombreProducto, FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorPrincipal)));
                productoCell.BackgroundColor = bgColor;
                productoCell.Padding = 8;
                productoCell.HorizontalAlignment = Element.ALIGN_LEFT;
                productoCell.Border = Rectangle.BOTTOM_BORDER;
                productoCell.BorderColor = ColorLinea;
                table.AddCell(productoCell);

                // Especificaciones (medida de llanta)
                var especificaciones = "N/A";
                if (detalle.Producto?.Llanta != null && detalle.Producto.Llanta.Any())
                {
                    var llanta = detalle.Producto.Llanta.First();
                    if (llanta.Perfil > 0)
                    {
                        especificaciones = $"{llanta.Ancho}/{llanta.Perfil}/R{llanta.Diametro}";
                    }
                    else
                    {
                        especificaciones = $"{llanta.Ancho}/R{llanta.Diametro}";
                    }
                }

                var especCell = new PdfPCell(new Phrase(especificaciones, FontFactory.GetFont(FontFactory.HELVETICA, 9, ColorTextoSuave)));
                especCell.BackgroundColor = bgColor;
                especCell.Padding = 8;
                especCell.HorizontalAlignment = Element.ALIGN_CENTER;
                especCell.Border = Rectangle.BOTTOM_BORDER;
                especCell.BorderColor = ColorLinea;
                table.AddCell(especCell);

                // Precio unitario
                var precioUnitario = (detalle.PrecioUnitario ?? 0).ToString("C", new CultureInfo("es-CR"));
                var precioCell = new PdfPCell(new Phrase(precioUnitario, FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorPrincipal)));
                precioCell.BackgroundColor = bgColor;
                precioCell.Padding = 8;
                precioCell.HorizontalAlignment = Element.ALIGN_RIGHT;
                precioCell.Border = Rectangle.BOTTOM_BORDER;
                precioCell.BorderColor = ColorLinea;
                table.AddCell(precioCell);

                // Subtotal
                var subtotal = (detalle.Cantidad * (detalle.PrecioUnitario ?? 0));
                var subtotalStr = subtotal.ToString("C", new CultureInfo("es-CR"));
                var subtotalCell = new PdfPCell(new Phrase(subtotalStr, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, ColorPrincipal)));
                subtotalCell.BackgroundColor = bgColor;
                subtotalCell.Padding = 8;
                subtotalCell.HorizontalAlignment = Element.ALIGN_RIGHT;
                subtotalCell.Border = Rectangle.BOTTOM_BORDER;
                subtotalCell.BorderColor = ColorLinea;
                table.AddCell(subtotalCell);
            }

            document.Add(table);
            document.Add(new Paragraph(" ") { SpacingAfter = 15 });
        }

        private void AgregarResumenTotales(Document document, PedidosProveedor pedido)
        {
            // Línea separadora antes del total
            var separador = new PdfPTable(1) { WidthPercentage = 100, SpacingBefore = 10 };
            var lineCell = new PdfPCell();
            lineCell.Border = Rectangle.NO_BORDER;
            lineCell.BackgroundColor = ColorLinea;
            lineCell.FixedHeight = 1f;
            separador.AddCell(lineCell);
            document.Add(separador);

            // Resumen con diseño elegante
            var resumenTable = new PdfPTable(2) { WidthPercentage = 100 };
            resumenTable.SetWidths(new float[] { 2f, 1f });

            // Información de resumen
            var totalItems = pedido.DetallePedidos?.Sum(d => d.Cantidad) ?? 0;
            var totalProductos = pedido.DetallePedidos?.Count ?? 0;

            var resumenCell = new PdfPCell();
            resumenCell.Border = Rectangle.NO_BORDER;
            resumenCell.Padding = 15;

            var resumenPhrase = new Phrase();
            resumenPhrase.Add(new Chunk("RESUMEN DEL PEDIDO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, ColorPrincipal)));
            resumenPhrase.Add(new Chunk($"Productos diferentes: {totalProductos}\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTextoSuave)));
            resumenPhrase.Add(new Chunk($"Cantidad total: {totalItems} unidades\n", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTextoSuave)));
            resumenPhrase.Add(new Chunk($"Estado: {pedido.Estado ?? "Pendiente"}", FontFactory.GetFont(FontFactory.HELVETICA, 10, ColorTextoSuave)));

            resumenCell.AddElement(new Paragraph(resumenPhrase));
            resumenTable.AddCell(resumenCell);

            // Total con énfasis elegante
            var total = pedido.DetallePedidos?.Sum(d => d.Cantidad * (d.PrecioUnitario ?? 0)) ?? 0;
            var totalStr = total.ToString("C", new CultureInfo("es-CR"));

            var totalCell = new PdfPCell();
            totalCell.Border = Rectangle.BOX;
            totalCell.BorderColor = ColorPrincipal;
            totalCell.BorderWidth = 1f;
            totalCell.BackgroundColor = BaseColor.WHITE;
            totalCell.Padding = 15;

            var totalPhrase = new Phrase();
            totalPhrase.Add(new Chunk("TOTAL GENERAL\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 11, ColorSecundario)));
            totalPhrase.Add(new Chunk(totalStr, FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, ColorPrincipal)));

            totalCell.AddElement(new Paragraph(totalPhrase) { Alignment = Element.ALIGN_CENTER });
            resumenTable.AddCell(totalCell);

            document.Add(resumenTable);
        }

        private void AgregarPieProfesional(Document document)
        {
            document.Add(new Paragraph(" ") { SpacingBefore = 20 });

            // Línea separadora
            var separador = new PdfPTable(1) { WidthPercentage = 100 };
            var lineCell = new PdfPCell();
            lineCell.Border = Rectangle.NO_BORDER;
            lineCell.BackgroundColor = ColorLinea;
            lineCell.FixedHeight = 1f;
            separador.AddCell(lineCell);
            document.Add(separador);

            // Pie de página elegante
            var pieTable = new PdfPTable(2) { WidthPercentage = 100 };
            pieTable.SetWidths(new float[] { 1f, 1f });

            // Información del documento
            var infoCell = new PdfPCell();
            infoCell.Border = Rectangle.NO_BORDER;
            infoCell.Padding = 15;

            var infoPhrase = new Phrase();
            infoPhrase.Add(new Chunk("INFORMACIÓN DEL DOCUMENTO\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, ColorSecundario)));
            infoPhrase.Add(new Chunk($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTextoSuave)));
            infoPhrase.Add(new Chunk("Sistema: Gestión Llantera v2.0\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTextoSuave)));
            infoPhrase.Add(new Chunk("Válido por: 30 días", FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 8, ColorTextoSuave)));

            infoCell.AddElement(new Paragraph(infoPhrase));
            pieTable.AddCell(infoCell);

            // Firmas minimalistas
            var firmaCell = new PdfPCell();
            firmaCell.Border = Rectangle.NO_BORDER;
            firmaCell.Padding = 15;

            var firmaPhrase = new Phrase();
            firmaPhrase.Add(new Chunk("AUTORIZACIÓN\n\n", FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, ColorSecundario)));
            firmaPhrase.Add(new Chunk("_____________________________\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTextoSuave)));
            firmaPhrase.Add(new Chunk("Responsable de Compras\n\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTextoSuave)));
            firmaPhrase.Add(new Chunk("_____________________________\n", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTextoSuave)));
            firmaPhrase.Add(new Chunk("Proveedor", FontFactory.GetFont(FontFactory.HELVETICA, 8, ColorTextoSuave)));

            firmaCell.AddElement(new Paragraph(firmaPhrase) { Alignment = Element.ALIGN_CENTER });
            pieTable.AddCell(firmaCell);

            document.Add(pieTable);

            // Nota final discreta
            var notaFinal = new Paragraph("Documento generado automáticamente por el Sistema de Gestión Llantera", 
                FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 7, ColorTextoSuave));
            notaFinal.Alignment = Element.ALIGN_CENTER;
            notaFinal.SpacingBefore = 15;
            document.Add(notaFinal);
        }

        private async Task AgregarEncabezadoModerno(Document document)
        {
            // Método legacy - mantener para compatibilidad
            AgregarEncabezadoMinimalista(document);
        }

        private string GenerarHtmlPedido(PedidosProveedor pedido)
        {
            var productos = pedido.DetallePedidos?.ToList() ?? new List<DetallePedido>();
            var total = productos.Sum(p => (p.PrecioUnitario ?? 0) * p.Cantidad);

            var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            color: #343a40;
            line-height: 1.5;
        }}

        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #dee2e6;
        }}

        .header {{
            background-color: #ffffff;
            border-bottom: 1px solid #dee2e6;
            padding: 30px;
            text-align: center;
        }}

        .header h1 {{
            margin: 0;
            font-size: 1.8em;
            font-weight: 400;
            color: #343a40;
            letter-spacing: 1px;
        }}

        .content {{
            padding: 30px;
        }}

        .info-section {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}

        .info-card {{
            background: #ffffff;
            padding: 20px;
            border: 1px solid #dee2e6;
        }}

        .info-card h3 {{
            margin: 0 0 15px 0;
            color: #343a40;
            font-size: 1em;
            font-weight: 600;
        }}

        .info-item {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }}

        .info-label {{
            font-weight: 500;
            color: #6c757d;
        }}

        .info-value {{
            font-weight: 400;
            color: #343a40;
        }}

        .products-table {{
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dee2e6;
        }}

        .products-table th {{
            background-color: #343a40;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 500;
            font-size: 0.9em;
        }}

        .products-table td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }}

        .products-table tbody tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}

        .text-right {{
            text-align: right;
        }}

        .text-center {{
            text-align: center;
        }}

        .font-weight-bold {{
            font-weight: 600;
        }}

        .total-section {{
            margin-top: 30px;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
        }}

        .total-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }}

        .total-label {{
            font-size: 1.1em;
            font-weight: 500;
            color: #343a40;
        }}

        .total-amount {{
            font-size: 1.5em;
            font-weight: 600;
            color: #343a40;
            border: 1px solid #dee2e6;
            padding: 8px 15px;
        }}

        .footer {{
            background-color: #f8f9fa;
            padding: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
        }}

        .footer p {{
            margin: 0;
            color: #6c757d;
            font-size: 0.85em;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Orden de Pedido</h1>
            <div>Pedido N° {pedido.PedidoId:D6}</div>
        </div>

        <div class='content'>
            <div class='info-section'>
                <div class='info-card'>
                    <h3>Información del Pedido</h3>
                    <div class='info-item'>
                        <span class='info-label'>Número de Pedido</span>
                        <span class='info-value'>#{pedido.PedidoId:D6}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Fecha del Pedido</span>
                        <span class='info-value'>{pedido.FechaPedido:dd/MM/yyyy}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Estado</span>
                        <span class='info-value'>{pedido.Estado}</span>
                    </div>
                </div>

                <div class='info-card'>
                    <h3>Información del Proveedor</h3>
                    <div class='info-item'>
                        <span class='info-label'>Nombre</span>
                        <span class='info-value'>{pedido.Proveedor?.NombreProveedor ?? "No especificado"}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Teléfono</span>
                        <span class='info-value'>{pedido.Proveedor?.Telefono ?? "No especificado"}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Email</span>
                        <span class='info-value'>{pedido.Proveedor?.Email ?? "No especificado"}</span>
                    </div>
                </div>
            </div>

            <table class='products-table'>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class='text-center'>Cantidad</th>
                        <th class='text-right'>Precio Unit.</th>
                        <th class='text-right'>Subtotal</th>
                    </tr>
                </thead>
                <tbody>";

            foreach (var producto in productos)
            {
                var subtotal = (producto.PrecioUnitario ?? 0) * producto.Cantidad;
                html += $@"
                        <tr>
                            <td>{producto.Producto?.NombreProducto ?? "Producto no especificado"}</td>
                            <td class='text-center'>{producto.Cantidad}</td>
                            <td class='text-right'>L. {producto.PrecioUnitario ?? 0:N2}</td>
                            <td class='text-right font-weight-bold'>L. {subtotal:N2}</td>
                        </tr>";
            }

            html += $@"
                </tbody>
            </table>

            <div class='total-section'>
                <div class='total-row'>
                    <span class='total-label'>Total del Pedido</span>
                    <span class='total-amount'>L. {total:N2}</span>
                </div>
            </div>
        </div>

        <div class='footer'>
            <p>Documento generado automáticamente el {DateTime.Now:dd/MM/yyyy HH:mm}</p>
        </div>
    </div>
</body>
</html>";

            return html;
        }
    }
}