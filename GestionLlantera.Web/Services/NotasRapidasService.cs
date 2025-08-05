
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.DTOs;
using System.Text.Json;
using System.Text;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para manejar las notas rápidas en la capa Web
    /// </summary>
    public class NotasRapidasService : INotasRapidasService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<NotasRapidasService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _apiBaseUrl;

        public NotasRapidasService(
            HttpClient httpClient,
            ILogger<NotasRapidasService> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
            _apiBaseUrl = _configuration["ApiSettings:BaseUrl"] ?? "http://localhost:5049";
        }

        /// <summary>
        /// Obtener todas las notas de un usuario
        /// </summary>
        public async Task<(bool success, List<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasUsuarioAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("Obteniendo notas para usuario: {UsuarioId}", usuarioId);

                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/api/NotasRapidas/usuario/{usuarioId}");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ApiResponse<List<NotaRapidaDTO>>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Success == true && apiResponse.Data != null)
                    {
                        return (true, apiResponse.Data, "Notas obtenidas exitosamente");
                    }

                    return (false, new List<NotaRapidaDTO>(), apiResponse?.Message ?? "Error desconocido");
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error al obtener notas: {StatusCode} - {Content}", response.StatusCode, errorContent);
                return (false, new List<NotaRapidaDTO>(), "Error al obtener las notas");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notas del usuario {UsuarioId}", usuarioId);
                return (false, new List<NotaRapidaDTO>(), "Error interno al obtener las notas");
            }
        }

        /// <summary>
        /// Crear una nueva nota
        /// </summary>
        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> CrearNotaAsync(CrearNotaRapidaDTO request)
        {
            try
            {
                _logger.LogInformation("Creando nueva nota para usuario: {UsuarioId}", request.UsuarioId);

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_apiBaseUrl}/api/NotasRapidas", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ApiResponse<NotaRapidaDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Success == true && apiResponse.Data != null)
                    {
                        return (true, apiResponse.Data, apiResponse.Message ?? "Nota creada exitosamente");
                    }

                    return (false, null, apiResponse?.Message ?? "Error desconocido");
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error al crear nota: {StatusCode} - {Content}", response.StatusCode, errorContent);
                return (false, null, "Error al crear la nota");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear nota");
                return (false, null, "Error interno al crear la nota");
            }
        }

        /// <summary>
        /// Actualizar una nota existente
        /// </summary>
        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> ActualizarNotaAsync(ActualizarNotaRapidaDTO request, int usuarioId)
        {
            try
            {
                _logger.LogInformation("Actualizando nota {NotaId} para usuario: {UsuarioId}", request.NotaId, usuarioId);

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"{_apiBaseUrl}/api/NotasRapidas/{request.NotaId}", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ApiResponse<NotaRapidaDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Success == true && apiResponse.Data != null)
                    {
                        return (true, apiResponse.Data, apiResponse.Message ?? "Nota actualizada exitosamente");
                    }

                    return (false, null, apiResponse?.Message ?? "Error desconocido");
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error al actualizar nota: {StatusCode} - {Content}", response.StatusCode, errorContent);
                return (false, null, "Error al actualizar la nota");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar nota {NotaId}", request.NotaId);
                return (false, null, "Error interno al actualizar la nota");
            }
        }

        /// <summary>
        /// Eliminar una nota
        /// </summary>
        public async Task<(bool success, string message)> EliminarNotaAsync(int notaId, int usuarioId)
        {
            try
            {
                _logger.LogInformation("Eliminando nota {NotaId} para usuario: {UsuarioId}", notaId, usuarioId);

                var response = await _httpClient.DeleteAsync($"{_apiBaseUrl}/api/NotasRapidas/{notaId}?usuarioId={usuarioId}");

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ApiResponse<object>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return (apiResponse?.Success == true, apiResponse?.Message ?? "Nota eliminada exitosamente");
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error al eliminar nota: {StatusCode} - {Content}", response.StatusCode, errorContent);
                return (false, "Error al eliminar la nota");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar nota {NotaId}", notaId);
                return (false, "Error interno al eliminar la nota");
            }
        }

        /// <summary>
        /// Cambiar estado favorita de una nota
        /// </summary>
        public async Task<(bool success, NotaRapidaDTO nota, bool EsFavorita, string mensaje)> CambiarFavoritaAsync(int notaId, bool esFavorita, int usuarioId)
        {
            try
            {
                _logger.LogInformation("Cambiando estado favorita de nota {NotaId} a {EsFavorita} para usuario: {UsuarioId}", 
                    notaId, esFavorita, usuarioId);

                var request = new { EsFavorita = esFavorita, UsuarioId = usuarioId };
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"{_apiBaseUrl}/api/NotasRapidas/{notaId}/favorita", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ApiResponse<NotaRapidaDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Success == true && apiResponse.Data != null)
                    {
                        return (true, apiResponse.Data, apiResponse.Data.EsFavorita, apiResponse.Message ?? "Estado actualizado");
                    }

                    return (false, null, false, apiResponse?.Message ?? "Error desconocido");
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error al cambiar estado favorita: {StatusCode} - {Content}", response.StatusCode, errorContent);
                return (false, null, false, "Error al cambiar estado favorita");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado favorita de nota {NotaId}", notaId);
                return (false, null, false, "Error interno al cambiar estado favorita");
            }
        }
    }

    /// <summary>
    /// Clase para deserializar respuestas de la API
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Data { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
