
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IAnunciosService
    {
        Task<(bool success, List<AnuncioDTO> anuncios, string mensaje)> ObtenerAnunciosAsync(string jwtToken);
        Task<(bool success, AnuncioDTO anuncio, string mensaje)> ObtenerAnuncioPorIdAsync(int anuncioId, string jwtToken);
        Task<(bool success, AnuncioDTO anuncio, string mensaje)> CrearAnuncioAsync(object anuncioDto, string jwtToken);
        Task<(bool success, string mensaje)> ActualizarAnuncioAsync(int anuncioId, object anuncioDto, string jwtToken);
        Task<(bool success, string mensaje)> EliminarAnuncioAsync(int anuncioId, string jwtToken);
    }
}
