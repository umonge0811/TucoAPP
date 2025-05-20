using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Nodes;

namespace GestionLlantera.Web.Services
{
    public class UsuariosService : IUsuariosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UsuariosService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public UsuariosService(IHttpClientFactory httpClientFactory, ILogger<UsuariosService> logger, IConfiguration configuration)
        {
            // Usar el mismo nombre de cliente que usas en InventarioService
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                WriteIndented = true
            };

            // Registrar la URL base para diagnóstico
            _logger.LogInformation("URL base del cliente HTTP: {BaseUrl}", _httpClient.BaseAddress?.ToString() ?? "null");
        }

        public async Task<List<UsuarioDTO>> ObtenerTodosAsync()
        {
            try
            {
                _logger.LogInformation("Obteniendo todos los usuarios");
                var response = await _httpClient.GetAsync("api/Usuarios/usuarios");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta recibida para ObtenerTodosAsync: {Length} caracteres", content.Length);

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
                _logger.LogInformation("Creando usuario con email: {Email}", modelo.Email);

                var response = await _httpClient.PostAsJsonAsync("api/usuarios/registrar-usuario", modelo);

                // Log de la respuesta para diagnóstico
                var contenido = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de la API: Status: {StatusCode}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                // Verificar si la petición fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Usuario creado exitosamente");
                    return true;
                }

                _logger.LogWarning("Error al crear usuario. Código: {StatusCode}, Respuesta: {Respuesta}",
                    response.StatusCode, contenido);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario con email: {Email}", modelo.Email);

                // Loguear también la excepción interna si existe
                if (ex.InnerException != null)
                {
                    _logger.LogError("Excepción interna: {Message}", ex.InnerException.Message);
                }

                return false;
            }
        }

        public async Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("Obteniendo roles para el usuario {Id}", usuarioId);

                var response = await _httpClient.GetAsync($"api/Usuarios/usuarios/{usuarioId}/roles");

                if (response.IsSuccessStatusCode)
                {
                    // Leer el contenido primero para debugging
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("Respuesta API de roles: {JsonContent}", jsonContent);

                    var resultado = await response.Content.ReadFromJsonAsync<RolesResponseDTO>();
                    return resultado?.Roles ?? new List<RolUsuarioDTO>();
                }

                _logger.LogWarning("Error al obtener roles: {StatusCode}", response.StatusCode);
                return new List<RolUsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles del usuario {Id}", usuarioId);
                return new List<RolUsuarioDTO>();
            }
        }

        public async Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds)
        {
            try
            {
                _logger.LogInformation("Asignando roles al usuario {Id}. Roles: {@RolesIds}", usuarioId, rolesIds);

                var response = await _httpClient.PostAsJsonAsync(
                    $"api/Usuarios/usuarios/{usuarioId}/roles",
                    rolesIds);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de API al asignar roles: {Response}", responseContent);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al asignar roles al usuario {Id}", usuarioId);
                return false;
            }
        }

        public async Task<bool> ActivarUsuarioAsync(int id)
        {
            try
            {
                _logger.LogInformation("Activando usuario {Id}", id);

                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{id}/activar", null);
                var contenido = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Respuesta al activar usuario: Status: {Status}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuario {Id}", id);
                throw;
            }
        }

        public async Task<bool> DesactivarUsuarioAsync(int id)
        {
            try
            {
                _logger.LogInformation("Desactivando usuario {Id}", id);

                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{id}/desactivar", null);
                var contenido = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Respuesta al desactivar usuario: Status: {Status}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar usuario {Id}", id);
                throw;
            }
        }
    }
}