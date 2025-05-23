using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using tuco.Clases.Models;

namespace Tuco.Clases.Models
{
    public class Notificacion
    {
        [Key]
        public int NotificacionId { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; }

        [Required]
        [StringLength(500)]
        public string Mensaje { get; set; }

        [Required]
        [StringLength(50)]
        public string Tipo { get; set; } // "info", "warning", "success", "danger"

        [StringLength(100)]
        public string? Icono { get; set; } // Clase CSS del ícono

        public bool Leida { get; set; } = false;

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public DateTime? FechaLectura { get; set; }

        // Datos adicionales para vincular con otras entidades
        public string? EntidadTipo { get; set; } // "InventarioProgramado", "Producto", etc.
        public int? EntidadId { get; set; }
        public string? UrlAccion { get; set; } // URL para redireccionar al hacer click

        // Relación con Usuario
        public virtual Usuario Usuario { get; set; }
    }
}
