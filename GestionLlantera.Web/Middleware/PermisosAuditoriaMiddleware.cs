using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Middleware
{
    /// <summary>
    /// Middleware para auditar accesos denegados por permisos
    /// Útil para detectar patrones de acceso y problemas de permisos
    /// </summary>
    public class PermisosAuditoriaMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PermisosAuditoriaMiddleware> _logger;

        public PermisosAuditoriaMiddleware(RequestDelegate next, ILogger<PermisosAuditoriaMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            await _next(context);

            // Auditar respuestas 403 (Forbidden) relacionadas con permisos
            if (context.Response.StatusCode == 403)
            {
                var usuario = context.User?.Identity?.Name ?? "Anónimo";
                var ruta = context.Request.Path;
                var metodo = context.Request.Method;

                _logger.LogWarning("🚫 Acceso denegado por permisos - Usuario: {Usuario}, Ruta: {Ruta}, Método: {Método}",
                    usuario, ruta, metodo);
            }
        }
    }

    /// <summary>
    /// Extensión para registrar el middleware fácilmente
    /// </summary>
    public static class PermisosAuditoriaMiddlewareExtensions
    {
        public static IApplicationBuilder UsePermisosAuditoria(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<PermisosAuditoriaMiddleware>();
        }
    }
}