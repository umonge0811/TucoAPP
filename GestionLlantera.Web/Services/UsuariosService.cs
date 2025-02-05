using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Services
{
    public class UsuariosService : IUsuariosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UsuariosService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly IConfiguration _configuration;
        private readonly string _apiUrl;

        public UsuariosService(HttpClient httpClient, ILogger<UsuariosService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            _configuration = configuration;
            _apiUrl = _configuration["ApiSettings:BaseUrl"]; // Obtiene la URL de la configuración
        }
        

        public async Task<List<UsuarioDTO>> ObtenerTodosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("api/Usuarios/usuarios");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var usuarios = JsonSerializer.Deserialize<List<UsuarioDTO>>(content, _jsonOptions);

                return usuarios ?? new List<UsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                throw;
            }
        }



        public async Task<bool> CrearUsuarioAsync(CreateUsuarioDTO modelo)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/usuarios/registrar-usuario", modelo);

                // Log de la respuesta para diagnóstico
                var contenido = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de la API: {Contenido}", contenido);

                // Verificar si la petición fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                _logger.LogWarning("Error al crear usuario. Código: {StatusCode}, Respuesta: {Respuesta}",
                    response.StatusCode, contenido);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario con email: {Email}", modelo.Email);
                return false;
            }
        }

        public async Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/Usuarios/usuarios/{usuarioId}/roles");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var roles = JsonSerializer.Deserialize<List<RolUsuarioDTO>>(content, _jsonOptions);

                return roles ?? new List<RolUsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles del usuario");
                throw;
            }
        }

        public async Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    $"api/Usuarios/usuarios/{usuarioId}/roles",
                    rolesIds);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en llamada a API");
                return false;
            }
        }

        public async Task<bool> ActivarUsuarioAsync(int id)
        {
            try
            {
                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{id}/activar", null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuario");
                throw;
            }
        }

        public async Task<bool> DesactivarUsuarioAsync(int id)
        {
            try
            {
                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{id}/desactivar", null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar usuario");
                throw;
            }
        }

        
    }
}