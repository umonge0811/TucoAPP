
using System.Text.Json;
using System.Text;
using Tuco.Clases.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication;
using System.Net.Http.Headers;

namespace GestionLlantera.Web.Services
{
    public class AnunciosService : IAnunciosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AnunciosService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly JsonSerializerOptions _jsonOptions;

        public AnunciosService(
            HttpClient httpClient, 
            ILogger<AnunciosService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
        }

        public async Task<(bool success, List<AnuncioDTO> anuncios, string message)> ObtenerAnunciosAsync(string? token = null)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncios desde la API");

                // Configurar autenticación
                await ConfigurarAutenticacionAsync(token);

                var response = await _httpClient.GetAsync("api/anuncios");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse, _jsonOptions);
                    
                    if (apiResponse.TryGetProperty("anuncios", out var anunciosElement))
                    {
                        var anuncios = JsonSerializer.Deserialize<List<AnuncioDTO>>(anunciosElement.GetRawText(), _jsonOptions);
                        _logger.LogInformation("✅ Se obtuvieron {Count} anuncios", anuncios?.Count ?? 0);
                        return (true, anuncios ?? new List<AnuncioDTO>(), "Anuncios obtenidos exitosamente");
                    }
                }

                _logger.LogWarning("⚠️ No se pudieron obtener los anuncios. Status: {StatusCode}", response.StatusCode);
                return (false, new List<AnuncioDTO>(), $"Error al obtener anuncios: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener anuncios");
                return (false, new List<AnuncioDTO>(), "Error interno al obtener anuncios");
            }
        }

        public async Task<(bool success, AnuncioDTO? anuncio, string message)> ObtenerAnuncioPorIdAsync(int anuncioId, string? token = null)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncio {AnuncioId} desde la API", anuncioId);

                // Configurar autenticación
                await ConfigurarAutenticacionAsync(token);

                var response = await _httpClient.GetAsync($"api/anuncios/{anuncioId}");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse, _jsonOptions);
                    
                    if (apiResponse.TryGetProperty("anuncio", out var anuncioElement))
                    {
                        var anuncio = JsonSerializer.Deserialize<AnuncioDTO>(anuncioElement.GetRawText(), _jsonOptions);
                        _logger.LogInformation("✅ Anuncio obtenido: {Titulo}", anuncio?.Titulo);
                        return (true, anuncio, "Anuncio obtenido exitosamente");
                    }
                }

                _logger.LogWarning("⚠️ No se pudo obtener el anuncio {AnuncioId}. Status: {StatusCode}", anuncioId, response.StatusCode);
                return (false, null, $"Error al obtener anuncio: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener anuncio {AnuncioId}", anuncioId);
                return (false, null, "Error interno al obtener anuncio");
            }
        }

        public async Task<(bool success, AnuncioDTO? anuncio, string message)> CrearAnuncioAsync(CrearAnuncioDTO anuncioDto, string? token = null)
        {
            try
            {
                _logger.LogInformation("🔔 Creando anuncio: {Titulo}", anuncioDto.Titulo);

                // Configurar autenticación
                await ConfigurarAutenticacionAsync(token);

                var json = JsonSerializer.Serialize(anuncioDto, _jsonOptions);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/anuncios", content);

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse, _jsonOptions);
                    
                    if (apiResponse.TryGetProperty("anuncio", out var anuncioElement))
                    {
                        var anuncio = JsonSerializer.Deserialize<AnuncioDTO>(anuncioElement.GetRawText(), _jsonOptions);
                        _logger.LogInformation("✅ Anuncio creado exitosamente: {Titulo}", anuncio?.Titulo);
                        return (true, anuncio, "Anuncio creado exitosamente");
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al crear anuncio. Status: {StatusCode}, Content: {Content}", response.StatusCode, errorContent);
                    return (false, null, $"Error al crear anuncio: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al crear anuncio");
                return (false, null, "Error interno al crear anuncio");
            }

            return (false, null, "Error desconocido al crear anuncio");
        }

        public async Task<(bool success, string message)> ActualizarAnuncioAsync(int anuncioId, ActualizarAnuncioDTO anuncioDto, string? token = null)
        {
            try
            {
                _logger.LogInformation("🔔 Actualizando anuncio {AnuncioId}: {Titulo}", anuncioId, anuncioDto.Titulo);

                // Configurar autenticación
                await ConfigurarAutenticacionAsync(token);

                var json = JsonSerializer.Serialize(anuncioDto, _jsonOptions);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/anuncios/{anuncioId}", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Anuncio actualizado exitosamente: {AnuncioId}", anuncioId);
                    return (true, "Anuncio actualizado exitosamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al actualizar anuncio {AnuncioId}. Status: {StatusCode}, Content: {Content}", anuncioId, response.StatusCode, errorContent);
                    return (false, $"Error al actualizar anuncio: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al actualizar anuncio {AnuncioId}", anuncioId);
                return (false, "Error interno al actualizar anuncio");
            }
        }

        public async Task<(bool success, string message)> EliminarAnuncioAsync(int anuncioId, string? token = null)
        {
            try
            {
                _logger.LogInformation("🔔 Eliminando anuncio {AnuncioId}", anuncioId);

                // Configurar autenticación
                await ConfigurarAutenticacionAsync(token);

                var response = await _httpClient.DeleteAsync($"api/anuncios/{anuncioId}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Anuncio eliminado exitosamente: {AnuncioId}", anuncioId);
                    return (true, "Anuncio eliminado exitosamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al eliminar anuncio {AnuncioId}. Status: {StatusCode}, Content: {Content}", anuncioId, response.StatusCode, errorContent);
                    return (false, $"Error al eliminar anuncio: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al eliminar anuncio {AnuncioId}", anuncioId);
                return (false, "Error interno al eliminar anuncio");
            }
        }

        public async Task<(bool success, string message)> CambiarEstadoAnuncioAsync(int anuncioId, bool activo, string? token = null)
        {
            try
            {
                _logger.LogInformation("🔔 Cambiando estado de anuncio {AnuncioId} a {Estado}", anuncioId, activo ? "ACTIVO" : "INACTIVO");

                // Configurar autenticación
                await ConfigurarAutenticacionAsync(token);

                var json = JsonSerializer.Serialize(activo, _jsonOptions);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"api/anuncios/{anuncioId}/estado", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Estado del anuncio cambiado exitosamente a: {Estado}", activo ? "ACTIVO" : "INACTIVO");
                    return (true, $"Anuncio {(activo ? "activado" : "desactivado")} exitosamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al cambiar estado del anuncio {AnuncioId}. Status: {StatusCode}, Content: {Content}", anuncioId, response.StatusCode, errorContent);
                    return (false, $"Error al cambiar estado del anuncio: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al cambiar estado del anuncio {AnuncioId}", anuncioId);
                return (false, "Error interno al cambiar estado del anuncio");
            }
        }

        /// <summary>
        /// Configura la autenticación para las peticiones HTTP
        /// </summary>
        private async Task ConfigurarAutenticacionAsync(string? token = null)
        {
            try
            {
                // Si se proporciona un token directamente, usarlo
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    _logger.LogDebug("🔐 Token de autenticación configurado directamente para AnunciosService");
                    return;
                }

                // Si no, intentar obtenerlo del contexto HTTP
                var context = _httpContextAccessor.HttpContext;
                if (context != null)
                {
                    var contextToken = await context.GetTokenAsync("access_token");
                    if (!string.IsNullOrEmpty(contextToken))
                    {
                        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", contextToken);
                        _logger.LogDebug("🔐 Token de autenticación configurado desde contexto para AnunciosService");
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ No se encontró token de acceso en el contexto HTTP");
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ HttpContext es null en AnunciosService");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error configurando autenticación en AnunciosService");
            }
        }
    }
}
