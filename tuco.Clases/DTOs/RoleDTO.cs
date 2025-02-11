using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace Tuco.Clases.DTOs
{
    // En Tuco.Clases/DTOs/RoleDTO.cs
    public class RoleDTO
    {
        public int RolId { get; set; }

        [Required(ErrorMessage = "El nombre del rol es obligatorio.")]
        [StringLength(100, ErrorMessage = "El nombre del rol no puede exceder los 100 caracteres.")]
        public string NombreRol { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "La descripción no puede exceder los 255 caracteres.")]
        public string? DescripcionRol { get; set; }

        public List<PermisoDTO> Permisos { get; set; } = new();
        public List<int> PermisoIds { get; set; } = new();
    }


}
