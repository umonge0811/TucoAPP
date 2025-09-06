using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    [Table("Servicios")]
    public partial class Servicio
    {
        [Key]
        public int ServicioId { get; set; }

        [Required(ErrorMessage = "El nombre del servicio es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre del servicio no puede tener más de 100 caracteres")]
        public string NombreServicio { get; set; } = null!;

        [Column(TypeName = "text")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio base es obligatorio")]
        [Column(TypeName = "decimal(10,2)")]
        [Range(0.01, 999999.99, ErrorMessage = "El precio base debe ser mayor a 0")]
        public decimal PrecioBase { get; set; }

        [Required(ErrorMessage = "El tipo de servicio es obligatorio")]
        [StringLength(50, ErrorMessage = "El tipo de servicio no puede tener más de 50 caracteres")]
        public string TipoServicio { get; set; } = null!;

        [Required]
        public bool EstaActivo { get; set; } = true;

        [Column(TypeName = "datetime")]
        public DateTime? FechaCreacion { get; set; } = DateTime.Now;

        [Column(TypeName = "datetime")]
        public DateTime? FechaUltimaActualizacion { get; set; }

        [Column(TypeName = "text")]
        public string? Observaciones { get; set; }

        // Propiedad calculada para mostrar estado
        public string EstadoTexto => EstaActivo ? "Activo" : "Inactivo";

        // Propiedad para mostrar precio formateado
        public string PrecioFormateado => $"₡{PrecioBase:N2}";
    }
}
using System.ComponentModel.DataAnnotations;

namespace tuco.Clases.Models
{
    public partial class Servicio
    {
        public int ServicioId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string NombreServicio { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Descripcion { get; set; }
        
        [Required]
        public decimal Precio { get; set; }
        
        public bool Activo { get; set; } = true;
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public DateTime? FechaActualizacion { get; set; }
    }
}
