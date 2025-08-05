
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tuco.Clases.DTOs;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotasRapidasController : ControllerBase
    {
        private readonly INotasRapidasService _notasRapidasService;
        private readonly ILogger<NotasRapidasController> _logger;

        public NotasRapidasController(INotasRapidasService notasRapidasService, ILogger<NotasRapidasController> logger)
        {
            _notasRapidasService = notasRapidasService;
            _logger = logger;
        }

        private int ObtenerUsuarioId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        /// <summary>
        /// Obtener todas las notas del usuario autenticado
        /// GET: api/NotasRapidas
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerNotasUsuario()
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                var resultado = await _notasRapidasService.ObtenerNotasUsuarioAsync(usuarioId);

                if (!resultado.success)
                {
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }

                return Ok(new { success = true, data = resultado.notas, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo notas del usuario");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener una nota específica por ID
        /// GET: api/NotasRapidas/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerNotaPorId(int id)
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                var resultado = await _notasRapidasService.ObtenerNotaPorIdAsync(id, usuarioId);

                if (!resultado.success)
                {
                    return NotFound(new { success = false, message = resultado.mensaje });
                }

                return Ok(new { success = true, data = resultado.nota, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo nota {NotaId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear una nueva nota
        /// POST: api/NotasRapidas
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearNota([FromBody] CrearNotaRapidaDTO notaDto)
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                if (string.IsNullOrWhiteSpace(notaDto.Titulo) || string.IsNullOrWhiteSpace(notaDto.Contenido))
                {
                    return BadRequest(new { success = false, message = "Título y contenido son requeridos" });
                }

                var resultado = await _notasRapidasService.CrearNotaAsync(notaDto, usuarioId);

                if (!resultado.success)
                {
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }

                return CreatedAtAction(nameof(ObtenerNotaPorId), new { id = resultado.nota.NotaId }, 
                    new { success = true, data = resultado.nota, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando nota");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Actualizar una nota existente
        /// PUT: api/NotasRapidas/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarNota(int id, [FromBody] ActualizarNotaRapidaDTO notaDto)
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                if (id != notaDto.NotaId)
                {
                    return BadRequest(new { success = false, message = "ID de nota no coincide" });
                }

                if (string.IsNullOrWhiteSpace(notaDto.Titulo) || string.IsNullOrWhiteSpace(notaDto.Contenido))
                {
                    return BadRequest(new { success = false, message = "Título y contenido son requeridos" });
                }

                var resultado = await _notasRapidasService.ActualizarNotaAsync(notaDto, usuarioId);

                if (!resultado.success)
                {
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }

                return Ok(new { success = true, data = resultado.nota, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando nota {NotaId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar una nota
        /// DELETE: api/NotasRapidas/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarNota(int id)
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                var resultado = await _notasRapidasService.EliminarNotaAsync(id, usuarioId);

                if (!resultado.success)
                {
                    return NotFound(new { success = false, message = resultado.mensaje });
                }

                return Ok(new { success = true, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando nota {NotaId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Buscar notas por término
        /// GET: api/NotasRapidas/buscar?termino={termino}
        /// </summary>
        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarNotas([FromQuery] string termino)
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                if (string.IsNullOrWhiteSpace(termino))
                {
                    return BadRequest(new { success = false, message = "Término de búsqueda es requerido" });
                }

                var resultado = await _notasRapidasService.BuscarNotasAsync(termino, usuarioId);

                if (!resultado.success)
                {
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }

                return Ok(new { success = true, data = resultado.notas, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error buscando notas");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener notas favoritas del usuario
        /// GET: api/NotasRapidas/favoritas
        /// </summary>
        [HttpGet("favoritas")]
        public async Task<IActionResult> ObtenerNotasFavoritas()
        {
            try
            {
                var usuarioId = ObtenerUsuarioId();
                if (usuarioId == 0)
                {
                    return Unauthorized(new { success = false, message = "Usuario no autenticado" });
                }

                var resultado = await _notasRapidasService.ObtenerNotasFavoritasAsync(usuarioId);

                if (!resultado.success)
                {
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }

                return Ok(new { success = true, data = resultado.notas, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo notas favoritas");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}
