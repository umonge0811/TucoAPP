using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs.Inventario
{
    public class LlantaDTO
    {
        public int LlantaId { get; set; }

        public int ProductoId { get; set; }

        [Display(Name = "Ancho")]
        public decimal? Ancho { get; set; }

        [Display(Name = "Perfil")]
        public decimal? Perfil { get; set; }

        [Display(Name = "Diámetro")]
        public string? Diametro { get; set; }

        [Display(Name = "Marca")]
        public string? Marca { get; set; }

        [Display(Name = "Modelo")]
        public string? Modelo { get; set; }

        [Display(Name = "Capas")]
        public int? Capas { get; set; }

        [Display(Name = "Índice de Velocidad")]
        public string? IndiceVelocidad { get; set; }

        [Display(Name = "Tipo de Terreno")]
        public string? TipoTerreno { get; set; }

        [Display(Name = "Tipo de Llanta")]
        public string? TipoLlanta { get; set; }
    }
}