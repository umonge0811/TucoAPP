using API.Data;
using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestionLlantera.Web.Services
{
    public class NotificacionDirectService : INotificacionService
    {
        private readonly TucoContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<NotificacionDirectService> _logger;

        public NotificacionDirectService(
            TucoContext context,
            IHttpContextAccessor httpContextAccessor,
            ILogger<NotificacionDirectService> logger)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public async Task<List<NotificacionDTO>> ObtenerMisNotificacionesAsync()
        {
            try
            {
                var userId = ObtenerUsuarioIdActual();
                if (userId == null)
                {
                    _logger.LogWarning("No se pudo obtener el ID del usuario actual");
                    return new List<NotificacionDTO>();
                }

                _logger.LogInformation($"Obteniendo notificaciones para usuario ID: {userId}");

                // ✅ ACCESO DIRECTO A LA BASE DE DATOS
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

                _logger.LogInformation($"Se encontraron {notificaciones.Count} notificaciones");
                return notificaciones;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones directamente de la BD");
                return new List<NotificacionDTO>();
            }
        }

        public async Task<int> ObtenerConteoNoLeidasAsync()
        {
            try
            {
                var userId = ObtenerUsuarioIdActual();
                if (userId == null) return 0;

                // ✅ ACCESO DIRECTO A LA BASE DE DATOS
                var conteo = await _context.Notificaciones
                    .CountAsync(n => n.UsuarioId == userId.Value && !n.Leida);

                _logger.LogInformation($"Usuario {userId} tiene {conteo} notificaciones no leídas");
                return conteo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones no leídas");
                return 0;
            }
        }

        public async Task<bool> MarcarComoLeidaAsync(int notificacionId)
        {
            try
            {
                var userId = ObtenerUsuarioIdActual();
                if (userId == null) return false;

                // ✅ ACCESO DIRECTO A LA BASE DE DATOS
                var notificacion = await _context.Notificaciones
                    .FirstOrDefaultAsync(n => n.NotificacionId == notificacionId && n.UsuarioId == userId.Value);

                if (notificacion == null)
                {
                    _logger.LogWarning($"Notificación {notificacionId} no encontrada para usuario {userId}");
                    return false;
                }

                notificacion.Leida = true;
                notificacion.FechaLectura = DateTime.Now;

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Notificación {notificacionId} marcada como leída");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación como leída: {Id}", notificacionId);
                return false;
            }
        }

        public async Task<bool> MarcarTodasComoLeidasAsync()
        {
            try
            {
                var userId = ObtenerUsuarioIdActual();
                if (userId == null) return false;

                // ✅ ACCESO DIRECTO A LA BASE DE DATOS
                var notificacionesNoLeidas = await _context.Notificaciones
                    .Where(n => n.UsuarioId == userId.Value && !n.Leida)
                    .ToListAsync();

                foreach (var notificacion in notificacionesNoLeidas)
                {
                    notificacion.Leida = true;
                    notificacion.FechaLectura = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Marcadas {notificacionesNoLeidas.Count} notificaciones como leídas para usuario {userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas");
                return false;
            }
        }

        /// <summary>
        /// Obtiene el ID del usuario actual de los claims
        /// </summary>
        private int? ObtenerUsuarioIdActual()
        {
            try
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user == null || !user.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("Usuario no autenticado");
                    return null;
                }

                // Debug: Mostrar todos los claims disponibles
                _logger.LogInformation("=== CLAIMS DISPONIBLES ===");
                foreach (var claim in user.Claims)
                {
                    _logger.LogInformation($"Claim - Tipo: {claim.Type}, Valor: {claim.Value}");
                }
                _logger.LogInformation("=== FIN CLAIMS ===");

                // ✅ BUSCAR EL ID DEL USUARIO EN LOS CLAIMS
                var userIdClaim = user.FindFirst("userId")?.Value ??
                                 user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation($"ID de usuario obtenido de claims: {userId}");
                    return userId;
                }

                // Como último recurso, buscar por email
                var emailClaim = user.FindFirst(ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(emailClaim))
                {
                    _logger.LogInformation($"Buscando usuario por email: {emailClaim}");
                    var usuario = _context.Usuarios.FirstOrDefault(u => u.Email == emailClaim);
                    if (usuario != null)
                    {
                        _logger.LogInformation($"Usuario encontrado por email, ID: {usuario.UsuarioId}");
                        return usuario.UsuarioId;
                    }
                }

                _logger.LogWarning("No se pudo obtener el ID del usuario de los claims");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ID del usuario actual");
                return null;
            }
        }
    }
}