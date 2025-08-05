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

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        /// <returns>El token JWT o null si no se encuentra</returns>
        private string? ObtenerTokenJWT()
        {
            // Intentar diferentes métodos para obtener el token, igual que otros controladores
            var token = User.FindFirst("jwt_token")?.Value;
            
            if (string.IsNullOrEmpty(token))
            {
                token = User.FindFirst("JwtToken")?.Value;
            }
            
            if (string.IsNullOrEmpty(token))
            {
                token = User.FindFirst("access_token")?.Value;
            }

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
                _logger.LogDebug("📋 Claims disponibles: {Claims}", 
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            }
            else
            {
                _logger.LogDebug("✅ Token JWT obtenido correctamente para usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }

            return token;
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

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _notasRapidasService.ObtenerNotasUsuarioAsync(int.Parse(usuarioId), token);

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

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                notaDto.UsuarioId = int.Parse(usuarioId);
                var resultado = await _notasRapidasService.CrearNotaAsync(notaDto, token);

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

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _notasRapidasService.EliminarNotaAsync(id, int.Parse(usuarioId), token);

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

        [HttpPatch]
        public async Task<IActionResult> CambiarFavorita([FromBody] CambiarFavoritaRequest request)
        {
            try
            {
                var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioId))
                {
                    return Json(new { success = false, message = "Usuario no autenticado" });
                }

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _notasRapidasService.CambiarFavoritaAsync(request.NotaId, request.EsFavorita, int.Parse(usuarioId), token);

                return Json(new
                {
                    success = resultado.success,
                    message = resultado.message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado favorita");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

    }

    public class CambiarFavoritaRequest
    {
        public int NotaId { get; set; }
        public bool EsFavorita { get; set; }
    }
}