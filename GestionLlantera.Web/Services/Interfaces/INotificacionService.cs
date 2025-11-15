using GestionLlantera.Web.Models.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface INotificacionService
    {
        Task<List<NotificacionDTO>> ObtenerMisNotificacionesAsync();
        Task<int> ObtenerConteoNoLeidasAsync();
        Task<bool> MarcarComoLeidaAsync(int notificacionId);
        Task<dynamic> MarcarTodasComoLeidasAsync();
        Task<dynamic> OcultarNotificacionAsync(int notificacionId);
        Task<dynamic> OcultarTodasNotificacionesAsync();
    }
}