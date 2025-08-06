
using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Nodes;
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestionar operaciones relacionadas con usuarios
    /// Incluye: crear, editar, activar/desactivar usuarios y gestión de roles
    /// </summary>
    public class UsuariosService : IUsuariosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UsuariosService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly ApiConfigurationService _apiConfig;

        /// <summary>
        /// Constructor que configura el servicio con todas las dependencias necesarias
        /// </summary>
        /// <param name="httpClientFactory">Factory para crear clientes HTTP</param>
        /// <param name="logger">Logger para registrar eventos</param>
        /// <param name="apiConfig">Servicio centralizado de configuración de API</param>
        public UsuariosService(IHttpClientFactory httpClientFactory, ILogger<UsuariosService> logger, ApiConfigurationService apiConfig)
        {
            // Crear cliente HTTP usando el factory configurado
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _apiConfig = apiConfig;

            // Configurar opciones de serialización JSON
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true, // Ignorar mayúsculas/minúsculas en propiedades
                WriteIndented = true // Formato legible para debugging
            };

            // Log de diagnóstico para verificar la configuración
            _logger.LogInformation("UsuariosService inicializado. URL base API: {BaseUrl}", _apiConfig.BaseUrl);
        }

        /// <summary>
        /// Obtiene la lista completa de usuarios desde la API
        /// </summary>
        /// <returns>Lista de usuarios o lista vacía si hay error</returns>
        public async Task<List<UsuarioDTO>> ObtenerTodosAsync()
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo todos los usuarios desde la API");

                // Construir URL usando el servicio centralizado
                var url = _apiConfig.GetApiUrl("Usuarios/usuarios");
                _logger.LogInformation("📡 URL construida: {Url}", url);

                // Realizar petición GET a la API
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                // Leer y deserializar la respuesta
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("✅ Respuesta recibida: {Length} caracteres", content.Length);

                var usuarios = JsonSerializer.Deserialize<List<UsuarioDTO>>(content, _jsonOptions);
                return usuarios ?? new List<UsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener usuarios desde la API");
                throw;
            }
        }

        /// <summary>
        /// Crea un nuevo usuario en el sistema
        /// Envía email de activación automáticamente
        /// </summary>
        /// <param name="usuario">Datos del usuario a crear</param>
        /// <returns>Resultado de la operación con mensaje de éxito o error</returns>
        public async Task<UsuarioCreationResult> CrearUsuarioAsync(CreateUsuarioDTO usuario)
        {
            try
            {
                _logger.LogInformation("👤 Creando usuario: {Email}", usuario.Email);

                // Mapear DTO para el request específico de la API
                var requestDto = new RegistroUsuarioRequestDTO
                {
                    NombreUsuario = usuario.NombreUsuario,
                    Email = usuario.Email,
                    RolId = usuario.RolId
                };

                // Serializar datos para envío
                var json = JsonSerializer.Serialize(requestDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Construir URL y enviar petición POST
                var url = _apiConfig.GetApiUrl("usuarios/registrar-usuario");
                var response = await _httpClient.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Usuario creado exitosamente: {Email}", usuario.Email);
                    return new UsuarioCreationResult
                    {
                        Success = true,
                        Message = "Usuario creado exitosamente. Se ha enviado un correo de activación."
                    };
                }

                // Manejar errores específicos de la API
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("⚠️ Error al crear usuario. Status: {Status}, Respuesta: {Response}", 
                    response.StatusCode, errorContent);

                try
                {
                    // Intentar parsear respuesta de error estructurada
                    var errorResponse = JsonSerializer.Deserialize<JsonElement>(errorContent);

                    return new UsuarioCreationResult
                    {
                        Success = false,
                        Message = errorResponse.TryGetProperty("Message", out var msg)
                            ? msg.GetString() ?? "Error al crear usuario"
                            : "Error al crear usuario",
                        ErrorType = errorResponse.TryGetProperty("ErrorType", out var errorType)
                            ? errorType.GetString()
                            : null,
                        Field = errorResponse.TryGetProperty("Field", out var field)
                            ? field.GetString()
                            : null
                    };
                }
                catch
                {
                    // Fallback si la respuesta no es JSON válido
                    return new UsuarioCreationResult
                    {
                        Success = false,
                        Message = "Error al crear usuario. Por favor, intente nuevamente."
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico al crear usuario {Email}", usuario.Email);
                return new UsuarioCreationResult
                {
                    Success = false,
                    Message = "Error de conexión al crear el usuario. Por favor, intente nuevamente."
                };
            }
        }

        /// <summary>
        /// Obtiene los roles asignados a un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Lista de roles del usuario</returns>
        public async Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo roles para usuario {Id}", usuarioId);

                // Construir URL específica para roles del usuario
                var url = _apiConfig.GetApiUrl($"Usuarios/usuarios/{usuarioId}/roles");
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    // Leer respuesta para debugging
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📡 Respuesta API roles: {JsonContent}", jsonContent);

                    // Deserializar y extraer roles
                    var resultado = await response.Content.ReadFromJsonAsync<RolesResponseDTO>();
                    return resultado?.Roles ?? new List<RolUsuarioDTO>();
                }

                _logger.LogWarning("⚠️ Error al obtener roles: {StatusCode}", response.StatusCode);
                return new List<RolUsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener roles del usuario {Id}", usuarioId);
                return new List<RolUsuarioDTO>();
            }
        }

        /// <summary>
        /// Asigna una lista de roles a un usuario específico
        /// Reemplaza los roles existentes por los nuevos
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <param name="rolesIds">Lista de IDs de roles a asignar</param>
        /// <returns>True si la operación fue exitosa</returns>
        public async Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds)
        {
            try
            {
                _logger.LogInformation("🔧 Asignando roles al usuario {Id}. Roles: {@RolesIds}", usuarioId, rolesIds);

                // Construir URL y enviar datos
                var url = _apiConfig.GetApiUrl($"Usuarios/usuarios/{usuarioId}/roles");
                var response = await _httpClient.PostAsJsonAsync(url, rolesIds);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📡 Respuesta asignación roles: {Response}", responseContent);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al asignar roles al usuario {Id}", usuarioId);
                return false;
            }
        }

        /// <summary>
        /// Activa un usuario deshabilitado
        /// Permite al usuario acceder al sistema nuevamente
        /// </summary>
        /// <param name="id">ID del usuario a activar</param>
        /// <returns>True si la activación fue exitosa</returns>
        public async Task<bool> ActivarUsuarioAsync(int id)
        {
            try
            {
                _logger.LogInformation("✅ Activando usuario {Id}", id);

                // Construir URL y enviar petición POST vacía (solo acción)
                var url = _apiConfig.GetApiUrl($"Usuarios/usuarios/{id}/activar");
                var response = await _httpClient.PostAsync(url, null);
                var contenido = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta activación: Status: {Status}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al activar usuario {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Desactiva un usuario activo
        /// El usuario no podrá acceder al sistema hasta ser reactivado
        /// </summary>
        /// <param name="id">ID del usuario a desactivar</param>
        /// <returns>True si la desactivación fue exitosa</returns>
        public async Task<bool> DesactivarUsuarioAsync(int id)
        {
            try
            {
                _logger.LogInformation("❌ Desactivando usuario {Id}", id);

                // Construir URL y enviar petición POST vacía (solo acción)
                var url = _apiConfig.GetApiUrl($"Usuarios/usuarios/{id}/desactivar");
                var response = await _httpClient.PostAsync(url, null);
                var contenido = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta desactivación: Status: {Status}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al desactivar usuario {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Obtiene los datos de un usuario específico por su ID
        /// </summary>
        /// <param name="id">ID del usuario</param>
        /// <returns>Datos del usuario o null si no se encuentra</returns>
        public async Task<UsuarioDTO?> ObtenerUsuarioPorIdAsync(int id)
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo usuario por ID: {Id}", id);

                // Construir URL específica del usuario
                var url = _apiConfig.GetApiUrl($"Usuarios/usuarios/{id}");
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("✅ Usuario obtenido correctamente para ID: {Id}", id);

                    var usuario = JsonSerializer.Deserialize<UsuarioDTO>(content, _jsonOptions);
                    return usuario;
                }

                _logger.LogWarning("⚠️ Usuario no encontrado para ID: {Id}. Status: {Status}", id, response.StatusCode);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener usuario por ID: {Id}", id);
                return null;
            }
        }

        /// <summary>
        /// Edita los datos básicos de un usuario existente
        /// </summary>
        /// <param name="id">ID del usuario a editar</param>
        /// <param name="modelo">Nuevos datos del usuario</param>
        /// <returns>True si la edición fue exitosa</returns>
        public async Task<bool> EditarUsuarioAsync(int id, CreateUsuarioDTO modelo)
        {
            try
            {
                _logger.LogInformation("📝 Editando usuario {Id} con email: {Email}", id, modelo.Email);

                // Construir URL y enviar datos actualizados
                var url = _apiConfig.GetApiUrl($"usuarios/usuarios/{id}");
                var response = await _httpClient.PutAsJsonAsync(url, modelo);

                var contenido = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📡 Respuesta edición: Status: {Status}, Contenido: {Contenido}",
                    response.StatusCode, contenido);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al editar usuario {Id}", id);
                return false;
            }
        }

        /// <summary>
        /// Actualiza información específica de un usuario (nombre, estado activo, top vendedor)
        /// Método más específico que EditarUsuario para campos particulares
        /// </summary>
        /// <param name="usuario">DTO con los campos específicos a actualizar</param>
        /// <returns>Resultado detallado de la operación</returns>
        public async Task<UsuarioCreationResult> ActualizarUsuarioAsync(ActualizarUsuarioDTO usuario)
        {
            try
            {
                _logger.LogInformation("🔄 Actualizando usuario {Id}", usuario.UsuarioId);

                // Mapear a estructura específica requerida por la API
                var editarRequest = new
                {
                    NombreUsuario = usuario.NombreUsuario,
                    Activo = usuario.Activo,
                    EsTopVendedor = usuario.EsTopVendedor
                };

                // Preparar contenido JSON para envío
                var json = JsonSerializer.Serialize(editarRequest, _jsonOptions);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Construir URL y enviar petición PUT
                var url = _apiConfig.GetApiUrl($"usuarios/usuarios/{usuario.UsuarioId}");
                var response = await _httpClient.PutAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Usuario actualizado exitosamente: {Id}", usuario.UsuarioId);
                    return new UsuarioCreationResult
                    {
                        Success = true,
                        Message = "Usuario actualizado exitosamente"
                    };
                }

                // Manejar errores detallados de la API
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("⚠️ Error al actualizar usuario {Id}. Respuesta: {Response}", 
                    usuario.UsuarioId, errorContent);

                try
                {
                    // Parsear respuesta de error estructurada
                    var errorResponse = JsonSerializer.Deserialize<JsonElement>(errorContent);

                    return new UsuarioCreationResult
                    {
                        Success = false,
                        Message = errorResponse.TryGetProperty("Message", out var msg)
                            ? msg.GetString() ?? "Error al actualizar usuario"
                            : "Error al actualizar usuario",
                        ErrorType = errorResponse.TryGetProperty("ErrorType", out var errorType)
                            ? errorType.GetString()
                            : null,
                        Field = errorResponse.TryGetProperty("Field", out var field)
                            ? field.GetString()
                            : null
                    };
                }
                catch
                {
                    // Fallback para errores no estructurados
                    return new UsuarioCreationResult
                    {
                        Success = false,
                        Message = "Error al actualizar usuario. Por favor, intente nuevamente."
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico al actualizar usuario {Id}", usuario.UsuarioId);
                return new UsuarioCreationResult
                {
                    Success = false,
                    Message = "Error de conexión al actualizar el usuario. Por favor, intente nuevamente."
                };
            }
        }
    }
}
