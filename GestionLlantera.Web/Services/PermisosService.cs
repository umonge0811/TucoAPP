using GestionLlantera.Web.Services.Interfaces;
using System.Net.Http;
using System.Text.Json;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    public class PermisosService : IPermisosService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PermisosService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly JsonSerializerOptions _jsonOptions;
        // ✅ SERVICIO CENTRALIZADO PARA CONFIGURACIÓN DE API
        private readonly ApiConfigurationService _apiConfigService;

        private PermisosUsuarioActual? _permisosCache;
        private DateTime _ultimaActualizacion = DateTime.MinValue;
        private readonly TimeSpan _tiempoCache = TimeSpan.FromMinutes(1); // ✅ REDUCIR A 1 MINUTO

        public PermisosUsuarioActual PermisosActuales => _permisosCache ?? new PermisosUsuarioActual();

        public PermisosService(HttpClient httpClient, IConfiguration configuration, ILogger<PermisosService> logger, IHttpContextAccessor httpContextAccessor, ApiConfigurationService apiConfigService)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            // ✅ INYECCIÓN DEL SERVICIO DE CONFIGURACIÓN CENTRALIZADA
            _apiConfigService = apiConfigService;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
        }
        /// <summary>
        /// Obtiene todos los permisos disponibles en el sistema
        /// </summary>
        public async Task<List<PermisoDTO>> ObtenerTodosLosPermisos()
        {
            try
            {
                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfigService.GetApiUrl("Permisos/obtener-todos");
                _logger.LogDebug("Obteniendo todos los permisos desde: {Url}", url);
                
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);
                return permisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los permisos desde la API");
                throw;
            }
        }

        /// <summary>
        /// Obtiene un permiso específico por su ID
        /// </summary>
        public async Task<PermisoDTO> ObtenerPermisoPorId(int permisoId)
        {
            try
            {
                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfigService.GetApiUrl($"Permisos/obtener-por-id/{permisoId}");
                _logger.LogDebug("Obteniendo permiso ID {PermisoId} desde: {Url}", permisoId, url);
                
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var permiso = JsonSerializer.Deserialize<PermisoDTO>(content, _jsonOptions);

                return permiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permiso por ID: {PermisoId}", permisoId);
                throw;
            }
        }

        /// <summary>
        /// Crea un nuevo permiso en el sistema
        /// </summary>
        public async Task<bool> CrearPermiso(PermisoDTO permiso)
        {
            try
            {
                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfigService.GetApiUrl("Permisos/crear-permiso");
                _logger.LogDebug("Creando permiso en: {Url}", url);
                
                var response = await _httpClient.PostAsJsonAsync(url, permiso);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear permiso: {NombrePermiso}", permiso?.NombrePermiso);
                throw;
            }
        }

        /// <summary>
        /// Actualiza un permiso existente
        /// </summary>
        public async Task<bool> ActualizarPermiso(int permisoId, PermisoDTO permiso)
        {
            try
            {
                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfigService.GetApiUrl($"Permisos/actualizar/{permisoId}");
                _logger.LogDebug("Actualizando permiso ID {PermisoId} en: {Url}", permisoId, url);
                
                var response = await _httpClient.PutAsJsonAsync(url, permiso);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar permiso ID: {PermisoId}", permisoId);
                throw;
            }
        }

        /// <summary>
        /// Elimina un permiso del sistema
        /// </summary>
        public async Task<bool> EliminarPermiso(int permisoId)
        {
            try
            {
                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfigService.GetApiUrl($"Permisos/eliminar/{permisoId}");
                _logger.LogDebug("Eliminando permiso ID {PermisoId} en: {Url}", permisoId, url);
                
                var response = await _httpClient.DeleteAsync(url);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar permiso ID: {PermisoId}", permisoId);
                throw;
            }
        }

        // ✅ NUEVOS MÉTODOS PARA VERIFICACIÓN DE PERMISOS DEL USUARIO ACTUAL

        /// <summary>
        /// Obtiene los permisos del usuario actual desde la API
        /// </summary>
        public async Task<PermisosUsuarioActual> ObtenerPermisosUsuarioActualAsync()
        {
            try
            {
                // ✅ Verificar caché - FORZAR RENOVACIÓN MÁS FRECUENTE
                var tiempoCacheEfectivo = TimeSpan.FromSeconds(30); // ✅ 30 segundos para desarrollo
                if (_permisosCache != null && DateTime.Now - _ultimaActualizacion < tiempoCacheEfectivo)
                {
                    _logger.LogDebug("Usando permisos desde caché (expira en {Segundos}s)", 
                        (tiempoCacheEfectivo - (DateTime.Now - _ultimaActualizacion)).TotalSeconds);
                    return _permisosCache;
                }

                _logger.LogInformation("🔄 Caché de permisos expirado - Renovando desde API");

                // ✅ SOLUCIÓN TEMPORAL: Verificar directamente en el contexto HTTP
                var context = _httpContextAccessor.HttpContext;
                if (context?.User?.Identity?.IsAuthenticated == true)
                {
                    // ✅ VERIFICAR DIRECTAMENTE SI ES ADMINISTRADOR
                    var esAdministradorDirecto = context.User.IsInRole("Administrador");

                    _logger.LogInformation("🔍 Usuario es administrador (directo): {EsAdmin}", esAdministradorDirecto);

                    if (esAdministradorDirecto)
                    {
                        // ✅ Si es administrador, darle TODOS los permisos
                        _permisosCache = new PermisosUsuarioActual
                        {
                            EsAdministrador = true,
                            PuedeVerCostos = true,
                            PuedeVerUtilidades = true,
                            PuedeProgramarInventario = true,
                            PuedeEditarProductos = true,
                            PuedeEliminarProductos = true,
                            PuedeAjustarStock = true
                        };

                        _ultimaActualizacion = DateTime.Now;
                        _logger.LogInformation("✅ Permisos de administrador asignados directamente");
                        return _permisosCache;
                    }
                }

                // ✅ RESTO DEL CÓDIGO ORIGINAL (para usuarios no administradores)
                var token = ObtenerTokenDelUsuario();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("No se encontró token de usuario");
                    return new PermisosUsuarioActual();
                }

                // Configurar headers de autorización
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");

                // ✅ LLAMAR A LA API USANDO SERVICIO CENTRALIZADO
                var url = _apiConfigService.GetApiUrl("Inventario/mis-permisos");
                _logger.LogDebug("Obteniendo permisos desde API: {Url}", url);

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var permisos = JsonSerializer.Deserialize<PermisosUsuarioActual>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    _permisosCache = permisos ?? new PermisosUsuarioActual();
                    _ultimaActualizacion = DateTime.Now;

                    _logger.LogInformation("Permisos obtenidos desde API. Es Admin: {EsAdmin}", _permisosCache.EsAdministrador);
                    return _permisosCache;
                }
                else
                {
                    _logger.LogWarning("Error al obtener permisos de la API: {StatusCode}", response.StatusCode);
                    return new PermisosUsuarioActual();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permisos del usuario actual");
                return new PermisosUsuarioActual();
            }
        }

        /// <summary>
        /// Verifica si el usuario actual tiene un permiso específico
        /// </summary>
        public async Task<bool> TienePermisoAsync(string nombrePermiso)
        {
            var permisos = await ObtenerPermisosUsuarioActualAsync();

            // ✅ Si es administrador, tiene todos los permisos
            if (permisos.EsAdministrador)
            {
                return true;
            }

            // ✅ Mapeo directo para permisos específicos
            return nombrePermiso switch
            {
                "VerCostos" => permisos.PuedeVerCostos,
                "VerUtilidades" => permisos.PuedeVerUtilidades,
                "ProgramarInventario" => permisos.PuedeProgramarInventario,
                "EditarProductos" => permisos.PuedeEditarProductos,
                "EliminarProductos" => permisos.PuedeEliminarProductos,
                "AjustarStock" => permisos.PuedeAjustarStock,
                _ => false
            };
        }

        /// <summary>
        /// Refresca los permisos del caché
        /// </summary>
        public async Task RefrescarPermisosAsync()
        {
            _logger.LogInformation("Refrescando permisos del usuario");
            _permisosCache = null;
            _ultimaActualizacion = DateTime.MinValue;
            await ObtenerPermisosUsuarioActualAsync();
        }

        /// <summary>
        /// Fuerza la renovación inmediata de permisos (ignora caché completamente)
        /// </summary>
        public async Task<PermisosUsuarioActual> ForzarRenovacionPermisosAsync()
        {
            _logger.LogInformation("🔄 FORZANDO renovación inmediata de permisos (ignorando caché)");
            
            // Limpiar caché completamente
            LimpiarCacheCompleto();
            
            // Obtener permisos frescos
            return await ObtenerPermisosUsuarioActualAsync();
        }

        /// <summary>
        /// Limpia completamente el caché de permisos (útil al cambiar de usuario)
        /// </summary>
        public void LimpiarCacheCompleto()
        {
            _logger.LogInformation("🧹 Limpiando caché completo de permisos");
            _permisosCache = null;
            _ultimaActualizacion = DateTime.MinValue;
        }

        /// <summary>
        /// Verifica si el usuario actual es administrador
        /// </summary>
        public async Task<bool> EsAdministradorAsync()
        {
            var permisos = await ObtenerPermisosUsuarioActualAsync();
            return permisos.EsAdministrador;
        }

        /// <summary>
        /// Obtiene el token JWT del usuario actual
        /// </summary>
        private string? ObtenerTokenDelUsuario()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context?.User?.Identity?.IsAuthenticated != true)
                {
                    _logger.LogDebug("Usuario no autenticado");
                    return null;
                }

                // ✅ Intentar obtener de la sesión primero
                var tokenFromSession = context.Session.GetString("JwtToken");
                if (!string.IsNullOrEmpty(tokenFromSession))
                {
                    _logger.LogDebug("Token obtenido de la sesión");
                    return tokenFromSession;
                }

                // ✅ Intentar obtener de cookies
                var tokenFromCookie = context.Request.Cookies["AuthToken"];
                if (!string.IsNullOrEmpty(tokenFromCookie))
                {
                    _logger.LogDebug("Token obtenido de cookies");
                    return tokenFromCookie;
                }

                // ✅ Intentar obtener del header Authorization
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    _logger.LogDebug("Token obtenido del header Authorization");
                    return authHeader.Substring("Bearer ".Length);
                }

                _logger.LogWarning("No se pudo obtener el token JWT del usuario");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener token del usuario");
                return null;
            }
        }
    }
       
    
}
