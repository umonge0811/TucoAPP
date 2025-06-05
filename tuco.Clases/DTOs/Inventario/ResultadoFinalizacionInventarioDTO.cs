using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que representa el resultado de finalizar un inventario
    /// </summary>
    public class ResultadoFinalizacionInventarioDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;

        // Información del inventario finalizado
        public int InventarioId { get; set; }
        public DateTime? FechaFinalizacion { get; set; }
        public int ProductosCompletadosAutomaticamente { get; set; }

        // Estadísticas finales
        public ProgresoInventarioDTO? EstadisticasFinales { get; set; }

        // Resumen ejecutivo
        public string ResumenEjecutivo { get; set; } = string.Empty;
        public List<string> AccionesRecomendadas { get; set; } = new List<string>();
        public bool RequiereRevision { get; set; }
    }
}