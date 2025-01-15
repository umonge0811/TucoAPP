// Services/Interfaces/IAuthService.cs
using GestionLlantera.Web.Models.ViewModels;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IAuthService
    {
        // Método para hacer login
        Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(LoginViewModel model);
    }
}