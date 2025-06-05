using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que representa el resultado de registrar un conteo de producto
    /// </summary>
    public class ResultadoConteoDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;

        // Información del conteo
        public bool TieneDiscrepancia { get; set; }
        public bool EsDiscrepanciaCritica { get; set; }
        public int Diferencia { get; set; }
        public DateTime? FechaConteo { get; set; }

        // Progreso del inventario
        public ProgresoInventarioDTO? ProgresoInventario { get; set; }

        // Información adicional
        public string? MensajeDiscrepancia { get; set; }
        public List<string> Recomendaciones { get; set; } = new List<string>();
    }
}