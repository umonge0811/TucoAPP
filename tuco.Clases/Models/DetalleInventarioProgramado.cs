// tuco.Clases.Models/DetalleInventarioProgramado.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    public class DetalleInventarioProgramado
    {
        [Key]
        public int DetalleId { get; set; }

        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        [Required]
        public int CantidadSistema { get; set; }

        public int? CantidadFisica { get; set; }

        public int? Diferencia { get; set; }

        [StringLength(500)]
        public string Observaciones { get; set; }

        public int? UsuarioConteoId { get; set; }

        public DateTime? FechaConteo { get; set; }

        // Relaciones
        [ForeignKey("InventarioProgramadoId")]
        public virtual InventarioProgramado InventarioProgramado { get; set; }

        [ForeignKey("ProductoId")]
        public virtual Producto Producto { get; set; }

        [ForeignKey("UsuarioConteoId")]
        public virtual Usuario UsuarioConteo { get; set; }
    }
}