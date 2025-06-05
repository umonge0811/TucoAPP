// ========================================
// SERVICIO DE TOMA DE INVENTARIO (WEB)
// Ubicación: GestionLlantera.Web/Services/TomaInventarioService.cs
// ========================================

using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using Tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestión de toma de inventarios físicos desde la capa Web
    /// Se comunica con la API para ejecutar todas las operaciones de conteo
    /// </summary>
    public class TomaInventarioService : ITomaInventarioService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TomaInventarioService> _logger;

        public TomaInventarioService(IHttpClientFactory httpClientFactory, ILogger<TomaInventarioService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        // =====================================
        // GESTIÓN DE INVENTARIOS
        // =====================================

        /// <summary>
        /// Inicia un inventario programado
        /// </summary>
        public async Task<bool> IniciarInventarioAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🚀 Iniciando inventario {InventarioId} desde servicio web", inventarioId);

                // ✅ CONFIGURAR TOKEN JWT
                ConfigurarAutenticacion(jwtToken);

                // ✅ REALIZAR PETICIÓN A LA API
                var response = await _httpClient.PostAsync($"api/TomaInventario/{inventarioId}/iniciar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al iniciar inventario: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return false;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("✅ Inventario iniciado exitosamente: {Response}", responseContent);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al iniciar inventario {InventarioId}", inventarioId);
                return false;
            }
        }

        /// <summary>
        /// Obtiene información de un inventario
        /// </summary>
        public async Task<InventarioProgramadoDTO?> ObtenerInventarioAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo inventario {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener inventario: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var inventario = JsonConvert.DeserializeObject<InventarioProgramadoDTO>(content);

                _logger.LogInformation("✅ Inventario obtenido: {Titulo}", inventario?.Titulo ?? "Sin título");
                return inventario;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        // =====================================
        // GESTIÓN DE PRODUCTOS
        // =====================================

        /// <summary>
        /// Obtiene productos del inventario para conteo
        /// </summary>
        public async Task<List<DetalleInventarioDTO>?> ObtenerProductosInventarioAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📦 Obteniendo productos del inventario {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}/productos");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener productos: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();

                // ✅ LA API DEVUELVE UN OBJETO CON productos Y estadisticas
                var responseData = JsonConvert.DeserializeObject<dynamic>(content);

                if (responseData?.productos != null)
                {
                    var productos = JsonConvert.DeserializeObject<List<DetalleInventarioDTO>>(
                        responseData.productos.ToString());

                    return productos ?? new List<DetalleInventarioDTO>();
                }

                _logger.LogWarning("⚠️ No se encontraron productos en la respuesta");
                return new List<DetalleInventarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos del inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        /// <summary>
        /// Busca un producto específico en el inventario
        /// </summary>
        public async Task<DetalleInventarioDTO?> BuscarProductoAsync(int inventarioId, string termino, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando producto '{Termino}' en inventario {InventarioId}", termino, inventarioId);

                // ✅ OBTENER TODOS LOS PRODUCTOS Y BUSCAR LOCALMENTE
                var productos = await ObtenerProductosInventarioAsync(inventarioId, jwtToken);

                if (productos == null || !productos.Any())
                {
                    _logger.LogWarning("⚠️ No hay productos en el inventario para buscar");
                    return null;
                }

                // ✅ BUSCAR POR DIFERENTES CRITERIOS
                var productoEncontrado = productos.FirstOrDefault(p =>
                    p.ProductoId.ToString() == termino ||
                    p.NombreProducto.Contains(termino, StringComparison.OrdinalIgnoreCase) ||
                    (p.MarcaLlanta?.Contains(termino, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (p.ModeloLlanta?.Contains(termino, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (p.MedidasLlanta?.Contains(termino, StringComparison.OrdinalIgnoreCase) ?? false)
                );

                if (productoEncontrado != null)
                {
                    _logger.LogInformation("✅ Producto encontrado: {Nombre} (ID: {Id})",
                        productoEncontrado.NombreProducto, productoEncontrado.ProductoId);
                }
                else
                {
                    _logger.LogInformation("❌ Producto no encontrado con término: '{Termino}'", termino);
                }

                return productoEncontrado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al buscar producto '{Termino}'", termino);
                return null;
            }
        }

        // =====================================
        // REGISTRO DE CONTEOS
        // =====================================

        /// <summary>
        /// Registra el conteo físico de un producto
        /// </summary>
        public async Task<bool> RegistrarConteoAsync(ConteoProductoDTO conteo, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📝 Registrando conteo: Producto {ProductoId}, Cantidad {Cantidad}",
                    conteo.ProductoId, conteo.CantidadFisica);

                ConfigurarAutenticacion(jwtToken);

                // ✅ SERIALIZAR DATOS DEL CONTEO
                var jsonContent = JsonConvert.SerializeObject(conteo, new JsonSerializerSettings
                {
                    DateTimeZoneHandling = DateTimeZoneHandling.Local
                });

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // ✅ ENVIAR A LA API
                var response = await _httpClient.PostAsync($"api/TomaInventario/{conteo.InventarioProgramadoId}/productos/{conteo.ProductoId}/conteo", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al registrar conteo: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return false;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("✅ Conteo registrado exitosamente: {Response}", responseContent);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al registrar conteo del producto {ProductoId}", conteo.ProductoId);
                return false;
            }
        }

        /// <summary>
        /// Actualiza un conteo existente
        /// </summary>
        public async Task<bool> ActualizarConteoAsync(ConteoProductoDTO conteo, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔄 Actualizando conteo: Producto {ProductoId}, Nueva cantidad {Cantidad}",
                    conteo.ProductoId, conteo.CantidadFisica);

                // ✅ REUTILIZAR EL MÉTODO DE REGISTRO (LA API MANEJA LA ACTUALIZACIÓN)
                return await RegistrarConteoAsync(conteo, jwtToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al actualizar conteo del producto {ProductoId}", conteo.ProductoId);
                return false;
            }
        }

        // =====================================
        // PROGRESO Y ESTADÍSTICAS
        // =====================================

        /// <summary>
        /// Obtiene el progreso actual del inventario
        /// </summary>
        public async Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo progreso del inventario {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}/progreso");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener progreso: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var progreso = JsonConvert.DeserializeObject<ProgresoInventarioDTO>(content);

                _logger.LogInformation("✅ Progreso obtenido: {Porcentaje}%", progreso?.PorcentajeProgreso ?? 0);
                return progreso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener progreso del inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        /// <summary>
        /// Obtiene el progreso actual del inventario (alias para compatibilidad)
        /// </summary>
        public async Task<ProgresoInventarioDTO?> ObtenerProgresoInventarioAsync(int inventarioId, string jwtToken)
        {
            return await ObtenerProgresoAsync(inventarioId, jwtToken);
        }

        /// <summary>
        /// Obtiene estadísticas detalladas del inventario
        /// </summary>
        public async Task<EstadisticasInventarioDTO?> ObtenerEstadisticasAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📈 Obteniendo estadísticas del inventario {InventarioId}", inventarioId);

                // ✅ POR AHORA, GENERAR ESTADÍSTICAS DESDE EL PROGRESO
                var progreso = await ObtenerProgresoAsync(inventarioId, jwtToken);

                if (progreso == null)
                {
                    return null;
                }

                return new EstadisticasInventarioDTO
                {
                    TotalProductos = progreso.TotalProductos,
                    ProductosContados = progreso.ProductosContados,
                    ProductosConDiscrepancia = progreso.TotalDiscrepancias,
                    PorcentajeCompletado = progreso.PorcentajeProgreso,
                    UltimoConteo = progreso.FechaCalculo,
                    UsuariosActivos = 1, // TODO: Implementar conteo real de usuarios activos
                    ProductosPorHora = 0 // TODO: Calcular productividad
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener estadísticas del inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        /// <summary>
        /// Obtiene productos con discrepancias
        /// </summary>
        public async Task<List<DetalleInventarioDTO>?> ObtenerDiscrepanciasAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("⚠️ Obteniendo discrepancias del inventario {InventarioId}", inventarioId);

                var productos = await ObtenerProductosInventarioAsync(inventarioId, jwtToken);

                if (productos == null)
                {
                    return null;
                }

                var discrepancias = productos.Where(p => p.TieneDiscrepancia).ToList();

                _logger.LogInformation("✅ Encontradas {Count} discrepancias", discrepancias.Count);
                return discrepancias;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener discrepancias del inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        // =====================================
        // FINALIZACIÓN Y VALIDACIÓN
        // =====================================

        /// <summary>
        /// Completa un inventario
        /// </summary>
        public async Task<bool> CompletarInventarioAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🏁 Completando inventario {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.PostAsync($"api/TomaInventario/{inventarioId}/completar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al completar inventario: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return false;
                }

                _logger.LogInformation("✅ Inventario completado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al completar inventario {InventarioId}", inventarioId);
                return false;
            }
        }

        /// <summary>
        /// Cancela un inventario
        /// </summary>
        public async Task<bool> CancelarInventarioAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("❌ Cancelando inventario {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.PostAsync($"api/Inventario/inventarios-programados/{inventarioId}/cancelar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al cancelar inventario: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return false;
                }

                _logger.LogInformation("✅ Inventario cancelado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al cancelar inventario {InventarioId}", inventarioId);
                return false;
            }
        }

        // =====================================
        // VALIDACIÓN Y PERMISOS
        // =====================================

        /// <summary>
        /// Verifica permisos de conteo del usuario
        /// </summary>
        public async Task<bool> VerificarPermisosConteoAsync(int inventarioId, int usuarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔒 Verificando permisos de conteo para usuario {UsuarioId} en inventario {InventarioId}",
                    usuarioId, inventarioId);

                var inventario = await ObtenerInventarioAsync(inventarioId, jwtToken);

                if (inventario?.AsignacionesUsuarios == null)
                {
                    return false;
                }

                var tienePermiso = inventario.AsignacionesUsuarios.Any(a =>
                    a.UsuarioId == usuarioId && a.PermisoConteo);

                _logger.LogInformation("✅ Permisos verificados: {TienePermiso}", tienePermiso);
                return tienePermiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al verificar permisos");
                return false;
            }
        }

        /// <summary>
        /// Valida el estado del inventario
        /// </summary>
        public async Task<bool> ValidarEstadoInventarioAsync(int inventarioId, string jwtToken)
        {
            try
            {
                var inventario = await ObtenerInventarioAsync(inventarioId, jwtToken);

                var esValido = inventario?.Estado == "En Progreso";

                _logger.LogInformation("🔍 Estado del inventario {InventarioId}: {Estado} - Válido: {EsValido}",
                    inventarioId, inventario?.Estado ?? "Desconocido", esValido);

                return esValido;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al validar estado del inventario {InventarioId}", inventarioId);
                return false;
            }
        }

        // =====================================
        // MÉTODOS AUXILIARES PRIVADOS
        // =====================================

        /// <summary>
        /// Configura la autenticación JWT en el HttpClient
        /// </summary>
        private void ConfigurarAutenticacion(string jwtToken)
        {
            if (!string.IsNullOrEmpty(jwtToken))
            {
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", jwtToken);
            }
        }
    }
}