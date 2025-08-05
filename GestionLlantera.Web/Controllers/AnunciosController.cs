
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

                var resultado = await _anunciosService.ObtenerAnunciosAsync();

                if (resultado.success)
                {
                    return Json(new { success = true, anuncios = resultado.anuncios });
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
        public async Task<IActionResult> ObtenerAnuncio(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncio {AnuncioId}", id);

                var resultado = await _anunciosService.ObtenerAnuncioPorIdAsync(id);

                if (resultado.success)
                {
                    return Json(new { success = true, anuncio = resultado.anuncio });
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

                var resultado = await _anunciosService.CrearAnuncioAsync(anuncioDto);

                if (resultado.success)
                {
                    return Json(new { success = true, anuncio = resultado.anuncio, message = "Anuncio creado exitosamente" });
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

                var resultado = await _anunciosService.ActualizarAnuncioAsync(id, anuncioDto);

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

                var resultado = await _anunciosService.EliminarAnuncioAsync(id);

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

                var resultado = await _anunciosService.CambiarEstadoAnuncioAsync(id, activo);

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
