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
            if (string.IsNullOrEmpty(nombrePermiso))
                return false;

            if (controller.User == null || !controller.User.Identity.IsAuthenticated)
                return false;

            return await permisosService.TienePermisoAsync(controller.User, nombrePermiso);
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
            if (!await controller.TienePermisoAsync(permisosService, nombrePermiso))
            {
                return controller.StatusCode(403, new
                {
                    message = mensajePersonalizado ?? $"No tienes permisos para realizar esta acción. Permiso requerido: {nombrePermiso}",
                    permisoRequerido = nombrePermiso,
                    tienePermiso = false
                });
            }

            return null; // null significa que SÍ tiene permiso, continuar
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
    }
}