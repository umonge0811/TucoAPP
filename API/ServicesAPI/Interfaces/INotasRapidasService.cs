
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.ServicesAPI.Interfaces
{
    public interface INotasRapidasService
    {
        Task<(bool success, IEnumerable<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasUsuarioAsync(int usuarioId);
        Task<(bool success, NotaRapidaDTO nota, string mensaje)> ObtenerNotaPorIdAsync(int notaId, int usuarioId);
        Task<(bool success, NotaRapidaDTO nota, string mensaje)> CrearNotaAsync(CrearNotaRapidaDTO notaDto, int usuarioId);
        Task<(bool success, NotaRapidaDTO nota, string mensaje)> ActualizarNotaAsync(ActualizarNotaRapidaDTO notaDto, int usuarioId);
        Task<(bool success, string mensaje)> EliminarNotaAsync(int notaId, int usuarioId);
        Task<(bool success, IEnumerable<NotaRapidaDTO> notas, string mensaje)> BuscarNotasAsync(string termino, int usuarioId);
        Task<(bool success, IEnumerable<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasFavoritasAsync(int usuarioId);
    }
}
