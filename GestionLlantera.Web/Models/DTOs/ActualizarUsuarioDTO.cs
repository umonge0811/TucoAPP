
namespace GestionLlantera.Web.Models.DTOs
{
    public class ActualizarUsuarioDTO
    {
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public int? RolId { get; set; }
        public bool Activo { get; set; }
        public bool EsTopVendedor { get; set; }
    }
}
