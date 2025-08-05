
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;
using System.Text;
using System.Text.Json;

namespace GestionLlantera.Web.Services
{
    public class AnunciosService : IAnunciosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AnunciosService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public AnunciosService(HttpClient httpClient, ILogger<AnunciosService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
        }

        public async Task<(bool success, List<AnuncioDTO> anuncios, string message)> ObtenerAnunciosAsync()
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncios desde la API...");

                var response = await _httpClient.GetAsync("api/anuncios");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<dynamic>(jsonResponse, _jsonOptions);
                    
                    var anunciosJson = JsonSerializer.Serialize(((JsonElement)apiResponse).GetProperty("anuncios"));
                    var anuncios = JsonSerializer.Deserialize<List<AnuncioDTO>>(anunciosJson, _jsonOptions) ?? new List<AnuncioDTO>();

                    _logger.LogInformation("✅ Anuncios obtenidos exitosamente. Total: {Count}", anuncios.Count);
                    return (true, anuncios, "Anuncios obtenidos exitosamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener anuncios. Status: {StatusCode}, Content: {Content}", response.StatusCode, errorContent);
                    return (false, new List<AnuncioDTO>(), $"Error al obtener anuncios: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener anuncios");
                return (false, new List<AnuncioDTO>(), "Error interno al obtener anuncios");
            }
        }

        public async Task<(bool success, AnuncioDTO anuncio, string message)> ObtenerAnuncioPorIdAsync(int anuncioId)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncio {AnuncioId} desde la API...", anuncioId);

                var response = await _httpClient.GetAsync($"api/anuncios/{anuncioId}");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<dynamic>(jsonResponse, _jsonOptions);
                    
                    var anuncioJson = JsonSerializer.Serialize(((JsonElement)apiResponse).GetProperty("anuncio"));
                    var anuncio = JsonSerializer.Deserialize<AnuncioDTO>(anuncioJson, _jsonOptions);

                    _logger.LogInformation("✅ Anuncio obtenido exitosamente: {Titulo}", anuncio?.Titulo);
                    return (true, anuncio!, "Anuncio obtenido exitosamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al obtener anuncio {AnuncioId}. Status: {StatusCode}, Content: {Content}", anuncioId, response.StatusCode, errorContent);
                    return (false, null!, $"Error al obtener anuncio: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener anuncio {AnuncioId}", anuncioId);
                return (false, null!, "Error interno al obtener anuncio");
            }
        }

        public async Task<(bool success, AnuncioDTO anuncio, string message)> CrearAnuncioAsync(CrearAnuncioDTO anuncioDto)
        {
            try
            {
                _logger.LogInformation("🔔 Creando nuevo anuncio: {Titulo}", anuncioDto.Titulo);

                var json = JsonSerializer.Serialize(anuncioDto, _jsonOptions);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/anuncios", content);

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<dynamic>(jsonResponse, _jsonOptions);
                    
                    var anuncioJson = JsonSerializer.Serialize(((JsonElement)apiResponse).GetProperty("anuncio"));
                    var anuncio = JsonSerializer.Deserialize<AnuncioDTO>(anuncioJson, _jsonOptions);

                    _logger.LogInformation("✅ Anuncio creado exitosamente: {Titulo}", anuncio?.Titulo);
                    return (true, anuncio!, "Anuncio creado exitosamente");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error al crear anuncio. Status: {StatusCode}, Content: {Content}", response.StatusCode, errorContent);
                    return (false, null!, $"Error al crear anuncio: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al crear anuncio");
                return (false, null!, "Error interno al crear anuncio");
            }
        }

        public async Task<(bool success, string message)> ActualizarAnuncioAsync(int anuncioId, ActualizarAnuncioDTO anuncioDto)
        {
            try
            {
                _logger.LogInformation("🔔 Actualizando anuncio {AnuncioId}: {Titulo}", anuncioId, anuncioDto.Titulo);

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

        public async Task<(bool success, string message)> EliminarAnuncioAsync(int anuncioId)
        {
            try
            {
                _logger.LogInformation("🔔 Eliminando anuncio {AnuncioId}", anuncioId);

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

        public async Task<(bool success, string message)> CambiarEstadoAnuncioAsync(int anuncioId, bool activo)
        {
            try
            {
                _logger.LogInformation("🔔 Cambiando estado del anuncio {AnuncioId} a {Estado}", anuncioId, activo ? "ACTIVO" : "INACTIVO");

                var json = JsonSerializer.Serialize(activo, _jsonOptions);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PatchAsync($"api/anuncios/{anuncioId}/estado", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Estado del anuncio cambiado exitosamente: {AnuncioId}", anuncioId);
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
    }
}
