using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class PermisosController : Controller
    {
        private readonly IPermisosService _permisosService;
        private readonly ILogger<PermisosController> _logger;

        public PermisosController(IPermisosService permisosService, ILogger<PermisosController> logger)
        {
            _permisosService = permisosService;
            _logger = logger;
        }

        /// <summary>
        /// Endpoint para verificar si los permisos han cambiado
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> VerificarCambios()
        {
            try
            {
                // Forzar renovación de permisos
                await _permisosService.RefrescarPermisosAsync();
                var permisos = await _permisosService.ObtenerPermisosUsuarioActualAsync();

                return Json(new { 
                    success = true, 
                    permisos = permisos,
                    timestamp = DateTime.Now 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar cambios de permisos");
                return Json(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para limpiar caché de permisos
        /// </summary>
        [HttpPost]
        public IActionResult LimpiarCache()
        {
            try
            {
                _permisosService.LimpiarCacheCompleto();
                _logger.LogInformation("Caché de permisos limpiado manualmente");

                return Json(new { success = true, message = "Caché limpiado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar caché de permisos");
                return Json(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para verificar si los permisos del usuario han cambiado
        /// Se usa para actualización automática sin cerrar navegador
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> VerificarCambios()
        {
            try
            {
                var permisosService = HttpContext.RequestServices.GetService<IPermisosService>();
                if (permisosService == null)
                {
                    return Json(new { success = false, message = "Servicio no disponible" });
                }

                // Obtener permisos actuales desde la API
                var permisosActuales = await permisosService.ObtenerPermisosUsuarioActualAsync();

                return Json(new { 
                    success = true, 
                    permisos = new {
                        esAdministrador = permisosActuales.EsAdministrador,
                        puedeVerCostos = permisosActuales.PuedeVerCostos,
                        puedeVerUtilidades = permisosActuales.PuedeVerUtilidades,
                        puedeProgramarInventario = permisosActuales.PuedeProgramarInventario,
                        puedeEditarProductos = permisosActuales.PuedeEditarProductos,
                        puedeEliminarProductos = permisosActuales.PuedeEliminarProductos,
                        puedeAjustarStock = permisosActuales.PuedeAjustarStock
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar cambios de permisos");
                return Json(new { success = false, message = "Error interno" });
            }
        }
    }
}