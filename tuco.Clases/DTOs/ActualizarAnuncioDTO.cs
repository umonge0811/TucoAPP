

using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs
{
    public class ActualizarAnuncioDTO
    {
        [Required(ErrorMessage = "El título es requerido")]
        [StringLength(200, ErrorMessage = "El título no puede exceder 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El contenido es requerido")]
        [StringLength(1000, ErrorMessage = "El contenido no puede exceder 1000 caracteres")]
        public string Contenido { get; set; } = string.Empty;

        public string? TipoAnuncio { get; set; }

        public string? Prioridad { get; set; }

        public bool EsImportante { get; set; }

        public DateTime? FechaVencimiento { get; set; }

        public bool Activo { get; set; } = true;
    }
}
