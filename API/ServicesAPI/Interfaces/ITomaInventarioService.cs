using Tuco.Clases.DTOs.Inventario;

namespace API.Services.Interfaces  // ← CORREGIDO: API.Services.Interfaces (no API.ServicesAPI.Interfaces)
{
    /// <summary>
    /// Interfaz para el servicio de Toma de Inventarios
    /// Define todos los métodos necesarios para gestionar el proceso completo
    /// </summary>
    public interface ITomaInventarioService
    {
        Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId);
        Task<ResultadoInventarioDTO> CompletarInventarioAsync(int inventarioId);
        Task<bool> UsuarioTieneAccesoAsync(int inventarioId, int usuarioId);
        Task<List<InventarioProgramadoDTO>> ObtenerInventariosAsignadosAsync(int usuarioId);
        Task<EstadisticasInventarioDTO> ObtenerEstadisticasAsync(int inventarioId);

        // =====================================
        // NOTIFICACIONES
        // =====================================

        /// <summary>
        /// Notifica a los supervisores que un usuario completó su parte del conteo
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario que completó el conteo</param>
        /// <returns>True si se envió la notificación correctamente</returns>
        Task<bool> NotificarConteoCompletadoAsync(int inventarioId, int usuarioId);

    }
}