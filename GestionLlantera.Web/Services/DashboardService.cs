using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;

namespace GestionLlantera.Web.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<DashboardService> _logger;

        // Se asume que _apiBaseUrl y _jsonOptions están definidos en alguna parte de esta clase o se pasan en el constructor.
        // Para este ejemplo, se asumirán que existen para que el código de los cambios sea funcional.
        private readonly string _apiBaseUrl = "https://api.example.com"; // Placeholder
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true }; // Placeholder

        public DashboardService(IHttpClientFactory httpClientFactory, ILogger<DashboardService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        public async Task<(bool success, object data, string mensaje)> ObtenerAlertasStockAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 Solicitando alertas de stock desde dashboard service");

                // 🔑 CONFIGURAR TOKEN JWT SI SE PROPORCIONA (mismo patrón que otros servicios)
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener alertas de stock");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener alertas de stock");
                }

                var response = await _httpClient.GetAsync("api/dashboard/alertas-stock");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en respuesta de API: {StatusCode}", response.StatusCode);
                    return (false, null, "Error al obtener alertas de stock");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📊 Respuesta recibida: {Response}", jsonContent);

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var resultado = JsonSerializer.Deserialize<dynamic>(jsonContent, options);

                return (true, resultado, "Alertas obtenidas correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener alertas de stock");
                return (false, null, "Error interno al obtener alertas");
            }
        }

        public async Task<(bool success, object data, string mensaje)> ObtenerInventarioTotalAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 Solicitando estadísticas de inventario total desde dashboard service");

                // 🔑 CONFIGURAR TOKEN JWT SI SE PROPORCIONA (mismo patrón que otros servicios)
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener inventario total");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener inventario total");
                }

                var response = await _httpClient.GetAsync("api/dashboard/inventario-total");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en respuesta de API: {StatusCode}", response.StatusCode);
                    return (false, null, "Error al obtener estadísticas de inventario");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📊 Respuesta de inventario total recibida: {Response}", jsonContent);

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var resultado = JsonSerializer.Deserialize<dynamic>(jsonContent, options);

                return (true, resultado, "Estadísticas de inventario obtenidas correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener estadísticas de inventario total");
                return (false, null, "Error interno al obtener estadísticas de inventario");
            }
        }

        public async Task<(bool success, object data, string mensaje)> ObtenerTopVendedorAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("🏆 Consultando top vendedor desde API");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/Dashboard/top-vendedor");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var resultado = JsonSerializer.Deserialize<ApiResponse>(jsonResponse, _jsonOptions);

                    if (resultado?.success == true)
                    {
                        _logger.LogInformation("✅ Top vendedor obtenido correctamente desde API");
                        return (true, resultado.data, resultado.mensaje ?? "Top vendedor obtenido correctamente");
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ API retornó success=false para top vendedor: {Mensaje}", resultado?.mensaje);
                        return (false, null, resultado?.mensaje ?? "No se pudo obtener el top vendedor");
                    }
                }
                else
                {
                    _logger.LogError("❌ Error HTTP al consultar top vendedor: {StatusCode}", response.StatusCode);
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Contenido del error: {ErrorContent}", errorContent);
                    return (false, null, $"Error al consultar top vendedor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener top vendedor");
                return (false, null, "Error interno al obtener estadísticas de vendedor");
            }
        }

        public async Task<(bool success, object data, string mensaje)> ObtenerUsuariosConectadosAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("👥 Consultando usuarios conectados desde API");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/Dashboard/usuarios-conectados");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var resultado = JsonSerializer.Deserialize<ApiResponse>(jsonResponse, _jsonOptions);

                    if (resultado?.success == true)
                    {
                        _logger.LogInformation("✅ Usuarios conectados obtenidos correctamente desde API");
                        return (true, resultado.data, resultado.mensaje ?? "Usuarios conectados obtenidos correctamente");
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ API retornó success=false para usuarios conectados: {Mensaje}", resultado?.mensaje);
                        return (false, null, resultado?.mensaje ?? "No se pudo obtener usuarios conectados");
                    }
                }
                else
                {
                    _logger.LogError("❌ Error HTTP al consultar usuarios conectados: {StatusCode}", response.StatusCode);
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Contenido del error: {ErrorContent}", errorContent);
                    return (false, null, $"Error al consultar usuarios conectados: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener usuarios conectados");
                return (false, null, "Error interno al obtener usuarios conectados");
            }
        }
    }
}