
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.DTOs;
using System.Security.Claims;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class NotasRapidasController : Controller
    {
        private readonly INotasRapidasService _notasRapidasService;
        private readonly ILogger<NotasRapidasController> _logger;

        public NotasRapidasController(
            INotasRapidasService notasRapidasService,
            ILogger<NotasRapidasController> logger)
        {
            _notasRapidasService = notasRapidasService;
            _logger = logger;
        }

        /// <summary>
        /// Obtener todas las notas del usuario actual
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerNotas()
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var resultado = await _notasRapidasService.ObtenerNotasUsuarioAsync(usuarioId);

                if (resultado.success)
                {
                    return Json(new { success = true, notas = resultado.notas });
                }

                return Json(new { success = false, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo notas del usuario");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear una nueva nota
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearNota([FromBody] CrearNotaRapidaDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos inválidos" });
                }

                request.UsuarioId = GetUsuarioId();
                var resultado = await _notasRapidasService.CrearNotaAsync(request);

                if (resultado.success)
                {
                    return Json(new { 
                        success = true, 
                        message = "Nota creada exitosamente",
                        nota = resultado.nota 
                    });
                }

                return Json(new { success = false, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando nota");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Actualizar una nota existente
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> ActualizarNota([FromBody] ActualizarNotaRapidaDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos inválidos" });
                }

                var usuarioId = GetUsuarioId();
                var resultado = await _notasRapidasService.ActualizarNotaAsync(request, usuarioId);

                if (resultado.success)
                {
                    return Json(new { 
                        success = true, 
                        message = "Nota actualizada exitosamente",
                        nota = resultado.nota 
                    });
                }

                return Json(new { success = false, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando nota");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar una nota
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> EliminarNota(int notaId)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var resultado = await _notasRapidasService.EliminarNotaAsync(notaId, usuarioId);

                if (resultado.success)
                {
                    return Json(new { 
                        success = true, 
                        message = "Nota eliminada exitosamente" 
                    });
                }

                return Json(new { success = false, message = resultado.message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando nota");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Marcar/desmarcar nota como favorita
        /// </summary>
        [HttpPatch]
        public async Task<IActionResult> CambiarFavorita([FromBody] CambiarFavoritaDTO request)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var resultado = await _notasRapidasService.CambiarFavoritaAsync(request.NotaId, request.EsFavorita, usuarioId);

                if (resultado.success)
                {
                    return Json(new { 
                        success = true, 
                        message = resultado.EsFavorita ? "Nota marcada como favorita" : "Nota desmarcada como favorita",
                        nota = resultado.nota 
                    });
                }

                return Json(new { success = false, message = resultado.mensaje });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cambiando estado favorita");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener el ID del usuario actual desde los claims
        /// </summary>
        private int GetUsuarioId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("UserId")?.Value ??
                             User.FindFirst("sub")?.Value;

            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("No se pudo obtener el ID del usuario");
        }
    }

    /// <summary>
    /// DTO para cambiar estado favorita
    /// </summary>
    public class CambiarFavoritaDTO
    {
        public int NotaId { get; set; }
        public bool EsFavorita { get; set; }
    }
}
