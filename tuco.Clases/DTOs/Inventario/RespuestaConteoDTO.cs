using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// DTO para respuesta de registro de conteo
    /// Proporciona feedback inmediato al usuario
    /// </summary>
    public class RespuestaConteoDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;

        // Información del conteo registrado
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int CantidadSistema { get; set; }
        public int CantidadFisica { get; set; }
        public int Diferencia { get; set; }

        // Alertas y validaciones
        public bool TieneDiscrepancia { get; set; }
        public bool RequiereValidacion { get; set; }
        public bool DiscrepanciaGrande { get; set; } // Diferencia > 10% o > 5 unidades
        public string? TipoAlerta { get; set; } // "Leve", "Moderada", "Grave"

        // Progreso actualizado del inventario
        public int ProductosContados { get; set; }
        public int TotalProductos { get; set; }
        public decimal PorcentajeProgreso { get; set; }
        public int DiscrepanciasTotal { get; set; }

        // Sugerencias para el usuario
        public List<string> Sugerencias { get; set; } = new List<string>();
        public bool RequiereReconteo { get; set; }
    }
}
