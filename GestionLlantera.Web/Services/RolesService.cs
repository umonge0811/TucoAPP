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
                var response = await _httpClient.GetAsync("/api/Roles/ObtenerTodosRoles");
                response.EnsureSuccessStatusCode();

                var roles = await response.Content.ReadFromJsonAsync<List<RoleDTO>>();
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