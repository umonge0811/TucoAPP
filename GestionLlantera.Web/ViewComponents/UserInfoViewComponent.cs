using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GestionLlantera.Web.ViewComponents
{
    public class UserInfoViewComponent : ViewComponent
    {
        private readonly ILogger<UserInfoViewComponent> _logger;

        public UserInfoViewComponent(ILogger<UserInfoViewComponent> logger)
        {
            _logger = logger;
        }

        public IViewComponentResult Invoke()
        {
            try
            {
                var userEmail = User.Identity?.Name;
                if (string.IsNullOrEmpty(userEmail))
                {
                    return View(new UserInfoViewModel
                    {
                        UserName = "Usuario",
                        Roles = new List<string> { "Sin rol" }
                    });
                }

                // Convertir User a ClaimsPrincipal para poder acceder a Claims
                var claimsPrincipal = User as ClaimsPrincipal;

                // Obtener los roles del usuario desde los claims
                var roles = claimsPrincipal?.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList() ?? new List<string>();

                return View(new UserInfoViewModel
                {
                    UserName = userEmail,
                    Roles = roles.Any() ? roles : new List<string> { "Usuario" }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener información del usuario");
                return View(new UserInfoViewModel
                {
                    UserName = User.Identity?.Name ?? "Usuario",
                    Roles = new List<string> { "Usuario" }
                });
            }
        }
    }

    public class UserInfoViewModel
    {
        public string UserName { get; set; } = "Usuario";
        public List<string> Roles { get; set; } = new List<string>();
    }
}