using GestionLlantera.Web.Models.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface INotificacionService
    {
        Task<List<NotificacionDTO>> ObtenerMisNotificacionesAsync();
        Task<int> ObtenerConteoNoLeidasAsync();
        Task<bool> MarcarComoLeidaAsync(int notificacionId);
        Task<bool> MarcarTodasComoLeidasAsync();
    }
}