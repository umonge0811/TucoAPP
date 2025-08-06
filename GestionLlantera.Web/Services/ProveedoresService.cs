using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;
using tuco.Clases.Models;
using GestionLlantera.Web.Models.DTOs;

namespace GestionLlantera.Web.Services
{
    public class ProveedoresService : IProveedoresService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ProveedoresService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IApiConfigurationService _apiConfig; // Agregado ApiConfigurationService

        public ProveedoresService(IHttpClientFactory httpClientFactory, ILogger<ProveedoresService> logger, IConfiguration configuration, IApiConfigurationService apiConfig) // Inyectado ApiConfigurationService
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _configuration = configuration;
            _apiConfig = apiConfig; // Asignado ApiConfigurationService
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

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Proveedores");
                _logger.LogDebug("🌐 URL construida para obtener proveedores: {url}", url);

                var response = await _httpClient.GetAsync(url);

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
                _logger.LogInformation("📋 Obteniendo pedidos desde API - ProveedorId: {ProveedorId}",
                    proveedorId?.ToString() ?? "TODOS");

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
                    if (string.IsNullOrWhiteSpace(content))
                    {
                        _logger.LogInformation("📋 Respuesta vacía - no hay pedidos");
                        return (true, new List<object>(), "No hay pedidos disponibles");
                    }

                    // Deserializar directamente como dynamic/JArray para obtener la estructura correcta
                    //var jsonResponse = JsonConvert.DeserializeObject<dynamic>(content);

                    _logger.LogInformation("📋 Contenido crudo: {Content}", content.Length > 500 ? content.Substring(0, 500) + "..." : content);

                    // Si la respuesta es directamente un array
                    //if (jsonResponse is Newtonsoft.Json.Linq.JArray jArray)
                    //{
                    //    var pedidos = jArray.ToObject<List<object>>() ?? new List<object>();
                    //    _logger.LogInformation("📋 {Count} pedidos obtenidos exitosamente (array directo)", pedidos.Count);
                    //    return (true, pedidos, "Pedidos obtenidos exitosamente");
                    //}
                    //// Si la respuesta tiene estructura con success/data
                    //else if (jsonResponse != null && jsonResponse.data != null)
                    //{
                    //    var pedidos = ((Newtonsoft.Json.Linq.JArray)jsonResponse.data).ToObject<List<object>>() ?? new List<object>();
                    //    _logger.LogInformation("📋 {Count} pedidos obtenidos exitosamente (estructura success/data)", pedidos.Count);
                    //    return (true, pedidos, "Pedidos obtenidos exitosamente");
                    //}
                    //else
                    //{
                    //    _logger.LogWarning("📋 Estructura de respuesta inesperada");
                    //    return (true, new List<object>(), "No hay pedidos disponibles");
                    //}

                    if (content.TrimStart().StartsWith("["))
                    {
                        // Deserializar directamente como JsonElement para mantener la estructura original
                        var pedidosJsonElement = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content);
                        var pedidosList = new List<object>();

                        foreach (var pedidoElement in pedidosJsonElement.EnumerateArray())
                        {
                            // Convertir cada elemento a Dictionary<string, object> para mantener la estructura
                            var pedidoDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(pedidoElement.GetRawText());
                            pedidosList.Add(pedidoDict);
                        }

                        _logger.LogInformation("📋 {Count} pedidos obtenidos exitosamente (array directo)", pedidosList.Count);
                        return (true, pedidosList, "Pedidos obtenidos exitosamente");
                    }
                    else
                    {
                        // Respuesta con estructura success/data
                        var resultadoElement = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content);

                        if (resultadoElement.TryGetProperty("success", out var successProp) && successProp.GetBoolean())
                        {
                            if (resultadoElement.TryGetProperty("data", out var dataProp))
                            {
                                var pedidosList = new List<object>();

                                foreach (var pedidoElement in dataProp.EnumerateArray())
                                {
                                    var pedidoDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(pedidoElement.GetRawText());
                                    pedidosList.Add(pedidoDict);
                                }

                                _logger.LogInformation("📋 {Count} pedidos obtenidos exitosamente", pedidosList.Count);
                                return (true, pedidosList, "Pedidos obtenidos exitosamente");
                            }
                            else
                            {
                                _logger.LogWarning("📋 No se encontró la propiedad 'data' en la respuesta.");
                                return (true, new List<object>(), "No hay pedidos disponibles");
                            }
                        }
                        else
                        {
                            _logger.LogWarning("📋 La respuesta indica 'success: false'.");
                            return (true, new List<object>(), "No hay pedidos disponibles");
                        }
                    }
                }
                else
                {
                    _logger.LogError("❌ Error HTTP obteniendo pedidos: {StatusCode}", response.StatusCode);
                    return (false, new List<object>(), $"Error HTTP {response.StatusCode}");
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

        public async Task<(bool success, object? data, string? message)> CrearPedidoProveedorAsync(CrearPedidoProveedorRequest pedidoData, string token)
        {
            try
            {
                _logger.LogInformation("📦 Enviando pedido al API para proveedor {ProveedorId}", pedidoData.ProveedorId);

                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                }

                var json = JsonConvert.SerializeObject(pedidoData, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore
                });

                _logger.LogInformation("📦 JSON enviado: {Json}", json);

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("api/PedidosProveedor", content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📦 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    if (string.IsNullOrWhiteSpace(responseContent))
                    {
                        _logger.LogWarning("📦 Respuesta vacía del API");
                        return (success: false, data: null, message: "Respuesta vacía del servidor");
                    }

                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    var mensaje = resultado?.message?.ToString() ?? "Pedido creado exitosamente";

                    return (success: true, data: resultado?.data, message: mensaje);
                }
                else
                {
                    _logger.LogError("❌ Error del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                    // Intentar obtener el mensaje de error del API
                    try
                    {
                        var errorResponse = JsonConvert.DeserializeObject<dynamic>(responseContent);
                        var errorMessage = errorResponse?.message?.ToString() ?? "Error desconocido del servidor";
                        return (success: false, data: null, message: errorMessage);
                    }
                    catch
                    {
                        return (success: false, data: null, message: "Error del servidor");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando pedido a proveedor");
                return (success: false, data: null, message: "Error interno: " );
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

        public async Task<(bool success, object data, string message)> CambiarEstadoPedidoAsync(int pedidoId, string estado, string token)
        {
            try
            {
                _logger.LogInformation("🔄 Cambiando estado del pedido {PedidoId} a {Estado}", pedidoId, estado);

                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                }

                var estadoData = new { estado = estado };
                var json = JsonConvert.SerializeObject(estadoData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/PedidosProveedor/{pedidoId}/estado", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📦 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = string.IsNullOrWhiteSpace(responseContent) ? 
                        new { message = "Estado actualizado exitosamente" } : 
                        JsonConvert.DeserializeObject<dynamic>(responseContent);

                    return (success: true, data: resultado, message: resultado?.message?.ToString() ?? "Estado actualizado exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                    try
                    {
                        var errorResponse = JsonConvert.DeserializeObject<dynamic>(responseContent);
                        var errorMessage = errorResponse?.message?.ToString() ?? "Error del servidor";
                        return (success: false, data: null, message: errorMessage);
                    }
                    catch
                    {
                        return (success: false, data: null, message: "Error del servidor");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cambiando estado del pedido");
                return (success: false, data: null, message: "Error interno: " + ex.Message);
            }
        }
    }
}