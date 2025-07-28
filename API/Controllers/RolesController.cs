using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Tuco.Clases.Models;
using System.Collections.Generic;
using API.Data;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;
using System.Net.Http;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;
using tuco.Utilities;
using Microsoft.AspNetCore.Cors;

[ApiController]
[Route("api/[controller]")]
// Habilitar CORS para este controlador
[EnableCors("AllowAll")]
public class RolesController : ControllerBase
{
    private readonly TucoContext _context;
    private readonly ILogger<RolesController> _logger;
    HttpClient _httpClient;


    public RolesController(TucoContext context, IHttpClientFactory httpClientFactory, ILogger<RolesController> logger)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient("TucoApi");
        _logger = logger;
    }


    #region Crear un nuevo rol
    [HttpPost("CrearRoles")]
    public async Task<IActionResult> CrearRol([FromBody] RoleDTO dto)
    {
        try
        {
            // Validar si ya existe un rol con el mismo nombre
            if (await _context.Roles.AnyAsync(r => r.NombreRol == dto.NombreRol))
            {
                // Registrar intento fallido en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 2, // ID de usuario para pruebas
                    tipoAccion: "Creación de Roles",
                    modulo: "Roles",
                    detalle: $"Intento de crear rol fallido. El rol '{dto.NombreRol}' ya existe.",
                    estadoAccion: "Error",
                    errorDetalle: "El rol ya existe."
                );
                return BadRequest(new { Message = "El rol ya existe." });
            }

            // Crear una nueva instancia del rol con los datos proporcionados en el DTO
            var nuevoRol = new Role
            {
                NombreRol = dto.NombreRol,
                DescripcionRol = dto.DescripcionRol
            };

            // Agregar el nuevo rol al contexto para ser persistido en la base de datos
            _context.Roles.Add(nuevoRol);
            await _context.SaveChangesAsync();

            // Registrar creación exitosa del rol en el historial - PRIMERA GUARDADA
            try
            {
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 2, // ID de usuario para pruebas
                    tipoAccion: "Creación de Roles",
                    modulo: "Roles",
                    detalle: $"Rol creado exitosamente: '{dto.NombreRol}'.",
                    estadoAccion: "Éxito"
                );
            }
            catch (Exception historialEx)
            {
                // Solo registrar la excepción pero no detener el proceso
                Console.WriteLine($"Error al registrar historial: {historialEx.Message}");
            }

            // Asociar permisos si están definidos en el DTO
            if (dto.PermisoIds != null && dto.PermisoIds.Count > 0)
            {
                // Primera carga explícita de todos los permisos relevantes
                var permisosExistentes = await _context.Permisos
                    .Where(p => dto.PermisoIds.Contains(p.PermisoId))
                    .ToListAsync();

                foreach (var permisoId in dto.PermisoIds)
                {
                    // Verificar que el permiso existe en los cargados previamente
                    var permisoExistente = permisosExistentes.FirstOrDefault(p => p.PermisoId == permisoId);

                    if (permisoExistente != null)
                    {
                        var rolPermiso = new RolPermisoRE
                        {
                            RolID = nuevoRol.RolId,
                            PermisoID = permisoId
                        };

                        _context.RolPermisos.Add(rolPermiso);
                    }
                    else
                    {
                        Console.WriteLine($"El permiso con ID {permisoId} no existe");
                    }
                }

                // Guardar las relaciones entre rol y permisos
                await _context.SaveChangesAsync();

                // Registrar en el historial la asociación de permisos - SEGUNDA GUARDADA
                try
                {
                    await HistorialHelper.RegistrarHistorial(
                        httpClient: _httpClient,
                        usuarioId: 2, // ID de usuario para pruebas
                        tipoAccion: "Asociación de Permisos",
                        modulo: "Roles",
                        detalle: $"Permisos asociados al rol '{dto.NombreRol}'.",
                        estadoAccion: "Éxito"
                    );
                }
                catch (Exception historialEx)
                {
                    // Solo registrar la excepción pero no detener el proceso
                    Console.WriteLine($"Error al registrar historial de permisos: {historialEx.Message}");
                }
            }

            return Ok(new { Message = "Rol creado exitosamente.", RolId = nuevoRol.RolId });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            try
            {
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 2, // ID de usuario para pruebas
                    tipoAccion: "Creación de Roles",
                    modulo: "Roles",
                    detalle: "Error al crear el rol.",
                    estadoAccion: "Error",
                    errorDetalle: ex.Message
                );
            }
            catch
            {
                // Ignorar errores del historial en caso de excepción principal
            }

            return StatusCode(500, new { Message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Obtener todos los roles
    [HttpGet("ObtenerTodosRoles")]
    public async Task<ActionResult<List<RoleDTO>>> ObtenerRoles()
    {
        try
        {
            var roles = await _context.Roles
                .Include(r => r.RolPermiso) // Incluir relación intermedia
                .ThenInclude(rp => rp.Permiso) // Incluir los permisos
                .ToListAsync();

            // Mapeo explícito incluyendo los permisos
            var rolesDTO = roles.Select(r => new RoleDTO
            {
                RolId = r.RolId,
                NombreRol = r.NombreRol,
                DescripcionRol = r.DescripcionRol,
                // Mapear los permisos desde RolPermiso
                Permisos = r.RolPermiso
                    .Select(rp => new PermisoDTO
                    {
                        PermisoId = rp.Permiso.PermisoId,
                        NombrePermiso = rp.Permiso.NombrePermiso,
                        DescripcionPermiso = rp.Permiso.DescripcionPermiso
                    }).ToList()
            }).ToList();

            return Ok(rolesDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener roles");
            return StatusCode(500, new { message = "Error al obtener roles" });
        }
    }
    #endregion

    #region Obtener el rol por el numero de id
    [HttpGet("obtener-rol-id/{id}")]
    public async Task<ActionResult> ObtenerRolesPorID(int id)
    {
        // Busca el permiso en la base de datos por su ID
        var RolExistenteID = await _context.Roles.FindAsync(id);
        // Verifica si el permiso existe
        if (RolExistenteID == null)
        {
            // Retorna un error 404 si no se encuentra el permiso
            return NotFound(new { Message = "Permiso no encontrado." });
        }
        return Ok(RolExistenteID);
    }
    #endregion

    #region Actualizar un rol existente
    [HttpPut("actualizarRole/{id}")]
    public async Task<IActionResult> ActualizarRolporID(int id, [FromBody] RoleDTO rol)
    {
        try
        {
            var rolExistente = await _context.Roles
                .Include(r => r.RolPermiso)
                .FirstOrDefaultAsync(r => r.RolId == id);

            if (rolExistente == null)
            {
                // Registrar en el historial si el rol no existe
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 1,
                    tipoAccion: "Actualización de Roles",
                    modulo: "Roles",
                    detalle: $"Intento fallido de actualizar rol. Rol con ID '{id}' no encontrado.",
                    estadoAccion: "Error",
                    errorDetalle: "Rol no encontrado."
                );

                return NotFound(new { Message = "Rol no encontrado." });
            }

            // Actualizar los campos básicos
            rolExistente.NombreRol = rol.NombreRol;
            rolExistente.DescripcionRol = rol.DescripcionRol;

            // Actualizar permisos
            // 1. Eliminar permisos actuales
            _context.RolPermisos.RemoveRange(rolExistente.RolPermiso);

            // 2. Agregar los nuevos permisos
            if (rol.PermisoIds != null && rol.PermisoIds.Any())
            {
                foreach (var permisoId in rol.PermisoIds)
                {
                    rolExistente.RolPermiso.Add(new RolPermisoRE
                    {
                        RolID = id,
                        PermisoID = permisoId
                    });
                }
            }

            // Guardar cambios en la base de datos
            await _context.SaveChangesAsync();

            // ✅ INVALIDAR SESIONES DE USUARIOS CON ESTE ROL
            var usuariosConRol = await _context.UsuarioRoles
                .Where(ur => ur.RolId == id)
                .Select(ur => ur.UsuarioId)
                .ToListAsync();

            if (usuariosConRol.Any())
            {
                var sesionesActivas = await _context.SesionUsuario
                    .Where(s => usuariosConRol.Contains(s.UsuarioId.Value) && s.EstaActiva)
                    .ToListAsync();

                foreach (var sesion in sesionesActivas)
                {
                    sesion.EstaActiva = false;
                    sesion.FechaInvalidacion = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                // ✅ LIMPIAR CACHÉ DE PERMISOS INMEDIATAMENTE
                await LimpiarCachePermisos(usuariosConRol);
            }

            // Registrar en el historial la actualización exitosa
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 1,
                tipoAccion: "Actualización de Roles",
                modulo: "Roles",
                detalle: $"Rol con ID '{id}' actualizado exitosamente con {rol.PermisoIds?.Count ?? 0} permisos.",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Rol actualizado exitosamente." });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 1,
                tipoAccion: "Actualización de Roles",
                modulo: "Roles",
                detalle: "Error al actualizar el rol.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Eliminar un rol existente
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarRol(int id)
    {
        try
        {
            var rol = await _context.Roles
                .Include(r => r.RolPermiso) // Incluir relaciones con permisos
                .FirstOrDefaultAsync(r => r.RolId == id);

            if (rol == null)
            {
                // Registrar en el historial si el rol no existe
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 1,
                    tipoAccion: "Eliminación de Roles",
                    modulo: "Roles",
                    detalle: $"Intento fallido de eliminar rol. Rol con ID '{id}' no encontrado.",
                    estadoAccion: "Error",
                    errorDetalle: "Rol no encontrado."
                );

                return NotFound(new { Message = "Rol no encontrado." });
            }

            // Verificar si el rol está asociado con usuarios
            var tieneUsuarios = await _context.UsuarioRoles.AnyAsync(ur => ur.RolId == id);
            if (tieneUsuarios)
            {
                // Registrar en el historial el intento fallido
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 1,
                    tipoAccion: "Eliminación de Roles",
                    modulo: "Roles",
                    detalle: $"Intento fallido de eliminar rol. Rol con ID '{id}' está asociado a usuarios.",
                    estadoAccion: "Error",
                    errorDetalle: "Rol asociado a usuarios."
                );

                return BadRequest(new { Message = "No se puede eliminar un rol asociado a usuarios." });
            }

            // Eliminar asociaciones con permisos
            _context.RolPermisos.RemoveRange(rol.RolPermiso);

            // Eliminar el rol
            _context.Roles.Remove(rol);
            await _context.SaveChangesAsync();

            // Registrar en el historial la eliminación exitosa
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 1,
                tipoAccion: "Eliminación de Roles",
                modulo: "Roles",
                detalle: $"Rol con ID '{id}' eliminado exitosamente.",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Rol eliminado exitosamente." });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 1,
                tipoAccion: "Eliminación de Roles",
                modulo: "Roles",
                detalle: "Error al eliminar el rol.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Obtener permisos asociados a un rol
    /// <summary>
    /// Obtener los permisos asociados a un rol específico.
    /// </summary>
    /// <param name="id">ID del rol.</param>
    /// <returns>Lista de permisos asociados al rol.</returns>
    [HttpGet("obtener-permisos-del-rol/{id}")]
    public async Task<ActionResult> ObtenerPermisosDeRol(int id)
    {
        try
        {
            // Buscar el rol con sus permisos relacionados
            var rol = await _context.Roles
                .Include(r => r.RolPermiso)
                .ThenInclude(rp => rp.Permiso)
                .FirstOrDefaultAsync(r => r.RolId == id);

            // Validar si el rol existe
            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            // Obtener la lista de permisos asociados
            var permisos = rol.RolPermiso.Select(rp => rp.Permiso).ToList();

            return Ok(permisos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = $"Error al obtener permisos: {ex.Message}" });
        }
    }
    #endregion

    #region Agregar permisos a un rol
    /// <summary>
    /// Agregar permisos a un rol específico.
    /// </summary>
    /// <param name="id">ID del rol.</param>
    /// <param name="permisoIds">Lista de IDs de permisos a agregar.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    [HttpPost("agregar-permisos-al-rol/{id}")]
    public async Task<ActionResult> AgregarPermisosARol(int id, [FromBody] List<int> permisoIds)
    {
        try
        {
            // Buscar el rol
            var rol = await _context.Roles.Include(r => r.RolPermiso).FirstOrDefaultAsync(r => r.RolId == id);

            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            // Agregar permisos
            foreach (var permisoId in permisoIds)
            {
                if (!rol.RolPermiso.Any(rp => rp.PermisoID == permisoId))
                {
                    rol.RolPermiso.Add(new RolPermisoRE { RolID = id, PermisoID = permisoId });
                }
            }

            // Guardar cambios
            await _context.SaveChangesAsync();

            // Registrar en el historial
            await HistorialHelper.RegistrarHistorial(
                _httpClient,
                usuarioId: 1,
                tipoAccion: "Agregar permisos a rol",
                modulo: "Roles",
                detalle: $"Permisos agregados al rol ID {id}",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Permisos agregados exitosamente." });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                _httpClient,
                usuarioId: 1,
                tipoAccion: "Agregar permisos a rol",
                modulo: "Roles",
                detalle: $"Error al agregar permisos al rol ID {id}",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );
            return StatusCode(500, new { Message = $"Error: {ex.Message}" });
        }
    }
    #endregion

    #region Actualizar permisos de un rol
    /// <summary>
    /// Actualizar los permisos de un rol.
    /// </summary>
    /// <param name="rolId">ID del rol.</param>
    /// <param name="permisosIds">Lista de IDs de permisos nuevos.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    [HttpPut("actualizar-permisos-del-rol/{rolId}")]
    public async Task<IActionResult> ActualizarPermisosDeRol(int rolId, [FromBody] List<int> permisosIds)
    {
        try
        {
            var rol = await _context.Roles.Include(r => r.RolPermiso).FirstOrDefaultAsync(r => r.RolId == rolId);

            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            // Eliminar permisos no incluidos
            var permisosAEliminar = rol.RolPermiso.Where(rp => !permisosIds.Contains(rp.PermisoID)).ToList();
            foreach (var permiso in permisosAEliminar)
            {
                rol.RolPermiso.Remove(permiso);
            }

            // Agregar permisos nuevos
            var permisosAAgregar = permisosIds.Where(pid => !rol.RolPermiso.Any(rp => rp.PermisoID == pid)).ToList();
            foreach (var permisoId in permisosAAgregar)
            {
                rol.RolPermiso.Add(new RolPermisoRE { RolID = rolId, PermisoID = permisoId });
            }

            await _context.SaveChangesAsync();

            // Registrar en el historial
            await HistorialHelper.RegistrarHistorial(
                _httpClient,
                usuarioId: 1,
                tipoAccion: "Actualizar permisos de rol",
                modulo: "Roles",
                detalle: $"Permisos del rol ID {rolId} actualizados.",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Permisos actualizados exitosamente." });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                _httpClient,
                usuarioId: 1,
                tipoAccion: "Actualizar permisos de rol",
                modulo: "Roles",
                detalle: $"Error al actualizar permisos del rol ID {rolId}",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );
            return StatusCode(500, new { Message = $"Error: {ex.Message}" });
        }
    }
    #endregion

    #region Eliminar permisos de un rol
    /// <summary>
    /// Eliminar permisos específicos de un rol.
    /// </summary>
    /// <param name="id">ID del rol.</param>
    /// <param name="permisoIds">Lista de IDs de permisos a eliminar.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    [HttpDelete("eliminar-permisos-al-Rol/{id}")]
    public async Task<ActionResult> EliminarPermisosDeRol(int id, [FromBody] List<int> permisoIds)
    {
        try
        {
            var rol = await _context.Roles.Include(r => r.RolPermiso).FirstOrDefaultAsync(r => r.RolId == id);

            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            var permisosAEliminar = rol.RolPermiso.Where(rp => permisoIds.Contains(rp.PermisoID)).ToList();
            foreach (var permiso in permisosAEliminar)
            {
                rol.RolPermiso.Remove(permiso);
            }

            await _context.SaveChangesAsync();

            // Registrar en el historial
            await HistorialHelper.RegistrarHistorial(
                _httpClient,
                usuarioId: 1,
                tipoAccion: "Eliminar permisos de rol",
                modulo: "Roles",
                detalle: $"Permisos eliminados del rol ID {id}.",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Permisos eliminados exitosamente." });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                _httpClient,
                usuarioId: 1,
                tipoAccion: "Eliminar permisos de rol",
                modulo: "Roles",
                detalle: $"Error al eliminar permisos del rol ID {id}",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );
            return StatusCode(500, new { Message = $"Error: {ex.Message}" });
        }
    }
    #endregion

    /// <summary>
    /// Limpia el caché de permisos para usuarios específicos
    /// </summary>
    private async Task LimpiarCachePermisos(List<int> usuarioIds)
    {
        try
        {
            // Llamar al API de permisos para limpiar caché específico
            var requestData = new { usuarioIds = usuarioIds };
            
            var response = await _httpClient.PostAsJsonAsync("/api/permisos/limpiar-cache", requestData);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("✅ Caché de permisos limpiado para {Count} usuarios", usuarioIds.Count);
            }
            else
            {
                _logger.LogWarning("⚠️ No se pudo limpiar el caché de permisos");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error al limpiar caché de permisos");
        }
    }
}