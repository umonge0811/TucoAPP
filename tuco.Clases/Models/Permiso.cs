using System;
using System.Collections.Generic;
using Tuco.Clases.Models;

namespace tuco.Clases.Models;

public partial class Permiso
{
    public int PermisoId { get; set; }

    public string NombrePermiso { get; set; } = null!;

    public string DescripcionPermiso { get; set; } = null!;

    public virtual ICollection<Role> Rols { get; set; } = new List<Role>();

    // Relación con RolPermiso
    public virtual ICollection<RolPermiso> RolPermiso { get; set; } = new List<RolPermiso>();

    // Relación con UsuarioPermiso
    public virtual ICollection<UsuarioPermiso> UsuarioPermiso { get; set; } = new List<UsuarioPermiso>();
}
