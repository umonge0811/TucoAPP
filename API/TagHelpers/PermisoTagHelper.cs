using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using API.Services.Interfaces;

namespace API.TagHelpers
{
    /// <summary>
    /// TagHelper dinámico para controlar visibilidad basada en permisos
    /// ✅ COMPLETAMENTE AUTOMÁTICO - No requiere configuración en Program.cs
    /// ✅ Funciona con cualquier permiso creado desde la interfaz
    /// </summary>
    [HtmlTargetElement("*", Attributes = "asp-permiso")]
    public class PermisoTagHelper : TagHelper
    {
        private readonly IPermisosService _permisosService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<PermisoTagHelper> _logger;

        public PermisoTagHelper(
            IPermisosService permisosService,
            IHttpContextAccessor httpContextAccessor,
            ILogger<PermisoTagHelper> logger)
        {
            _permisosService = permisosService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// Nombre del permiso requerido - debe coincidir exactamente con NombrePermiso en la BD
        /// Ejemplo: asp-permiso="VerCostos"
        /// </summary>
        [HtmlAttributeName("asp-permiso")]
        public string Permiso { get; set; }

        /// <summary>
        /// Comportamiento cuando el usuario NO tiene el permiso:
        /// - true (por defecto): Oculta el elemento
        /// - false: Muestra el elemento (comportamiento inverso)
        /// </summary>
        [HtmlAttributeName("asp-hide-without-permission")]
        public bool OcultarSinPermiso { get; set; } = true;

        /// <summary>
        /// Texto alternativo a mostrar cuando el usuario no tiene permisos
        /// Ejemplo: asp-mensaje-sin-permiso="No tienes acceso a esta información"
        /// </summary>
        [HtmlAttributeName("asp-mensaje-sin-permiso")]
        public string MensajeSinPermiso { get; set; }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            // Si no se especifica permiso, mostrar el elemento normalmente
            if (string.IsNullOrEmpty(Permiso))
            {
                _logger.LogWarning("TagHelper usado sin especificar permiso en elemento {TagName}", output.TagName);
                return;
            }

            var user = _httpContextAccessor.HttpContext?.User;

            // Usuario no autenticado - ocultar por seguridad
            if (user == null || !user.Identity.IsAuthenticated)
            {
                _logger.LogDebug("TagHelper: Usuario no autenticado - ocultando elemento con permiso {Permiso}", Permiso);
                ProcesarSinPermiso(output);
                return;
            }

            try
            {
                // ✅ VERIFICACIÓN AUTOMÁTICA CONTRA LA BASE DE DATOS
                // No requiere configuración previa - funciona con cualquier permiso
                bool tienePermiso = await _permisosService.TienePermisoAsync(user, Permiso);

                _logger.LogDebug("TagHelper: Usuario {Usuario} - Permiso '{Permiso}' = {TienePermiso}",
                    user.Identity.Name ?? "Desconocido", Permiso, tienePermiso);

                // Aplicar lógica de visibilidad
                if (!tienePermiso)
                {
                    ProcesarSinPermiso(output);
                }
                // Si tiene permiso, el elemento se muestra normalmente
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verificando permiso '{Permiso}' para usuario {Usuario}",
                    Permiso, user.Identity?.Name ?? "Desconocido");

                // En caso de error, ocultar por seguridad
                ProcesarSinPermiso(output);
            }
        }

        /// <summary>
        /// Procesa el elemento cuando el usuario no tiene permisos
        /// </summary>
        private void ProcesarSinPermiso(TagHelperOutput output)
        {
            if (!string.IsNullOrEmpty(MensajeSinPermiso))
            {
                // Mostrar mensaje personalizado en lugar del elemento original
                output.TagName = "div";
                output.Attributes.Clear();
                output.Attributes.Add("class", "alert alert-warning");
                output.Attributes.Add("style", "display: inline-block; padding: 5px 10px; margin: 2px;");
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