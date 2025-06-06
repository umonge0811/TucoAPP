// ========================================
// CONTROLADOR DEPURADO PARA TOMA DE INVENTARIO (WEB)
// Ubicación: GestionLlantera.Web/Controllers/TomaInventarioController.cs
// ========================================

using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Controllers
{
    /// <summary>
    /// 🎯 CONTROLADOR ESPECÍFICO PARA LA EJECUCIÓN DE TOMA DE INVENTARIOS
    /// 
    /// RESPONSABILIDADES:
    /// - Mostrar interfaz de ejecución de inventarios
    /// - Manejar conteos en tiempo real
    /// - Gestionar progreso de inventarios
    /// - Búsqueda de productos durante el conteo
    /// 
    /// NO MANEJA:
    /// - Programación de inventarios (eso lo hace InventarioController)
    /// - CRUD de productos (eso lo hace InventarioController)
    /// - Gestión de usuarios (eso lo hace InventarioController)
    /// </summary>
    [Authorize] // 🔒 Solo usuarios autenticados
    public class TomaInventarioController : Controller
    {
        private readonly ITomaInventarioService _tomaInventarioService;
        private readonly IInventarioService _inventarioService;
        private readonly ILogger<TomaInventarioController> _logger;

        public TomaInventarioController(
            ITomaInventarioService tomaInventarioService,
            IInventarioService inventarioService,
            ILogger<TomaInventarioController> logger)
        {
            _tomaInventarioService = tomaInventarioService;
            _inventarioService = inventarioService;
            _logger = logger;
        }

        // =====================================
        // 🚀 MÉTODO PRINCIPAL: INTERFAZ DE EJECUCIÓN
        // =====================================

        /// <summary>
        /// 📱 Muestra la interfaz principal para realizar la toma de inventario
        /// GET: /TomaInventario/Ejecutar/5
        /// </summary>
        public async Task<IActionResult> Ejecutar(int id)
        {
            ViewData["Title"] = "Toma de Inventario";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                _logger.LogInformation("🚀 === MÉTODO EJECUTAR LLAMADO ===");
                _logger.LogInformation("🚀 ID del inventario: {Id}", (object)id);
                _logger.LogInformation("🚀 URL solicitada: {Url}", (object)(Request.Path + Request.QueryString));
                _logger.LogInformation("🚀 Usuario: {Usuario}", (object)(User.Identity?.Name ?? "Anónimo"));

                // ✅ VERIFICAR SESIÓN
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado");
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                _logger.LogInformation("🔐 Token JWT obtenido correctamente");

                // ✅ OBTENER INFORMACIÓN DEL INVENTARIO usando el servicio de inventario
                var inventario = await _inventarioService.ObtenerInventarioProgramadoPorIdAsync(id, token);

                _logger.LogInformation("📋 === INFORMACIÓN DEL INVENTARIO ===");
                if (inventario == null)
                {
                    _logger.LogError("❌ Inventario es NULL");
                }
                else
                {
                    _logger.LogInformation("📋 ID: {Id}", (object)inventario.InventarioProgramadoId);
                    _logger.LogInformation("📋 Título: {Titulo}", (object)(inventario.Titulo ?? "Sin título"));
                    _logger.LogInformation("📋 Estado: {Estado}", (object)(inventario.Estado ?? "Sin estado"));
                    _logger.LogInformation("📋 Fecha inicio: {Fecha}", (object)inventario.FechaInicio);
                    _logger.LogInformation("📋 Fecha fin: {Fecha}", (object)inventario.FechaFin);
                    _logger.LogInformation("📋 Total asignaciones: {Count}", (object)(inventario.AsignacionesUsuarios?.Count ?? 0));
                }

                if (inventario == null || inventario.InventarioProgramadoId == 0)
                {
                    _logger.LogError("❌ Inventario no encontrado - ID: {Id}", (object)id);
                    TempData["Error"] = "Inventario no encontrado.";
                    return RedirectToAction("ProgramarInventario", "Inventario");
                }

                // ✅ VERIFICAR QUE ESTÉ EN PROGRESO
                if (inventario.Estado != "En Progreso")
                {
                    _logger.LogWarning("⚠️ Inventario no está en progreso: {Estado}", (object)(inventario.Estado ?? "Sin estado"));
                    TempData["Error"] = $"El inventario está en estado '{inventario.Estado}' y no se puede realizar toma.";
                    return RedirectToAction("DetalleInventarioProgramado", "Inventario", new { id });
                }

                // ✅ VERIFICAR PERMISOS DEL USUARIO ACTUAL
                var usuarioId = ObtenerIdUsuarioActual();
                var puedeContar = inventario.AsignacionesUsuarios?.Any(a => a.UsuarioId == usuarioId && a.PermisoConteo) ?? false;
                var puedeAjustar = inventario.AsignacionesUsuarios?.Any(a => a.UsuarioId == usuarioId && a.PermisoAjuste) ?? false;
                var puedeValidar = inventario.AsignacionesUsuarios?.Any(a => a.UsuarioId == usuarioId && a.PermisoValidacion) ?? false;
                var esAdmin = await this.TienePermisoAsync("Programar Inventario");

                _logger.LogInformation("🔐 === PERMISOS DEL USUARIO ===");
                _logger.LogInformation("🔐 Usuario ID: {UsuarioId}", (object)usuarioId);
                _logger.LogInformation("🔐 Puede contar: {PuedeContar}", (object)puedeContar);
                _logger.LogInformation("🔐 Puede ajustar: {PuedeAjustar}", (object)puedeAjustar);
                _logger.LogInformation("🔐 Puede validar: {PuedeValidar}", (object)puedeValidar);
                _logger.LogInformation("🔐 Es admin: {EsAdmin}", (object)esAdmin);

                if (!puedeContar && !esAdmin)
                {
                    _logger.LogWarning("🚫 Usuario sin permisos de conteo");
                    TempData["Error"] = "No tienes permisos para realizar conteos en este inventario.";
                    return RedirectToAction("DetalleInventarioProgramado", "Inventario", new { id });
                }

                // ✅ PREPARAR DATOS PARA LA VISTA
                ViewBag.InventarioId = id;
                ViewBag.UsuarioId = usuarioId;
                ViewBag.PuedeContar = puedeContar || esAdmin;
                ViewBag.PuedeAjustar = puedeAjustar || esAdmin;
                ViewBag.PuedeValidar = puedeValidar || esAdmin;
                ViewBag.EsAdmin = esAdmin;

                _logger.LogInformation("📦 === DATOS PREPARADOS PARA LA VISTA ===");
                _logger.LogInformation("📦 ViewBag.InventarioId: {Id}", (object)id);
                _logger.LogInformation("📦 ViewBag.UsuarioId: {UsuarioId}", (object)usuarioId);

                _logger.LogInformation("✅ === RETORNANDO VISTA CON MODELO ===");
                _logger.LogInformation("✅ Modelo.Titulo: {Titulo}", (object)(inventario.Titulo ?? "Sin título"));
                _logger.LogInformation("✅ Modelo.Estado: {Estado}", (object)(inventario.Estado ?? "Sin estado"));

                return View(inventario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al cargar interfaz de toma para inventario {Id}", (object)id);
                TempData["Error"] = "Error al cargar la interfaz de toma de inventario.";
                return RedirectToAction("ProgramarInventario", "Inventario");
            }
        }

        /// <summary>
        /// Obtiene productos del inventario para la interfaz AJAX
        /// GET: /TomaInventario/ObtenerProductos/20
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProductos(int id, string filtro = "", bool soloSinContar = false)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo productos del inventario {Id}", id);

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // ✅ LLAMAR AL SERVICIO PARA OBTENER PRODUCTOS
                var productos = await _tomaInventarioService.ObtenerProductosInventarioAsync(id, token);
                if (productos == null)
                {
                    return Json(new { success = false, message = "No se pudieron obtener los productos" });
                }

                // ✅ APLICAR FILTROS SI SE ESPECIFICAN
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    productos = productos.Where(p =>
                        (p.NombreProducto?.Contains(filtro, StringComparison.OrdinalIgnoreCase) ?? false) ||
                        (p.MarcaLlanta?.Contains(filtro, StringComparison.OrdinalIgnoreCase) ?? false) ||
                        (p.ModeloLlanta?.Contains(filtro, StringComparison.OrdinalIgnoreCase) ?? false) ||
                        p.ProductoId.ToString().Contains(filtro)
                    ).ToList();
                }

                if (soloSinContar)
                {
                    productos = productos.Where(p => p.EstadoConteo == "Pendiente").ToList();
                }

                // ✅ CALCULAR ESTADÍSTICAS
                var estadisticas = new
                {
                    total = productos.Count,
                    contados = productos.Count(p => p.EstadoConteo == "Contado"),
                    pendientes = productos.Count(p => p.EstadoConteo == "Pendiente"),
                    discrepancias = productos.Count(p => p.TieneDiscrepancia),
                    porcentajeProgreso = productos.Count > 0 ?
                        Math.Round((double)productos.Count(p => p.EstadoConteo == "Contado") / productos.Count * 100, 1) : 0,
                    filtroAplicado = !string.IsNullOrWhiteSpace(filtro) || soloSinContar,
                    resultadosFiltrados = productos.Count
                };

                _logger.LogInformation("✅ Enviando {Count} productos", productos.Count);

                // ✅ RETURN JSON DENTRO DEL TRY
                return Json(new
                {
                    success = true,
                    productos = productos,
                    estadisticas = estadisticas
                });

            } // ← AQUÍ TERMINA EL TRY
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos del inventario {Id}", id);
                return Json(new { success = false, message = "Error al obtener productos" });
            }
        } // ← AQUÍ TERMINA EL MÉTODO - NO MÁS RETURN JSON AQUÍ


        // =====================================
        // 🔥 MÉTODOS AJAX PARA LA INTERFAZ
        // =====================================

        /// <summary>
        /// Registra el conteo físico de un producto
        /// POST: /TomaInventario/RegistrarConteo
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> RegistrarConteo([FromBody] ConteoProductoDTO conteo)
        {
            try
            {
                _logger.LogInformation("📝 Registrando conteo: Inventario={Inventario}, Producto={Producto}, Cantidad={Cantidad}",
                    conteo.InventarioProgramadoId, conteo.ProductoId, conteo.CantidadFisica);

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // ✅ VALIDACIONES BÁSICAS
                if (conteo.CantidadFisica < 0)
                {
                    return Json(new { success = false, message = "La cantidad física no puede ser negativa" });
                }

                // ✅ ASIGNAR USUARIO ACTUAL AL CONTEO
                conteo.UsuarioId = ObtenerIdUsuarioActual();
                conteo.FechaConteo = DateTime.Now;

                // ✅ LLAMAR AL SERVICIO PARA REGISTRAR
                var resultado = await _tomaInventarioService.RegistrarConteoAsync(conteo, token);

                if (resultado)
                {
                    _logger.LogInformation("✅ Conteo registrado exitosamente");

                    return Json(new
                    {
                        success = true,
                        message = "Conteo registrado exitosamente",
                        timestamp = DateTime.Now
                    });
                }
                else
                {
                    _logger.LogError("❌ Error al registrar conteo");
                    return Json(new { success = false, message = "Error al registrar el conteo. Verifique que el inventario esté en progreso." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al registrar conteo");
                return Json(new { success = false, message = $"Error interno: {ex.Message}" });
            }
        }
        /// <summary>
        /// Obtiene el progreso actual del inventario
        /// GET: /TomaInventario/ObtenerProgreso/20
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProgreso(int id)
        {
            try
            {
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // ✅ OBTENER PROGRESO DEL SERVICIO
                var progreso = await _tomaInventarioService.ObtenerProgresoInventarioAsync(id, token);

                if (progreso != null)
                {
                    return Json(new
                    {
                        success = true,
                        progreso = progreso
                    });
                }
                else
                {
                    return Json(new { success = false, message = "No se pudo obtener el progreso" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener progreso del inventario {Id}", id);
                return Json(new { success = false, message = "Error al obtener progreso" });
            }
        }

        /// <summary>
        /// 🔍 Busca un producto específico por ID o nombre para conteo rápido
        /// GET: /TomaInventario/BuscarProducto/5?termino=llanta
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> BuscarProducto(int id, string termino)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando producto en inventario {Id} con término: '{Termino}'", id, termino);

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    return Json(new { success = false, message = "Sesión expirada" });
                }

                // ✅ BUSCAR PRODUCTO
                var productoEncontrado = await _tomaInventarioService.BuscarProductoAsync(id, termino, token);

                if (productoEncontrado != null)
                {
                    _logger.LogInformation("✅ Producto encontrado: {Nombre} (ID: {Id})",
                        productoEncontrado.NombreProducto, productoEncontrado.ProductoId);

                    return Json(new
                    {
                        success = true,
                        producto = productoEncontrado,
                        message = $"Producto encontrado: {productoEncontrado.NombreProducto}"
                    });
                }
                else
                {
                    _logger.LogInformation("❌ Producto no encontrado con término: '{Termino}'", termino);
                    return Json(new
                    {
                        success = false,
                        message = $"No se encontró ningún producto con el término '{termino}'"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al buscar producto");
                return Json(new { success = false, message = "Error al buscar producto" });
            }
        }

        // =====================================
        // 🎮 MÉTODOS DE CONTROL DE INVENTARIO
        // =====================================

        /// <summary>
        /// Inicia un inventario programado desde la interfaz web
        /// POST: /TomaInventario/IniciarInventario/5
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> IniciarInventario(int id)
        {
            try
            {
                _logger.LogInformation("🚀 === INICIANDO INVENTARIO DESDE CONTROLADOR WEB ===");
                _logger.LogInformation("👤 Usuario: {Usuario}, Inventario ID: {Id}", User.Identity?.Name, id);               

               

                // ✅ VERIFICACIÓN DE PERMISOS
                var validacion = await this.ValidarPermisoMvcAsync("Iniciar Inventario",
                    "Solo usuarios con permiso 'Iniciar Inventario' pueden iniciar inventarios.");
                if (validacion != null)
                {
                    return Json(new { success = false, message = "No tienes permisos para iniciar inventarios." });
                }

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado");
                    return Json(new
                    {
                        success = false,
                        message = "Sesión expirada. Por favor, inicie sesión nuevamente."
                    });
                }

                _logger.LogInformation("🔐 Token JWT obtenido correctamente");

                // ✅ LLAMAR AL SERVICIO PARA INICIAR EL INVENTARIO
                var resultado = await _tomaInventarioService.IniciarInventarioAsync(id, token);

                if (resultado)
                {
                    _logger.LogInformation("✅ Inventario {Id} iniciado exitosamente por {Usuario}",
                        id, User.Identity?.Name);

                    return Json(new
                    {
                        success = true,
                        message = "Inventario iniciado exitosamente. Los usuarios asignados han sido notificados.",
                        inventarioId = id,
                        redirectUrl = Url.Action("Ejecutar", new { id = id })
                    });
                }
                else
                {
                    _logger.LogError("❌ Error al iniciar inventario {Id}", id);
                    return Json(new
                    {
                        success = false,
                        message = "No se pudo iniciar el inventario. Verifique que esté en estado 'Programado'."
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al iniciar inventario {Id} desde controlador web", id);

                return Json(new
                {
                    success = false,
                    message = $"Error interno: {ex.Message}"
                });
            }
        }


        // =====================================
        // 🛠️ MÉTODOS AUXILIARES PRIVADOS
        // =====================================

        /// <summary>
        /// Obtiene el token JWT del usuario autenticado
        /// </summary>
        private string? ObtenerTokenJWT()
        {
            var token = User.FindFirst("JwtToken")?.Value;

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }

            return token;
        }

        /// <summary>
        /// Obtiene el ID del usuario actual desde los claims
        /// </summary>
        private int ObtenerIdUsuarioActual()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                                  User.FindFirst("UserId")?.Value;

                if (int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }

                _logger.LogWarning("⚠️ No se pudo obtener el ID del usuario desde los claims");
                return 1; // Fallback - en producción esto debería manejarse mejor
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener ID del usuario");
                return 1; // Fallback
            }
        }
    }
}