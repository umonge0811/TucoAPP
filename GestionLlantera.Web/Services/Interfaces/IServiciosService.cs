
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IServiciosService
    {
        Task<List<ServicioDTO>> ObtenerServiciosAsync(string jwtToken);
        Task<ServicioDTO?> ObtenerServicioPorIdAsync(int id, string jwtToken);
        Task<bool> CrearServicioAsync(ServicioDTO servicio, string jwtToken);
        Task<bool> ActualizarServicioAsync(int id, ServicioDTO servicio, string jwtToken);
        Task<bool> EliminarServicioAsync(int id, string jwtToken);
    }
}
