using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace GestionLlantera.Web.Controllers
{
    // Este atributo asegura que solo usuarios autenticados puedan acceder
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ILogger<DashboardController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            // Especificamos que use el layout administrativo
            ViewData["Layout"] = "_AdminLayout";
            return View();
        }
    }
}