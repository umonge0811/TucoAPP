
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class FacturacionController : Controller
    {
        private readonly IInventarioService _inventarioService;
        private readonly ILogger<FacturacionController> _logger;

        public FacturacionController(IInventarioService inventarioService, ILogger<FacturacionController> logger)
        {
            _inventarioService = inventarioService;
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                // Verificar permisos
                var validacionPermiso = await this.ValidarPermisoMvcAsync("VerFacturacion");
                if (validacionPermiso != null) return validacionPermiso;

                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar vista de facturación");
                TempData["Error"] = "Error al cargar la página de facturación.";
                return RedirectToAction("Index", "Dashboard");
            }
        }

        [HttpGet]
        public async Task<IActionResult> BuscarProductos(string termino = "", int pagina = 1, int tamano = 20)
        {
            try
            {
                var validacionPermiso = await this.ValidarPermisoApiAsync("VerInventario");
                if (validacionPermiso != null) return validacionPermiso;

                var productos = await _inventarioService.BuscarProductosAsync(termino, pagina, tamano);
                return Json(new { success = true, data = productos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar productos para facturación");
                return Json(new { success = false, message = "Error al buscar productos" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProducto(int id)
        {
            try
            {
                var validacionPermiso = await this.ValidarPermisoApiAsync("VerInventario");
                if (validacionPermiso != null) return validacionPermiso;

                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id);
                if (producto == null)
                {
                    return Json(new { success = false, message = "Producto no encontrado" });
                }

                return Json(new { success = true, data = producto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto {ProductoId}", id);
                return Json(new { success = false, message = "Error al obtener producto" });
            }
        }
    }
}
