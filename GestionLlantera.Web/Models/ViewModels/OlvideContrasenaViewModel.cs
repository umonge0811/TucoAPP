using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.ViewModels
{
    // Models/ViewModels/OlvideContrasenaViewModel.cs
    public class OlvideContrasenaViewModel
    {
        [Required(ErrorMessage = "El correo electrónico es requerido")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido")]
        public string Email { get; set; }
    }
}
