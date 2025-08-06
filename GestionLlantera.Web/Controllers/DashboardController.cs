using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;
using Microsoft.Extensions.Logging; // Asegurarse de que ILogger esté disponible
using System.Linq; // Necesario para Select y Join
using System.Threading.Tasks; // Necesario para Task
using System.Security.Claims; // Necesario para ClaimTypes

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

        public async Task<IActionResult> Index()
        {
            try
            {
                _logger.LogInformation("📊 Cargando página principal del dashboard");

                // Obtener información del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ No se encontró token JWT válido");
                    return RedirectToAction("Login", "Account");
                }

                // Obtener el ID del usuario actual desde los claims
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId" || c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    ViewBag.CurrentUserId = userId;
                    _logger.LogInformation("👤 ID del usuario actual: {UserId}", userId);
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo obtener el ID del usuario desde los claims");
                    ViewBag.CurrentUserId = 0; // O manejar como un error si es crítico
                }

                // Pasar información básica a la vista si es necesario
                ViewBag.UserToken = token;

                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cargando dashboard");
                return View("Error");
            }
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

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("❌ Token JWT no encontrado para ObtenerAnuncios");
                    return Json(new { success = false, message = "Token de autenticación no válido o sesión expirada." });
                }

                var resultado = await _anunciosService.ObtenerAnunciosAsync(token);

                if (!resultado.success)
                {
                    _logger.LogWarning("⚠️ No se pudieron obtener los anuncios: {Message}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Anuncios obtenidos exitosamente. Total: {Count}", resultado.anuncios.Count());
                return Json(new { success = true, data = resultado.anuncios });
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

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("❌ Token JWT no encontrado para ObtenerAnuncioPorId {AnuncioId}", id);
                    return Json(new { success = false, message = "Token de autenticación no válido o sesión expirada." });
                }

                var resultado = await _anunciosService.ObtenerAnuncioPorIdAsync(id, token);

                if (!resultado.success || resultado.anuncio == null)
                {
                    _logger.LogWarning("⚠️ No se pudo obtener el anuncio {AnuncioId}: {Message}", id, resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Anuncio obtenido exitosamente: {Titulo}", resultado.anuncio.Titulo);
                return Json(new { success = true, data = resultado.anuncio });
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
                _logger.LogInformation("🔔 Creando nuevo anuncio con Título: {Titulo}", anuncioDto.Titulo);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("❌ Datos de entrada inválidos para crear anuncio.");
                    return Json(new { success = false, message = "Datos de entrada inválidos" });
                }

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("❌ Token JWT no encontrado para CrearAnuncio.");
                    return Json(new { success = false, message = "Token de autenticación no válido o sesión expirada." });
                }

                var resultado = await _anunciosService.CrearAnuncioAsync(anuncioDto, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncio creado exitosamente: {Titulo}", resultado.anuncio?.Titulo);
                    return Json(new { success = true, data = resultado.anuncio, message = resultado.mensaje });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo crear el anuncio: {Message}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
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
                _logger.LogInformation("🔔 Actualizando anuncio {AnuncioId} con Título: {Titulo}", id, anuncioDto.Titulo);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("❌ Datos de entrada inválidos para actualizar anuncio {AnuncioId}.", id);
                    return Json(new { success = false, message = "Datos de entrada inválidos" });
                }

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("❌ Token JWT no encontrado para ActualizarAnuncio {AnuncioId}.", id);
                    return Json(new { success = false, message = "Token de autenticación no válido o sesión expirada." });
                }

                var resultado = await _anunciosService.ActualizarAnuncioAsync(id, anuncioDto, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncio actualizado exitosamente: {AnuncioId}", id);
                    return Json(new { success = true, message = resultado.mensaje });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo actualizar el anuncio {AnuncioId}: {Message}", id, resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
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

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("❌ Token JWT no encontrado para EliminarAnuncio {AnuncioId}.", id);
                    return Json(new { success = false, message = "Token de autenticación no válido o sesión expirada." });
                }

                var resultado = await _anunciosService.EliminarAnuncioAsync(id, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncio eliminado exitosamente: {AnuncioId}", id);
                    return Json(new { success = true, message = resultado.mensaje });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo eliminar el anuncio {AnuncioId}: {Message}", id, resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
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