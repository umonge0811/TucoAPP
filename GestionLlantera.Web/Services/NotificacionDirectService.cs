using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using System.Security.Claims;
using System.Text.Json;
using System.Text;

namespace GestionLlantera.Web.Services
{
    public class NotificacionDirectService : INotificacionService
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<NotificacionDirectService> _logger;
        private readonly ApiConfigurationService _apiConfig;

        public NotificacionDirectService(
            IHttpClientFactory httpClientFactory,
            IHttpContextAccessor httpContextAccessor,
            ILogger<NotificacionDirectService> logger,
            ApiConfigurationService apiConfig)
        {
            _httpClient = httpClientFactory.CreateClient();
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _apiConfig = apiConfig;

            // Log de diagnóstico para verificar la configuración
            _logger.LogInformation("🔧 NotificacionDirectService inicializado. URL base API: {BaseUrl}", _apiConfig.BaseUrl);
        }

        public async Task<List<NotificacionDTO>> ObtenerMisNotificacionesAsync()
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("No se pudo obtener el token JWT");
                    return new List<NotificacionDTO>();
                }

                _logger.LogInformation("Obteniendo notificaciones desde API");

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Notificaciones/mis-notificaciones");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var notificaciones = JsonSerializer.Deserialize<List<NotificacionDTO>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NotificacionDTO>();

                    _logger.LogInformation($"Se obtuvieron {notificaciones.Count} notificaciones");
                    return notificaciones;
                }
                else
                {
                    _logger.LogError($"Error al obtener notificaciones: {response.StatusCode}");
                    return new List<NotificacionDTO>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notificaciones desde API");
                return new List<NotificacionDTO>();
            }
        }

        public async Task<int> ObtenerConteoNoLeidasAsync()
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token)) return 0;

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Notificaciones/conteo-no-leidas");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var conteo = JsonSerializer.Deserialize<int>(jsonContent);

                    _logger.LogInformation($"Conteo de notificaciones no leídas: {conteo}");
                    return conteo;
                }
                else
                {
                    _logger.LogError($"Error al obtener conteo: {response.StatusCode}");
                    return 0;
                }
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
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token)) return false;

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Notificaciones/{notificacionId}/marcar-leida");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PutAsync(url, null);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Notificación {notificacionId} marcada como leída");
                    return true;
                }
                else
                {
                    _logger.LogError($"Error al marcar notificación como leída: {response.StatusCode}");
                    return false;
                }
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
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token)) return false;

                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Notificaciones/marcar-todas-leidas");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PutAsync(url, null);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Todas las notificaciones marcadas como leídas");
                    return true;
                }
                else
                {
                    _logger.LogError($"Error al marcar todas las notificaciones como leídas: {response.StatusCode}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al marcar todas las notificaciones como leídas");
                return false;
            }
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        /// <returns>El token JWT o null si no se encuentra</returns>
        private string? ObtenerTokenJWT()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return null;

                // Intentar diferentes métodos para obtener el token, igual que otros controladores
                var token = context.User.FindFirst("jwt_token")?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    token = context.User.FindFirst("JwtToken")?.Value;
                }

                if (string.IsNullOrEmpty(token))
                {
                    token = context.User.FindFirst("access_token")?.Value;
                }

                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                        context.User.Identity?.Name ?? "Anónimo");
                    _logger.LogDebug("📋 Claims disponibles: {Claims}", 
                        string.Join(", ", context.User.Claims.Select(c => $"{c.Type}={c.Value}")));
                }
                else
                {
                    _logger.LogDebug("✅ Token JWT obtenido correctamente para usuario: {Usuario}",
                        context.User.Identity?.Name ?? "Anónimo");
                }

                return token;
            }
            catch (Exception ex)