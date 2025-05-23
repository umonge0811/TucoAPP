using API.Data;
using API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.Services
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

        public async Task<bool> CrearNotificacionAsync(int usuarioId, string titulo, string mensaje, string tipo = "info", string? icono = null, string? urlAccion = null, string? entidadTipo = null, int? entidadId = null)
        {
            try
            {
                // Validar que el usuario existe
                var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.UsuarioId == usuarioId);
                if (!usuarioExiste)
                {
                    _logger.LogWarning("Intento de crear notificación para usuario inexistente: {UsuarioId}", usuarioId);
                    return false;
                }

                var notificacion = new Notificacion
                {
                    UsuarioId = usuarioId,
                    Titulo = titulo,
                    Mensaje = mensaje,
                    Tipo = tipo,
                    Icono = icono,
                    UrlAccion = urlAccion,
                    EntidadTipo = entidadTipo,
                    EntidadId = entidadId,
                    FechaCreacion = DateTime.Now,
                    Leida = false
                };

                _context.Notificaciones.Add(notificacion);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notificación creada exitosamente para usuario {UsuarioId}: {Titulo}", usuarioId, titulo);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear notificación para usuario {UsuarioId}", usuarioId);
                return false;
            }
        }

        public async Task<bool> CrearNotificacionesAsync(IEnumerable<int> usuariosIds, string titulo, string mensaje, string tipo = "info", string? icono = null, string? urlAccion = null, string? entidadTipo = null, int? entidadId = null)
        {
            try
            {
                // Validar que los usuarios existen
                var usuariosExistentes = await _context.Usuarios
                    .Where(u => usuariosIds.Contains(u.UsuarioId))
                    .Select(u => u.UsuarioId)
                    .ToListAsync();

                if (!usuariosExistentes.Any())
                {
                    _logger.LogWarning("Ninguno de los usuarios especificados existe");
                    return false;
                }

                var notificaciones = usuariosExistentes.Select(usuarioId => new Notificacion
                {
                    UsuarioId = usuarioId,
                    Titulo = titulo,
                    Mensaje = mensaje,
                    Tipo = tipo,
                    Icono = icono,
                    UrlAccion = urlAccion,
                    EntidadTipo = entidadTipo,
                    EntidadId = entidadId,
                    FechaCreacion = DateTime.Now,
                    Leida = false
                }).ToList();

                _context.Notificaciones.AddRange(notificaciones);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notificaciones creadas para {Cantidad} usuarios: {Titulo}", usuariosExistentes.Count, titulo);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear notificaciones masivas");
                return false;
            }
        }

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

                return notificaciones;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones del usuario {UsuarioId}", usuarioId);
                return new List<NotificacionDTO>();
            }
        }

        public async Task<bool> MarcarComoLeidaAsync(int notificacionId, int usuarioId)
        {
            try
            {
                var notificacion = await _context.Notificaciones
                    .FirstOrDefaultAsync(n => n.NotificacionId == notificacionId && n.UsuarioId == usuarioId);

                if (notificacion == null)
                {
                    _logger.LogWarning("Notificación no encontrada: {NotificacionId} para usuario {UsuarioId}", notificacionId, usuarioId);
                    return false;
                }

                notificacion.Leida = true;
                notificacion.FechaLectura = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación como leída: {NotificacionId}", notificacionId);
                return false;
            }
        }

        public async Task<bool> MarcarTodasComoLeidasAsync(int usuarioId)
        {
            try
            {
                var notificacionesNoLeidas = await _context.Notificaciones
                    .Where(n => n.UsuarioId == usuarioId && !n.Leida)
                    .ToListAsync();

                foreach (var notificacion in notificacionesNoLeidas)
                {
                    notificacion.Leida = true;
                    notificacion.FechaLectura = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Marcadas {Cantidad} notificaciones como leídas para usuario {UsuarioId}", notificacionesNoLeidas.Count, usuarioId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas para usuario {UsuarioId}", usuarioId);
                return false;
            }
        }

        public async Task<int> ObtenerConteoNoLeidasAsync(int usuarioId)
        {
            try
            {
                return await _context.Notificaciones
                    .CountAsync(n => n.UsuarioId == usuarioId && !n.Leida);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones no leídas para usuario {UsuarioId}", usuarioId);
                return 0;
            }
        }

        public async Task<int> LimpiarNotificacionesAntiguasAsync(int diasAntiguedad = 30)
        {
            try
            {
                var fechaLimite = DateTime.Now.AddDays(-diasAntiguedad);
                var notificacionesAntiguas = await _context.Notificaciones
                    .Where(n => n.FechaCreacion < fechaLimite && n.Leida)
                    .ToListAsync();

                _context.Notificaciones.RemoveRange(notificacionesAntiguas);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Eliminadas {Cantidad} notificaciones antiguas", notificacionesAntiguas.Count);
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