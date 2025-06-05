using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO específico para información de llantas durante la toma de inventario
    /// </summary>
    public class LlantaTomaDTO
    {
        public int? Ancho { get; set; }
        public int? Perfil { get; set; }
        public string? Diametro { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? IndiceVelocidad { get; set; }
        public string? TipoTerreno { get; set; }

        public string MedidaCompleta =>
            Ancho.HasValue && Perfil.HasValue && !string.IsNullOrEmpty(Diametro)
                ? $"{Ancho}/{Perfil}R{Diametro}"
                : "Sin medida";
    }
}