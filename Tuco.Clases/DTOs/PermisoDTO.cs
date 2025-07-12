using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs
{
    namespace Tuco.Clases.DTOs
    {
        /// <summary>
        /// DTO para crear un permiso.
        /// </summary>
        public class PermisoDTO
        {
            public int PermisoId { get; set; }  // Agregar esta propiedad

            [Required(ErrorMessage = "El nombre del permiso es obligatorio.")]
            [StringLength(100, ErrorMessage = "El nombre del permiso no puede exceder los 100 caracteres.")]
            public string NombrePermiso { get; set; }

            [StringLength(255, ErrorMessage = "La descripción no puede exceder los 255 caracteres.")]
            public string? DescripcionPermiso { get; set; }

            [StringLength(100, ErrorMessage = "El módulo no puede exceder los 100 caracteres.")]
            public string? Modulo { get; set; }
        }
    }
}