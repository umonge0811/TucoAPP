// Services/Interfaces/IRolesService.cs
namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IRolesService
    {
        Task<List<RoleDTO>> ObtenerTodosLosRoles();

        // Nuevos métodos para gestión de roles
        Task<RoleDTO> ObtenerRolPorId(int rolId);
        Task<bool> CrearRol(RoleDTO rol);
        Task<bool> ActualizarRol(int rolId, RoleDTO rol);
        Task<bool> EliminarRol(int rolId);

        // Métodos para gestión de permisos de roles
        Task<List<PermisoDTO>> ObtenerPermisosDeRol(int rolId);
        Task<List<PermisoDTO>> ObtenerTodosLosPermisos();
        Task<bool> AsignarPermisosARol(int rolId, List<int> permisoIds);
        Task<bool> ActualizarPermisosDeRol(int rolId, List<int> permisoIds);
    }
}