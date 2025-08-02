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

        public async Task<IActionResult> Index()
        {
            try
            {
                var topVendedor = await _dashboardService.ObtenerTopVendedorAsync();
                ViewBag.TopVendedor = topVendedor.success ? topVendedor.data : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar datos del dashboard");
                ViewBag.TopVendedor = null;
            }

            // Especificamos que use el layout administrativo
            ViewData["Layout"] = "_AdminLayout";
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTopVendedor()
        {
            var resultado = await _dashboardService.ObtenerTopVendedorAsync();
            
            if (resultado.success)
            {
                return Json(new { success = true, data = resultado.data });
            }

            return Json(new { success = false, message = resultado.message });
        }
    }
}