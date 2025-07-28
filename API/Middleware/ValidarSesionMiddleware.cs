
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using API.Data;
using System.Security.Claims;

namespace API.Middleware
{
    /// <summary>
    /// Middleware que valida si la sesión del usuario sigue siendo válida
    /// Fuerza re-login si la sesión fue invalidada por cambios de permisos
    /// </summary>
    public class ValidarSesionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ValidarSesionMiddleware> _logger;

        public ValidarSesionMiddleware(RequestDelegate next, ILogger<ValidarSesionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, TucoContext dbContext)
        {
            // ✅ SOLO VALIDAR USUARIOS AUTENTICADOS
            if (context.User.Identity?.IsAuthenticated == true)
            {
                try
                {
                    // Obtener ID del usuario
                    var userIdClaim = context.User.FindFirst("userId")?.Value ??
                                     context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                    if (int.TryParse(userIdClaim, out int userId))
                    {
                        // ✅ VERIFICAR SI EL USUARIO TIENE SESIONES ACTIVAS
                        var tieneSesionActiva = await dbContext.SesionUsuario
                            .AnyAsync(s => s.UsuarioId == userId && s.EstaActiva == true);

                        if (!tieneSesionActiva)
                        {
                            _logger.LogWarning($"⚠️ Usuario {userId} no tiene sesiones activas - forzando logout");

                            // Limpiar autenticación y redirigir al login
                            context.Response.StatusCode = 401;
                            context.Response.Headers.Add("X-Session-Invalid", "true");
                            
                            await context.Response.WriteAsync("Sesión invalidada. Por favor, inicia sesión nuevamente.");
                            return;
                        }

                        _logger.LogDebug($"✅ Usuario {userId} tiene sesión activa válida");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error validando sesión del usuario");
                    // En caso de error, continuar sin bloquear (fail-safe)
                }
            }

            await _next(context);
        }
    }

    /// <summary>
    /// Extensión para registrar el middleware fácilmente
    /// </summary>
    public static class ValidarSesionMiddlewareExtensions
    {
        public static IApplicationBuilder UseValidarSesion(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ValidarSesionMiddleware>();
        }
    }

    // ✅ EXTENSIÓN PARA USAR EL MIDDLEWARE
    public static class ValidarSesionMiddlewareExtensions
    {
        public static IApplicationBuilder UseValidarSesion(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ValidarSesionMiddleware>();
        }
    }
}
