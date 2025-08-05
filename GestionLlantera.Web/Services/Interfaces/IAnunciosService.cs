
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
