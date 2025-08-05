
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Data;
using tuco.Clases.Models;
using tuco.Clases.DTOs;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnunciosController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<AnunciosController> _logger;

        public AnunciosController(TucoContext context, ILogger<AnunciosController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtener todos los anuncios activos
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncios()
        {
            try
            {
                _logger.LogInformation("Obteniendo anuncios activos");

                var anuncios = await _context.Anuncios
                    .Where(a => a.EsActivo)
                    .Include(a => a.Usuario)
                    .OrderByDescending(a => a.FechaCreacion)
                    .Select(a => new AnuncioDTO
                    {
                        AnuncioId = a.AnuncioId,
                        UsuarioId = a.UsuarioId,
                        Titulo = a.Titulo,
                        Contenido = a.Contenido,
                        EsActivo = a.EsActivo,
                        FechaCreacion = a.FechaCreacion,
                        FechaModificacion = a.FechaModificacion,
                        NombreUsuario = a.Usuario != null ? a.Usuario.NombreCompleto : "Usuario"
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = anuncios });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo anuncios");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear un nuevo anuncio
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearAnuncio([FromBody] CrearAnuncioDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Datos inválidos" });
                }

                var currentUserId = GetUsuarioId();

                _logger.LogInformation("Creando nuevo anuncio para usuario: {UsuarioId}", currentUserId);

                var anuncio = new Anuncio
                {
                    UsuarioId = currentUserId,
                    Titulo = request.Titulo,
                    Contenido = request.Contenido,
                    EsActivo = request.EsActivo,
                    FechaCreacion = DateTime.Now,
                    FechaModificacion = DateTime.Now
                };

                _context.Anuncios.Add(anuncio);
                await _context.SaveChangesAsync();

                // Cargar el usuario para la respuesta
                await _context.Entry(anuncio)
                    .Reference(a => a.Usuario)
                    .LoadAsync();

                var anuncioDto = new AnuncioDTO
                {
                    AnuncioId = anuncio.AnuncioId,
                    UsuarioId = anuncio.UsuarioId,
                    Titulo = anuncio.Titulo,
                    Contenido = anuncio.Contenido,
                    EsActivo = anuncio.EsActivo,
                    FechaCreacion = anuncio.FechaCreacion,
                    FechaModificacion = anuncio.FechaModificacion,
                    NombreUsuario = anuncio.Usuario?.NombreCompleto ?? "Usuario"
                };

                return Ok(new { success = true, data = anuncioDto, message = "Anuncio creado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando anuncio");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Actualizar un anuncio existente
        /// </summary>
        [HttpPut("{anuncioId}")]
        public async Task<IActionResult> ActualizarAnuncio(int anuncioId, [FromBody] ActualizarAnuncioDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Datos inválidos" });
                }

                var currentUserId = GetUsuarioId();

                _logger.LogInformation("Actualizando anuncio {AnuncioId} para usuario: {UsuarioId}", anuncioId, currentUserId);

                var anuncio = await _context.Anuncios
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.AnuncioId == anuncioId && a.UsuarioId == currentUserId);

                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                anuncio.Titulo = request.Titulo;
                anuncio.Contenido = request.Contenido;
                anuncio.EsActivo = request.EsActivo;
                anuncio.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                var anuncioDto = new AnuncioDTO
                {
                    AnuncioId = anuncio.AnuncioId,
                    UsuarioId = anuncio.UsuarioId,
                    Titulo = anuncio.Titulo,
                    Contenido = anuncio.Contenido,
                    EsActivo = anuncio.EsActivo,
                    FechaCreacion = anuncio.FechaCreacion,
                    FechaModificacion = anuncio.FechaModificacion,
                    NombreUsuario = anuncio.Usuario?.NombreCompleto ?? "Usuario"
                };

                return Ok(new { success = true, data = anuncioDto, message = "Anuncio actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando anuncio {AnuncioId}", anuncioId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar un anuncio
        /// </summary>
        [HttpDelete("{anuncioId}")]
        public async Task<IActionResult> EliminarAnuncio(int anuncioId, [FromQuery] int usuarioId)
        {
            try
            {
                var currentUserId = GetUsuarioId();

                // Verificar que el usuario elimina su propio anuncio
                if (currentUserId != usuarioId)
                {
                    return Forbid("No puedes eliminar anuncios de otro usuario");
                }

                _logger.LogInformation("Eliminando anuncio {AnuncioId} para usuario: {UsuarioId}", anuncioId, currentUserId);

                var anuncio = await _context.Anuncios
                    .FirstOrDefaultAsync(a => a.AnuncioId == anuncioId && a.UsuarioId == currentUserId);

                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                // Eliminación física
                _context.Anuncios.Remove(anuncio);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Anuncio eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando anuncio {AnuncioId}", anuncioId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Cambiar estado activo de un anuncio
        /// </summary>
        [HttpPatch("{anuncioId}/estado")]
        public async Task<IActionResult> CambiarEstado(int anuncioId, [FromBody] CambiarEstadoAnuncioRequest request)
        {
            try
            {
                var currentUserId = GetUsuarioId();

                // Verificar que el usuario modifica su propio anuncio
                if (currentUserId != request.UsuarioId)
                {
                    return Forbid("No puedes modificar anuncios de otro usuario");
                }

                _logger.LogInformation("Cambiando estado de anuncio {AnuncioId} a {EsActivo} para usuario: {UsuarioId}", 
                    anuncioId, request.EsActivo, currentUserId);

                var anuncio = await _context.Anuncios
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.AnuncioId == anuncioId && a.UsuarioId == currentUserId);

                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                anuncio.EsActivo = request.EsActivo;
                anuncio.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                var anuncioDto = new AnuncioDTO
                {
                    AnuncioId = anuncio.AnuncioId,
                    UsuarioId = anuncio.UsuarioId,
                    Titulo = anuncio.Titulo,
                    Contenido = anuncio.Contenido,
                    EsActivo = anuncio.EsActivo,
                    FechaCreacion = anuncio.FechaCreacion,
                    FechaModificacion = anuncio.FechaModificacion,
                    NombreUsuario = anuncio.Usuario?.NombreCompleto ?? "Usuario"
                };

                return Ok(new { 
                    success = true, 
                    data = anuncioDto, 
                    message = request.EsActivo ? "Anuncio activado" : "Anuncio desactivado" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cambiando estado de anuncio {AnuncioId}", anuncioId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener el ID del usuario actual desde los claims
        /// </summary>
        private int GetUsuarioId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("UserId")?.Value ??
                             User.FindFirst("sub")?.Value;

            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("No se pudo obtener el ID del usuario");
        }
    }

    /// <summary>
    /// DTO para cambiar estado activo
    /// </summary>
    public class CambiarEstadoAnuncioRequest
    {
        public bool EsActivo { get; set; }
        public int UsuarioId { get; set; }
    }
}
