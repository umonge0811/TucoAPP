using GestionLlantera.Web.Models.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IUsuariosService
    {
        Task<List<UsuarioDTO>> ObtenerTodosAsync();
        Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId);
        Task<bool> CrearUsuarioAsync(CreateUsuarioDTO usuario);
        Task<bool> ActivarUsuarioAsync(int id);
        Task<bool> DesactivarUsuarioAsync(int id);
        Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds);
    }
}
