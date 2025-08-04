using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    // Este atributo asegura que solo usuarios autenticados puedan acceder
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ILogger<DashboardController> _logger;
        private readonly IDashboardService _dashboardService;

        public DashboardController(ILogger<DashboardController> logger, IDashboardService dashboardService)
        {
            _logger = logger;
            _dashboardService = dashboardService;
        }

        public IActionResult Index()
        {
            // Especificamos que use el layout administrativo
            ViewData["Layout"] = "_AdminLayout";
            return View();
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        /// <returns>El token JWT o null si no se encuentra</returns>
        private string? ObtenerTokenJWT()
        {
            var token = User.FindFirst("JwtToken")?.Value;

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }
            else
            {
                _logger.LogDebug("✅ Token JWT obtenido correctamente para usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }

            return token;
        }


        [HttpGet]
        public async Task<IActionResult> ObtenerAlertasStock()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo alertas de stock para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para DetalleProducto");
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                var resultado = await _dashboardService.ObtenerAlertasStockAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo alertas: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Alertas de stock obtenidas correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo alertas de stock");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}