using GestionLlantera.Web.Models;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace GestionLlantera.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IPermisosService _permisosService;

        public HomeController(ILogger<HomeController> logger, IPermisosService permisosService)
        {
            _logger = logger;
            _permisosService = permisosService;
        }

        // ? AGREGAR ESTE MÉTODO
        [HttpGet]
        public async Task<IActionResult> DebugPermisos()
        {
            var permisos = await _permisosService.ObtenerPermisosUsuarioActualAsync();

            return Json(new
            {
                EsAdministrador = permisos.EsAdministrador,
                PuedeVerCostos = permisos.PuedeVerCostos,
                PuedeVerUtilidades = permisos.PuedeVerUtilidades,
                PuedeProgramarInventario = permisos.PuedeProgramarInventario,
                PuedeEditarProductos = permisos.PuedeEditarProductos,
                PuedeEliminarProductos = permisos.PuedeEliminarProductos,
                PuedeAjustarStock = permisos.PuedeAjustarStock,
                // Info adicional para debug
                UsuarioAutenticado = User.Identity?.IsAuthenticated ?? false,
                NombreUsuario = User.Identity?.Name ?? "Sin nombre",
                Roles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList()
            });
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


    }
}
