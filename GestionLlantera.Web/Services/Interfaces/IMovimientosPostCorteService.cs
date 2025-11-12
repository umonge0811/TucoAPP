using tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Services.Interfaces
{
    /// <summary>
    /// Interfaz para gestión de movimientos post-corte en inventarios
    /// </summary>
    public interface IMovimientosPostCorteService
    {
        /// <summary>
        /// Obtiene alertas de movimientos post-corte para un inventario y usuario
        /// </summary>
        Task<(bool Success, object? Data)> ObtenerAlertasAsync(int inventarioId, int? usuarioId, bool soloNoLeidas, string jwtToken);

        /// <summary>
        /// Actualiza una línea de inventario con los movimientos post-corte
        /// </summary>
        Task<(bool Success, string Message)> ActualizarLineaAsync(ActualizarLineaInventarioDTO solicitud, string jwtToken);

        /// <summary>
        /// Marca una alerta como leída
        /// </summary>
        Task<(bool Success, string Message)> MarcarAlertaLeidaAsync(int alertaId, string jwtToken);

        /// <summary>
        /// Marca todas las alertas de un inventario como leídas
        /// </summary>
        Task<(bool Success, string Message)> MarcarTodasAlertasLeidasAsync(int inventarioId, int usuarioId, string jwtToken);

        /// <summary>
        /// Actualiza líneas masivamente procesando sus movimientos post-corte
        /// </summary>
        Task<(bool Success, string Message, object? Data)> ActualizarLineasMasivaAsync(ActualizarLineasMasivaDTO solicitud, string jwtToken);
    }
}
