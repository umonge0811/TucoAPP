using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.ServicesAPI
{
    public class NotificacionService : INotificacionService
    {
        private readonly TucoContext _context;
        private readonly ILogger<NotificacionService> _logger;

        public NotificacionService(TucoContext context, ILogger<NotificacionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Crea una notificación para un usuario específico
        /// </summary>
        public async Task<bool> CrearNotificacionAsync(int usuarioId, string titulo, string mensaje, string tipo = "info", string? icono = null, string? urlAccion = null, string? entidadTipo = null, int? entidadId = null)
        {
            try
            {
                var notificacion = new Notificacion
                {
                    UsuarioId = usuarioId,
                    Titulo = titulo,
                    Mensaje = mensaje,
                    Tipo = tipo,
                    Icono = icono ?? "fas fa-info-circle",
                    UrlAccion = urlAccion,
                    EntidadTipo = entidadTipo,
                    EntidadId = entidadId,
                    Leida = false,
                    FechaCreacion = DateTime.Now
                };

                _context.Notificaciones.Add(notificacion);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notificación creada exitosamente para usuario {UserId}: {Titulo}", usuarioId, titulo);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear notificación para usuario {UserId}", usuarioId);
                return false;
            }
        }

        /// <summary>
        /// Crea notificaciones para múltiples usuarios
        /// </summary>
        public async Task<bool> CrearNotificacionesAsync(IEnumerable<int> usuariosIds, string titulo, string mensaje, string tipo = "info", string? icono = null, string? urlAccion = null, string? entidadTipo = null, int? entidadId = null)
        {
            try
            {
                var notificaciones = new List<Notificacion>();

                foreach (var usuarioId in usuariosIds)
                {
                    var notificacion = new Notificacion
                    {
                        UsuarioId = usuarioId,
                        Titulo = titulo,
                        Mensaje = mensaje,
                        Tipo = tipo,
                        Icono = icono ?? "fas fa-info-circle",
                        UrlAccion = urlAccion,
                        EntidadTipo = entidadTipo,
                        EntidadId = entidadId,
                        Leida = false,
                        FechaCreacion = DateTime.Now
                    };

                    notificaciones.Add(notificacion);
                }

                _context.Notificaciones.AddRange(notificaciones);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Se crearon {Count} notificaciones: {Titulo}", notificaciones.Count, titulo);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear notificaciones múltiples");
                return false;
            }
        }

        /// <summary>
        /// Obtiene las notificaciones de un usuario
        /// </summary>
        public async Task<IEnumerable<NotificacionDTO>> ObtenerNotificacionesUsuarioAsync(int usuarioId, int cantidad = 50)
        {
            try
            {
                var notificaciones = await _context.Notificaciones
                    .Where(n => n.UsuarioId == usuarioId)
                    .OrderByDescending(n => n.FechaCreacion)
                    .Take(cantidad)
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

                _logger.LogInformation("Se obtuvieron {Count} notificaciones para usuario {UserId}", notificaciones.Count(), usuarioId);
                return notificaciones;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones para usuario {UserId}", usuarioId);
                return new List<NotificacionDTO>();
            }
        }

        /// <summary>
        /// Marca una notificación como leída
        /// </summary>
        public async Task<bool> MarcarComoLeidaAsync(int notificacionId, int usuarioId)
        {
            try
            {
                var notificacion = await _context.Notificaciones
                    .FirstOrDefaultAsync(n => n.NotificacionId == notificacionId && n.UsuarioId == usuarioId);

                if (notificacion == null)
                {
                    _logger.LogWarning("Notificación {NotificacionId} no encontrada para usuario {UserId}", notificacionId, usuarioId);
                    return false;
                }

                notificacion.Leida = true;
                notificacion.FechaLectura = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Notificación {NotificacionId} marcada como leída para usuario {UserId}", notificacionId, usuarioId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación {NotificacionId} como leída", notificacionId);
                return false;
            }
        }

        /// <summary>
        /// Marca todas las notificaciones de un usuario como leídas
        /// </summary>
        public async Task<bool> MarcarTodasComoLeidasAsync(int usuarioId)
        {
            try
            {
                var notificacionesNoLeidas = await _context.Notificaciones
                    .Where(n => n.UsuarioId == usuarioId && !n.Leida)
                    .ToListAsync();

                if (!notificacionesNoLeidas.Any())
                {
                    _logger.LogInformation("No hay notificaciones no leídas para usuario {UserId}", usuarioId);
                    return true;
                }

                foreach (var notificacion in notificacionesNoLeidas)
                {
                    notificacion.Leida = true;
                    notificacion.FechaLectura = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Se marcaron {Count} notificaciones como leídas para usuario {UserId}", notificacionesNoLeidas.Count, usuarioId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas para usuario {UserId}", usuarioId);
                return false;
            }
        }

        /// <summary>
        /// Obtiene el conteo de notificaciones no leídas
        /// </summary>
        public async Task<int> ObtenerConteoNoLeidasAsync(int usuarioId)
        {
            try
            {
                var conteo = await _context.Notificaciones
                    .CountAsync(n => n.UsuarioId == usuarioId && !n.Leida);

                _logger.LogInformation("Usuario {UserId} tiene {Count} notificaciones no leídas", usuarioId, conteo);
                return conteo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones no leídas para usuario {UserId}", usuarioId);
                return 0;
            }
        }

        /// <summary>
        /// Elimina notificaciones antiguas (opcional, para limpieza)
        /// </summary>
        public async Task<int> LimpiarNotificacionesAntiguasAsync(int diasAntiguedad = 30)
        {
            try
            {
                var fechaLimite = DateTime.Now.AddDays(-diasAntiguedad);

                var notificacionesAntiguas = await _context.Notificaciones
                    .Where(n => n.FechaCreacion < fechaLimite && n.Leida)
                    .ToListAsync();

                if (!notificacionesAntiguas.Any())
                {
                    _logger.LogInformation("No hay notificaciones antiguas para limpiar");
                    return 0;
                }

                _context.Notificaciones.RemoveRange(notificacionesAntiguas);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Se eliminaron {Count} notificaciones antiguas", notificacionesAntiguas.Count);
                return notificacionesAntiguas.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar notificaciones antiguas");
                return 0;
            }
        }
    }
}