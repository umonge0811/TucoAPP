
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;
using System.Text.Json;
using System.Text;

namespace GestionLlantera.Web.Services
{
    public class ServiciosService : IServiciosService
    {
        private readonly HttpClient _httpClient;
        private readonly ApiConfigurationService _apiConfig;
        private readonly ILogger<ServiciosService> _logger;

        public ServiciosService(HttpClient httpClient, ApiConfigurationService apiConfig, ILogger<ServiciosService> logger)
        {
            _httpClient = httpClient;
            _apiConfig = apiConfig;
            _logger = logger;
        }

        public async Task<IEnumerable<ServicioDTO>> ObtenerServiciosAsync(string busqueda = "", string tipoServicio = "", bool soloActivos = true)
        {
            try
            {
                var queryParams = new List<string>();
                if (!string.IsNullOrEmpty(busqueda))
                    queryParams.Add($"busqueda={Uri.EscapeDataString(busqueda)}");
                if (!string.IsNullOrEmpty(tipoServicio))
                    queryParams.Add($"tipoServicio={Uri.EscapeDataString(tipoServicio)}");
                queryParams.Add($"soloActivos={soloActivos}");

                var queryString = string.Join("&", queryParams);
                var response = await _httpClient.GetAsync($"{_apiConfig.BaseUrl}/api/servicios?{queryString}");

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<IEnumerable<ServicioDTO>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<ServicioDTO>();
                }

                return new List<ServicioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener servicios");
                return new List<ServicioDTO>();
            }
        }

        public async Task<ServicioDTO?> ObtenerServicioPorIdAsync(int id)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_apiConfig.BaseUrl}/api/servicios/{id}");

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<ServicioDTO>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener servicio {Id}", id);
                return null;
            }
        }

        public async Task<bool> CrearServicioAsync(ServicioDTO servicio)
        {
            try
            {
                var json = JsonSerializer.Serialize(servicio);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_apiConfig.BaseUrl}/api/servicios", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear servicio");
                return false;
            }
        }

        public async Task<bool> ActualizarServicioAsync(int id, ServicioDTO servicio)
        {
            try
            {
                var json = JsonSerializer.Serialize(servicio);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"{_apiConfig.BaseUrl}/api/servicios/{id}", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar servicio {Id}", id);
                return false;
            }
        }

        public async Task<bool> EliminarServicioAsync(int id)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"{_apiConfig.BaseUrl}/api/servicios/{id}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar servicio {Id}", id);
                return false;
            }
        }

        public async Task<IEnumerable<string>> ObtenerTiposServiciosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_apiConfig.BaseUrl}/api/servicios/tipos");

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<IEnumerable<string>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<string>();
                }

                return new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener tipos de servicios");
                return new List<string>();
            }
        }
    }
}
