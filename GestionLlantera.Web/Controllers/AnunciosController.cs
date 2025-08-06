
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tuco.Clases.DTOs;

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
                token = Request.Cookies["JwtToken"];
            }

            if (string.IsNullOrEmpty(token))
            {
                // Último intento: buscar en headers
                if (Request.Headers.ContainsKey("Authorization"))
                {
                    var authHeader = Request.Headers["Authorization"].ToString();
                    if (authHeader.StartsWith("Bearer "))
                    {
                        token = authHeader.Substring(7);
                    }
                }
            }

            return token;
        }

        /// <summary>
        /// Obtener ID del usuario desde los claims
        /// </summary>
        private int GetUsuarioId()
        {
            try
            {
                var userIdClaim = User.FindFirst("userId")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }

                var nameIdentifierClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(nameIdentifierClaim) && int.TryParse(nameIdentifierClaim, out int userIdFromNameIdentifier))
                {
                    return userIdFromNameIdentifier;
                }

                _logger.LogWarning("No se pudo obtener el ID del usuario de los claims");
                return 4; // Fallback
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ID del usuario");
                return 4; // Fallback
            }
        }

        /// <summary>
        /// Obtener todos los anuncios activos
        /// </summary>
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
                    anuncios = resultado.anuncios,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener anuncios");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtener un anuncio específico por ID
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncio(int id)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.ObtenerAnuncioPorIdAsync(id, token);

                return Json(new
                {
                    success = resultado.success,
                    anuncio = resultado.anuncio,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Crear nuevo anuncio
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearAnuncio([FromBody] CrearAnuncioDTO anuncioDto)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.CrearAnuncioAsync(anuncioDto, token);

                return Json(new
                {
                    success = resultado.success,
                    anuncio = resultado.anuncio,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Actualizar anuncio existente
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> ActualizarAnuncio(int id, [FromBody] ActualizarAnuncioDTO anuncioDto)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.ActualizarAnuncioAsync(id, anuncioDto, token);

                return Json(new
                {
                    success = resultado.success,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Eliminar (desactivar) anuncio
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> EliminarAnuncio(int id)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Token de autenticación no válido" });
                }

                var resultado = await _anunciosService.EliminarAnuncioAsync(id, token);

                return Json(new
                {
                    success = resultado.success,
                    message = resultado.mensaje
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }

    // DTOs para el controlador Web
    public class CrearAnuncioDTO
    {
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public string? TipoAnuncio { get; set; }
        public string? Prioridad { get; set; }
        public bool EsImportante { get; set; }
        public DateTime? FechaVencimiento { get; set; }
    }

    public class ActualizarAnuncioDTO
    {
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public string? TipoAnuncio { get; set; }
        public string? Prioridad { get; set; }
        public bool EsImportante { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public bool? Activo { get; set; }
    }
}
