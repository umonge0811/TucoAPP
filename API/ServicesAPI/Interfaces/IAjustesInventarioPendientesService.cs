using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;

namespace API.ServiceAPI.Interfaces
{
    public interface IAjustesInventarioPendientesService
    {
        /// <summary>
        /// Crea un nuevo ajuste pendiente durante la toma de inventario
        /// </summary>
        Task<int> CrearAjustePendienteAsync(SolicitudAjusteInventarioDTO solicitud);

        /// <summary>
        /// Obtiene todos los ajustes pendientes de un inventario
        /// </summary>
        Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorInventarioAsync(int inventarioProgramadoId);

        /// <summary>
        /// Obtiene ajustes pendientes de un producto específico en un inventario
        /// </summary>
        Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorProductoAsync(int inventarioProgramadoId, int productoId);

        /// <summary>
        /// Actualiza el estado de un ajuste
        /// </summary>
        Task<bool> ActualizarEstadoAjusteAsync(int ajusteId, string nuevoEstado, DateTime? fechaAplicacion = null);

        /// <summary>
        /// Elimina un ajuste pendiente (solo si no ha sido aplicado)
        /// </summary>
        Task<bool> EliminarAjustePendienteAsync(int ajusteId);

        /// <summary>
        /// Aplica todos los ajustes pendientes de un inventario al completarlo
        /// </summary>
        Task<bool> AplicarAjustesPendientesAsync(int inventarioProgramadoId);

        /// <summary>
        /// Verifica si un producto tiene ajustes pendientes
        /// </summary>
        Task<bool> TieneAjustesPendientesAsync(int inventarioProgramadoId, int productoId);

        /// <summary>
        /// Obtiene un resumen de ajustes para reporte
        /// </summary>
        Task<object> ObtenerResumenAjustesAsync(int inventarioProgramadoId);
    }
}