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
        [HttpGet]
        public async Task<IActionResult> Ejecutar(int id)
        {
            ViewData["Title"] = "Toma de Inventario - Ejecución";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                _logger.LogInformation("📱 Cargando interfaz de toma para inventario {Id}", id);

                // ✅ VERIFICAR SESIÓN
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // ✅ OBTENER INFORMACIÓN DEL INVENTARIO
                var inventario = await _inventarioService.ObtenerInventarioProgramadoPorIdAsync(id, token);
                if (inventario == null || inventario.InventarioProgramadoId == 0)
                {
                    TempData["Error"] = "Inventario no encontrado.";
                    return RedirectToAction("ProgramarInventario", "Inventario");
                }

                // ✅ VERIFICAR QUE ESTÉ EN PROGRESO
                if (inventario.Estado != "En Progreso")
                {
                    TempData["Error"] = $"El inventario está en estado '{inventario.Estado}' y no se puede realizar toma.";
                    return RedirectToAction("DetalleInventarioProgramado", "Inventario", new { id });
                }

                // ✅ VERIFICAR PERMISOS DEL USUARIO ACTUAL
                var usuarioId = ObtenerIdUsuarioActual();
                var puedeContar = inventario.AsignacionesUsuarios?.Any(a => a.UsuarioId == usuarioId && a.PermisoConteo) ?? false;
                var puedeAjustar = inventario.AsignacionesUsuarios?.Any(a => a.UsuarioId == usuarioId && a.PermisoAjuste) ?? false;
                var puedeValidar = inventario.AsignacionesUsuarios?.Any(a => a.UsuarioId == usuarioId && a.PermisoValidacion) ?? false;
                var esAdmin = await this.TienePermisoAsync("Programar Inventario");

                if (!puedeContar && !esAdmin)
                {
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

                _logger.LogInformation("✅ Interfaz de toma cargada para usuario {Usuario} - Permisos: Contar={Contar}, Ajustar={Ajustar}, Validar={Validar}",
                    User.Identity?.Name, puedeContar || esAdmin, puedeAjustar || esAdmin, puedeValidar || esAdmin);

                return View(inventario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al cargar interfaz de toma para inventario {Id}", id);
                TempData["Error"] = "Error al cargar la interfaz de toma de inventario.";
                return RedirectToAction("ProgramarInventario", "Inventario");
            }
        }

        // =====================================
        // 🔥 MÉTODOS AJAX PARA LA INTERFAZ
        // =====================================

        /// <summary>
        /// 📋 Obtiene la lista de productos del inventario para mostrar en la interfaz
        /// GET: /TomaInventario/ObtenerProductos/5
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerProductos(int id, string filtro = "", bool soloSinContar = false)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo productos del inventario {Id} - Filtro: '{Filtro}', Solo sin contar: {SoloSinContar}",
                    id, filtro, soloSinContar);

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
                        p.NombreProducto.Contains(filtro, StringComparison.OrdinalIgnoreCase) ||
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
                var todosLosProductos = await _tomaInventarioService.ObtenerProductosInventarioAsync(id, token);
                var estadisticas = new
                {
                    total = todosLosProductos?.Count ?? 0,
                    contados = todosLosProductos?.Count(p => p.EstadoConteo == "Contado") ?? 0,
                    pendientes = todosLosProductos?.Count(p => p.EstadoConteo == "Pendiente") ?? 0,
                    discrepancias = todosLosProductos?.Count(p => p.TieneDiscrepancia) ?? 0,
                    porcentajeProgreso = todosLosProductos?.Count > 0 ?
                        Math.Round((double)todosLosProductos.Count(p => p.EstadoConteo == "Contado") / todosLosProductos.Count * 100, 1) : 0,
                    filtroAplicado = !string.IsNullOrWhiteSpace(filtro) || soloSinContar,
                    resultadosFiltrados = productos.Count
                };

                _logger.LogInformation("✅ Enviando {Filtrados} productos filtrados de {Total} totales",
                    productos.Count, todosLosProductos?.Count ?? 0);

                return Json(new
                {
                    success = true,
                    productos = productos,
                    estadisticas = estadisticas
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos del inventario {Id}", id);
                return Json(new { success = false, message = "Error al obtener productos" });
            }
        }

        /// <summary>
        /// 📝 Registra el conteo físico de un producto
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

                    // ✅ OBTENER PROGRESO ACTUALIZADO
                    var progreso = await _tomaInventarioService.ObtenerProgresoInventarioAsync(conteo.InventarioProgramadoId, token);

                    return Json(new
                    {
                        success = true,
                        message = "Conteo registrado exitosamente",
                        progreso = progreso,
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
        /// 📊 Obtiene el progreso actual del inventario en tiempo real
        /// GET: /TomaInventario/ObtenerProgreso/5
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
        /// 🚀 Inicia un inventario programado desde la interfaz de toma
        /// POST: /TomaInventario/IniciarInventario/5
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> IniciarInventario(int id)
        {
            try
            {
                // ✅ VERIFICACIÓN DE PERMISOS
                var validacion = await this.ValidarPermisoMvcAsync("Programar Inventario",
                    "Solo usuarios con permiso 'Programar Inventario' pueden iniciar inventarios.");
                if (validacion != null)
                {
                    return Json(new { success = false, message = "No tienes permisos para iniciar inventarios." });
                }

                _logger.LogInformation("🚀 === INICIANDO INVENTARIO DESDE TOMA ===");
                _logger.LogInformation("👤 Usuario: {Usuario}, Inventario ID: {Id}", User.Identity?.Name, id);

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

                // ✅ LLAMAR AL SERVICIO PARA INICIAR
                var resultado = await _tomaInventarioService.IniciarInventarioAsync(id, token);

                if (resultado)
                {
                    _logger.LogInformation("✅ Inventario {Id} iniciado exitosamente", id);
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
                _logger.LogError(ex, "💥 Error crítico al iniciar inventario {Id}", id);
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