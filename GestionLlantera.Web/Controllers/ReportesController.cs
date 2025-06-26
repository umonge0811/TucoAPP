using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using OfficeOpenXml.FormulaParsing.LexicalAnalysis;


namespace GestionLlantera.Web.Controllers
{
    [Route("Reportes")]
    public class ReportesController : Controller
    {
        private readonly IReportesService _reportesService;
        private readonly ILogger<InventarioController> _logger;


        public ReportesController(IReportesService reportesService, ILogger<InventarioController> logger)
        {
            _reportesService = reportesService;
            _logger = logger;
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        /// <returns>El token JWT o null si no se encuentra</returns>
        private string? ObtenerTokenJWT()
        {
            var token = User.FindFirst("JwtToken")?.Value;

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }
            else
            {
                _logger.LogDebug("✅ Token JWT obtenido correctamente para usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }

            return token;
        }

        [HttpGet("inventario/{inventarioId}/excel")]
        public async Task<IActionResult> DescargarExcel(int inventarioId)
        {
            try
            {
                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para DescargarExcel");
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // ✅ LLAMAR AL SERVICIO CON TOKEN
                var archivo = await _reportesService.DescargarExcelAsync(inventarioId, token);

                return File(archivo, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"Reporte_Inventario_{inventarioId}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error descargando Excel para inventario {InventarioId}", inventarioId);
                TempData["Error"] = "Error al descargar el reporte Excel";
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("inventario/{inventarioId}/pdf")]
        public async Task<IActionResult> DescargarPdf(int inventarioId)
        {
            try
            {
                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para DescargarPdf");
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // ✅ LLAMAR AL SERVICIO CON TOKEN
                var archivo = await _reportesService.DescargarPdfAsync(inventarioId, token);

                return File(archivo, "application/pdf", $"Reporte_Inventario_{inventarioId}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error descargando PDF para inventario {InventarioId}", inventarioId);
                TempData["Error"] = "Error al descargar el reporte PDF";
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerReporte(int inventarioId)
        {
            try
            {
                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para ObtenerReporte");
                    return Json(new { error = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                // ✅ LLAMAR AL SERVICIO CON TOKEN
                var reporte = await _reportesService.ObtenerReporteAsync(inventarioId, token);

                return Json(reporte);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo reporte para inventario {InventarioId}", inventarioId);
                return Json(new { error = ex.Message });
            }
        }
    }
}