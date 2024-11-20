using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs
{
    public class RoleDTO
    {
        public string NombreRol { get; set; }
        public string DescripcionRol { get; set; }
        public List<int> PermisoIds { get; set; } // IDs de permisos asociados
    }

}
