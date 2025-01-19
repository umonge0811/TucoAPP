using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs
{
    // UsuarioDTO.cs
    public class UsuarioDTO
    {
        public int UsuarioId { get; set; }  // Agregamos esta propiedad
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public bool Activo { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

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
    }
}
