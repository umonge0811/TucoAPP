using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.Models;

namespace GestionLlantera.Web.Services
{
    public class RolesService : IRolesService
    {
        private readonly IHttpClientFactory _clientFactory;
        private readonly ILogger<RolesService> _logger;

        public RolesService(IHttpClientFactory clientFactory, ILogger<RolesService> logger)
        {
            _clientFactory = clientFactory;
            _logger = logger;
        }

        public async Task<List<RoleDTO>> ObtenerTodosLosRoles()
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                _logger.LogInformation($"Obteniendo roles desde: {client.BaseAddress}api/Roles/ObtenerTodosRoles");

                var response = await client.GetAsync("/api/Roles/ObtenerTodosRoles");
                response.EnsureSuccessStatusCode();

                var roles = await response.Content.ReadFromJsonAsync<List<RoleDTO>>();
                _logger.LogInformation($"Roles obtenidos exitosamente: {roles?.Count ?? 0}");

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