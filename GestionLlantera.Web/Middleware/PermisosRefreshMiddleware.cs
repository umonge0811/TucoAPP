
using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Middleware
{
    public class PermisosRefreshMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PermisosRefreshMiddleware> _logger;

        public PermisosRefreshMiddleware(RequestDelegate next, ILogger<PermisosRefreshMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IPermisosService permisosService)
        {
            try
            {
                // Solo verificar en páginas que requieren autenticación
                if (context.User?.Identity?.IsAuthenticated == true)
                {
                    // ✅ VERIFICAR SI NECESITA ACTUALIZACIÓN DE PERMISOS
                    if (permisosService is PermisosService ps)
                    {
                        // Verificar renovación normal
                        if (ps.NecesitaRenovacion())
                        {
                            _logger.LogDebug("🔄 Permisos necesitan renovación por tiempo - forzando refresh");
                            await permisosService.RefrescarPermisosAsync();
                        }
                        // También verificar actualización basada en timestamp
                        else if (ps.NecesitaActualizacionPermisos())
                        {
                            _logger.LogDebug("🔄 Permisos necesitan actualización por timestamp - forzando refresh");
                            await permisosService.RefrescarPermisosAsync();
                        }
                    }

                    // Verificar si hay un parámetro especial para forzar refresh
                    if (context.Request.Query.ContainsKey("refresh_permisos"))
                    {
                        _logger.LogInformation("Refresh de permisos solicitado vía query parameter");
                        permisosService.LimpiarCacheCompleto();
                        await permisosService.RefrescarPermisosAsync();
                        
                        // Redirigir sin el parámetro para limpiar la URL
                        var newUrl = context.Request.Path.Value;
                        context.Response.Redirect(newUrl);
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en PermisosRefreshMiddleware");
                // Continuar con la ejecución normal en caso de error
            }

            await _next(context);
        }
    }
}
