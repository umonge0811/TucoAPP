
using Tuco.Clases.DTOs;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace API.ServicesAPI.Interfaces
{
    public interface IRolesService
    {
        Task<List<RoleDTO>> ObtenerTodosLosRoles();
        Task<RoleDTO> ObtenerRolPorId(int rolId);
        Task<bool> CrearRol(RoleDTO rol);
        Task<bool> ActualizarRol(int rolId, RoleDTO rol);
        Task<bool> EliminarRol(int rolId);
        Task<List<PermisoDTO>> ObtenerPermisosDeRol(int rolId);
        Task<List<PermisoDTO>> ObtenerTodosLosPermisos();
        Task<bool> AsignarPermisosARol(int rolId, List<int> permisoIds);
        Task<bool> ActualizarPermisosDeRol(int rolId, List<int> permisoIds);
    }
}
