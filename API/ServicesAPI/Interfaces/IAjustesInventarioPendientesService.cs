using Tuco.Clases.DTOs.Inventario;

namespace API.ServicesAPI.Interfaces
{
    /// <summary>
    /// Interfaz para gestión de ajustes pendientes durante la toma de inventario
    /// Los ajustes NO se aplican inmediatamente al stock real
    /// </summary>
    public interface IAjustesInventarioPendientesService
    {
        /// <summary>
        /// Crea un nuevo ajuste pendiente sin tocar el stock real
        /// </summary>
        Task<int> CrearAjustePendienteAsync(SolicitudAjusteInventarioDTO solicitud);

        /// <summary>
        /// Obtiene todos los ajustes pendientes de un inventario
        /// </summary>
        Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorInventarioAsync(int inventarioProgramadoId);

        /// <summary>
        /// Obtiene ajustes pendientes de un producto específico
        /// </summary>
        Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorProductoAsync(int inventarioProgramadoId, int productoId);

        /// <summary>
        /// Verifica si un producto tiene ajustes pendientes
        /// </summary>
        Task<bool> TieneAjustesPendientesAsync(int inventarioProgramadoId, int productoId);

        /// <summary>
        /// Elimina un ajuste pendiente (solo si está en estado Pendiente)
        /// </summary>
        Task<bool> EliminarAjustePendienteAsync(int ajusteId);

        /// <summary>
        /// Obtiene resumen de ajustes de un inventario
        /// </summary>
        Task<ResumenAjustesInventarioDTO> ObtenerResumenAjustesAsync(int inventarioProgramadoId);

        /// <summary>
        /// MÉTODO CRÍTICO: Aplica todos los ajustes pendientes al stock real
        /// Solo debe llamarse al completar el inventario
        /// </summary>
        Task<bool> AplicarAjustesPendientesAsync(int inventarioProgramadoId);

        /// <summary>
        /// Valida que un ajuste sea coherente antes de crearlo
        /// </summary>
        Task<(bool esValido, string mensaje)> ValidarAjusteAsync(SolicitudAjusteInventarioDTO solicitud);
    }
}