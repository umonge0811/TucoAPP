using Tuco.Clases.DTOs;

namespace API.ServicesAPI.Interfaces
{
    public interface INotificacionService
    {
        /// <summary>
        /// Crea una notificación para un usuario específico
        /// </summary>
        Task<bool> CrearNotificacionAsync(int usuarioId, string titulo, string mensaje, string tipo = "info", string? icono = null, string? urlAccion = null, string? entidadTipo = null, int? entidadId = null);

        /// <summary>
        /// Crea notificaciones para múltiples usuarios
        /// </summary>
        Task<bool> CrearNotificacionesAsync(IEnumerable<int> usuariosIds, string titulo, string mensaje, string tipo = "info", string? icono = null, string? urlAccion = null, string? entidadTipo = null, int? entidadId = null);

        /// <summary>
        /// Obtiene las notificaciones de un usuario
        /// </summary>
        Task<IEnumerable<NotificacionDTO>> ObtenerNotificacionesUsuarioAsync(int usuarioId, int cantidad = 50);

        /// <summary>
        /// Marca una notificación como leída
        /// </summary>
        Task<bool> MarcarComoLeidaAsync(int notificacionId, int usuarioId);

        /// <summary>
        /// Marca todas las notificaciones de un usuario como leídas
        /// </summary>
        Task<bool> MarcarTodasComoLeidasAsync(int usuarioId);

        /// <summary>
        /// Obtiene el conteo de notificaciones no leídas
        /// </summary>
        Task<int> ObtenerConteoNoLeidasAsync(int usuarioId);

        /// <summary>
        /// Elimina notificaciones antiguas (opcional, para limpieza)
        /// </summary>
        Task<int> LimpiarNotificacionesAntiguasAsync(int diasAntiguedad = 30);
    }
}