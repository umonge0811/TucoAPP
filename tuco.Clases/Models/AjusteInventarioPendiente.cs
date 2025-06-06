using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using tuco.Clases.Models;
using Tuco.Clases.Models;

namespace Tuco.Clases.Models
{
    [Table("AjustesInventarioPendientes")]
    public class AjusteInventarioPendiente
    {
        [Key]
        public int AjusteId { get; set; }

        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        [Required]
        [StringLength(50)]
        public string TipoAjuste { get; set; } = string.Empty;

        [Required]
        public int CantidadSistemaOriginal { get; set; }

        [Required]
        public int CantidadFisicaContada { get; set; }

        [Required]
        public int CantidadFinalPropuesta { get; set; }

        [Required]
        [StringLength(500)]
        public string MotivoAjuste { get; set; } = string.Empty;

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [Required]
        [StringLength(20)]
        public string Estado { get; set; } = "Pendiente";

        public DateTime? FechaAplicacion { get; set; }

        // Navegación (relaciones con otras entidades)
        [ForeignKey("InventarioProgramadoId")]
        public virtual InventarioProgramado? InventarioProgramado { get; set; }

        [ForeignKey("ProductoId")]
        public virtual Producto? Producto { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }
}