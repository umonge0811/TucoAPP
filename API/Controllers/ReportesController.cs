using API.Extensions;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tuco.Clases.DTOs.Inventario;

namespace API.Controllers
{
    /// <summary>
    /// Controlador dedicado para la generación de reportes del sistema
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportesController : ControllerBase
    {
        private readonly IReporteInventarioService _reporteInventarioService;
        private readonly IReportePedidosService _reportePedidosService;
        private readonly IPermisosService _permisosService;
        private readonly ILogger<ReportesController> _logger;

        public ReportesController(
            IReporteInventarioService reporteInventarioService,
            IReportePedidosService reportePedidosService,
            IPermisosService permisosService,
            ILogger<ReportesController> logger)
        {
            _reporteInventarioService = reporteInventarioService;
            _reportePedidosService = reportePedidosService;
            _permisosService = permisosService;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene los datos del reporte de inventario en formato JSON
        /// GET: api/Reportes/inventario/{inventarioId}
        /// </summary>
        [HttpGet("inventario/{inventarioId}")]
        public async Task<IActionResult> ObtenerReporteInventario(int inventarioId)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Ver Reportes",
                    "Solo usuarios con permiso 'Ver Reportes' pueden generar reportes");
                if (validacion != null) return validacion;

                _logger.LogInformation("📊 Generando reporte para inventario {InventarioId}", inventarioId);

                var reporte = await _reporteInventarioService.GenerarReporteAsync(inventarioId);

                return Ok(reporte);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("❌ Inventario no encontrado: {InventarioId}", inventarioId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error generando reporte para inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno al generar reporte" });
            }
        }

        /// <summary>
        /// Descarga el reporte de inventario en formato Excel
        /// GET: api/Reportes/inventario/{inventarioId}/excel
        /// </summary>
        [HttpGet("inventario/{inventarioId}/excel")]
        public async Task<IActionResult> DescargarReporteExcel(int inventarioId)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Descargar Reportes",
                    "Solo usuarios con permiso 'Descargar Reportes' pueden descargar reportes");
                if (validacion != null) return validacion;

                _logger.LogInformation("📥 Descargando reporte Excel para inventario {InventarioId}", inventarioId);

                var excelBytes = await _reporteInventarioService.GenerarReporteExcelAsync(inventarioId);
                var fileName = $"Reporte_Inventario_{inventarioId}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

                return File(excelBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("❌ Inventario no encontrado para Excel: {InventarioId}", inventarioId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error generando Excel para inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno al generar Excel" });
            }
        }

        /// <summary>
        /// Descarga el reporte de inventario en formato PDF
        /// GET: api/Reportes/inventario/{inventarioId}/pdf
        /// </summary>
        [HttpGet("inventario/{inventarioId}/pdf")]
        public async Task<IActionResult> DescargarReportePdf(int inventarioId)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Descargar Reportes",
                    "Solo usuarios con permiso 'Descargar Reportes' pueden descargar reportes");
                if (validacion != null) return validacion;

                _logger.LogInformation("📄 Descargando reporte PDF para inventario {InventarioId}", inventarioId);

                var pdfBytes = await _reporteInventarioService.GenerarReportePdfAsync(inventarioId);
                var fileName = $"Reporte_Inventario_{inventarioId}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("❌ Inventario no encontrado para PDF: {InventarioId}", inventarioId);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error generando PDF para inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno al generar PDF" });
            }
        }

        /// <summary>
        /// Obtiene estadísticas resumidas de múltiples inventarios
        /// GET: api/Reportes/resumen-inventarios
        /// </summary>
        [HttpGet("resumen-inventarios")]
        public async Task<IActionResult> ObtenerResumenInventarios([FromQuery] DateTime? fechaDesde, [FromQuery] DateTime? fechaHasta)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Ver Reportes",
                    "Solo usuarios con permiso 'Ver Reportes' pueden ver resúmenes");
                if (validacion != null) return validacion;

                _logger.LogInformation("📈 Generando resumen de inventarios");

                // Por ahora retornamos estructura básica, después implementamos
                return Ok(new
                {
                    message = "Resumen de inventarios - Por implementar",
                    fechaDesde = fechaDesde?.ToString("yyyy-MM-dd"),
                    fechaHasta = fechaHasta?.ToString("yyyy-MM-dd")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error generando resumen de inventarios");
                return StatusCode(500, new { message = "Error interno al generar resumen" });
            }
        }

        /// <summary>
        /// Generar PDF de un pedido a proveedor
        /// </summary>
        /// <param name="pedidoId">ID del pedido</param>
        /// <returns>Archivo PDF del pedido</returns>
        [HttpGet("pedido/{pedidoId}/pdf")]
        public async Task<IActionResult> GenerarPedidoPdf(int pedidoId)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS - TODO: Implementar permisos para reportes de pedidos
                // var validacion = await this.ValidarPermisoAsync(_permisosService, "Ver Reportes",
                //    "Solo usuarios con permiso 'Ver Reportes' pueden generar reportes");
                // if (validacion != null) return validacion;

                _logger.LogInformation("📄 Generando PDF para pedido ID: {PedidoId}", pedidoId);

                var pdfBytes = await _reportePedidosService.GenerarPedidoPdfAsync(pedidoId);

                var fileName = $"Pedido_{pedidoId}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Pedido no encontrado: {Message}", ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar PDF para pedido ID: {PedidoId}", pedidoId);
                return StatusCode(500, new { message = "Error interno del servidor al generar el PDF" });
            }
        }
    }
}