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
        /// Obtiene productos para la vista pública, replicando exactamente la lógica de facturación.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProductosParaFacturacion(string termino = "")
        {
            try
            {
                _logger.LogInformation("🛒 === OBTENIENDO PRODUCTOS PARA VISTA PÚBLICA ===");
                _logger.LogInformation("🛒 Término de búsqueda: {Termino}", termino);

                // ✅ LLAMAR DIRECTAMENTE AL API COMO LO HACE FACTURACIÓN
                var requestUrl = $"{_apiBaseUrl}/api/Inventario/productos-publicos";
                
                _logger.LogInformation("🌐 Llamando al API: {Url}", requestUrl);

                var response = await _httpClient.GetAsync(requestUrl);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("✅ Respuesta exitosa del API recibida");
                    
                    // Devolver la respuesta directamente del API (ya tiene el formato correcto)
                    return Content(content, "application/json");
                }
                else
                {
                    _logger.LogError("❌ Error del API: {StatusCode}", response.StatusCode);
                    return Json(new
                    {
                        success = false,
                        message = "Error al obtener productos del servidor",
                        productos = new List<object>(),
                        total = 0
                    });
                }
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