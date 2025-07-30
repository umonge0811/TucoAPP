
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace GestionLlantera.Web.Services
{
    public interface IPermisosSyncService
    {
        Task InvalidarCacheUsuario(int usuarioId);
        Task<bool> VerificarTokenVigente();
        Task ForzarRecargaPermisos();
    }

    public class PermisosSyncService : IPermisosSyncService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<PermisosSyncService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IPermisosService _permisosService;

        public PermisosSyncService(
            HttpClient httpClient,
            IMemoryCache cache,
            ILogger<PermisosSyncService> logger,
            IConfiguration configuration,
            IPermisosService permisosService)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _configuration = configuration;
            _permisosService = permisosService;
        }

        public async Task InvalidarCacheUsuario(int usuarioId)
        {
            try
            {
                // Invalidar caché local
                var cacheKeys = new[]
                {
                    $"permisos_usuario_{usuarioId}",
                    $"roles_usuario_{usuarioId}",
                    "permisos_cache_general"
                };

                foreach (var key in cacheKeys)
                {
                    _cache.Remove(key);
                }

                // Limpiar caché del servicio de permisos
                _permisosService.LimpiarCacheCompleto();

                _logger.LogInformation("Caché invalidado localmente para usuario {UsuarioId}", usuarioId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al invalidar caché del usuario {UsuarioId}", usuarioId);
            }
        }

        public async Task<bool> VerificarTokenVigente()
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Auth/verificar-token-vigente";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = System.Text.Json.JsonSerializer.Deserialize<dynamic>(content);
                    // Simplificado: verificar respuesta
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar vigencia del token");
                return false;
            }
        }

        public async Task ForzarRecargaPermisos()
        {
            try
            {
                _permisosService.LimpiarCacheCompleto();
                await _permisosService.RefrescarPermisosAsync();
                _logger.LogInformation("Permisos recargados forzosamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al forzar recarga de permisos");
            }
        }
    }
}
