using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Controllers
{
    // Este atributo asegura que solo usuarios autenticados puedan acceder
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ILogger<DashboardController> _logger;
        private readonly IDashboardService _dashboardService;
        // Se asume que tienes un servicio para gestionar anuncios
        private readonly IAnunciosService _anunciosService; 

        public DashboardController(ILogger<DashboardController> logger, IDashboardService dashboardService, IAnunciosService anunciosService)
        {
            _logger = logger;
            _dashboardService = dashboardService;
            _anunciosService = anunciosService; // Inicializar el servicio de anuncios
        }

        public IActionResult Index()
        {
            // Especificamos que use el layout administrativo
            ViewData["Layout"] = "_AdminLayout";
            return View();
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
        public async Task<IActionResult> ObtenerAlertasStock()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo alertas de stock para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerAlertasStockAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo alertas: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Alertas de stock obtenidas correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo alertas de stock");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerInventarioTotal()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo estadísticas de inventario total para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerInventarioTotalAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo inventario total: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Estadísticas de inventario total obtenidas correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo estadísticas de inventario total");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTopVendedor()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo top vendedor para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerTopVendedorAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo top vendedor: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Top vendedor obtenido correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo top vendedor");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerUsuariosConectados()
        {
            try
            {
                _logger.LogInformation("👥 Obteniendo usuarios conectados para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerUsuariosConectadosAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo usuarios conectados: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Usuarios conectados obtenidos correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo usuarios conectados");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        // Métodos para la gestión de Anuncios

        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncios()
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncios desde el servicio...");

                var (success, anuncios, message) = await _anunciosService.ObtenerAnunciosAsync();

                if (success)
                {
                    _logger.LogInformation("✅ Anuncios obtenidos exitosamente. Total: {Count}", anuncios.Count);
                    return Json(new { success = true, data = anuncios });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudieron obtener los anuncios: {Message}", message);
                    return Json(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo anuncios");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncioPorId(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncio {AnuncioId} desde el servicio...", id);

                var (success, anuncio, message) = await _anunciosService.ObtenerAnuncioPorIdAsync(id);

                if (success && anuncio != null)
                {
                    _logger.LogInformation("✅ Anuncio obtenido exitosamente: {Titulo}", anuncio.Titulo);
                    return Json(new { success = true, data = anuncio });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo obtener el anuncio {AnuncioId}: {Message}", id, message);
                    return Json(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearAnuncio([FromBody] CrearAnuncioDTO anuncioDto)
        {
            try
            {
                _logger.LogInformation("🔔 Creando nuevo anuncio - Datos recibidos: {@AnuncioDto}", anuncioDto);

                if (anuncioDto == null)
                {
                    _logger.LogWarning("⚠️ AnuncioDto es null");
                    return Json(new { success = false, message = "No se recibieron datos del anuncio" });
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    _logger.LogWarning("⚠️ ModelState inválido: {Errors}", string.Join(", ", errors));
                    return Json(new { success = false, message = "Datos de entrada inválidos: " + string.Join(", ", errors) });
                }

                if (string.IsNullOrWhiteSpace(anuncioDto.Titulo))
                {
                    _logger.LogWarning("⚠️ Título del anuncio está vacío");
                    return Json(new { success = false, message = "El título del anuncio es requerido" });
                }

                if (string.IsNullOrWhiteSpace(anuncioDto.Contenido))
                {
                    _logger.LogWarning("⚠️ Contenido del anuncio está vacío");
                    return Json(new { success = false, message = "El contenido del anuncio es requerido" });
                }

                _logger.LogInformation("🔔 Creando nuevo anuncio: {Titulo}", anuncioDto.Titulo);

                var (success, anuncio, message) = await _anunciosService.CrearAnuncioAsync(anuncioDto);

                if (success)
                {
                    _logger.LogInformation("✅ Anuncio creado exitosamente: {Titulo}", anuncio?.Titulo);
                    return Json(new { success = true, data = anuncio, message });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo crear el anuncio: {Message}", message);
                    return Json(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando anuncio");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

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

                var (success, message) = await _anunciosService.ActualizarAnuncioAsync(id, anuncioDto);

                if (success)
                {
                    _logger.LogInformation("✅ Anuncio actualizado exitosamente: {AnuncioId}", id);
                    return Json(new { success = true, message });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo actualizar el anuncio {AnuncioId}: {Message}", id, message);
                    return Json(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> EliminarAnuncio(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Eliminando anuncio {AnuncioId}", id);

                var (success, message) = await _anunciosService.EliminarAnuncioAsync(id);

                if (success)
                {
                    _logger.LogInformation("✅ Anuncio eliminado exitosamente: {AnuncioId}", id);
                    return Json(new { success = true, message });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo eliminar el anuncio {AnuncioId}: {Message}", id, message);
                    return Json(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando anuncio {AnuncioId}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}