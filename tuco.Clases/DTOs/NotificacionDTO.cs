using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs
{
    public class NotificacionDTO
    {
        public int NotificacionId { get; set; }
        public int UsuarioId { get; set; }
        public string Titulo { get; set; }
        public string Mensaje { get; set; }
        public string Tipo { get; set; }
        public string? Icono { get; set; }
        public bool Leida { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaLectura { get; set; }
        public string? EntidadTipo { get; set; }
        public int? EntidadId { get; set; }
        public string? UrlAccion { get; set; }

        // Propiedades calculadas
        public string TiempoTranscurrido { get; set; }
        public string ClaseCSS { get; set; }
    }
}
