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
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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
                    return Json(new { 
                        success = true, 
                        data = resultado.data,
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
                            var permisosArray = JsonSerializer.Deserialize<List<string>>(valor);
                            if (permisosArray != null)
                            {
                                permisos.AddRange(permisosArray);
                            }
                        }
                        catch (JsonException)
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
                _logger.LogInformation("📋 === INICIO ObtenerFacturasPendientes ===");
                _logger.LogInformation("📋 Usuario: {Usuario}", User.Identity?.Name);

                if (!await this.TienePermisoAsync("Ver Facturas"))
                {
                    _logger.LogWarning("🚫 Usuario sin permisos para ver facturas");
                    return Json(new { success = false, message = "Sin permisos para ver facturas" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    _logger.LogError("❌ Token JWT no disponible");
                    return Json(new { success = false, message = "Token de autenticación no disponible" });
                }

                _logger.LogInformation("📋 Llamando al servicio de facturación...");
                var resultado = await _facturacionService.ObtenerFacturasPendientesAsync(jwtToken);

                _logger.LogInformation("📋 Resultado del servicio: success={Success}", resultado.success);

                if (resultado.success)
                {
                    _logger.LogInformation("📋 Enviando respuesta exitosa al frontend");
                    _logger.LogInformation("📋 Estructura de datos: {Data}", JsonConvert.SerializeObject(resultado.data, Formatting.Indented));
                    
                    return Json(new { 
                        success = true, 
                        data = resultado.data,
                        message = resultado.message 
                    });
                }
                else
                {
                    _logger.LogError("❌ Error del servicio: {Message}", resultado.message);
                    return Json(new { 
                        success = false, 
                        message = resultado.message,
                        details = resultado.details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo facturas pendientes");
                return Json(new { 
                    success = false, 
                    message = "Error interno al obtener facturas pendientes",
                    details = ex.Message
                });
            }
            finally
            {
                _logger.LogInformation("📋 === FIN ObtenerFacturasPendientes ===");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CompletarFactura(int id)
        {
            try
            {
                _logger.LogInformation("✅ Completando factura ID: {FacturaId}", id);

                if (!await this.TienePermisoAsync("CompletarFacturas"))
                {
                    return Json(new { success = false, message = "Sin permisos para completar facturas" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Json(new { success = false, message = "Token de autenticación no disponible" });
                }

                var resultado = await _facturacionService.CompletarFacturaAsync(id, new { }, jwtToken);

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
                _logger.LogError(ex, "❌ Error completando factura: {FacturaId}", id);
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

                // Convertir el request del controller al tipo esperado por el servicio
                var serviceRequest = new Services.Interfaces.AjusteStockFacturacionRequest
                {
                    NumeroFactura = request.NumeroFactura,
                    Productos = request.Productos.Select(p => new Services.Interfaces.ProductoAjusteStock
                    {
                        ProductoId = p.ProductoId,
                        NombreProducto = p.NombreProducto,
                        Cantidad = p.Cantidad
                    }).ToList()
                };

                // Usar el servicio de facturación para ajustar el stock
                var jwtToken = this.ObtenerTokenJWT();
                var resultado = await _facturacionService.AjustarStockFacturacionAsync(serviceRequest, jwtToken);

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

    public class AjusteStockFacturacionRequest
    {
        public string NumeroFactura { get; set; }
        public List<ProductoAjusteStock> Productos { get; set; }
    }

    public class ProductoAjusteStock
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; }
        public int Cantidad { get; set; }
    }

    public class CompletarFacturaRequest
    {
        public int FacturaId { get; set; }
        public string NumeroFactura { get; set; }
    }
}