using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Services
{
    public class UsuariosService : IUsuariosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UsuariosService> _logger;

        public UsuariosService(HttpClient httpClient, ILogger<UsuariosService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<UsuarioDTO>> ObtenerTodosAsync()
        {
            try
            {
                // Asegurémonos de que la ruta coincida con el endpoint de la API
                var response = await _httpClient.GetAsync("api/Usuarios/usuarios");
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Error al obtener usuarios. Status code: {response.StatusCode}");
                    throw new Exception($"Error al obtener usuarios. Status code: {response.StatusCode}");
                }

                var usuarios = await response.Content.ReadFromJsonAsync<List<UsuarioDTO>>();
                return usuarios ?? new List<UsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                throw;
            }
        }

        public async Task<bool> CrearUsuarioAsync(CreateUsuarioDTO usuario)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/usuarios/registrar-usuario", usuario);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                throw;
            }
        }
       

        public async Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId)
        {
            var response = await _httpClient.GetAsync($"api/Usuarios/usuarios/{usuarioId}/roles");
            if (!response.IsSuccessStatusCode)
                throw new Exception("Error al obtener roles del usuario");

            return await response.Content.ReadFromJsonAsync<List<RolUsuarioDTO>>() ?? new List<RolUsuarioDTO>();
        }

        public async Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds)
        {
            var response = await _httpClient.PostAsJsonAsync($"api/Usuarios/usuarios/{usuarioId}/roles", rolesIds);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> ActivarUsuarioAsync(int usuarioId)
        {
            try
            {
                // La ruta debe coincidir exactamente con la del Swagger
                var response = await _httpClient.PostAsync($"api/Usuarios/{usuarioId}/activar", null);

                // Para debug
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error al activar usuario. Status: {response.StatusCode}, Error: {errorContent}");
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuario");
                throw;
            }
        }


        public async Task<bool> DesactivarUsuarioAsync(int usuarioId)
        {
            try
            {
                var response = await _httpClient.PostAsync($"api/Usuarios/{usuarioId}/desactivar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error al desactivar usuario. Status: {response.StatusCode}, Error: {errorContent}");
                }

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
