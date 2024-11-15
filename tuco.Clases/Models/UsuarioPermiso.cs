using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using tuco.Clases.Models;

namespace Tuco.Clases.Models
{
    /// <summary>
    /// Clase que representa la relación muchos a muchos entre Usuarios y Permisos.
    /// </summary>
    public class UsuarioPermiso
    {
        [Key, Column(Order = 0)]
        public int UsuarioID { get; set; }

        [Key, Column(Order = 1)]
        public int PermisoID { get; set; }

        /// <summary>
        /// Relación con la entidad Usuario.
        /// </summary>
        [ForeignKey("UsuarioID")]
        public Usuario Usuario { get; set; }

        /// <summary>
        /// Relación con la entidad Permiso.
        /// </summary>
        [ForeignKey("PermisoID")]
        public Permiso Permiso { get; set; }
    }
}