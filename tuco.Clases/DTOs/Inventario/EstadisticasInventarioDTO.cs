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
        public int ProductosPendientes { get; set; }
        public int Discrepancias { get; set; }
        public double PorcentajeProgreso { get; set; }

        // ✅ AGREGAR ESTAS PROPIEDADES QUE FALTAN:
        public double PorcentajeCompletado { get; set; }
        public int ProductosConDiscrepancia { get; set; }
        public double ProductosPorHora { get; set; }
        public DateTime? UltimoConteo { get; set; }
        public int UsuariosActivos { get; set; }
    }
}