
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs
{
    public class AsignarPermisoRequest
    {
        [Required]
        public int UsuarioId { get; set; }
        
        [Required]
        public int PermisoId { get; set; }
    }
}
