
using System;
using System.ComponentModel.DataAnnotations;
using tuco.Clases.Models;

namespace Tuco.Clases.Models
{
    public class NotaRapida
    {
        [Key]
        public int NotaId { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [StringLength(100)]
        public string Titulo { get; set; }

        [Required]
        [StringLength(1000)]
        public string Contenido { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public DateTime? FechaModificacion { get; set; }

        [StringLength(20)]
        public string Color { get; set; } = "#ffd700"; // Color para la nota (amarillo por defecto)

        public bool EsFavorita { get; set; } = false;

        // Relación con Usuario
        public virtual Usuario Usuario { get; set; }
    }
}
