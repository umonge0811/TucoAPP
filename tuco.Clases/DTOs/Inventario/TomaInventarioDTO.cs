using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para la interfaz de toma física de inventario
    /// Optimizado para dispositivos móviles/tablets
    /// Reutiliza DTOs existentes: InventarioProgramadoDTO, AsignacionUsuarioInventarioDTO
    /// </summary>
    public class TomaInventarioDTO
    {
        public int InventarioProgramadoId { get; set; }
        public string TituloInventario { get; set; } = string.Empty;
        public string EstadoInventario { get; set; } = string.Empty;
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }

        // Información del usuario que realiza la toma
        public int UsuarioTomaId { get; set; }
        public string NombreUsuarioToma { get; set; } = string.Empty;

        // Permisos del usuario actual (tomado de AsignacionUsuarioInventarioDTO)
        public bool PuedeContar { get; set; }
        public bool PuedeAjustar { get; set; }
        public bool PuedeValidar { get; set; }

        // Estadísticas del inventario
        public int TotalProductos { get; set; }
        public int ProductosContados { get; set; }
        public int ProductosPendientes { get; set; }
        public int Discrepancias { get; set; }
        public decimal PorcentajeProgreso { get; set; }

        // Lista de productos para la toma (usando ProductoTomaDTO especializado)
        public List<ProductoTomaDTO> Productos { get; set; } = new List<ProductoTomaDTO>();
    }
    
}