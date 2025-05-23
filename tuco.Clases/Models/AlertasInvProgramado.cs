using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using tuco.Clases.Models;


namespace Tuco.Clases.Models
{
    public class AlertasInvProgramado
    {

        [Key]
        public int AlertaId { get; set; }

        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [StringLength(50)]
        public string TipoAlerta { get; set; } // 'Asignación', 'Inicio', 'Finalización', 'Discrepancia'

        [Required]
        [StringLength(500)]
        public string Mensaje { get; set; }

        [Required]
        public bool Leida { get; set; } = false;

        [Required]
        public DateTime FechaCreacion { get; set; }

        public DateTime? FechaLectura { get; set; }

        //public virtual InventarioProgramado InventarioProgramado { get; set; }

        public virtual Usuario Usuario { get; set; }

        public AlertasInvProgramado()
        {
            FechaCreacion = DateTime.Now;
        }
    }
}
