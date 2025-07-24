
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
                var proveedores = JsonConvert.DeserializeObject<List<Proveedore>>(content) ?? new List<Proveedore>();

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

        public async Task<(bool success, object data, string message)> ObtenerPedidosProveedorAsync(int? proveedorId, string token)
        {
            try
            {
                _logger.LogInformation("📦 Obteniendo pedidos de proveedor: {ProveedorId}", proveedorId);
                ConfigurarAutenticacion(token);

                string url = "api/PedidosProveedor";
                if (proveedorId.HasValue)
                {
                    url += $"?proveedorId={proveedorId}";
                }

                var response = await _httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var pedidos = JsonConvert.DeserializeObject<dynamic>(content);
                    return (true, pedidos, "Pedidos obtenidos exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error obteniendo pedidos: {StatusCode} - {Content}", response.StatusCode, content);
                    return (false, null, "Error obteniendo pedidos");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pedidos");
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, object data, string message)> CrearPedidoProveedorAsync(dynamic pedidoData, string token)
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
                    return (true, resultado, "Pedido creado exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error creando pedido: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return (false, null, "Error creando pedido");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando pedido");
                return (false, null, "Error interno del servidor");
            }
        }
    }
}
