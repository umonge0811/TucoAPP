
using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs
{
    public class ActualizarUsuarioDTO
    {
        public int UsuarioId { get; set; }
        
        [Required(ErrorMessage = "El nombre de usuario es requerido.")]
        [StringLength(50, ErrorMessage = "El nombre de usuario no puede exceder 50 caracteres.")]
        public string NombreUsuario { get; set; }
        
        public bool Activo { get; set; }
        public bool EsTopVendedor { get; set; }
    }
}
