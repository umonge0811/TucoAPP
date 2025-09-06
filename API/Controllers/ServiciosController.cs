using API.Data;
using API.Extensions;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;

namespace API.Controllers
{
    /// <summary>
    /// Controlador para el módulo de SERVICIOS DE MECÁNICA
    /// Incluye CRUD completo de servicios para facturación
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ServiciosController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<ServiciosController> _logger;
        private readonly IPermisosService _permisosService;

        public ServiciosController(
            TucoContext context,
            ILogger<ServiciosController> logger,
            IPermisosService permisosService)
        {
            _context = context;
            _logger = logger;
            _permisosService = permisosService;
        }

        /// <summary>
        /// Obtiene todos los servicios con filtros opcionales
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> ObtenerServicios(
            [FromQuery] string? busqueda = null,
            [FromQuery] string? tipoServicio = null,
            [FromQuery] bool? soloActivos = true,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 50)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ver Servicios",
                "Solo usuarios con permiso 'Ver Servicios' pueden consultar servicios");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var query = _context.Servicios.AsQueryable();

                // Filtrar por activos si se especifica
                if (soloActivos.HasValue && soloActivos.Value)
                    query = query.Where(s => s.EstaActivo);

                // Filtrar por búsqueda
                if (!string.IsNullOrEmpty(busqueda))
                {
                    query = query.Where(s => 
                        s.NombreServicio.Contains(busqueda) ||
                        s.Descripcion.Contains(busqueda) ||
                        s.TipoServicio.Contains(busqueda));
                }

                // Filtrar por tipo de servicio
                if (!string.IsNullOrEmpty(tipoServicio))
                    query = query.Where(s => s.TipoServicio == tipoServicio);

                // Ordenar por nombre
                query = query.OrderBy(s => s.NombreServicio);

                // Calcular total antes de la paginación
                var total = await query.CountAsync();

                // Aplicar paginación
                var servicios = await query
                    .Skip((pagina - 1) * tamano)
                    .Take(tamano)
                    .Select(s => new ServicioDTO
                    {
                        ServicioId = s.ServicioId,
                        NombreServicio = s.NombreServicio,
                        Descripcion = s.Descripcion,
                        PrecioBase = s.PrecioBase,
                        TipoServicio = s.TipoServicio,
                        EstaActivo = s.EstaActivo,
                        FechaCreacion = s.FechaCreacion,
                        FechaUltimaActualizacion = s.FechaUltimaActualizacion,
                        Observaciones = s.Observaciones
                    })
                    .ToListAsync();

                _logger.LogInformation("🔧 Consulta de servicios: {Total} encontrados", total);

                return Ok(new
                {
                    servicios,
                    total,
                    pagina,
                    tamano,
                    totalPaginas = (int)Math.Ceiling((double)total / tamano)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicios");
                return StatusCode(500, new { message = "Error interno al obtener servicios", error = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene un servicio por ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> ObtenerServicioPorId(int id)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ver Servicios",
                "Solo usuarios con permiso 'Ver Servicios' pueden consultar servicios");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var servicio = await _context.Servicios
                    .Where(s => s.ServicioId == id)
                    .Select(s => new ServicioDTO
                    {
                        ServicioId = s.ServicioId,
                        NombreServicio = s.NombreServicio,
                        Descripcion = s.Descripcion,
                        PrecioBase = s.PrecioBase,
                        TipoServicio = s.TipoServicio,
                        EstaActivo = s.EstaActivo,
                        FechaCreacion = s.FechaCreacion,
                        FechaUltimaActualizacion = s.FechaUltimaActualizacion,
                        Observaciones = s.Observaciones
                    })
                    .FirstOrDefaultAsync();

                if (servicio == null)
                    return NotFound(new { message = "Servicio no encontrado" });

                return Ok(servicio);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicio {ServicioId}", id);
                return StatusCode(500, new { message = "Error interno al obtener servicio", error = ex.Message });
            }
        }

        /// <summary>
        /// Crea un nuevo servicio
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CrearServicio([FromBody] ServicioDTO servicioDto)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Editar Servicios",
                "Solo usuarios con permiso 'Editar Servicios' pueden crear servicios");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                _logger.LogInformation("🔧 Usuario {Usuario} creando servicio: {Nombre}",
                    User.Identity?.Name, servicioDto.NombreServicio);

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());

                    return BadRequest(new { message = "Error de validación", errores });
                }

                // Verificar que no exista un servicio con el mismo nombre
                var existeServicio = await _context.Servicios
                    .AnyAsync(s => s.NombreServicio.ToLower() == servicioDto.NombreServicio.ToLower());

                if (existeServicio)
                    return BadRequest(new { message = "Ya existe un servicio con este nombre" });

                var servicio = new Servicio
                {
                    NombreServicio = servicioDto.NombreServicio,
                    Descripcion = servicioDto.Descripcion,
                    PrecioBase = servicioDto.PrecioBase,
                    TipoServicio = servicioDto.TipoServicio,
                    EstaActivo = servicioDto.EstaActivo,
                    FechaCreacion = DateTime.Now,
                    Observaciones = servicioDto.Observaciones
                };

                _context.Servicios.Add(servicio);
                await _context.SaveChangesAsync();

                var servicioCreado = new ServicioDTO
                {
                    ServicioId = servicio.ServicioId,
                    NombreServicio = servicio.NombreServicio,
                    Descripcion = servicio.Descripcion,
                    PrecioBase = servicio.PrecioBase,
                    TipoServicio = servicio.TipoServicio,
                    EstaActivo = servicio.EstaActivo,
                    FechaCreacion = servicio.FechaCreacion,
                    Observaciones = servicio.Observaciones
                };

                _logger.LogInformation("✅ Servicio creado exitosamente: {ServicioId}", servicio.ServicioId);

                return CreatedAtAction(nameof(ObtenerServicioPorId), new { id = servicio.ServicioId }, servicioCreado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear servicio");
                return StatusCode(500, new { message = "Error interno al crear servicio", error = ex.Message });
            }
        }

        /// <summary>
        /// Actualiza un servicio existente
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> ActualizarServicio(int id, [FromBody] ServicioDTO servicioDto)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Editar Servicios",
                "Solo usuarios con permiso 'Editar Servicios' pueden actualizar servicios");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var servicio = await _context.Servicios.FindAsync(id);
                if (servicio == null)
                    return NotFound(new { message = "Servicio no encontrado" });

                // Verificar que no exista otro servicio con el mismo nombre
                var existeOtroServicio = await _context.Servicios
                    .AnyAsync(s => s.NombreServicio.ToLower() == servicioDto.NombreServicio.ToLower() && s.ServicioId != id);

                if (existeOtroServicio)
                    return BadRequest(new { message = "Ya existe otro servicio con este nombre" });

                servicio.NombreServicio = servicioDto.NombreServicio;
                servicio.Descripcion = servicioDto.Descripcion;
                servicio.PrecioBase = servicioDto.PrecioBase;
                servicio.TipoServicio = servicioDto.TipoServicio;
                servicio.EstaActivo = servicioDto.EstaActivo;
                servicio.FechaUltimaActualizacion = DateTime.Now;
                servicio.Observaciones = servicioDto.Observaciones;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Servicio actualizado: {ServicioId}", id);

                return Ok(new { message = "Servicio actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar servicio {ServicioId}", id);
                return StatusCode(500, new { message = "Error interno al actualizar servicio", error = ex.Message });
            }
        }

        /// <summary>
        /// Elimina (desactiva) un servicio
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> EliminarServicio(int id)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Editar Servicios",
                "Solo usuarios con permiso 'Editar Servicios' pueden eliminar servicios");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var servicio = await _context.Servicios.FindAsync(id);
                if (servicio == null)
                    return NotFound(new { message = "Servicio no encontrado" });

                // En lugar de eliminar físicamente, desactivamos el servicio
                servicio.EstaActivo = false;
                servicio.FechaUltimaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("🗑️ Servicio desactivado: {ServicioId}", id);

                return Ok(new { message = "Servicio desactivado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar servicio {ServicioId}", id);
                return StatusCode(500, new { message = "Error interno al eliminar servicio", error = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene tipos de servicios disponibles
        /// </summary>
        [HttpGet("tipos")]
        [Authorize]
        public async Task<IActionResult> ObtenerTiposServicios()
        {
            try
            {
                var tipos = await _context.Servicios
                    .Where(s => s.EstaActivo)
                    .Select(s => s.TipoServicio)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                return Ok(tipos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener tipos de servicios");
                return StatusCode(500, new { message = "Error interno", error = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene servicios para facturación (activos únicamente)
        /// </summary>
        [HttpGet("para-facturacion")]
        [Authorize]
        public async Task<IActionResult> ObtenerServiciosParaFacturacion([FromQuery] string? busqueda = null)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ver Servicios",
                "Solo usuarios con permiso 'Ver Servicios' pueden consultar servicios para facturación");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var query = _context.Servicios
                    .Where(s => s.EstaActivo)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(busqueda))
                {
                    query = query.Where(s => 
                        s.NombreServicio.Contains(busqueda) ||
                        s.TipoServicio.Contains(busqueda));
                }

                var servicios = await query
                    .OrderBy(s => s.NombreServicio)
                    .Select(s => new
                    {
                        s.ServicioId,
                        s.NombreServicio,
                        s.Descripcion,
                        s.PrecioBase,
                        s.TipoServicio,
                        PrecioFormateado = $"₡{s.PrecioBase:N2}"
                    })
                    .ToListAsync();

                return Ok(servicios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicios para facturación");
                return StatusCode(500, new { message = "Error interno", error = ex.Message });
            }
        }
    }
}