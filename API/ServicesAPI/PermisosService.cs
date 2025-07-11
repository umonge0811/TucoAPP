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
                var userId = ObtenerUsuarioId(user);
                if (userId == null)
                {
                    _logger.LogWarning("No se pudo obtener el ID del usuario");
                    return false;
                }

                // ✅ PRIMERO: Verificar si es administrador (acceso total)
                if (await EsAdministradorAsync(user))
                {
                    _logger.LogInformation("Usuario {UserId} es administrador - acceso concedido a {Permiso}", userId, nombrePermiso);
                    return true;
                }

                // ✅ SEGUNDO: Buscar en caché
                var cacheKey = $"permisos_usuario_{userId.Value}";
                if (!_cache.TryGetValue(cacheKey, out List<string> permisosUsuario))
                {
                    // ✅ TERCERO: Consultar base de datos
                    permisosUsuario = await ObtenerPermisosUsuarioAsync(userId.Value);

                    // ✅ CUARTO: Guardar en caché
                    _cache.Set(cacheKey, permisosUsuario, _cacheExpiration);
                    _logger.LogInformation("Permisos del usuario {UserId} cargados en caché", userId.Value);
                }

                var tienePermiso = permisosUsuario.Contains(nombrePermiso);
                
                // ✅ LOGGING DETALLADO PARA DIAGNÓSTICO
                _logger.LogInformation("🔍 === DIAGNÓSTICO DE PERMISO ===");
                _logger.LogInformation("🔍 Usuario ID: {UserId}", userId.Value);
                _logger.LogInformation("🔍 Permiso buscado: '{Permiso}'", nombrePermiso);
                _logger.LogInformation("🔍 Permisos del usuario: [{Permisos}]", string.Join(", ", permisosUsuario));
                _logger.LogInformation("🔍 Resultado: {Resultado}", tienePermiso ? "✅ TIENE PERMISO" : "❌ NO TIENE PERMISO");
                
                // ✅ BUSCAR COINCIDENCIAS PARCIALES PARA DIAGNÓSTICO
                var coincidenciasParciales = permisosUsuario
                    .Where(p => p.ToLower().Contains(nombrePermiso.ToLower()) || 
                               nombrePermiso.ToLower().Contains(p.ToLower()))
                    .ToList();
                    
                if (coincidenciasParciales.Any())
                {
                    _logger.LogInformation("🔍 Coincidencias parciales encontradas: [{Coincidencias}]", 
                        string.Join(", ", coincidenciasParciales));
                }

                return tienePermiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar permiso {Permiso} para usuario", nombrePermiso);
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