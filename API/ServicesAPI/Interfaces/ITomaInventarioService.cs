using Tuco.Clases.DTOs.Inventario;

namespace API.Services.Interfaces
{
    /// <summary>
    /// Interfaz para el servicio de Toma de Inventarios
    /// Define todos los métodos necesarios para gestionar el proceso completo
    /// desde iniciar hasta completar inventarios programados
    /// </summary>
    public interface ITomaInventarioService
    {
        // =====================================
        // GESTIÓN DE INVENTARIOS PROGRAMADOS
        // =====================================

        /// <summary>
        /// Obtiene un inventario programado por su ID con información completa
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>DTO del inventario con estadísticas y asignaciones</returns>
        Task<InventarioProgramadoDTO?> ObtenerInventarioPorIdAsync(int inventarioId);

        /// <summary>
        /// Inicia un inventario programado, generando todos los detalles de productos
        /// </summary>
        /// <param name="inventarioId">ID del inventario a iniciar</param>
        /// <returns>Resultado del proceso de inicio</returns>
        Task<ResultadoOperacionDTO> IniciarInventarioAsync(int inventarioId);

        /// <summary>
        /// Completa un inventario programado, calculando diferencias finales
        /// </summary>
        /// <param name="inventarioId">ID del inventario a completar</param>
        /// <returns>Resultado del proceso de finalización</returns>
        Task<ResultadoOperacionDTO> CompletarInventarioAsync(int inventarioId);

        /// <summary>
        /// Cancela un inventario programado
        /// </summary>
        /// <param name="inventarioId">ID del inventario a cancelar</param>
        /// <returns>Resultado de la operación</returns>
        Task<ResultadoOperacionDTO> CancelarInventarioAsync(int inventarioId);

        // =====================================
        // GESTIÓN DE PRODUCTOS Y CONTEOS
        // =====================================

        /// <summary>
        /// Obtiene todos los productos de un inventario con información de conteo
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>Lista de productos con detalles de conteo</returns>
        Task<List<DetalleInventarioDTO>> ObtenerProductosInventarioAsync(int inventarioId);

        /// <summary>
        /// Obtiene un producto específico del inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="productoId">ID del producto</param>
        /// <returns>Detalle del producto en el inventario</returns>
        Task<DetalleInventarioDTO?> ObtenerProductoInventarioAsync(int inventarioId, int productoId);

        /// <summary>
        /// Registra el conteo físico de un producto
        /// </summary>
        /// <param name="conteo">Datos del conteo a registrar</param>
        /// <returns>Resultado del registro del conteo</returns>
        Task<ResultadoConteoDTO> RegistrarConteoAsync(ConteoProductoDTO conteo);

        /// <summary>
        /// Obtiene el historial de conteos de un producto específico
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="productoId">ID del producto</param>
        /// <returns>Lista de conteos realizados</returns>
        Task<List<ConteoProductoDTO>> ObtenerHistorialConteosAsync(int inventarioId, int productoId);

        // =====================================
        // PROGRESO Y ESTADÍSTICAS
        // =====================================

        /// <summary>
        /// Obtiene el progreso actual de un inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>Estadísticas de progreso</returns>
        Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId);

        /// <summary>
        /// Obtiene las discrepancias de un inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>Lista de productos con discrepancias</returns>
        Task<List<DetalleInventarioDTO>> ObtenerDiscrepanciasAsync(int inventarioId);

        /// <summary>
        /// Obtiene productos pendientes de contar
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario (opcional, para filtrar sus asignaciones)</param>
        /// <returns>Lista de productos pendientes</returns>
        Task<List<DetalleInventarioDTO>> ObtenerProductosPendientesAsync(int inventarioId, int? usuarioId = null);

        // =====================================
        // PERMISOS Y ACCESO
        // =====================================

        /// <summary>
        /// Verifica si un usuario tiene acceso a un inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>True si tiene acceso</returns>
        Task<bool> UsuarioTieneAccesoAsync(int inventarioId, int usuarioId);

        /// <summary>
        /// Verifica si un usuario puede realizar conteos en un inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>True si puede contar</returns>
        Task<bool> UsuarioPuedeContarAsync(int inventarioId, int usuarioId);

        /// <summary>
        /// Verifica si un usuario puede validar conteos en un inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>True si puede validar</returns>
        Task<bool> UsuarioPuedeValidarAsync(int inventarioId, int usuarioId);

        /// <summary>
        /// Verifica si un usuario puede ajustar stock en un inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>True si puede ajustar</returns>
        Task<bool> UsuarioPuedeAjustarAsync(int inventarioId, int usuarioId);

        // =====================================
        // EXPORTACIÓN Y REPORTES
        // =====================================

        /// <summary>
        /// Genera un reporte de resultados del inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>Datos del reporte</returns>
        Task<ReporteInventarioDTO> GenerarReporteAsync(int inventarioId);

        /// <summary>
        /// Obtiene datos para exportar a Excel
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>Datos estructurados para exportación</returns>
        Task<ExportacionInventarioDTO> ObtenerDatosParaExportacionAsync(int inventarioId);

        // =====================================
        // NOTIFICACIONES Y ALERTAS
        // =====================================

        /// <summary>
        /// Envía recordatorios a usuarios con productos pendientes
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <returns>Número de notificaciones enviadas</returns>
        Task<int> EnviarRecordatoriosAsync(int inventarioId);

        /// <summary>
        /// Notifica sobre discrepancias críticas
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="detalleId">ID del detalle con discrepancia</param>
        /// <returns>Resultado de la notificación</returns>
        Task<bool> NotificarDiscrepanciaCriticaAsync(int inventarioId, int detalleId);
    }

    // =====================================
    // DTOs DE RESULTADO
    // =====================================

    /// <summary>
    /// DTO para resultados de operaciones generales
    /// </summary>
    public class ResultadoOperacionDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public int? ProductosGenerados { get; set; }
        public int? UsuariosNotificados { get; set; }
        public int? TotalProductos { get; set; }
        public int? Discrepancias { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public Dictionary<string, object>? DatosAdicionales { get; set; }
    }

    /// <summary>
    /// DTO para resultados específicos de conteos
    /// </summary>
    public class ResultadoConteoDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public int? Diferencia { get; set; }
        public bool HayDiscrepancia { get; set; }
        public string? ClasificacionDiscrepancia { get; set; }
        public bool RequiereValidacion { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }

    /// <summary>
    /// DTO para reportes de inventario
    /// </summary>
    public class ReporteInventarioDTO
    {
        public InventarioProgramadoDTO Inventario { get; set; } = new();
        public ProgresoInventarioDTO Progreso { get; set; } = new();
        public List<DetalleInventarioDTO> Productos { get; set; } = new();
        public List<DetalleInventarioDTO> Discrepancias { get; set; } = new();
        public EstadisticasInventarioDTO Estadisticas { get; set; } = new();
        public DateTime FechaGeneracion { get; set; } = DateTime.Now;
    }

    /// <summary>
    /// DTO para estadísticas detalladas de inventario
    /// </summary>
    public class EstadisticasInventarioDTO
    {
        public int TotalProductos { get; set; }
        public int ProductosContados { get; set; }
        public int ProductosPendientes { get; set; }
        public int TotalDiscrepancias { get; set; }
        public int DiscrepanciasMenores { get; set; }
        public int DiscrepanciasMayores { get; set; }
        public int DiscrepanciasCriticas { get; set; }
        public decimal PorcentajeExactitud { get; set; }
        public TimeSpan TiempoPromedioPorProducto { get; set; }
        public Dictionary<int, int> ProductosPorUsuario { get; set; } = new();
        public Dictionary<string, int> DiscrepanciasPorCategoria { get; set; } = new();
    }

    /// <summary>
    /// DTO para datos de exportación
    /// </summary>
    public class ExportacionInventarioDTO
    {
        public InventarioProgramadoDTO Inventario { get; set; } = new();
        public List<DetalleInventarioDTO> Detalles { get; set; } = new();
        public EstadisticasInventarioDTO Estadisticas { get; set; } = new();
        public List<string> ColumnasPersonalizadas { get; set; } = new();
        public Dictionary<string, object> Metadatos { get; set; } = new();
    }
}