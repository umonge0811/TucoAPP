using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace GestionLlantera.Web.Services
{
    public class NotificacionService : INotificacionService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<NotificacionService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NotificacionService(HttpClient httpClient, ILogger<NotificacionService> logger, IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }


        private void ConfigurarAuthorizationHeader()
        {
            try
            {
                // ✅ CORREGIR EL NOMBRE DE LA COOKIE
                var token = _httpContextAccessor.HttpContext?.Request.Cookies["JwtToken"]; // ← Cambiar a "JwtToken"

                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    _logger.LogInformation("Token JWT configurado en el HttpClient");
                }
                else
                {
                    _logger.LogWarning("No se encontró token JWT en cookies");

                    // Debug: Mostrar todas las cookies disponibles
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

                // ✅ AHORA LA URL NO NECESITA EL userId - LA API LO OBTIENE DEL TOKEN
                var response = await _httpClient.GetAsync("api/notificaciones/mis-notificaciones");

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

                var response = await _httpClient.GetAsync("api/notificaciones/conteo-no-leidas");

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

                var response = await _httpClient.PutAsync($"api/notificaciones/{notificacionId}/marcar-leida", null);
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

                var response = await _httpClient.PutAsync("api/notificaciones/marcar-todas-leidas", null);
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