
namespace GestionLlantera.Web.Models.DTOs
{
    public class ActualizarUsuarioDTO
    {
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty; // Solo para compatibilidad, no se usará
        public int? RolId { get; set; }
        public bool Activo { get; set; }
        public bool EsTopVendedor { get; set; }
    }
}
