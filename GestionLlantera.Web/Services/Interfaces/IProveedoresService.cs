
using tuco.Clases.Models;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IProveedoresService
    {
        Task<List<Proveedore>> ObtenerProveedoresAsync(string token);
        Task<(bool success, object data, string message)> CrearProveedorAsync(Proveedore proveedor, string token);
        Task<(bool success, object data, string message)> ActualizarProveedorAsync(Proveedore proveedor, string token);
        Task<(bool success, object data, string message)> EliminarProveedorAsync(int id, string token);
        Task<(bool success, object data, string message)> ObtenerPedidosProveedorAsync(int? proveedorId, string token);
        Task<(bool success, object data, string message)> CrearPedidoProveedorAsync(dynamic pedidoData, string token);
    }
}
