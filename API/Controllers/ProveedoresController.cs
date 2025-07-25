using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Data;
using tuco.Clases.Models;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProveedoresController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<ProveedoresController> _logger;

        public ProveedoresController(TucoContext context, ILogger<ProveedoresController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Proveedore>>> GetProveedores()
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo todos los proveedores activos");

                var proveedores = await _context.Proveedores                    
                    .Include(p => p.PedidosProveedors)
                    .OrderBy(p => p.NombreProveedor)
                    .ToListAsync();

                return Ok(proveedores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo proveedores");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Proveedore>> GetProveedor(int id)
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo proveedor {Id}", id);

                var proveedor = await _context.Proveedores
                    .Include(p => p.PedidosProveedors)
                        .ThenInclude(pp => pp.DetallePedidos)
                            .ThenInclude(dp => dp.Producto)
                    .FirstOrDefaultAsync(p => p.ProveedorId == id && p.Activo);

                if (proveedor == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado o inactivo" });
                }

                return Ok(proveedor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo proveedor {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Proveedore>> PostProveedor(Proveedore proveedor)
        {
            try
            {
                _logger.LogInformation("➕ Creando nuevo proveedor: {Nombre}", proveedor.NombreProveedor);

                // Validar datos requeridos
                if (string.IsNullOrWhiteSpace(proveedor.NombreProveedor))
                {
                    return BadRequest(new { message = "El nombre del proveedor es requerido" });
                }

                // Verificar si ya existe un proveedor activo con el mismo nombre
                var existeProveedor = await _context.Proveedores
                    .AnyAsync(p => p.NombreProveedor.ToLower() == proveedor.NombreProveedor.ToLower() && p.Activo);

                if (existeProveedor)
                {
                    return BadRequest(new { message = "Ya existe un proveedor con este nombre" });
                }

                _context.Proveedores.Add(proveedor);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Proveedor creado exitosamente: {Id}", proveedor.ProveedorId);

                return CreatedAtAction("GetProveedor", new { id = proveedor.ProveedorId }, proveedor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando proveedor");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProveedor(int id, Proveedore proveedor)
        {
            if (id != proveedor.ProveedorId)
            {
                return BadRequest(new { message = "ID de proveedor no coincide" });
            }

            try
            {
                _logger.LogInformation("📝 Actualizando proveedor {Id}", id);

                // Validar que existe
                var proveedorExistente = await _context.Proveedores.FindAsync(id);
                if (proveedorExistente == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado" });
                }

                // Verificar nombre duplicado (excluyendo el actual y solo proveedores activos)
                var existeNombre = await _context.Proveedores
                    .AnyAsync(p => p.NombreProveedor.ToLower() == proveedor.NombreProveedor.ToLower() 
                                  && p.ProveedorId != id && p.Activo);

                if (existeNombre)
                {
                    return BadRequest(new { message = "Ya existe otro proveedor con este nombre" });
                }

                // Actualizar propiedades
                proveedorExistente.NombreProveedor = proveedor.NombreProveedor;
                proveedorExistente.Contacto = proveedor.Contacto;
                proveedorExistente.Telefono = proveedor.Telefono;
                proveedorExistente.Email = proveedor.Email;
                proveedorExistente.Direccion = proveedor.Direccion;
                proveedorExistente.Activo = proveedor.Activo;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Proveedor actualizado exitosamente: {Id}", id);

                return Ok(new { message = "Proveedor actualizado exitosamente", proveedor = proveedorExistente });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando proveedor {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoProveedor(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                _logger.LogInformation("🔄 Cambiando estado de proveedor {Id} a {Estado}", id, request?.Activo == true ? "Activo" : "Inactivo");

                if (request == null)
                {
                    return BadRequest(new { message = "Datos requeridos para cambiar estado" });
                }

                var proveedor = await _context.Proveedores
                    .FirstOrDefaultAsync(p => p.ProveedorId == id);

                if (proveedor == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado" });
                }

                proveedor.Activo = request.Activo;
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Estado del proveedor cambiado exitosamente: {Id} -> {Estado}", id, request.Activo ? "Activo" : "Inactivo");

                return Ok(new { 
                    success = true,
                    message = $"Proveedor {(request.Activo ? "activado" : "desactivado")} exitosamente",
                    data = new {
                        id = proveedor.ProveedorId,
                        nombre = proveedor.NombreProveedor,
                        activo = proveedor.Activo
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cambiando estado del proveedor {Id}", id);
                return StatusCode(500, new { 
                    success = false,
                    message = "Error interno del servidor" 
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProveedor(int id)
        {
            try
            {
                _logger.LogInformation("🗑️ Intentando eliminar proveedor {Id}", id);

                // Permitir ID 0 ya que es un valor válido en la base de datos
                var proveedor = await _context.Proveedores
                    .Include(p => p.PedidosProveedors)
                    .FirstOrDefaultAsync(p => p.ProveedorId == id);

                if (proveedor == null)
                {
                    return NotFound(new { 
                        success = false, 
                        message = "Proveedor no encontrado" 
                    });
                }

                // Verificar si tiene pedidos asociados
                var cantidadPedidos = proveedor.PedidosProveedors?.Count ?? 0;
                
                if (cantidadPedidos > 0)
                {
                    // No se puede eliminar físicamente, solo desactivar
                    proveedor.Activo = false;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("✅ Proveedor desactivado (tiene pedidos): {Id}", id);

                    return Ok(new { 
                        success = true, 
                        message = $"Proveedor desactivado porque tiene {cantidadPedidos} pedido(s) asociado(s)" 
                    });
                }
                else
                {
                    // Eliminación física segura
                    _context.Proveedores.Remove(proveedor);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("✅ Proveedor eliminado físicamente: {Id}", id);

                    return Ok(new { 
                        success = true, 
                        message = "Proveedor eliminado exitosamente" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando proveedor {Id}", id);
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error interno del servidor" 
                });
            }
        }

        [HttpGet("todos")]
        public async Task<IActionResult> ObtenerTodosProveedores()
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo TODOS los proveedores (activos e inactivos)");

                var proveedores = await _context.Proveedores
                    .Include(p => p.PedidosProveedors)
                    .OrderBy(p => p.NombreProveedor)
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} proveedores en total", proveedores.Count);

                return Ok(new { 
                    success = true, 
                    data = proveedores,
                    message = $"Se obtuvieron {proveedores.Count} proveedores (activos e inactivos)"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo todos los proveedores");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error interno del servidor al obtener proveedores" 
                });
            }
        }

    }
}