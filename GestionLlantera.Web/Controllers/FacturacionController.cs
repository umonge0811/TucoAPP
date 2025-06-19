using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs.Facturacion;

namespace GestionLlantera.Web.Controllers
{
    public class FacturacionController : Controller
    {
        private readonly IFacturacionService _facturacionService;
        private readonly IInventarioService _inventarioService;
        private readonly ILogger<FacturacionController> _logger;

        public FacturacionController(
            IFacturacionService facturacionService,
            IInventarioService inventarioService,
            ILogger<FacturacionController> logger)
        {
            _facturacionService = facturacionService;
            _inventarioService = inventarioService;
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> ProcesarVenta([FromBody] FacturaDTO factura)
        {
            try
            {
                _logger.LogInformation("🛒 Recibiendo solicitud de venta para cliente: {Cliente}", factura.NombreCliente);

                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Datos de factura inválidos" });
                }

                // Verificar stock antes de procesar
                var stockDisponible = await _facturacionService.VerificarStockDisponibleAsync(factura.Productos);
                if (!stockDisponible)
                {
                    return Json(new { success = false, message = "Stock insuficiente para algunos productos" });
                }

                // Procesar la venta
                var ventaProcesada = await _facturacionService.ProcesarVentaAsync(factura);

                if (ventaProcesada)
                {
                    // Actualizar inventario - reducir stock
                    foreach (var producto in factura.Productos)
                    {
                        await _inventarioService.ActualizarStockAsync(producto.ProductoId, -producto.Cantidad);
                    }

                    _logger.LogInformation("✅ Venta procesada exitosamente para cliente: {Cliente}", factura.NombreCliente);
                    return Json(new { 
                        success = true, 
                        message = "Venta procesada exitosamente",
                        facturaId = factura.FacturaId
                    });
                }
                else
                {
                    return Json(new { success = false, message = "Error al procesar la venta" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error procesando venta");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProductosVenta(string busqueda = null)
        {
            try
            {
                var resultado = await _facturacionService.ObtenerProductosParaVentaAsync(busqueda, true);

                if (resultado.Success || resultado.IsSuccess)
                {
                    return Json(new { success = true, data = resultado.Data });
                }
                else
                {
                    return Json(new { success = false, message = resultado.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo productos para venta");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ImprimirRecibo([FromBody] FacturaDTO factura)
        {
            try
            {
                _logger.LogInformation("🖨️ Generando recibo para impresión");

                // Por ahora retornar éxito - la implementación real de impresión se hará después
                return Json(new { success = true, message = "Recibo enviado a impresora" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generando recibo");
                return Json(new { success = false, message = "Error al generar recibo" });
            }
        }
    }
}