using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que representa el progreso completo de un inventario en tiempo real
    /// </summary>
    public class ProgresoInventarioDTO
    {
        public int InventarioProgramadoId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public int TotalProductos { get; set; }
        public int ProductosContados { get; set; }
        public int ProductosPendientes { get; set; }
        public int Discrepancias { get; set; }
        public double PorcentajeProgreso { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }

        // ✅ AGREGAR ESTAS PROPIEDADES QUE FALTAN:
        public DateTime? FechaCalculo { get; set; }
        public int TotalDiscrepancias { get; set; }
    }

    public class ResultadoInventarioDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public int TotalProductos { get; set; }
        public int Discrepancias { get; set; }
    }
}
