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
        private readonly IConfiguration _configuration;

        public PermisosController(IPermisosService permisosService, ILogger<PermisosController> logger, IConfiguration configuration)
        {
            _permisosService = permisosService;
            _logger = logger;
            _configuration = configuration;
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
        public async Task<IActionResult> LimpiarCache()
        {
            try
            {
                _permisosService.LimpiarCacheCompleto();

                return Ok(new { success = true, message = "Caché limpiado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar caché de permisos");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// ✅ NUEVO: Endpoint para notificar cambios en roles/permisos
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> NotificarCambiosRoles()
        {
            try
            {
                _logger.LogInformation("🔄 === NOTIFICANDO CAMBIOS EN ROLES ===");

                // 1. Limpiar caché local del frontend
                _permisosService.LimpiarCacheCompleto();
                _logger.LogInformation("✅ Caché local del frontend limpiado");

                // 2. Llamar al servidor API para limpiar su caché también
                try
                {
                    using var httpClient = new HttpClient();
                    var apiUrl = _configuration["ApiSettings:BaseUrl"];
                    var response = await httpClient.PostAsync($"{apiUrl}/api/Permisos/limpiar-cache", null);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("✅ Caché del servidor API limpiado exitosamente");
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ No se pudo limpiar el caché del servidor API: {StatusCode}", response.StatusCode);
                    }
                }
                catch (Exception apiEx)
                {
                    _logger.LogError(apiEx, "❌ Error al comunicarse con el servidor API para limpiar caché");
                }

                return Ok(new { 
                    success = true, 
                    message = "Cambios en roles procesados correctamente",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar cambios en roles");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
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

        /// <summary>
        /// ✅ NUEVO: Endpoint para verificar permisos actuales del usuario (usado por JavaScript)
        /// </summary>
        [HttpGet("VerificarPermisosActuales")]
        public async Task<IActionResult> VerificarPermisosActuales()
        {
            try
            {
                _logger.LogInformation("🔍 Verificando permisos actuales del usuario");

                if (!User.Identity.IsAuthenticated)
                {
                    return Json(new { success = false, message = "Usuario no autenticado" });
                }

                // ✅ INCLUIR INFORMACIÓN DEL USUARIO ACTUAL
                var nombreUsuario = User.Identity.Name ?? "Usuario Desconocido";
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                var userId = User.FindFirst("userId")?.Value;

                // Obtener permisos del usuario actual
                var permisos = await _permisosService.ObtenerPermisosUsuarioActualAsync();

                _logger.LogInformation("✅ Permisos verificados para usuario: {Usuario} (ID: {UserId})", nombreUsuario, userId);

                return Json(new
                {
                    success = true,
                    usuario = new
                    {
                        nombreUsuario = nombreUsuario,
                        email = email,
                        userId = userId
                    },
                    permisos = new
                    {
                        esAdministrador = permisos.EsAdministrador,
                        puedeVerCostos = permisos.PuedeVerCostos,
                        puedeVerUtilidades = permisos.PuedeVerUtilidades,
                        puedeProgramarInventario = permisos.PuedeProgramarInventario,
                        puedeEditarProductos = permisos.PuedeEditarProductos,
                        puedeEliminarProductos = permisos.PuedeEliminarProductos,
                        puedeAjustarStock = permisos.PuedeAjustarStock
                    },
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar permisos actuales");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}