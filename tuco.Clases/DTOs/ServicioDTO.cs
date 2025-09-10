using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs
{
    public class ServicioDTO
    {
        public int ServicioId { get; set; }

        [Required(ErrorMessage = "El nombre del servicio es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre del servicio no puede tener más de 100 caracteres")]
        public string NombreServicio { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio base es obligatorio")]
        [Range(0.01, 999999.99, ErrorMessage = "El precio base debe ser mayor a 0")]
        public decimal PrecioBase { get; set; }

        [Required(ErrorMessage = "El tipo de servicio es obligatorio")]
        [StringLength(50, ErrorMessage = "El tipo de servicio no puede tener más de 50 caracteres")]
        public string TipoServicio { get; set; } = string.Empty;

        public bool EstaActivo { get; set; } = true;

        public DateTime? FechaCreacion { get; set; }

        public DateTime? FechaUltimaActualizacion { get; set; }

        public string? Observaciones { get; set; }

        // Propiedades calculadas para el frontend
        public string EstadoTexto => EstaActivo ? "Activo" : "Inactivo";
        public string PrecioFormateado => $"₡{PrecioBase:N2}";
    }
}