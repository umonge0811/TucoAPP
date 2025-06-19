
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class ProductoVentaDTO
    {
        public int ProductoId { get; set; }
        
        [Required]
        public string NombreProducto { get; set; } = string.Empty;
        
        public string? Descripcion { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int Cantidad { get; set; }
        
        public decimal? Costo { get; set; }
        public decimal? PorcentajeUtilidad { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int CantidadEnInventario { get; set; }
        
        public int StockMinimo { get; set; }
        
        public DateTime? FechaUltimaActualizacion { get; set; }
        
        // Información de llanta si aplica
        public bool EsLlanta { get; set; }
        public string? MedidaCompleta { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? IndiceVelocidad { get; set; }
        public string? TipoTerreno { get; set; }
        
        // Imágenes del producto
        public List<string> ImagenesUrls { get; set; } = new List<string>();
        
        // Propiedades calculadas
        public bool TieneStock => CantidadEnInventario > 0;
        public bool StockBajo => CantidadEnInventario <= StockMinimo;
        public decimal? UtilidadEnDinero => Costo.HasValue && PorcentajeUtilidad.HasValue 
            ? Costo.Value * (PorcentajeUtilidad.Value / 100) 
            : null;
        public decimal PrecioCalculado => Costo.HasValue && PorcentajeUtilidad.HasValue 
            ? Costo.Value + (UtilidadEnDinero ?? 0) 
            : PrecioUnitario;
        
        // Subtotal para la venta
        public decimal Subtotal => PrecioUnitario * Cantidad;
    }
}
