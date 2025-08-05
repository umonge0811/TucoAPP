
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tuco.Clases.Models
{
    [Table("Anuncios")]
    public class Anuncio
    {
        [Key]
        public int AnuncioId { get; set; }

        [Required]
        public int UsuarioCreadorId { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; }

        [Required]
        [StringLength(2000)]
        public string Contenido { get; set; }

        [StringLength(50)]
        public string TipoAnuncio { get; set; } = "General";

        [StringLength(20)]
        public string Prioridad { get; set; } = "Normal";

        public bool EsImportante { get; set; } = false;

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public DateTime? FechaModificacion { get; set; }

        public DateTime? FechaVencimiento { get; set; }

        // Navegación
        [ForeignKey("UsuarioCreadorId")]
        public virtual Usuario UsuarioCreador { get; set; }
    }
}
