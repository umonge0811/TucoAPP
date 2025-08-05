
using System;
using System.ComponentModel.DataAnnotations;

namespace tuco.Clases.DTOs
{
    /// <summary>
    /// DTO para mostrar información de un anuncio
    /// </summary>
    public class AnuncioDTO
    {
        public int AnuncioId { get; set; }
        public int UsuarioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public bool EsActivo { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;

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
                if (Contenido.Length <= 150)
                    return Contenido;
                return Contenido.Substring(0, 150) + "...";
            }
        }
    }

    /// <summary>
    /// DTO para crear un nuevo anuncio
    /// </summary>
    public class CrearAnuncioDTO
    {
        [Required(ErrorMessage = "El título es obligatorio")]
        [StringLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El contenido es obligatorio")]
        [StringLength(2000, ErrorMessage = "El contenido no puede exceder los 2000 caracteres")]
        public string Contenido { get; set; } = string.Empty;

        public bool EsActivo { get; set; } = true;

        /// <summary>
        /// ID del usuario que crea el anuncio (se asigna automáticamente en el controlador)
        /// </summary>
        public int UsuarioId { get; set; }
    }

    /// <summary>
    /// DTO para actualizar un anuncio existente
    /// </summary>
    public class ActualizarAnuncioDTO
    {
        public int AnuncioId { get; set; }

        [Required(ErrorMessage = "El título es obligatorio")]
        [StringLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El contenido es obligatorio")]
        [StringLength(2000, ErrorMessage = "El contenido no puede exceder los 2000 caracteres")]
        public string Contenido { get; set; } = string.Empty;

        public bool EsActivo { get; set; } = true;
    }
}
