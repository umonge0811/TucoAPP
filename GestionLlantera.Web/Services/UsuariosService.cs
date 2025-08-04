using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Nodes;
using Tuco.Clases.DTOs;

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

        public async Task<UsuarioCreationResult> CrearUsuarioAsync(CreateUsuarioDTO usuario)
        {
            try
            {
                var requestDto = new RegistroUsuarioRequestDTO
                {
                    NombreUsuario = usuario.NombreUsuario,
                    Email = usuario.Email,
                    RolId = usuario.RolId,
                    EsTopVendedor = usuario.EsTopVendedor
                };

                var json = JsonSerializer.Serialize(requestDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("/api/usuarios/registrar-usuario", content);

                if (response.IsSuccessStatusCode)
                {
                    return new UsuarioCreationResult
                    {
                        Success = true,
                        Message = "Usuario creado exitosamente. Se ha enviado un correo de activación."
                    };
                }

                // Leer el contenido del error para obtener detalles específicos
                var errorContent = await response.Content.ReadAsStringAsync();

                try
                {
                    // Intentar deserializar a la estructura esperada de error de la API
                    var apiErrorResponse = JsonSerializer.Deserialize<ApiErrorResponse>(errorContent, _jsonOptions);

                    if (apiErrorResponse != null)
                    {
                        return new UsuarioCreationResult
                        {
                            Success = false,
                            Message = apiErrorResponse.Message ?? "Error al crear usuario",
                            Field = apiErrorResponse.Field,
                            ErrorType = apiErrorResponse.ErrorType
                        };
                    }
                    else
                    {
                        // Si no se puede deserializar a ApiErrorResponse, intentar con JsonElement genérico
                        var errorObj = JsonSerializer.Deserialize<JsonElement>(errorContent);

                        return new UsuarioCreationResult
                        {
                            Success = false,
                            Message = errorObj.TryGetProperty("message", out var msgProp) ? msgProp.GetString() : "Error al crear usuario",
                            Field = errorObj.TryGetProperty("field", out var fieldProp) ? fieldProp.GetString() : null,
                            ErrorType = errorObj.TryGetProperty("errorType", out var errorTypeProp) ? errorTypeProp.GetString() : null
                        };
                    }
                }
                catch (JsonException)
                {
                    // Si no se puede parsear la respuesta, devolver mensaje genérico
                    return new UsuarioCreationResult
                    {
                        Success = false,
                        Message = "Error al crear usuario. Por favor, intente nuevamente."
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                return new UsuarioCreationResult
                {
                    Success = false,
                    Message = "Error de conexión al crear el usuario. Por favor, intente nuevamente."
                };
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

        public async Task<bool> EditarUsuarioAsync(int id, CreateUsuarioDTO modelo)
        {
            try
            {
                _logger.LogInformation("Editando usuario {Id} con email: {Email}", id, modelo.Email);

                var response = await _httpClient.PutAsJsonAsync($"api/usuarios/usuarios/{id}", modelo);

                var contenido = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta al editar usuario: Status: {Status}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al editar usuario {Id}", id);
                return false;
            }
        }
    }
}

// Definición de la clase ApiErrorResponse para deserializar errores de la API
// Asegúrate de que esta clase esté en el mismo namespace o en uno accesible, por ejemplo, en GestionLlantera.Web.Models.DTOs
namespace GestionLlantera.Web.Models.DTOs
{
    public class ApiErrorResponse
    {
        public string Message { get; set; }
        public string Field { get; set; }
        public string ErrorType { get; set; }
    }

    // Clase UsuarioCreationResult (ya existente en tu código, pero la incluyo para completitud del ejemplo)
    public class UsuarioCreationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Field { get; set; }
        public string ErrorType { get; set; }
    }

    // Definiciones de DTOs y otros tipos necesarios
    public class CreateUsuarioDTO {
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public int RolId { get; set; }
        public bool EsTopVendedor { get; set; }
    }

    public class UsuarioDTO {
        public int Id { get; set; }
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public string NombreRol { get; set; }
        public bool EsTopVendedor { get; set; }
    }

    public class RolUsuarioDTO {
        public int Id { get; set; }
        public string Nombre { get; set; }
    }

    public class RolesResponseDTO {
        public List<RolUsuarioDTO> Roles { get; set; }
    }

    public class RegistroUsuarioRequestDTO
    {
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public int RolId { get; set; }
        public bool EsTopVendedor { get; set; }
    }
}