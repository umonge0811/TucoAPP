using API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using tuco.Utilities;
using Tuco.Clases.Utilities;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

[ApiController]
[Route("api/[controller]")]
public class PermisosController : ControllerBase
{
    TucoContext _context;
    HttpClient _httpClient;

    public PermisosController(TucoContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient("TucoApi");
    }

    #region Creacion de Permisos
    [HttpPost("crear-permiso")]
    public async Task<IActionResult> CrearPermiso([FromBody] PermisoDTO permisoDTO)
    {
        try
        {

            // Validar si el permiso ya existe
            if (await _context.Permisos.AnyAsync(p => p.NombrePermiso == permisoDTO.NombrePermiso))
            {
                // Registrar intento fallido en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                    usuarioId: 1, // Método para obtener el ID del usuario
                    tipoAccion: "Creación de Permiso",
                    modulo: "Permisos",
                    detalle: $"Intento de crear permiso fallido. El permiso '{permisoDTO.NombrePermiso}' ya existe.",
                    estadoAccion: "Error",
                    errorDetalle: "El permiso ya existe."
                );

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

            // Registrar acción exitosa en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                usuarioId: 1, // Método para obtener el ID del usuario
                tipoAccion: "Creación de Permiso",
                modulo: "Permisos",
                detalle: $"Permiso creado exitosamente: {permisoDTO.NombrePermiso}",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Permiso creado exitosamente.", PermisoId = permiso.PermisoId });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                usuarioId: 1, // Método para obtener el ID del usuario
                tipoAccion: "Creación de Permiso",
                modulo: "Permisos",
                detalle: "Error al crear el permiso.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Consulta de Permisos
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
    #endregion

    #region actualizacion de permisos
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

         // Registrar intento fallido en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                    usuarioId: 1, // Método para obtener el ID del usuario
                    tipoAccion: "Actualización de Permiso",
                    modulo: "Permisos",
                    detalle: $" El permiso '{permiso.NombrePermiso}' Se actualizó.",
                    estadoAccion: "Exito",
                    errorDetalle: "El permiso se actualizó."
                );
        return Ok(new { Message = "Permiso actualizado exitosamente." });
    }

    #endregion

    #region Eliminacion de Permisos
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

        // Registrar intento fallido en el historial
        await HistorialHelper.RegistrarHistorial(
            httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
            usuarioId: 1, // Método para obtener el ID del usuario
            tipoAccion: "Eliminar de Permiso",
            modulo: "Permisos",
            detalle: $" El permiso '{permiso.NombrePermiso}' Se Eliminó.",
            estadoAccion: "Exito",
            errorDetalle: "Permiso eliminado."
            );


        return Ok(new { Message = "Permiso eliminado exitosamente." });
    }
    #endregion
}
