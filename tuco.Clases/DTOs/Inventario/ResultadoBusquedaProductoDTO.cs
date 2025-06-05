using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que representa el resultado de una búsqueda de productos en inventario
    /// </summary>
    public class ResultadoBusquedaProductoDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;

        // Resultados de búsqueda
        public List<ProductoBusquedaDTO> Productos { get; set; } = new List<ProductoBusquedaDTO>();
        public string? TerminoBusqueda { get; set; }
        public int TotalEncontrados { get; set; }

        // Información adicional
        public bool EsBusquedaExacta { get; set; }
        public List<string> SugerenciasBusqueda { get; set; } = new List<string>();
    }
}
