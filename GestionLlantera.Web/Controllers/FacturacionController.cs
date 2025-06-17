
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tuco.Clases.DTOs.Facturacion;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class FacturacionController : Controller
    {
        private readonly IFacturacionService _facturacionService;
        private readonly ILogger<FacturacionController> _logger;

        public FacturacionController(
            IFacturacionService facturacionService,
            ILogger<FacturacionController> logger)
        {
            _facturacionService = facturacionService;
            _logger = logger;
        }

        public IActionResult Index()
        {
            ViewBag.Title = "Facturación";
            return View();
        }

        public IActionResult NuevaVenta()
        {
            ViewBag.Title = "Nueva Venta";
            return View();
        }

        public IActionResult NuevaProforma()
        {
            ViewBag.Title = "Nueva Proforma";
            return View();
        }

        public async Task<IActionResult> VerFactura(int id)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return RedirectToAction("Login", "Account");
                }

                var (exitoso, factura, error) = await _facturacionService.ObtenerFacturaPorIdAsync(id, token);

                if (!exitoso || factura == null)
                {
                    TempData["Error"] = error ?? "Factura no encontrada";
                    return RedirectToAction("Index");
                }

                ViewBag.Title = $"{factura.TipoDocumento} {factura.NumeroFactura}";
                return View(factura);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cargar factura: {Id}", id);
                TempData["Error"] = "Error al cargar la factura";
                return RedirectToAction("Index");
            }
        }

        public async Task<IActionResult> ImprimirFactura(int id)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return RedirectToAction("Login", "Account");
                }

                var (exitoso, factura, error) = await _facturacionService.ObtenerFacturaPorIdAsync(id, token);

                if (!exitoso || factura == null)
                {
                    TempData["Error"] = error ?? "Factura no encontrada";
                    return RedirectToAction("Index");
                }

                ViewBag.Title = $"Imprimir {factura.TipoDocumento}";
                return View("ImprimirFactura", factura);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al preparar impresión: {Id}", id);
                TempData["Error"] = "Error al preparar la impresión";
                return RedirectToAction("Index");
            }
        }

        // =====================================
        // ENDPOINTS AJAX
        // =====================================

        [HttpGet]
        public async Task<IActionResult> ObtenerProductosParaVenta(
            string? busqueda = null, bool soloConStock = true, int pagina = 1, int tamano = 20)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "No autorizado" });
                }

                var (exitoso, resultado, error) = await _facturacionService
                    .ObtenerProductosParaVentaAsync(busqueda, soloConStock, pagina, tamano, token);

                if (exitoso)
                {
                    return Json(new { success = true, data = resultado });
                }

                return Json(new { success = false, message = error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener productos para venta");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProducto(int id)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "No autorizado" });
                }

                var (exitoso, producto, error) = await _facturacionService.ObtenerProductoParaVentaAsync(id, token);

                if (exitoso && producto != null)
                {
                    return Json(new { success = true, data = producto });
                }

                return Json(new { success = false, message = error ?? "Producto no encontrado" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener producto: {Id}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearFactura([FromBody] FacturaDTO factura)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "No autorizado" });
                }

                // Obtener ID del usuario desde las claims
                var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioId))
                {
                    return Json(new { success = false, message = "Usuario no identificado" });
                }

                factura.UsuarioCreadorId = int.Parse(usuarioId);
                factura.FechaFactura = DateTime.Now;

                var (exitoso, resultado, error) = await _facturacionService.CrearFacturaAsync(factura, token);

                if (exitoso)
                {
                    return Json(new { success = true, data = resultado });
                }

                return Json(new { success = false, message = error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear factura");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerFacturas(
            string? filtro = null, string? estado = null, string? tipoDocumento = null,
            DateTime? fechaDesde = null, DateTime? fechaHasta = null, int pagina = 1, int tamano = 20)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "No autorizado" });
                }

                var (exitoso, resultado, error) = await _facturacionService
                    .ObtenerFacturasAsync(filtro, estado, tipoDocumento, fechaDesde, fechaHasta, pagina, tamano, token);

                if (exitoso)
                {
                    return Json(new { success = true, data = resultado });
                }

                return Json(new { success = false, message = error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener facturas");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPut]
        public async Task<IActionResult> ActualizarEstadoFactura(int id, [FromBody] string nuevoEstado)
        {
            try
            {
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "No autorizado" });
                }

                var (exitoso, error) = await _facturacionService.ActualizarEstadoFacturaAsync(id, nuevoEstado, token);

                if (exitoso)
                {
                    return Json(new { success = true, message = "Estado actualizado exitosamente" });
                }

                return Json(new { success = false, message = error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar estado de factura: {Id}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GenerarNumeroFactura(string tipoDocumento = "Factura")
        {
            try
            {
                var token = Request.Cookies["jwt"];
                var numeroFactura = await _facturacionService.GenerarNumeroFacturaAsync(tipoDocumento, token);
                
                return Json(new { success = true, numeroFactura });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al generar número de factura");
                return Json(new { success = false, message = "Error al generar número" });
            }
        }
    }
}
