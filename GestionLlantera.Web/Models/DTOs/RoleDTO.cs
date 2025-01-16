// Models/DTOs/RoleDTO.cs
public class RoleDTO
{
    public int RolId { get; set; }
    public string NombreRol { get; set; } = string.Empty;
    public string? DescripcionRol { get; set; }
    public List<PermisoDTO> Permisos { get; set; } = new();
}

public class PermisoDTO
{
    public int PermisoId { get; set; }
    public string NombrePermiso { get; set; } = string.Empty;
    public string? DescripcionPermiso { get; set; }
}