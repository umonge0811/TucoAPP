using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using OfficeOpenXml.FormulaParsing.LexicalAnalysis;
using GestionLlantera.Web.Extensions;


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
                // ✅ VERIFICAR PERMISO PARA VER REPORTES
                if (!await this.TienePermisoAsync("Ver Reportes"))
                {
                    _logger.LogWarning("🚫 Usuario sin permiso 'Ver Reportes' intentó descargar reporte Excel");
                    TempData["AccesoNoAutorizado"] = "Ver Reportes";
                    TempData["ModuloAcceso"] = "Reportes";
                    return RedirectToAction("AccessDenied", "Account");
                }

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
                _logger.LogInformation("📋 Solicitud de descarga PDF para inventario {InventarioId}", inventarioId);

                // ✅ OBTENER TOKEN JWT DESDE LAS COOKIES
                var jwtToken = Request.Cookies["JWTToken"];
                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogWarning("❌ No se encontró token JWT en las cookies");
                    return Unauthorized("Token de autenticación requerido");
                }

                // ✅ DELEGAR AL SERVICIO
                var archivoBytes = await _reportesService.DescargarPdfAsync(inventarioId, jwtToken);

                // ✅ RETORNAR ARCHIVO PDF
                return File(archivoBytes, "application/pdf", $"Reporte_Inventario_{inventarioId}_{DateTime.Now:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al descargar PDF del inventario {InventarioId}", inventarioId);
                return StatusCode(500, "Error interno del servidor al generar el PDF");
            }
        }

        /// <summary>
        /// Descarga el reporte PDF del pedido especificado
        /// </summary>
        /// <param name="pedidoId">ID del pedido</param>
        /// <returns>Archivo PDF</returns>
        [HttpGet("pedido/{pedidoId}/pdf")]
        public async Task<IActionResult> DescargarPedidoPdf(int pedidoId)
        {
            try
            {
                _logger.LogInformation("📄 Descargando PDF de pedido {PedidoId}", pedidoId);

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado");
                    return Unauthorized(new { message = "Sesión expirada" });
                }

                var pdfBytes = await _reportesService.DescargarPedidoPdfAsync(pedidoId, token);
                var fileName = $"Pedido_{pedidoId}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error descargando PDF de pedido {PedidoId}", pedidoId);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Descarga el reporte Excel de un inventario programado
        /// </summary>
        /// <param name="inventarioId">ID del inventario programado</param>
        /// <returns>Archivo Excel</returns>
        [HttpGet("inventario/{inventarioId}/excel")]
        public async Task<IActionResult> DescargarInventarioExcel(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📊 Descargando Excel de inventario {InventarioId}", inventarioId);

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado");
                    return Unauthorized(new { message = "Sesión expirada" });
                }

                var excelBytes = await _reportesService.DescargarExcelAsync(inventarioId, token);
                var fileName = $"Inventario_{inventarioId}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

                return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error descargando Excel de inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Descarga el reporte PDF de un inventario programado
        /// </summary>
        /// <param name="inventarioId">ID del inventario programado</param>
        /// <returns>Archivo PDF</returns>
        [HttpGet("inventario/{inventarioId}/pdf")]
        public async Task<IActionResult> DescargarInventarioPdf(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📄 Descargando PDF de inventario {InventarioId}", inventarioId);

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado");
                    return Unauthorized(new { message = "Sesión expirada" });
                }

                var pdfBytes = await _reportesService.DescargarPdfAsync(inventarioId, token);
                var fileName = $"Inventario_{inventarioId}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error descargando PDF de inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno del servidor" });
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