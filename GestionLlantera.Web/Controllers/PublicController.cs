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

                // Obtener producto específico usando el endpoint directo por ID
                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/api/Inventario/productos-publicos/{id}");

                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        _logger.LogWarning("⚠️ Producto {ProductoId} no encontrado o sin stock", id);
                        TempData["Error"] = "El producto no está disponible o no existe.";
                    }
                    else
                    {
                        _logger.LogError("❌ Error del API al obtener producto público: {StatusCode}", response.StatusCode);
                        TempData["Error"] = "Error al obtener el producto del servidor.";
                    }
                    return RedirectToAction("Productos");
                }

                var content = await response.Content.ReadAsStringAsync();

                // Deserializar la respuesta directamente al producto
                using (JsonDocument doc = JsonDocument.Parse(content))
                {
                    var root = doc.RootElement;

                    // Crear ProductoDTO desde la respuesta del API
                    var producto = new ProductoDTO
                    {
                        ProductoId = root.GetProperty("productoId").GetInt32(),
                        NombreProducto = root.GetProperty("nombreProducto").GetString(),
                        Descripcion = root.TryGetProperty("descripcion", out var desc) ? desc.GetString() : null,
                        Precio = root.TryGetProperty("precio", out var precio) ? precio.GetDecimal() : 0,
                        CantidadEnInventario = root.TryGetProperty("cantidadEnInventario", out var cantidad) ? cantidad.GetInt32() : 0,
                        FechaUltimaActualizacion = root.TryGetProperty("fechaUltimaActualizacion", out var fecha) ? fecha.GetDateTime() : DateTime.Now
                    };

                    // Procesar imágenes si existen
                    if (root.TryGetProperty("imagenesProductos", out var imagenesArray))
                    {
                        var imagenesUrls = new List<string>();
                        foreach (var img in imagenesArray.EnumerateArray())
                        {
                            if (img.TryGetProperty("urlimagen", out var urlProp))
                            {
                                var url = urlProp.GetString();
                                if (!string.IsNullOrEmpty(url))
                                {
                                    imagenesUrls.Add(ProcessImageUrl(url));
                                }
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

                    // Procesar información de llanta si existe
                    if (root.TryGetProperty("llanta", out var llantaProp) && llantaProp.ValueKind != JsonValueKind.Null)
                    {
                        producto.EsLlanta = true;
                        var llantaDto = new Tuco.Clases.DTOs.Inventario.LlantaDTO
                        {
                            Marca = llantaProp.TryGetProperty("marca", out var marca) ? marca.GetString() : null,
                            Modelo = llantaProp.TryGetProperty("modelo", out var modelo) ? modelo.GetString() : null,
                            Ancho = llantaProp.TryGetProperty("ancho", out var anchoVal) && anchoVal.TryGetDecimal(out var ancho) ? ancho : null,
                            Perfil = llantaProp.TryGetProperty("perfil", out var perfilVal) && perfilVal.TryGetDecimal(out var perfil) ? perfil : null,
                            Diametro = llantaProp.TryGetProperty("diametro", out var diametroVal) ? diametroVal.GetString() : null,
                            IndiceVelocidad = llantaProp.TryGetProperty("indiceVelocidad", out var indiceVal) ? indiceVal.GetString() : null,
                            TipoTerreno = llantaProp.TryGetProperty("tipoTerreno", out var tipoVal) ? tipoVal.GetString() : null
                        };

                        producto.Llanta = llantaDto;
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
        /// Obtiene productos paginados para la vista pública.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProductosPublica(
            string termino = "", 
            int page = 1, 
            int pageSize = 12,
            string marca = "",
            int? ancho = null,
            int? perfil = null,
            string diametro = "")
        {
            try
            {
                _logger.LogInformation("🛒 === OBTENIENDO PRODUCTOS PAGINADOS PARA VISTA PÚBLICA ===");
                _logger.LogInformation("🛒 Término: {Termino}, Página: {Pagina}, Tamaño: {Tamano}", termino, page, pageSize);

                // Construir parámetros de consulta
                var parametros = new List<string>();
                
                if (page > 0) parametros.Add($"pagina={page}");
                if (pageSize > 0) parametros.Add($"tamano={pageSize}");
                if (!string.IsNullOrWhiteSpace(termino)) parametros.Add($"busqueda={Uri.EscapeDataString(termino)}");
                if (!string.IsNullOrWhiteSpace(marca)) parametros.Add($"marca={Uri.EscapeDataString(marca)}");
                if (ancho.HasValue) parametros.Add($"ancho={ancho.Value}");
                if (perfil.HasValue) parametros.Add($"perfil={perfil.Value}");
                if (!string.IsNullOrWhiteSpace(diametro)) parametros.Add($"diametro={Uri.EscapeDataString(diametro)}");

                var queryString = parametros.Any() ? "?" + string.Join("&", parametros) : "";
                var requestUrl = $"{_apiBaseUrl}/api/Inventario/productos-publicos{queryString}";

                _logger.LogInformation("🌐 Llamando al API: {Url}", requestUrl);

                var response = await _httpClient.GetAsync(requestUrl);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("✅ Respuesta exitosa del API recibida");

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
                        paginacion = new
                        {
                            paginaActual = page,
                            tamano = pageSize,
                            totalRegistros = 0,
                            totalPaginas = 0
                        }
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
                    paginacion = new
                    {
                        paginaActual = page,
                        tamano = pageSize,
                        totalRegistros = 0,
                        totalPaginas = 0
                    }
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