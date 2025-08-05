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
    public class NotasRapidasController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<NotasRapidasController> _logger;

        public NotasRapidasController(TucoContext context, ILogger<NotasRapidasController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtener todas las notas de un usuario
        /// </summary>
        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerNotasUsuario(int usuarioId)
        {
            try
            {
                // Verificar que el usuario solicita sus propias notas
                var currentUserId = GetUsuarioId();
                if (currentUserId != usuarioId)
                {
                    return Forbid("No puedes acceder a las notas de otro usuario");
                }

                _logger.LogInformation("Obteniendo notas para usuario: {UsuarioId}", usuarioId);

                var notas = await _context.NotasRapidas
                    .Where(n => n.UsuarioId == usuarioId && !n.Eliminada)
                    .OrderByDescending(n => n.EsFavorita)
                    .ThenByDescending(n => n.FechaModificacion)
                    .Select(n => new NotaRapidaDTO
                    {
                        NotaId = n.NotaId,
                        UsuarioId = n.UsuarioId,
                        Titulo = n.Titulo,
                        Contenido = n.Contenido,
                        Color = n.Color,
                        EsFavorita = n.EsFavorita,
                        FechaCreacion = n.FechaCreacion,
                        FechaModificacion = n.FechaModificacion
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = notas });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo notas para usuario: {UsuarioId}", usuarioId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear una nueva nota
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearNota([FromBody] CrearNotaRapidaDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Datos inválidos" });
                }

                var currentUserId = GetUsuarioId();

                _logger.LogInformation("Creando nueva nota para usuario: {UsuarioId}", currentUserId);

                var nota = new NotaRapida
                {
                    UsuarioId = currentUserId,
                    Titulo = request.Titulo,
                    Contenido = request.Contenido,
                    Color = request.Color ?? "#ffd700",
                    EsFavorita = request.EsFavorita,
                    FechaCreacion = DateTime.Now,
                    FechaModificacion = DateTime.Now,
                    Eliminada = false
                };

                _context.NotasRapidas.Add(nota);
                await _context.SaveChangesAsync();

                var notaDto = new NotaRapidaDTO
                {
                    NotaId = nota.NotaId,
                    UsuarioId = nota.UsuarioId,
                    Titulo = nota.Titulo,
                    Contenido = nota.Contenido,
                    Color = nota.Color,
                    EsFavorita = nota.EsFavorita,
                    FechaCreacion = nota.FechaCreacion,
                    FechaModificacion = nota.FechaModificacion
                };

                return Ok(new { success = true, data = notaDto, message = "Nota creada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando nota");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Actualizar una nota existente
        /// </summary>
        [HttpPut("{notaId}")]
        public async Task<IActionResult> ActualizarNota(int notaId, [FromBody] ActualizarNotaRapidaDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Datos inválidos" });
                }

                var currentUserId = GetUsuarioId();

                _logger.LogInformation("Actualizando nota {NotaId} para usuario: {UsuarioId}", notaId, currentUserId);

                var nota = await _context.NotasRapidas
                    .FirstOrDefaultAsync(n => n.NotaId == notaId && n.UsuarioId == currentUserId && !n.Eliminada);

                if (nota == null)
                {
                    return NotFound(new { success = false, message = "Nota no encontrada" });
                }

                nota.Titulo = request.Titulo;
                nota.Contenido = request.Contenido;
                nota.Color = request.Color;
                nota.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                var notaDto = new NotaRapidaDTO
                {
                    NotaId = nota.NotaId,
                    UsuarioId = nota.UsuarioId,
                    Titulo = nota.Titulo,
                    Contenido = nota.Contenido,
                    Color = nota.Color,
                    EsFavorita = nota.EsFavorita,
                    FechaCreacion = nota.FechaCreacion,
                    FechaModificacion = nota.FechaModificacion
                };

                return Ok(new { success = true, data = notaDto, message = "Nota actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando nota {NotaId}", notaId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar una nota
        /// </summary>
        [HttpDelete("{notaId}")]
        public async Task<IActionResult> EliminarNota(int notaId, [FromQuery] int usuarioId)
        {
            try
            {
                var currentUserId = GetUsuarioId();

                // Verificar que el usuario elimina su propia nota
                if (currentUserId != usuarioId)
                {
                    return Forbid("No puedes eliminar notas de otro usuario");
                }

                _logger.LogInformation("Eliminando nota {NotaId} para usuario: {UsuarioId}", notaId, currentUserId);

                var nota = await _context.NotasRapidas
                    .FirstOrDefaultAsync(n => n.NotaId == notaId && n.UsuarioId == currentUserId && !n.Eliminada);

                if (nota == null)
                {
                    return NotFound(new { success = false, message = "Nota no encontrada" });
                }

                // Eliminación lógica
                nota.Eliminada = true;
                nota.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Nota eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando nota {NotaId}", notaId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Cambiar estado favorita de una nota
        /// </summary>
        [HttpPatch("{notaId}/favorita")]
        public async Task<IActionResult> CambiarFavorita(int notaId, [FromBody] CambiarFavoritaRequest request)
        {
            try
            {
                var currentUserId = GetUsuarioId();

                // Verificar que el usuario modifica su propia nota
                if (currentUserId != request.UsuarioId)
                {
                    return Forbid("No puedes modificar notas de otro usuario");
                }

                _logger.LogInformation("Cambiando estado favorita de nota {NotaId} a {EsFavorita} para usuario: {UsuarioId}", 
                    notaId, request.EsFavorita, currentUserId);

                var nota = await _context.NotasRapidas
                    .FirstOrDefaultAsync(n => n.NotaId == notaId && n.UsuarioId == currentUserId && !n.Eliminada);

                if (nota == null)
                {
                    return NotFound(new { success = false, message = "Nota no encontrada" });
                }

                nota.EsFavorita = request.EsFavorita;
                nota.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                var notaDto = new NotaRapidaDTO
                {
                    NotaId = nota.NotaId,
                    UsuarioId = nota.UsuarioId,
                    Titulo = nota.Titulo,
                    Contenido = nota.Contenido,
                    Color = nota.Color,
                    EsFavorita = nota.EsFavorita,
                    FechaCreacion = nota.FechaCreacion,
                    FechaModificacion = nota.FechaModificacion
                };

                return Ok(new { 
                    success = true, 
                    data = notaDto, 
                    message = request.EsFavorita ? "Nota marcada como favorita" : "Nota desmarcada como favorita" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cambiando estado favorita de nota {NotaId}", notaId);
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
    /// DTO para cambiar estado favorita
    /// </summary>
    public class CambiarFavoritaRequest
    {
        public bool EsFavorita { get; set; }
        public int UsuarioId { get; set; }
    }
}