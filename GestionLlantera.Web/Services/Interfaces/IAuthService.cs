// Services/Interfaces/IAuthService.cs
using GestionLlantera.Web.Models.ViewModels;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IAuthService
    {

        // Método para hacer login
        Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(LoginViewModel model);

        // Nuevos métodos
        Task<(bool activo, bool expirado)> CheckUsuarioActivo(string token); Task<bool> ActivarCuenta(string token);
        Task<bool> RegenerarToken(string token);
        Task<bool> CambiarContrasena(string token, string nuevaContrasena);
        Task<bool> SolicitarRecuperacion(string email);
        Task<bool> RestablecerContrasena(string token, string nuevaContrasena);
    }
}
