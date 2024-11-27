﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs
{
    /// <summary>
    /// DTO para manejar la solicitud de login del usuario.
    /// </summary>
    public class LoginRequestDTO
    {
        /// <summary>
        /// Correo electrónico del usuario.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Contraseña ingresada por el usuario.
        /// </summary>
        public string? Contrasena { get; set; }
    }
}
