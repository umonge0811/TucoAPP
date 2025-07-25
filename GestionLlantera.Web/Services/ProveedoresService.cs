using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using tuco.Clases.Models;

namespace GestionLlantera.Web.Services
{
    public class ProveedoresService : IProveedoresService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ProveedoresService> _logger;
        private readonly IConfiguration _configuration;

        public ProveedoresService(IHttpClientFactory httpClientFactory, ILogger<ProveedoresService> logger, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _configuration = configuration;
        }

        private void ConfigurarAutenticacion(string token)
        {
            if (!string.IsNullOrEmpty(token))
            {
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            }
        }

        public async Task<List<Proveedore>> ObtenerProveedoresAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo proveedores desde API");
                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync("api/Proveedores");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error obteniendo clientes: {StatusCode}", response.StatusCode);
                    return new List<Proveedore>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var todosProveedores = JsonConvert.DeserializeObject<List<Proveedore>>(content) ?? new List<Proveedore>();

                // Filtrar solo proveedores activos
                var proveedores = todosProveedores.Where(p => p.Activo == true).ToList();

                _logger.LogInformation($"📋 Total proveedores: {todosProveedores.Count}, Activos: {proveedores.Count}");

                return proveedores;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo proveedores");
                return new List<Proveedore>();
            }
        }

        public async Task<(bool success, object data, string message)> CrearProveedorAsync(Proveedore proveedor, string jwtToken)
        {
            try
            {
                _logger.LogInformation("➕ Creando proveedor: {Nombre}", proveedor.NombreProveedor);

                // ✅ CONFIGURAR TOKEN JWT SI SE PROPORCIONA
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT - la petición podría fallar");
                }

                var json = JsonConvert.SerializeObject(proveedor);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Proveedores", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (true, resultado, "Proveedor creado exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error creando proveedor: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return (false, null, "Error creando proveedor");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando proveedor");
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, object data, string message)> ActualizarProveedorAsync(Proveedore proveedor, string token)
        {
            try
            {
                _logger.LogInformation("📝 Actualizando proveedor: {Id}", proveedor.ProveedorId);
                ConfigurarAutenticacion(token);

                var json = JsonConvert.SerializeObject(proveedor);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/Proveedores/{proveedor.ProveedorId}", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (true, resultado, "Proveedor actualizado exitosamente");
                }
                else

                {
                    _logger.LogError("❌ Error actualizando proveedor: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return (false, null, "Error actualizando proveedor");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando proveedor");
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, object data, string message)> EliminarProveedorAsync(int id, string token)
        {
            try
            {
                _logger.LogInformation("🗑️ Eliminando proveedor: {Id}", id);
                ConfigurarAutenticacion(token);

                var response = await _httpClient.DeleteAsync($"api/Proveedores/{id}");
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return (true, null, "Proveedor eliminado exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error eliminando proveedor: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return (false, null, "Error eliminando proveedor");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando proveedor");
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, object data, string message)> ObtenerPedidosProveedorAsync(int? proveedorId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo pedidos de proveedores");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                string url = "api/PedidosProveedor";
                if (proveedorId.HasValue)
                {
                    url += $"?proveedorId={proveedorId}";
                }

                var response = await _httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    // Intentar deserializar, si falla o está vacío, devolver array vacío
                    try
                    {
                        var pedidos = JsonConvert.DeserializeObject<dynamic>(content);
                        return (true, pedidos ?? new List<object>(), "Pedidos obtenidos exitosamente");
                    }
                    catch
                    {
                        _logger.LogInformation("📋 No hay pedidos disponibles o respuesta vacía");
                        return (true, new List<object>(), "No hay pedidos disponibles");
                    }
                }
                else
                {
                    _logger.LogError("❌ Error obteniendo pedidos: {StatusCode} - {Content}", response.StatusCode, content);
                    return (false, new List<object>(), "Error obteniendo pedidos");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pedidos");
                return (false, new List<object>(), "Error interno del servidor");
            }
        }

        public async Task<List<Proveedore>> ObtenerTodosProveedoresAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo TODOS los proveedores (activos e inactivos)");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync("api/Proveedores");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error obteniendo todos los proveedores: {StatusCode}", response.StatusCode);
                    return new List<Proveedore>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var proveedores = JsonConvert.DeserializeObject<List<Proveedore>>(content) ?? new List<Proveedore>();

                _logger.LogInformation($"📋 Total proveedores obtenidos: {proveedores.Count}");
                return proveedores;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo todos los proveedores");
                return new List<Proveedore>();
            }
        }

        public async Task<(bool success, object data, string message)> CambiarEstadoProveedorAsync(int proveedorId, bool activo, string token)
        {
            try
            {
                _logger.LogInformation("🔄 Cambiando estado de proveedor {ProveedorId} a {Estado}", proveedorId, activo ? "Activo" : "Inactivo");
                ConfigurarAutenticacion(token);

                var estadoData = new { activo = activo };
                var json = JsonConvert.SerializeObject(estadoData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"api/Proveedores/{proveedorId}/estado", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (true, resultado, $"Proveedor {(activo ? "activado" : "desactivado")} exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error cambiando estado: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return (false, null, "Error cambiando estado del proveedor");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cambiando estado del proveedor");
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, string message, object? data)> CrearPedidoProveedorAsync(object pedidoData, string token)
        {
            try
            {
                _logger.LogInformation("📦 Creando pedido para proveedor");
                ConfigurarAutenticacion(token);

                var json = JsonConvert.SerializeObject(pedidoData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/PedidosProveedor", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (true, "Pedido creado exitosamente", resultado);
                }
                else
                {
                    _logger.LogError("❌ Error creando pedido: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return (false, "Error creando pedido", null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando pedido");
                return (false, "Error interno del servidor", null);
            }
        }

        public async Task<(bool success, object data, string message)> ObtenerProductosParaFacturacionAsync()
        {
            try
            {
                _logger.LogInformation("📦 Obteniendo productos para facturación desde servicio de proveedores");

                var response = await _httpClient.GetAsync("/Facturacion/ObtenerProductosParaFacturacion");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                    // Log para debug de los datos recibidos
                    _logger.LogInformation("📋 Datos de productos recibidos: {Content}", content.Substring(0, Math.Min(500, content.Length)));

                    _logger.LogInformation("✅ Productos obtenidos exitosamente");
                    return (true, resultado, "Productos cargados exitosamente");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error HTTP obteniendo productos: {StatusCode} - {Error}", response.StatusCode, error);
                    return (false, null, $"Error HTTP: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo productos para facturación");
                return (false, null, $"Error: {ex.Message}");
            }
        }
    }
}