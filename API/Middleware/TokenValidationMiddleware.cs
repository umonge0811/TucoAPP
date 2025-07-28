
using API.ServicesAPI.Interfaces;
using System.IdentityModel.Tokens.Jwt;

namespace API.Middleware
{
    public class TokenValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TokenValidationMiddleware> _logger;

        public TokenValidationMiddleware(RequestDelegate next, ILogger<TokenValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ITokenInvalidationService tokenService)
        {
            try
            {
                // Solo verificar en endpoints que requieren autenticación
                if (context.Request.Path.StartsWithSegments("/api") && 
                    context.Request.Headers.ContainsKey("Authorization"))
                {
                    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                    
                    if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                    {
                        var token = authHeader.Substring("Bearer ".Length).Trim();
                        
                        // Verificar si el token está invalidado
                        var estaInvalidado = await tokenService.EstaTokenInvalidadoAsync(token);
                        
                        if (estaInvalidado)
                        {
                            _logger.LogWarning("🚫 Token invalidado detectado para usuario");
                            
                            context.Response.StatusCode = 401;
                            context.Response.ContentType = "application/json";
                            
                            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
                            {
                                message = "Su sesión ha sido invalidada. Por favor, inicie sesión nuevamente.",
                                code = "TOKEN_INVALIDATED",
                                requireLogin = true
                            }));
                            
                            return;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en TokenValidationMiddleware");
            }

            await _next(context);
        }
    }
}
