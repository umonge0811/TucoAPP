
using System;
using System.ComponentModel.DataAnnotations;

namespace tuco.Clases.Models
{
    public partial class DetalleFactura
    {
        public int DetalleFacturaId { get; set; }
        
        [Required]
        public int FacturaId { get; set; }
        
        [Required]
        public int ProductoId { get; set; }
        
        [Required]
        public string NombreProducto { get; set; } = null!;
        
        public string? DescripcionProducto { get; set; }
        
        [Required]
        public int Cantidad { get; set; }
        
        [Required]
        public decimal PrecioUnitario { get; set; }
        
        public decimal? PorcentajeDescuento { get; set; }
        
        public decimal? MontoDescuento { get; set; }
        
        [Required]
        public decimal Subtotal { get; set; }
        
        // Propiedades de navegación
        public virtual Factura Factura { get; set; } = null!;
        public virtual Producto Producto { get; set; } = null!;
    }
}
