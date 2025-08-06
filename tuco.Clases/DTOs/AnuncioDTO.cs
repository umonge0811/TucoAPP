
using System;

namespace Tuco.Clases.DTOs
{
    public class AnuncioDTO
    {
        public int AnuncioId { get; set; }
        public int UsuarioCreadorId { get; set; }
        public string NombreCreador { get; set; }
        public string Titulo { get; set; }
        public string Contenido { get; set; }
        public string TipoAnuncio { get; set; }
        public string Prioridad { get; set; }
        public bool EsImportante { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public bool EstaVencido => FechaVencimiento.HasValue && FechaVencimiento.Value < DateTime.Now;
    }

    public class CrearAnuncioDTO
    {
        public string Titulo { get; set; }
        public string Contenido { get; set; }
        public string TipoAnuncio { get; set; } = "General";
        public string Prioridad { get; set; } = "Normal";
        public bool EsImportante { get; set; } = false;
        public DateTime? FechaVencimiento { get; set; }
    }

    public class ActualizarAnuncioDTO : CrearAnuncioDTO
    {
        public int AnuncioId { get; set; }
        public bool? Activo { get; set; }
    }
}
