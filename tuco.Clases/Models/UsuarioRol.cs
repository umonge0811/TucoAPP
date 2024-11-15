using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using tuco.Clases.Models;

namespace Tuco.Clases.Models
{
    /// <summary>
    /// Clase que representa la relación muchos a muchos entre Usuarios y Roles.
    /// </summary>
    public class UsuarioRol
    {
        /// <summary>
        /// ID del usuario.
        /// </summary>
        [Key, Column(Order = 0)]
        public int UsuarioId { get; set; }

        /// <summary>
        /// ID del rol.
        /// </summary>
        [Key, Column(Order = 1)]
        public int RolId { get; set; }

        /// <summary>
        /// Relación con la entidad Usuario.
        /// </summary>
        [ForeignKey(nameof(UsuarioId))]
        public virtual Usuario Usuario { get; set; }

        /// <summary>
        /// Relación con la entidad Rol.
        /// </summary>
        [ForeignKey(nameof(RolId))]
        public virtual Role Rol { get; set; }
    }
}
