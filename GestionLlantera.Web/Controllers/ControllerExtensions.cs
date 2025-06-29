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
                    .GetService<IPermisosGlobalService>();

                if (permisosService == null)
                {
                    var loggerFactory = controller.HttpContext.RequestServices
                        .GetService<ILoggerFactory>();
                    var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                    logger?.LogError("IPermisosGlobalService no está registrado en el contenedor de dependencias");
                    return false;
                }

                return await permisosService.TienePermisoAsync(permiso);
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices
                    .GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ControllerExtensions");
                logger?.LogError(ex, "Error al verificar permiso {Permiso}", permiso);
                return false;
            }
        }

        /// <summary>
        /// Verifica permiso y retorna resultado de acción si no lo tiene
        /// Uso: var validacion = await this.ValidarPermisoAsync("EditarProductos");
        ///      if (validacion != null) return validacion;
        /// </summary>
        public static async Task<IActionResult?> ValidarPermisoAsync(
            this ControllerBase controller,
            string permiso,
            string? mensajePersonalizado = null)
        {
            try
            {
                var tienePermiso = await controller.TienePermisoAsync(permiso);

                if (!tienePermiso)
                {
                    var mensaje = mensajePersonalizado ??
                        $"No tienes permisos para realizar esta acción. Permiso requerido: {permiso}";

                    // ✅ USAR DIFERENTES MÉTODOS SEGÚN EL TIPO DE CONTROLADOR
                    if (controller is Controller controllerConTempData)
                    {
                        // Si es un Controller completo, usar TempData
                        controllerConTempData.TempData["Error"] = mensaje;
                        return controllerConTempData.RedirectToAction("Index", "Home");
                    }
                    else
                    {
                        // Si es ControllerBase (API), retornar Forbid con mensaje
                        return controller.StatusCode(403, new
                        {
                            message = mensaje,
                            permiso = permiso,
                            timestamp = DateTime.Now
                        });
                    }
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
                    return controllerConTempData.RedirectToAction("Index", "Home");
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
                logger?.LogError(ex, "Error al verificar permisos múltiples");
                return false;
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
        /// Método de conveniencia para verificar permisos en controladores MVC (con TempData)
        /// Uso específico para controladores MVC que heredan de Controller
        /// MEJORADO: Redirige al Dashboard con mensaje amigable
        /// </summary>
        public static async Task<IActionResult?> ValidarPermisoMvcAsync(
            this Controller controller,
            string permiso,
            string? mensajePersonalizado = null,
            string? accionRedireccion = "Index",
            string? controladorRedireccion = "Dashboard") // ✅ CAMBIO: Dashboard por defecto
        {
            try
            {
                var tienePermiso = await ((ControllerBase)controller).TienePermisoAsync(permiso);

                if (!tienePermiso)
                {
                    // ✅ MENSAJE MÁS AMIGABLE Y PROFESIONAL
                    var mensaje = mensajePersonalizado ??
                        $"🔒 Acceso restringido: No tienes permisos para acceder a esta función. Contacta al administrador si necesitas acceso.";

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
                logger?.LogError(ex, "Error al validar permiso MVC {Permiso}", permiso);

                // ✅ EN CASO DE ERROR, TAMBIÉN AL DASHBOARD
                controller.TempData["Error"] = "🛠️ Error interno del sistema. Inténtalo nuevamente o contacta al soporte técnico.";
                return controller.RedirectToAction(accionRedireccion, controladorRedireccion);
            }
        }
    }
}