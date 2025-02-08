using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs
{
    public class RestablecerContrasenaRequestDTO
    {
        public string Token { get; set; }
        public string NuevaContrasena { get; set; }
    }
}
