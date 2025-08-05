using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs
{
    // CreateUsuarioDTO.cs
    public class CreateUsuarioDTO
    {
        [Required(ErrorMessage = "El nombre de usuario es requerido")]
        public string NombreUsuario { get; set; }

        [Required(ErrorMessage = "El correo electrónico es requerido")]
        [EmailAddress(ErrorMessage = "El formato del correo no es válido")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Debe seleccionar un rol")]
        public int RolId { get; set; }

        public bool EsTopVendedor { get; set; } = false;
    }
}
