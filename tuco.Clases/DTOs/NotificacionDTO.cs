// NotificacionDTO.cs
namespace Tuco.Clases.DTOs
{
    public class NotificacionDTO
    {
        public int NotificacionId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty; // info, success, warning, error
        public string? Icono { get; set; }
        public bool Leida { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaLectura { get; set; }
        public string? UrlAccion { get; set; }
        public string? EntidadTipo { get; set; }
        public int? EntidadId { get; set; }
    }
}

// CrearNotificacionDTO.cs
namespace Tuco.Clases.DTOs
{
    public class CrearNotificacionDTO
    {
        public int UsuarioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string Tipo { get; set; } = "info"; // info, success, warning, error
        public string? Icono { get; set; }
        public string? UrlAccion { get; set; }
        public string? EntidadTipo { get; set; }
        public int? EntidadId { get; set; }
    }
}