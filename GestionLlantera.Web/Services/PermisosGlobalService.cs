using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio global para verificar permisos en todo el sistema
    /// Se conecta dinámicamente con la API para verificar permisos en tiempo real
    /// </summary>
    public class PermisosGlobalService : IPermisosGlobalService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PermisosGlobalService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(5); // Cache corto para permisos

        public PermisosGlobalService(
            IHttpClientFactory httpClientFactory,
            ILogger<PermisosGlobalService> logger,
            IHttpContextAccessor httpContextAccessor,
            IMemoryCache cache)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _cache = cache;
        }

        /// <summary>
        /// Verifica si el usuario actual tiene un permiso específico
        /// </summary>
        public async Task<bool> TienePermisoAsync(string permiso)
        {
            try
            {
                var usuario = ObtenerUsuarioActual();
                if (string.IsNullOrEmpty(usuario))
                {
                    _logger.LogWarning("Usuario no autenticado intentando verificar permiso {Permiso}", permiso);
                    return false;
                }

                // Verificar cache primero
                var cacheKey = $"permiso_{usuario}_{permiso}";
                if (_cache.TryGetValue(cacheKey, out bool permisoEnCache))
                {
                    _logger.LogDebug("Permiso {Permiso} obtenido desde cache: {Resultado}", permiso, permisoEnCache);
                    return permisoEnCache;
                }

                // Si no está en cache, consultar API
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("No se encontró token JWT para verificar permiso {Permiso}", permiso);
                    return false;
                }

                // Configurar autenticación
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                // Hacer petición a la API
                var response = await _httpClient.GetAsync($"api/Permisos/verificar/{permiso}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Error al verificar permiso {Permiso}: {StatusCode}",
                        permiso, response.StatusCode);
                    return false;
                }

                var content = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                bool tienePermiso = resultado?.tienePermiso ?? false;

                // Guardar en cache
                _cache.Set(cacheKey, tienePermiso, _cacheExpiration);

                _logger.LogDebug("Permiso {Permiso} verificado: {Resultado}", permiso, tienePermiso);
                return tienePermiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar permiso {Permiso}", permiso);
                return false; // Por seguridad, denegar en caso de error
            }
        }

        /// <summary>
        /// Verifica múltiples permisos de una vez (optimización)
        /// </summary>
        public async Task<Dictionary<string, bool>> TienePermisosAsync(params string[] permisos)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return permisos.ToDictionary(p => p, p => false);
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var jsonContent = JsonConvert.SerializeObject(permisos.ToList());
                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Permisos/verificar-multiples", content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Error al verificar múltiples permisos: {StatusCode}", response.StatusCode);
                    return permisos.ToDictionary(p => p, p => false);
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);

                var permisosResultado = new Dictionary<string, bool>();
                if (resultado?.permisos != null)
                {
                    foreach (var kvp in resultado.permisos)
                    {
                        permisosResultado[kvp.Name] = kvp.Value;
                    }
                }

                return permisosResultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar múltiples permisos");
                return permisos.ToDictionary(p => p, p => false);
            }
        }

        /// <summary>
        /// Verifica si el usuario actual es administrador
        /// </summary>
        public async Task<bool> EsAdministradorAsync()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context?.User?.Identity?.IsAuthenticated != true)
                {
                    _logger.LogDebug("Usuario no autenticado");
                    return false;
                }

                // ✅ VERIFICACIÓN MÁS ESTRICTA DE ROLES
                var rolesClaims = context.User.Claims
                    .Where(c => c.Type == "role" || c.Type == System.Security.Claims.ClaimTypes.Role)
                    .Select(c => c.Value.ToLower().Trim())
                    .ToList();

                _logger.LogInformation("🔍 EsAdministradorAsync - Claims de rol encontrados: {Roles}", 
                    string.Join(", ", rolesClaims));

                // ✅ Verificar si específicamente tiene rol de administrador
                var esAdmin = rolesClaims.Contains("administrador") || 
                             rolesClaims.Contains("admin");

                _logger.LogInformation("👑 EsAdministradorAsync resultado: {EsAdmin} para usuario: {Usuario}", 
                    esAdmin, context.User.Identity?.Name);

                // ✅ VERIFICACIÓN ADICIONAL: Si dice ser admin, verificar que tenga permisos de admin
                if (esAdmin)
                {
                    // Verificar que tenga al menos un permiso típico de administrador
                    var tienePermisosAdmin = await TienePermisoAsync("Gestión Completa") ||
                                           await TienePermisoAsync("Administrar Sistema") ||
                                           await TienePermisoAsync("Crear Facturas"); // Al menos debe poder crear facturas

                    if (!tienePermisosAdmin)
                    {
                        _logger.LogWarning("⚠️ Usuario tiene rol de admin pero NO tiene permisos de administrador");
                        return false;
                    }
                }

                return esAdmin;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verificando si es administrador");
                return false;
            }
        }

        /// <summary>
        /// Obtiene todos los permisos del usuario actual
        /// </summary>
        public async Task<List<string>> ObtenerMisPermisosAsync()
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                    return new List<string>();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.GetAsync("api/Permisos/mis-permisos");

                if (!response.IsSuccessStatusCode)
                    return new List<string>();

                var content = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                var permisos = new List<string>();
                if (resultado?.permisos != null)
                {
                    foreach (var permiso in resultado.permisos)
                    {
                        permisos.Add(permiso.ToString());
                    }
                }

                return permisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permisos del usuario");
                return new List<string>();
            }
        }

        /// <summary>
        /// Limpia el cache de permisos (útil cuando se cambian permisos)
        /// </summary>
        public void LimpiarCache()
        {
            try
            {
                var usuario = ObtenerUsuarioActual();
                if (!string.IsNullOrEmpty(usuario))
                {
                    // Aquí podrías implementar una limpieza más específica del cache
                    // Por ahora, simplemente loggeamos la acción
                    _logger.LogInformation("Cache de permisos limpiado para usuario {Usuario}", usuario);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar cache de permisos");
            }
        }

        #region Métodos Auxiliares
        private string? ObtenerTokenJWT()
        {
            try
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user == null || !user.Identity.IsAuthenticated)
                    return null;

                return user.FindFirst("JwtToken")?.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener token JWT");
                return null;
            }
        }

        private string? ObtenerUsuarioActual()
        {
            try
            {
                var user = _httpContextAccessor.HttpContext?.User;
                return user?.Identity?.Name;
            }
            catch
            {
                return null;
            }
        }
        #endregion
    }
}