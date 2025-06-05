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
        public int InventarioId { get; set; }
        public int TotalProductos { get; set; }
        public int ProductosContados { get; set; }
        public decimal PorcentajeProgreso { get; set; }
        public int TotalDiscrepancias { get; set; }
        public DateTime FechaCalculo { get; set; }
        public string? Mensaje { get; set; }
    }
}
