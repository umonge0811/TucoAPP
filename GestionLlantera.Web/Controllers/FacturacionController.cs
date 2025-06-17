using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class FacturacionController : Controller
    {
        private readonly ILogger<FacturacionController> _logger;
        private readonly IInventarioService _inventarioService;
        private readonly IClientesService _clientesService;
        private readonly IFacturacionService _facturacionService;

        public FacturacionController(
            ILogger<FacturacionController> logger,
            IInventarioService inventarioService, 
            IClientesService clientesService,
            IFacturacionService facturacionService)
        {
            _logger = logger;
            _inventarioService = inventarioService;
            _clientesService = clientesService;
            _facturacionService = facturacionService;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                // Verificar permisos
                if (!await this.TienePermisoAsync("Ver Ventas"))
                {
                    return RedirectToAction("AccessDenied", "Account");
                }

                ViewData["Title"] = "Facturación";
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en vista de facturación");
                return View("Error");
            }
        }

        [HttpGet]
        public async Task<IActionResult> BuscarProductos(string termino = "", int pagina = 1, int tamano = 20)
        {
            try
            {
                // Verificar permisos
                if (!await this.TienePermisoAsync("Ver Productos"))
                {
                    return Json(new { success = false, message = "Sin permisos para buscar productos" });
                }

                var jwtToken = this.ObtenerTokenJWT();

                // Reutilizar el método existente de inventario con filtrado local
                var todosLosProductos = await _inventarioService.ObtenerProductosAsync(jwtToken);

                // Filtrar por término de búsqueda si se proporciona
                if (!string.IsNullOrWhiteSpace(termino))
                {
                    todosLosProductos = todosLosProductos.Where(p => 
                        p.NombreProducto.Contains(termino, StringComparison.OrdinalIgnoreCase) ||
                        (p.Descripcion != null && p.Descripcion.Contains(termino, StringComparison.OrdinalIgnoreCase)) ||
                        (p.Llanta != null && (
                            (p.Llanta.Marca != null && p.Llanta.Marca.Contains(termino, StringComparison.OrdinalIgnoreCase)) ||
                            (p.Llanta.Modelo != null && p.Llanta.Modelo.Contains(termino, StringComparison.OrdinalIgnoreCase))
                        ))
                    ).ToList();
                }

                // Filtrar solo productos con stock disponible
                var productosDisponibles = todosLosProductos
                    .Where(p => p.CantidadEnInventario > 0)
                    .Skip((pagina - 1) * tamano)
                    .Take(tamano)
                    .ToList();

                var resultado = productosDisponibles.Select(p => new
                {
                    id = p.ProductoId,
                    nombre = p.NombreProducto,
                    descripcion = p.Descripcion ?? "",
                    precio = p.Precio ?? 0,
                    stock = p.CantidadEnInventario,
                    imagen = p.Imagenes?.FirstOrDefault()?.UrlImagen ?? "",
                    esLlanta = p.EsLlanta,
                    llanta = p.EsLlanta && p.Llanta != null ? new
                    {
                        marca = p.Llanta.Marca ?? "",
                        modelo = p.Llanta.Modelo ?? "",
                        medida = $"{p.Llanta.Ancho}/{p.Llanta.Perfil}R{p.Llanta.Diametro}"
                    } : null
                }).ToList();

                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar productos para facturación");
                return Json(new { success = false, message = "Error al buscar productos" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerClientes(string termino = "")
        {
            try
            {
                // Verificar permisos para clientes
                if (!await this.TienePermisoAsync("Ver Clientes"))
                {
                    return Json(new { success = false, message = "Sin permisos para consultar clientes" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clientes = await _clientesService.BuscarClientesAsync(termino, jwtToken);

                var resultado = clientes.Take(20).Select(c => new {
                    id = c.ClienteId,
                    nombre = c.NombreCompleto,
                    email = c.Email,
                    telefono = c.Telefono
                }).ToList();

                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener clientes");
                return Json(new { success = false, message = "Error al obtener clientes" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> VerificarStock([FromBody] List<ProductoVentaDTO> productos)
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Productos"))
                {
                    return Json(new { success = false, message = "Sin permisos para verificar stock" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var stockDisponible = await _facturacionService.VerificarStockDisponibleAsync(productos, jwtToken);

                return Json(new { success = stockDisponible });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar stock");
                return Json(new { success = false, message = "Error al verificar stock" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ProcesarVenta([FromBody] VentaDTO venta)
        {
            try
            {
                if (!await this.TienePermisoAsync("Crear Ventas"))
                {
                    return Json(new { success = false, message = "Sin permisos para procesar ventas" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var ventaProcesada = await _facturacionService.ProcesarVentaAsync(venta, jwtToken);

                if (ventaProcesada)
                {
                    return Json(new { 
                        success = true, 
                        message = "Venta procesada exitosamente",
                        ventaId = 1 // En la implementación real, la API devolvería el ID
                    });
                }

                return Json(new { success = false, message = "Error al procesar la venta" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar venta");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CalcularTotalVenta([FromBody] List<ProductoVentaDTO> productos)
        {
            try
            {
                var total = await _facturacionService.CalcularTotalVentaAsync(productos);
                var subtotal = productos.Sum(p => p.Subtotal);
                var iva = subtotal * 0.13m; // 13% IVA

                return Json(new { 
                    success = true, 
                    subtotal = subtotal,
                    iva = iva,
                    total = total 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al calcular total de venta");
                return Json(new { success = false, message = "Error al calcular totales" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearCliente([FromBody] Cliente cliente)
        {
            try
            {
                if (!await this.TienePermisoAsync("Crear Clientes"))
                {
                    return Json(new { success = false, message = "Sin permisos para crear clientes" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clienteCreado = await _clientesService.CrearClienteAsync(cliente, jwtToken);

                if (clienteCreado)
                {
                    return Json(new { 
                        success = true, 
                        message = "Cliente creado exitosamente"
                    });
                }

                return Json(new { success = false, message = "Error al crear cliente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear cliente");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
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
    }
}