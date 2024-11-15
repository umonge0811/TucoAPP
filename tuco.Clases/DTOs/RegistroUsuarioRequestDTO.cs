using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs
{
    /// <summary>
    /// DTO para manejar la solicitud de registro de usuarios.
    /// </summary>
    public class RegistroUsuarioRequestDTO
    {
        /// <summary>
        /// Nombre del usuario.
        /// </summary>
        public string NombreUsuario { get; set; }

        /// <summary>
        /// Correo electrónico del usuario.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Contraseña del usuario.
        /// </summary>
        public string Contraseña { get; set; }

        /// <summary>
        /// Estado activo del usuario (opcional).
        /// </summary>
        public bool? Activo { get; set; }
    }
}
