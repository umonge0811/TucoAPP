using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class ProductoVentaDTO
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string CodigoProducto { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public int Cantidad { get; set; }
        public decimal Descuento { get; set; }
        public decimal PorcentajeImpuesto { get; set; }
        public string? ImagenUrl { get; set; }
        public int StockDisponible { get; set; }

        // Propiedades calculadas
        public decimal Subtotal => Precio * Cantidad;
        public decimal MontoDescuento => Subtotal * (Descuento / 100);
        public decimal SubtotalConDescuento => Subtotal - MontoDescuento;
        public decimal MontoImpuesto => SubtotalConDescuento * (PorcentajeImpuesto / 100);
        public decimal Total => SubtotalConDescuento + MontoImpuesto;
    }
}