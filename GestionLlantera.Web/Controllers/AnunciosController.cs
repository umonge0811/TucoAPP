
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using tuco.Clases.DTOs;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class AnunciosController : Controller
    {
        private readonly IAnunciosService _anunciosService;
        private readonly ILogger<AnunciosController> _logger;

        public AnunciosController(IAnunciosService anunciosService, ILogger<AnunciosController> logger)
        {
            _anunciosService = anunciosService;
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

        /// <summary>
        /// Obtiene el ID del usuario autenticado.
        /// </summary>
        /// <returns>El ID del usuario como string, o null si no se encuentra.</returns>
        private int GetUsuarioId()
        {
            var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId))
            {
                throw new InvalidOperationException("Usuario no autenticado o ID de usuario no encontrado.");
            }
            return int.Parse(usuarioId);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncios()
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.ObtenerAnunciosAsync(token);

                return Json(new
                {
                    success = resultado.success,
                    data = resultado.anuncios,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener anuncios");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearAnuncioDTO anuncioDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos inválidos" });
                }

                var usuarioId = GetUsuarioId();
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                anuncioDto.UsuarioId = usuarioId;
                var resultado = await _anunciosService.CrearAnuncioAsync(anuncioDto, token);

                return Json(new
                {
                    success = resultado.success,
                    data = resultado.anuncio,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarAnuncioDTO request)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var response = await _anunciosService.ActualizarAnuncioAsync(request, id, token);

                return Json(new { success = response.success, message = response.mensaje, data = response.anuncio });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Eliminar(int id)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.EliminarAnuncioAsync(id, usuarioId, token);

                return Json(new
                {
                    success = resultado.success,
                    message = resultado.message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPatch]
        public async Task<IActionResult> CambiarEstado([FromBody] CambiarEstadoRequest request)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.CambiarEstadoAsync(request.AnuncioId, request.EsActivo, usuarioId, token);

                return Json(new
                {
                    success = resultado.success,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado del anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }

    public class CambiarEstadoRequest
    {
        public int AnuncioId { get; set; }
        public bool EsActivo { get; set; }
    }
}
