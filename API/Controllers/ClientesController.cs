
using API.Data;
using API.Extensions;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;

namespace API.Controllers
{
    /// <summary>
    /// Controlador para el módulo de CLIENTES
    /// Maneja CRUD completo de clientes del sistema
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<ClientesController> _logger;
        private readonly IPermisosService _permisosService;

        public ClientesController(
            TucoContext context,
            ILogger<ClientesController> logger,
            IPermisosService permisosService)
        {
            _context = context;
            _logger = logger;
            _permisosService = permisosService;
        }

        /// <summary>
        /// Obtener todos los clientes
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Cliente>>> ObtenerClientes()
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ver Clientes",
                "Solo usuarios con permiso 'Ver Clientes' pueden consultar clientes");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                _logger.LogInformation("👥 Obteniendo lista de clientes");

                var clientes = await _context.Clientes
                    .OrderBy(c => c.NombreCliente)
                    .ToListAsync();

                return Ok(clientes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener clientes");
                return StatusCode(500, new { message = "Error al obtener clientes" });
            }
        }

        /// <summary>
        /// Obtener cliente por ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<Cliente>> ObtenerClientePorId(int id)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ver Clientes",
                "Solo usuarios con permiso 'Ver Clientes' pueden consultar clientes");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var cliente = await _context.Clientes.FindAsync(id);

                if (cliente == null)
                    return NotFound(new { message = "Cliente no encontrado" });

                return Ok(cliente);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener cliente {Id}", id);
                return StatusCode(500, new { message = "Error al obtener cliente" });
            }
        }

        /// <summary>
        /// Buscar clientes por término
        /// </summary>
        [HttpGet("buscar")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Cliente>>> BuscarClientes([FromQuery] string termino = "")
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ver Clientes",
                "Solo usuarios con permiso 'Ver Clientes' pueden buscar clientes");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                _logger.LogInformation("🔍 Buscando clientes con término: {Termino}", termino);

                var query = _context.Clientes.AsQueryable();

                if (!string.IsNullOrWhiteSpace(termino))
                {
                    query = query.Where(c =>
                        c.NombreCliente.Contains(termino) ||
                        (c.Email != null && c.Email.Contains(termino)) ||
                        (c.Telefono != null && c.Telefono.Contains(termino)) ||
                        (c.Contacto != null && c.Contacto.Contains(termino))
                    );
                }

                var clientes = await query
                    .OrderBy(c => c.NombreCliente)
                    .Take(50) // Limitar resultados
                    .ToListAsync();

                return Ok(clientes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar clientes");
                return StatusCode(500, new { message = "Error al buscar clientes" });
            }
        }

        /// <summary>
        /// Crear nuevo cliente
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Cliente>> CrearCliente([FromBody] Cliente cliente)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Crear Clientes",
                "Solo usuarios con permiso 'Crear Clientes' pueden crear clientes");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                _logger.LogInformation("➕ Creando nuevo cliente: {Nombre}", cliente.NombreCliente);

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());
                    return BadRequest(new { message = "Error de validación", errores });
                }

                // Verificar si ya existe un cliente con el mismo email
                if (!string.IsNullOrWhiteSpace(cliente.Email))
                {
                    var clienteExistente = await _context.Clientes
                        .Where(c => c.Email == cliente.Email)
                        .FirstOrDefaultAsync();

                    if (clienteExistente != null)
                    {
                        return BadRequest(new { message = "Ya existe un cliente con este email" });
                    }
                }

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(ObtenerClientePorId), new { id = cliente.ClienteId }, cliente);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear cliente");
                return StatusCode(500, new { message = "Error al crear cliente" });
            }
        }

        /// <summary>
        /// Actualizar cliente existente
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> ActualizarCliente(int id, [FromBody] Cliente cliente)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Editar Clientes",
                "Solo usuarios con permiso 'Editar Clientes' pueden actualizar clientes");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                if (id != cliente.ClienteId)
                    return BadRequest(new { message = "ID del cliente no coincide" });

                var clienteExistente = await _context.Clientes.FindAsync(id);
                if (clienteExistente == null)
                    return NotFound(new { message = "Cliente no encontrado" });

                // Actualizar propiedades
                clienteExistente.NombreCliente = cliente.NombreCliente;
                clienteExistente.Contacto = cliente.Contacto;
                clienteExistente.Direccion = cliente.Direccion;
                clienteExistente.Email = cliente.Email;
                clienteExistente.Telefono = cliente.Telefono;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cliente actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar cliente {Id}", id);
                return StatusCode(500, new { message = "Error al actualizar cliente" });
            }
        }

        /// <summary>
        /// Eliminar cliente
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> EliminarCliente(int id)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Eliminar Clientes",
                "Solo usuarios con permiso 'Eliminar Clientes' pueden eliminar clientes");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var cliente = await _context.Clientes.FindAsync(id);
                if (cliente == null)
                    return NotFound(new { message = "Cliente no encontrado" });

                // Verificar si el cliente tiene facturas asociadas
                var tieneFacturas = await _context.Facturas
                    .Where(f => f.ClienteId == id)
                    .AnyAsync();

                if (tieneFacturas)
                {
                    return BadRequest(new { message = "No se puede eliminar el cliente porque tiene facturas asociadas" });
                }

                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cliente eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar cliente {Id}", id);
                return StatusCode(500, new { message = "Error al eliminar cliente" });
            }
        }
    }
}
