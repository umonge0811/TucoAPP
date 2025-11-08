using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    [Table("AlertasInventario")]
    public class AlertasInventario
    {
        [Key]
        public int AlertaId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        [Required]
        public DateTime FechaCreacion { get; set; }

        [Required]
        [StringLength(50)]
        public string TipoAlerta { get; set; }

        [Required]
        [StringLength(500)]
        public string Mensaje { get; set; }

        // Nuevas columnas agregadas
        public int? InventarioProgramadoId { get; set; }

        public int? UsuarioId { get; set; }

        [Required]
        public bool Leida { get; set; } = false;

        public DateTime? FechaLectura { get; set; }

        // Relaciones
        [ForeignKey("ProductoId")]
        public virtual Producto Producto { get; set; }

        [ForeignKey("InventarioProgramadoId")]
        public virtual InventarioProgramado InventarioProgramado { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario Usuario { get; set; }

        public AlertasInventario()
        {
            FechaCreacion = DateTime.Now;
        }
    }
}
