using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.ViewModels
{
    // Models/ViewModels/ActivacionCuentaViewModel.cs
    public class ActivacionCuentaViewModel
    {
        // Token recibido por URL
        public string Token { get; set; }

        // Nueva contraseña que establecerá el usuario
        [Required(ErrorMessage = "La contraseña es requerida")]
        [DataType(DataType.Password)]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener entre 6 y 100 caracteres")]
        public string NuevaContrasena { get; set; }

        // Confirmación de la contraseña
        [Required(ErrorMessage = "La confirmación de contraseña es requerida")]
        [DataType(DataType.Password)]
        [Compare("NuevaContrasena", ErrorMessage = "Las contraseñas no coinciden")]
        public string ConfirmarContrasena { get; set; }

        // Estado del token para mostrar diferentes vistas
        public bool TokenExpirado { get; set; }
        public bool CuentaActiva { get; set; }
    }
}
