using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using OfficeOpenXml.FormulaParsing.LexicalAnalysis;
using System.Text.Json;


namespace GestionLlantera.Web.Controllers
{
    [Route("Reportes")]
    public class ReportesController : Controller
    {
        private readonly IReportesService _reportesService;
        private readonly ILogger<InventarioController> _logger;
        private readonly HttpClient _httpClient;


        public ReportesController(IReportesService reportesService, ILogger<InventarioController> logger, IHttpClientFactory httpClientFactory)
        {
            _reportesService = reportesService;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
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

        /// <summary>
        /// Descarga el reporte de inventario en formato Excel
        /// GET: /Reportes/inventario/{inventarioId}/excel
        /// </summary>
        [HttpGet("inventario/{inventarioId}/excel")]
        public async Task<IActionResult> DescargarInventarioExcel(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📊 === GENERANDO REPORTE EXCEL ===");
                _logger.LogInformation("📊 Inventario ID: {InventarioId}, Usuario: {Usuario}", 
                    inventarioId, User.Identity?.Name ?? "Anónimo");

                // ✅ VERIFICAR QUE EL INVENTARIO EXISTE Y ESTÁ COMPLETADO
                var inventario = await VerificarEstadoInventario(inventarioId);
                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario {InventarioId} no encontrado o no completado", inventarioId);
                    return NotFound(new { message = "Inventario no encontrado o no completado" });
                }

                var excelBytes = await _reportesService.GenerarReporteInventarioExcelAsync(inventarioId);

                if (excelBytes == null || excelBytes.Length == 0)
                {
                    _logger.LogWarning("❌ No se pudo generar el reporte Excel para inventario {InventarioId}", inventarioId);
                    return BadRequest(new { message = "No se pudo generar el reporte Excel" });
                }

                // Obtener nombre del inventario para el archivo
                var nombreArchivo = inventario.Titulo?.Replace(" ", "_").Replace("/", "_").Replace("\\", "_") ?? "Inventario";
                var fileName = $"Reporte_{nombreArchivo}_{inventarioId}_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";

                _logger.LogInformation("✅ Reporte Excel generado exitosamente");
                _logger.LogInformation("📁 Archivo: {FileName} ({Size} bytes)", fileName, excelBytes.Length);

                return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico generando reporte Excel para inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno del servidor al generar reporte Excel" });
            }
        }

        /// <summary>
        /// Descarga el reporte de inventario en formato PDF
        /// GET: /Reportes/inventario/{inventarioId}/pdf
        /// </summary>
        [HttpGet("inventario/{inventarioId}/pdf")]
        public async Task<IActionResult> DescargarInventarioPdf(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📋 === GENERANDO REPORTE PDF ===");
                _logger.LogInformation("📋 Inventario ID: {InventarioId}, Usuario: {Usuario}", 
                    inventarioId, User.Identity?.Name ?? "Anónimo");

                // ✅ VERIFICAR QUE EL INVENTARIO EXISTE Y ESTÁ COMPLETADO
                var inventario = await VerificarEstadoInventario(inventarioId);
                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario {InventarioId} no encontrado o no completado", inventarioId);
                    return NotFound(new { message = "Inventario no encontrado o no completado" });
                }

                var pdfBytes = await _reportesService.GenerarReporteInventarioPdfAsync(inventarioId);

                if (pdfBytes == null || pdfBytes.Length == 0)
                {
                    _logger.LogWarning("❌ No se pudo generar el reporte PDF para inventario {InventarioId}", inventarioId);
                    return BadRequest(new { message = "No se pudo generar el reporte PDF" });
                }

                // Obtener nombre del inventario para el archivo
                var nombreArchivo = inventario.Titulo?.Replace(" ", "_").Replace("/", "_").Replace("\\", "_") ?? "Inventario";
                var fileName = $"Reporte_{nombreArchivo}_{inventarioId}_{DateTime.Now:yyyyMMdd_HHmm}.pdf";

                _logger.LogInformation("✅ Reporte PDF generado exitosamente");
                _logger.LogInformation("📁 Archivo: {FileName} ({Size} bytes)", fileName, pdfBytes.Length);

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico generando reporte PDF para inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno del servidor al generar reporte PDF" });
            }
        }

        /// <summary>
        /// Verifica que el inventario existe y está en estado completado
        /// </summary>
        private async Task<dynamic> VerificarEstadoInventario(int inventarioId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}");
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var inventario = JsonSerializer.Deserialize<dynamic>(content, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                // Solo permitir reportes de inventarios completados
                if (inventario?.Estado?.ToString() != "Completado")
                {
                    _logger.LogWarning("⚠️ Inventario {InventarioId} no está completado (Estado: {Estado})", 
                        inventarioId, inventario?.Estado?.ToString() ?? "NULL");
                    return null;
                }

                return inventario;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verificando estado del inventario {InventarioId}", inventarioId);
                return null;
            }
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