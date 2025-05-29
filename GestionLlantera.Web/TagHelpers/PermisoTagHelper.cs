using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace GestionLlantera.Web.TagHelpers
{
    /// <summary>
    /// Tag Helper para mostrar/ocultar contenido basado en permisos
    /// </summary>
    [HtmlTargetElement("*", Attributes = PermisoAttributeName)]
    [HtmlTargetElement("*", Attributes = SoloAdministradorAttributeName)]
    [HtmlTargetElement("inventario-elemento", Attributes = "tipo")]
    public class PermisoTagHelper : TagHelper
    {
        private const string PermisoAttributeName = "asp-permiso";
        private const string SoloAdministradorAttributeName = "asp-solo-admin";

        private readonly IPermisosService _permisosService;
        private readonly ILogger<PermisoTagHelper> _logger;

        public PermisoTagHelper(IPermisosService permisosService, ILogger<PermisoTagHelper> logger)
        {
            _permisosService = permisosService;
            _logger = logger;
        }

        /// <summary>
        /// Permiso requerido para mostrar el elemento
        /// </summary>
        [HtmlAttributeName(PermisoAttributeName)]
        public string? Permiso { get; set; }

        /// <summary>
        /// Si es true, solo muestra el elemento para administradores
        /// </summary>
        [HtmlAttributeName(SoloAdministradorAttributeName)]
        public bool SoloAdministrador { get; set; } = false;

        /// <summary>
        /// Tipo de elemento para inventario-elemento
        /// </summary>
        [HtmlAttributeName("tipo")]
        public string Tipo { get; set; } = "";

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            try
            {
                _logger.LogInformation("🔍 TAG HELPER EJECUTÁNDOSE - SoloAdmin: {SoloAdmin}, Permiso: {Permiso}, Tipo: {Tipo}",
                    SoloAdministrador, Permiso, Tipo);

                var permisos = await _permisosService.ObtenerPermisosUsuarioActualAsync();

                _logger.LogInformation("📊 PERMISOS OBTENIDOS - EsAdmin: {EsAdmin}, VerCostos: {VerCostos}, VerUtilidades: {VerUtilidades}",
                    permisos.EsAdministrador, permisos.PuedeVerCostos, permisos.PuedeVerUtilidades);

                bool tienePermiso = true;

                // ✅ Para el tag inventario-elemento
                if (output.TagName == "inventario-elemento")
                {
                    tienePermiso = Tipo.ToLower() switch
                    {
                        "costo" or "costos" => permisos.PuedeVerCostos,
                        "utilidad" or "utilidades" => permisos.PuedeVerUtilidades,
                        "programar" => permisos.PuedeProgramarInventario,
                        "editar" => permisos.PuedeEditarProductos,
                        "eliminar" => permisos.PuedeEliminarProductos,
                        "ajustar" => permisos.PuedeAjustarStock,
                        _ => permisos.EsAdministrador
                    };

                    _logger.LogInformation("🏷️ INVENTARIO ELEMENTO - Tipo: {Tipo}, Tiene Permiso: {TienePermiso}", Tipo, tienePermiso);

                    if (tienePermiso)
                    {
                        output.TagName = "td";
                        output.Attributes.RemoveAll("tipo");
                    }
                    else
                    {
                        output.SuppressOutput();
                    }
                    return;
                }

                // ✅ Para elementos normales con permisos
                if (SoloAdministrador)
                {
                    tienePermiso = permisos.EsAdministrador;
                    _logger.LogInformation("🔐 SOLO ADMIN - Es Administrador: {EsAdmin}, Tiene Permiso: {TienePermiso}",
                        permisos.EsAdministrador, tienePermiso);
                }
                else if (!string.IsNullOrEmpty(Permiso))
                {
                    tienePermiso = await _permisosService.TienePermisoAsync(Permiso);
                    _logger.LogInformation("🎯 PERMISO ESPECÍFICO - Permiso: {Permiso}, Tiene Permiso: {TienePermiso}",
                        Permiso, tienePermiso);
                }

                if (!tienePermiso)
                {
                    _logger.LogInformation("❌ OCULTANDO ELEMENTO - No tiene permiso");
                    output.SuppressOutput();
                }
                else
                {
                    _logger.LogInformation("✅ MOSTRANDO ELEMENTO - Tiene permiso");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 ERROR EN TAG HELPER");
                // ✅ En caso de error, ocultar por seguridad
                output.SuppressOutput();
            }
        }
    }
}