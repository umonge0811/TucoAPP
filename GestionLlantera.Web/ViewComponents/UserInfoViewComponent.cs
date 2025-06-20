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
            _logger.LogInformation("🚀 UserInfoViewComponent CONSTRUCTOR EJECUTADO 🚀");
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

                var claimsPrincipal = User as ClaimsPrincipal;
                var roles = new List<string>();

                // Buscar roles en claims estándar
                var standardRoles = claimsPrincipal?.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList() ?? new List<string>();

                // Buscar en claims JWT
                var jwtRoles = claimsPrincipal?.Claims
                    .Where(c => c.Type == "role")
                    .Select(c => c.Value)
                    .ToList() ?? new List<string>();

                roles.AddRange(standardRoles);
                roles.AddRange(jwtRoles);
                roles = roles.Distinct().ToList();

                var viewModel = new UserInfoViewModel
                {
                    UserName = userEmail,
                    Roles = roles.Any() ? roles : new List<string> { "Usuario" }
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener información del usuario");
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