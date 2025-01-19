using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Services
{
    public class RolesService : IRolesService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RolesService> _logger;

        public RolesService(HttpClient httpClient, ILogger<RolesService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<RoleDTO>> ObtenerTodosLosRoles()
        {
            try
            {
                _logger.LogInformation($"URL Base del cliente: {_httpClient.BaseAddress}");

                // La URL debe coincidir con el endpoint en la API
                var response = await _httpClient.GetAsync("api/Roles/ObtenerTodosRoles");

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error de la API: {error}");
                    throw new Exception($"Error al obtener roles. Status: {response.StatusCode}");
                }

                var roles = await response.Content.ReadFromJsonAsync<List<RoleDTO>>();
                _logger.LogInformation($"Roles obtenidos: {roles?.Count ?? 0}");

                return roles ?? new List<RoleDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los roles");
                throw;
            }
        }
    }
}