
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IAnunciosService
    {
        Task<(bool success, List<AnuncioDTO> anuncios, string message)> ObtenerAnunciosAsync(string? token = null);
        Task<(bool success, AnuncioDTO? anuncio, string message)> ObtenerAnuncioPorIdAsync(int anuncioId, string? token = null);
        Task<(bool success, AnuncioDTO? anuncio, string message)> CrearAnuncioAsync(CrearAnuncioDTO anuncioDto, string? token = null);
        Task<(bool success, string message)> ActualizarAnuncioAsync(int anuncioId, ActualizarAnuncioDTO anuncioDto, string? token = null);
        Task<(bool success, string message)> EliminarAnuncioAsync(int anuncioId, string? token = null);
        Task<(bool success, string message)> CambiarEstadoAnuncioAsync(int anuncioId, bool activo, string? token = null);
    }
}
