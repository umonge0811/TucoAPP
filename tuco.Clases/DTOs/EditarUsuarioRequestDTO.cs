
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs
{
    /// <summary>
    /// DTO para manejar la solicitud de edición de usuarios.
    /// </summary>
    public class EditarUsuarioRequestDTO
    {
        /// <summary>
        /// Nombre de usuario único.
        /// </summary>
        [Required(ErrorMessage = "El nombre de usuario es requerido.")]
        [StringLength(50, ErrorMessage = "El nombre de usuario no puede exceder 50 caracteres.")]
        public string NombreUsuario { get; set; }

        /// <summary>
        /// Estado activo del usuario.
        /// </summary>
        public bool Activo { get; set; }

        /// <summary>
        /// Indica si el usuario puede ser considerado para el ranking de top vendedor.
        /// </summary>
        public bool EsTopVendedor { get; set; }
    }
}
