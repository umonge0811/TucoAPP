using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using tuco.Clases.Models;

namespace Tuco.Clases.Models
{
    [Table("Anuncios")]
    public partial class Anuncio
    {
        public int AnuncioId { get; set; }

        public int UsuarioId { get; set; }

        [StringLength(200)]
        public string Titulo { get; set; } = null!;

        [StringLength(1000)]
        public string Contenido { get; set; } = null!;

        [StringLength(50)]
        public string? TipoAnuncio { get; set; }

        [StringLength(20)]
        public string? Prioridad { get; set; }

        public bool? EsImportante { get; set; }

        public bool EsActivo { get; set; } = true;

        public DateTime FechaCreacion { get; set; }

        public DateTime? FechaModificacion { get; set; }

        public DateTime? FechaVencimiento { get; set; }

        public virtual Usuario Usuario { get; set; } = null!;
    }
}