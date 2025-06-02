namespace GestionLlantera.Web.Services.Interfaces
{
    /// <summary>
    /// Servicio global para verificación de permisos en todo el sistema
    /// </summary>
    public interface IPermisosGlobalService
    {
        /// <summary>
        /// Verifica si el usuario actual tiene un permiso específico
        /// </summary>
        Task<bool> TienePermisoAsync(string permiso);

        /// <summary>
        /// Verifica múltiples permisos de una vez
        /// </summary>
        Task<Dictionary<string, bool>> TienePermisosAsync(params string[] permisos);

        /// <summary>
        /// Verifica si el usuario actual es administrador
        /// </summary>
        Task<bool> EsAdministradorAsync();

        /// <summary>
        /// Obtiene todos los permisos del usuario actual
        /// </summary>
        Task<List<string>> ObtenerMisPermisosAsync();

        /// <summary>
        /// Limpia el cache de permisos
        /// </summary>
        void LimpiarCache();
    }
}