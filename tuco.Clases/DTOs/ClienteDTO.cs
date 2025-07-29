
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs
{
    public class ClienteDTO
    {
        public int ClienteId { get; set; }

        [Required(ErrorMessage = "El nombre del cliente es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre no puede tener más de 100 caracteres")]
        public string NombreCliente { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "El contacto no puede tener más de 100 caracteres")]
        public string? Contacto { get; set; }

        [StringLength(200, ErrorMessage = "La dirección no puede tener más de 200 caracteres")]
        public string? Direccion { get; set; }

        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        [StringLength(100, ErrorMessage = "El email no puede tener más de 100 caracteres")]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "El teléfono no puede tener más de 20 caracteres")]
        public string? Telefono { get; set; }

        public int? UsuarioId { get; set; }
        public string? NombreUsuario { get; set; }

        // Propiedades calculadas para la vista
        public string ContactoCompleto => 
            !string.IsNullOrEmpty(Telefono) && !string.IsNullOrEmpty(Email) 
                ? $"{Telefono} | {Email}" 
                : Telefono ?? Email ?? "Sin contacto";

        public string DireccionCorta => 
            !string.IsNullOrEmpty(Direccion) && Direccion.Length > 50 
                ? Direccion.Substring(0, 47) + "..." 
                : Direccion ?? "Sin dirección";
    }
}
