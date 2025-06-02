using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace GestionLlantera.Web.TagHelpers
{
    /// <summary>
    /// TagHelper para el proyecto Web que verifica permisos basándose en los claims del usuario
    /// ✅ Funciona con la información del token JWT sin necesidad de servicios externos
    /// </summary>
    [HtmlTargetElement("*", Attributes = "asp-permiso")]
    public class PermisoTagHelper : TagHelper
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<PermisoTagHelper> _logger;

        public PermisoTagHelper(IHttpContextAccessor httpContextAccessor, ILogger<PermisoTagHelper> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// Nombre del permiso requerido - debe coincidir con los claims "Permission" del token JWT
        /// </summary>
        [HtmlAttributeName("asp-permiso")]
        public string Permiso { get; set; }

        /// <summary>
        /// Mensaje alternativo cuando no tiene permisos
        /// </summary>
        [HtmlAttributeName("asp-mensaje-sin-permiso")]
        public string MensajeSinPermiso { get; set; }

        public override Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            // Si no se especifica permiso, mostrar normalmente
            if (string.IsNullOrEmpty(Permiso))
            {
                return Task.CompletedTask;
            }

            var user = _httpContextAccessor.HttpContext?.User;
            
            // Usuario no autenticado - ocultar
            if (user == null || !user.Identity.IsAuthenticated)
            {
                _logger.LogDebug("TagHelper: Usuario no autenticado - ocultando elemento con permiso {Permiso}", Permiso);
                output.SuppressOutput();
                return Task.CompletedTask;
            }

            try
            {
                // ✅ VERIFICAR DIRECTAMENTE EN LOS CLAIMS DEL TOKEN JWT
                var tienePermiso = VerificarPermisoEnClaims(user, Permiso);
                
                _logger.LogDebug("TagHelper: Usuario {Usuario} - Permiso '{Permiso}' = {TienePermiso}", 
                    user.Identity.Name ?? "Desconocido", Permiso, tienePermiso);

                if (!tienePermiso)
                {
                    ProcesarSinPermiso(output);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verificando permiso '{Permiso}' para usuario {Usuario}", 
                    Permiso, user.Identity?.Name ?? "Desconocido");
                
                // En caso de error, ocultar por seguridad
                output.SuppressOutput();
            }

            return Task.CompletedTask;
        }

        /// <summary>
        /// Verifica si el usuario tiene el permiso basándose en los claims del token JWT
        /// </summary>
        private bool VerificarPermisoEnClaims(ClaimsPrincipal user, string nombrePermiso)
        {
            // Verificar en los claims "Permission" del token JWT
            var permisoClaims = user.Claims
                .Where(c => c.Type == "Permission")
                .Select(c => c.Value)
                .ToList();

            _logger.LogDebug("Permisos del usuario: {Permisos}", string.Join(", ", permisoClaims));

            // Verificar si tiene el permiso específico
            bool tienePermiso = permisoClaims.Contains(nombrePermiso);

            // ✅ TAMBIÉN VERIFICAR SI ES ADMINISTRADOR (tiene todos los permisos)
            if (!tienePermiso)
            {
                var roles = user.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList();

                tienePermiso = roles.Contains("Administrador") || roles.Contains("Admin");
                
                if (tienePermiso)
                {
                    _logger.LogDebug("Usuario es Administrador - permiso concedido automáticamente");
                }
            }

            return tienePermiso;
        }

        /// <summary>
        /// Procesa el elemento cuando el usuario no tiene permisos
        /// </summary>
        private void ProcesarSinPermiso(TagHelperOutput output)
        {
            if (!string.IsNullOrEmpty(MensajeSinPermiso))
            {
                // Mostrar mensaje personalizado
                output.TagName = "div";
                output.Attributes.Clear();
                output.Attributes.Add("class", "alert alert-warning d-inline-block");
                output.Attributes.Add("style", "padding: 5px 10px; margin: 2px; font-size: 0.9em;");
                output.Content.SetContent(MensajeSinPermiso);
            }
            else
            {
                // Comportamiento por defecto: ocultar completamente
                output.SuppressOutput();
            }
        }
    }
}