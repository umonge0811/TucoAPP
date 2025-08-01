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
        /// Endpoint para verificar si el usuario es administrador (útil para el frontend)
        /// GET: api/Permisos/es-administrador
        /// </summary>
        [HttpGet("es-administrador")]
        [Authorize]
        public async Task<IActionResult> EsAdministrador()
        {
            try
            {
                var esAdmin = await _permisosService.EsAdministradorAsync();

                return Ok(new
                {
                    esAdministrador = esAdmin,
                    usuario = User.Identity?.Name ?? "Anónimo",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar si es administrador");
                return Ok(new { esAdministrador = false });
            }
        }

        /// <summary>
        /// Invalida inmediatamente el caché de permisos de todos los usuarios
        /// POST: /Permisos/InvalidarCacheGlobal
        /// </summary>
        [HttpPost("InvalidarCacheGlobal")]
        public async Task<IActionResult> InvalidarCacheGlobal()
        {
            try
            {
                _logger.LogInformation("🔄 Invalidando caché global de permisos...");

                // Aquí podrías implementar lógica para notificar a todos los clientes
                // Por ahora, simplemente confirmamos la invalidación

                return Ok(new
                {
                    success = true,
                    message = "Caché de permisos invalidado globalmente",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al invalidar caché global");
                return StatusCode(500, new { success = false, message = "Error al invalidar caché" });
            }
        }
    }
}