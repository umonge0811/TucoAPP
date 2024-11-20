using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Tuco.Clases.Models;
using System.Collections.Generic;
using API.Data;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly TucoContext _context;

    public RolesController(TucoContext context)
    {
        _context = context;
    }

    // Crear un nuevo rol
    [HttpPost("CrearRoles")]
    public async Task<IActionResult> CrearRol([FromBody] RoleDTO dto)
    {
        // Validar si ya existe un rol con el mismo nombre
        if (await _context.Roles.AnyAsync(r => r.NombreRol == dto.NombreRol))
        {
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
        await _context.SaveChangesAsync(); // Guardar cambios en la base de datos

        // Verificar si hay permisos asociados en el DTO
        if (dto.PermisoIds != null && dto.PermisoIds.Count > 0)
        {
            // Recorrer los IDs de permisos proporcionados y crear relaciones RolPermiso
            foreach (var permisoId in dto.PermisoIds)
            {
                var rolPermiso = new RolPermisoRE
                {
                    RolID = nuevoRol.RolId, // ID del rol recién creado
                    PermisoID = permisoId  // ID del permiso asociado
                };

                // Agregar la relación al contexto
                _context.RolPermisos.Add(rolPermiso);
            }

            // Guardar las relaciones en la base de datos
            await _context.SaveChangesAsync();
        }

        // Retornar respuesta exitosa con el ID del rol creado
        return Ok(new { Message = "Rol creado exitosamente.", RolId = nuevoRol.RolId });
    }

    // Obtener todos los roles
    [HttpGet("ObtenerTodosRoles")]
    public async Task<ActionResult<List<Role>>> ObtenerRoles()
    {
        var roles = await _context.Roles
            .Include(r => r.RolPermiso) // Incluir relaciones con permisos
            .ThenInclude(rp => rp.Permiso)
            .ToListAsync();

        return Ok(roles);
    }

    // Obtener todos los permisos
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


    // Actualizar un rol existente
    [HttpPut("actualizarRole/{id}")]
    public async Task<IActionResult> ActualizarRolporID(int id, [FromBody] RoleUpdateDTO rol)
    {
        var rolExistente = await _context.Roles.FindAsync(id);
        if (rolExistente == null)
        {
            return NotFound(new { Message = "Rol no encontrado." });
        }

        // Actualizar los campos necesarios
        rolExistente.NombreRol = rol.NombreRol;
        rolExistente.DescripcionRol = rol.DescripcionRol;

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Rol actualizado exitosamente." });
    }

    // Eliminar un rol existente
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarRol(int id)
    {
        var rol = await _context.Roles
            .Include(r => r.RolPermiso) // Incluir relaciones con permisos
            .FirstOrDefaultAsync(r => r.RolId == id);

        if (rol == null)
        {
            return NotFound(new { Message = "Rol no encontrado." });
        }

        // Verificar si el rol está asociado con usuarios
        var tieneUsuarios = await _context.UsuarioRoles.AnyAsync(ur => ur.RolId == id);
        if (tieneUsuarios)
        {
            return BadRequest(new { Message = "No se puede eliminar un rol asociado a usuarios." });
        }

        // Eliminar asociaciones con permisos
        _context.RolPermisos.RemoveRange(rol.RolPermiso);

        // Eliminar el rol
        _context.Roles.Remove(rol);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Rol eliminado exitosamente." });
    }


    /*CRUD DE PERMISOS A ASOCIADOS A LOS ROLES*/


    // Obtener permisos asociados a un rol
    [HttpGet("obtener-permisos-del-rol/{id}")]
    public async Task<ActionResult> ObtenerPermisosDeRol(int id)
    {
        // Buscar el rol con su relación de permisos
        var rol = await _context.Roles
            .Include(r => r.RolPermiso) // Incluir la relación RolPermiso
            .ThenInclude(rp => rp.Permiso) // Incluir detalles de los permisos en RolPermiso
            .FirstOrDefaultAsync(r => r.RolId == id); // Filtrar por el ID del rol

        // Validar si el rol existe
        if (rol == null)
        {
            return NotFound(new { Message = "Rol no encontrado." }); // Retorna un error 404 si no se encuentra el rol
        }

        // Obtener la lista de permisos asociados al rol
        var permisos = rol.RolPermiso.Select(rp => rp.Permiso).ToList();

        // Retornar la lista de permisos
        return Ok(permisos);
    }


    // Agregar permisos a un rol
    [HttpPost("agregar-permisos-al-rol/{id}")]
    public async Task<ActionResult> AgregarPermisosARol(int id, [FromBody] List<int> permisoIds)
    {
        // Buscar el rol por ID e incluir su relación RolPermiso
        var rol = await _context.Roles
            .Include(r => r.RolPermiso) // Incluir la relación RolPermiso
            .FirstOrDefaultAsync(r => r.RolId == id); // Filtrar por el ID del rol

        // Validar si el rol existe
        if (rol == null)
        {
            return NotFound(new { Message = "Rol no encontrado." }); // Retorna un error 404 si no se encuentra el rol
        }

        // Iterar sobre los IDs de los permisos recibidos
        foreach (var permisoId in permisoIds)
        {
            // Validar si el permiso no está ya asociado al rol
            if (!rol.RolPermiso.Any(rp => rp.PermisoID == permisoId))
            {
                // Agregar la relación entre el rol y el permiso
                rol.RolPermiso.Add(new RolPermisoRE { RolID = id, PermisoID = permisoId });
            }
        }

        // Guardar los cambios en la base de datos
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Permisos agregados exitosamente." }); // Retornar éxito
    }

    // Actualizar permisos de un rol existente
    [HttpPut("actualizar-permisos-del-rol/{rolId}")]
    public async Task<IActionResult> ActualizarPermisosDeRol(int rolId, [FromBody] List<int> permisosIds)
    {
        // Busca el rol en la base de datos
        var rolExistente = await _context.Roles
            .Include(r => r.RolPermiso)
            .FirstOrDefaultAsync(r => r.RolId == rolId);

        // Verifica si el rol existe
        if (rolExistente == null)
        {
            return NotFound(new { Message = "Rol no encontrado." });
        }

        // Eliminar los permisos actuales no incluidos en la nueva lista
        var permisosAEliminar = rolExistente.RolPermiso
            .Where(rp => !permisosIds.Contains(rp.PermisoID))
            .ToList(); // Convertir a lista para poder iterar

        foreach (var permiso in permisosAEliminar)
        {
            rolExistente.RolPermiso.Remove(permiso); // Remover de la colección
        }

        // Agregar nuevos permisos que no están ya asociados al rol
        var permisosAAgregar = permisosIds
            .Where(pid => !rolExistente.RolPermiso.Any(rp => rp.PermisoID == pid))
            .ToList();

        foreach (var permisoId in permisosAAgregar)
        {
            rolExistente.RolPermiso.Add(new RolPermisoRE
            {
                RolID = rolId,
                PermisoID = permisoId
            });
        }

        // Guardar los cambios en la base de datos
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Permisos actualizados exitosamente." });
    }



    // Eliminar permisos específicos de un rol
    [HttpDelete("eliminar-permisos-al-Rol/{id}")]
    public async Task<ActionResult> EliminarPermisosDeRol(int id, [FromBody] List<int> permisoIds)
    {
        // Buscar el rol por ID e incluir su relación RolPermiso
        var rol = await _context.Roles
            .Include(r => r.RolPermiso) // Incluir la relación RolPermiso
            .FirstOrDefaultAsync(r => r.RolId == id); // Filtrar por el ID del rol

        // Validar si el rol existe
        if (rol == null)
        {
            return NotFound(new { Message = "Rol no encontrado." }); // Retorna un error 404 si no se encuentra el rol
        }

        // Identificar las relaciones de permisos que deben ser eliminadas
        var permisosAEliminar = rol.RolPermiso
            .Where(rp => permisoIds.Contains(rp.PermisoID)) // Filtrar los permisos a eliminar
            .ToList(); // Convertir a lista para iterar

        // Eliminar las relaciones de permisos de la colección
        foreach (var permiso in permisosAEliminar)
        {
            rol.RolPermiso.Remove(permiso); // Remover cada permiso
        }

        // Guardar los cambios en la base de datos
        await _context.SaveChangesAsync();

        // Verificar si el rol ya no tiene permisos asociados
        if (!rol.RolPermiso.Any())
        {
            return Ok(new { Message = "Permisos eliminados exitosamente. El rol ya no tiene permisos asociados." });
        }

        return Ok(new { Message = "Permisos eliminados exitosamente." }); // Retornar éxito
    }


    // Eliminar todos los permisos de un rol
    [HttpDelete("eliminar-todos-permisos/{id}")]
    public async Task<ActionResult> EliminarTodosPermisosDeRol(int id)
    {
        // Buscar el rol por ID e incluir su relación RolPermiso
        var rol = await _context.Roles
            .Include(r => r.RolPermiso) // Incluir la relación RolPermiso
            .FirstOrDefaultAsync(r => r.RolId == id); // Filtrar por el ID del rol

        // Validar si el rol existe
        if (rol == null)
        {
            return NotFound(new { Message = "Rol no encontrado." }); // Retorna un error 404 si no se encuentra el rol
        }

        // Verificar si el rol no tiene permisos
        if (!rol.RolPermiso.Any())
        {
            return BadRequest(new { Message = "El rol no tiene permisos para eliminar." }); // Retornar error si no hay permisos
        }

        // Eliminar todas las relaciones de permisos
        rol.RolPermiso.Clear();

        // Guardar los cambios en la base de datos
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Todos los permisos han sido eliminados del rol." }); // Retornar éxito
    }






}

