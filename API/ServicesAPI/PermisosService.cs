using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace API.ServicesAPI
{
    /// <summary>
    /// Servicio profesional para gestión dinámica de permisos desde base de datos
    /// </summary>
    public class PermisosService : IPermisosService
    {
        private readonly TucoContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<PermisosService> _logger;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(15); // Cache por 15 minutos

        public PermisosService(TucoContext context, IMemoryCache cache, ILogger<PermisosService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Verifica si un usuario tiene un permiso específico
        /// </summary>
        public async Task<bool> TienePermisoAsync(ClaimsPrincipal user, string nombrePermiso)
        {
            try
            {
                _logger.LogInformation("🔍 === INICIO VERIFICACIÓN PERMISO EN SERVICE ===");
                _logger.LogInformation("🔍 Permiso solicitado: '{NombrePermiso}'", nombrePermiso);
                _logger.LogInformation("🔍 Usuario Identity: {Usuario}", user.Identity?.Name ?? "N/A");

                var userId = ObtenerUsuarioId(user);
                _logger.LogInformation("🔍 ID Usuario extraído: {UserId}", userId);

                if (userId == null)
                {
                    _logger.LogWarning("⚠️ No se pudo obtener el ID del usuario");
                    return false;
                }

                // ✅ PRIMERO: Verificar si es administrador (acceso total)
                var esAdministrador = await EsAdministradorAsync(user);
                _logger.LogInformation("🔍 Es administrador: {EsAdministrador}", esAdministrador);

                if (esAdministrador)
                {
                    _logger.LogInformation("✅ Usuario {UserId} es administrador - acceso concedido a {Permiso}", userId, nombrePermiso);
                    return true;
                }

                // ✅ SEGUNDO: Buscar en caché
                var cacheKey = $"permisos_usuario_{userId.Value}";
                _logger.LogInformation("🔍 Buscando en caché con key: {CacheKey}", cacheKey);

                if (!_cache.TryGetValue(cacheKey, out List<string> permisosUsuario))
                {
                    _logger.LogInformation("🔍 No encontrado en caché, consultando base de datos...");
                    
                    // ✅ TERCERO: Consultar base de datos
                    permisosUsuario = await ObtenerPermisosUsuarioAsync(userId.Value);

                    // ✅ CUARTO: Guardar en caché
                    _cache.Set(cacheKey, permisosUsuario, _cacheExpiration);
                    _logger.LogInformation("✅ Permisos del usuario {UserId} cargados en caché", userId.Value);
                }
                else
                {
                    _logger.LogInformation("✅ Permisos encontrados en caché para usuario {UserId}", userId.Value);
                }

                _logger.LogInformation("🔍 Total permisos del usuario: {TotalPermisos}", permisosUsuario.Count);
                _logger.LogInformation("🔍 Permisos del usuario: [{Permisos}]", string.Join(", ", permisosUsuario));

                // Verificar coincidencia exacta
                var tienePermisoExacto = permisosUsuario.Contains(nombrePermiso);
                _logger.LogInformation("🔍 Coincidencia exacta con '{Permiso}': {Resultado}", nombrePermiso, tienePermisoExacto);

                // Si no hay coincidencia exacta, verificar variaciones
                if (!tienePermisoExacto)
                {
                    var variaciones = permisosUsuario.Where(p => 
                        p.Equals(nombrePermiso, StringComparison.OrdinalIgnoreCase) ||
                        p.Replace(" ", "").Equals(nombrePermiso.Replace(" ", ""), StringComparison.OrdinalIgnoreCase) ||
                        p.Replace(" ", "_").Equals(nombrePermiso.Replace(" ", "_"), StringComparison.OrdinalIgnoreCase)
                    ).ToList();

                    _logger.LogInformation("🔍 Variaciones encontradas: [{Variaciones}]", string.Join(", ", variaciones));
                    
                    if (variaciones.Any())
                    {
                        _logger.LogInformation("✅ Encontrada coincidencia por variación");
                        return true;
                    }
                }

                var tienePermiso = tienePermisoExacto;
                _logger.LogInformation("🔍 RESULTADO FINAL: Usuario {UserId} {Resultado} permiso '{Permiso}'",
                    userId.Value, tienePermiso ? "TIENE" : "NO TIENE", nombrePermiso);
                _logger.LogInformation("🔍 === FIN VERIFICACIÓN PERMISO EN SERVICE ===");

                return tienePermiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al verificar permiso {Permiso} para usuario", nombrePermiso);
                return false; // Por seguridad, denegar acceso en caso de error
            }
        }

        /// <summary>
        /// Obtiene todos los permisos de un usuario (desde BD)
        /// </summary>
        public async Task<List<string>> ObtenerPermisosUsuarioAsync(int userId)
        {
            try
            {
                // ✅ PERMISOS POR ROLES
                var permisosPorRoles = await _context.UsuarioRoles
                    .Where(ur => ur.UsuarioId == userId)
                    .SelectMany(ur => ur.Rol.RolPermiso)
                    .Select(rp => rp.Permiso.NombrePermiso)
                    .ToListAsync();

                // ✅ PERMISOS DIRECTOS DEL USUARIO
                var permisosDirectos = await _context.UsuarioPermiso
                    .Where(up => up.UsuarioID == userId)
                    .Select(up => up.Permiso.NombrePermiso)
                    .ToListAsync();

                // ✅ COMBINAR Y ELIMINAR DUPLICADOS
                var todosLosPermisos = permisosPorRoles
                    .Union(permisosDirectos)
                    .Distinct()
                    .ToList();

                _logger.LogInformation("Usuario {UserId} tiene {Count} permisos: {Permisos}",
                    userId, todosLosPermisos.Count, string.Join(", ", todosLosPermisos));

                return todosLosPermisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permisos del usuario {UserId}", userId);
                return new List<string>();
            }
        }

        /// <summary>
        /// Obtiene todos los permisos disponibles en el sistema
        /// </summary>
        public async Task<List<string>> ObtenerTodosLosPermisosAsync()
        {
            try
            {
                var cacheKey = "todos_los_permisos";
                if (!_cache.TryGetValue(cacheKey, out List<string> todosLosPermisos))
                {
                    todosLosPermisos = await _context.Permisos
                        .Select(p => p.NombrePermiso)
                        .ToListAsync();

                    _cache.Set(cacheKey, todosLosPermisos, TimeSpan.FromHours(1)); // Cache por 1 hora
                }

                return todosLosPermisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los permisos");
                return new List<string>();
            }
        }

        /// <summary>
        /// Verifica si un usuario tiene un rol específico
        /// </summary>
        public async Task<bool> TieneRolAsync(ClaimsPrincipal user, string nombreRol)
        {
            try
            {
                var userId = ObtenerUsuarioId(user);
                if (userId == null) return false;

                var cacheKey = $"roles_usuario_{userId.Value}";
                if (!_cache.TryGetValue(cacheKey, out List<string> rolesUsuario))
                {
                    rolesUsuario = await _context.UsuarioRoles
                        .Where(ur => ur.UsuarioId == userId.Value)
                        .Select(ur => ur.Rol.NombreRol)
                        .ToListAsync();

                    _cache.Set(cacheKey, rolesUsuario, _cacheExpiration);
                }

                return rolesUsuario.Contains(nombreRol);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar rol {Rol} para usuario", nombreRol);
                return false;
            }
        }

        /// <summary>
        /// Obtiene el ID del usuario desde los claims
        /// </summary>
        public int? ObtenerUsuarioId(ClaimsPrincipal user)
        {
            try
            {
                // ✅ Intentar obtener del claim personalizado primero
                var userIdClaim = user.FindFirst("userId")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }

                // ✅ Intentar con NameIdentifier
                var nameIdentifierClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(nameIdentifierClaim) && int.TryParse(nameIdentifierClaim, out int userIdFromNameIdentifier))
                {
                    return userIdFromNameIdentifier;
                }

                _logger.LogWarning("No se pudo obtener el ID del usuario de los claims");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ID del usuario de los claims");
                return null;
            }
        }

        /// <summary>
        /// Verifica si el usuario es administrador
        /// </summary>
        public async Task<bool> EsAdministradorAsync(ClaimsPrincipal user)
        {
            return await TieneRolAsync(user, "Administrador");
        }

        /// <summary>
        /// Refresca los permisos en caché
        /// </summary>
        public async Task RefrescarCachePermisosAsync()
        {
            try
            {
                // ✅ Limpiar caché de permisos
                var usuarios = await _context.Usuarios.Select(u => u.UsuarioId).ToListAsync();

                foreach (var userId in usuarios)
                {
                    _cache.Remove($"permisos_usuario_{userId}");
                    _cache.Remove($"roles_usuario_{userId}");
                }

                _cache.Remove("todos_los_permisos");

                _logger.LogInformation("Caché de permisos refrescado para {Count} usuarios", usuarios.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al refrescar caché de permisos");
            }
        }
    }
}