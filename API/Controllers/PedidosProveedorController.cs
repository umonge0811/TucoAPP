
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
                _logger.LogInformation("📦 Obteniendo pedidos de proveedores");

                var query = _context.PedidosProveedores
                    .Include(pp => pp.Proveedor)
                    .Include(pp => pp.Usuario)
                    .Include(pp => pp.DetallePedidos)
                        .ThenInclude(dp => dp.Producto)
                    .AsQueryable();

                if (proveedorId.HasValue)
                {
                    query = query.Where(pp => pp.ProveedorId == proveedorId);
                }

                var pedidos = await query
                    .OrderByDescending(pp => pp.FechaPedido)
                    .Select(pp => new
                    {
                        pp.PedidoId,
                        pp.ProveedorId,
                        ProveedorNombre = pp.Proveedor.NombreProveedor,
                        pp.FechaPedido,
                        pp.Estado,
                        pp.UsuarioId,
                        UsuarioNombre = pp.Usuario.NombreUsuario,
                        TotalProductos = pp.DetallePedidos.Count(),
                        MontoTotal = pp.DetallePedidos.Sum(dp => dp.Cantidad * (dp.PrecioUnitario ?? 0)),
                        DetallePedidos = pp.DetallePedidos.Select(dp => new
                        {
                            dp.DetalleId,
                            dp.ProductoId,
                            ProductoNombre = dp.Producto.NombreProducto,
                            dp.Cantidad,
                            dp.PrecioUnitario,
                            Subtotal = dp.Cantidad * (dp.PrecioUnitario ?? 0)
                        }).ToList()
                    })
                    .ToListAsync();

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
                                dp.Producto.Marca,
                                dp.Producto.Modelo,
                                dp.Producto.Stock
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
        public async Task<ActionResult<object>> PostPedidoProveedor([FromBody] dynamic pedidoRequest)
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

                // Deserializar datos del pedido
                string jsonString = pedidoRequest.ToString();
                var datos = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(jsonString);

                int proveedorId = datos.proveedorId;
                var productosSeleccionados = datos.productos;

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
                    var detalle = new DetallePedido
                    {
                        PedidoId = nuevoPedido.PedidoId,
                        ProductoId = (int)producto.productoId,
                        Cantidad = (int)producto.cantidad,
                        PrecioUnitario = producto.precioUnitario != null ? (decimal)producto.precioUnitario : null
                    };

                    _context.DetallePedidos.Add(detalle);
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
                    .FirstOrDefaultAsync();

                return CreatedAtAction("GetPedidoProveedor", new { id = nuevoPedido.PedidoId }, new
                {
                    success = true,
                    message = "Pedido creado exitosamente",
                    pedido = pedidoCompleto
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
    }
}
