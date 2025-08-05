using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    // Este atributo asegura que solo usuarios autenticados puedan acceder
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ILogger<DashboardController> _logger;
        private readonly IDashboardService _dashboardService;

        public DashboardController(ILogger<DashboardController> logger, IDashboardService dashboardService)
        {
            _logger = logger;
            _dashboardService = dashboardService;
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
    }
}