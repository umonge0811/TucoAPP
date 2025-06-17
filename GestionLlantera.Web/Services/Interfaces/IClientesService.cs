
using tuco.Clases.Models;
using Tuco.Clases.Models;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IClientesService
    {
        Task<List<Cliente>> ObtenerTodosAsync(string jwtToken = null);
        Task<Cliente> ObtenerPorIdAsync(int id, string jwtToken = null);
        Task<List<Cliente>> BuscarClientesAsync(string termino = "", string jwtToken = null);
        Task<bool> CrearClienteAsync(Cliente cliente, string jwtToken = null);
        Task<bool> ActualizarClienteAsync(int id, Cliente cliente, string jwtToken = null);
        Task<bool> EliminarClienteAsync(int id, string jwtToken = null);
    }
}
