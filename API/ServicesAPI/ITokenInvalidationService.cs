
using System.Security.Claims;

namespace API.ServicesAPI.Interfaces
{
    public interface ITokenInvalidationService
    {
        /// <summary>
        /// Invalida todas las sesiones de un usuario específico
        /// </summary>
        Task InvalidarSesionesUsuarioAsync(int usuarioId);

        /// <summary>
        /// Verifica si un token está invalidado
        /// </summary>
        Task<bool> EstaTokenInvalidadoAsync(string token);

        /// <summary>
        /// Obtiene el ID del usuario desde un token
        /// </summary>
        int? ObtenerUsuarioIdDesdeToken(string token);
    }
}
