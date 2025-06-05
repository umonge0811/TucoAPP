using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que representa el resultado de obtener productos de un inventario con paginación
    /// </summary>
    public class ResultadoProductosInventarioDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;

        // Datos de productos
        public List<DetalleInventarioDTO> Productos { get; set; } = new List<DetalleInventarioDTO>();

        // Paginación
        public int TotalRegistros { get; set; }
        public int Pagina { get; set; }
        public int TamañoPagina { get; set; }
        public int TotalPaginas { get; set; }

        // Estadísticas del inventario
        public EstadisticasInventarioDTO? Estadisticas { get; set; }
    }
}