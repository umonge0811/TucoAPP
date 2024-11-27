using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Tuco.Clases.Models.Password
{
    public class CambiarContraseñaRequest
    {
        public string Token { get; set; }
        public string NuevaContrasena { get; set; }


    }

}
