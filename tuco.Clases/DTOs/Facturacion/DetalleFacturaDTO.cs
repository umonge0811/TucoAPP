
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class DetalleFacturaDTO
    {
        public int DetalleFacturaId { get; set; }
        
        public int FacturaId { get; set; }
        
        [Required(ErrorMessage = "El producto es requerido")]
        public int ProductoId { get; set; }
        
        [Required(ErrorMessage = "El nombre del producto es requerido")]
        public string NombreProducto { get; set; } = string.Empty;
        
        public string? DescripcionProducto { get; set; }
        
        [Required(ErrorMessage = "La cantidad es requerida")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
        
        [Required(ErrorMessage = "El precio unitario es requerido")]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }
        
        [Range(0, 100, ErrorMessage = "El descuento debe estar entre 0 y 100")]
        public decimal? PorcentajeDescuento { get; set; }
        
        public decimal? MontoDescuento { get; set; }
        
        public decimal Subtotal { get; set; }
        
        // Propiedades adicionales del producto
        public int StockDisponible { get; set; }
        public bool EsLlanta { get; set; }
        public string? MedidaLlanta { get; set; }
        public string? MarcaLlanta { get; set; }
        public string? ModeloLlanta { get; set; }
        
        // Propiedades calculadas
        public decimal SubtotalSinDescuento => Cantidad * PrecioUnitario;
        public decimal DescuentoCalculado => (SubtotalSinDescuento * (PorcentajeDescuento ?? 0)) / 100;
        public decimal SubtotalConDescuento => SubtotalSinDescuento - DescuentoCalculado;
        
        public bool TieneDescuento => PorcentajeDescuento.HasValue && PorcentajeDescuento > 0;
        public bool StockSuficiente => StockDisponible >= Cantidad;
    }
}
