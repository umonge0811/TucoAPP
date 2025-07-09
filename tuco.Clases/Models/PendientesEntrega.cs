
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    [Table("PendientesEntrega")]
    public class PendientesEntrega
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FacturaId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        [Required]
        public int CantidadSolicitada { get; set; }

        [Required]
        public int CantidadPendiente { get; set; }

        [Required]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public DateTime? FechaEntrega { get; set; }

        [Required]
        [StringLength(50)]
        public string Estado { get; set; } = "Pendiente";

        [StringLength(500)]
        public string? Observaciones { get; set; }

        [Required]
        public int UsuarioCreacion { get; set; }

        public int? UsuarioEntrega { get; set; }

        // Navigation properties
        [ForeignKey("FacturaId")]
        public virtual Factura Factura { get; set; }

        [ForeignKey("ProductoId")]
        public virtual Producto Producto { get; set; }

        [ForeignKey("UsuarioCreacion")]
        public virtual Usuario UsuarioCreacion { get; set; }

        [ForeignKey("UsuarioEntrega")]
        public virtual Usuario? UsuarioEntrega { get; set; }
    }
}
