// Services/Interfaces/IRolesService.cs
namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IRolesService
    {
        Task<List<RoleDTO>> ObtenerTodosLosRoles();
    }
}