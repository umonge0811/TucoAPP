using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Data;
using tuco.Clases.Models;
using API.Extensions;

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
                            .ThenInclude(p => p.Llanta)
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
                        Proveedor = new
                        {
                            pp.Proveedor.ProveedorId,
                            pp.Proveedor.NombreProveedor,
                            pp.Proveedor.Contacto,
                            pp.Proveedor.Telefono,
                            pp.Proveedor.Direccion
                        },
                        DetallePedidos = pp.DetallePedidos.Select(dp => new
                        {
                            dp.DetalleId,
                            dp.ProductoId,
                            ProductoNombre = dp.Producto.NombreProducto,
                            dp.Cantidad,
                            dp.PrecioUnitario,
                            // Información de llanta si existe
                            Llanta = dp.Producto.Llanta != null ? new
                            {
                                dp.Producto.Llanta.Ancho,
                                dp.Producto.Llanta.Perfil,
                                dp.Producto.Llanta.Diametro,
                                dp.Producto.Llanta.Marca,
                                dp.Producto.Llanta.Modelo
                            } : null
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
        public async Task<IActionResult> ActualizarEstadoPedido(int id, [FromBody] ActualizarEstadoRequest estadoRequest)
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

    public class ActualizarEstadoRequest
    {
        public string estado { get; set; } = string.Empty;
    }
}