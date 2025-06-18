
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class VentaCompletaDTO
    {
        public int? ClienteId { get; set; }
        
        [Required]
        public string NombreCliente { get; set; } = string.Empty;
        
        public string? IdentificacionCliente { get; set; }
        public string? TelefonoCliente { get; set; }
        public string? EmailCliente { get; set; }
        public string? DireccionCliente { get; set; }
        
        [Required]
        public List<ProductoVentaCompletaDTO> Productos { get; set; } = new();
        
        [Required]
        public decimal Subtotal { get; set; }
        
        [Required]
        public decimal Iva { get; set; }
        
        [Required]
        public decimal Total { get; set; }
        
        [Required]
        public string MetodoPago { get; set; } = string.Empty;
        
        public string? Observaciones { get; set; }
        
        [Required]
        public string UsuarioCreadorId { get; set; } = string.Empty;
        
        public decimal? MontoRecibido { get; set; }
        public decimal? Cambio { get; set; }
    }

    public class ProductoVentaCompletaDTO
    {
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        public string NombreProducto { get; set; } = string.Empty;
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }
        
        public string? MetodoPago { get; set; }
    }
}
