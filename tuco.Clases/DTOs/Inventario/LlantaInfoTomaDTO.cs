using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para información específica de llantas en la toma
    /// </summary>
    public class LlantaInfoTomaDTO
    {
        public string Medidas { get; set; } = string.Empty; // Ej: "225/60/R16"
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? TipoTerreno { get; set; }
        public string? IndiceVelocidad { get; set; }
    }
}
