using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class NotasRapidas
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

        public DateTime? FechaModificacion { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [StringLength(20)]
        public string Color { get; set; } = "#ffd700";

        public bool EsFavorita { get; set; } = false;

        public bool Eliminada { get; set; } = false;

        public virtual Usuarios Usuario { get; set; }
    }
}