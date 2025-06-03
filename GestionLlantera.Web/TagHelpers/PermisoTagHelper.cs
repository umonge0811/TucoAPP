using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Http;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.TagHelpers
{
    /// <summary>
    /// TagHelper GLOBAL para verificar permisos en todo el sistema
    /// ✅ Se conecta dinámicamente con la API
    /// ✅ Funciona con todos los módulos del sistema
    /// ✅ Cache integrado para optimización
    /// </summary>
    [HtmlTargetElement("*", Attributes = "asp-permiso")]
    public class PermisoTagHelper : TagHelper
    {
        private readonly IPermisosGlobalService _permisosService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<PermisoTagHelper> _logger;

        public PermisoTagHelper(
            IPermisosGlobalService permisosService,
            IHttpContextAccessor httpContextAccessor,
            ILogger<PermisoTagHelper> logger)
        {
            _permisosService = permisosService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// Nombre del permiso requerido
        /// Ejemplo: asp-permiso="VerCostos"
        /// </summary>
        [HtmlAttributeName("asp-permiso")]
        public string Permiso { get; set; }

        /// <summary>
        /// Mensaje alternativo cuando no tiene permisos
        /// Ejemplo: asp-mensaje-sin-permiso="Solo administradores"
        /// </summary>
        [HtmlAttributeName("asp-mensaje-sin-permiso")]
        public string MensajeSinPermiso { get; set; }

        /// <summary>
        /// Comportamiento inverso: mostrar solo si NO tiene el permiso
        /// Ejemplo: asp-invertir="true"
        /// </summary>
        [HtmlAttributeName("asp-invertir")]
        public bool Invertir { get; set; } = false;

        /// <summary>
        /// Aplicar estilos específicos cuando no tiene permisos
        /// Ejemplo: asp-clase-sin-permiso="disabled opacity-50"
        /// </summary>
        [HtmlAttributeName("asp-clase-sin-permiso")]
        public string ClaseSinPermiso { get; set; }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            // Si no se especifica permiso, mostrar normalmente
            if (string.IsNullOrEmpty(Permiso))
            {
                _logger.LogDebug("TagHelper usado sin especificar permiso en elemento {TagName}", output.TagName);
                return;
            }

            var user = _httpContextAccessor.HttpContext?.User;

            // Usuario no autenticado - ocultar por seguridad
            if (user == null || !user.Identity.IsAuthenticated)
            {
                _logger.LogDebug("TagHelper: Usuario no autenticado - procesando elemento con permiso {Permiso}", Permiso);
                ProcesarSinPermiso(output);
                return;
            }

            try
            {
                // ✅ VERIFICACIÓN GLOBAL USANDO EL SERVICIO
                var tienePermiso = await _permisosService.TienePermisoAsync(Permiso);

                _logger.LogDebug("TagHelper: Usuario {Usuario} - Permiso '{Permiso}' = {TienePermiso}",
                    user.Identity.Name ?? "Desconocido", Permiso, tienePermiso);

                // Aplicar lógica según configuración
                var debeOcultar = Invertir ? tienePermiso : !tienePermiso;

                if (debeOcultar)
                {
                    ProcesarSinPermiso(output);
                }
                else
                {
                    // Si tiene permiso y no hay que ocultar, el elemento se muestra normalmente
                    _logger.LogDebug("TagHelper: Mostrando elemento - Usuario tiene permiso {Permiso}", Permiso);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verificando permiso '{Permiso}' para usuario {Usuario}",
                    Permiso, user.Identity?.Name ?? "Desconocido");

                // En caso de error, ocultar por seguridad (a menos que sea comportamiento invertido)
                if (!Invertir)
                {
                    ProcesarSinPermiso(output);
                }
            }
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
            else if (!string.IsNullOrEmpty(ClaseSinPermiso))
            {
                // Aplicar clase CSS personalizada en lugar de ocultar
                var claseActual = output.Attributes["class"]?.Value?.ToString() ?? "";
                output.Attributes.SetAttribute("class", $"{claseActual} {ClaseSinPermiso}".Trim());
            }
            else
            {
                // Comportamiento por defecto: ocultar completamente
                output.SuppressOutput();
            }
        }
    }
}