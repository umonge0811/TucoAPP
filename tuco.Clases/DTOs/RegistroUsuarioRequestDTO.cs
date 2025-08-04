using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations; // Necesario para DataAnnotations

namespace Tuco.Clases.DTOs
{
    /// <summary>
    /// DTO para manejar la solicitud de registro de usuarios.
    /// </summary>
    public class RegistroUsuarioRequestDTO
    {
        /// <summary>
        /// Nombre de usuario único.
        /// </summary>
        [Required(ErrorMessage = "El nombre de usuario es requerido.")]
        [StringLength(50, ErrorMessage = "El nombre de usuario no puede exceder 50 caracteres.")]
        public string NombreUsuario { get; set; }

        /// <summary>
        /// Email del usuario (también será usado como identificador).
        /// </summary>
        [Required(ErrorMessage = "El email es requerido.")]
        [EmailAddress(ErrorMessage = "El formato del email no es válido.")]
        public string Email { get; set; }

        /// <summary>
        /// ID del rol que se asignará al usuario.
        /// </summary>
        [Required(ErrorMessage = "El rol es requerido.")]
        public int RolId { get; set; }

        /// <summary>
        /// Indica si el usuario puede ser considerado para el ranking de top vendedor.
        /// </summary>
        public bool EsTopVendedor { get; set; } = false;
    }
}