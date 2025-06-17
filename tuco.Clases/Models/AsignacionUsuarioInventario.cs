// tuco.Clases.Models/AsignacionUsuarioInventario.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    public class AsignacionUsuarioInventario
    {
        [Key]
        public int AsignacionId { get; set; }

        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        public bool PermisoConteo { get; set; } = true;

        [Required]
        public bool PermisoAjuste { get; set; } = false;

        [Required]
        public bool PermisoValidacion { get; set; } = false;

        [Required]
        public bool PermisoCompletar { get; set; } = false;

        [Required]
        public DateTime FechaAsignacion { get; set; }

        // Relaciones
        [ForeignKey("InventarioProgramadoId")]
        public virtual InventarioProgramado InventarioProgramado { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario Usuario { get; set; }

        public AsignacionUsuarioInventario()
        {
            FechaAsignacion = DateTime.Now;
        }
    }
}