
using Tuco.Clases.DTOs.Inventario;

namespace API.ServicesAPI.Interfaces
{
    public interface IReportePedidosService
    {
        Task<byte[]> GenerarPedidoPdfAsync(int pedidoId);
    }
}
