using GestionLlantera.Web.Services.Interfaces;
using System.Net.Http;
using System.Text.Json;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace GestionLlantera.Web.Services
{
    public class PermisosService : IPermisosService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PermisosService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly IMemoryCache _cache; //Inyeccion de dependencias de IMemoryCache

        private PermisosUsuarioActual? _permisosCache;
        private DateTime _ultimaActualizacion = DateTime.MinValue;
        private readonly TimeSpan _tiempoCache = TimeSpan.FromMinutes(1); // ✅ REDUCIR A 1 MINUTO

        public PermisosUsuarioActual PermisosActuales => _permisosCache ?? new PermisosUsuarioActual();

        public PermisosService(HttpClient httpClient, IConfiguration configuration, ILogger<PermisosService> logger, IHttpContextAccessor httpContextAccessor, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
            _cache = cache;
        }
        public async Task<List<PermisoDTO>> ObtenerTodosLosPermisos()
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/obtener-todos";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, _jsonOptions);
                return permisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los permisos");
                throw;
            }
        }

        public async Task<PermisoDTO> ObtenerPermisoPorId(int permisoId)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/obtener-por-id/{permisoId}";
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

        public async Task<bool> CrearPermiso(PermisoDTO permiso)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/crear-permiso";
                var response = await _httpClient.PostAsJsonAsync(url, permiso);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear permiso");
                throw;
            }
        }

        public async Task<bool> ActualizarPermiso(int permisoId, PermisoDTO permiso)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/actualizar/{permisoId}";
                var response = await _httpClient.PutAsJsonAsync(url, permiso);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar permiso");
                throw;
            }
        }

        public async Task<bool> EliminarPermiso(int permisoId)
        {
            try
            {
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Permisos/eliminar/{permisoId}";
                var response = await _httpClient.DeleteAsync(url);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar permiso");
                throw;
            }
        }

        // ✅ NUEVOS MÉTODOS PARA VERIFICACIÓN DE PERMISOS DEL USUARIO ACTUAL

        /// <summary>
        /// Obtiene los permisos del usuario actual (alias para compatibilidad)
        /// </summary>
        public async Task<PermisosUsuarioActual> ObtenerPermisosUsuarioAsync()
        {
            return await ObtenerPermisosUsuarioActualAsync();
        }

        /// <summary>
        /// Obtiene los permisos del usuario actual
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

                // Llamar a la API
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Inventario/mis-permisos";
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
            try
            {
                LimpiarCacheCompleto();
                _logger.LogInformation("🔄 Iniciando refresh completo de permisos...");

                // ✅ VALIDAR TOKEN JWT ACTUAL
                var jwtToken = _httpContextAccessor.HttpContext?.Request.Cookies["JwtToken"];
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    try
                    {
                        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                        var decodedToken = handler.ReadToken(jwtToken) as System.IdentityModel.Tokens.Jwt.JwtSecurityToken;

                        if (decodedToken != null)
                        {
                            // Verificar expiración del token
                            if (decodedToken.ValidTo < DateTime.UtcNow)
                            {
                                _logger.LogWarning("❌ Token JWT expirado - no se pueden cargar permisos");
                                return;
                            }

                            // Log de claims del token para debugging
                            var userIdClaim = decodedToken.Claims.FirstOrDefault(c => c.Type == "userId" || c.Type == "UsuarioId")?.Value;
                            _logger.LogInformation("✅ Token JWT válido para usuario: {UserId}", userIdClaim);
                        }
                    }
                    catch (Exception tokenEx)
                    {
                        _logger.LogError(tokenEx, "❌ Error al validar token JWT");
                    }
                }

                // ✅ FORZAR RECARGA DESDE BASE DE DATOS
                _logger.LogDebug("🔄 Forzando recarga de permisos desde base de datos...");

                // La próxima llamada a ObtenerPermisosUsuarioAsync cargará los datos frescos
                var permisosActualizados = await ObtenerPermisosUsuarioActualAsync();

                if (permisosActualizados != null)
                {
                    _logger.LogInformation("✅ Permisos refrescados correctamente");

                    // ✅ MARCAR TIMESTAMP DE ÚLTIMA ACTUALIZACIÓN
                    var cacheKey = "ultima_actualizacion_permisos";
                    _cache.Set(cacheKey, DateTime.UtcNow, TimeSpan.FromHours(1));
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudieron cargar los permisos actualizados");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al refrescar permisos");
            }
        }

        /// <summary>
        /// Limpia completamente el caché de permisos (útil al cambiar de usuario)
        /// </summary>
        public void LimpiarCacheCompleto()
        {
            try
            {
                _logger.LogInformation("🧹 Iniciando limpieza COMPLETA del caché de permisos...");

                // Lista exhaustiva de todas las posibles claves de caché
                var cacheKeysPatterns = new[]
                {
                    "permisos_usuario_",
                    "roles_usuario_",
                    "user_permissions_",
                    "user_roles_",
                    "permisos_cache_general",
                    "usuarios_permisos_cache",
                    "todos_los_permisos",
                    "permisos_info_",
                    "usuario_info_",
                    "roles_info_"
                };

                // Como IMemoryCache no permite enumerar claves, usamos un enfoque más agresivo
                // Invalidamos las claves más comunes para usuarios ID 1-1000
                for (int userId = 1; userId <= 1000; userId++)
                {
                    var userKeys = new[]
                    {
                        $"permisos_usuario_{userId}",
                        $"roles_usuario_{userId}",
                        $"user_permissions_{userId}",
                        $"user_roles_{userId}",
                        $"permisos_info_{userId}",
                        $"usuario_info_{userId}"
                    };

                    foreach (var key in userKeys)
                    {
                        _cache.Remove(key);
                    }
                }

                // Invalidar claves generales
                var generalKeys = new[]
                {
                    "permisos_cache_general",
                    "usuarios_permisos_cache",
                    "todos_los_permisos",
                    "roles_info",
                    "permisos_sistema"
                };

                foreach (var key in generalKeys)
                {
                    _cache.Remove(key);
                }

                _logger.LogInformation("✅ Caché COMPLETAMENTE limpiado - Se invalidaron claves para usuarios 1-1000 y claves generales");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al limpiar caché completo");
            }
        }

        /// <summary>
        /// Verifica si los permisos están desactualizados y necesitan renovación
        /// </summary>
        public bool NecesitaRenovacion()
        {
            var tiempoMaximoCache = TimeSpan.FromMinutes(5); // 5 minutos máximo
            return _permisosCache == null ||
                   DateTime.Now - _ultimaActualizacion > tiempoMaximoCache;
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

        /// <summary>
        /// Verifica si los permisos necesitan ser actualizados
        /// </summary>
        public bool NecesitaActualizacionPermisos()
        {
            try
            {
                var ultimaActualizacion = _cache.Get<DateTime?>("ultima_actualizacion_permisos");

                // Si no hay timestamp de última actualización, necesita actualización
                if (ultimaActualizacion == null)
                {
                    _logger.LogDebug("🔄 Permisos necesitan actualización: sin timestamp");
                    return true;
                }

                // Si han pasado más de 5 minutos, necesita actualización
                var tiempoTranscurrido = DateTime.UtcNow - ultimaActualizacion.Value;
                if (tiempoTranscurrido.TotalMinutes > 5)
                {
                    _logger.LogDebug("🔄 Permisos necesitan actualización: {Minutos} minutos transcurridos",
                        (int)tiempoTranscurrido.TotalMinutes);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verificando si necesita actualización de permisos");
                return true; // En caso de error, forzar actualización
            }
        }
    }


}