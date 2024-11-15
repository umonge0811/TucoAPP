using System;
using System.Collections.Generic;
using Tuco.Clases.Models;

namespace tuco.Clases.Models;

public partial class Role
{
    public int RolId { get; set; }

    public string NombreRol { get; set; } = null!;

    public string? DescripcionRol { get; set; }

    public virtual ICollection<Permiso> Permisos { get; set; } = new List<Permiso>();

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();

    // Propiedad de navegación para UsuarioRol
    public ICollection<UsuarioRol> UsuarioRoles { get; set; }

    // Relación con RolPermiso
    public virtual ICollection<RolPermiso> RolPermiso { get; set; } = new List<RolPermiso>();
}
