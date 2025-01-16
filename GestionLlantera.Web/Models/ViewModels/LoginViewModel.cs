using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace GestionLlantera.Web.Models.ViewModels
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "El correo electrónico es requerido")]
        [EmailAddress(ErrorMessage = "El formato del correo no es válido")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es requerida")]
        public string Contrasena { get; set; } = string.Empty;

        public bool RecordarMe { get; set; }
        public ClaimsIdentity? NombreUsuario { get; internal set; }
    }
}