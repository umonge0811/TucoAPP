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
}

