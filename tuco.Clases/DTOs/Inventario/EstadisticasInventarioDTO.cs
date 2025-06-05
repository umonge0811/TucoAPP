using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para estadísticas básicas de un inventario
    /// </summary>
    public class EstadisticasInventarioDTO
    {
        public int TotalProductos { get; set; }
        public int ProductosContados { get; set; }
        public int ProductosConDiscrepancia { get; set; }
        public decimal PorcentajeCompletado { get; set; }

        // Estadísticas de tiempo
        public DateTime? FechaInicio { get; set; }
        public DateTime? UltimoConteo { get; set; }
        public int MinutosTranscurridos { get; set; }

        // Productividad
        public decimal ProductosPorHora { get; set; }
        public int UsuariosActivos { get; set; }
    }
}