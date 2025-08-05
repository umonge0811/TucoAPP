
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.DTOs;
using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestionar anuncios en la capa Web
    /// </summary>
    public class AnunciosService : IAnunciosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AnunciosService> _logger;

        public AnunciosService(IHttpClientFactory httpClientFactory, ILogger<AnunciosService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        /// <summary>
        /// Obtener todos los anuncios activos
        /// </summary>
        public async Task<(bool success, List<AnuncioDTO> anuncios, string mensaje)> ObtenerAnunciosAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("Obteniendo anuncios activos");

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync("api/anuncios");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<List<AnuncioDTO>>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, "Anuncios obtenidos exitosamente");
                    }
                    
                    return (false, new List<AnuncioDTO>(), result?.Message ?? "Error al obtener anuncios");
                }

                return (false, new List<AnuncioDTO>(), $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo anuncios");
                return (false, new List<AnuncioDTO>(), "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crear un nuevo anuncio
        /// </summary>
        public async Task<(bool success, AnuncioDTO anuncio, string mensaje)> CrearAnuncioAsync(CrearAnuncioDTO request, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Creando nuevo anuncio para usuario: {UsuarioId}", request.UsuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/anuncios", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<AnuncioDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, "Anuncio creado exitosamente");
                    }
                    
                    return (false, new AnuncioDTO(), result?.Message ?? "Error al crear anuncio");
                }

                return (false, new AnuncioDTO(), $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando anuncio para usuario: {UsuarioId}", request.UsuarioId);
                return (false, new AnuncioDTO(), "Error interno del servidor");
            }
        }

        /// <summary>
        /// Actualizar un anuncio existente
        /// </summary>
        public async Task<(bool success, AnuncioDTO anuncio, string mensaje)> ActualizarAnuncioAsync(ActualizarAnuncioDTO request, int id, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Actualizando anuncio {AnuncioId}", id);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/anuncios/{id}", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<AnuncioDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, "Anuncio actualizado exitosamente");
                    }
                    
                    return (false, new AnuncioDTO(), result?.Message ?? "Error al actualizar anuncio");
                }

                return (false, new AnuncioDTO(), $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando anuncio {AnuncioId}", id);
                return (false, new AnuncioDTO(), "Error interno del servidor");
            }
        }

        /// <summary>
        /// Eliminar un anuncio
        /// </summary>
        public async Task<(bool success, string message)> EliminarAnuncioAsync(int anuncioId, int usuarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Eliminando anuncio {AnuncioId} para usuario: {UsuarioId}", anuncioId, usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.DeleteAsync($"api/anuncios/{anuncioId}?usuarioId={usuarioId}");

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<object>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true)
                    {
                        return (true, "Anuncio eliminado exitosamente");
                    }
                    
                    return (false, result?.Message ?? "Error al eliminar anuncio");
                }

                return (false, $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando anuncio {AnuncioId} para usuario: {UsuarioId}", anuncioId, usuarioId);
                return (false, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Cambiar estado activo de un anuncio
        /// </summary>
        public async Task<(bool success, AnuncioDTO anuncio, bool EsActivo, string mensaje)> CambiarEstadoAsync(int anuncioId, bool esActivo, int usuarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Cambiando estado de anuncio {AnuncioId} a {EsActivo} para usuario: {UsuarioId}", anuncioId, esActivo, usuarioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var requestData = new { EsActivo = esActivo, UsuarioId = usuarioId };
                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"api/anuncios/{anuncioId}/estado", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiResponse<AnuncioDTO>>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Success == true && result.Data != null)
                    {
                        return (true, result.Data, result.Data.EsActivo, esActivo ? "Anuncio activado" : "Anuncio desactivado");
                    }
                    
                    return (false, new AnuncioDTO(), false, result?.Message ?? "Error al cambiar estado");
                }

                return (false, new AnuncioDTO(), false, $"Error en la respuesta: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cambiando estado de anuncio {AnuncioId} para usuario: {UsuarioId}", anuncioId, usuarioId);
                return (false, new AnuncioDTO(), false, "Error interno del servidor");
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
