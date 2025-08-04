
namespace GestionLlantera.Web.Models.DTOs
{
    public class UsuarioCreationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorType { get; set; }
        public string? Field { get; set; }
    }
}
