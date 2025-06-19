using System.Threading.Tasks;
using Tuco.Clases.DTOs.Facturacion;

namespace GestionLlantera.Web.Services.Interfaces
{
    public class VentaDTO
    {
        public int ClienteId { get; set; }
        public string NombreCliente { get; set; }
        public string EmailCliente { get; set; }
        public string DireccionCliente { get; set; }
        public string MetodoPago { get; set; }
        public decimal MontoTotal { get; set; }
        public List<ProductoVentaDTO> Productos { get; set; } = new List<ProductoVentaDTO>();
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Data { get; set; }
        public string Message { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }

    public interface IFacturacionService
    {
        /// <summary>
        /// Calcula el total de una venta incluyendo impuestos
        /// </summary>
        Task<decimal> CalcularTotalVentaAsync(List<ProductoVentaDTO> productos);

        /// <summary>
        /// Procesa una venta completa
        /// </summary>
        Task<bool> ProcesarVentaAsync(VentaDTO venta, string jwtToken = null);

        /// <summary>
        /// Verifica disponibilidad de stock para una lista de productos
        /// </summary>
        Task<bool> VerificarStockDisponibleAsync(List<ProductoVentaDTO> productos, string jwtToken = null);

        /// <summary>
        /// Genera una factura en PDF
        /// </summary>
        Task<byte[]> GenerarFacturaPDFAsync(int ventaId, string jwtToken = null);

        /// <summary>
        /// Obtiene productos disponibles para venta
        /// </summary>
        Task<ApiResponse<List<ProductoVentaDTO>>> ObtenerProductosParaVentaAsync(string busqueda = null, bool soloConStock = true);
    }
}