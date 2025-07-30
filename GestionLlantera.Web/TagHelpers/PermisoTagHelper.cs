using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Http;
using GestionLlantera.Web.Services.Interfaces;
using GestionLlantera.Web.Services;

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
            try
            {
                // Verificar si el usuario está autenticado
                if (!_httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? true)
                {
                    output.SuppressOutput();
                    return;
                }

                var permisosService = _httpContextAccessor.HttpContext.RequestServices
                    .GetRequiredService<IPermisosService>();

                // ✅ VERIFICAR SI NECESITA ACTUALIZAR PERMISOS ANTES DE VALIDAR
                if (permisosService is PermisosService ps && ps.NecesitaActualizacionPermisos())
                {
                    var logger = _httpContextAccessor.HttpContext?.RequestServices
                        .GetService<ILogger<PermisoTagHelper>>();
                    logger?.LogDebug("🔄 TagHelper forzando actualización de permisos para validar: {Permiso}", Permiso);

                    await permisosService.RefrescarPermisosAsync();
                }

                // ✅ VALIDAR PERMISO CON DATOS ACTUALIZADOS
                bool tienePermiso = await permisosService.TienePermisoAsync(Permiso);

                if (!tienePermiso)
                {
                    var logger = _httpContextAccessor.HttpContext?.RequestServices
                        .GetService<ILogger<PermisoTagHelper>>();
                    logger?.LogDebug("🚫 TagHelper: Permiso '{Permiso}' DENEGADO - ocultando elemento", Permiso);
                    output.SuppressOutput();
                }
                else
                {
                    var logger = _httpContextAccessor.HttpContext?.RequestServices
                        .GetService<ILogger<PermisoTagHelper>>();
                    logger?.LogDebug("✅ TagHelper: Permiso '{Permiso}' CONCEDIDO - mostrando elemento", Permiso);
                }
            }
            catch (Exception ex)
            {
                // Log del error y ocultar el elemento por seguridad
                var logger = _httpContextAccessor.HttpContext?.RequestServices
                    .GetService<ILogger<PermisoTagHelper>>();
                logger?.LogError(ex, "❌ Error verificando permiso {Permiso} en TagHelper", Permiso);

                output.SuppressOutput();
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