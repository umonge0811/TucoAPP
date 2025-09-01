using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Linq;
using System.Text.Json;
using Tuco.Clases.DTOs.Inventario;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace GestionLlantera.Web.Controllers
{
    /// <summary>
    /// Controlador público para mostrar productos sin autenticación
    /// </summary>
    public class PublicController : Controller
    {
        private readonly HttpClient _httpClient; // Asumiendo que HttpClient está disponible
        private readonly ILogger<PublicController> _logger;
        private readonly ApiConfigurationService _apiConfig;
        private readonly IInventarioService _inventarioService;
        private readonly IConfiguration _configuration;
        private readonly string _apiBaseUrl; // Asumiendo que _apiBaseUrl se configura en algún lugar


        public PublicController(IConfiguration config,IInventarioService inventarioService, ILogger<PublicController> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration, ApiConfigurationService apiConfig)
        {
            _inventarioService = inventarioService;
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _configuration = config;
            _apiBaseUrl = config.GetSection("ApiSettings:BaseUrl").Value;
            /// ✅ INYECCIÓN DEL SERVICIO DE CONFIGURACIÓN CENTRALIZADA
            _apiConfig = apiConfig;
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
        [Route("Public/DetalleProducto/{id:int}")]
        public async Task<IActionResult> DetalleProducto(int id)
        {
            try
            {
                _logger.LogInformation("🔍 Solicitando detalle del producto público: {ProductoId}", id);
                
                // Obtener producto usando el endpoint público
                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/api/Inventario/productos-publicos");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error del API al obtener productos públicos: {StatusCode}", response.StatusCode);
                    TempData["Error"] = "Error al obtener los productos del servidor.";
                    return RedirectToAction("Productos");
                }

                var content = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<dynamic>(content);
                
                // Parsear la respuesta JSON manualmente para encontrar el producto específico
                using (JsonDocument doc = JsonDocument.Parse(content))
                {
                    var root = doc.RootElement;
                    if (!root.TryGetProperty("success", out var successProp) || !successProp.GetBoolean())
                    {
                        TempData["Error"] = "No se pudieron obtener los productos.";
                        return RedirectToAction("Productos");
                    }

                    if (!root.TryGetProperty("productos", out var productosProp))
                    {
                        TempData["Error"] = "No se encontraron productos.";
                        return RedirectToAction("Productos");
                    }

                    ProductoDTO producto = null;
                    
                    foreach (var item in productosProp.EnumerateArray())
                    {
                        if (item.TryGetProperty("productoId", out var idProp) && idProp.GetInt32() == id)
                        {
                            // Convertir el JsonElement a ProductoDTO
                            var jsonString = item.GetRawText();
                            producto = JsonSerializer.Deserialize<ProductoDTO>(jsonString, new JsonSerializerOptions 
                            { 
                                PropertyNameCaseInsensitive = true 
                            });

                            // ✅ PROCESAR IMÁGENES COMO EN EL MÉTODO ObtenerProductosParaFacturacion
                            if (producto != null && item.TryGetProperty("imagenesUrls", out var imagenesUrlsProp))
                            {
                                var imagenesUrls = new List<string>();
                                foreach (var imgUrl in imagenesUrlsProp.EnumerateArray())
                                {
                                    var url = imgUrl.GetString();
                                    if (!string.IsNullOrEmpty(url))
                                    {
                                        imagenesUrls.Add(ProcessImageUrl(url));
                                    }
                                }

                                // Convertir URLs a ImagenProductoDTO para compatibilidad con la vista
                                if (imagenesUrls.Any())
                                {
                                    producto.Imagenes = imagenesUrls.Select(url => new Tuco.Clases.DTOs.Inventario.ImagenProductoDTO
                                    {
                                        UrlImagen = url
                                    }).ToList();

                                    _logger.LogInformation("🖼️ Imágenes procesadas para producto {ProductoId}: {CantidadImagenes}", 
                                        id, producto.Imagenes.Count);
                                }
                            }
                            break;
                        }
                    }

                    if (producto == null)
                    {
                        _logger.LogWarning("⚠️ Producto {ProductoId} no encontrado en productos públicos", id);
                        TempData["Error"] = "El producto no está disponible o no existe.";
                        return RedirectToAction("Productos");
                    }

                    if (producto.CantidadEnInventario <= 0)
                    {
                        _logger.LogWarning("⚠️ Producto {ProductoId} sin stock disponible", id);
                        TempData["Error"] = "El producto no tiene stock disponible.";
                        return RedirectToAction("Productos");
                    }

                    _logger.LogInformation("✅ Producto {ProductoId} encontrado: {NombreProducto}", id, producto.NombreProducto);
                    return View(producto);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cargar detalle del producto {ProductoId}", id);
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