using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para información específica de llantas en la toma
    /// Basado en LlantaDTO pero optimizado para visualización rápida
    /// </summary>
    public class LlantaTomaDTO
    {
        public int LlantaId { get; set; }
        public int ProductoId { get; set; }

        // Información básica (del LlantaDTO existente)
        public int? Ancho { get; set; }
        public int? Perfil { get; set; }
        public string? Diametro { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public int? Capas { get; set; }
        public string? IndiceVelocidad { get; set; }
        public string? TipoTerreno { get; set; }

        // Propiedades calculadas para facilitar identificación
        public string Medidas
        {
            get
            {
                if (Ancho.HasValue && Perfil.HasValue && !string.IsNullOrEmpty(Diametro))
                {
                    return $"{Ancho}/{Perfil}/R{Diametro}";
                }
                else if (Ancho.HasValue && !string.IsNullOrEmpty(Diametro))
                {
                    return $"{Ancho}/R{Diametro}";
                }
                return "Medidas no disponibles";
            }
        }

        public string MarcaModelo =>
            !string.IsNullOrEmpty(Marca) && !string.IsNullOrEmpty(Modelo) ?
            $"{Marca} {Modelo}" :
            !string.IsNullOrEmpty(Marca) ? Marca :
            !string.IsNullOrEmpty(Modelo) ? Modelo : "Sin especificar";

        public string EspecificacionesCompletas =>
            $"{Medidas} - {MarcaModelo}" +
            (!string.IsNullOrEmpty(TipoTerreno) ? $" ({TipoTerreno})" : "");
    }
}
