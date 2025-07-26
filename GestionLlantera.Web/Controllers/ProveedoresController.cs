using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.Models;
using System.Text.Json;
using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Models.DTOs;

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
                _logger.LogInformation("📋 Obteniendo TODOS los proveedores (activos e inactivos)");

                var jwtToken = this.ObtenerTokenJWT();
                var proveedores = await _proveedoresService.ObtenerTodosProveedoresAsync(jwtToken);

                var resultado = proveedores.Select(p => new
                {
                    id = p.ProveedorId,
                    nombre = p.NombreProveedor,
                    contacto = p.Contacto,
                    email = p.Email,
                    telefono = p.Telefono,
                    direccion = p.Direccion,
                    activo = p.Activo
                }).ToList();

                _logger.LogInformation("📋 Enviando {Count} proveedores al cliente", resultado.Count);
                foreach (var prov in resultado)
                {
                    _logger.LogInformation("📋 Proveedor: ID={Id}, Nombre='{Nombre}', Contacto='{Contacto}'",
                        prov.id, prov.nombre ?? "NULL", prov.contacto ?? "NULL");
                }

                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo proveedores");
                return Json(new { success = false, message = "Error al obtener proveedores" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTodosProveedores()
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Proveedores"))
                {
                    return Json(new { success = false, message = "Sin permisos para consultar proveedores" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var proveedores = await _proveedoresService.ObtenerTodosProveedoresAsync(jwtToken);

                var resultado = proveedores.Select(p => new
                {
                    id = p.ProveedorId,
                    nombre = p.NombreProveedor,
                    contacto = p.Contacto,
                    telefono = p.Telefono,
                    direccion = p.Direccion,
                    activo = p.Activo,
                    pedidosProveedors = p.PedidosProveedors
                }).ToList();

                _logger.LogInformation("📋 Enviando TODOS los {Count} proveedores al cliente (activos e inactivos)", resultado.Count);
                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo todos los proveedores");
                return Json(new { success = false, message = "Error al obtener todos los proveedores" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearProveedor([FromBody] CreateProveedorRequest request)
        {
            try
            {
                _logger.LogInformation("📋 Creando nuevo proveedor: {Nombre}", request?.NombreProveedor);

                if (request == null)
                {
                    return Json(new { success = false, message = "Datos del proveedor requeridos" });
                }

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                if (string.IsNullOrWhiteSpace(request.NombreProveedor))
                {
                    return Json(new { success = false, message = "El nombre del proveedor es requerido" });
                }

                var proveedor = new Proveedore
                {
                    NombreProveedor = request.NombreProveedor.Trim(),
                    Contacto = string.IsNullOrWhiteSpace(request.Contacto) ? null : request.Contacto.Trim(),
                    Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim(),
                    Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                    Direccion = string.IsNullOrWhiteSpace(request.Direccion) ? null : request.Direccion.Trim()
                };

                var resultado = await _proveedoresService.CrearProveedorAsync(proveedor, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedor creado exitosamente: {Nombre}", proveedor.NombreProveedor);
                    return Json(new
                    {
                        success = true,
                        message = resultado.message ?? "Proveedor creado exitosamente",
                        data = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error creando proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message ?? "Error al crear proveedor"
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

        [HttpPut]
        public async Task<IActionResult> ActualizarProveedor([FromBody] UpdateProveedorRequest request)
        {
            try
            {
                _logger.LogInformation("📋 Actualizando proveedor ID: {Id}", request?.ProveedorId);

                if (request == null)
                {
                    return Json(new { success = false, message = "Datos del proveedor requeridos" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                if (request.ProveedorId < 0)
                {
                    return Json(new { success = false, message = "ID del proveedor inválido" });
                }

                if (string.IsNullOrWhiteSpace(request.NombreProveedor))
                {
                    return Json(new { success = false, message = "El nombre del proveedor es requerido" });
                }

                var proveedor = new Proveedore
                {
                    ProveedorId = request.ProveedorId,
                    NombreProveedor = request.NombreProveedor.Trim(),
                    Contacto = string.IsNullOrWhiteSpace(request.Contacto) ? null : request.Contacto.Trim(),
                    Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                    Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim(),
                    Direccion = string.IsNullOrWhiteSpace(request.Direccion) ? null : request.Direccion.Trim()
                };

                var resultado = await _proveedoresService.ActualizarProveedorAsync(proveedor, jwtToken);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedor actualizado exitosamente: {Id}", proveedor.ProveedorId);
                    return Json(new
                    {
                        success = true,
                        message = resultado.message ?? "Proveedor actualizado exitosamente",
                        data = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error actualizando proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message ?? "Error al actualizar proveedor"
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

                if (id < 0)
                {
                    return Json(new { success = false, message = "ID del proveedor inválido" });
                }

                var token = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                if (!await this.TienePermisoAsync("Eliminar Proveedores"))
                {
                    return Json(new { success = false, message = "Sin permisos para eliminar proveedores" });
                }

                var resultado = await _proveedoresService.EliminarProveedorAsync(id, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Proveedor eliminado exitosamente: {Id}", id);
                    return Json(new
                    {
                        success = true,
                        message = resultado.message ?? "Proveedor eliminado exitosamente"
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error eliminando proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message ?? "Error al eliminar proveedor"
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

        [HttpPatch]
        public async Task<IActionResult> CambiarEstadoProveedor(int id, [FromBody] CambiarEstadoProveedorRequest request)
        {
            try
            {
                _logger.LogInformation("🔄 Cambiando estado de proveedor {Id} a {Estado}", id, request?.Activo == true ? "Activo" : "Inactivo");

                if (id < 0)
                {
                    return Json(new { success = false, message = "ID del proveedor inválido" });
                }

                if (request == null)
                {
                    return Json(new { success = false, message = "Datos requeridos para cambiar estado" });
                }

                if (!await this.TienePermisoAsync("Modificar Proveedores"))
                {
                    return Json(new { success = false, message = "Sin permisos para modificar proveedores" });
                }

                var token = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _proveedoresService.CambiarEstadoProveedorAsync(id, request.Activo, token);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Estado del proveedor cambiado exitosamente: {Id} -> {Estado}", id, request.Activo ? "Activo" : "Inactivo");
                    return Json(new
                    {
                        success = true,
                        message = resultado.message ?? $"Proveedor {(request.Activo ? "activado" : "desactivado")} exitosamente",
                        data = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error cambiando estado del proveedor: {Message}", resultado.message);
                    return Json(new
                    {
                        success = false,
                        message = resultado.message ?? "Error al cambiar estado del proveedor"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error cambiando estado del proveedor");
                return Json(new
                {
                    success = false,
                    message = "Error al cambiar estado del proveedor: " + ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPedidosProveedor(int? proveedorId = null)
        {
            try
            {
                _logger.LogInformation("📦 Obteniendo pedidos - ProveedorId: {ProveedorId}", proveedorId?.ToString() ?? "TODOS");

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }
                
                var resultado = await _proveedoresService.ObtenerPedidosProveedorAsync(proveedorId, jwtToken);

                if (resultado.success)
                {
                    // Asegurar que data sea una lista válida
                    var pedidos = resultado.data as System.Collections.IEnumerable<object> ?? new List<object>();
                    var listaPedidos = pedidos.ToList();
                    
                    _logger.LogInformation("📦 Enviando {Count} pedidos al cliente", listaPedidos.Count);
                    
                    return Json(new { success = true, data = listaPedidos });
                }
                else
                {
                    _logger.LogWarning("📦 Error obteniendo pedidos: {Message}", resultado.message);
                    return Json(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pedidos");
                return Json(new { success = false, message = "Error al obtener pedidos" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearPedidoProveedor([FromBody] CrearPedidoProveedorRequest request)
        {
            try
            {
                _logger.LogInformation("📦 Creando pedido para proveedor {ProveedorId} con {CantidadProductos} productos",
                    request?.ProveedorId, request?.Productos?.Count ?? 0);

                if (request == null)
                {
                    return Json(new { success = false, message = "Datos del pedido requeridos" });
                }

                // Validar datos básicos
                if (request.ProveedorId <= 0)
                {
                    return Json(new { success = false, message = "ID de proveedor inválido" });
                }

                if (request.Productos == null || !request.Productos.Any())
                {
                    return Json(new { success = false, message = "Debe seleccionar al menos un producto" });
                }

                // Validar productos
                foreach (var producto in request.Productos)
                {
                    if (producto.ProductoId <= 0)
                    {
                        return Json(new { success = false, message = "ID de producto inválido" });
                    }

                    if (producto.Cantidad <= 0)
                    {
                        return Json(new { success = false, message = "La cantidad debe ser mayor a 0" });
                    }
                }

                // Obtener token JWT
                var token = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                // Crear el pedido usando el servicio
                _logger.LogInformation("📦 Preparando datos del pedido para el proveedor {ProveedorId}", request.ProveedorId);

                var pedidoData = new CrearPedidoProveedorRequest
                {
                    ProveedorId = request.ProveedorId,
                    Productos = request.Productos.Select(p => new ProductoPedidoRequest
                    {
                        ProductoId = p.ProductoId,
                        Cantidad = p.Cantidad,
                        PrecioUnitario = p.PrecioUnitario ?? 0
                    }).ToList()
                };

                var resultado = await _proveedoresService.CrearPedidoProveedorAsync(pedidoData, token);

                _logger.LogInformation("📦 Resultado del servicio: Success={Success}, Message={Message}",
                    resultado.success, resultado.message);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Pedido creado exitosamente para proveedor {ProveedorId}", request.ProveedorId);

                    return Json(new
                    {
                        success = true,
                        message = resultado.message ?? "Pedido creado exitosamente",
                        data = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error creando pedido: {Message}", resultado.message);

                    return Json(new
                    {
                        success = false,
                        message = resultado.message ?? "Error creando el pedido"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando pedido para proveedor {ProveedorId}", request?.ProveedorId);
                return Json(new
                {
                    success = false,
                    message = "Error interno del servidor al crear el pedido",
                    details = ex.Message
                });
            }
        }
    }

    // DTOs para las requests
    public class CreateProveedorRequest
    {
        public string NombreProveedor { get; set; } = string.Empty;
        public string? Contacto { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
    }

    public class UpdateProveedorRequest
    {
        public int ProveedorId { get; set; }
        public string NombreProveedor { get; set; } = string.Empty;
        public string? Contacto { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
    }

    public class CambiarEstadoProveedorRequest
    {
        public bool Activo { get; set; }
    }
}