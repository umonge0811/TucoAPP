using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    /// <summary>
    /// DTO para servicios en el proceso de facturación y ventas
    /// </summary>
    public class ServicioVentaDTO
    {
        public int ServicioId { get; set; }

        [Required(ErrorMessage = "El nombre del servicio es obligatorio")]
        public string NombreServicio { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio es obligatorio")]
        [Range(0.01, 999999.99, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal PrecioUnitario { get; set; }

        [Required(ErrorMessage = "La cantidad es obligatoria")]
        [Range(0.01, 999.99, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public decimal Cantidad { get; set; } = 1m; // Los servicios pueden ser fraccionarios (horas, etc.)

        public string TipoServicio { get; set; } = string.Empty;

        // Propiedades calculadas
        public decimal Subtotal => PrecioUnitario * Cantidad;

        public string PrecioFormateado => $"₡{PrecioUnitario:N2}";
        
        public string SubtotalFormateado => $"₡{Subtotal:N2}";
        
        public string CantidadTexto => Cantidad % 1 == 0 ? Cantidad.ToString("F0") : Cantidad.ToString("F2");

        // Indica si este item es un servicio (para diferenciarlo de productos)
        public bool EsServicio => true;
    }
}