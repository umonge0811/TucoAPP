
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.DTOs;
using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestionar notas rápidas en la capa Web
    /// </summary>
    public class NotasRapidasService : INotasRapidasService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<NotasRapidasService> _logger;
        // ✅ SERVICIO CENTRALIZADO PARA CONFIGURACIÓN DE API
        private readonly ApiConfigurationService _apiConfig;

        public NotasRapidasService(IHttpClientFactory httpClientFactory, ILogger<NotasRapidasService> logger, ApiConfigurationService apiConfig)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            
            /// ✅ INYECCIÓN DEL SERVICIO DE CONFIGURACIÓN CENTRALIZADA
            _apiConfig = apiConfig;

            // Log de diagnóstico para verificar la configuración
            _logger.LogInformation("🔧 NotasRapidasService inicializado. URL base API: {BaseUrl}", _apiConfig.BaseUrl);
        }

        /// <summary>
        /// Obtener todas las notas de un usuario
        /// </summary>
        public async Task<(bool success, List<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasUsuarioAsync(int usuarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Obteniendo notas para usuario: {UsuarioId}", usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"notasrapidas/usuario/{usuarioId}");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<List<NotaRapidaDTO>>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, "Notas obtenidas exitosamente");
                    }
                    
                    return (false, new List<NotaRapidaDTO>(), result?.Message ?? "Error al obtener notas");
                }

                return (false, new List<NotaRapidaDTO>(), $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo notas para usuario: {UsuarioId}", usuarioId);
                return (false, new List<NotaRapidaDTO>(), "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crear una nueva nota
        /// </summary>
        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> CrearNotaAsync(CrearNotaRapidaDTO request, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Creando nueva nota para usuario: {UsuarioId}", request.UsuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("notasrapidas");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<NotaRapidaDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, "Nota creada exitosamente");
                    }
                    
                    return (false, new NotaRapidaDTO(), result?.Message ?? "Error al crear nota");
                }

                return (false, new NotaRapidaDTO(), $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando nota para usuario: {UsuarioId}", request.UsuarioId);
                return (false, new NotaRapidaDTO(), "Error interno del servidor");
            }
        }

        /// <summary>
        /// Actualizar una nota existente
        /// </summary>
        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> ActualizarNotaAsync(ActualizarNotaRapidaDTO request, int id, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Actualizando nota {NotaId}", id);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"notasrapidas/{id}");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PutAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<NotaRapidaDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, "Nota actualizada exitosamente");
                    }
                    
                    return (false, new NotaRapidaDTO(), result?.Message ?? "Error al actualizar nota");
                }

                return (false, new NotaRapidaDTO(), $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando nota {NotaId}", id);
                return (false, new NotaRapidaDTO(), "Error interno del servidor");
            }
        }

        /// <summary>
        /// Eliminar una nota
        /// </summary>
        public async Task<(bool success, string message)> EliminarNotaAsync(int notaId, int usuarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Eliminando nota {NotaId} para usuario: {UsuarioId}", notaId, usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"notasrapidas/{notaId}?usuarioId={usuarioId}");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.DeleteAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<object>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true)
                    {
                        return (true, "Nota eliminada exitosamente");
                    }
                    
                    return (false, result?.Message ?? "Error al eliminar nota");
                }

                return (false, $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando nota {NotaId} para usuario: {UsuarioId}", notaId, usuarioId);
                return (false, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Cambiar estado favorita de una nota
        /// </summary>
        public async Task<(bool success, NotaRapidaDTO nota, bool EsFavorita, string mensaje)> CambiarFavoritaAsync(int notaId, bool esFavorita, int usuarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Cambiando estado favorita de nota {NotaId} a {EsFavorita} para usuario: {UsuarioId}", notaId, esFavorita, usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var requestData = new { EsFavorita = esFavorita, UsuarioId = usuarioId };
                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"notasrapidas/{notaId}/favorita");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PatchAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<NotaRapidaDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, result.Data.EsFavorita, esFavorita ? "Nota marcada como favorita" : "Nota desmarcada como favorita");
                    }
                    
                    return (false, new NotaRapidaDTO(), false, result?.Message ?? "Error al cambiar estado favorita");
                }

                return (false, new NotaRapidaDTO(), false, $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cambiando estado favorita de nota {NotaId} para usuario: {UsuarioId}", notaId, usuarioId);
                return (false, new NotaRapidaDTO(), false, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Clase auxiliar para deserializar respuestas de la API
        /// </summary>
        private class ApiResponse<T>
        {
            public bool Success { get; set; }
            public T? Data { get; set; }
            public string? Message { get; set; }
        }
    }
}
