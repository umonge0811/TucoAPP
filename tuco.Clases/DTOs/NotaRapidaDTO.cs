
using System;

namespace Tuco.Clases.DTOs
{
    public class NotaRapidaDTO
    {
        public int NotaId { get; set; }
        public int UsuarioId { get; set; }
        public string Titulo { get; set; }
        public string Contenido { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public string Color { get; set; }
        public bool EsFavorita { get; set; }
        public string NombreUsuario { get; set; }
    }

    public class CrearNotaRapidaDTO
    {
        public string Titulo { get; set; }
        public string Contenido { get; set; }
        public string Color { get; set; } = "#ffd700";
        public bool EsFavorita { get; set; } = false;
    }

    public class ActualizarNotaRapidaDTO
    {
        public int NotaId { get; set; }
        public string Titulo { get; set; }
        public string Contenido { get; set; }
        public string Color { get; set; }
        public bool EsFavorita { get; set; }
    }
}
