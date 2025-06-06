using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que proporciona un resumen ejecutivo de todos los ajustes pendientes de un inventario
    /// Usado para mostrar dashboards y tomar decisiones antes de aplicar ajustes
    /// </summary>
    public class ResumenAjustesInventarioDTO
    {
        public int InventarioProgramadoId { get; set; }
        public string TituloInventario { get; set; } = string.Empty;

        // Estadísticas generales
        public int TotalAjustesPendientes { get; set; }
        public int AjustesAplicados { get; set; }
        public int AjustesRechazados { get; set; }
        public int ProductosConAjustes { get; set; }

        // Clasificación por tipo de ajuste
        public int AjustesSistemaAFisico { get; set; }
        public int AjustesReconteo { get; set; }
        public int AjustesValidados { get; set; }

        // Impacto en el stock
        public int TotalUnidadesAumento { get; set; }
        public int TotalUnidadesDisminucion { get; set; }
        public int ImpactoNetoUnidades { get; set; }

        // Información temporal
        public DateTime? FechaUltimaActualizacion { get; set; }
        public DateTime? FechaPrimerAjuste { get; set; }

        // Lista detallada de ajustes
        public List<AjusteInventarioPendienteDTO> AjustesPendientes { get; set; } = new();

        // Productos más afectados
        public List<ProductoConAjustesDTO> ProductosMasAjustados { get; set; } = new();

        // Alertas y recomendaciones
        public List<string> Alertas { get; set; } = new();
        public List<string> Recomendaciones { get; set; } = new();

        // Estado del proceso
        public bool ListoParaAplicar { get; set; }
        public string? MotivoNoListo { get; set; }
    }

    /// <summary>
    /// DTO auxiliar para productos con múltiples ajustes
    /// </summary>
    public class ProductoConAjustesDTO
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int CantidadSistemaOriginal { get; set; }
        public int CantidadFinalPropuesta { get; set; }
        public int TotalAjustes { get; set; }
        public int ImpactoNeto { get; set; }
        public List<string> TiposAjuste { get; set; } = new();
        public bool RequiereValidacion { get; set; }
    }
}