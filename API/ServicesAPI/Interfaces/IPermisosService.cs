using System.Security.Claims;

namespace API.Services.Interfaces
{
    /// <summary>
    /// Servicio para gestionar permisos de manera dinámica desde la base de datos
    /// </summary>
    public interface IPermisosService
    {
        /// <summary>
        /// Verifica si un usuario tiene un permiso específico
        /// </summary>
        /// <param name="user">Claims del usuario</param>
        /// <param name="nombrePermiso">Nombre del permiso a verificar</param>
        /// <returns>True si tiene el permiso, False en caso contrario</returns>
        Task<bool> TienePermisoAsync(ClaimsPrincipal user, string nombrePermiso);

        /// <summary>
        /// Obtiene todos los permisos de un usuario
        /// </summary>
        /// <param name="userId">ID del usuario</param>
        /// <returns>Lista de nombres de permisos</returns>
        Task<List<string>> ObtenerPermisosUsuarioAsync(int userId);

        /// <summary>
        /// Obtiene todos los permisos disponibles en el sistema
        /// </summary>
        /// <returns>Lista de todos los permisos</returns>
        Task<List<string>> ObtenerTodosLosPermisosAsync();

        /// <summary>
        /// Verifica si un usuario tiene un rol específico
        /// </summary>
        /// <param name="user">Claims del usuario</param>
        /// <param name="nombreRol">Nombre del rol a verificar</param>
        /// <returns>True si tiene el rol, False en caso contrario</returns>
        Task<bool> TieneRolAsync(ClaimsPrincipal user, string nombreRol);

        /// <summary>
        /// Obtiene el ID del usuario desde los claims
        /// </summary>
        /// <param name="user">Claims del usuario</param>
        /// <returns>ID del usuario o null si no se encuentra</returns>
        int? ObtenerUsuarioId(ClaimsPrincipal user);

        /// <summary>
        /// Verifica si el usuario es administrador
        /// </summary>
        /// <param name="user">Claims del usuario</param>
        /// <returns>True si es administrador</returns>
        Task<bool> EsAdministradorAsync(ClaimsPrincipal user);

        /// <summary>
        /// Refresca los permisos en caché (útil cuando se modifican permisos)
        /// </summary>
        Task RefrescarCachePermisosAsync();
    }
}