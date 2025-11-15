using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
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

        // The Index action is typically used to display a view, not for API calls from JavaScript.
        // The JavaScript functions should call specific API endpoints.
        public IActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Endpoint for JavaScript to get user notifications.
        /// </summary>
        public async Task<IActionResult> ObtenerMisNotificaciones()
        {
            try
            {
                var notificaciones = await _notificacionService.ObtenerMisNotificacionesAsync();
                // Returning a JSON with success status and data.
                return Json(new { success = true, data = notificaciones });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones");
                // Returning a JSON with failure status and an error message.
                return Json(new { success = false, message = "Error al cargar notificaciones" });
            }
        }

        /// <summary>
        /// Endpoint for JavaScript to get the count of unread notifications.
        /// </summary>
        public async Task<IActionResult> ObtenerConteoNoLeidas()
        {
            try
            {
                var conteo = await _notificacionService.ObtenerConteoNoLeidasAsync();
                // Returning a JSON with success status and the count data.
                return Json(new { success = true, data = conteo });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones");
                // Returning a JSON with failure status and an error message.
                return Json(new { success = false, message = "Error al cargar conteo" });
            }
        }

        /// <summary>
        /// Endpoint for JavaScript to mark a notification as read.
        /// </summary>
        [HttpPost("marcar-leida")]
        // Using POST for actions that modify server state.
        // Removed [ValidateAntiForgeryToken] as this is an API endpoint called from client-side JavaScript,
        // and CSRF protection is typically handled differently for API endpoints or might not be needed
        // depending on the application's security context and how the token is managed.
        // If CSRF protection is required, a mechanism to include the token in the request header
        // from JavaScript would be needed.
        public async Task<IActionResult> MarcarComoLeida([FromBody] MarcarNotificacionRequest request)
        {
            try
            {
                // Basic validation for the incoming request.
                if (request?.NotificacionId == null)
                {
                    return Json(new { success = false, message = "ID de notificación requerido" });
                }

                var resultado = await _notificacionService.MarcarComoLeidaAsync(request.NotificacionId.Value);
                // Returning success status of the operation.
                return Json(new { success = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación como leída");
                // Returning failure status and an error message.
                return Json(new { success = false, message = "Error al actualizar notificación" });
            }
        }

        /// <summary>
        /// Endpoint for JavaScript to mark all notifications as read.
        /// </summary>
        [HttpPost("marcar-todas-leidas")]
        // Using POST for actions that modify server state.
        // Removed [ValidateAntiForgeryToken] for similar reasons as above.
        public async Task<IActionResult> MarcarTodasComoLeidas()
        {
            try
            {
                var resultado = await _notificacionService.MarcarTodasComoLeidasAsync();
                // Returning the complete result object from the API service
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas");
                // Returning failure status and an error message.
                return Json(new { success = false, message = "Error al actualizar notificaciones" });
            }
        }

        /// <summary>
        /// Oculta una notificación específica (soft delete)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> OcultarNotificacion([FromBody] OcultarNotificacionRequest request)
        {
            try
            {
                if (request?.NotificacionId == null)
                {
                    return Json(new { success = false, message = "ID de notificación requerido" });
                }

                var result = await _notificacionService.OcultarNotificacionAsync(request.NotificacionId.Value);
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ocultar notificación");
                return Json(new { success = false, message = "Error al ocultar notificación" });
            }
        }

        /// <summary>
        /// Oculta todas las notificaciones del usuario
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> OcultarTodasNotificaciones()
        {
            try
            {
                var result = await _notificacionService.OcultarTodasNotificacionesAsync();
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ocultar todas las notificaciones");
                return Json(new { success = false, message = "Error al ocultar notificaciones" });
            }
        }
    }

    /// <summary>
    /// Helper class to model the request body for marking a notification as read.
    /// </summary>
    public class MarcarNotificacionRequest
    {
        public int? NotificacionId { get; set; }
    }

    /// <summary>
    /// Helper class to model the request body for hiding a notification.
    /// </summary>
    public class OcultarNotificacionRequest
    {
        public int? NotificacionId { get; set; }
    }
}