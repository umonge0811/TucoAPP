
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class NotificacionesController : Controller
    {
        private readonly INotificacionService _notificacionService;
        private readonly ILogger<NotificacionesController> _logger;

        public NotificacionesController(
            INotificacionService notificacionService,
            ILogger<NotificacionesController> logger)
        {
            _notificacionService = notificacionService;
            _logger = logger;
        }

        [HttpGet("conteo-no-leidas")]
        public async Task<IActionResult> ObtenerConteoNoLeidas()
        {
            try
            {
                var conteo = await _notificacionService.ObtenerConteoNoLeidasAsync();
                return Json(conteo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones no leídas");
                return Json(0);
            }
        }

        [HttpGet("mis-notificaciones")]
        public async Task<IActionResult> ObtenerMisNotificaciones()
        {
            try
            {
                var notificaciones = await _notificacionService.ObtenerMisNotificacionesAsync();
                return Json(notificaciones);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones");
                return Json(new List<object>());
            }
        }

        [HttpPut("{id}/marcar-leida")]
        public async Task<IActionResult> MarcarComoLeida(int id)
        {
            try
            {
                var resultado = await _notificacionService.MarcarComoLeidaAsync(id);
                return Json(new { success = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación como leída");
                return Json(new { success = false });
            }
        }

        [HttpPut("marcar-todas-leidas")]
        public async Task<IActionResult> MarcarTodasComoLeidas()
        {
            try
            {
                var resultado = await _notificacionService.MarcarTodasComoLeidasAsync();
                return Json(new { success = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas");
                return Json(new { success = false });
            }
        }
    }
}
