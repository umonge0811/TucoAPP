using Tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IAjustesInventarioService
    {
        /// <summary>
        /// Crea un ajuste pendiente durante la toma de inventario
        /// </summary>
        Task<bool> CrearAjustePendienteAsync(SolicitudAjusteInventarioDTO solicitud, string jwtToken);

        /// <summary>
        /// Obtiene todos los ajustes pendientes de un inventario
        /// </summary>
        Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPendientesAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Obtiene ajustes de un producto específico
        /// </summary>
        Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesProductoAsync(int inventarioId, int productoId, string jwtToken);

        /// <summary>
        /// Elimina un ajuste pendiente
        /// </summary>
        Task<bool> EliminarAjustePendienteAsync(int ajusteId, string jwtToken);

        /// <summary>
        /// Obtiene resumen de ajustes de un inventario
        /// </summary>
        Task<object> ObtenerResumenAjustesAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Aplica todos los ajustes pendientes (se llama al completar inventario)
        /// </summary>
        Task<bool> AplicarAjustesPendientesAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Actualiza un ajuste pendiente existente
        /// </summary>
        Task<bool> ActualizarAjustePendienteAsync(int ajusteId, SolicitudAjusteInventarioDTO solicitud, string jwtToken);



    }
}