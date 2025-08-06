using GestionLlantera.Web.Services.Interfaces;
using System.Net.Http;
using System.Text.Json;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    // ✅ SERVICIO DE ROLES CENTRALIZADO
    // Esta clase implementa la interfaz IRolesService y gestiona todas las operaciones relacionadas con roles
    // Ahora utiliza ApiConfigurationService para centralizar las URLs de la API
    public class RolesService : IRolesService
    {
        // Variables privadas para manejar las dependencias inyectadas
        private readonly HttpClient _httpClient;                    // Cliente HTTP para hacer llamadas a la API
        private readonly ILogger<RolesService> _logger;             // Logger para registrar eventos y errores
        private readonly JsonSerializerOptions _jsonOptions;        // Opciones de serialización JSON
        private readonly ApiConfigurationService _apiConfig;        // ✅ NUEVO: Servicio de configuración centralizada

        // Constructor que recibe las dependencias necesarias mediante inyección de dependencias
        public RolesService(
            IHttpClientFactory httpClientFactory, 
            ILogger<RolesService> logger,
            ApiConfigurationService apiConfig)  // ✅ NUEVO: Inyectar servicio de configuración
        {
            // Inicializamos las dependencias inyectadas
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _apiConfig = apiConfig;  // ✅ NUEVO: Asignar servicio de configuración

            // Configuramos las opciones de serialización JSON
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,  // Permite que las propiedades JSON coincidan sin importar mayúsculas/minúsculas
                WriteIndented = true                 // Formatea el JSON de manera legible
            };
        }


        // ✅ MÉTODO CENTRALIZADO: Obtener todos los roles del sistema
        public async Task<List<RoleDTO>> ObtenerTodosLosRoles()
        {
            try
            {
                // Registramos el inicio de la operación
                _logger.LogInformation("Obteniendo todos los roles desde: {BaseUrl}", _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl("Roles/ObtenerTodosRoles");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos la petición GET a la API usando la URL centralizada
                var response = await _httpClient.GetAsync(url);

                // Verificamos que la respuesta sea exitosa (código 2xx)
                response.EnsureSuccessStatusCode();

                // Leemos el contenido de la respuesta como string
                var content = await response.Content.ReadAsStringAsync();

                // Deserializamos el JSON a una lista de RoleDTO
                var roles = JsonSerializer.Deserialize<List<RoleDTO>>(content, _jsonOptions);

                // Log para ver si los roles incluyen permisos
                foreach (var rol in roles ?? new List<RoleDTO>())
                {
                    _logger.LogInformation(
                        "Rol: {RolNombre}, Permisos: {PermisosCount}",
                        rol.NombreRol,
                        rol.Permisos?.Count ?? 0
                    );
                }

                // Retornamos la lista de roles o una lista vacía si es null
                return roles ?? new List<RoleDTO>();
            }
            catch (Exception ex)
            {
                // Registramos cualquier error que ocurra
                _logger.LogError(ex, "Error al obtener roles");
                // Relanzamos la excepción para que sea manejada en un nivel superior
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Obtener un rol específico por su ID
        public async Task<RoleDTO> ObtenerRolPorId(int rolId)
        {
            try
            {
                // Registramos la operación incluyendo el ID del rol
                _logger.LogInformation("Obteniendo rol con ID: {RolId} desde: {BaseUrl}", rolId, _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl($"Roles/obtener-rol-id/{rolId}");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos la petición GET a la API usando la URL centralizada
                var response = await _httpClient.GetAsync(url);

                // Verificamos que la respuesta sea exitosa
                response.EnsureSuccessStatusCode();

                // Leemos el contenido de la respuesta
                var content = await response.Content.ReadAsStringAsync();

                // Deserializamos el JSON a un objeto RoleDTO
                var rol = JsonSerializer.Deserialize<RoleDTO>(content, _jsonOptions);

                // Retornamos el rol o lanzamos una excepción si es null
                return rol ?? throw new Exception("No se encontró el rol");
            }
            catch (Exception ex)
            {
                // Registramos el error incluyendo el ID del rol en el mensaje
                _logger.LogError(ex, "Error al obtener rol {RolId}", rolId);
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Crear un nuevo rol en el sistema
        public async Task<bool> CrearRol(RoleDTO rol)
        {
            try
            {
                // Registramos el intento de creación del rol con su nombre
                _logger.LogInformation("Creando nuevo rol: {NombreRol} en: {BaseUrl}", rol.NombreRol, _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl("Roles/CrearRoles");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos una petición POST a la API usando la URL centralizada
                var response = await _httpClient.PostAsJsonAsync(url, rol);

                // Verificamos si la operación fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation("Rol creado exitosamente");
                    return true;
                }

                // Si no fue exitosa, leemos el mensaje de error
                var error = await response.Content.ReadAsStringAsync();
                // Registramos el error como una advertencia
                _logger.LogWarning("Error al crear rol: {Error}", error);
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(ex, "Error al crear rol");
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Actualizar un rol existente
        public async Task<bool> ActualizarRol(int rolId, RoleDTO rol)
        {
            try
            {
                // Registramos el intento de actualización con información detallada
                _logger.LogInformation("Actualizando rol {RolId}: {NombreRol} en: {BaseUrl}", rolId, rol.NombreRol, _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl($"Roles/actualizarRole/{rolId}");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos una petición PUT a la API usando la URL centralizada
                var response = await _httpClient.PutAsJsonAsync(url, rol);

                // Verificamos si la actualización fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation("Rol {RolId} actualizado exitosamente", rolId);
                    return true;
                }

                // Si no fue exitosa, capturamos y registramos el error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Error al actualizar rol {RolId}: {Error}", rolId, error);
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(ex, "Error al actualizar rol {RolId}", rolId);
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Eliminar un rol del sistema
        public async Task<bool> EliminarRol(int rolId)
        {
            try
            {
                // Registramos el intento de eliminación con información de la URL base
                _logger.LogInformation("Eliminando rol con ID: {RolId} desde: {BaseUrl}", rolId, _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl($"Roles/{rolId}");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos una petición DELETE a la API usando la URL centralizada
                var response = await _httpClient.DeleteAsync(url);

                // Verificamos si la eliminación fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation("Rol {RolId} eliminado exitosamente", rolId);
                    return true;
                }

                // Si no fue exitosa, capturamos y registramos el error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Error al eliminar rol {RolId}: {Error}", rolId, error);
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(ex, "Error al eliminar rol {RolId}", rolId);
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Obtener los permisos asignados a un rol específico
        public async Task<List<PermisoDTO>> ObtenerPermisosDeRol(int rolId)
        {
            try
            {
                // Registramos la solicitud de permisos con información de la URL base
                _logger.LogInformation("Obteniendo permisos para el rol {RolId} desde: {BaseUrl}", rolId, _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl($"Roles/obtener-permisos-del-rol/{rolId}");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos la petición GET a la API usando la URL centralizada
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                // Leemos y deserializamos la respuesta
                var content = await response.Content.ReadAsStringAsync();
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);

                // Log adicional para ver la cantidad de permisos obtenidos
                _logger.LogInformation("Se obtuvieron {Count} permisos para el rol {RolId}", permisos?.Count ?? 0, rolId);

                // Retornamos la lista de permisos o una lista vacía si es null
                return permisos ?? new List<PermisoDTO>();
            }
            catch (Exception ex)
            {
                // Registramos cualquier error que ocurra
                _logger.LogError(ex, "Error al obtener permisos del rol {RolId}", rolId);
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Obtener todos los permisos disponibles en el sistema
        public async Task<List<PermisoDTO>> ObtenerTodosLosPermisos()
        {
            try
            {
                // Registramos el inicio de la operación con información de la URL base
                _logger.LogInformation("Obteniendo todos los permisos disponibles desde: {BaseUrl}", _apiConfig.BaseUrl);

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl("Permisos/obtener-todos");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos la petición GET a la API usando la URL centralizada
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Error en API: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    throw new HttpRequestException($"Error al obtener permisos: {response.StatusCode} - {errorContent}");
                }

                // Leemos el contenido de la respuesta
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("Respuesta de API: {Content}", content);

                // Deserializamos el JSON a una lista de PermisoDTO
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);

                // Registramos la cantidad de permisos obtenidos
                _logger.LogInformation("Se obtuvieron {Count} permisos disponibles", permisos?.Count ?? 0);

                // Retornamos la lista de permisos o una lista vacía si es null
                return permisos ?? new List<PermisoDTO>();
            }
            catch (Exception ex)
            {
                // Registramos cualquier error que ocurra
                _logger.LogError(ex, "Error al obtener todos los permisos");
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Asignar nuevos permisos a un rol
        public async Task<bool> AsignarPermisosARol(int rolId, List<int> permisoIds)
        {
            try
            {
                // Registramos el inicio de la operación con detalles e información de la URL base
                _logger.LogInformation(
                    "Asignando {Count} permisos al rol {RolId} desde: {BaseUrl}",
                    permisoIds.Count,
                    rolId,
                    _apiConfig.BaseUrl
                );

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl($"Roles/agregar-permisos-al-rol/{rolId}");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos la petición POST a la API usando la URL centralizada
                var response = await _httpClient.PostAsJsonAsync(url, permisoIds);

                // Verificamos si la operación fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation(
                        "Permisos asignados exitosamente al rol {RolId}",
                        rolId
                    );
                    return true;
                }

                // Si no fue exitosa, capturamos y registramos el error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Error al asignar permisos al rol {RolId}: {Error}",
                    rolId,
                    error
                );
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(
                    ex,
                    "Error al asignar permisos al rol {RolId}",
                    rolId
                );
                throw;
            }
        }

        // ✅ MÉTODO CENTRALIZADO: Actualizar los permisos existentes de un rol
        public async Task<bool> ActualizarPermisosDeRol(int rolId, List<int> permisoIds)
        {
            try
            {
                // Registramos el inicio de la actualización con información detallada
                _logger.LogInformation(
                    "Actualizando permisos para el rol {RolId}. Total permisos: {Count} desde: {BaseUrl}",
                    rolId,
                    permisoIds.Count,
                    _apiConfig.BaseUrl
                );

                // ✅ USAR URL CENTRALIZADA: Construir la URL usando el servicio de configuración
                var url = _apiConfig.GetApiUrl($"Roles/actualizar-permisos-del-rol/{rolId}");
                _logger.LogDebug("URL construida: {Url}", url);

                // Realizamos la petición PUT a la API usando la URL centralizada
                var response = await _httpClient.PutAsJsonAsync(url, permisoIds);

                // Verificamos si la actualización fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation(
                        "Permisos actualizados exitosamente para el rol {RolId}",
                        rolId
                    );
                    return true;
                }

                // Si no fue exitosa, capturamos y registramos el error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Error al actualizar permisos del rol {RolId}: {Error}",
                    rolId,
                    error
                );
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(
                    ex,
                    "Error al actualizar permisos del rol {RolId}",
                    rolId
                );
                throw;
            }
        }
    }
}

