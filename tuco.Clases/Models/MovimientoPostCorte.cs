// tuco.Clases.Models/MovimientoPostCorte.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    public class MovimientoPostCorte
    {
        [Key]
        public int MovimientoPostCorteId { get; set; }

        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        [Required]
        [StringLength(50)]
        public string TipoMovimiento { get; set; } // 'Venta', 'Ajuste', 'Traspaso', 'Devolucion'

        [Required]
        public int Cantidad { get; set; } // Negativo para ventas/salidas, positivo para devoluciones/entradas

        public int? DocumentoReferenciaId { get; set; } // ID del documento origen (VentaId, AjusteId, etc)

        [StringLength(50)]
        public string? TipoDocumento { get; set; } // 'Venta', 'AjusteInventario', 'Traspaso', etc

        [Required]
        public DateTime FechaMovimiento { get; set; }

        [Required]
        public bool Procesado { get; set; } // false = pendiente de actualizar, true = ya actualizado

        public DateTime? FechaProcesado { get; set; }

        public int? UsuarioProcesadoId { get; set; }

        // Relaciones
        [ForeignKey("InventarioProgramadoId")]
        public virtual InventarioProgramado InventarioProgramado { get; set; }

        [ForeignKey("ProductoId")]
        public virtual Producto Producto { get; set; }

        [ForeignKey("UsuarioProcesadoId")]
        public virtual Usuario? UsuarioProcesado { get; set; }

        public MovimientoPostCorte()
        {
            FechaMovimiento = DateTime.Now;
            Procesado = false;
        }
    }
}
