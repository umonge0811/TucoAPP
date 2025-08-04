
namespace GestionLlantera.Web.Models.DTOs
{
    public class ApiErrorResponse
    {
        public string Message { get; set; } = string.Empty;
        public string? Field { get; set; }
        public string? ErrorType { get; set; }
    }
}
