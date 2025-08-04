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

        [HttpGet]
        public async Task<IActionResult> ObtenerAlertasStock()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo alertas de stock para dashboard");

                var resultado = await _dashboardService.ObtenerAlertasStockAsync();

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