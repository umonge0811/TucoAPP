using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.IdentityModel.Tokens.Jwt;

namespace GestionLlantera.Web.Middleware
{
    public class JwtClaimsMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtClaimsMiddleware> _logger;

        public JwtClaimsMiddleware(RequestDelegate next, ILogger<JwtClaimsMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                if (context.User.Identity?.IsAuthenticated == true)
                {
                    var jwtClaim = context.User.FindFirst("JwtToken");
                    if (jwtClaim != null)
                    {
                        var token = jwtClaim.Value;
                        try
                        {
                            var handler = new JwtSecurityTokenHandler();
                            var jwtToken = handler.ReadToken(token) as JwtSecurityToken;

                            if (jwtToken != null)
                            {
                                // Verificar si el token ha expirado
                                if (jwtToken.ValidTo < DateTime.UtcNow)
                                {
                                    _logger.LogInformation("JWT expirado. Cerrando sesión del usuario.");
                                    // Si ha expirado, cerrar la sesión
                                    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                                    context.Response.Redirect("/Account/Login");
                                    return;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error al verificar el token JWT");
                            // Si hay algún error con el token, continuar con la solicitud
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el middleware JWT");
                // Continuar con la solicitud incluso si hay un error
            }

            await _next(context);
        }
    }

    // Agregar extensión para usar el middleware
    public static class JwtClaimsMiddlewareExtensions
    {
        public static IApplicationBuilder UseJwtClaimsMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<JwtClaimsMiddleware>();
        }
    }
}