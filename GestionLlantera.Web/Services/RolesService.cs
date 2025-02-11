using GestionLlantera.Web.Services.Interfaces;
using System.Net.Http;
using System.Text.Json;
using tuco.Clases.Models;

namespace GestionLlantera.Web.Services
{
    // La clase implementa la interfaz IRolesService que definimos anteriormente
    public class RolesService : IRolesService
    {
        // Variables privadas para manejar las dependencias inyectadas
        private readonly HttpClient _httpClient;           // Cliente HTTP para hacer llamadas a la API
        private readonly ILogger<RolesService> _logger;    // Logger para registrar eventos y errores
        private readonly JsonSerializerOptions _jsonOptions; // Opciones de serialización JSON

        // Constructor que recibe las dependencias necesarias mediante inyección de dependencias
        public RolesService(IHttpClientFactory httpClientFactory, ILogger<RolesService> logger)
        {
            // Inicializamos las dependencias inyectadas
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;

            // Configuramos las opciones de serialización JSON
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,  // Permite que las propiedades JSON coincidan sin importar mayúsculas/minúsculas
                WriteIndented = true                 // Formatea el JSON de manera legible
            };
        }


        // Método para obtener todos los roles del sistema
        public async Task<List<RoleDTO>> ObtenerTodosLosRoles()
        {
            try
            {
                // Registramos el inicio de la operación
                _logger.LogInformation("Obteniendo todos los roles");

                // Realizamos la petición GET a la API
                var response = await _httpClient.GetAsync("api/Roles/ObtenerTodosRoles");

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

        // Método para obtener un rol específico por su ID
        public async Task<RoleDTO> ObtenerRolPorId(int rolId)
        {
            try
            {
                // Registramos la operación incluyendo el ID del rol
                _logger.LogInformation("Obteniendo rol con ID: {RolId}", rolId);

                // Realizamos la petición GET a la API con el ID específico
                var response = await _httpClient.GetAsync($"api/Roles/obtener-rol-id/{rolId}");

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

        // Método para crear un nuevo rol en el sistema
        public async Task<bool> CrearRol(RoleDTO rol)
        {
            try
            {
                // Registramos el intento de creación del rol con su nombre
                _logger.LogInformation("Creando nuevo rol: {NombreRol}", rol.NombreRol);

                // Realizamos una petición POST a la API enviando el objeto rol serializado como JSON
                var response = await _httpClient.PostAsJsonAsync("api/Roles/CrearRoles", rol);

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

        // Método para actualizar un rol existente
        public async Task<bool> ActualizarRol(int rolId, RoleDTO rol)
        {
            try
            {
                // Registramos el intento de actualización
                _logger.LogInformation("Actualizando rol {RolId}", rolId);

                // Realizamos una petición PUT a la API con el ID del rol y los nuevos datos
                var response = await _httpClient.PutAsJsonAsync($"api/Roles/actualizarRole/{rolId}", rol);

                // Verificamos si la actualización fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation("Rol actualizado exitosamente");
                    return true;
                }

                // Si no fue exitosa, capturamos y registramos el error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Error al actualizar rol: {Error}", error);
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(ex, "Error al actualizar rol {RolId}", rolId);
                throw;
            }
        }

        // Método para eliminar un rol del sistema
        public async Task<bool> EliminarRol(int rolId)
        {
            try
            {
                // Registramos el intento de eliminación
                _logger.LogInformation("Eliminando rol con ID: {RolId}", rolId);

                // Realizamos una petición DELETE a la API
                var response = await _httpClient.DeleteAsync($"api/Roles/{rolId}");

                // Verificamos si la eliminación fue exitosa
                if (response.IsSuccessStatusCode)
                {
                    // Registramos el éxito de la operación
                    _logger.LogInformation("Rol eliminado exitosamente");
                    return true;
                }

                // Si no fue exitosa, capturamos y registramos el error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Error al eliminar rol: {Error}", error);
                return false;
            }
            catch (Exception ex)
            {
                // Registramos cualquier excepción no manejada
                _logger.LogError(ex, "Error al eliminar rol {RolId}", rolId);
                throw;
            }
        }

        // Método para obtener los permisos asignados a un rol específico
        public async Task<List<PermisoDTO>> ObtenerPermisosDeRol(int rolId)
        {
            try
            {
                // Registramos la solicitud de permisos
                _logger.LogInformation("Obteniendo permisos para el rol {RolId}", rolId);

                // Realizamos la petición GET a la API
                var response = await _httpClient.GetAsync($"api/Roles/obtener-permisos-del-rol/{rolId}");
                response.EnsureSuccessStatusCode();

                // Leemos y deserializamos la respuesta
                var content = await response.Content.ReadAsStringAsync();
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);

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

        // Método para obtener todos los permisos disponibles en el sistema
        public async Task<List<PermisoDTO>> ObtenerTodosLosPermisos()
        {
            try
            {
                // Registramos el inicio de la operación
                _logger.LogInformation("Obteniendo todos los permisos disponibles");

                // Realizamos la petición GET a la API para obtener los permisos
                var response = await _httpClient.GetAsync("api/Permisos/obtener-todos");
                response.EnsureSuccessStatusCode();

                // Leemos el contenido de la respuesta
                var content = await response.Content.ReadAsStringAsync();

                // Deserializamos el JSON a una lista de PermisoDTO
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);

                // Registramos la cantidad de permisos obtenidos
                _logger.LogInformation("Se obtuvieron {Count} permisos", permisos?.Count ?? 0);

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

        // Método para asignar nuevos permisos a un rol
        public async Task<bool> AsignarPermisosARol(int rolId, List<int> permisoIds)
        {
            try
            {
                // Registramos el inicio de la operación con detalles
                _logger.LogInformation(
                    "Asignando {Count} permisos al rol {RolId}",
                    permisoIds.Count,
                    rolId
                );

                // Realizamos la petición POST a la API para asignar los permisos
                var response = await _httpClient.PostAsJsonAsync(
                    $"api/Roles/agregar-permisos-al-rol/{rolId}",
                    permisoIds
                );

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

        // Método para actualizar los permisos existentes de un rol
        public async Task<bool> ActualizarPermisosDeRol(int rolId, List<int> permisoIds)
        {
            try
            {
                // Registramos el inicio de la actualización de permisos
                _logger.LogInformation(
                    "Actualizando permisos para el rol {RolId}. Total permisos: {Count}",
                    rolId,
                    permisoIds.Count
                );

                // Realizamos la petición PUT a la API para actualizar los permisos
                var response = await _httpClient.PutAsJsonAsync(
                    $"api/Roles/actualizar-permisos-del-rol/{rolId}",
                    permisoIds
                );

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

