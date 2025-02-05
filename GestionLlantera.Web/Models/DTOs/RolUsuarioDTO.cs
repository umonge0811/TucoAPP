using System.Text.Json.Serialization;

namespace GestionLlantera.Web.Models.DTOs
{
    public class RolUsuarioDTO
    {
        [JsonPropertyName("rolld")]
        public int Rolld { get; set; }

        [JsonPropertyName("nombr@Rol")]
        public string NombreRol { get; set; }

        [JsonPropertyName("descriptionRol")]
        public string DescripcionRol { get; set; }

        [JsonPropertyName("asignado")]
        public bool Asignado { get; set; }
    }
}