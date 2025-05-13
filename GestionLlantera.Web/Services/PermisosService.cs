using GestionLlantera.Web.Services.Interfaces;
using System.Net.Http;
using System.Text.Json;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    public class PermisosService : IPermisosService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PermisosService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        public PermisosService(HttpClient httpClient, IConfiguration configuration, ILogger<PermisosService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
        }
        public async Task<List<PermisoDTO>> ObtenerTodosLosPermisos()
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/obtener-todos";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);
                return permisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los permisos");
                throw;
            }
        }

        public async Task<PermisoDTO> ObtenerPermisoPorId(int permisoId)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/obtener-por-id/{permisoId}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var permiso = JsonSerializer.Deserialize<PermisoDTO>(content, _jsonOptions);

                return permiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permiso por ID: {PermisoId}", permisoId);
                throw;
            }
        }

        public async Task<bool> CrearPermiso(PermisoDTO permiso)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/crear-permiso";
                var response = await _httpClient.PostAsJsonAsync(url, permiso);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear permiso");
                throw;
            }
        }

        public async Task<bool> ActualizarPermiso(int permisoId, PermisoDTO permiso)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/actualizar/{permisoId}";
                var response = await _httpClient.PutAsJsonAsync(url, permiso);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar permiso");
                throw;
            }
        }

        public async Task<bool> EliminarPermiso(int permisoId)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/eliminar/{permisoId}";
                var response = await _httpClient.DeleteAsync(url);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar permiso");
                throw;
            }
        }
    }
       
    
}
