using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    // Este atributo asegura que solo usuarios autenticados puedan acceder
    [Authorize]
    public class ConfiguracionController : Controller
    {
        private readonly IRolesService _rolesService;
        private readonly ILogger<ConfiguracionController> _logger;

        public ConfiguracionController(IRolesService rolesService, ILogger<ConfiguracionController> logger)
        {
            _rolesService = rolesService;
            _logger = logger;
        }

        public async Task<IActionResult> RolesPermisos()
        {
            try
            {
                _logger.LogInformation("Intentando cargar roles y permisos");
                var roles = await _rolesService.ObtenerTodosLosRoles();
                return View(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar roles y permisos");
                // Agregar mensaje de error para el usuario
                TempData["Error"] = "Error al cargar la información de roles y permisos";
                return View(new List<RoleDTO>());
            }
        }
    }
}