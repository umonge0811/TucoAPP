// Ubicación: tuco.Clases/DTOs/Inventario/LlantaDTO.cs

using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class LlantaDTO
    {
        public int LlantaId { get; set; }

        public int ProductoId { get; set; }

        [Range(0, 999, ErrorMessage = "El ancho debe estar entre 0 y 999")]
        public int? Ancho { get; set; }

        [Range(0, 99, ErrorMessage = "El perfil debe estar entre 0 y 99")]
        public int? Perfil { get; set; }

        [StringLength(10, ErrorMessage = "El diámetro no puede tener más de 10 caracteres")]
        public string? Diametro { get; set; }

        [StringLength(50, ErrorMessage = "La marca no puede tener más de 50 caracteres")]
        public string? Marca { get; set; }

        [StringLength(50, ErrorMessage = "El modelo no puede tener más de 50 caracteres")]
        public string? Modelo { get; set; }

        [Range(0, 99, ErrorMessage = "El número de capas debe estar entre 0 y 99")]
        public int? Capas { get; set; }

        [StringLength(5, ErrorMessage = "El índice de velocidad no puede tener más de 5 caracteres")]
        public string? IndiceVelocidad { get; set; }

        [StringLength(50, ErrorMessage = "El tipo de terreno no puede tener más de 50 caracteres")]
        public string? TipoTerreno { get; set; }
    }
}