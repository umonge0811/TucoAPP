
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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
                                    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                                    context.Response.Redirect("/Account/Login");
                                    return;
                                }

                                // ✅ EXTRAER CLAIMS DEL JWT Y ESTABLECERLOS EN LA IDENTIDAD
                                var claims = new List<Claim>();
                                
                                // Agregar claims existentes del usuario (excepto JwtToken)
                                claims.AddRange(context.User.Claims.Where(c => c.Type != "JwtToken"));
                                
                                // Extraer y agregar claims del JWT
                                foreach (var claim in jwtToken.Claims)
                                {
                                    // Evitar duplicados de claims que ya existen
                                    if (!claims.Any(c => c.Type == claim.Type && c.Value == claim.Value))
                                    {
                                        claims.Add(new Claim(claim.Type, claim.Value));
                                    }
                                }

                                _logger.LogInformation("🔥 MIDDLEWARE - Creando nueva identidad con {ClaimsCount} claims", claims.Count);
                                
                                // Crear nueva identidad con todos los claims
                                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                                var principal = new ClaimsPrincipal(identity);
                                
                                // Establecer la nueva identidad en el contexto
                                context.User = principal;
                                
                                // Log de los roles encontrados
                                var roles = claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value);
                                _logger.LogInformation("🎯 MIDDLEWARE - Roles establecidos: {Roles}", string.Join(", ", roles));
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error al procesar el token JWT en middleware");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el middleware JWT");
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
