using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TucoMAUI_APP.Models
{
    internal class APIs
    {
        public const string AuthenticateUser = "/api/Auth/login"; // Ruta para login
        public const string RegisterUser = "/api/Auth/register"; // Ruta para registro
        //public const string RefreshToken = "/api/Auth/refresh-token"; // Ruta para refrescar token (si aplica)
        public const string GetAllUsers = "/api/Usuarios/usuarios"; // Ajusta según tu API

    }
}
