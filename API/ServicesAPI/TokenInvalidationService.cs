
using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace API.ServicesAPI
{
    public class TokenInvalidationService : ITokenInvalidationService
    {
        private readonly TucoContext _context;
        private readonly ILogger<TokenInvalidationService> _logger;
        private static readonly HashSet<string> _tokensInvalidados = new();

        public TokenInvalidationService(TucoContext context, ILogger<TokenInvalidationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InvalidarSesionesUsuarioAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("🔒 Invalidando todas las sesiones del usuario {UsuarioId}", usuarioId);

                // 1. Marcar tokens como invalidados en memoria (temporal)
                var sesionesActivas = await _context.SesionUsuarios
                    .Where(s => s.UsuarioId == usuarioId && s.EstaActiva)
                    .ToListAsync();

                foreach (var sesion in sesionesActivas)
                {
                    if (!string.IsNullOrEmpty(sesion.Token))
                    {
                        _tokensInvalidados.Add(sesion.Token);
                    }
                    
                    // 2. Marcar sesión como inactiva en BD
                    sesion.EstaActiva = false;
                    sesion.FechaInvalidacion = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Se invalidaron {Cantidad} sesiones del usuario {UsuarioId}", 
                    sesionesActivas.Count, usuarioId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al invalidar sesiones del usuario {UsuarioId}", usuarioId);
            }
        }

        public Task<bool> EstaTokenInvalidadoAsync(string token)
        {
            if (string.IsNullOrEmpty(token))
                return Task.FromResult(true);

            return Task.FromResult(_tokensInvalidados.Contains(token));
        }

        public int? ObtenerUsuarioIdDesdeToken(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return null;

                var handler = new JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);
                
                var userIdClaim = jsonToken.Claims.FirstOrDefault(x => x.Type == "userId" || x.Type == ClaimTypes.NameIdentifier);
                
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    return userId;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener userId del token");
                return null;
            }
        }
    }
}
