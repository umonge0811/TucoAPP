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

        public Task<bool> ActivarUsuarioAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DesactivarUsuarioAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds)
        {
            throw new NotImplementedException();
        }

        // Implementa los demás métodos...
    }
}
