using System.Collections.Generic;
using System.Threading.Tasks;
using tuco.Clases.DTOs.Inventario;

namespace API.ServicesAPI.Interfaces
{
    public interface IMovimientosPostCorteService
    {
        /// <summary>
        /// Obtiene todos los movimientos post-corte de un inventario
        /// </summary>
        Task<List<ResumenMovimientosPostCorteDTO>> ObtenerMovimientosPorInventarioAsync(int inventarioProgramadoId);

        /// <summary>
        /// Obtiene los movimientos post-corte de un producto específico en un inventario
        /// </summary>
        Task<ResumenMovimientosPostCorteDTO> ObtenerMovimientosPorProductoAsync(int inventarioProgramadoId, int productoId);

        /// <summary>
        /// Registra un movimiento post-corte (llamado desde proceso de venta/ajuste)
        /// </summary>
        Task<bool> RegistrarMovimientoAsync(int inventarioProgramadoId, int productoId, string tipoMovimiento,
            int cantidad, int? documentoReferenciaId = null, string tipoDocumento = null);

        /// <summary>
        /// Actualiza una línea de inventario procesando sus movimientos post-corte
        /// </summary>
        Task<ResultadoActualizacionDTO> ActualizarLineaAsync(ActualizarLineaInventarioDTO solicitud);

        /// <summary>
        /// Actualiza todas las líneas con movimientos pendientes
        /// </summary>
        Task<ResultadoActualizacionDTO> ActualizarLineasMasivaAsync(ActualizarLineasMasivaDTO solicitud);

        /// <summary>
        /// Verifica si hay inventarios en progreso que incluyan un producto específico
        /// </summary>
        Task<List<int>> ObtenerInventariosEnProgresoConProductoAsync(int productoId);
    }
}
