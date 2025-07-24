
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.Models;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class ProveedoresController : Controller
    {
        private readonly IProveedoresService _proveedoresService;
        private readonly ILogger<ProveedoresController> _logger;

        public ProveedoresController(IProveedoresService proveedoresService, ILogger<ProveedoresController> logger)
        {
            _proveedoresService = proveedoresService;
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                _logger.LogInformation("📋 Cargando página de proveedores");
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cargando página de proveedores");
                return View("Error");
            }
        }

        public async Task<IActionResult> PedidosProveedor()
        {
            try
            {
                _logger.LogInformation("📦 Cargando página de pedidos a proveedores");
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cargando página de pedidos");
                return View("Error");
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProveedores()
        {
            try
            {
                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.ObtenerProveedoresAsync(token);
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo proveedores");
                return Json(new { success = false, message = "Error obteniendo proveedores" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearProveedor([FromBody] Proveedore proveedor)
        {
            try
            {
                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.CrearProveedorAsync(proveedor, token);
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando proveedor");
                return Json(new { success = false, message = "Error creando proveedor" });
            }
        }

        [HttpPut]
        public async Task<IActionResult> ActualizarProveedor([FromBody] Proveedore proveedor)
        {
            try
            {
                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.ActualizarProveedorAsync(proveedor, token);
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando proveedor");
                return Json(new { success = false, message = "Error actualizando proveedor" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> EliminarProveedor(int id)
        {
            try
            {
                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.EliminarProveedorAsync(id, token);
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando proveedor");
                return Json(new { success = false, message = "Error eliminando proveedor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPedidosProveedor(int? proveedorId = null)
        {
            try
            {
                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.ObtenerPedidosProveedorAsync(proveedorId, token);
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pedidos");
                return Json(new { success = false, message = "Error obteniendo pedidos" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearPedidoProveedor([FromBody] dynamic pedidoData)
        {
            try
            {
                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.CrearPedidoProveedorAsync(pedidoData, token);
                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando pedido");
                return Json(new { success = false, message = "Error creando pedido" });
            }
        }
    }
}
