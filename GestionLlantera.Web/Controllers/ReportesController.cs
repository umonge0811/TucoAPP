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

        [HttpGet("pedido/{pedidoId}/pdf")]
        public async Task<IActionResult> DescargarPedidoPdf(int pedidoId)
        {
            try
            {
                _logger.LogInformation("📋 Solicitud de descarga PDF para pedido {PedidoId}", pedidoId);

                // ✅ OBTENER TOKEN JWT DESDE LAS COOKIES
                var jwtToken = Request.Cookies["JWTToken"];
                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogWarning("❌ No se encontró token JWT en las cookies");
                    return Unauthorized("Token de autenticación requerido");
                }

                // ✅ DELEGAR AL SERVICIO (necesitamos crear este método)
                var archivoBytes = await _reportesService.DescargarPedidoPdfAsync(pedidoId, jwtToken);

                // ✅ RETORNAR ARCHIVO PDF
                return File(archivoBytes, "application/pdf", $"Reporte_Pedido_{pedidoId}_{DateTime.Now:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al descargar PDF del pedido {PedidoId}", pedidoId);
                return StatusCode(500, "Error interno del servidor al generar el PDF");
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