using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs
{
    // UsuarioDTO.cs
    public class UsuarioDTO
    {
        public int UsuarioId { get; set; }
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public bool Activo { get; set; }
        public bool EsTopVendedor { get; set; }
        public int RolId { get; set; }
        public DateTime? FechaRegistro { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }
}