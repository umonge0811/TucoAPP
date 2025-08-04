using GestionLlantera.Web.Models.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IUsuariosService
    {
        Task<List<UsuarioDTO>> ObtenerTodosAsync();
        Task<bool> CrearUsuarioAsync(CreateUsuarioDTO usuario);
        Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId);
        Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds);
        Task<bool> ActivarUsuarioAsync(int id);
        Task<bool> DesactivarUsuarioAsync(int id);
        Task<bool> EditarUsuarioAsync(int id, CreateUsuarioDTO modelo);
    }
}