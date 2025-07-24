
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
                    .Where(p => p.Activo)
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProveedor(int id)
        {
            try
            {
                _logger.LogInformation("🗑️ Desactivando proveedor {Id}", id);

                var proveedor = await _context.Proveedores
                    .FirstOrDefaultAsync(p => p.ProveedorId == id && p.Activo);

                if (proveedor == null)
                {
                    return NotFound(new { message = "Proveedor no encontrado o ya está inactivo" });
                }

                // Marcar como inactivo en lugar de eliminar físicamente
                proveedor.Activo = false;
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Proveedor desactivado exitosamente: {Id}", id);

                return Ok(new { message = "Proveedor desactivado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error desactivando proveedor {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }
    }
}
