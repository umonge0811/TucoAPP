using tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    /// <summary>
    /// Interfaz para el servicio de notas rápidas en la capa Web
    /// </summary>
    public interface INotasRapidasService
    {
        /// <summary>
        /// Obtener todas las notas de un usuario
        /// </summary>
        Task<(bool success, List<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasUsuarioAsync(int usuarioId, string jwtToken);

        /// <summary>
        /// Crear una nueva nota
        /// </summary>
        Task<(bool success, NotaRapidaDTO nota, string mensaje)> CrearNotaAsync(CrearNotaRapidaDTO request, string jwtToken);

        /// <summary>
        /// Actualizar una nota existente
        /// </summary>
        Task<(bool success, NotaRapidaDTO nota, string mensaje)> ActualizarNotaAsync(ActualizarNotaRapidaDTO request, int usuarioId, string jwtToken);

        /// <summary>
        /// Eliminar una nota
        /// </summary>
        Task<(bool success, string message)> EliminarNotaAsync(int notaId, int usuarioId, string jwtToken);

        /// <summary>
        /// Cambiar estado favorita de una nota
        /// </summary>
        Task<(bool success, NotaRapidaDTO nota, bool EsFavorita, string mensaje)> CambiarFavoritaAsync(int notaId, bool esFavorita, int usuarioId, string jwtToken);
    }
}