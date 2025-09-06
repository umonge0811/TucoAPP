
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IServiciosService
    {
        Task<IEnumerable<ServicioDTO>> ObtenerServiciosAsync(string busqueda = "", string tipoServicio = "", bool soloActivos = true, int pagina = 1, int tamano = 50);
        Task<ServicioDTO?> ObtenerServicioPorIdAsync(int id);
        Task<bool> CrearServicioAsync(ServicioDTO servicio);
        Task<bool> ActualizarServicioAsync(int id, ServicioDTO servicio);
        Task<bool> EliminarServicioAsync(int id);
        Task<IEnumerable<string>> ObtenerTiposServiciosAsync();
    }
}
