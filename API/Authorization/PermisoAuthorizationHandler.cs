using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace API.Authorization
{
    /// <summary>
    /// Requirement para permisos dinámicos
    /// </summary>
    public class PermisoRequirement : IAuthorizationRequirement
    {
        public string NombrePermiso { get; }

        public PermisoRequirement(string nombrePermiso)
        {
            NombrePermiso = nombrePermiso;
        }
    }

    /// <summary>
    /// Handler que verifica permisos dinámicamente contra la base de datos
    /// </summary>
    public class PermisoAuthorizationHandler : AuthorizationHandler<PermisoRequirement>
    {
        private readonly IPermisosService _permisosService;
        private readonly ILogger<PermisoAuthorizationHandler> _logger;

        public PermisoAuthorizationHandler(IPermisosService permisosService, ILogger<PermisoAuthorizationHandler> logger)
        {
            _permisosService = permisosService;
            _logger = logger;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermisoRequirement requirement)
        {
            try
            {
                _logger.LogInformation("Verificando permiso {Permiso} para usuario", requirement.NombrePermiso);

                // ✅ Verificar si el usuario tiene el permiso
                var tienePermiso = await _permisosService.TienePermisoAsync(context.User, requirement.NombrePermiso);

                if (tienePermiso)
                {
                    _logger.LogInformation("Permiso {Permiso} CONCEDIDO", requirement.NombrePermiso);
                    context.Succeed(requirement);
                }
                else
                {
                    _logger.LogWarning("Permiso {Permiso} DENEGADO", requirement.NombrePermiso);
                    context.Fail();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar permiso {Permiso}", requirement.NombrePermiso);
                context.Fail();
            }
        }
    }

    /// <summary>
    /// Clase estática para facilitar la creación de policies dinámicas
    /// </summary>
    public static class PermisosPolicies
    {
        /// <summary>
        /// Crea una policy para un permiso específico
        /// </summary>
        public static void AgregarPolicyPermiso(this AuthorizationOptions options, string nombrePolicy, string nombrePermiso)
        {
            options.AddPolicy(nombrePolicy, policy =>
                policy.Requirements.Add(new PermisoRequirement(nombrePermiso)));
        }
    }
}