using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.ViewModels
{
    // Models/ViewModels/RestablecerContrasenaViewModel.cs
    public class RestablecerContrasenaViewModel
    {
        [Required(ErrorMessage = "La nueva contraseña es requerida")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener entre 6 y 100 caracteres")]
        [Display(Name = "Nueva Contraseña")]
        public string NuevaContrasena { get; set; }

        [Required(ErrorMessage = "La confirmación de contraseña es requerida")]
        [Compare("NuevaContrasena", ErrorMessage = "Las contraseñas no coinciden")]
        [Display(Name = "Confirmar Contraseña")]
        public string ConfirmarContrasena { get; set; }

        public string Token { get; set; }
    }
}
