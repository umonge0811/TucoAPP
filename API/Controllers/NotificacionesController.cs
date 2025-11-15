using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;
using Newtonsoft.Json; // Asegúrate de tener esta importación

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize] // Requiere autenticación
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
                // ✅ OBTENER EL ID DEL USUARIO DEL TOKEN JWT (MEJORADO)
                var userId = ObtenerUsuarioIdDelToken();

                if (userId == null)
                {
                    _logger.LogWarning("No se pudo obtener el ID del usuario del token");
                    return Unauthorized(new { message = "No se pudo identificar al usuario" });
                }

                _logger.LogInformation("Obteniendo notificaciones para usuario ID: {UserId}", userId.Value);

                var notificaciones = await _context.Notificaciones
                    .Where(n => n.UsuarioId == userId.Value && n.EsVisible)
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

                _logger.LogInformation("Se encontraron {Count} notificaciones para el usuario {UserId}",
                    notificaciones.Count, userId.Value);

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
                    _logger.LogWarning("No se pudo obtener el ID del usuario para conteo de notificaciones");
                    return Unauthorized();
                }

                var conteo = await _context.Notificaciones
                    .CountAsync(n => n.UsuarioId == userId.Value && !n.Leida && n.EsVisible);

                _logger.LogInformation("Usuario {UserId} tiene {Count} notificaciones no leídas", userId.Value, conteo);

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
                    .FirstOrDefaultAsync(n => n.NotificacionId == id && n.UsuarioId == userId.Value && n.EsVisible);

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
                    .Where(n => n.UsuarioId == userId.Value && !n.Leida && n.EsVisible)
                    .ToListAsync();

                foreach (var notificacion in notificacionesNoLeidas)
                {
                    notificacion.Leida = true;
                    notificacion.FechaLectura = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
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
        /// Método auxiliar para obtener el ID del usuario del token JWT (MEJORADO)
        /// </summary>
        private int? ObtenerUsuarioIdDelToken()
        {
            try
            {
                // Log de todos los claims para depuración
                _logger.LogInformation("Claims del usuario:");
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation("Claim Type: {Type}, Value: {Value}", claim.Type, claim.Value);
                }

                // Intentar obtener el userId del claim personalizado primero
                var userIdClaim = User.FindFirst("userId")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation("Usuario ID obtenido del claim 'userId': {UserId}", userId);
                    return userId;
                }

                // Si no está, intentar con NameIdentifier
                var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(nameIdentifierClaim) && int.TryParse(nameIdentifierClaim, out int userIdFromNameIdentifier))
                {
                    _logger.LogInformation("Usuario ID obtenido del claim 'NameIdentifier': {UserId}", userIdFromNameIdentifier);
                    return userIdFromNameIdentifier;
                }

                // Como último recurso, buscar por email
                var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
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

        /// <summary>
        /// Endpoint para probar la obtención del usuario (PARA DEPURACIÓN)
        /// </summary>
        [HttpGet("debug/usuario-actual")]
        public IActionResult DebugUsuarioActual()
        {
            try
            {
                var userId = ObtenerUsuarioIdDelToken();

                return Ok(new
                {
                    UsuarioId = userId,
                    Claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList(),
                    IsAuthenticated = User.Identity?.IsAuthenticated ?? false,
                    AuthenticationType = User.Identity?.AuthenticationType
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Oculta una notificación (soft delete)
        /// </summary>
        [HttpPost("ocultar")]
        public async Task<IActionResult> OcultarNotificacion([FromBody] OcultarNotificacionRequest request)
        {
            try
            {
                if (request?.NotificacionId == null || request.NotificacionId <= 0)
                {
                    return BadRequest(new { success = false, message = "ID de notificación requerido" });
                }

                var userId = ObtenerUsuarioIdDelToken();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var notificacion = await _context.Notificaciones
                    .FirstOrDefaultAsync(n => n.NotificacionId == request.NotificacionId && n.UsuarioId == userId.Value && n.EsVisible);

                if (notificacion == null)
                {
                    return NotFound(new { message = "Notificación no encontrada" });
                }

                notificacion.EsVisible = false;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notificación {NotificacionId} ocultada para usuario {UserId}", request.NotificacionId, userId.Value);

                return Ok(new { success = true, message = "Notificación ocultada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ocultar notificación: {Id}", request?.NotificacionId);
                return StatusCode(500, new { success = false, message = "Error al ocultar notificación" });
            }
        }

        /// <summary>
        /// Oculta todas las notificaciones del usuario
        /// </summary>
        [HttpPut("ocultar-todas")]
        public async Task<IActionResult> OcultarTodasNotificaciones()
        {
            try
            {
                var userId = ObtenerUsuarioIdDelToken();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var notificacionesVisibles = await _context.Notificaciones
                    .Where(n => n.UsuarioId == userId.Value && n.EsVisible)
                    .ToListAsync();

                foreach (var notificacion in notificacionesVisibles)
                {
                    notificacion.EsVisible = false;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Se ocultaron {Count} notificaciones para usuario {UserId}", notificacionesVisibles.Count, userId.Value);

                return Ok(new
                {
                    success = true,
                    message = "Todas las notificaciones fueron ocultadas",
                    cantidad = notificacionesVisibles.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ocultar todas las notificaciones");
                return StatusCode(500, new { message = "Error al ocultar notificaciones" });
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

    /// <summary>
    /// DTO para el request de ocultar notificación
    /// </summary>
    public class OcultarNotificacionRequest
    {
        public int NotificacionId { get; set; }
    }
}