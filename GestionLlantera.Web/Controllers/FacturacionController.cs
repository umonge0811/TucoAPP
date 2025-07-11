using GestionLlantera.Web.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.DTOs.Facturacion;
using Tuco.Clases.Models;
using System.Text.Json;
using System.Text;
using GestionLlantera.Web.Services.Interfaces;
using ProductoVentaFacturacion = Tuco.Clases.DTOs.Facturacion.ProductoVentaDTO;
using ProductoVentaService = GestionLlantera.Web.Services.Interfaces.ProductoVentaDTO;
using AjusteStockFacturacionRequest = GestionLlantera.Web.Services.Interfaces.AjusteStockFacturacionRequest;
using ProductoAjusteStock = GestionLlantera.Web.Services.Interfaces.ProductoAjusteStock;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
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
                _logger.LogInformation("🛒 === ACCESO AL MÓDULO DE FACTURACIÓN ===");
                _logger.LogInformation("🛒 Usuario autenticado: {IsAuthenticated}", User.Identity?.IsAuthenticated);
                _logger.LogInformation("🛒 Nombre de usuario: {Name}", User.Identity?.Name);

                // Obtener información del usuario
                var (usuarioId, nombreUsuario, emailUsuario) = ObtenerInfoUsuario();
                var tokenJWT = this.ObtenerTokenJWT();

                // ✅ VERIFICACIÓN DIRECTA DE PERMISOS DESDE TOKEN JWT
                _logger.LogInformation("🔐 === VERIFICANDO PERMISOS DIRECTAMENTE DESDE TOKEN JWT ===");

                var permisosEnToken = this.ObtenerPermisosDesdeToken();
                _logger.LogInformation("🔐 Permisos encontrados en token: {Permisos}", string.Join(", ", permisosEnToken));

                var puedeCrearFacturas = this.TienePermisoEnToken("Crear Facturas");
                var puedeCompletarFacturas = this.TienePermisoEnToken("Completar Facturas");
                var puedeEditarFacturas = this.TienePermisoEnToken("Editar Facturas");
                var puedeAnularFacturas = this.TienePermisoEnToken("Anular Facturas");
                var esAdmin = await this.EsAdministradorAsync();

                _logger.LogInformation("🔐 === PERMISOS VALIDADOS DESDE TOKEN JWT ===");

                _logger.LogInformation("🔐 puedeCrearFacturas: {Crear}", puedeCrearFacturas);
                _logger.LogInformation("🔐 puedeCompletarFacturas: {Completar}", puedeCompletarFacturas);
                _logger.LogInformation("🔐 puedeEditarFacturas: {Editar}", puedeEditarFacturas);
                _logger.LogInformation("🔐 puedeAnularFacturas: {Anular}", puedeAnularFacturas);
                _logger.LogInformation("🔐 esAdmin: {Admin}", esAdmin);

                var permisos = new
                {
                    puedeCrearFacturas = puedeCrearFacturas,
                    puedeCompletarFacturas = puedeCompletarFacturas,
                    puedeEditarFacturas = puedeEditarFacturas,
                    puedeAnularFacturas = puedeAnularFacturas,
                    esAdmin = esAdmin
                };

                var configuracionCompleta = new
                {
                    Usuario = new
                    {
                        usuarioId = usuarioId,
                        id = usuarioId,
                        nombre = nombreUsuario,
                        nombreUsuario = nombreUsuario,
                        email = emailUsuario
                    },
                    Permisos = permisos,
                    FechaActual = DateTime.Now.ToString("yyyy-MM-dd"),
                    HoraActual = DateTime.Now.ToString("HH:mm"),
                    TokenDisponible = !string.IsNullOrEmpty(tokenJWT)
                };

                _logger.LogInformation("📋 Configuración enviada al frontend: {Config}", 
                    System.Text.Json.JsonSerializer.Serialize(configuracionCompleta));

                ViewBag.ConfiguracionFacturacion = configuracionCompleta;
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
        public async Task<IActionResult> VerificarStock([FromBody] List<ProductoVentaFacturacion> productos)
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Productos"))
                {
                    return Json(new { success = false, message = "Sin permisos para verificar stock" });
                }

                var jwtToken = this.ObtenerTokenJWT();

                // Convertir a la clase esperada por el servicio
                var productosService = productos.Select(p => new ProductoVentaService
                {
                    ProductoId = p.ProductoId,
                    NombreProducto = p.NombreProducto,
                    Descripcion = p.Descripcion,
                    PrecioUnitario = p.Precio,
                    Cantidad = 1, // Valor por defecto
                    CantidadEnInventario = p.CantidadEnInventario,
                    StockMinimo = p.StockMinimo,
                    EsLlanta = p.EsLlanta,
                    MedidaCompleta = p.MedidaCompleta,
                    Marca = p.Marca,
                    Modelo = p.Modelo,
                    ImagenesUrls = p.ImagenesUrls
                }).ToList();

                var stockDisponible = await _facturacionService.VerificarStockDisponibleAsync(productosService, jwtToken);

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
        public async Task<IActionResult> CrearFactura([FromBody] FacturaDTO facturaDto)
        {
            try
            {
                _logger.LogInformation("🧾 === INICIO CrearFactura ===");
                _logger.LogInformation("🧾 Usuario: {Usuario}", User.Identity?.Name);
                _logger.LogInformation("🧾 Autenticado: {Autenticado}", User.Identity?.IsAuthenticated);

                // Verificar permisos
                if (!this.TienePermisoEnToken("Crear Facturas"))
                {
                    _logger.LogWarning("🚫 Usuario sin permisos para crear facturas");
                    return Json(new { success = false, message = "Sin permisos para crear facturas" });
                }

                var jwtToken = this.ObtenerTokenJWT();

                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogError("❌ Token JWT no disponible para crear factura");
                    _logger.LogError("❌ Posible causa: Sesión expirada o middleware JwtClaimsMiddleware cerró la sesión");

                    // Verificar si el usuario sigue autenticado
                    if (!User.Identity?.IsAuthenticated ?? true)
                    {
                        _logger.LogError("❌ Usuario no está autenticado - redirigir a login");
                        return Json(new { 
                            success = false, 
                            message = "Sesión expirada. Inicie sesión nuevamente.",
                            redirectToLogin = true
                        });
                    }

                    return Json(new { 
                        success = false, 
                        message = "Token de autenticación no disponible. Intente refrescar la página.",
                        details = "No se pudo obtener el token JWT necesario para la operación"
                    });
                }

                _logger.LogInformation("🚀 Enviando factura usando servicio: {Cliente}", facturaDto.NombreCliente);
                _logger.LogInformation("📊 Total productos: {Count}, Total: {Total}", facturaDto.DetallesFactura.Count, facturaDto.Total);
                _logger.LogInformation("🔐 Token JWT disponible: {TokenLength} caracteres", jwtToken.Length);

                // ✅ USAR EL SERVICIO DE FACTURACIÓN en lugar de llamada directa
                var resultado = await _facturacionService.CrearFacturaAsync(facturaDto, jwtToken);

                if (resultado.success)
                {
                    // ✅ EXTRAER NÚMERO DE FACTURA DE LA RESPUESTA DEL API
                    string numeroFactura = "N/A";
                    int? facturaId = null;

                    try
                    {
                        if (resultado.data != null)
                        {
                            // Serializar y deserializar para acceder a las propiedades
                            var dataJson = JsonConvert.SerializeObject(resultado.data);
                            dynamic dataObject = JsonConvert.DeserializeObject(dataJson);

                            numeroFactura = dataObject?.numeroFactura?.ToString() ?? "N/A";
                            facturaId = dataObject?.facturaId != null ? (int?)dataObject.facturaId : null;

                            _logger.LogInformation("📋 Número de factura extraído: {NumeroFactura}, ID: {FacturaId}", 
                                numeroFactura, facturaId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("⚠️ Error extrayendo datos de la factura: {Error}", ex.Message);
                    }

                    return Json(new { 
                        success = true, 
                        data = resultado.data,
                        numeroFactura = numeroFactura,
                        facturaId = facturaId,
                        message = resultado.message ?? "Factura procesada exitosamente" 
                    });
                }
                else
                {
                    _logger.LogError("❌ Error del servicio al crear factura: {Message}", resultado.message);

                    return Json(new { 
                        success = false, 
                        message = resultado.message ?? "Error al procesar la factura",
                        details = resultado.details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico al crear factura");
                return Json(new { 
                    success = false, 
                    message = "Error interno del servidor: " + ex.Message,
                    details = ex.ToString()
                });
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
        public async Task<IActionResult> CalcularTotalVenta([FromBody] List<ProductoVentaFacturacion> productos)
        {
            try
            {
                // Convertir a la clase esperada por el servicio
                var productosService = productos.Select(p => new ProductoVentaService
                {
                    ProductoId = p.ProductoId,
                    NombreProducto = p.NombreProducto,
                    Descripcion = p.Descripcion,
                    PrecioUnitario = p.Precio,
                    Cantidad = 1, // Se necesitará enviar este dato desde el frontend
                    CantidadEnInventario = p.CantidadEnInventario,
                    StockMinimo = p.StockMinimo,
                    EsLlanta = p.EsLlanta,
                    MedidaCompleta = p.MedidaCompleta,
                    Marca = p.Marca,
                    Modelo = p.Modelo,
                    ImagenesUrls = p.ImagenesUrls
                }).ToList();

                var total = await _facturacionService.CalcularTotalVentaAsync(productosService);
                var subtotal = productosService.Sum(p => p.Subtotal);
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
        /// Usa exactamente la misma lógica exitosa del InventarioController
        /// </summary>
        private string? ObtenerTokenJWT()
        {
            var token = User.FindFirst("JwtToken")?.Value;

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");

                // Listar todos los claims disponibles para debug
                var claims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
                _logger.LogWarning("📋 Claims disponibles: {Claims}", string.Join(", ", claims));
            }
            else
            {
                _logger.LogInformation("✅ Token JWT obtenido correctamente para usuario: {Usuario}, Longitud: {Length}",
                    User.Identity?.Name ?? "Anónimo", token.Length);
            }

            return token;
        }

        /// <summary>
        /// Extrae los permisos del token JWT
        /// </summary>
        private List<string> ObtenerPermisosDesdeToken()
        {
            var token = ObtenerTokenJWT();
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ No se pudo obtener el token JWT para extraer permisos.");
                return new List<string>();
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtSecurityToken = handler.ReadJwtToken(token);

                var permisos = new List<string>();

                // Buscar claims de permisos en diferentes formatos
                var permissionClaims = jwtSecurityToken.Claims.Where(c => 
                    c.Type == "Permission" || 
                    c.Type == "permissions" || 
                    c.Type == "permisos"
                );

                foreach (var claim in permissionClaims)
                {
                    var valor = claim.Value;

                    // Verificar si el valor es JSON válido
                    if (valor.StartsWith("[") && valor.EndsWith("]"))
                    {
                        try
                        {
                            // Es un array JSON, deserializar
                            var permisosArray = System.Text.Json.JsonSerializer.Deserialize<List<string>>(valor);
                            if (permisosArray != null)
                            {
                                permisos.AddRange(permisosArray);
                            }
                        }
                        catch (System.Text.Json.JsonException)
                        {
                            // Si falla la deserialización, tratar como string simple
                            permisos.Add(valor);
                        }
                    }
                    else
                    {
                        // Es un permiso individual, agregarlo directamente
                        permisos.Add(valor);
                    }
                }

                _logger.LogInformation("🔐 Permisos extraídos del token: {Permisos}", string.Join(", ", permisos));
                return permisos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al extraer permisos del token JWT.");
                return new List<string>();
            }
        }



        /// <summary>
        /// Obtener información completa del usuario desde los claims (igual que InventarioController)
        /// </summary>
        private (int usuarioId, string nombre, string email) ObtenerInfoUsuario()
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo información del usuario...");

                // Debug: Mostrar todos los claims
                _logger.LogInformation("📋 Claims disponibles:");
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation("   - {Type}: {Value}", claim.Type, claim.Value);
                }

                // Intentar diferentes claims para obtener el ID del usuario
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("NameIdentifier claim: {Value}", userIdClaim ?? "NULL");

                var nameClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
                _logger.LogInformation("Name claim: {Value}", nameClaim ?? "NULL");

                var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                _logger.LogInformation("Email claim: {Value}", emailClaim ?? "NULL");

                // Intentar parsear el ID
                int userId = 1; // Fallback
                if (int.TryParse(userIdClaim, out int parsedUserId))
                {
                    userId = parsedUserId;
                    _logger.LogInformation("✅ ID parseado de NameIdentifier: {UserId}", userId);
                }
                else if (int.TryParse(nameClaim, out int userIdFromName))
                {
                    userId = userIdFromName;
                    _logger.LogInformation("✅ ID parseado de Name: {UserId}", userId);
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo obtener el ID del usuario, usando fallback 1");
                }

                return (userId, nameClaim ?? "Usuario", emailClaim ?? "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener información del usuario");
                return (1, "Usuario", "");
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerFacturasPendientes()
        {
            try
            {
                _logger.LogInformation("📋 Solicitud de facturas pendientes desde el controlador Web");

                var token = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                var resultado = await _facturacionService.ObtenerFacturasPendientesAsync(token);

                _logger.LogInformation("📋 Resultado del servicio: Success={Success}, Message={Message}", 
                    resultado.success, resultado.message);

                if (resultado.success && resultado.data != null)
                {
                    _logger.LogInformation("📋 Procesando respuesta del API de facturas pendientes");

                    // El servicio ya procesa la respuesta del API y devuelve la estructura correcta
                    // Solo necesitamos devolverla tal como viene
                    return Json(resultado.data);
                }
                else
                {
                    _logger.LogWarning("📋 No se pudieron obtener las facturas: {Message}", resultado.message);
                    return Json(new { 
                        success = false, 
                        message = resultado.message ?? "No se pudieron obtener las facturas pendientes",
                        facturas = new List<object>(),
                        totalFacturas = 0
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo facturas pendientes");
                return Json(new { 
                    success = false, 
                    message = "Error interno del servidor",
                    facturas = new List<object>(),
                    totalFacturas = 0
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CompletarFactura([FromBody] CompletarFacturaWebRequest request)
        {
            try
            {
                _logger.LogInformation("✅ Completando factura ID: {FacturaId}", request.FacturaId);

                if (!await this.TienePermisoAsync("CompletarFacturas"))
                {
                    return Json(new { success = false, message = "Sin permisos para completar facturas" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Token de autenticación no disponible" });
                }

                // Estructurar datos para el API
                var datosCompletamiento = new
                {
                    facturaId = request.FacturaId,
                    metodoPago = request.MetodoPago,
                    observaciones = request.Observaciones,
                    detallesPago = request.DetallesPago,
                    forzarVerificacionStock = false // Por defecto no forzar verificación para facturas pendientes
                };

                _logger.LogInformation("📋 Enviando datos de completamiento: {Datos}", 
                    System.Text.Json.JsonSerializer.Serialize(datosCompletamiento));

                var resultado = await _facturacionService.CompletarFacturaAsync(request.FacturaId, datosCompletamiento, jwtToken);

                if (resultado.success)
                {
                    return Json(new { 
                        success = true, 
                        data = resultado.data,
                        message = resultado.message 
                    });
                }
                else
                {
                    return Json(new { 
                        success = false, 
                        message = resultado.message,
                        details = resultado.details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error completando factura: {FacturaId}", request?.FacturaId);
                return Json(new { 
                    success = false, 
                    message = "Error interno al completar factura" 
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CompletarFacturaPendiente([FromBody] CompletarFacturaRequest request)
        {
            try
            {
                var response = await _facturacionService.CompletarFacturaAsync(request.FacturaId, new { }, this.ObtenerTokenJWT());
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completando factura pendiente");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AjustarStockFacturacion([FromBody] AjusteStockFacturacionRequest request)
        {
            try
            {
                _logger.LogInformation("📦 === AJUSTANDO STOCK POST-FACTURACIÓN ===");
                _logger.LogInformation("📦 Factura: {NumeroFactura}", request.NumeroFactura);
                _logger.LogInformation("📦 Productos a ajustar: {Cantidad}", request.Productos?.Count ?? 0);

                if (request.Productos == null || !request.Productos.Any())
                {
                    return Json(new { success = false, message = "No se proporcionaron productos para ajustar" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogError("❌ No se pudo obtener token JWT para ajuste de stock");
                    return Json(new { success = false, message = "Error de autenticación" });
                }

                var resultado = await _facturacionService.AjustarStockFacturacionAsync(request, jwtToken);

                if (resultado.Success)
                {
                    _logger.LogInformation("✅ Stock ajustado exitosamente para factura {NumeroFactura}", request.NumeroFactura);
                    return Json(new { 
                        success = true, 
                        message = resultado.Message,
                        ajustesExitosos = resultado.AjustesExitosos,
                        totalProductos = resultado.TotalProductos
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Ajuste de stock parcial o fallido para factura {NumeroFactura}: {Message}", 
                        request.NumeroFactura, resultado.Message);
                    return Json(new { 
                        success = false, 
                        message = resultado.Message,
                        errores = resultado.Errores
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error general ajustando stock para facturación");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> EliminarProductosFactura([FromBody] EliminarProductosFacturaRequest request)
        {
            try
            {
                _logger.LogInformation("🗑️ === ELIMINANDO PRODUCTOS DE FACTURA ===");
                _logger.LogInformation("🗑️ Factura ID: {FacturaId}, Productos: {ProductosCount}", 
                    request.FacturaId, request.ProductosAEliminar?.Count ?? 0);

                // Verificar permisos
                if (!await this.TienePermisoAsync("Editar Facturas"))
                {
                    _logger.LogWarning("🚫 Usuario sin permisos para editar facturas");
                    return Json(new { 
                        success = false, 
                        message = "Sin permisos para editar facturas"
                    });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogError("❌ No se pudo obtener token JWT");
                    return Json(new { 
                        success = false, 
                        message = "Error de autenticación"
                    });
                }

                if (request.FacturaId <= 0 || request.ProductosAEliminar == null || !request.ProductosAEliminar.Any())
                {
                    return Json(new { 
                        success = false, 
                        message = "Datos de solicitud inválidos"
                    });
                }

                // Usar el servicio de facturación para eliminar productos
                var resultado = await _facturacionService.EliminarProductosFacturaAsync(request, jwtToken);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Productos eliminados exitosamente de factura {FacturaId}", request.FacturaId);
                    return Json(new { 
                        success = true,                         message = resultado.message,
                        productosEliminados = resultado.data
                    });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error eliminando productos: {Message}", resultado.message);
                    return Json(new { 
                        success = false, 
                        message = resultado.message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico eliminando productos de factura: {FacturaId}", request?.FacturaId);
                return Json(new { 
                    success = false, 
                    message = "Error interno del servidor"
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> VerificarStockFactura([FromBody] VerificarStockFacturaRequest request)
        {
            try
            {
                _logger.LogInformation("📦 === VERIFICANDO STOCK DE FACTURA DESDE CONTROLADOR WEB ===");
                _logger.LogInformation("📦 Factura ID: {FacturaId}", request.FacturaId);

                // Verificar permisos
                if (!await this.TienePermisoAsync("Ver Productos"))
                {
                    _logger.LogWarning("🚫 Usuario sin permisos para verificar stock");
                    return Json(new { 
                        success = false, 
                        message = "Sin permisos para verificar stock",
                        tieneProblemas = false,
                        productosConProblemas = new List<object>()
                    });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogError("❌ No se pudo obtener token JWT para verificación de stock");
                    return Json(new { 
                        success = false, 
                        message = "Error de autenticación",
                        tieneProblemas = false,
                        productosConProblemas = new List<object>()
                    });
                }

                // Usar el servicio de facturación para verificar stock
                var resultado = await _facturacionService.VerificarStockFacturaAsync(request.FacturaId, jwtToken);

                _logger.LogInformation("📋 Resultado del servicio de verificación: Success={Success}, Data={Data}", 
                    resultado.success, System.Text.Json.JsonSerializer.Serialize(resultado.data));

                if (resultado.success && resultado.data != null)
                {
                    _logger.LogInformation("✅ Verificación de stock exitosa para factura {FacturaId}", request.FacturaId);

                    // ✅ MAPEAR CORRECTAMENTE LAS PROPIEDADES DE LA RESPUESTA DEL API
                    var hayProblemasStock = GetProperty<bool>(resultado.data, "hayProblemasStock", false);
                    var tieneProblemas = GetProperty<bool>(resultado.data, "tieneProblemas", hayProblemasStock);
                    var productosConProblemas = GetProperty<List<object>>(resultado.data, "productosConProblemas", new List<object>());

                    var respuestaFinal = new {
                        success = true,
                        hayProblemasStock = hayProblemasStock,
                        tieneProblemas = tieneProblemas,
                        productosConProblemas = productosConProblemas,
                        message = GetProperty<string>(resultado.data, "message", "Verificación completada")
                    };

                    _logger.LogInformation("📤 Propiedades mapeadas: hayProblemasStock={HayProblemas}, tieneProblemas={TieneProblemas}, productos={Count}", 
                        hayProblemasStock, tieneProblemas, productosConProblemas.Count);

                    _logger.LogInformation("📤 Respuesta final enviada al frontend: {Respuesta}", 
                        System.Text.Json.JsonSerializer.Serialize(respuestaFinal));

                    return Json(respuestaFinal);
                }
                else
                {
                    _logger.LogWarning("⚠️ Error verificando stock: {Message}", resultado.message);
                    return Json(new { 
                        success = false, 
                        message = resultado.message ?? "Error desconocido verificando stock",
                        tieneProblemas = false,
                        productosConProblemas = new List<object>()
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico verificando stock de factura: {FacturaId}", request?.FacturaId);
                return Json(new { 
                    success = false, 
                    message = "Error interno del servidor: " + ex.Message,
                    tieneProblemas = false,
                    productosConProblemas = new List<object>()
                });
            }
        }

        private T GetProperty<T>(object data, string propertyName, T defaultValue)
        {
            try
            {
                if (data == null) return defaultValue;

                var json = System.Text.Json.JsonSerializer.Serialize(data);
                var jsonElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);

                if (jsonElement.TryGetProperty(propertyName, out var property))
                {
                    return System.Text.Json.JsonSerializer.Deserialize<T>(property.GetRawText());
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("⚠️ Error extrayendo propiedad {PropertyName}: {Error}", propertyName, ex.Message);
            }

            return defaultValue;
        }

        [HttpPost]
        public async Task<IActionResult> RegistrarProductosPendientesEntrega([FromBody] RegistrarPendientesEntregaRequest request)
        {
            try
            {
                _logger.LogInformation("📝 === REGISTRANDO PRODUCTOS PENDIENTES DE ENTREGA ===");
                _logger.LogInformation("📝 Factura ID: {FacturaId}, Usuario: {UsuarioCreacion}, Productos: {Count}",
                    request.FacturaId, request.UsuarioCreacion, request.ProductosPendientes?.Count ?? 0);

                // Log detallado de los datos recibidos
                _logger.LogInformation("📝 Datos completos recibidos: {Request}", 
                    System.Text.Json.JsonSerializer.Serialize(request));

                if (!await this.TienePermisoAsync("Crear Facturas"))
                {
                    return Json(new { success = false, message = "Sin permisos para registrar pendientes de entrega" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Token de autenticación no disponible" });
                }

                // ✅ MAPEAR CORRECTAMENTE LOS DATOS PARA LA API
                var datosParaAPI = new
                {
                    facturaId = request.FacturaId,
                    usuarioCreacion = request.UsuarioCreacion,
                    productosPendientes = request.ProductosPendientes.Select(p => new
                    {
                        productoId = p.ProductoId,
                        nombreProducto = p.NombreProducto,
                        cantidadSolicitada = p.CantidadPendiente, // La cantidad que se solicitó originalmente
                        cantidadPendiente = p.CantidadPendiente,  // La cantidad que queda pendiente
                        stockDisponible = 0, // Stock disponible al momento (generalmente 0)
                        precioUnitario = p.PrecioUnitario,
                        observaciones = p.Observaciones
                    }).ToList()
                };

                _logger.LogInformation("📝 Datos mapeados para API: {DatosAPI}", 
                    System.Text.Json.JsonSerializer.Serialize(datosParaAPI));

                var resultado = await _facturacionService.RegistrarPendientesEntregaAsync(request, jwtToken);

                if (resultado.success)
                {
                    return Json(new
                    {
                        success = true,
                        message = resultado.message,
                        data = resultado.data
                    });
                }
                else
                {
                    return Json(new
                    {
                        success = false,
                        message = resultado.message,
                        details = resultado.details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error registrando pendientes de entrega");
                return Json(new
                {
                    success = false,
                    message = "Error interno del servidor: " + ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPendientesEntrega()
        {
            try
            {
                _logger.LogInformation("📦 === OBTENIENDO PENDIENTES DE ENTREGA ===");

                if (!await this.TienePermisoAsync("Ver Productos"))
                {
                    return Json(new { success = false, message = "Sin permisos para ver pendientes de entrega" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Token de autenticación no disponible" });
                }

                var resultado = await _facturacionService.ObtenerPendientesEntregaAsync(jwtToken);

                if (resultado.success)
                {
                    return Json(new
                    {
                        success = true,
                        data = resultado.data,
                        message = resultado.message
                    });
                }
                else
                {
                    return Json(new
                    {
                        success = false,
                        message = resultado.message,
                        details = resultado.details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pendientes de entrega");
                return Json(new
                {
                    success = false,
                    message = "Error interno del servidor: " + ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> MarcarProductosEntregados([FromBody] MarcarEntregadosRequest request)
        {
            try
            {
                _logger.LogInformation("✅ === MARCANDO PRODUCTOS COMO ENTREGADOS ===");
                _logger.LogInformation("✅ Productos a marcar: {Count}", request.ProductosIds?.Count ?? 0);

                if (!await this.TienePermisoAsync("Completar Facturas"))
                {
                    return Json(new { success = false, message = "Sin permisos para marcar productos como entregados" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Token de autenticación no disponible" });
                }

                var resultado = await _facturacionService.MarcarProductosEntregadosAsync(request, jwtToken);

                if (resultado.success)
                {
                    return Json(new
                    {
                        success = true,
                        message = resultado.message,
                        data = resultado.data
                    });
                }
                else
                {
                    return Json(new
                    {
                        success = false,
                        message = resultado.message,
                        details = resultado.details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error marcando productos como entregados");
                return Json(new
                {
                    success = false,
                    message = "Error interno del servidor: " + ex.Message
                });
            }
        }

    }

    public class VerificarStockFacturaRequest
    {
        public int FacturaId { get; set; }
    }

    public class EliminarProductosFacturaRequest
    {
        public int FacturaId { get; set; }
        public List<int> ProductosAEliminar { get; set; } = new List<int>();
    }

    public class CompletarFacturaRequest
    {
        public int FacturaId { get; set; }
    }

    public class CompletarFacturaWebRequest
    {
        public int FacturaId { get; set; }
        public string? MetodoPago { get; set; }
        public List<DetallePagoWebDTO>? DetallesPago { get; set; }
        public string? Observaciones { get; set; }
    }

    public class DetallePagoWebDTO
    {
        public string MetodoPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string? Referencia { get; set; }
        public string? Observaciones { get; set; }
        public DateTime? FechaPago { get; set; }
    }

    public class RegistrarPendientesEntregaRequest
    {
        public int FacturaId { get; set; }
        public int UsuarioCreacion { get; set; }
        public List<ProductoPendienteEntrega> ProductosPendientes { get; set; } = new List<ProductoPendienteEntrega>();
    }

    public class ProductoPendienteEntrega
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int CantidadSolicitada { get; set; }
        public int CantidadPendiente { get; set; }
        public int StockDisponible { get; set; }
        public decimal PrecioUnitario { get; set; }
        public string? Observaciones { get; set; }
    }

    public class MarcarEntregadosRequest
    {
        public List<int> ProductosIds { get; set; } = new List<int>();
        public string? ObservacionesEntrega { get; set; }
        public DateTime? FechaEntrega { get; set; }
    }
}