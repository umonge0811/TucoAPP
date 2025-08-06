using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestionar notificaciones del usuario
    /// Utiliza ApiConfigurationService para URLs centralizadas
    /// </summary>
    public class NotificacionService : INotificacionService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<NotificacionService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApiConfigurationService _apiConfig;

        /// <summary>
        /// Constructor con inyección del servicio de configuración centralizado
        /// </summary>
        public NotificacionService(
            HttpClient httpClient, 
            ILogger<NotificacionService> logger, 
            IHttpContextAccessor httpContextAccessor,
            ApiConfigurationService apiConfig)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _apiConfig = apiConfig;
        }

        private void ConfigurarAuthorizationHeader()
        {
            try
            {
                var token = _httpContextAccessor.HttpContext?.Request.Cookies["JwtToken"];

                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    _logger.LogInformation("Token JWT configurado en el HttpClient");
                }
                else
                {
                    _logger.LogWarning("No se encontró token JWT en cookies");
                    var cookies = _httpContextAccessor.HttpContext?.Request.Cookies;
                    if (cookies != null)
                    {
                        _logger.LogInformation($"Cookies disponibles: {string.Join(", ", cookies.Keys)}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al configurar el header de autorización");
            }
        }

        public async Task<List<NotificacionDTO>> ObtenerMisNotificacionesAsync()
        {
            try
            {
                ConfigurarAuthorizationHeader();
                _logger.LogInformation("Obteniendo notificaciones del usuario...");

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl("Notificaciones/mis-notificaciones");
                _logger.LogInformation($"🌐 URL construida: {url}");
                
                var response = await _httpClient.GetAsync(url);
                _logger.LogInformation($"Respuesta API: {response.StatusCode}");

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation($"Notificaciones recibidas: {json.Length} caracteres");

                    var notificaciones = JsonConvert.DeserializeObject<List<NotificacionDTO>>(json);
                    return notificaciones ?? new List<NotificacionDTO>();
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Error al obtener notificaciones: {StatusCode} - {Content}", response.StatusCode, errorContent);
                }

                return new List<NotificacionDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al obtener notificaciones");
                return new List<NotificacionDTO>();
            }
        }

        public async Task<int> ObtenerConteoNoLeidasAsync()
        {
            try
            {
                ConfigurarAuthorizationHeader();

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl("Notificaciones/conteo-no-leidas");
                _logger.LogInformation($"🌐 URL construida: {url}");
                
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonConvert.DeserializeObject<int>(json);
                }

                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener conteo de notificaciones no leídas");
                return 0;
            }
        }

        public async Task<bool> MarcarComoLeidaAsync(int notificacionId)
        {
            try
            {
                ConfigurarAuthorizationHeader();

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl($"Notificaciones/{notificacionId}/marcar-leida");
                _logger.LogInformation($"🌐 URL construida: {url}");
                
                var response = await _httpClient.PutAsync(url, null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar notificación como leída: {Id}", notificacionId);
                return false;
            }
        }

        public async Task<bool> MarcarTodasComoLeidasAsync()
        {
            try
            {
                ConfigurarAuthorizationHeader();

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl("Notificaciones/marcar-todas-leidas");
                _logger.LogInformation($"🌐 URL construida: {url}");
                
                var response = await _httpClient.PutAsync(url, null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas");
                return false;
            }
        }
    }
}