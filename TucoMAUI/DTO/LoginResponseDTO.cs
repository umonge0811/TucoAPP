using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TucoMAUI.DTO
{
    public class LoginResponseDTO
    {
        public string Token { get; set; } // Token JWT devuelto por la API
        public string Message { get; set; } // Mensaje de éxito o error
    }
}
