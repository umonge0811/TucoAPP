using GestionLlantera.Web.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;
using System.Text.Json;
using System.Text;
using static GestionLlantera.Web.Services.Interfaces.IFacturacionService;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    [PermisoRequerido("Ver Facturación")]
    public class FacturacionController : Controller
    {
        private readonly ILogger<FacturacionController> _logger;
        private readonly IInventarioService _inventarioService;
        private readonly IFacturacionService _facturacionService;
        private readonly IConfiguration _configuration;

        public FacturacionController(
            ILogger<FacturacionController> logger,
            IInventarioService inventarioService,
            IFacturacionService facturacionService,
            IConfiguration configuration
            )
        {
            _logger = logger;
            _inventarioService = inventarioService;
            _facturacionService = facturacionService;
            _configuration = configuration;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                _logger.LogInformation("🛒 Accediendo al módulo de facturación");

                // Obtener información del usuario actual
                var usuarioId = User.FindFirst("UserId")?.Value;
                var nombreUsuario = User.Identity?.Name;

                // ✅ Verificar permisos específicos de facturación
                var permisos = new
                {
                    puedeCrearFacturas = await this.TienePermisoAsync("CrearFacturas"),
                    puedeCompletarFacturas = await this.TienePermisoAsync("CompletarFacturas"),
                    puedeEditarFacturas = await this.TienePermisoAsync("EditarFacturas"),
                    puedeAnularFacturas = await this.TienePermisoAsync("AnularFacturas"),
                    esAdmin = User.IsInRole("Administrador")
                };

                _logger.LogInformation("🔐 Permisos de facturación para usuario {Usuario}: Crear={Crear}, Completar={Completar}, Editar={Editar}, Anular={Anular}", 
                    nombreUsuario, permisos.puedeCrearFacturas, permisos.puedeCompletarFacturas, 
                    permisos.puedeEditarFacturas, permisos.puedeAnularFacturas);

                var viewModel = new
                {
                    UsuarioId = usuarioId,
                    NombreUsuario = nombreUsuario,
                    FechaActual = DateTime.Now.ToString("yyyy-MM-dd"),
                    HoraActual = DateTime.Now.ToString("HH:mm"),
                    Permisos = permisos
                };

                ViewBag.ConfiguracionFacturacion = viewModel;
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cargar módulo de facturación");
                TempData["Error"] = "Error al cargar el módulo de facturación";
                return RedirectToAction("Index", "Dashboard");
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerProductosParaFacturacion(string termino = "", int pagina = 1, int tamano = 20)
        {
            try
            {
                // Verificar permisos
                if (!await this.TienePermisoAsync("Ver Productos"))
                {
                    return Json(new { success = false, message = "Sin permisos para buscar productos" });
                }

                var jwtToken = this.ObtenerTokenJWT();

                // Obtener todos los productos disponibles
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

                // Filtrar solo productos con stock disponible para la venta
                var productosDisponibles = todosLosProductos
                    .Where(p => p.CantidadEnInventario > 0)
                    .Skip((pagina - 1) * tamano)
                    .Take(tamano)
                    .ToList();

                var productos = productosDisponibles.Select(p => new
                {
                    productoId = p.ProductoId,
                    nombreProducto = p.NombreProducto,
                    descripcion = p.Descripcion ?? "",
                    precio = p.Precio.HasValue ? p.Precio.Value : 0,
                    cantidadEnInventario = p.CantidadEnInventario,
                    stockMinimo = p.StockMinimo,
                    imagenesProductos = p.Imagenes?.Select(img => new {
                        Urlimagen = ProcessImageUrl(img.UrlImagen)
                    }).ToList() ?? new[] { new { Urlimagen = "/images/no-image.png" } }.ToList(),
                    imagenesUrls = p.Imagenes?.Select(img => ProcessImageUrl(img.UrlImagen)).ToList() ?? new List<string> { "/images/no-image.png" },
                    esLlanta = p.EsLlanta,
                    llanta = p.EsLlanta && p.Llanta != null ? new
                    {
                        marca = p.Llanta.Marca ?? "",
                        modelo = p.Llanta.Modelo ?? "",
                        ancho = p.Llanta.Ancho,
                        perfil = p.Llanta.Perfil,
                        diametro = p.Llanta.Diametro,
                        indiceVelocidad = p.Llanta.IndiceVelocidad ?? "",
                        medidaCompleta = $"{p.Llanta.Ancho}/{p.Llanta.Perfil}R{p.Llanta.Diametro}"
                    } : null
                }).ToList();

                return Json(new { 
                    success = true, 
                    productos = productos,
                    total = productos.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener productos para facturación");
                return Json(new { success = false, message = "Error al obtener productos" });
            }
        }

        private string ProcessImageUrl(string? url)
        {
            if (string.IsNullOrEmpty(url)) return "/images/no-image.png";

            // Si ya es una URL completa, mantenerla tal como está
            if (url.StartsWith("http"))
            {
                return url;
            }

            // Si es una ruta que empieza con /uploads/, construir URL completa
            if (url.StartsWith("/uploads/"))
            {
                return $"https://localhost:7273{url}";
            }

            // Si es una ruta sin la barra inicial
            if (url.StartsWith("uploads/"))
            {
                return $"https://localhost:7273/{url}";
            }

            // Para otras rutas, asegurar que empiecen con /
            return url.StartsWith("/") ? url : "/" + url;
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
                    precio = p.Precio.HasValue ? p.Precio.Value : 0,
                    stock = p.CantidadEnInventario,
                    imagenesProductos = p.Imagenes?.Select(img => new {
                        Urlimagen = ProcessImageUrl(img.UrlImagen)
                    }).ToList() ?? new[] { new { Urlimagen = "/images/no-image.png" } }.ToList(),
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
                if (!await this.TienePermisoAsync("Crear Facturas"))
                {
                    return Json(new { 
                        success = false, 
                        message = "Sin permisos para procesar ventas" 
                    });
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
        public async Task<IActionResult> CrearFactura([FromBody] object facturaData)
        {
            try
            {
                if (!await this.TienePermisoAsync("Crear Facturas"))
                {
                    return Json(new { success = false, message = "Sin permisos para crear facturas" });
                }

                _logger.LogInformation("💰 Creando nueva factura");

                // Simular creación exitosa por ahora
                var numeroFactura = $"FAC-{DateTime.Now:yyyyMM}-{DateTime.Now:HHmmss}";

                return Json(new { 
                    success = true, 
                    message = "Factura creada exitosamente",
                    numeroFactura = numeroFactura,
                    facturaId = 1
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear factura");
                return Json(new { success = false, message = "Error al crear factura" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AjustarStock([FromBody] object ajusteData)
        {
            try
            {
                if (!await this.TienePermisoAsync("Editar Inventario"))
                {
                    return Json(new { success = false, message = "Sin permisos para ajustar stock" });
                }

                _logger.LogInformation("📦 Ajustando stock de producto");

                // Simular ajuste exitoso por ahora
                return Json(new { 
                    success = true, 
                    message = "Stock ajustado correctamente"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ajustar stock");
                return Json(new { success = false, message = "Error al ajustar stock" });
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

        [HttpPost]
        [Route("Facturacion/AjustarStockFacturacion")]
        public async Task<IActionResult> AjustarStockFacturacion([FromBody] AjusteStockFacturacionRequest request)
        {
            try
            {
                _logger.LogInformation("📦 Ajustando stock para factura: {NumeroFactura} con {Cantidad} productos", 
                    request.NumeroFactura, request.Productos?.Count ?? 0);

                if (request.Productos == null || !request.Productos.Any())
                {
                    return Json(new { 
                        success = false, 
                        message = "No se proporcionaron productos para ajustar" 
                    });
                }

                // Usar el servicio de facturación para ajustar el stock
                var jwtToken = this.ObtenerTokenJWT();
                var resultado = await _facturacionService.AjustarStockFacturacionAsync(request, jwtToken);

                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error general al ajustar stock para factura {NumeroFactura}", 
                    request?.NumeroFactura);
                return Json(new { 
                    success = false, 
                    message = "Error interno al ajustar stock: " + ex.Message 
                });
            }
        }
    }
}