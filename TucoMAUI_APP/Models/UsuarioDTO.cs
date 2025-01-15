using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TucoMAUI_APP.Models
{
    public class UsuarioDTO
	{
        public int UsuarioId { get; set; } // Identificador único del usuario
        public string NombreUsuario { get; set; } // Nombre del usuario
        public string Email { get; set; } // Correo electrónico del usuario
        public bool Activo { get; set; } // Estado activo/inactivo del usuario

    }
}
