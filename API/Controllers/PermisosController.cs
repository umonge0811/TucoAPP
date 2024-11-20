using API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

[ApiController]
[Route("api/[controller]")]
public class PermisosController : ControllerBase
{
    private readonly TucoContext _context;

    public PermisosController(TucoContext context)
    {
        _context = context;
    }

    [HttpPost("crear Permiso")]
    public async Task<IActionResult> CrearPermiso([FromBody] PermisoDTO permisoDTO)
    {
        // Validar si el permiso ya existe
        if (await _context.Permisos.AnyAsync(p => p.NombrePermiso == permisoDTO.NombrePermiso))
        {
            return BadRequest(new { Message = "El permiso ya existe." });
        }

        // Crear la entidad Permiso desde el DTO
        var permiso = new Permiso
        {
            NombrePermiso = permisoDTO.NombrePermiso,
            DescripcionPermiso = permisoDTO.DescripcionPermiso
        };

        // Guardar en la base de datos
        _context.Permisos.Add(permiso);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Permiso creado exitosamente.", PermisoId = permiso.PermisoId });
    }

    // Obtener todos los permisos
    [HttpGet("obtener todos")]
    public async Task<ActionResult<List<Permiso>>> ObtenerPermisos()
    {
        return Ok(await _context.Permisos.ToListAsync());
    }

    // Obtener todos los permisos
    [HttpGet("obtener-por-id/{id}")]
    public async Task<ActionResult> ObtenerPermisosPorID(int id)
    {
        // Busca el permiso en la base de datos por su ID
        var permisoExistenteID = await _context.Permisos.FindAsync(id);
        // Verifica si el permiso existe
        if (permisoExistenteID == null)
        {
            // Retorna un error 404 si no se encuentra el permiso
            return NotFound(new { Message = "Permiso no encontrado." });
        }
        return Ok(permisoExistenteID);
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
