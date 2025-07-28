
using Microsoft.EntityFrameworkCore;
using API.Data;
using System.Security.Claims;

namespace API.Middleware
{
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
            // Solo validar para rutas que requieren autenticación
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (int.TryParse(userIdClaim, out int userId))
                {
                    // Verificar si el usuario tiene sesiones activas
                    var sesionActiva = await dbContext.SesionUsuario
                        .AnyAsync(s => s.UsuarioId == userId && s.EstaActiva == true);

                    if (!sesionActiva)
                    {
                        _logger.LogWarning($"⚠️ Usuario {userId} sin sesión activa válida - cerrando sesión");
                        
                        // Retornar 401 para forzar logout en el frontend
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsync("Sesión inválida");
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
