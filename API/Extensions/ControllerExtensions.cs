using Microsoft.AspNetCore.Mvc;
using API.ServicesAPI.Interfaces;
using System.Security.Claims;

namespace API.Extensions
{
    /// <summary>
    /// Extensiones para controladores que permiten verificación dinámica de permisos
    /// ✅ COMPLETAMENTE AUTOMÁTICO - Funciona con cualquier permiso creado desde la interfaz
    /// </summary>
    public static class ControllerExtensions
    {
        /// <summary>
        /// Verifica si el usuario actual tiene un permiso específico
        /// </summary>
        /// <param name="controller">El controlador actual</param>
        /// <param name="permisosService">Servicio de permisos</param>
        /// <param name="nombrePermiso">Nombre exacto del permiso en la BD</param>
        /// <returns>True si tiene el permiso, False si no</returns>
        public static async Task<bool> TienePermisoAsync(
            this ControllerBase controller,
            IPermisosService permisosService,
            string nombrePermiso)
        {
            try
            {
                var loggerFactory = controller.HttpContext.RequestServices.GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("TienePermisoAsync");
                
                logger?.LogInformation("🔎 === VERIFICANDO PERMISO ===");
                logger?.LogInformation("🔎 Permiso: '{NombrePermiso}'", nombrePermiso);

                if (string.IsNullOrEmpty(nombrePermiso))
                {
                    logger?.LogWarning("🔎 Permiso vacío o nulo");
                    return false;
                }

                if (controller.User == null || !controller.User.Identity.IsAuthenticated)
                {
                    logger?.LogWarning("🔎 Usuario no autenticado o nulo");
                    return false;
                }

                logger?.LogInformation("🔎 Usuario autenticado: {Usuario}", controller.User.Identity.Name);

                var resultado = await permisosService.TienePermisoAsync(controller.User, nombrePermiso);
                logger?.LogInformation("🔎 Resultado del servicio: {Resultado}", resultado);
                logger?.LogInformation("🔎 === FIN VERIFICACIÓN PERMISO ===");

                return resultado;
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices.GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("TienePermisoAsync");
                logger?.LogError(ex, "❌ Error verificando permiso {Permiso}", nombrePermiso);
                return false;
            }
        }

        /// <summary>
        /// Verifica permiso y retorna Forbid() si no lo tiene
        /// Uso: var resultado = await this.ValidarPermisoAsync(_permisosService, "VerCostos");
        ///      if (resultado != null) return resultado;
        /// </summary>
        public static async Task<IActionResult?> ValidarPermisoAsync(
            this ControllerBase controller,
            IPermisosService permisosService,
            string nombrePermiso,
            string? mensajePersonalizado = null)
        {
            try
            {
                // ✅ LOGGING DETALLADO PARA DIAGNÓSTICO
                var loggerFactory = controller.HttpContext.RequestServices.GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ValidarPermisoAsync");
                
                logger?.LogInformation("🔍 === INICIO VALIDACIÓN DE PERMISO ===");
                logger?.LogInformation("🔍 Permiso solicitado: '{NombrePermiso}'", nombrePermiso);
                logger?.LogInformation("🔍 Usuario: {Usuario}", controller.User.Identity?.Name ?? "Anónimo");
                logger?.LogInformation("🔍 Controlador: {Controlador}", controller.GetType().Name);
                logger?.LogInformation("🔍 Acción: {Accion}", controller.ControllerContext.ActionDescriptor.ActionName);

                // Verificar autenticación
                if (!controller.User.Identity?.IsAuthenticated ?? true)
                {
                    logger?.LogWarning("⚠️ Usuario no autenticado");
                    return controller.StatusCode(401, new
                    {
                        message = "Usuario no autenticado",
                        permisoRequerido = nombrePermiso,
                        tienePermiso = false
                    });
                }

                // Obtener ID del usuario para logging
                var userId = permisosService.ObtenerUsuarioId(controller.User);
                logger?.LogInformation("🔍 ID Usuario obtenido: {UserId}", userId);

                // Verificar si es administrador
                var esAdministrador = await permisosService.EsAdministradorAsync(controller.User);
                logger?.LogInformation("🔍 Es administrador: {EsAdministrador}", esAdministrador);

                // Llamar al método principal de verificación
                var tienePermiso = await controller.TienePermisoAsync(permisosService, nombrePermiso);
                logger?.LogInformation("🔍 Resultado TienePermisoAsync: {TienePermiso}", tienePermiso);

                if (!tienePermiso)
                {
                    logger?.LogWarning("🚫 PERMISO DENEGADO - Usuario: {Usuario}, Permiso: {Permiso}", 
                        controller.User.Identity?.Name, nombrePermiso);

                    return controller.StatusCode(403, new
                    {
                        message = mensajePersonalizado ?? $"No tienes permisos para realizar esta acción. Permiso requerido: {nombrePermiso}",
                        permisoRequerido = nombrePermiso,
                        tienePermiso = false,
                        usuario = controller.User.Identity?.Name,
                        esAdministrador = esAdministrador,
                        userId = userId
                    });
                }

                logger?.LogInformation("✅ PERMISO CONCEDIDO - Usuario: {Usuario}, Permiso: {Permiso}", 
                    controller.User.Identity?.Name, nombrePermiso);
                logger?.LogInformation("🔍 === FIN VALIDACIÓN DE PERMISO (EXITOSA) ===");

                return null; // null significa que SÍ tiene permiso, continuar
            }
            catch (Exception ex)
            {
                var loggerFactory = controller.HttpContext.RequestServices.GetService<ILoggerFactory>();
                var logger = loggerFactory?.CreateLogger("ValidarPermisoAsync");
                logger?.LogError(ex, "❌ ERROR EN VALIDACIÓN DE PERMISO: {Permiso}", nombrePermiso);

                // En caso de error, denegar por seguridad
                return controller.StatusCode(500, new
                {
                    message = "Error interno al validar permisos",
                    permisoRequerido = nombrePermiso,
                    tienePermiso = false,
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Verifica múltiples permisos (requiere TODOS)
        /// </summary>
        public static async Task<bool> TieneTodosLosPermisosAsync(
            this ControllerBase controller,
            IPermisosService permisosService,
            params string[] nombresPermisos)
        {
            if (nombresPermisos == null || nombresPermisos.Length == 0)
                return false;

            foreach (var permiso in nombresPermisos)
            {
                if (!await controller.TienePermisoAsync(permisosService, permiso))
                    return false;
            }

            return true;
        }

        /// <summary>
        /// Verifica múltiples permisos (requiere AL MENOS UNO)
        /// </summary>
        public static async Task<bool> TieneAlgunPermisoAsync(
            this ControllerBase controller,
            IPermisosService permisosService,
            params string[] nombresPermisos)
        {
            if (nombresPermisos == null || nombresPermisos.Length == 0)
                return false;

            foreach (var permiso in nombresPermisos)
            {
                if (await controller.TienePermisoAsync(permisosService, permiso))
                    return true;
            }

            return false;
        }

        /// <summary>
        /// Obtiene información detallada de permisos del usuario actual
        /// </summary>
        public static async Task<object> ObtenerInfoPermisosAsync(
            this ControllerBase controller,
            IPermisosService permisosService)
        {
            if (controller.User == null || !controller.User.Identity.IsAuthenticated)
            {
                return new { autenticado = false, permisos = new string[0] };
            }

            // Aquí podrías expandir para obtener todos los permisos del usuario
            // Por ahora retornamos info básica
            return new
            {
                autenticado = true,
                usuario = controller.User.Identity.Name,
                roles = controller.User.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToArray()
            };
        }

        /// <summary>
        /// Obtiene el ID del usuario autenticado
        /// </summary>
        public static int ObtenerUsuarioIdDesdeToken(
            this ControllerBase controller,
            IPermisosService permisosService)
        {
            if (controller.User == null || !controller.User.Identity.IsAuthenticated)
            {
                throw new UnauthorizedAccessException("Usuario no autenticado");
            }

            return permisosService.ObtenerUsuarioId(controller.User);
        }
    }
}