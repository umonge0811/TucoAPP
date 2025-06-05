using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para manejar los detalles de un producto en un inventario programado
    /// Contiene información del producto y del progreso del conteo
    /// </summary>
    public class DetalleInventarioDTO
    {
        // =====================================
        // PROPIEDADES PRINCIPALES DEL DETALLE
        // =====================================

        /// <summary>
        /// ID único del detalle del inventario
        /// </summary>
        public int DetalleId { get; set; }

        /// <summary>
        /// ID del inventario programado al que pertenece
        /// </summary>
        public int InventarioProgramadoId { get; set; }

        /// <summary>
        /// ID del producto
        /// </summary>
        public int ProductoId { get; set; }

        /// <summary>
        /// Cantidad registrada en el sistema
        /// </summary>
        public int CantidadSistema { get; set; }

        /// <summary>
        /// Cantidad contada físicamente (null si no se ha contado)
        /// </summary>
        public int? CantidadFisica { get; set; }

        /// <summary>
        /// Diferencia entre cantidad física y sistema (CantidadFisica - CantidadSistema)
        /// </summary>
        public int? Diferencia { get; set; }

        /// <summary>
        /// Observaciones del conteo
        /// </summary>
        public string? Observaciones { get; set; }

        /// <summary>
        /// Fecha y hora cuando se realizó el conteo
        /// </summary>
        public DateTime? FechaConteo { get; set; }

        /// <summary>
        /// ID del usuario que realizó el conteo
        /// </summary>
        public int? UsuarioConteoId { get; set; }

        /// <summary>
        /// Nombre del usuario que realizó el conteo
        /// </summary>
        public string? NombreUsuarioConteo { get; set; }

        // =====================================
        // INFORMACIÓN DEL PRODUCTO
        // =====================================

        /// <summary>
        /// Nombre del producto
        /// </summary>
        public string NombreProducto { get; set; } = string.Empty;

        /// <summary>
        /// Descripción del producto
        /// </summary>
        public string? DescripcionProducto { get; set; }

        /// <summary>
        /// Indica si el producto es una llanta
        /// </summary>
        public bool EsLlanta { get; set; }

        /// <summary>
        /// URL de la primera imagen del producto (para vista rápida)
        /// </summary>
        public string? ImagenUrl { get; set; }

        // =====================================
        // INFORMACIÓN ESPECÍFICA DE LLANTAS
        // =====================================

        /// <summary>
        /// Medidas de la llanta (ej: 225/60/R16)
        /// </summary>
        public string? MedidasLlanta { get; set; }

        /// <summary>
        /// Marca de la llanta
        /// </summary>
        public string? MarcaLlanta { get; set; }

        /// <summary>
        /// Modelo de la llanta
        /// </summary>
        public string? ModeloLlanta { get; set; }

        // =====================================
        // PROPIEDADES CALCULADAS/ESTADO
        // =====================================

        /// <summary>
        /// Estado del conteo: "Pendiente", "Contado"
        /// </summary>
        public string EstadoConteo { get; set; } = "Pendiente";

        /// <summary>
        /// Indica si hay discrepancia entre cantidad física y sistema
        /// </summary>
        public bool TieneDiscrepancia { get; set; }

        /// <summary>
        /// Porcentaje de diferencia respecto al sistema
        /// </summary>
        public decimal? PorcentajeDiferencia
        {
            get
            {
                if (!Diferencia.HasValue || CantidadSistema == 0) return null;
                return Math.Round((decimal)Diferencia.Value / CantidadSistema * 100, 2);
            }
        }

        /// <summary>
        /// Clasificación de la discrepancia: "Normal", "Menor", "Mayor", "Crítica"
        /// </summary>
        public string ClasificacionDiscrepancia
        {
            get
            {
                if (!TieneDiscrepancia) return "Normal";

                var porcentaje = Math.Abs(PorcentajeDiferencia ?? 0);

                return porcentaje switch
                {
                    <= 5 => "Menor",
                    <= 15 => "Mayor",
                    _ => "Crítica"
                };
            }
        }

        /// <summary>
        /// Indica si el producto requiere atención especial por la discrepancia
        /// </summary>
        public bool RequiereAtencion => ClasificacionDiscrepancia == "Mayor" || ClasificacionDiscrepancia == "Crítica";

        // =====================================
        // INFORMACIÓN ADICIONAL PARA LA UI
        // =====================================

        /// <summary>
        /// Color recomendado para mostrar en la UI según el estado
        /// </summary>
        public string ColorEstado
        {
            get
            {
                return EstadoConteo switch
                {
                    "Pendiente" => "warning",
                    "Contado" when !TieneDiscrepancia => "success",
                    "Contado" when TieneDiscrepancia => ClasificacionDiscrepancia switch
                    {
                        "Menor" => "info",
                        "Mayor" => "warning",
                        "Crítica" => "danger",
                        _ => "secondary"
                    },
                    _ => "secondary"
                };
            }
        }

        /// <summary>
        /// Icono recomendado para mostrar en la UI
        /// </summary>
        public string IconoEstado
        {
            get
            {
                return EstadoConteo switch
                {
                    "Pendiente" => "fas fa-clock",
                    "Contado" when !TieneDiscrepancia => "fas fa-check-circle",
                    "Contado" when TieneDiscrepancia => "fas fa-exclamation-triangle",
                    _ => "fas fa-question-circle"
                };
            }
        }

        /// <summary>
        /// Mensaje descriptivo del estado para mostrar al usuario
        /// </summary>
        public string MensajeEstado
        {
            get
            {
                return EstadoConteo switch
                {
                    "Pendiente" => "Pendiente de contar",
                    "Contado" when !TieneDiscrepancia => "Contado correctamente",
                    "Contado" when TieneDiscrepancia => $"Discrepancia {ClasificacionDiscrepancia.ToLower()}: {Diferencia:+#;-#;0} unidades",
                    _ => "Estado desconocido"
                };
            }
        }
    }

    

    /// <summary>
    /// DTO para estadísticas de progreso de un inventario
    /// </summary>
    public class ProgresoInventarioDTO
    {
        /// <summary>
        /// ID del inventario
        /// </summary>
        public int InventarioProgramadoId { get; set; }

        /// <summary>
        /// Título del inventario
        /// </summary>
        public string Titulo { get; set; } = string.Empty;

        /// <summary>
        /// Estado actual del inventario
        /// </summary>
        public string Estado { get; set; } = string.Empty;

        /// <summary>
        /// Total de productos en el inventario
        /// </summary>
        public int TotalProductos { get; set; }

        /// <summary>
        /// Productos ya contados
        /// </summary>
        public int ProductosContados { get; set; }

        /// <summary>
        /// Productos pendientes de contar
        /// </summary>
        public int ProductosPendientes => TotalProductos - ProductosContados;

        /// <summary>
        /// Porcentaje de progreso (0-100)
        /// </summary>
        public decimal PorcentajeProgreso => TotalProductos > 0 ?
            Math.Round((decimal)ProductosContados / TotalProductos * 100, 1) : 0;

        /// <summary>
        /// Total de discrepancias encontradas
        /// </summary>
        public int TotalDiscrepancias { get; set; }

        /// <summary>
        /// Discrepancias críticas que requieren atención inmediata
        /// </summary>
        public int DiscrepanciasCriticas { get; set; }

        /// <summary>
        /// Fecha de inicio del inventario
        /// </summary>
        public DateTime? FechaInicio { get; set; }

        /// <summary>
        /// Fecha estimada de finalización
        /// </summary>
        public DateTime? FechaEstimadaFinalizacion { get; set; }

        /// <summary>
        /// Usuarios activos contando en este momento
        /// </summary>
        public List<string> UsuariosActivos { get; set; } = new List<string>();

        /// <summary>
        /// Último conteo registrado
        /// </summary>
        public DateTime? UltimoConteo { get; set; }
    }
}