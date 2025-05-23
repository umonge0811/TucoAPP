using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requiere autenticación
    public class NotificacionesController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<NotificacionesController> _logger;

        public NotificacionesController(TucoContext context, ILogger<NotificacionesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene las notificaciones del usuario autenticado
        /// </summary>
        [HttpGet("mis-notificaciones")]
        public async Task<ActionResult<IEnumerable<NotificacionDTO>>> ObtenerMisNotificaciones()
        {
            try
            {
                // ✅ OBTENER EL ID DEL USUARIO DEL TOKEN JWT (SIMPLIFICADO)
                var userId = ObtenerUsuarioIdDelToken();
                if (userId == null)
                {
                    return Unauthorized(new { message = "No se pudo identificar al usuario" });
                }

                var notificaciones = await _context.Notificaciones
                    .Where(n => n.UsuarioId == userId.Value)
                    .OrderByDescending(n => n.FechaCreacion)
                    .Take(50)
                    .Select(n => new NotificacionDTO
                    {
                        NotificacionId = n.NotificacionId,
                        Titulo = n.Titulo,
                        Mensaje = n.Mensaje,
                        Tipo = n.Tipo,
                        Icono = n.Icono,
                        Leida = n.Leida,
                        FechaCreacion = n.FechaCreacion,
                        FechaLectura = n.FechaLectura,
                        UrlAccion = n.UrlAccion,
                        EntidadTipo = n.EntidadTipo,
                        EntidadId = n.EntidadId
                    })
                    .ToListAsync();

                return Ok(notificaciones);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones del usuario");
                return StatusCode(500, new { message = "Error al obtener notificaciones" });
            }
        }

        /// <summary>
        /// Obtiene el conteo de notificaciones no leídas del usuario
        /// </summary>
        [HttpGet("conteo-no-leidas")]
        public async Task<ActionResult<int>> ObtenerConteoNoLeidas()
        {
            try
            {
                var userId = ObtenerUsuarioIdDelToken();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var conteo = await _context.Notificaciones
                    .CountAsync(n => n.UsuarioId == userId.Value && !n.Leida);

                return Ok(conteo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones no leídas");
                return StatusCode(500, new { message = "Error al obtener conteo" });
            }
        }

        /// <summary>
        /// Marca una notificación como leída
        /// </summary>
        [HttpPut("{id}/marcar-leida")]
        public async Task<IActionResult> MarcarComoLeida(int id)
        {
            try
            {
                var userId = ObtenerUsuarioIdDelToken();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var notificacion = await _context.Notificaciones
                    .FirstOrDefaultAsync(n => n.NotificacionId == id && n.UsuarioId == userId.Value);

                if (notificacion == null)
                {
                    return NotFound(new { message = "Notificación no encontrada" });
                }

                notificacion.Leida = true;
                notificacion.FechaLectura = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Notificación marcada como leída" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación como leída: {Id}", id);
                return StatusCode(500, new { message = "Error al actualizar notificación" });
            }
        }

        /// <summary>
        /// Marca todas las notificaciones del usuario como leídas
        /// </summary>
        [HttpPut("marcar-todas-leidas")]
        public async Task<IActionResult> MarcarTodasComoLeidas()
        {
            try
            {
                var userId = ObtenerUsuarioIdDelToken();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var notificacionesNoLeidas = await _context.Notificaciones
                    .Where(n => n.UsuarioId == userId.Value && !n.Leida)
                    .ToListAsync();

                foreach (var notificacion in notificacionesNoLeidas)
                {
                    notificacion.Leida = true;
                    notificacion.FechaLectura = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Todas las notificaciones marcadas como leídas",
                    cantidad = notificacionesNoLeidas.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas");
                return StatusCode(500, new { message = "Error al actualizar notificaciones" });
            }
        }

        /// <summary>
        /// Método auxiliar para obtener el ID del usuario del token JWT
        /// </summary>
        private int? ObtenerUsuarioIdDelToken()
        {
            try
            {
                // Intentar obtener el userId del claim personalizado primero
                var userIdClaim = User.FindFirst("userId")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }

                // Si no está, intentar con NameIdentifier
                var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(nameIdentifierClaim) && int.TryParse(nameIdentifierClaim, out int userIdFromNameIdentifier))
                {
                    return userIdFromNameIdentifier;
                }

                // Como último recurso, buscar por email
                var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(emailClaim))
                {
                    var usuario = _context.Usuarios.FirstOrDefault(u => u.Email == emailClaim);
                    return usuario?.UsuarioId;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ID del usuario del token");
                return null;
            }
        }


        /// <summary>
        /// Crea una nueva notificación (para uso interno del sistema)
        /// </summary>
        [HttpPost("crear")]
        public async Task<IActionResult> CrearNotificacion([FromBody] CrearNotificacionDTO dto)
        {
            try
            {
                var notificacion = new Notificacion
                {
                    UsuarioId = dto.UsuarioId,
                    Titulo = dto.Titulo,
                    Mensaje = dto.Mensaje,
                    Tipo = dto.Tipo,
                    Icono = dto.Icono,
                    EntidadTipo = dto.EntidadTipo,
                    EntidadId = dto.EntidadId,
                    UrlAccion = dto.UrlAccion,
                    FechaCreacion = DateTime.Now
                };

                _context.Notificaciones.Add(notificacion);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Notificación creada exitosamente",
                    notificacionId = notificacion.NotificacionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear notificación");
                return StatusCode(500, new { message = "Error al crear notificación" });
            }
        }
    }
}