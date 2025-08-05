using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using tuco.Clases.DTOs;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class NotasRapidasController : Controller
    {
        private readonly INotasRapidasService _notasRapidasService;
        private readonly ILogger<NotasRapidasController> _logger;

        public NotasRapidasController(INotasRapidasService notasRapidasService, ILogger<NotasRapidasController> logger)
        {
            _notasRapidasService = notasRapidasService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerMisNotas()
        {
            try
            {
                var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioId))
                {
                    return Json(new { success = false, message = "Usuario no autenticado" });
                }

                var resultado = await _notasRapidasService.ObtenerNotasUsuarioAsync(int.Parse(usuarioId));

                return Json(new
                {
                    success = resultado.success,
                    data = resultado.notas,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener notas del usuario");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearNotaRapidaDTO notaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos inválidos" });
                }

                var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioId))
                {
                    return Json(new { success = false, message = "Usuario no autenticado" });
                }

                notaDto.UsuarioId = int.Parse(usuarioId);
                var resultado = await _notasRapidasService.CrearNotaAsync(notaDto);

                return Json(new
                {
                    success = resultado.success,
                    data = resultado.nota,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear nota rápida");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Eliminar(int id)
        {
            try
            {
                var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioId))
                {
                    return Json(new { success = false, message = "Usuario no autenticado" });
                }

                var resultado = await _notasRapidasService.EliminarNotaAsync(id, int.Parse(usuarioId));

                return Json(new
                {
                    success = resultado.success,
                    message = resultado.message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar nota rápida");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}