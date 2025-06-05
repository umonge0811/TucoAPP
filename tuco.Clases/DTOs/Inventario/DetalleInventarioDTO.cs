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

        // <summary>
        /// Nombre del usuario que realizó el conteo (alias para compatibilidad)
        /// </summary>
        public string? UsuarioConteoNombre => NombreUsuarioConteo;

        /// <summary>
        /// Información completa de la llanta (para el servicio)
        /// </summary>
        public LlantaTomaDTO? InformacionLlanta { get; set; }

        /// <summary>
        /// Indica si el producto ya fue contado (alias para compatibilidad)
        /// </summary>
        public bool Contado => EstadoConteo == "Contado";
    }

    

}