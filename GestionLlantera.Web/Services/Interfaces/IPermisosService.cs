using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IPermisosService
    {
        Task<List<PermisoDTO>> ObtenerTodosLosPermisos();
        Task<PermisoDTO> ObtenerPermisoPorId(int permisoId);
        Task<bool> CrearPermiso(PermisoDTO permiso);
        Task<bool> ActualizarPermiso(int permisoId, PermisoDTO permiso);
        Task<bool> EliminarPermiso(int permisoId);

        // ✅ NUEVOS MÉTODOS (Verificación de permisos del usuario)
        Task<PermisosUsuarioActual> ObtenerPermisosUsuarioActualAsync();
        Task<bool> TienePermisoAsync(string nombrePermiso);
        Task RefrescarPermisosAsync();
        void LimpiarCacheCompleto();
        PermisosUsuarioActual PermisosActuales { get; }
    }

    /// <summary>
    /// Clase que representa los permisos del usuario actual
    /// </summary>
    public class PermisosUsuarioActual
    {
        public bool PuedeVerCostos { get; set; } = false;
        public bool PuedeVerUtilidades { get; set; } = false;
        public bool PuedeProgramarInventario { get; set; } = false;
        public bool PuedeEditarProductos { get; set; } = false;
        public bool PuedeEliminarProductos { get; set; } = false;
        public bool PuedeAjustarStock { get; set; } = false;
        public bool EsAdministrador { get; set; } = false;

        /// <summary>
        /// Indica si el usuario tiene algún permiso administrativo
        /// </summary>
        public bool TienePermisosAdministrativos =>
            EsAdministrador || PuedeVerCostos || PuedeVerUtilidades || PuedeProgramarInventario;

        /// <summary>
        /// Indica si el usuario tiene permisos completos de inventario
        /// </summary>
        public bool TienePermisosInventarioCompleto =>
            EsAdministrador || (PuedeEditarProductos && PuedeEliminarProductos && PuedeAjustarStock);
    }
}
