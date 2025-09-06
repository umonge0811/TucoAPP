

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Data;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ServiciosController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<ServiciosController> _logger;

        public ServiciosController(TucoContext context, ILogger<ServiciosController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todos los servicios con filtros opcionales
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServicioDTO>>> GetServicios(
            string busqueda = "",
            string tipoServicio = "",
            bool soloActivos = true,
            int pagina = 1,
            int tamano = 50)
        {
            try
            {
                _logger.LogInformation("🔧 Obteniendo servicios - Busqueda: {Busqueda}, Tipo: {Tipo}, SoloActivos: {SoloActivos}", 
                    busqueda, tipoServicio, soloActivos);

                var query = _context.Servicios.AsQueryable();

                // Aplicar filtros
                if (!string.IsNullOrEmpty(busqueda))
                {
                    query = query.Where(s => s.NombreServicio.Contains(busqueda) || 
                                           s.Descripcion.Contains(busqueda));
                }

                if (!string.IsNullOrEmpty(tipoServicio))
                {
                    query = query.Where(s => s.TipoServicio == tipoServicio);
                }

                if (soloActivos)
                {
                    query = query.Where(s => s.EstaActivo);
                }

                // Ordenar por nombre
                query = query.OrderBy(s => s.NombreServicio);

                var servicios = await query.ToListAsync();

                var serviciosDto = servicios.Select(s => new ServicioDTO
                {
                    ServicioId = s.ServicioId,
                    NombreServicio = s.NombreServicio,
                    TipoServicio = s.TipoServicio,
                    PrecioBase = s.PrecioBase,
                    Descripcion = s.Descripcion,
                    Observaciones = s.Observaciones,
                    EstaActivo = s.EstaActivo,
                    FechaCreacion = s.FechaCreacion,
                    FechaUltimaActualizacion = s.FechaUltimaActualizacion
                }).ToList();

                _logger.LogInformation("✅ Se encontraron {Count} servicios", serviciosDto.Count);

                return Ok(serviciosDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene un servicio por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ServicioDTO>> GetServicio(int id)
        {
            try
            {
                var servicio = await _context.Servicios.FindAsync(id);

                if (servicio == null)
                {
                    return NotFound($"Servicio con ID {id} no encontrado");
                }

                var servicioDto = new ServicioDTO
                {
                    ServicioId = servicio.ServicioId,
                    NombreServicio = servicio.NombreServicio,
                    TipoServicio = servicio.TipoServicio,
                    PrecioBase = servicio.PrecioBase,
                    Descripcion = servicio.Descripcion,
                    Observaciones = servicio.Observaciones,
                    EstaActivo = servicio.EstaActivo,
                    FechaCreacion = servicio.FechaCreacion,
                    FechaUltimaActualizacion = servicio.FechaUltimaActualizacion
                };

                return Ok(servicioDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicio {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crea un nuevo servicio
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ServicioDTO>> CreateServicio(ServicioDTO servicioDto)
        {
            try
            {
                var servicio = new Servicio
                {
                    NombreServicio = servicioDto.NombreServicio,
                    TipoServicio = servicioDto.TipoServicio,
                    PrecioBase = servicioDto.PrecioBase,
                    Descripcion = servicioDto.Descripcion,
                    Observaciones = servicioDto.Observaciones,
                    EstaActivo = servicioDto.EstaActivo,
                    FechaCreacion = DateTime.Now,
                    FechaUltimaActualizacion = DateTime.Now
                };

                _context.Servicios.Add(servicio);
                await _context.SaveChangesAsync();

                servicioDto.ServicioId = servicio.ServicioId;
                servicioDto.FechaCreacion = servicio.FechaCreacion;
                servicioDto.FechaUltimaActualizacion = servicio.FechaUltimaActualizacion;

                _logger.LogInformation("✅ Servicio creado: {Nombre} (ID: {Id})", servicio.NombreServicio, servicio.ServicioId);

                return CreatedAtAction(nameof(GetServicio), new { id = servicio.ServicioId }, servicioDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear servicio");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Actualiza un servicio existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServicio(int id, ServicioDTO servicioDto)
        {
            try
            {
                var servicio = await _context.Servicios.FindAsync(id);
                if (servicio == null)
                {
                    return NotFound($"Servicio con ID {id} no encontrado");
                }

                servicio.NombreServicio = servicioDto.NombreServicio;
                servicio.TipoServicio = servicioDto.TipoServicio;
                servicio.PrecioBase = servicioDto.PrecioBase;
                servicio.Descripcion = servicioDto.Descripcion;
                servicio.Observaciones = servicioDto.Observaciones;
                servicio.EstaActivo = servicioDto.EstaActivo;
                servicio.FechaUltimaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Servicio actualizado: {Nombre} (ID: {Id})", servicio.NombreServicio, servicio.ServicioId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar servicio {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Elimina (desactiva) un servicio
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServicio(int id)
        {
            try
            {
                var servicio = await _context.Servicios.FindAsync(id);
                if (servicio == null)
                {
                    return NotFound($"Servicio con ID {id} no encontrado");
                }

                servicio.EstaActivo = false;
                servicio.FechaUltimaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Servicio desactivado: {Nombre} (ID: {Id})", servicio.NombreServicio, servicio.ServicioId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar servicio {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene tipos de servicios disponibles
        /// </summary>
        [HttpGet("tipos")]
        public async Task<ActionResult<IEnumerable<string>>> GetTiposServicios()
        {
            try
            {
                var tipos = await _context.Servicios
                    .Where(s => s.EstaActivo && !string.IsNullOrEmpty(s.TipoServicio))
                    .Select(s => s.TipoServicio)
                    .Distinct()
                    .OrderBy(t => t)
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} tipos de servicios", tipos.Count);

                return Ok(tipos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener tipos de servicios");
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}
