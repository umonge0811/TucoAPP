using System;
using System.Collections.Generic;
using System.Text.Json.Serialization; // Importar para usar [JsonIgnore]
using Tuco.Clases.Models;

namespace tuco.Clases.Models;

public partial class Role
{
    public int RolId { get; set; }

    public string NombreRol { get; set; } = null!;

    public string? DescripcionRol { get; set; }

    // Relación directa con Permisos
    [JsonIgnore] // Evitar referencias circulares si no es necesario incluir permisos en la respuesta
    public virtual ICollection<Permiso> Permisos { get; set; } = new List<Permiso>();

    // Relación directa con Usuarios
    [JsonIgnore] // Evitar referencias circulares si no es necesario incluir usuarios en la respuesta
    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();

    // Propiedad de navegación para UsuarioRol
    [JsonIgnore] // Evitar referencias circulares
    public ICollection<UsuarioRolRE> UsuarioRoles { get; set; }

    // Relación con RolPermiso
    [JsonIgnore] // Evitar referencias circulares
    public virtual ICollection<RolPermisoRE> RolPermiso { get; set; } = new List<RolPermisoRE>();
}
