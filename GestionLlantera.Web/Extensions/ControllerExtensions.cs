
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Extensions
{
    /// <summary>
    /// Extensiones globales para controladores que permiten verificación de permisos
    /// Uso en cualquier controlador: var tienePermiso = await this.TienePermisoAsync("NombrePermiso");
    /// </summary>
    public static class ControllerExtensions
    {
        /// <summary>
        /// Verifica si el usuario actual tiene un permiso específico
        /// Uso: var tienePermiso = await this.TienePermisoAsync("VerCostos");
        /// </summary>
        public static async Task<bool> TienePermisoAsync(
            this ControllerBase controller,
            string permiso)
        {
            try
            {
                var permisosService = controller.HttpContext.RequestServices
                    .GetService<IPermisosService>();

                if (permisosService == null)
                {
                    var loggerFactory = controller.HttpContext.RequestServices
                        .GetService<ILoggerFactory>();
                    var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                    logger?.LogError("IPermisosService no está registrado en el contenedor de dependencias");
                    return false;
                }

                var usuario = controller.User.Identity?.Name ?? "Usuario desconocido";
                var resultado = await permisosService.TienePermisoAsync(permiso);

                // Log para debugging
                var logger2 = controller.HttpContext.RequestServices.GetService<ILogger<ControllerExtensions>>();
                logger2?.LogInformation("🔐 Usuario {Usuario} {Resultado} permiso {Permiso}", 
                    usuario, resultado ? "TIENE" : "NO TIENE", permiso);

                return resultado;
            }
            catch (Exception ex)
            {
                var logger = controller.HttpContext.RequestServices.GetService<ILogger<ControllerExtensions>>();
                logger?.LogError(ex, "❌ Error verificando permiso {Permiso}", permiso);
                return false;
            }
        }

        /// <summary>
        /// Método de conveniencia para verificar permisos en controladores MVC (con TempData)
        /// Uso específico para controladores MVC que heredan de Controller
        /// MEJORADO: Redirige al Dashboard con mensaje amigable
        /// </summary>
        public static async Task<IActionResult?> ValidarPermisoMvcAsync(
            this Controller controller,
            string permiso,
            string? mensajePersonalizado = null,
            string? accionRedireccion = "Index",
            string? controladorRedireccion = "Dashboard")
        {
            try
            {
                var tienePermiso = await ((ControllerBase)controller).TienePermisoAsync(permiso);

                if (!tienePermiso)
                {
                    // ✅ MENSAJE MÁS AMIGABLE Y PROFESIONAL
                    var mensaje = mensajePersonalizado ??
                        $"🔒 Acceso restringido: No tienes permisos para acceder a esta función. Contacta al administrador.";

                    // ✅ LOGGING PARA AUDITORÍA
                    var loggerFactory = controller.HttpContext.RequestServices
                        .GetService<ILoggerFactory>();
                    var logger = loggerFactory?.CreateLogger("AccesoRestringido");
                    logger?.LogWarning("🚫 Acceso denegado - Usuario: {Usuario}, Permiso: {Permiso}, URL: {Url}",
                        controller.User.Identity?.Name ?? "Anónimo",
                        permiso,
                        controller.HttpContext.Request.Path);

                    // ✅ TEMPDATA CON CATEGORÍA ESPECÍFICA
                    controller.TempData["AccessDenied"] = mensaje;
                    controller.TempData["AccessDeniedPermiso"] = permiso;
                    controller.TempData["AccessDeniedTimestamp"] = DateTime.Now.ToString("HH:mm:ss");

                    // ✅ SIEMPRE REDIRIGE AL DASHBOARD
                    return controller.RedirectToAction(accionRedireccion, controladorRedireccion);
                }

                return null; // null significa que SÍ tiene permiso, continuar
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices
                    .GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                logger?.LogError(ex, "Error al validar permiso {Permiso}", permiso);

                // En caso de error, denegar acceso por seguridad
                if (controller is Controller controllerConTempData)
                {
                    controllerConTempData.TempData["Error"] = "Error al verificar permisos";
                    return controllerConTempData.RedirectToAction("Index", "Dashboard");
                }
                else
                {
                    return controller.StatusCode(500, new
                    {
                        message = "Error al verificar permisos",
                        timestamp = DateTime.Now
                    });
                }
            }
        }

        /// <summary>
        /// Verifica múltiples permisos (requiere TODOS)
        /// Uso: var tieneTodos = await this.TieneTodosLosPermisosAsync("VerCostos", "EditarProductos");
        /// </summary>
        public static async Task<bool> TieneTodosLosPermisosAsync(
            this ControllerBase controller,
            params string[] permisos)
        {
            if (permisos == null || permisos.Length == 0)
                return false;

            try
            {
                foreach (var permiso in permisos)
                {
                    if (!await controller.TienePermisoAsync(permiso))
                        return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices
                    .GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                logger?.LogError(ex, "Error al verificar múltiples permisos");
                return false;
            }
        }

        /// <summary>
        /// Verifica múltiples permisos (requiere AL MENOS UNO)
        /// Uso: var tieneAlguno = await this.TieneAlgunPermisoAsync("VerCostos", "VerUtilidades");
        /// </summary>
        public static async Task<bool> TieneAlgunPermisoAsync(
            this ControllerBase controller,
            params string[] permisos)
        {
            if (permisos == null || permisos.Length == 0)
                return false;

            try
            {
                foreach (var permiso in permisos)
                {
                    if (await controller.TienePermisoAsync(permiso))
                        return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices
                    .GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                logger?.LogError(ex, "Error al verificar múltiples permisos");
                return false;
            }
        }

        /// <summary>
        /// Obtiene información detallada de permisos del usuario actual
        /// </summary>
        public static async Task<object> ObtenerInfoPermisosAsync(
            this ControllerBase controller)
        {
            if (controller.User == null || !controller.User.Identity.IsAuthenticated)
            {
                return new { autenticado = false, permisos = new string[0] };
            }

            return new
            {
                autenticado = true,
                usuario = controller.User.Identity.Name,
                roles = controller.User.Claims
                    .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToArray()
            };
        }

        /// <summary>
        /// Obtiene todos los permisos del usuario actual
        /// Uso: var misPermisos = await this.ObtenerMisPermisosAsync();
        /// </summary>
        public static async Task<List<string>> ObtenerMisPermisosAsync(this ControllerBase controller)
        {
            try
            {
                var permisosService = controller.HttpContext.RequestServices
                    .GetService<IPermisosGlobalService>();

                if (permisosService == null)
                    return new List<string>();

                return await permisosService.ObtenerMisPermisosAsync();
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices
                    .GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                logger?.LogError(ex, "Error al obtener permisos del usuario");
                return new List<string>();
            }
        }

        /// <summary>
        /// Verifica si el usuario actual es administrador
        /// Uso: var esAdmin = await this.EsAdministradorAsync();
        /// </summary>
        public static async Task<bool> EsAdministradorAsync(this ControllerBase controller)
        {
            try
            {
                var permisosService = controller.HttpContext.RequestServices
                    .GetService<IPermisosGlobalService>();

                if (permisosService == null)
                    return false;

                return await permisosService.EsAdministradorAsync();
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices
                    .GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                logger?.LogError(ex, "Error al verificar si es administrador");
                return false;
            }
        }
    }
}
