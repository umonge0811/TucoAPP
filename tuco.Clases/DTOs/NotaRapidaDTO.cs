
using System.ComponentModel.DataAnnotations;

namespace tuco.Clases.DTOs
{
    /// <summary>
    /// DTO para mostrar información de una nota rápida
    /// </summary>
    public class NotaRapidaDTO
    {
        public int NotaId { get; set; }
        public int UsuarioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public string Color { get; set; } = "#ffd700";
        public bool EsFavorita { get; set; }
        
        // Propiedades calculadas
        public string TiempoTranscurrido 
        { 
            get 
            {
                var tiempo = DateTime.Now - FechaCreacion;
                if (tiempo.TotalMinutes < 1)
                    return "Hace un momento";
                if (tiempo.TotalHours < 1)
                    return $"Hace {(int)tiempo.TotalMinutes} min";
                if (tiempo.TotalDays < 1)
                    return $"Hace {(int)tiempo.TotalHours} h";
                if (tiempo.TotalDays < 7)
                    return $"Hace {(int)tiempo.TotalDays} días";
                return FechaCreacion.ToString("dd/MM/yyyy");
            }
        }
        
        public string ContenidoResumido 
        { 
            get 
            {
                if (Contenido.Length <= 100)
                    return Contenido;
                return Contenido.Substring(0, 100) + "...";
            }
        }
    }

    /// <summary>
    /// DTO para crear una nueva nota rápida
    /// </summary>
    public class CrearNotaRapidaDTO
    {
        [Required(ErrorMessage = "El título es obligatorio")]
        [StringLength(100, ErrorMessage = "El título no puede exceder los 100 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El contenido es obligatorio")]
        [StringLength(1000, ErrorMessage = "El contenido no puede exceder los 1000 caracteres")]
        public string Contenido { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "El color debe ser un valor hexadecimal válido")]
        public string Color { get; set; } = "#ffd700";

        public bool EsFavorita { get; set; } = false;

        /// <summary>
        /// ID del usuario que crea la nota (se asigna automáticamente en el controlador)
        /// </summary>
        public int UsuarioId { get; set; }
    }

    /// <summary>
    /// DTO para actualizar una nota rápida existente
    /// </summary>
    public class ActualizarNotaRapidaDTO
    {
        public int NotaId { get; set; }

        [Required(ErrorMessage = "El título es obligatorio")]
        [StringLength(100, ErrorMessage = "El título no puede exceder los 100 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El contenido es obligatorio")]
        [StringLength(1000, ErrorMessage = "El contenido no puede exceder los 1000 caracteres")]
        public string Contenido { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "El color debe ser un valor hexadecimal válido")]
        public string Color { get; set; } = "#ffd700";

        public bool EsFavorita { get; set; } = false;
    }

    /// <summary>
    /// DTO para cambiar estado favorita de una nota
    /// </summary>
    public class CambiarFavoritaNotaDTO
    {
        public int NotaId { get; set; }
        public bool EsFavorita { get; set; }
    }
}
