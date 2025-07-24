
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

        public IActionResult PedidosProveedor(int proveedorId)
        {
            ViewBag.ProveedorId = proveedorId;
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProveedores()
        {
            try
            {
                _logger.LogInformation("📋 Solicitando lista de proveedores");

                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.ObtenerProveedoresAsync(token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedores obtenidos exitosamente");
                    return Json(new
                    {
                        success = true,
                        data = resultado.data,
                        message = resultado.message
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error obteniendo proveedores: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo proveedores");
                return Json(new
                {
                    success = false,
                    message = "Error al obtener proveedores: " + ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearProveedor([FromBody] dynamic proveedorData)
        {
            try
            {
                _logger.LogInformation("📋 Creando nuevo proveedor");

                if (proveedorData == null)
                {
                    return Json(new { success = false, message = "Datos del proveedor requeridos" });
                }

                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // Crear objeto Proveedore
                var proveedor = new Proveedore
                {
                    NombreProveedor = (string)proveedorData.nombreProveedor,
                    Contacto = (string)proveedorData.contacto,
                    Telefono = (string)proveedorData.telefono,
                    Direccion = (string)proveedorData.direccion
                };

                if (string.IsNullOrWhiteSpace(proveedor.NombreProveedor))
                {
                    return Json(new { success = false, message = "El nombre del proveedor es requerido" });
                }

                var resultado = await _proveedoresService.CrearProveedorAsync(proveedor, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedor creado exitosamente: {Nombre}", proveedor.NombreProveedor);
                    return Json(new
                    {
                        success = true,
                        message = resultado.message,
                        data = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error creando proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando proveedor");
                return Json(new
                {
                    success = false,
                    message = "Error al crear proveedor: " + ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> ActualizarProveedor([FromBody] dynamic proveedorData)
        {
            try
            {
                _logger.LogInformation("📋 Actualizando proveedor");

                if (proveedorData == null)
                {
                    return Json(new { success = false, message = "Datos del proveedor requeridos" });
                }

                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // Crear objeto Proveedore
                var proveedor = new Proveedore
                {
                    ProveedorId = (int)proveedorData.proveedorId,
                    NombreProveedor = (string)proveedorData.nombreProveedor,
                    Contacto = (string)proveedorData.contacto,
                    Telefono = (string)proveedorData.telefono,
                    Direccion = (string)proveedorData.direccion
                };

                if (proveedor.ProveedorId <= 0)
                {
                    return Json(new { success = false, message = "ID del proveedor inválido" });
                }

                if (string.IsNullOrWhiteSpace(proveedor.NombreProveedor))
                {
                    return Json(new { success = false, message = "El nombre del proveedor es requerido" });
                }

                var resultado = await _proveedoresService.ActualizarProveedorAsync(proveedor, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedor actualizado exitosamente: {Id}", proveedor.ProveedorId);
                    return Json(new
                    {
                        success = true,
                        message = resultado.message,
                        data = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error actualizando proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando proveedor");
                return Json(new
                {
                    success = false,
                    message = "Error al actualizar proveedor: " + ex.Message
                });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> EliminarProveedor(int id)
        {
            try
            {
                _logger.LogInformation("📋 Eliminando proveedor {Id}", id);

                if (id <= 0)
                {
                    return Json(new { success = false, message = "ID del proveedor inválido" });
                }

                var token = HttpContext.Session.GetString("JWTToken");
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.EliminarProveedorAsync(id, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedor eliminado exitosamente: {Id}", id);
                    return Json(new
                    {
                        success = true,
                        message = resultado.message
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error eliminando proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando proveedor");
                return Json(new
                {
                    success = false,
                    message = "Error al eliminar proveedor: " + ex.Message
                });
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
