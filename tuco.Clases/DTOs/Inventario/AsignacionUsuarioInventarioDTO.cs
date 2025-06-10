namespace Tuco.Clases.DTOs.Inventario
{
    public class AsignacionUsuarioInventarioDTO
    {
        public int AsignacionId { get; set; }
        public int InventarioProgramadoId { get; set; }
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; }
        public string EmailUsuario { get; set; }
        public bool PermisoConteo { get; set; } = true;     // Permiso para contar físicamente
        public bool PermisoAjuste { get; set; } = false;    // Permiso para ajustar cantidades
        public bool PermisoValidacion { get; set; } = false; // Permiso para validar el inventario final
        public bool PermisoCompletar { get; set; } = false;
        public DateTime? FechaAsignacion { get; set; }
    }
}
