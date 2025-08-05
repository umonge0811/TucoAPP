
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.DTOs;
using System.Text.Json;
using System.Text;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestionar notas rápidas en la capa Web
    /// </summary>
    public class NotasRapidasService : INotasRapidasService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<NotasRapidasService> _logger;

        public NotasRapidasService(IHttpClientFactory httpClientFactory, ILogger<NotasRapidasService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        /// <summary>
        /// Obtener todas las notas de un usuario
        /// </summary>
        public async Task<(bool success, List<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasUsuarioAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("Obteniendo notas para usuario: {UsuarioId}", usuarioId);

                // Configurar headers de autorización si hay token disponible
                _httpClient.DefaultRequestHeaders.Clear();
                // Nota: El token se configuraría aquí si se pasa como parámetro

                var response = await _httpClient.GetAsync($"api/notasrapidas/usuario/{usuarioId}");

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
        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> CrearNotaAsync(CrearNotaRapidaDTO request)
        {
            try
            {
                _logger.LogInformation("Creando nueva nota para usuario: {UsuarioId}", request.UsuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/notasrapidas", content);

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
        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> ActualizarNotaAsync(ActualizarNotaRapidaDTO request, int usuarioId)
        {
            try
            {
                _logger.LogInformation("Actualizando nota {NotaId} para usuario: {UsuarioId}", request.NotaId, usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();

                // Agregar el usuarioId al request para validación en la API
                var requestWithUser = new { request.NotaId, request.Titulo, request.Contenido, request.Color, UsuarioId = usuarioId };
                
                var json = JsonSerializer.Serialize(requestWithUser);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/notasrapidas/{request.NotaId}", content);

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
                _logger.LogError(ex, "Error actualizando nota {NotaId} para usuario: {UsuarioId}", request.NotaId, usuarioId);
                return (false, new NotaRapidaDTO(), "Error interno del servidor");
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

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();

                var response = await _httpClient.DeleteAsync($"api/notasrapidas/{notaId}?usuarioId={usuarioId}");

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
        public async Task<(bool success, NotaRapidaDTO nota, bool EsFavorita, string mensaje)> CambiarFavoritaAsync(int notaId, bool esFavorita, int usuarioId)
        {
            try
            {
                _logger.LogInformation("Cambiando estado favorita de nota {NotaId} a {EsFavorita} para usuario: {UsuarioId}", notaId, esFavorita, usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();

                var requestData = new { EsFavorita = esFavorita, UsuarioId = usuarioId };
                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"api/notasrapidas/{notaId}/favorita", content);

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
