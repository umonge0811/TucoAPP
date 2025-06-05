using Tuco.Clases.DTOs.Inventario;

namespace API.Services.Interfaces  // ← CORREGIDO: API.Services.Interfaces (no API.ServicesAPI.Interfaces)
{
    /// <summary>
    /// Interfaz para el servicio de Toma de Inventarios
    /// Define todos los métodos necesarios para gestionar el proceso completo
    /// </summary>
    public interface ITomaInventarioService
    {
        // =====================================
        // GESTIÓN DE INVENTARIOS PROGRAMADOS
        // =====================================

        /// <summary>
        /// Obtiene un inventario programado por su ID con información completa
        /// </summary>
        Task<InventarioProgramadoDTO?> ObtenerInventarioPorIdAsync(int inventarioId);

        /// <summary>
        /// Inicia un inventario programado, generando todos los detalles de productos
        /// </summary>
        Task<ResultadoOperacionDTO> IniciarInventarioAsync(int inventarioId);

        /// <summary>
        /// Completa un inventario programado, calculando diferencias finales
        /// </summary>
        Task<ResultadoOperacionDTO> CompletarInventarioAsync(int inventarioId);

        /// <summary>
        /// Cancela un inventario programado
        /// </summary>
        Task<ResultadoOperacionDTO> CancelarInventarioAsync(int inventarioId);

        // =====================================
        // GESTIÓN DE PRODUCTOS Y CONTEOS
        // =====================================

        /// <summary>
        /// Obtiene todos los productos de un inventario con información de conteo
        /// </summary>
        Task<List<DetalleInventarioDTO>> ObtenerProductosInventarioAsync(int inventarioId);

        /// <summary>
        /// Obtiene un producto específico del inventario
        /// </summary>
        Task<DetalleInventarioDTO?> ObtenerProductoInventarioAsync(int inventarioId, int productoId);

        /// <summary>
        /// Registra el conteo físico de un producto
        /// </summary>
        Task<bool> RegistrarConteoAsync(ConteoProductoDTO conteo);  // ← SIMPLIFICADO: retorna bool

        /// <summary>
        /// Obtiene el historial de conteos de un producto específico
        /// </summary>
        Task<List<ConteoProductoDTO>> ObtenerHistorialConteosAsync(int inventarioId, int productoId);

        // =====================================
        // PROGRESO Y ESTADÍSTICAS
        // =====================================

        /// <summary>
        /// Obtiene el progreso actual de un inventario
        /// </summary>
        Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId);

        /// <summary>
        /// Obtiene las discrepancias de un inventario
        /// </summary>
        Task<List<DetalleInventarioDTO>> ObtenerDiscrepanciasAsync(int inventarioId);

        /// <summary>
        /// Obtiene productos pendientes de contar
        /// </summary>
        Task<List<DetalleInventarioDTO>> ObtenerProductosPendientesAsync(int inventarioId, int? usuarioId = null);

        // =====================================
        // PERMISOS Y ACCESO
        // =====================================

        /// <summary>
        /// Verifica si un usuario tiene acceso a un inventario
        /// </summary>
        Task<bool> UsuarioTieneAccesoAsync(int inventarioId, int usuarioId);

        /// <summary>
        /// Verifica si un usuario puede realizar conteos en un inventario
        /// </summary>
        Task<bool> UsuarioPuedeContarAsync(int inventarioId, int usuarioId);

        /// <summary>
        /// Verifica si un usuario puede validar conteos en un inventario
        /// </summary>
        Task<bool> UsuarioPuedeValidarAsync(int inventarioId, int usuarioId);

        /// <summary>
        /// Verifica si un usuario puede ajustar stock en un inventario
        /// </summary>
        Task<bool> UsuarioPuedeAjustarAsync(int inventarioId, int usuarioId);

        // =====================================
        // EXPORTACIÓN Y REPORTES (SIMPLIFICADOS)
        // =====================================

        /// <summary>
        /// Genera un reporte de resultados del inventario
        /// </summary>
        Task<object> GenerarReporteAsync(int inventarioId);  // ← SIMPLIFICADO: retorna object

        /// <summary>
        /// Obtiene datos para exportar a Excel
        /// </summary>
        Task<object> ObtenerDatosParaExportacionAsync(int inventarioId);  // ← SIMPLIFICADO: retorna object

        // =====================================
        // NOTIFICACIONES Y ALERTAS (SIMPLIFICADAS)
        // =====================================

        /// <summary>
        /// Envía recordatorios a usuarios con productos pendientes
        /// </summary>
        Task<int> EnviarRecordatoriosAsync(int inventarioId);

        /// <summary>
        /// Notifica sobre discrepancias críticas
        /// </summary>
        Task<bool> NotificarDiscrepanciaCriticaAsync(int inventarioId, int detalleId);
    }

    // ==========================================
    // ❌ ELIMINAR TODOS LOS DTOs DE AQUÍ
    // ==========================================
    // Ya no definimos DTOs en la interfaz, 
    // usamos solo los de Tuco.Clases.DTOs.Inventario
}