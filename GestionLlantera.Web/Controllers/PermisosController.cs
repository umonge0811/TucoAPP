using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory; // Asegúrate de agregar esta using
using GestionLlantera.Web.Extensions;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class PermisosController : Controller
    {
        private readonly IPermisosService _permisosService;
        private readonly ILogger<PermisosController> _logger;
        private readonly IMemoryCache _cache; // Inyecta IMemoryCache

        public PermisosController(IPermisosService permisosService, ILogger<PermisosController> logger, IMemoryCache cache)
        {
            _permisosService = permisosService;
            _logger = logger;
            _cache = cache;
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
        /// Limpiar caché de permisos manualmente
        /// </summary>
        [HttpPost("LimpiarCache")]
        public async Task<IActionResult> LimpiarCache()
        {
            try
            {
                _permisosService.LimpiarCacheCompleto();
                await _permisosService.RefrescarPermisosAsync();

                return Json(new { success = true, message = "Caché limpiado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar caché de permisos");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Verificar si el usuario necesita un refresh forzoso de permisos
        /// </summary>
        [HttpGet("VerificarRefreshForzoso")]
        public async Task<IActionResult> VerificarRefreshForzoso()
        {
            try
            {
                var usuarioId = HttpContext.GetUsuarioId();
                if (usuarioId == null)
                {
                    return Json(new { debeRenovar = true, motivo = "Usuario no identificado" });
                }

                // Verificar si hay una marca de refresh forzoso
                var forceRefreshKey = $"force_refresh_{usuarioId}";
                var debeRenovar = _cache.Get(forceRefreshKey) != null;

                if (debeRenovar)
                {
                    // Remover la marca después de detectarla
                    _cache.Remove(forceRefreshKey);
                    _logger.LogInformation("Refresh forzoso detectado y procesado para usuario {UsuarioId}", usuarioId);
                }

                return Json(new { 
                    debeRenovar = debeRenovar, 
                    usuarioId = usuarioId,
                    timestamp = DateTime.Now 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar refresh forzoso");
                return Json(new { debeRenovar = true, motivo = "Error interno" });
            }
        }
    }
}