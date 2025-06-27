
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class DiagnosticoPermisosController : Controller
    {
        private readonly IPermisosGlobalService _permisosService;
        private readonly ILogger<DiagnosticoPermisosController> _logger;

        public DiagnosticoPermisosController(
            IPermisosGlobalService permisosService,
            ILogger<DiagnosticoPermisosController> logger)
        {
            _permisosService = permisosService;
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                // Obtener información del usuario actual
                var usuario = User.Identity?.Name ?? "Usuario desconocido";
                var userId = User.FindFirst("userId")?.Value;
                
                // Obtener todos los permisos
                var misPermisos = await _permisosService.ObtenerMisPermisosAsync();
                
                // Verificar permisos específicos de facturación y clientes
                var permisosClaves = new[]
                {
                    "Ver Facturación",
                    "Crear Facturas", 
                    "CompletarFacturas",
                    "EditarFacturas",
                    "AnularFacturas",
                    "Ver Clientes",
                    "Crear Clientes",
                    "Editar Clientes",
                    "Eliminar Clientes"
                };
                
                var resultadosPermisos = new Dictionary<string, bool>();
                foreach (var permiso in permisosClaves)
                {
                    resultadosPermisos[permiso] = await _permisosService.TienePermisoAsync(permiso);
                }
                
                ViewBag.Usuario = usuario;
                ViewBag.UserId = userId;
                ViewBag.MisPermisos = misPermisos;
                ViewBag.PermisosClaves = resultadosPermisos;
                ViewBag.EsAdmin = await _permisosService.EsAdministradorAsync();
                
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar diagnóstico de permisos");
                TempData["Error"] = "Error al cargar diagnóstico";
                return RedirectToAction("Index", "Home");
            }
        }

        [HttpGet]
        public async Task<IActionResult> VerificarPermisosClientes()
        {
            try
            {
                var permisos = new Dictionary<string, object>();
                
                // Verificar permisos de clientes
                permisos["Ver Clientes"] = await _permisosService.TienePermisoAsync("Ver Clientes");
                permisos["Crear Clientes"] = await _permisosService.TienePermisoAsync("Crear Clientes");
                permisos["Ver Facturación"] = await _permisosService.TienePermisoAsync("Ver Facturación");
                
                // Verificar si puede acceder a búsqueda de clientes
                var puedeOuscarClientes = await _permisosService.TienePermisoAsync("Ver Clientes") ||
                                         await _permisosService.TienePermisoAsync("Ver Facturación");
                
                permisos["Puede Buscar Clientes"] = puedeOuscarClientes;
                
                return Json(new { success = true, permisos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verificando permisos de clientes");
                return Json(new { success = false, message = "Error al verificar permisos" });
            }
        }
    }
}
