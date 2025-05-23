using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.ViewComponents
{
    public class NotificacionesViewComponent : ViewComponent
    {
        private readonly INotificacionService _notificacionService;

        public NotificacionesViewComponent(INotificacionService notificacionService)
        {
            _notificacionService = notificacionService;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            try
            {
                var notificaciones = await _notificacionService.ObtenerMisNotificacionesAsync();
                var conteoNoLeidas = await _notificacionService.ObtenerConteoNoLeidasAsync();

                var modelo = new NotificacionesViewModel
                {
                    Notificaciones = notificaciones,
                    ConteoNoLeidas = conteoNoLeidas
                };

                return View(modelo);
            }
            catch (Exception)
            {
                // En caso de error, devolver un modelo vacío
                return View(new NotificacionesViewModel());
            }
        }
    }

    public class NotificacionesViewModel
    {
        public List<NotificacionDTO> Notificaciones { get; set; } = new();
        public int ConteoNoLeidas { get; set; }
    }
}