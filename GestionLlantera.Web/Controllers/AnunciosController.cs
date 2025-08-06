
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using GestionLlantera.Web.Services.Interfaces;
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
        /// Método privado para obtener el token de autenticación
        /// </summary>
        private async Task<string?> ObtenerTokenAsync()
        {
            try
            {
                var token = await HttpContext.GetTokenAsync("access_token");
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ No se encontró token de acceso");
                }
                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo token de autenticación");
                return null;
            }
        }

        /// <summary>
        /// Vista principal de anuncios
        /// </summary>
        public async Task<IActionResult> Index()
        {
            try
            {
                _logger.LogInformation("🔔 === CARGANDO VISTA DE ANUNCIOS ===");
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cargar vista de anuncios");
                return View("Error");
            }
        }

        /// <summary>
        /// API: Obtener todos los anuncios
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncios()
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncios desde API");

                var token = await ObtenerTokenAsync();
                var resultado = await _anunciosService.ObtenerAnunciosAsync(token);

                if (resultado.success)
                {
                    return Json(new { success = true, data = resultado.anuncios });
                }
                else
                {
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener anuncios");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API: Obtener anuncio por ID
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncioPorId(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncio {AnuncioId}", id);

                var token = await ObtenerTokenAsync();
                var resultado = await _anunciosService.ObtenerAnuncioPorIdAsync(id, token);

                if (resultado.success)
                {
                    return Json(new { success = true, data = resultado.anuncio });
                }
                else
                {
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API: Crear nuevo anuncio
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearAnuncio([FromBody] CrearAnuncioDTO anuncioDto)
        {
            try
            {
                _logger.LogInformation("🔔 Creando nuevo anuncio: {Titulo}", anuncioDto.Titulo);

                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos de entrada inválidos" });
                }

                var token = await ObtenerTokenAsync();
                var resultado = await _anunciosService.CrearAnuncioAsync(anuncioDto, token);

                if (resultado.success)
                {
                    return Json(new { success = true, data = resultado.anuncio, message = "Anuncio creado exitosamente" });
                }
                else
                {
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API: Actualizar anuncio existente
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> ActualizarAnuncio(int id, [FromBody] ActualizarAnuncioDTO anuncioDto)
        {
            try
            {
                _logger.LogInformation("🔔 Actualizando anuncio {AnuncioId}: {Titulo}", id, anuncioDto.Titulo);

                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos de entrada inválidos" });
                }

                var token = await ObtenerTokenAsync();
                var resultado = await _anunciosService.ActualizarAnuncioAsync(id, anuncioDto, token);

                if (resultado.success)
                {
                    return Json(new { success = true, message = resultado.message });
                }
                else
                {
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API: Eliminar anuncio
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> EliminarAnuncio(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Eliminando anuncio {AnuncioId}", id);

                var token = await ObtenerTokenAsync();
                var resultado = await _anunciosService.EliminarAnuncioAsync(id, token);

                if (resultado.success)
                {
                    return Json(new { success = true, message = resultado.message });
                }
                else
                {
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API: Cambiar estado de anuncio (activo/inactivo)
        /// </summary>
        [HttpPatch]
        public async Task<IActionResult> CambiarEstadoAnuncio(int id, [FromBody] bool activo)
        {
            try
            {
                _logger.LogInformation("🔔 Cambiando estado del anuncio {AnuncioId} a {Estado}", id, activo ? "ACTIVO" : "INACTIVO");

                var token = await ObtenerTokenAsync();
                var resultado = await _anunciosService.CambiarEstadoAnuncioAsync(id, activo, token);

                if (resultado.success)
                {
                    return Json(new { success = true, message = resultado.message });
                }
                else
                {
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cambiar estado del anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}
