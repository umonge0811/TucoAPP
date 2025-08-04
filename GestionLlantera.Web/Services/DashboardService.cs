
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;

namespace GestionLlantera.Web.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(HttpClient httpClient, ILogger<DashboardService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<(bool success, object data, string mensaje)> ObtenerAlertasStockAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 Solicitando alertas de stock desde dashboard service");

                // 🔑 CONFIGURAR EL TOKEN EN EL HEADER DE AUTORIZACIÓN
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado en headers de autorización");
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
    }
}
