using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    [Route("[controller]/[action]")]
    public class ReportesController : Controller
    {
        private readonly IReportesService _reportesService;

        public ReportesController(IReportesService reportesService)
        {
            _reportesService = reportesService;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerReporte(int inventarioId)
        {
            try
            {
                var reporte = await _reportesService.ObtenerReporteAsync(inventarioId);
                return Json(reporte);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DescargarExcel(int inventarioId)
        {
            try
            {
                var archivo = await _reportesService.DescargarExcelAsync(inventarioId);
                return File(archivo, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"Reporte_Inventario_{inventarioId}.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DescargarPdf(int inventarioId)
        {
            try
            {
                var archivo = await _reportesService.DescargarPdfAsync(inventarioId);
                return File(archivo, "application/pdf", $"Reporte_Inventario_{inventarioId}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}