using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para filtros y búsqueda en la toma de inventario
    /// Optimizado para dispositivos móviles con paginación
    /// </summary>
    public class FiltrosTomaInventarioDTO
    {
        public string? TextoBusqueda { get; set; }
        public bool? SoloContados { get; set; }
        public bool? SoloPendientes { get; set; }
        public bool? SoloConDiscrepancias { get; set; }
        public string? FiltroUbicacion { get; set; }
        public string? FiltroCategoria { get; set; }
        public bool? SoloLlantas { get; set; }

        // Paginación optimizada para móviles
        public int Pagina { get; set; } = 1;
        public int ProductosPorPagina { get; set; } = 20;

        // Ordenamiento
        public string OrdenarPor { get; set; } = "nombre"; // nombre, codigo, ubicacion, estado, diferencia
        public bool OrdenDescendente { get; set; } = false;

        // Filtros de rango (útiles para discrepancias)
        public int? DiferenciaMinima { get; set; }
        public int? DiferenciaMaxima { get; set; }
    }

}
