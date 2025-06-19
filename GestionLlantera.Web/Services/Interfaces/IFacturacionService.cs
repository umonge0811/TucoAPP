
using System.Threading.Tasks;
using Tuco.Clases.DTOs.Facturacion;

namespace GestionLlantera.Web.Services.Interfaces
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public bool IsSuccess { get; set; }
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
        Task<bool> ProcesarVentaAsync(FacturaDTO factura, string jwtToken = null);

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
