
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using API.Data;
using Tuco.Clases.Models;
using Tuco.Clases.DTOs;
using API.Extensions;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnunciosController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<AnunciosController> _logger;

        public AnunciosController(TucoContext context, ILogger<AnunciosController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtener todos los anuncios activos
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncios()
        {
            try
            {
                _logger.LogInformation("🔔 === OBTENIENDO ANUNCIOS ===");

                var anuncios = await _context.Anuncios
                    .Include(a => a.UsuarioCreador)
                    .Where(a => a.Activo)
                    .OrderByDescending(a => a.EsImportante)
                    .ThenByDescending(a => a.FechaCreacion)
                    .Select(a => new AnuncioDTO
                    {
                        AnuncioId = a.AnuncioId,
                        UsuarioCreadorId = a.UsuarioCreadorId,
                        NombreCreador = a.UsuarioCreador.NombreUsuario,
                        Titulo = a.Titulo,
                        Contenido = a.Contenido,
                        TipoAnuncio = a.TipoAnuncio,
                        Prioridad = a.Prioridad,
                        EsImportante = a.EsImportante,
                        Activo = a.Activo,
                        FechaCreacion = a.FechaCreacion,
                        FechaModificacion = a.FechaModificacion,
                        FechaVencimiento = a.FechaVencimiento
                    })
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} anuncios", anuncios.Count);

                return Ok(new { success = true, anuncios });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener anuncios");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener anuncio por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerAnuncio(int id)
        {
            try
            {
                _logger.LogInformation("🔔 === OBTENIENDO ANUNCIO {AnuncioId} ===", id);

                var anuncio = await _context.Anuncios
                    .Include(a => a.UsuarioCreador)
                    .Where(a => a.AnuncioId == id)
                    .Select(a => new AnuncioDTO
                    {
                        AnuncioId = a.AnuncioId,
                        UsuarioCreadorId = a.UsuarioCreadorId,
                        NombreCreador = a.UsuarioCreador.NombreUsuario,
                        Titulo = a.Titulo,
                        Contenido = a.Contenido,
                        TipoAnuncio = a.TipoAnuncio,
                        Prioridad = a.Prioridad,
                        EsImportante = a.EsImportante,
                        Activo = a.Activo,
                        FechaCreacion = a.FechaCreacion,
                        FechaModificacion = a.FechaModificacion,
                        FechaVencimiento = a.FechaVencimiento
                    })
                    .FirstOrDefaultAsync();

                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                _logger.LogInformation("✅ Anuncio encontrado: {Titulo}", anuncio.Titulo);

                return Ok(new { success = true, anuncio });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear nuevo anuncio
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearAnuncio([FromBody] CrearAnuncioDTO dto)
        {
            try
            {
                _logger.LogInformation("🔔 === CREANDO NUEVO ANUNCIO ===");

                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Datos de entrada inválidos", errors = ModelState });
                }

                var usuarioId = this.ObtenerIdUsuarioActual();
                if (!usuarioId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autorizado" });
                }

                var nuevoAnuncio = new Anuncio
                {
                    UsuarioCreadorId = usuarioId.Value,
                    Titulo = dto.Titulo.Trim(),
                    Contenido = dto.Contenido.Trim(),
                    TipoAnuncio = dto.TipoAnuncio ?? "General",
                    Prioridad = dto.Prioridad ?? "Normal",
                    EsImportante = dto.EsImportante,
                    FechaVencimiento = dto.FechaVencimiento,
                    FechaCreacion = DateTime.Now,
                    Activo = true
                };

                _context.Anuncios.Add(nuevoAnuncio);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Anuncio creado exitosamente. ID: {AnuncioId}, Título: {Titulo}", 
                    nuevoAnuncio.AnuncioId, nuevoAnuncio.Titulo);

                // Obtener el anuncio completo con la información del usuario
                var anuncioCompleto = await _context.Anuncios
                    .Include(a => a.UsuarioCreador)
                    .Where(a => a.AnuncioId == nuevoAnuncio.AnuncioId)
                    .Select(a => new AnuncioDTO
                    {
                        AnuncioId = a.AnuncioId,
                        UsuarioCreadorId = a.UsuarioCreadorId,
                        NombreCreador = a.UsuarioCreador.NombreUsuario,
                        Titulo = a.Titulo,
                        Contenido = a.Contenido,
                        TipoAnuncio = a.TipoAnuncio,
                        Prioridad = a.Prioridad,
                        EsImportante = a.EsImportante,
                        Activo = a.Activo,
                        FechaCreacion = a.FechaCreacion,
                        FechaModificacion = a.FechaModificacion,
                        FechaVencimiento = a.FechaVencimiento
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(ObtenerAnuncio), new { id = nuevoAnuncio.AnuncioId }, 
                    new { success = true, anuncio = anuncioCompleto, message = "Anuncio creado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear anuncio");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Actualizar anuncio existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarAnuncio(int id, [FromBody] ActualizarAnuncioDTO dto)
        {
            try
            {
                _logger.LogInformation("🔔 === ACTUALIZANDO ANUNCIO {AnuncioId} ===", id);

                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Datos de entrada inválidos", errors = ModelState });
                }

                var usuarioId = this.ObtenerIdUsuarioActual();
                if (!usuarioId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autorizado" });
                }

                var anuncio = await _context.Anuncios.FindAsync(id);
                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                // Verificar que el usuario sea el creador del anuncio o tenga permisos de administrador
                if (anuncio.UsuarioCreadorId != usuarioId.Value)
                {
                    // Aquí podrías agregar lógica para verificar si es administrador
                    return Forbid();
                }

                // Actualizar campos
                anuncio.Titulo = dto.Titulo.Trim();
                anuncio.Contenido = dto.Contenido.Trim();
                anuncio.TipoAnuncio = dto.TipoAnuncio ?? anuncio.TipoAnuncio;
                anuncio.Prioridad = dto.Prioridad ?? anuncio.Prioridad;
                anuncio.EsImportante = dto.EsImportante;
                anuncio.FechaVencimiento = dto.FechaVencimiento;
                anuncio.FechaModificacion = DateTime.Now;

                if (dto.Activo.HasValue)
                {
                    anuncio.Activo = dto.Activo.Value;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Anuncio actualizado exitosamente: {Titulo}", anuncio.Titulo);

                return Ok(new { success = true, message = "Anuncio actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar (desactivar) anuncio
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarAnuncio(int id)
        {
            try
            {
                _logger.LogInformation("🔔 === ELIMINANDO ANUNCIO {AnuncioId} ===", id);

                var usuarioId = this.ObtenerIdUsuarioActual();
                if (!usuarioId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autorizado" });
                }

                var anuncio = await _context.Anuncios.FindAsync(id);
                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                // Verificar que el usuario sea el creador del anuncio o tenga permisos de administrador
                if (anuncio.UsuarioCreadorId != usuarioId.Value)
                {
                    // Aquí podrías agregar lógica para verificar si es administrador
                    return Forbid();
                }

                // Desactivar en lugar de eliminar físicamente
                anuncio.Activo = false;
                anuncio.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Anuncio eliminado (desactivado) exitosamente: {Titulo}", anuncio.Titulo);

                return Ok(new { success = true, message = "Anuncio eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Cambiar estado activo/inactivo de un anuncio
        /// </summary>
        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoAnuncio(int id, [FromBody] bool activo)
        {
            try
            {
                _logger.LogInformation("🔔 === CAMBIANDO ESTADO ANUNCIO {AnuncioId} a {Estado} ===", id, activo ? "ACTIVO" : "INACTIVO");

                var usuarioId = this.ObtenerIdUsuarioActual();
                if (!usuarioId.HasValue)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autorizado" });
                }

                var anuncio = await _context.Anuncios.FindAsync(id);
                if (anuncio == null)
                {
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }

                // Verificar que el usuario sea el creador del anuncio o tenga permisos de administrador
                if (anuncio.UsuarioCreadorId != usuarioId.Value)
                {
                    return Forbid();
                }

                anuncio.Activo = activo;
                anuncio.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Estado del anuncio cambiado exitosamente a: {Estado}", activo ? "ACTIVO" : "INACTIVO");

                return Ok(new { success = true, message = $"Anuncio {(activo ? "activado" : "desactivado")} exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cambiar estado del anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}
