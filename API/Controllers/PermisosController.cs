using API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;

[ApiController]
[Route("api/[controller]")]
public class PermisosController : ControllerBase
{
    private readonly TucoContext _context;

    public PermisosController(TucoContext context)
    {
        _context = context;
    }

    // Crear un nuevo permiso
    [HttpPost("crear")]
    public async Task<IActionResult> CrearPermiso([FromBody] Permiso permiso)
    {
        if (await _context.Permisos.AnyAsync(p => p.NombrePermiso == permiso.NombrePermiso))
        {
            return BadRequest(new { Message = "El permiso ya existe." });
        }

        _context.Permisos.Add(permiso);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Permiso creado exitosamente." });
    }

    // Obtener todos los permisos
    [HttpGet("obtener-todos")]
    public async Task<ActionResult<List<Permiso>>> ObtenerPermisos()
    {
        return Ok(await _context.Permisos.ToListAsync());
    }

    // Actualizar un permiso existente
    [HttpPut("actualizar/{id}")]
    public async Task<IActionResult> ActualizarPermiso(int id, [FromBody] Permiso permiso)
    {
        var permisoExistente = await _context.Permisos.FindAsync(id);
        if (permisoExistente == null)
        {
            return NotFound(new { Message = "Permiso no encontrado." });
        }

        permisoExistente.NombrePermiso = permiso.NombrePermiso;
        permisoExistente.DescripcionPermiso = permiso.DescripcionPermiso;

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Permiso actualizado exitosamente." });
    }

    // Eliminar un permiso existente
    [HttpDelete("eliminar/{id}")]
    public async Task<IActionResult> EliminarPermiso(int id)
    {
        var permiso = await _context.Permisos.FindAsync(id);
        if (permiso == null)
        {
            return NotFound(new { Message = "Permiso no encontrado." });
        }

        _context.Permisos.Remove(permiso);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Permiso eliminado exitosamente." });
    }
}
