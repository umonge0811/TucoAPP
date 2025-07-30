
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
                    _logger.LogDebug("🔍 Usuario autenticado detectado - verificando permisos...");
                    
                    // ✅ DIAGNÓSTICO: Verificar información del usuario
                    var userId = context.User.FindFirst("userId")?.Value ?? 
                                context.User.FindFirst("UsuarioId")?.Value ?? 
                                context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    
                    var userEmail = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? 
                                   context.User.FindFirst("email")?.Value;
                    
                    var userRoles = context.User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                                                     .Select(c => c.Value).ToList();

                    _logger.LogInformation("👤 Usuario detectado - ID: {UserId}, Email: {Email}, Roles: [{Roles}]", 
                        userId, userEmail, string.Join(", ", userRoles));

                    // ✅ DIAGNÓSTICO: Verificar cookies
                    var jwtCookie = context.Request.Cookies["JwtToken"];
                    _logger.LogDebug("🍪 Cookie JwtToken presente: {Present}, Longitud: {Length}", 
                        !string.IsNullOrEmpty(jwtCookie), jwtCookie?.Length ?? 0);

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
                        else
                        {
                            _logger.LogDebug("✅ Permisos están actualizados");
                        }

                        // ✅ DIAGNÓSTICO: Verificar permisos actuales
                        var permisosActuales = ps.PermisosActuales;
                        _logger.LogInformation("📋 Permisos actuales del usuario: Admin={Admin}, VerCostos={VerCostos}, EditarProductos={EditarProductos}", 
                            permisosActuales.EsAdministrador, permisosActuales.PuedeVerCostos, permisosActuales.PuedeEditarProductos);
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
                else
                {
                    _logger.LogDebug("❌ Usuario no autenticado o no presente");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico en PermisosRefreshMiddleware");
                // Continuar con la ejecución normal en caso de error
            }

            await _next(context);
        }
    }
}
