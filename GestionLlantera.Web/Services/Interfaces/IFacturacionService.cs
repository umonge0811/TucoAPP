
using GestionLlantera.Web.Models.DTOs.Inventario;

namespace GestionLlantera.Web.Services.Interfaces
{
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

        /// <summary>
        /// Ajusta el stock de productos después de una facturación
        /// </summary>
        Task<object> AjustarStockFacturacionAsync(AjusteStockFacturacionRequest request, string jwtToken = null);
    }

    // Clase ApiResponse para manejar respuestas de la API
    public class ApiResponse<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    public class ProductoVentaDTO
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal? Precio { get; set; }
        public decimal PrecioUnitario { get; set; }
        public int Cantidad { get; set; }
        public int CantidadEnInventario { get; set; }
        public int StockMinimo { get; set; }
        public bool EsLlanta { get; set; }
        public string? MedidaCompleta { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public List<string>? ImagenesUrls { get; set; }
        public decimal Subtotal => PrecioUnitario * Cantidad;
        public string? ImagenUrl { get; set; }
    }

    public class AjusteStockFacturacionRequest
    {
        public string NumeroFactura { get; set; } = string.Empty;
        public List<ProductoAjusteStock> Productos { get; set; } = new();
    }

    public class ProductoAjusteStock
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }

    public class VentaDTO
    {
        public int ClienteId { get; set; }
        public string NombreCliente { get; set; } = string.Empty;
        public string EmailCliente { get; set; } = string.Empty;
        public List<ProductoVentaDTO> Productos { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal IVA { get; set; }
        public decimal Total { get; set; }
        public DateTime FechaVenta { get; set; } = DateTime.Now;
        public string MetodoPago { get; set; } = "Efectivo";
        public string? Observaciones { get; set; }
    }
}
