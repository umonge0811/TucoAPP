using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Data;
using tuco.Clases.Models;
using API.Extensions;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PedidosProveedorController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<PedidosProveedorController> _logger;

        public PedidosProveedorController(TucoContext context, ILogger<PedidosProveedorController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPedidosProveedor(int? proveedorId = null)
        {
            try
            {
                _logger.LogInformation("📦 Obteniendo pedidos de proveedores - ProveedorId: {ProveedorId}", 
                    proveedorId?.ToString() ?? "TODOS");

                var query = _context.PedidosProveedores
                    .Include(pp => pp.Proveedor)
                    .Include(pp => pp.Usuario)
                    .Include(pp => pp.DetallePedidos)
                        .ThenInclude(dp => dp.Producto)
                    .AsQueryable();

                if (proveedorId.HasValue)
                {
                    _logger.LogInformation("📦 Filtrando por proveedor ID: {ProveedorId}", proveedorId.Value);
                    query = query.Where(pp => pp.ProveedorId == proveedorId);
                }

                var pedidos = await query
                    .OrderByDescending(pp => pp.FechaPedido)
                    .Select(pp => new
                    {
                        pedidoId = pp.PedidoId,
                        proveedorId = pp.ProveedorId,
                        proveedorNombre = pp.Proveedor.NombreProveedor ?? "Sin nombre",
                        fechaPedido = pp.FechaPedido,
                        estado = pp.Estado ?? "Pendiente",
                        usuarioId = pp.UsuarioId,
                        usuarioNombre = pp.Usuario.NombreUsuario ?? "Sin usuario",
                        totalProductos = pp.DetallePedidos.Count(),
                        montoTotal = pp.DetallePedidos.Sum(dp => dp.Cantidad * (dp.PrecioUnitario ?? 0)),
                        detallePedidos = pp.DetallePedidos.Select(dp => new
                        {
                            detalleId = dp.DetalleId,
                            productoId = dp.ProductoId,
                            productoNombre = dp.Producto.NombreProducto ?? "Sin nombre",
                            cantidad = dp.Cantidad,
                            precioUnitario = dp.PrecioUnitario ?? 0,
                            subtotal = dp.Cantidad * (dp.PrecioUnitario ?? 0)
                        }).ToList()
                    })
                    .ToListAsync();

                _logger.LogInformation("📦 ✅ {Count} pedidos encontrados", pedidos.Count);

                if (pedidos.Count == 0)
                {
                    _logger.LogInformation("📦 No se encontraron pedidos");
                }
                else
                {
                    // Log de algunos pedidos para debug
                    foreach (var pedido in pedidos.Take(3))
                    {
                        _logger.LogInformation("📦 Pedido: ID={PedidoId}, Proveedor={Proveedor}, Productos={Productos}, Monto=${Monto}", 
                            pedido.pedidoId, pedido.proveedorNombre, pedido.totalProductos, pedido.montoTotal);
                    }
                }

                return Ok(pedidos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pedidos");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetPedidoProveedor(int id)
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo pedido {Id}", id);

                var pedido = await _context.PedidosProveedores
                    .Include(pp => pp.Proveedor)
                    .Include(pp => pp.Usuario)
                    .Include(pp => pp.DetallePedidos)
                        .ThenInclude(dp => dp.Producto)
                    .Where(pp => pp.PedidoId == id)
                    .Select(pp => new
                    {
                        pp.PedidoId,
                        pp.ProveedorId,
                        Proveedor = new
                        {
                            pp.Proveedor.ProveedorId,
                            pp.Proveedor.NombreProveedor,
                            pp.Proveedor.Contacto,
                            pp.Proveedor.Telefono,
                            pp.Proveedor.Direccion
                        },
                        pp.FechaPedido,
                        pp.Estado,
                        pp.UsuarioId,
                        Usuario = new
                        {
                            pp.Usuario.UsuarioId,
                            pp.Usuario.NombreUsuario
                        },
                        DetallePedidos = pp.DetallePedidos.Select(dp => new
                        {
                            dp.DetalleId,
                            dp.ProductoId,
                            Producto = new
                            {
                                dp.Producto.ProductoId,
                                dp.Producto.NombreProducto,
                                dp.Producto.Descripcion,
                                dp.Producto.CantidadEnInventario
                            },
                            dp.Cantidad,
                            dp.PrecioUnitario,
                            Subtotal = dp.Cantidad * (dp.PrecioUnitario ?? 0)
                        }).ToList(),
                        TotalProductos = pp.DetallePedidos.Count(),
                        MontoTotal = pp.DetallePedidos.Sum(dp => dp.Cantidad * (dp.PrecioUnitario ?? 0))
                    })
                    .FirstOrDefaultAsync();

                if (pedido == null)
                {
                    return NotFound(new { message = "Pedido no encontrado" });
                }

                return Ok(pedido);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pedido {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<object>> PostPedidoProveedor([FromBody] CrearPedidoProveedorRequest pedidoRequest)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("📦 Creando nuevo pedido a proveedor");

                // Obtener información del usuario desde los claims
                var usuarioId = this.ObtenerUsuarioIdDelToken();
                if (!usuarioId.HasValue)
                {
                    return BadRequest(new { message = "No se pudo identificar al usuario" });
                }

                // Validar que los datos requeridos estén presentes
                if (pedidoRequest == null)
                {
                    return BadRequest(new { message = "Los datos del pedido son requeridos" });
                }

                if (pedidoRequest.ProveedorId <= 0)
                {
                    return BadRequest(new { message = "El ID del proveedor es requerido y debe ser válido" });
                }

                if (pedidoRequest.Productos == null || !pedidoRequest.Productos.Any())
                {
                    return BadRequest(new { message = "Los productos son requeridos" });
                }

                int proveedorId = pedidoRequest.ProveedorId;
                var productosSeleccionados = pedidoRequest.Productos;

                // Verificar que el proveedor existe
                var proveedor = await _context.Proveedores.FindAsync(proveedorId);
                if (proveedor == null)
                {
                    return BadRequest(new { message = "Proveedor no encontrado" });
                }

                // Crear el pedido
                var nuevoPedido = new PedidosProveedor
                {
                    ProveedorId = proveedorId,
                    FechaPedido = DateTime.Now,
                    Estado = "Pendiente",
                    UsuarioId = usuarioId.Value
                };

                _context.PedidosProveedores.Add(nuevoPedido);
                await _context.SaveChangesAsync();

                // Agregar detalles del pedido
                foreach (var producto in productosSeleccionados)
                {
                    // Validar datos del producto
                    if (producto.ProductoId <= 0)
                    {
                        _logger.LogWarning("⚠️ ProductoId inválido: {ProductoId}", producto.ProductoId);
                        continue;
                    }

                    if (producto.Cantidad <= 0)
                    {
                        _logger.LogWarning("⚠️ Cantidad inválida: {Cantidad}", producto.Cantidad);
                        continue;
                    }

                    int productoId = producto.ProductoId;
                    int cantidad = producto.Cantidad;
                    decimal? precioUnitario = producto.PrecioUnitario;

                    var detalle = new DetallePedido
                    {
                        PedidoId = nuevoPedido.PedidoId,
                        ProductoId = productoId,
                        Cantidad = cantidad,
                        PrecioUnitario = precioUnitario
                    };

                    _context.DetallePedidos.Add(detalle);
                    _logger.LogInformation("📦 Detalle agregado: ProductoId={ProductoId}, Cantidad={Cantidad}, Precio={Precio}", 
                        productoId, cantidad, precioUnitario);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Pedido creado exitosamente: {PedidoId}", nuevoPedido.PedidoId);

                // Cargar el pedido completo para retornar
                var pedidoCompleto = await _context.PedidosProveedores
                    .Include(pp => pp.Proveedor)
                    .Include(pp => pp.Usuario)
                    .Include(pp => pp.DetallePedidos)
                        .ThenInclude(dp => dp.Producto)
                    .Where(pp => pp.PedidoId == nuevoPedido.PedidoId)
                    .Select(pp => new
                    {
                        pp.PedidoId,
                        pp.ProveedorId,
                        ProveedorNombre = pp.Proveedor.NombreProveedor,
                        pp.FechaPedido,
                        pp.Estado,
                        pp.UsuarioId,
                        UsuarioNombre = pp.Usuario.NombreUsuario,
                        DetallePedidos = pp.DetallePedidos.Select(dp => new
                        {
                            dp.DetalleId,
                            dp.ProductoId,
                            ProductoNombre = dp.Producto.NombreProducto,
                            dp.Cantidad,
                            dp.PrecioUnitario
                        }).ToList(),
                        TotalProductos = pp.DetallePedidos.Count(),
                        MontoTotal = pp.DetallePedidos.Sum(dp => dp.Cantidad * (dp.PrecioUnitario ?? 0))
                    })
                    .FirstOrDefaultAsync();

                return Ok(new
                {
                    success = true,
                    message = "Pedido creado exitosamente",
                    data = pedidoCompleto
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ Error creando pedido a proveedor");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> ActualizarEstadoPedido(int id, [FromBody] dynamic estadoRequest)
        {
            try
            {
                _logger.LogInformation("📝 Actualizando estado del pedido {Id}", id);

                var pedido = await _context.PedidosProveedores.FindAsync(id);
                if (pedido == null)
                {
                    return NotFound(new { message = "Pedido no encontrado" });
                }

                string nuevoEstado = estadoRequest.estado;
                pedido.Estado = nuevoEstado;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Estado del pedido actualizado: {Id} -> {Estado}", id, nuevoEstado);

                return Ok(new { message = "Estado del pedido actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando estado del pedido {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GenerarPdfPedido(int id)
        {
            try
            {
                _logger.LogInformation("📄 Generando PDF para pedido {Id}", id);

                var pedido = await _context.PedidosProveedores
                    .Include(pp => pp.Proveedor)
                    .Include(pp => pp.Usuario)
                    .Include(pp => pp.DetallePedidos)
                        .ThenInclude(dp => dp.Producto)
                            .ThenInclude(p => p.Llanta)
                    .FirstOrDefaultAsync(pp => pp.PedidoId == id);

                if (pedido == null)
                {
                    return NotFound(new { message = "Pedido no encontrado" });
                }

                var pdfBytes = GenerarPdfPedidoBytes(pedido);
                var fileName = $"Pedido_Proveedor_{id}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando PDF del pedido {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePedidoProveedor(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("🗑️ Eliminando pedido {Id}", id);

                var pedido = await _context.PedidosProveedores
                    .Include(pp => pp.DetallePedidos)
                    .FirstOrDefaultAsync(pp => pp.PedidoId == id);

                if (pedido == null)
                {
                    return NotFound(new { message = "Pedido no encontrado" });
                }

                // Eliminar detalles primero
                _context.DetallePedidos.RemoveRange(pedido.DetallePedidos);

                // Eliminar pedido
                _context.PedidosProveedores.Remove(pedido);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Pedido eliminado exitosamente: {Id}", id);

                return Ok(new { message = "Pedido eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ Error eliminando pedido {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Genera el PDF del pedido como array de bytes
        /// </summary>
        private byte[] GenerarPdfPedidoBytes(PedidosProveedor pedido)
        {
            using var memoryStream = new MemoryStream();
            var document = new iTextSharp.text.Document(iTextSharp.text.PageSize.A4, 40, 40, 60, 40);
            var writer = iTextSharp.text.pdf.PdfWriter.GetInstance(document, memoryStream);

            // Fuentes
            var titleFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 16, iTextSharp.text.BaseColor.BLACK);
            var headerFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 12, iTextSharp.text.BaseColor.BLACK);
            var normalFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA, 10, iTextSharp.text.BaseColor.BLACK);
            var boldFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 10, iTextSharp.text.BaseColor.BLACK);
            var smallFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA, 8, iTextSharp.text.BaseColor.GRAY);

            // Colores
            var azulEmpresa = new iTextSharp.text.BaseColor(63, 127, 191);
            var grisClaro = new iTextSharp.text.BaseColor(245, 245, 245);

            document.Open();

            // ENCABEZADO DE LA EMPRESA
            var headerTable = new iTextSharp.text.pdf.PdfPTable(3);
            headerTable.WidthPercentage = 100;
            headerTable.SetWidths(new float[] { 1f, 2f, 1f });

            // Logo placeholder
            var logoCell = new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("TUCO\nLLANTERIA", iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 12, iTextSharp.text.BaseColor.WHITE)));
            logoCell.BackgroundColor = azulEmpresa;
            logoCell.Padding = 10f;
            logoCell.HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER;
            logoCell.VerticalAlignment = iTextSharp.text.Element.ALIGN_MIDDLE;
            logoCell.Border = iTextSharp.text.Rectangle.BOX;
            headerTable.AddCell(logoCell);

            // Información de empresa
            var empresaInfo = new iTextSharp.text.pdf.PdfPCell();
            empresaInfo.Border = iTextSharp.text.Rectangle.BOX;
            empresaInfo.Padding = 10f;
            empresaInfo.AddElement(new iTextSharp.text.Paragraph("MULTISERVICIOS TUCO", titleFont));
            empresaInfo.AddElement(new iTextSharp.text.Paragraph("Sistema de Gestión de Inventarios", normalFont));
            empresaInfo.AddElement(new iTextSharp.text.Paragraph("Teléfono: +506 1234-5678", smallFont));
            empresaInfo.AddElement(new iTextSharp.text.Paragraph("Email: info@tucollanteria.com", smallFont));
            headerTable.AddCell(empresaInfo);

            // Información del documento
            var docInfo = new iTextSharp.text.pdf.PdfPCell();
            docInfo.Border = iTextSharp.text.Rectangle.BOX;
            docInfo.Padding = 10f;
            docInfo.BackgroundColor = grisClaro;
            docInfo.AddElement(new iTextSharp.text.Paragraph("ORDEN DE COMPRA", headerFont));
            docInfo.AddElement(new iTextSharp.text.Paragraph($"No. {pedido.PedidoId:000000}", boldFont));
            docInfo.AddElement(new iTextSharp.text.Paragraph($"Fecha: {pedido.FechaPedido:dd/MM/yyyy}", normalFont));
            docInfo.AddElement(new iTextSharp.text.Paragraph($"Estado: {pedido.Estado}", normalFont));
            headerTable.AddCell(docInfo);

            document.Add(headerTable);
            document.Add(new iTextSharp.text.Paragraph("\n"));

            // INFORMACIÓN DEL PROVEEDOR Y USUARIO
            var infoTable = new iTextSharp.text.pdf.PdfPTable(2);
            infoTable.WidthPercentage = 100;
            infoTable.SetWidths(new float[] { 1f, 1f });

            // Información del proveedor
            var proveedorCell = new iTextSharp.text.pdf.PdfPCell();
            proveedorCell.Border = iTextSharp.text.Rectangle.BOX;
            proveedorCell.Padding = 10f;
            proveedorCell.AddElement(new iTextSharp.text.Paragraph("INFORMACIÓN DEL PROVEEDOR", headerFont));
            proveedorCell.AddElement(new iTextSharp.text.Paragraph($"Nombre: {pedido.Proveedor?.NombreProveedor ?? "N/A"}", normalFont));
            proveedorCell.AddElement(new iTextSharp.text.Paragraph($"Contacto: {pedido.Proveedor?.Contacto ?? "N/A"}", normalFont));
            proveedorCell.AddElement(new iTextSharp.text.Paragraph($"Teléfono: {pedido.Proveedor?.Telefono ?? "N/A"}", normalFont));
            proveedorCell.AddElement(new iTextSharp.text.Paragraph($"Dirección: {pedido.Proveedor?.Direccion ?? "N/A"}", normalFont));
            infoTable.AddCell(proveedorCell);

            // Información del usuario
            var usuarioCell = new iTextSharp.text.pdf.PdfPCell();
            usuarioCell.Border = iTextSharp.text.Rectangle.BOX;
            usuarioCell.Padding = 10f;
            usuarioCell.AddElement(new iTextSharp.text.Paragraph("INFORMACIÓN DEL PEDIDO", headerFont));
            usuarioCell.AddElement(new iTextSharp.text.Paragraph($"Solicitado por: {pedido.Usuario?.NombreUsuario ?? "N/A"}", normalFont));
            usuarioCell.AddElement(new iTextSharp.text.Paragraph($"Fecha de solicitud: {pedido.FechaPedido:dd/MM/yyyy HH:mm}", normalFont));
            usuarioCell.AddElement(new iTextSharp.text.Paragraph($"Estado actual: {pedido.Estado}", normalFont));
            infoTable.AddCell(usuarioCell);

            document.Add(infoTable);
            document.Add(new iTextSharp.text.Paragraph("\n"));

            // TABLA DE PRODUCTOS
            document.Add(new iTextSharp.text.Paragraph("DETALLE DE PRODUCTOS SOLICITADOS", headerFont));
            document.Add(new iTextSharp.text.Paragraph("\n"));

            var productTable = new iTextSharp.text.pdf.PdfPTable(5);
            productTable.WidthPercentage = 100;
            productTable.SetWidths(new float[] { 1f, 1.5f, 3f, 1.5f, 1.5f });

            // Headers
            string[] headers = { "Cant.", "Medida", "Producto", "Precio Unit.", "Subtotal" };
            foreach (var header in headers)
            {
                var headerCell = new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(header, iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 9, iTextSharp.text.BaseColor.WHITE)));
                headerCell.BackgroundColor = azulEmpresa;
                headerCell.Padding = 8f;
                headerCell.HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER;
                productTable.AddCell(headerCell);
            }

            // Datos de productos
            decimal total = 0;
            foreach (var detalle in pedido.DetallePedidos)
            {
                var subtotal = detalle.Cantidad * (detalle.PrecioUnitario ?? 0);
                total += subtotal;

                // Obtener medida de llanta si aplica
                string medida = "N/A";
                if (detalle.Producto?.Llanta != null)
                {
                    var llanta = detalle.Producto.Llanta;
                    if (llanta.Perfil.HasValue && llanta.Perfil > 0)
                    {
                        medida = $"{llanta.Ancho}/{llanta.Perfil}/R{llanta.Diametro}";
                    }
                    else
                    {
                        medida = $"{llanta.Ancho}/R{llanta.Diametro}";
                    }
                }

                productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(detalle.Cantidad.ToString(), normalFont)) { HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER, Padding = 6f });
                productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(medida, normalFont)) { HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER, Padding = 6f });
                productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(detalle.Producto?.NombreProducto ?? "N/A", normalFont)) { Padding = 6f });
                productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase($"₡{detalle.PrecioUnitario:N2}", normalFont)) { HorizontalAlignment = iTextSharp.text.Element.ALIGN_RIGHT, Padding = 6f });
                productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase($"₡{subtotal:N2}", boldFont)) { HorizontalAlignment = iTextSharp.text.Element.ALIGN_RIGHT, Padding = 6f });
            }

            // Fila de total
            productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("", normalFont)) { Border = iTextSharp.text.Rectangle.NO_BORDER });
            productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("", normalFont)) { Border = iTextSharp.text.Rectangle.NO_BORDER });
            productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("", normalFont)) { Border = iTextSharp.text.Rectangle.NO_BORDER });
            productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("TOTAL:", boldFont)) { HorizontalAlignment = iTextSharp.text.Element.ALIGN_RIGHT, Padding = 6f, BackgroundColor = grisClaro });
            productTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase($"₡{total:N2}", titleFont)) { HorizontalAlignment = iTextSharp.text.Element.ALIGN_RIGHT, Padding = 6f, BackgroundColor = grisClaro });

            document.Add(productTable);

            // PIE DE PÁGINA
            document.Add(new iTextSharp.text.Paragraph("\n\n"));
            document.Add(new iTextSharp.text.Paragraph("OBSERVACIONES:", headerFont));
            document.Add(new iTextSharp.text.Paragraph("_" + new string('_', 80), normalFont));
            document.Add(new iTextSharp.text.Paragraph("_" + new string('_', 80), normalFont));
            document.Add(new iTextSharp.text.Paragraph("\n"));

            var firmasTable = new iTextSharp.text.pdf.PdfPTable(2);
            firmasTable.WidthPercentage = 100;
            firmasTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("AUTORIZADO POR:\n\n\n_____________________\nFirma y Sello", normalFont)) { Border = iTextSharp.text.Rectangle.NO_BORDER, HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER });
            firmasTable.AddCell(new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase("RECIBIDO POR:\n\n\n_____________________\nFirma del Proveedor", normalFont)) { Border = iTextSharp.text.Rectangle.NO_BORDER, HorizontalAlignment = iTextSharp.text.Element.ALIGN_CENTER });

            document.Add(firmasTable);

            document.Close();
            return memoryStream.ToArray();
        }

        /// <summary>
        /// Obtiene el ID del usuario desde el token JWT
        /// </summary>
        private int? ObtenerUsuarioIdDelToken()
        {
            try
            {
                // Intentar obtener el ID directamente del claim
                var userIdClaim = User.FindFirst("UserId")?.Value ?? User.FindFirst("userid")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation("Usuario ID obtenido del claim UserId: {UserId}", userId);
                    return userId;
                }

                // Intentar con el claim "sub" (subject)
                var subClaim = User.FindFirst("sub")?.Value;
                if (!string.IsNullOrEmpty(subClaim) && int.TryParse(subClaim, out int subId))
                {
                    _logger.LogInformation("Usuario ID obtenido del claim sub: {UserId}", subId);
                    return subId;
                }

                // Como último recurso, buscar por email
                var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(emailClaim))
                {
                    _logger.LogInformation("Buscando usuario por email: {Email}", emailClaim);
                    var usuario = _context.Usuarios.FirstOrDefault(u => u.Email == emailClaim);
                    if (usuario != null)
                    {
                        _logger.LogInformation("Usuario encontrado por email. ID: {UserId}", usuario.UsuarioId);
                        return usuario.UsuarioId;
                    }
                }

                _logger.LogWarning("No se pudo obtener el ID del usuario de ningún claim");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ID del usuario del token");
                return null;
            }
        }
    }
    public class ProductoPedidoRequest
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
    }

    public class CrearPedidoProveedorRequest
    {
        public int ProveedorId { get; set; }
        public List<ProductoPedidoRequest> Productos { get; set; } = new List<ProductoPedidoRequest>();
    }
}