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
                _logger.LogInformation("🔥 USERINFO VIEWCOMPONENT SE ESTÁ EJECUTANDO 🔥");
                
                var userEmail = User.Identity?.Name;
                _logger.LogInformation("📧 Email obtenido: {Email}", userEmail ?? "NULL");
                
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("⚠️ No hay email, retornando usuario genérico");
                    return View(new UserInfoViewModel
                    {
                        UserName = "Usuario",
                        Roles = new List<string> { "Sin rol" }
                    });
                }

                // Convertir User a ClaimsPrincipal para poder acceder a Claims
                var claimsPrincipal = User as ClaimsPrincipal;

                // ✅ AGREGAR LOGGING PARA DEBUGGEAR LOS CLAIMS
                _logger.LogInformation("🔍 === USERINFO DEBUGGING CLAIMS ===");
                if (claimsPrincipal?.Claims != null)
                {
                    foreach (var claim in claimsPrincipal.Claims)
                    {
                        _logger.LogInformation($"Claim Type: {claim.Type}, Value: {claim.Value}");
                    }
                }

                // ✅ BUSCAR ROLES EN DIFERENTES TIPOS DE CLAIMS
                var roles = new List<string>();

                // Buscar en ClaimTypes.Role (estándar)
                var standardRoles = claimsPrincipal?.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList() ?? new List<string>();

                // Buscar en "role" (común en JWT)
                var jwtRoles = claimsPrincipal?.Claims
                    .Where(c => c.Type == "role")
                    .Select(c => c.Value)
                    .ToList() ?? new List<string>();

                // Buscar en "roles" (también común)
                var rolesPlural = claimsPrincipal?.Claims
                    .Where(c => c.Type == "roles")
                    .Select(c => c.Value)
                    .ToList() ?? new List<string>();

                // Combinar todos los roles encontrados
                roles.AddRange(standardRoles);
                roles.AddRange(jwtRoles);
                roles.AddRange(rolesPlural);

                // Eliminar duplicados
                roles = roles.Distinct().ToList();

                _logger.LogInformation("🎯 Roles encontrados: {Roles}", string.Join(", ", roles));

                var viewModel = new UserInfoViewModel
                {
                    UserName = userEmail,
                    Roles = roles.Any() ? roles : new List<string> { "Usuario" }
                };

                _logger.LogInformation("📋 ViewModel final - Usuario: {Usuario}, Roles: {Roles}", 
                    viewModel.UserName, string.Join(", ", viewModel.Roles));

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