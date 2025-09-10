
using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    public class ServiciosService : IServiciosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ServiciosService> _logger;
        private readonly ApiConfigurationService _apiConfig;

        public ServiciosService(
            IHttpClientFactory httpClientFactory,
            ILogger<ServiciosService> logger,
            ApiConfigurationService apiConfig)
        {
            _httpClient = httpClientFactory.CreateClient("ApiClient");
            _logger = logger;
            _apiConfig = apiConfig;
        }

        private void ConfigurarAutenticacion(string jwtToken)
        {
            if (!string.IsNullOrEmpty(jwtToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
            }
        }

        public async Task<List<ServicioDTO>> ObtenerServiciosAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔧 Obteniendo servicios desde API");

                ConfigurarAutenticacion(jwtToken);

                var url = _apiConfig.GetApiUrl("Servicios");
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener servicios: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    return new List<ServicioDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var servicios = JsonConvert.DeserializeObject<List<ServicioDTO>>(content);

                _logger.LogInformation("✅ Servicios obtenidos exitosamente: {Count}", servicios?.Count ?? 0);
                return servicios ?? new List<ServicioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener servicios");
                return new List<ServicioDTO>();
            }
        }

        public async Task<ServicioDTO?> ObtenerServicioPorIdAsync(int id, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔧 Obteniendo servicio {Id} desde API", id);

                ConfigurarAutenticacion(jwtToken);

                var url = _apiConfig.GetApiUrl($"Servicios/{id}");
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener servicio {Id}: {StatusCode} - {Error}", 
                        id, response.StatusCode, errorContent);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var servicio = JsonConvert.DeserializeObject<ServicioDTO>(content);

                _logger.LogInformation("✅ Servicio {Id} obtenido exitosamente", id);
                return servicio;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener servicio {Id}", id);
                return null;
            }
        }

        public async Task<bool> CrearServicioAsync(ServicioDTO servicio, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔧 Creando servicio: {Nombre}", servicio.NombreServicio);

                ConfigurarAutenticacion(jwtToken);

                var url = _apiConfig.GetApiUrl("Servicios");
                var json = JsonConvert.SerializeObject(servicio);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al crear servicio: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    return false;
                }

                _logger.LogInformation("✅ Servicio creado exitosamente: {Nombre}", servicio.NombreServicio);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al crear servicio: {Nombre}", servicio.NombreServicio);
                return false;
            }
        }

        public async Task<bool> ActualizarServicioAsync(int id, ServicioDTO servicio, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔧 Actualizando servicio {Id}: {Nombre}", id, servicio.NombreServicio);

                ConfigurarAutenticacion(jwtToken);

                var url = _apiConfig.GetApiUrl($"Servicios/{id}");
                var json = JsonConvert.SerializeObject(servicio);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al actualizar servicio {Id}: {StatusCode} - {Error}", 
                        id, response.StatusCode, errorContent);
                    return false;
                }

                _logger.LogInformation("✅ Servicio {Id} actualizado exitosamente", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al actualizar servicio {Id}", id);
                return false;
            }
        }

        public async Task<bool> EliminarServicioAsync(int id, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔧 Eliminando servicio {Id}", id);

                ConfigurarAutenticacion(jwtToken);

                var url = _apiConfig.GetApiUrl($"Servicios/{id}");
                var response = await _httpClient.DeleteAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al eliminar servicio {Id}: {StatusCode} - {Error}", 
                        id, response.StatusCode, errorContent);
                    return false;
                }

                _logger.LogInformation("✅ Servicio {Id} eliminado exitosamente", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al eliminar servicio {Id}", id);
                return false;
            }
        }
    }
}
