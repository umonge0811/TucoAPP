
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Extensions;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class FacturacionController : Controller
    {
        private readonly IInventarioService _inventarioService;
        private readonly IUsuariosService _usuariosService;
        private readonly ILogger<FacturacionController> _logger;

        public FacturacionController(
            IInventarioService inventarioService, 
            IUsuariosService usuariosService,
            ILogger<FacturacionController> logger)
        {
            _inventarioService = inventarioService;
            _usuariosService = usuariosService;
            _logger = logger;
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
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

        public async Task<IActionResult> Index()
        {
            try
            {
                // ✅ VERIFICAR PERMISOS USANDO EL MÉTODO EXISTENTE
                var tienePermiso = await this.TienePermisoAsync("Ver Facturación");
                if (!tienePermiso)
                {
                    _logger.LogWarning("Usuario {Usuario} intentó acceder a facturación sin permisos", 
                        User.Identity?.Name);
                    TempData["Error"] = "No tienes permisos para acceder a la facturación.";
                    return RedirectToAction("Index", "Dashboard");
                }

                ViewData["Title"] = "Facturación";
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar vista de facturación");
                TempData["Error"] = "Error al cargar la página de facturación.";
                return RedirectToAction("Index", "Dashboard");
            }
        }

        [HttpGet]
        public async Task<IActionResult> BuscarProductos(string termino = "", int pagina = 1, int tamano = 20)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var tienePermiso = await this.TienePermisoAsync("Ver Inventario");
                if (!tienePermiso)
                {
                    return Json(new { success = false, message = "Sin permisos para consultar inventario" });
                }

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // ✅ USAR EL MÉTODO IMPLEMENTADO
                var productos = await _inventarioService.BuscarProductosAsync(termino, pagina, tamano, token);
                
                // ✅ FILTRAR SOLO PRODUCTOS CON STOCK DISPONIBLE PARA VENTA
                var productosDisponibles = productos.Where(p => p.CantidadEnInventario > 0).ToList();

                return Json(new { 
                    success = true, 
                    data = productosDisponibles,
                    total = productosDisponibles.Count,
                    pagina = pagina,
                    tamano = tamano
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar productos para facturación");
                return Json(new { success = false, message = "Error al buscar productos" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProducto(int id)
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var tienePermiso = await this.TienePermisoAsync("Ver Inventario");
                if (!tienePermiso)
                {
                    return Json(new { success = false, message = "Sin permisos para consultar productos" });
                }

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // ✅ USAR MÉTODO EXISTENTE DEL SERVICIO
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id, token);
                
                if (producto == null || producto.ProductoId == 0)
                {
                    return Json(new { success = false, message = "Producto no encontrado" });
                }

                // ✅ VERIFICAR STOCK DISPONIBLE
                if (producto.CantidadEnInventario <= 0)
                {
                    return Json(new { 
                        success = false, 
                        message = "Producto sin stock disponible",
                        stockDisponible = producto.CantidadEnInventario
                    });
                }

                return Json(new { success = true, data = producto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto {ProductoId}", id);
                return Json(new { success = false, message = "Error al obtener producto" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerClientes(string termino = "")
        {
            try
            {
                // ✅ VERIFICAR PERMISOS
                var tienePermiso = await this.TienePermisoAsync("Ver Usuarios");
                if (!tienePermiso)
                {
                    return Json(new { success = false, message = "Sin permisos para consultar clientes" });
                }

                // ✅ REUTILIZAR SERVICIO DE USUARIOS EXISTENTE
                var usuarios = await _usuariosService.ObtenerTodosAsync();
                
                // ✅ FILTRAR USUARIOS ACTIVOS Y QUE SEAN CLIENTES
                var clientes = usuarios.Where(u => u.Activo && 
                    (string.IsNullOrWhiteSpace(termino) || 
                     u.NombreCompleto.Contains(termino, StringComparison.OrdinalIgnoreCase) ||
                     u.Email.Contains(termino, StringComparison.OrdinalIgnoreCase)))
                    .Take(20) // Limitar resultados
                    .Select(u => new {
                        id = u.UsuarioId,
                        nombre = u.NombreCompleto,
                        email = u.Email,
                        telefono = u.Telefono
                    })
                    .ToList();

                return Json(new { success = true, data = clientes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener clientes");
                return Json(new { success = false, message = "Error al obtener clientes" });
            }
        }
    }
}
