
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;
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
                _logger.LogInformation("Obteniendo anuncios desde la API");

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync("api/Anuncios");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error al obtener anuncios: {StatusCode}", response.StatusCode);
                    return (false, new List<AnuncioDTO>(), "Error al obtener anuncios desde la API");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de anuncios recibida: {Content}", jsonContent);

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var resultado = JsonSerializer.Deserialize<AnunciosApiResponse>(jsonContent, options);

                if (resultado?.Success == true && resultado.Anuncios != null)
                {
                    _logger.LogInformation("✅ {Count} anuncios obtenidos correctamente", resultado.Anuncios.Count);
                    return (true, resultado.Anuncios, "Anuncios obtenidos correctamente");
                }

                return (false, new List<AnuncioDTO>(), "No se pudieron obtener los anuncios");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener anuncios");
                return (false, new List<AnuncioDTO>(), "Error interno al obtener anuncios");
            }
        }

        /// <summary>
        /// Obtener un anuncio por ID
        /// </summary>
        public async Task<(bool success, AnuncioDTO anuncio, string mensaje)> ObtenerAnuncioPorIdAsync(int anuncioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Obteniendo anuncio {AnuncioId} desde la API", anuncioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync($"api/Anuncios/{anuncioId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error al obtener anuncio {AnuncioId}: {StatusCode}", anuncioId, response.StatusCode);
                    return (false, null, "Error al obtener el anuncio");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultado = JsonSerializer.Deserialize<AnuncioApiResponse>(jsonContent, options);

                if (resultado?.Success == true && resultado.Anuncio != null)
                {
                    return (true, resultado.Anuncio, "Anuncio obtenido correctamente");
                }

                return (false, null, "No se pudo obtener el anuncio");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener anuncio {AnuncioId}", anuncioId);
                return (false, null, "Error interno al obtener el anuncio");
            }
        }

        /// <summary>
        /// Crear nuevo anuncio
        /// </summary>
        public async Task<(bool success, AnuncioDTO anuncio, string mensaje)> CrearAnuncioAsync(object anuncioDto, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Creando nuevo anuncio");

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonSerializer.Serialize(anuncioDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Anuncios", content);

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultado = JsonSerializer.Deserialize<AnuncioApiResponse>(jsonResponse, options);

                if (resultado?.Success == true)
                {
                    _logger.LogInformation("✅ Anuncio creado correctamente");
                    return (true, resultado.Anuncio, "Anuncio creado correctamente");
                }

                return (false, null, resultado?.Message ?? "Error al crear el anuncio");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear anuncio");
                return (false, null, "Error interno al crear el anuncio");
            }
        }

        /// <summary>
        /// Actualizar anuncio existente
        /// </summary>
        public async Task<(bool success, string mensaje)> ActualizarAnuncioAsync(int anuncioId, object anuncioDto, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Actualizando anuncio {AnuncioId}", anuncioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonSerializer.Serialize(anuncioDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/Anuncios/{anuncioId}", content);

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultado = JsonSerializer.Deserialize<ApiResponse>(jsonResponse, options);

                if (resultado?.Success == true)
                {
                    _logger.LogInformation("✅ Anuncio {AnuncioId} actualizado correctamente", anuncioId);
                    return (true, "Anuncio actualizado correctamente");
                }

                return (false, resultado?.Message ?? "Error al actualizar el anuncio");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar anuncio {AnuncioId}", anuncioId);
                return (false, "Error interno al actualizar el anuncio");
            }
        }

        /// <summary>
        /// Eliminar (desactivar) anuncio
        /// </summary>
        public async Task<(bool success, string mensaje)> EliminarAnuncioAsync(int anuncioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("Eliminando anuncio {AnuncioId}", anuncioId);

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.DeleteAsync($"api/Anuncios/{anuncioId}");

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultado = JsonSerializer.Deserialize<ApiResponse>(jsonResponse, options);

                if (resultado?.Success == true)
                {
                    _logger.LogInformation("✅ Anuncio {AnuncioId} eliminado correctamente", anuncioId);
                    return (true, "Anuncio eliminado correctamente");
                }

                return (false, resultado?.Message ?? "Error al eliminar el anuncio");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar anuncio {AnuncioId}", anuncioId);
                return (false, "Error interno al eliminar el anuncio");
            }
        }

        // Clases para deserializar las respuestas de la API
        private class AnunciosApiResponse
        {
            public bool Success { get; set; }
            public List<AnuncioDTO> Anuncios { get; set; } = new();
            public string Message { get; set; } = string.Empty;
        }

        private class AnuncioApiResponse
        {
            public bool Success { get; set; }
            public AnuncioDTO Anuncio { get; set; }
            public string Message { get; set; } = string.Empty;
        }

        private class ApiResponse
        {
            public bool Success { get; set; }
            public string Message { get; set; } = string.Empty;
        }
    }
}
