using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Tuco.Clases.Models;
using System.Collections.Generic;
using API.Data;
using tuco.Clases.Models;

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
    [HttpPost("crear")]
    public async Task<IActionResult> CrearRol([FromBody] Role rol)
    {
        if (await _context.Roles.AnyAsync(r => r.NombreRol == rol.NombreRol))
        {
            return BadRequest(new { Message = "El rol ya existe." });
        }

        _context.Roles.Add(rol);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Rol creado exitosamente." });
    }

    // Obtener todos los roles
    [HttpGet("obtener-todos")]
    public async Task<ActionResult<List<Role>>> ObtenerRoles()
    {
        return Ok(await _context.Roles.ToListAsync());
    }

    // Actualizar un rol existente
    [HttpPut("actualizar/{id}")]
    public async Task<IActionResult> ActualizarRol(int id, [FromBody] Role rol)
    {
        var rolExistente = await _context.Roles.FindAsync(id);
        if (rolExistente == null)
        {
            return NotFound(new { Message = "Rol no encontrado." });
        }

        rolExistente.NombreRol = rol.NombreRol;
        rolExistente.DescripcionRol = rol.DescripcionRol;

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Rol actualizado exitosamente." });
    }

    // Eliminar un rol existente
    [HttpDelete("eliminar/{id}")]
    public async Task<IActionResult> EliminarRol(int id)
    {
        var rol = await _context.Roles.FindAsync(id);
        if (rol == null)
        {
            return NotFound(new { Message = "Rol no encontrado." });
        }

        _context.Roles.Remove(rol);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Rol eliminado exitosamente." });
    }
}
