// ========================================
// INTERFAZ PARA SERVICIO DE TOMA DE INVENTARIO (WEB)
// Ubicación: GestionLlantera.Web/Services/Interfaces/ITomaInventarioService.cs
// ========================================

using Tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Services.Interfaces
{
    /// <summary>
    /// Interfaz para el servicio de Toma de Inventarios en la capa Web
    /// Se comunica con la API para ejecutar operaciones de conteo físico
    /// </summary>
    public interface ITomaInventarioService
    {
        // =====================================
        // GESTIÓN DE INVENTARIOS
        // =====================================

        /// <summary>
        /// Inicia un inventario programado (cambia de "Programado" a "En Progreso")
        /// </summary>
        /// <param name="inventarioId">ID del inventario a iniciar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se inició correctamente</returns>
        Task<bool> IniciarInventarioAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Obtiene información detallada de un inventario en progreso
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Información del inventario</returns>
        Task<InventarioProgramadoDTO?> ObtenerInventarioAsync(int inventarioId, string jwtToken);

        // =====================================
        // GESTIÓN DE PRODUCTOS
        // =====================================

        /// <summary>
        /// Obtiene todos los productos de un inventario para realizar conteo
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de productos con información de conteo</returns>
        Task<List<DetalleInventarioDTO>?> ObtenerProductosInventarioAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Busca un producto específico dentro del inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="termino">Término de búsqueda (ID, nombre, marca, etc.)</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Producto encontrado o null</returns>
        Task<DetalleInventarioDTO?> BuscarProductoAsync(int inventarioId, string termino, string jwtToken);

        // =====================================
        // REGISTRO DE CONTEOS
        // =====================================

        /// <summary>
        /// Registra el conteo físico de un producto
        /// </summary>
        /// <param name="conteo">Datos del conteo a registrar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se registró correctamente</returns>
        Task<bool> RegistrarConteoAsync(ConteoProductoDTO conteo, string jwtToken);

        /// <summary>
        /// Actualiza el conteo de un producto ya contado
        /// </summary>
        /// <param name="conteo">Nuevos datos del conteo</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se actualizó correctamente</returns>
        Task<bool> ActualizarConteoAsync(ConteoProductoDTO conteo, string jwtToken);

        // =====================================
        // PROGRESO Y ESTADÍSTICAS
        // =====================================

        /// <summary>
        /// Obtiene el progreso actual del inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Información de progreso</returns>
        Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Obtiene el progreso actual del inventario (alias para compatibilidad)
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Información de progreso</returns>
        Task<ProgresoInventarioDTO?> ObtenerProgresoInventarioAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Obtiene estadísticas detalladas del inventario
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Estadísticas del inventario</returns>
        Task<EstadisticasInventarioDTO?> ObtenerEstadisticasAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Obtiene productos con discrepancias
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de productos con discrepancias</returns>
        Task<List<DetalleInventarioDTO>?> ObtenerDiscrepanciasAsync(int inventarioId, string jwtToken);

        // =====================================
        // FINALIZACIÓN Y VALIDACIÓN
        // =====================================

        /// <summary>
        /// Completa un inventario (cambia de "En Progreso" a "Completado")
        /// </summary>
        /// <param name="inventarioId">ID del inventario a completar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se completó correctamente</returns>
        Task<bool> CompletarInventarioAsync(int inventarioId, string jwtToken);

        /// <summary>
        /// Cancela un inventario en progreso
        /// </summary>
        /// <param name="inventarioId">ID del inventario a cancelar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se canceló correctamente</returns>
        Task<bool> CancelarInventarioAsync(int inventarioId, string jwtToken);

        // =====================================
        // VALIDACIÓN Y PERMISOS
        // =====================================

        /// <summary>
        /// Verifica si un usuario tiene permisos para contar en un inventario específico
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si tiene permisos</returns>
        Task<bool> VerificarPermisosConteoAsync(int inventarioId, int usuarioId, string jwtToken);

        /// <summary>
        /// Valida que un inventario esté en estado correcto para realizar conteos
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si está en estado válido</returns>
        Task<bool> ValidarEstadoInventarioAsync(int inventarioId, string jwtToken);

        // =====================================
        // HISTORIAL DE INVENTARIOS
        // =====================================

        /// <summary>
        /// Obtiene los inventarios asignados a un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de inventarios asignados al usuario</returns>
        Task<List<InventarioProgramadoDTO>?> ObtenerInventariosAsignadosAsync(int usuarioId, string jwtToken);

        // =====================================
        // NOTIFICACIONES
        // =====================================

        /// <summary>
        /// Notifica a los supervisores que un usuario completó su parte del conteo
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se envió la notificación correctamente</returns>
        Task<bool> NotificarConteoCompletadoAsync(int inventarioId, string jwtToken);
    }
}