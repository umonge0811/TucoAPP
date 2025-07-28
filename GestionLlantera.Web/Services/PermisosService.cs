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

        private PermisosUsuarioActual? _permisosCache;
        private DateTime _ultimaActualizacion = DateTime.MinValue;
        private readonly TimeSpan _tiempoCache = TimeSpan.FromMinutes(2); // ✅ Reducido de 10 a 2 minutos

        public PermisosUsuarioActual PermisosActuales => _permisosCache ?? new PermisosUsuarioActual();

        public PermisosService(HttpClient httpClient, IConfiguration configuration, ILogger<PermisosService> logger, IHttpContextAccessor httpContextAccessor)
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
        /// Obtiene los permisos del usuario actual desde la API
        /// </summary>
        public async Task<PermisosUsuarioActual> ObtenerPermisosUsuarioActualAsync()
        {
            try
            {
                // ✅ Verificar caché
                if (_permisosCache != null && DateTime.Now - _ultimaActualizacion < _tiempoCache)
                {
                    _logger.LogDebug("Usando permisos desde caché");
                    return _permisosCache;
                }

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
            _logger.LogInformation("Refrescando permisos del usuario");
            _permisosCache = null;
            _ultimaActualizacion = DateTime.MinValue;
            await ObtenerPermisosUsuarioActualAsync();
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
