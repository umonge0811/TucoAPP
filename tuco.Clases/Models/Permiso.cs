using System;
using System.Collections.Generic;
using Tuco.Clases.Models;
using System.Text.Json.Serialization;


namespace tuco.Clases.Models;

public class Permiso
{
    public int PermisoId { get; set; }

    public string NombrePermiso { get; set; } = null!;

    public string? DescripcionPermiso { get; set; }

    [JsonIgnore]
    public virtual ICollection<Role> Rols { get; set; } = new List<Role>();

    [JsonIgnore]
    public virtual ICollection<RolPermisoRE> RolPermiso { get; set; } = new List<RolPermisoRE>();

    [JsonIgnore]
    public virtual ICollection<UsuarioPermisoRE> UsuarioPermiso { get; set; } = new List<UsuarioPermisoRE>();
}
