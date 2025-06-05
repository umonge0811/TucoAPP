using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que representa el resultado de iniciar un inventario programado
    /// </summary>
    public class ResultadoInicioInventarioDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public string? CodigoError { get; set; }
        public string? ErrorDetalle { get; set; }

        // Datos del inventario iniciado
        public int InventarioId { get; set; }
        public int TotalProductos { get; set; }
        public DateTime? FechaInicio { get; set; }

        // Información adicional
        public List<string> Advertencias { get; set; } = new List<string>();
        public Dictionary<string, object> MetadatosAdicionales { get; set; } = new Dictionary<string, object>();
    }
}