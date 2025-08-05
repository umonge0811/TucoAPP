
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IAnunciosService
    {
        Task<(bool success, List<AnuncioDTO> anuncios, string message)> ObtenerAnunciosAsync();
        Task<(bool success, AnuncioDTO anuncio, string message)> ObtenerAnuncioPorIdAsync(int anuncioId);
        Task<(bool success, AnuncioDTO anuncio, string message)> CrearAnuncioAsync(CrearAnuncioDTO anuncioDto);
        Task<(bool success, string message)> ActualizarAnuncioAsync(int anuncioId, ActualizarAnuncioDTO anuncioDto);
        Task<(bool success, string message)> EliminarAnuncioAsync(int anuncioId);
        Task<(bool success, string message)> CambiarEstadoAnuncioAsync(int anuncioId, bool activo);
    }
}
using tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    /// <summary>
    /// Interfaz para el servicio de anuncios en la capa Web
    /// </summary>
    public interface IAnunciosService
    {
        /// <summary>
        /// Obtener todos los anuncios activos
        /// </summary>
        Task<(bool success, List<AnuncioDTO> anuncios, string mensaje)> ObtenerAnunciosAsync(string jwtToken);

        /// <summary>
        /// Crear un nuevo anuncio
        /// </summary>
        Task<(bool success, AnuncioDTO anuncio, string mensaje)> CrearAnuncioAsync(CrearAnuncioDTO request, string jwtToken);

        /// <summary>
        /// Actualizar un anuncio existente
        /// </summary>
        Task<(bool success, AnuncioDTO anuncio, string mensaje)> ActualizarAnuncioAsync(ActualizarAnuncioDTO request, int id, string jwtToken);

        /// <summary>
        /// Eliminar un anuncio
        /// </summary>
        Task<(bool success, string message)> EliminarAnuncioAsync(int anuncioId, int usuarioId, string jwtToken);

        /// <summary>
        /// Cambiar estado activo de un anuncio
        /// </summary>
        Task<(bool success, AnuncioDTO anuncio, bool EsActivo, string mensaje)> CambiarEstadoAsync(int anuncioId, bool esActivo, int usuarioId, string jwtToken);
    }
}
