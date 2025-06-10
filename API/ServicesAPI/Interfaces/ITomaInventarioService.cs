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

    }
}