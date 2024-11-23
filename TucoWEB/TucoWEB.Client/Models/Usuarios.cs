namespace TucoWEB.Client.Models
{
    /// <summary>
    /// Representa un usuario en el cliente de TucoWEB.
    /// </summary>
    public class Usuario
    {
        public int UsuarioID { get; set; } // Identificador único del usuario
        public string NombreUsuario { get; set; } // Nombre del usuario
        public string Email { get; set; } // Email del usuario
        public bool Activo { get; set; } // Indica si la cuenta está activa
    }
}
