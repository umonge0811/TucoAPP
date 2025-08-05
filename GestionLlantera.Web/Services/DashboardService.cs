
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;

namespace GestionLlantera.Web.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<DashboardService> _logger;

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
                _logger.LogInformation("📊 Solicitando top vendedor desde dashboard service");

                // 🔑 CONFIGURAR TOKEN JWT SI SE PROPORCIONA (mismo patrón que otros servicios)
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener top vendedor");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener top vendedor");
                }

                var response = await _httpClient.GetAsync("api/dashboard/top-vendedor");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en respuesta de API: {StatusCode}", response.StatusCode);
                    return (false, null, "Error al obtener información del top vendedor");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📊 Respuesta de top vendedor recibida: {Response}", jsonContent);

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var resultado = JsonSerializer.Deserialize<dynamic>(jsonContent, options);

                return (true, resultado, "Top vendedor obtenido correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener top vendedor");
                return (false, null, "Error interno al obtener top vendedor");
            }
        }

        public async Task<(bool success, object data, string mensaje)> ObtenerUsuariosConectadosAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("👥 Solicitando usuarios conectados desde dashboard service");

                // 🔑 CONFIGURAR TOKEN JWT SI SE PROPORCIONA (mismo patrón que otros servicios)
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener usuarios conectados");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener usuarios conectados");
                }

                var response = await _httpClient.GetAsync("api/dashboard/usuarios-conectados");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en respuesta de API: {StatusCode}", response.StatusCode);
                    return (false, null, "Error al obtener información de usuarios conectados");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("👥 Respuesta de usuarios conectados recibida: {Response}", jsonContent);

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var resultado = JsonSerializer.Deserialize<dynamic>(jsonContent, options);

                return (true, resultado, "Usuarios conectados obtenidos correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener usuarios conectados");
                return (false, null, "Error interno al obtener usuarios conectados");
            }
        }
    }
}
