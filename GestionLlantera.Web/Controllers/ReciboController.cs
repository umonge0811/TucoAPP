
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class ReciboController : Controller
    {
        private readonly ILogger<ReciboController> _logger;

        public ReciboController(ILogger<ReciboController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IActionResult GenerarRecibo([FromBody] dynamic datosRecibo)
        {
            try
            {
                // Aquí podrías procesar datos adicionales del recibo si es necesario
                // Por ejemplo, guardar en logs, enviar por email, etc.
                
                _logger.LogInformation("Recibo generado para factura: {NumeroFactura}", datosRecibo?.numeroFactura);
                
                return Json(new { success = true, message = "Recibo procesado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error procesando recibo");
                return Json(new { success = false, message = "Error al procesar recibo" });
            }
        }

        [HttpGet]
        public IActionResult VerRecibo(string numeroFactura)
        {
            // Aquí podrías implementar la visualización de un recibo específico
            // usando el número de factura para recuperar los datos
            
            ViewBag.NumeroFactura = numeroFactura;
            return View();
        }
    }
}
