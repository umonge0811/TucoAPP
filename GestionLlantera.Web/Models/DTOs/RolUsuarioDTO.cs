using System.Text.Json.Serialization;

namespace GestionLlantera.Web.Models.DTOs
{
    public class RolUsuarioDTO
    {
        public int rolId { get; set; }  // Cambiar a minúsculas para coincidir con el JSON
        public string nombreRol { get; set; } = string.Empty;
        public string descripcionRol { get; set; } = string.Empty;
        public bool asignado { get; set; }
    }

    // También necesitamos una clase wrapper para la respuesta
    public class RolesResponseDTO
    {
        public List<RolUsuarioDTO> Roles { get; set; }
    }
}