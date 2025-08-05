
using System;
using System.ComponentModel.DataAnnotations;
using tuco.Clases.Models;

namespace tuco.Clases.Models
{
    public class NotaRapida
    {
        [Key]
        public int NotaId { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [StringLength(100)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Contenido { get; set; } = string.Empty;

        public DateTime? FechaModificacion { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [StringLength(20)]
        public string Color { get; set; } = "#ffd700";

        public bool EsFavorita { get; set; } = false;

        public bool Eliminada { get; set; } = false;

        // Relación con Usuario
        public virtual Usuario Usuario { get; set; }
    }
}
