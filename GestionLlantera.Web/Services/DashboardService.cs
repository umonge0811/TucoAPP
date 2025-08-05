
using System;
using System.Text;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DashboardService> _logger;
        private readonly string _apiBaseUrl;

        public DashboardService(HttpClient httpClient, IConfiguration configuration, ILogger<DashboardService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _apiBaseUrl = _configuration["ApiSettings:BaseUrl"] ?? "http://localhost:5049/api";
        }

        /// <summary>
        /// Obtener alertas de stock bajo desde la API
        /// </summary>
        public async Task<(bool success, object data, string mensaje)> ObtenerAlertasStockAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 DashboardService - Solicitando alertas de stock");

                // Configurar headers de autenticación
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwtToken}");

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/Dashboard/alertas-stock");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var alertas = JsonSerializer.Deserialize<object>(content, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });

                    _logger.LogInformation("✅ Alertas de stock obtenidas correctamente");
                    return (true, alertas, "Alertas de stock obtenidas correctamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error HTTP {StatusCode}: {Error}", response.StatusCode, errorContent);
                    return (false, null, $"Error del servidor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo alertas de stock");
                return (false, null, "Error interno del servicio");
            }
        }

        /// <summary>
        /// Obtener estadísticas del inventario total
        /// </summary>
        public async Task<(bool success, object data, string mensaje)> ObtenerInventarioTotalAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 DashboardService - Solicitando estadísticas de inventario total");

                // Configurar headers de autenticación
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwtToken}");

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/Dashboard/inventario-total");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var inventario = JsonSerializer.Deserialize<object>(content, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });

                    _logger.LogInformation("✅ Estadísticas de inventario total obtenidas correctamente");
                    return (true, inventario, "Estadísticas de inventario obtenidas correctamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error HTTP {StatusCode}: {Error}", response.StatusCode, errorContent);
                    return (false, null, $"Error del servidor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo estadísticas de inventario");
                return (false, null, "Error interno del servicio");
            }
        }

        /// <summary>
        /// Obtener información del top vendedor
        /// </summary>
        public async Task<(bool success, object data, string mensaje)> ObtenerTopVendedorAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("🏆 DashboardService - Solicitando top vendedor");

                // Configurar headers de autenticación
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwtToken}");

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/Dashboard/top-vendedor");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var topVendedor = JsonSerializer.Deserialize<object>(content, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });

                    _logger.LogInformation("✅ Top vendedor obtenido correctamente");
                    return (true, topVendedor, "Top vendedor obtenido correctamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error HTTP {StatusCode}: {Error}", response.StatusCode, errorContent);
                    return (false, null, $"Error del servidor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo top vendedor");
                return (false, null, "Error interno del servicio");
            }
        }

        /// <summary>
        /// Obtener usuarios actualmente conectados
        /// </summary>
        public async Task<(bool success, object data, string mensaje)> ObtenerUsuariosConectadosAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("👥 DashboardService - Solicitando usuarios conectados");

                // Configurar headers de autenticación
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwtToken}");

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/Dashboard/usuarios-conectados");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var usuariosConectados = JsonSerializer.Deserialize<object>(content, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });

                    _logger.LogInformation("✅ Usuarios conectados obtenidos correctamente");
                    return (true, usuariosConectados, "Usuarios conectados obtenidos correctamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error HTTP {StatusCode}: {Error}", response.StatusCode, errorContent);
                    return (false, null, $"Error del servidor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo usuarios conectados");
                return (false, null, "Error interno del servicio");
            }
        }
    }
}
