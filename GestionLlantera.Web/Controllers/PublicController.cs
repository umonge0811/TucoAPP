using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Tuco.Clases.DTOs.Inventario;
using System.Text.Json;

namespace GestionLlantera.Web.Controllers
{
    /// <summary>
    /// Controlador público para mostrar productos sin autenticación
    /// </summary>
    public class PublicController : Controller
    {
        private readonly IInventarioService _inventarioService;
        private readonly ILogger<PublicController> _logger;
        private readonly HttpClient _httpClient; // Asumiendo que HttpClient está disponible
        private readonly string _apiBaseUrl; // Asumiendo que _apiBaseUrl se configura en algún lugar

        public PublicController(IInventarioService inventarioService, ILogger<PublicController> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _inventarioService = inventarioService;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _apiBaseUrl = configuration["ApiBaseUrl"] ?? "https://localhost:7273"; // Asegúrate de que esto coincida con tu configuración
        }

        /// <summary>
        /// Vista principal de productos públicos
        /// </summary>
        public async Task<IActionResult> Productos()
        {
            try
            {
                // Obtener productos con stock > 0
                var productos = await _inventarioService.ObtenerProductosPublicosAsync();
                return View(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar productos públicos");
                return View(new List<ProductoDTO>());
            }
        }

        /// <summary>
        /// Vista de detalle de producto público
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> DetalleProducto(int id)
        {
            try
            {
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id);

                if (producto == null || producto.CantidadEnInventario <= 0)
                {
                    TempData["Error"] = "El producto no está disponible o no existe.";
                    return RedirectToAction("Productos");
                }

                return View(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar detalle del producto {ProductoId}", id);
                TempData["Error"] = "Error al cargar el detalle del producto.";
                return RedirectToAction("Productos");
            }
        }

        /// <summary>
        /// Obtiene productos para la vista pública, replicando la lógica de facturación.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProductosParaFacturacion(string termino = "", int pagina = 1, int tamano = 20)
        {
            try
            {
                _logger.LogInformation("🛒 === OBTENIENDO PRODUCTOS PARA VISTA PÚBLICA ===");
                _logger.LogInformation("🛒 Parámetros: Término={Termino}, Página={Pagina}, Tamaño={Tamano}", termino, pagina, tamano);

                // ✅ USAR LA MISMA LÓGICA QUE EL ENDPOINT EXITOSO DE FACTURACIÓN
                var todosLosProductos = await _inventarioService.ObtenerProductosAsync(null); // Sin JWT para vista pública

                // Filtrar por término de búsqueda si se proporciona (igual que facturación)
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

                // Filtrar solo productos con stock disponible (igual que facturación)
                var productosDisponibles = todosLosProductos
                    .Where(p => p.CantidadEnInventario > 0)
                    .Skip((pagina - 1) * tamano)
                    .Take(tamano)
                    .ToList();

                // ✅ MISMA ESTRUCTURA DE RESPUESTA QUE EL ENDPOINT DE FACTURACIÓN
                var productos = productosDisponibles.Select(p => new
                {
                    productoId = p.ProductoId,
                    nombreProducto = p.NombreProducto,
                    descripcion = p.Descripcion ?? "",
                    precio = p.Precio.HasValue ? p.Precio.Value : 0,
                    cantidadEnInventario = p.CantidadEnInventario,
                    stockMinimo = p.StockMinimo,
                    imagenesProductos = p.Imagenes?.Select(img => new
                    {
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

                _logger.LogInformation("✅ {Count} productos procesados para vista pública", productos.Count);

                return Json(new
                {
                    success = true,
                    productos = productos,
                    total = productos.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo productos para vista pública");
                return Json(new
                {
                    success = false,
                    message = "Error interno del servidor",
                    productos = new List<object>(),
                    total = 0
                });
            }
        }

        // ✅ MÉTODO AUXILIAR COPIADO DEL FACTURACIÓN CONTROLLER
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
                return $"{_apiBaseUrl}{url}";
            }

            // Si es una ruta sin la barra inicial
            if (url.StartsWith("uploads/"))
            {
                return $"{_apiBaseUrl}/{url}";
            }

            // Para otras rutas, asegurar que empiecen con /
            return url.StartsWith("/") ? url : "/" + url;
        }
    }
}