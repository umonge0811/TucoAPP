// tuco.Clases.Models/InventarioProgramado.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Tuco.Clases.Models;

namespace tuco.Clases.Models
{
    public class InventarioProgramado
    {
        [Key]
        public int InventarioProgramadoId { get; set; }

        [Required]
        [StringLength(100)]
        public string Titulo { get; set; }

        [StringLength(500)]
        public string Descripcion { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaFin { get; set; }

        [Required]
        [StringLength(50)]
        public string TipoInventario { get; set; } // 'Completo', 'Parcial', 'Cíclico'

        [Required]
        [StringLength(50)]
        public string Estado { get; set; } // 'Programado', 'En Progreso', 'Completado', 'Cancelado'

        [Required]
        public DateTime FechaCreacion { get; set; }

        [Required]
        public int UsuarioCreadorId { get; set; }

        [StringLength(100)]
        public string UbicacionEspecifica { get; set; }

        public bool IncluirStockBajo { get; set; }

        // Navegación
        [ForeignKey("UsuarioCreadorId")]
        public virtual Usuario UsuarioCreador { get; set; }

        public virtual ICollection<AsignacionUsuarioInventario> AsignacionesUsuarios { get; set; }

        public virtual ICollection<DetalleInventarioProgramado> DetallesInventario { get; set; }

        public virtual ICollection<MovimientoPostCorte> MovimientosPostCorte { get; set; }

        //public virtual ICollection<AlertasInventario> Alertas { get; set; }

        //public virtual ICollection<AlertasInvProgramado> Alertas { get; set; } = new List<AlertasInvProgramado>();



        public InventarioProgramado()
        {
            AsignacionesUsuarios = new HashSet<AsignacionUsuarioInventario>();
            DetallesInventario = new HashSet<DetalleInventarioProgramado>();
            MovimientosPostCorte = new HashSet<MovimientoPostCorte>();
            //Alertas = new HashSet<AlertasInvProgramado>();
            FechaCreacion = DateTime.Now;
            Estado = "Programado";
        }
    }
}