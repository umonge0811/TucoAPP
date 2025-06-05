using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para filtros de búsqueda y paginación de productos en inventario
    /// </summary>
    public class FiltrosProductosInventarioDTO
    {
        // Paginación
        public int Pagina { get; set; } = 1;
        public int TamañoPagina { get; set; } = 20;

        // Filtros de búsqueda
        public string? TextoBusqueda { get; set; }

        // Filtros de estado
        public bool SoloSinContar { get; set; } = false;
        public bool SoloConDiscrepancias { get; set; } = false;
        public bool SoloLlantas { get; set; } = false;

        // Filtros de usuario
        public int? UsuarioConteoId { get; set; }

        // Ordenamiento
        public string? OrdenarPor { get; set; } = "NombreProducto";
        public bool Descendente { get; set; } = false;
    }
}