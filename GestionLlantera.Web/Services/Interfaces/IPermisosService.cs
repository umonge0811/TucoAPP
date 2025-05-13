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
    }
}
