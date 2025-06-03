using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Models.ViewModels;
using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using iTextSharp.text.html.simpleparser;
using iTextSharp.text.pdf;
using iTextSharp.tool.xml;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml; // Para manejar archivos Excel
using OfficeOpenXml.Style;
using System.IO;
using System.Security.Claims;
using Tuco.Clases.DTOs.Inventario;
using IText = iTextSharp.text; // Renombrado para evitar ambigüedades
using SystemDrawing = System.Drawing; // Renombrado para evitar ambigüedades

namespace GestionLlantera.Web.Controllers
{
    [Authorize] // Solo usuarios autenticados
    public class InventarioController : Controller
    {
        private readonly IInventarioService _inventarioService;
        private readonly IUsuariosService _usuariosService;
        private readonly ILogger<InventarioController> _logger;

        public InventarioController(
            IInventarioService inventarioService,
            ILogger<InventarioController> logger,
            IUsuariosService usuariosService)
        {
            _inventarioService = inventarioService;
            _logger = logger;
            _usuariosService = usuariosService;
        }

        public async Task<IActionResult> TestPermiso()
        {
            // Probar método básico
            var tienePermiso = await this.TienePermisoAsync("VerCostos");
            ViewBag.TienePermiso = tienePermiso;

            // Probar si es admin
            var esAdmin = await this.EsAdministradorAsync();
            ViewBag.EsAdmin = esAdmin;

            // Obtener todos los permisos
            var misPermisos = await this.ObtenerMisPermisosAsync();
            ViewBag.MisPermisos = misPermisos;

            return View();
        }

        // GET: /Inventario
        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Inventario de Productos";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                // 🔑 OBTENER TOKEN USANDO EL MÉTODO AUXILIAR
                var token = ObtenerTokenJWT();

                if (string.IsNullOrEmpty(token))
                {
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // 📤 PASAR EL TOKEN AL SERVICIO
                var productos = await _inventarioService.ObtenerProductosAsync(token);

                _logger.LogInformation("✅ Se obtuvieron {Cantidad} productos para mostrar", productos.Count);

                return View(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la lista de productos");
                TempData["Error"] = "Error al cargar los productos.";
                return View(new List<ProductoDTO>());
            }
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        /// <returns>El token JWT o null si no se encuentra</returns>
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

        // GET: /Inventario/DetalleProducto/5
        // En InventarioController.cs - método DetalleProducto

        public async Task<IActionResult> DetalleProducto(int id)
        {
            ViewData["Title"] = "Detalle de Producto";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                _logger.LogInformation("🔍 === INICIANDO DETALLE PRODUCTO ===");
                _logger.LogInformation("📋 Producto ID solicitado: {Id}", id);

                // ✅ VALIDACIÓN BÁSICA
                if (id <= 0)
                {
                    _logger.LogWarning("❌ ID de producto inválido: {Id}", id);
                    TempData["Error"] = "ID de producto inválido.";
                    return RedirectToAction(nameof(Index));
                }

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para DetalleProducto");
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // ✅ LLAMAR AL SERVICIO CON TOKEN
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id, token);
                // ✅ LOGGING DETALLADO PERO SEGURO
                _logger.LogInformation("📊 === RESULTADO DE SERVICIO ===");
                _logger.LogInformation("✅ Producto recibido: {Recibido}", producto != null ? "SÍ" : "NO");

                if (producto != null)
                {
                    _logger.LogInformation("📝 ID: {ProductoId}", producto.ProductoId);
                    _logger.LogInformation("📝 Nombre: '{Nombre}'", producto.NombreProducto ?? "NULL");
                    _logger.LogInformation("📝 ¿Tiene imágenes?: {TieneImagenes}", producto.Imagenes != null);
                    _logger.LogInformation("📝 Cantidad imágenes: {Cantidad}", producto.Imagenes?.Count ?? 0);
                    _logger.LogInformation("📝 ¿Es llanta?: {EsLlanta}", producto.EsLlanta);
                    _logger.LogInformation("📝 ¿Tiene datos llanta?: {TieneLlanta}", producto.Llanta != null);

                    // ✅ LOGGING SEGURO DE IMÁGENES
                    if (producto.Imagenes != null && producto.Imagenes.Any())
                    {
                        for (int i = 0; i < Math.Min(producto.Imagenes.Count, 3); i++) // Solo las primeras 3
                        {
                            var img = producto.Imagenes[i];
                            _logger.LogInformation("🖼️ Imagen {Index}: ID={ImagenId}, URL='{Url}'",
                                i + 1, img.ImagenId, img.UrlImagen ?? "NULL");
                        }

                        if (producto.Imagenes.Count > 3)
                        {
                            _logger.LogInformation("🖼️ ... y {Count} imágenes más", producto.Imagenes.Count - 3);
                        }
                    }
                }

                _logger.LogInformation("📊 === FIN RESULTADO ===");

                // ✅ VALIDACIONES MEJORADAS
                if (producto == null)
                {
                    _logger.LogError("❌ El servicio retornó NULL para producto ID: {Id}", id);
                    TempData["Error"] = "Error al obtener los datos del producto.";
                    return RedirectToAction(nameof(Index));
                }

                if (producto.ProductoId == 0)
                {
                    _logger.LogWarning("⚠️ Producto no encontrado o error en servicio. ID: {Id}", id);
                    TempData["Error"] = "Producto no encontrado.";
                    return RedirectToAction(nameof(Index));
                }

                if (string.IsNullOrEmpty(producto.NombreProducto) || producto.NombreProducto == "Error al cargar producto")
                {
                    _logger.LogError("❌ Error detectado en la carga del producto ID: {Id}", id);
                    TempData["Error"] = "Error al cargar los datos del producto.";
                    return RedirectToAction(nameof(Index));
                }

                // ✅ VALIDACIÓN ADICIONAL DE INTEGRIDAD
                if (producto.Imagenes == null)
                {
                    _logger.LogWarning("⚠️ Imágenes es NULL, inicializando lista vacía");
                    producto.Imagenes = new List<ImagenProductoDTO>();
                }

                _logger.LogInformation("🎉 === PRODUCTO VÁLIDO - ENVIANDO A VISTA ===");
                _logger.LogInformation("📋 Resumen final: '{Nombre}' con {ImageCount} imágenes",
                    producto.NombreProducto, producto.Imagenes.Count);

                return View(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 === ERROR CRÍTICO EN DETALLE PRODUCTO ===");
                _logger.LogError("💥 ID: {Id}", id);
                _logger.LogError("💥 Mensaje: {Message}", ex.Message);
                _logger.LogError("💥 Stack Trace: {StackTrace}", ex.StackTrace);

                if (ex.InnerException != null)
                {
                    _logger.LogError("💥 Inner Exception: {InnerMessage}", ex.InnerException.Message);
                }

                TempData["Error"] = "Error interno al cargar el detalle del producto.";
                return RedirectToAction(nameof(Index));
            }
        }

        // Método GET para mostrar el formulario de agregar producto
        [HttpGet]
        public async Task<IActionResult> AgregarProducto()
        {
            // ✅ RESTRICCIÓN PARA AGREGAR PRODUCTOS
            var validacion = await this.ValidarPermisoMvcAsync("Editar Productos",
                "No tienes permisos para agregar productos.");
            if (validacion != null) return validacion;

            ViewData["Title"] = "Agregar Producto";
            ViewData["Layout"] = "_AdminLayout";

            // Obtener las categorías disponibles (en una implementación real, esto vendría de la base de datos)
            // Podríamos añadir esto si el modelo lo requiere
            // ViewBag.Categorias = await _categoriaService.ObtenerTodasAsync();

            // Crear un objeto vacío del modelo
            var nuevoProducto = new ProductoDTO
            {
                // Valores predeterminados si son necesarios
                CantidadEnInventario = 0,
                StockMinimo = 5,
                Imagenes = new List<ImagenProductoDTO>(),
                Llanta = new LlantaDTO() // Inicializar para evitar posibles null references
            };

            return View(nuevoProducto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AgregarProducto(ProductoDTO producto)
        {
            try
            {
                // ✅ VERIFICACIÓN DE PERMISOS
                var validacion = await this.ValidarPermisoMvcAsync("Editar Productos",
                    "No tienes permisos para crear productos.");
                if (validacion != null) return validacion;

                _logger.LogInformation("=== INICIANDO AGREGAR PRODUCTO ===");
                _logger.LogInformation($"NombreProducto: {producto.NombreProducto}");
                _logger.LogInformation($"CantidadEnInventario: {producto.CantidadEnInventario}");
                _logger.LogInformation($"StockMinimo: {producto.StockMinimo}");
                _logger.LogInformation($"EsLlanta: {producto.EsLlanta}");

                if(!ModelState.IsValid)
{
                    _logger.LogWarning("ModelState no es válido:");
                    foreach (var kvp in ModelState)
                    {
                        var key = kvp.Key;
                        var value = kvp.Value;

                        if (value.Errors.Count > 0)
                        {
                            _logger.LogWarning($"Campo: {key}");
                            foreach (var error in value.Errors)
                            {
                                _logger.LogWarning($"  - Error: {error.ErrorMessage}");
                            }
                        }
                    }

                    // TAMBIÉN MOSTRAR EN LA VISTA PARA DEBUG
                    ViewBag.ModelStateErrors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToList()
                        );

                    return View(producto);
                }

                // ✅ OBTENER TOKEN - ESTO FALTABA
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // Obtener las imágenes
                var imagenes = Request.Form.Files.GetFiles("imagenes").ToList();
                _logger.LogInformation($"Recibidas {imagenes.Count} imágenes");

                // ✅ PASAR EL TOKEN AL SERVICIO
                var resultado = await _inventarioService.AgregarProductoAsync(producto, imagenes, token);
                if (resultado)
                {
                    TempData["Success"] = "Producto agregado exitosamente";
                    return RedirectToAction(nameof(Index));
                }

                TempData["Error"] = "Error al agregar el producto";
                return View(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en método AgregarProducto: {Message}", ex.Message);
                TempData["Error"] = $"Error: {ex.Message}";
                return View(producto);
            }
        }

        // GET: /Inventario/Programaciones
        public IActionResult Programaciones()
        {
            ViewData["Title"] = "Inventarios Programados";
            ViewData["Layout"] = "_AdminLayout";

            // Por ahora solo mostrará una vista vacía
            return View();
        }

        [HttpGet]
        [Route("Inventario/ObtenerImagenesProducto/{id}")]
        public async Task<IActionResult> ObtenerImagenesProducto(int id)
        {
            try
            {
                _logger.LogInformation($"🖼️ === INICIANDO OBTENCIÓN DE IMÁGENES ===");
                _logger.LogInformation($"📋 Producto ID solicitado: {id}");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado");
                    return Json(new List<string>());
                }
                _logger.LogInformation("🔐 Token JWT obtenido correctamente");

                // ✅ LLAMAR AL SERVICIO CON TOKEN
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id, token);
                _logger.LogInformation($"📊 === RESULTADO DEL SERVICIO ===");
                _logger.LogInformation($"✅ Producto recibido: {(producto != null ? "SÍ" : "NO")}");

                if (producto == null || producto.ProductoId == 0)
                {
                    _logger.LogWarning($"❌ Producto no encontrado o inválido: {id}");
                    return Json(new List<string>());
                }

                _logger.LogInformation($"📝 Nombre del producto: '{producto.NombreProducto}'");
                _logger.LogInformation($"📝 ¿Tiene colección de imágenes?: {(producto.Imagenes != null ? "SÍ" : "NO")}");
                _logger.LogInformation($"📝 Cantidad de imágenes: {producto.Imagenes?.Count ?? 0}");

                // ✅ PROCESAR IMÁGENES
                var imagenesUrls = new List<string>();

                if (producto.Imagenes != null && producto.Imagenes.Any())
                {
                    _logger.LogInformation("🔄 Procesando imágenes...");

                    foreach (var imagen in producto.Imagenes)
                    {
                        _logger.LogInformation($"🖼️ Procesando imagen ID: {imagen.ImagenId}");
                        _logger.LogInformation($"🖼️ URL original: '{imagen.UrlImagen}'");

                        if (!string.IsNullOrEmpty(imagen.UrlImagen))
                        {
                            imagenesUrls.Add(imagen.UrlImagen);
                            _logger.LogInformation($"✅ Imagen agregada: {imagen.UrlImagen}");
                        }
                        else
                        {
                            _logger.LogWarning($"⚠️ Imagen con URL vacía o nula. ID: {imagen.ImagenId}");
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ No hay imágenes en la colección del producto");
                }

                _logger.LogInformation($"🎯 === RESULTADO FINAL ===");
                _logger.LogInformation($"🎯 Total URLs válidas: {imagenesUrls.Count}");

                foreach (var url in imagenesUrls)
                {
                    _logger.LogInformation($"🎯 URL final: {url}");
                }

                // Retornar solo las URLs como un array de strings
                return Json(imagenesUrls);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 === ERROR CRÍTICO ===");
                _logger.LogError("💥 Producto ID: {Id}", id);
                _logger.LogError("💥 Mensaje: {Message}", ex.Message);
                _logger.LogError("💥 Stack Trace: {StackTrace}", ex.StackTrace);
                return Json(new List<string>());
            }
        }
        [HttpGet]
        public async Task<IActionResult> VerImagenes(int id)
        {
            try
            {
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id);
                if (producto == null || producto.ProductoId == 0)
                {
                    return PartialView("_ImagenesModal", null);
                }

                return PartialView("_ImagenesModal", producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar imágenes del producto {Id}", id);
                return PartialView("_Error", "No se pudieron cargar las imágenes del producto.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> ExportarPDF(string responsable = "", string solicitante = "", string fechaLimite = "")
        {
            try
            {
                // ✅ RESTRICCIÓN PARA EXPORTAR
                var validacion = await this.ValidarPermisoMvcAsync("Ver Reportes",
                    "No tienes permisos para exportar reportes.");
                if (validacion != null) return validacion;

                _logger.LogInformation("Iniciando exportación a PDF para toma física de inventario");

                // 🔑 OBTENER TOKEN USANDO EL MÉTODO AUXILIAR
                var token = ObtenerTokenJWT();

                if (string.IsNullOrEmpty(token))
                {
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // Parámetros por defecto si no se proporcionan
                responsable = string.IsNullOrEmpty(responsable) ? User.Identity.Name ?? "No especificado" : responsable;
                solicitante = string.IsNullOrEmpty(solicitante) ? "Administrador del Sistema" : solicitante;

                // Parsear fecha límite o usar por defecto 7 días
                DateTime fechaLimiteInventario;
                if (!DateTime.TryParse(fechaLimite, out fechaLimiteInventario))
                {
                    fechaLimiteInventario = DateTime.Now.AddDays(7);
                }

                // 📤 OBTENER LOS DATOS DE PRODUCTOS CON TOKEN
                var productos = await _inventarioService.ObtenerProductosAsync(token);

                // Identificador único para el inventario
                string idInventario = $"INV-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";

                // Crear documento PDF
                using var memoryStream = new MemoryStream();
                var document = new IText.Document(IText.PageSize.A4.Rotate(), 10f, 10f, 10f, 10f);
                var writer = PdfWriter.GetInstance(document, memoryStream);

                // Agregar eventos de encabezado y pie de página
                writer.PageEvent = new InventarioPdfPageEvent(responsable, solicitante, idInventario);

                // Metadatos
                document.AddTitle("Formato para Toma Física de Inventario");
                document.AddSubject("Inventario");
                document.AddKeywords("inventario, toma física, productos");
                document.AddCreator("Sistema de Gestión Llantera");
                document.AddAuthor("Sistema de Gestión Llantera");
                document.AddHeader("Empresa", "Llantera XYZ");

                // Abrir documento
                document.Open();

                // Fuentes
                var titleFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA_BOLD, 16, new IText.BaseColor(255, 255, 255));
                var subtitleFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA_BOLD, 12, IText.BaseColor.BLACK);
                var normalFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA, 10, IText.BaseColor.BLACK);
                var smallFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA, 8, IText.BaseColor.BLACK);
                var headerFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA_BOLD, 10, new IText.BaseColor(255, 255, 255));
                var tableFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA, 9, IText.BaseColor.BLACK);
                var tableBoldFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA_BOLD, 9, IText.BaseColor.BLACK);
                var alertFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA_BOLD, 9, IText.BaseColor.RED);

                // Colores
                IText.BaseColor headerColor = new IText.BaseColor(48, 84, 150);
                IText.BaseColor lightGrayColor = new IText.BaseColor(240, 240, 240);
                IText.BaseColor lightPinkColor = new IText.BaseColor(255, 200, 200);
                IText.BaseColor lightYellowColor = new IText.BaseColor(255, 255, 200);

                // Título principal con fondo
                PdfPTable titleTable = new PdfPTable(1);
                titleTable.WidthPercentage = 100;
                titleTable.SpacingAfter = 10f;

                PdfPCell titleCell = new PdfPCell(new IText.Phrase("FORMATO PARA TOMA DE INVENTARIO FÍSICO", titleFont));
                titleCell.BackgroundColor = headerColor;
                titleCell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                titleCell.PaddingTop = 10f;
                titleCell.PaddingBottom = 10f;
                titleCell.BorderWidth = 0;
                titleTable.AddCell(titleCell);

                document.Add(titleTable);

                // Información del inventario
                PdfPTable infoTable = new PdfPTable(6);
                infoTable.WidthPercentage = 100;
                infoTable.SetWidths(new float[] { 1.5f, 2f, 1.5f, 2f, 1.5f, 2f });
                infoTable.SpacingAfter = 15f;

                // Primera fila
                infoTable.AddCell(CreateInfoCell("Fecha Generación:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(DateTime.Now.ToString("dd/MM/yyyy HH:mm"), tableFont));
                infoTable.AddCell(CreateInfoCell("Solicitante:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(solicitante, tableFont));
                infoTable.AddCell(CreateInfoCell("Total Productos:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(productos.Count.ToString(), tableFont));

                // Segunda fila
                infoTable.AddCell(CreateInfoCell("Fecha Inicio:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(DateTime.Now.ToString("dd/MM/yyyy"), tableFont));
                infoTable.AddCell(CreateInfoCell("Responsable:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(responsable, tableFont));
                infoTable.AddCell(CreateInfoCell("Ubicación:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell("Almacén Principal", tableFont));

                // Tercera fila
                infoTable.AddCell(CreateInfoCell("Fecha Límite:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(fechaLimiteInventario.ToString("dd/MM/yyyy"), tableFont));
                infoTable.AddCell(CreateInfoCell("ID Inventario:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell(idInventario, tableFont));
                infoTable.AddCell(CreateInfoCell("Tipo:", tableBoldFont));
                infoTable.AddCell(CreateInfoCell("Inventario Físico Total", tableFont));

                document.Add(infoTable);

                // Instrucciones
                PdfPTable instructionsTable = new PdfPTable(1);
                instructionsTable.WidthPercentage = 100;
                instructionsTable.SpacingAfter = 15f;

                PdfPCell instructionsTitleCell = new PdfPCell(new IText.Phrase("INSTRUCCIONES", tableBoldFont));
                instructionsTitleCell.BackgroundColor = lightGrayColor;
                instructionsTitleCell.PaddingTop = 5f;
                instructionsTitleCell.PaddingBottom = 5f;
                instructionsTitleCell.PaddingLeft = 5f;
                instructionsTable.AddCell(instructionsTitleCell);

                PdfPCell instructionsCell = new PdfPCell();
                instructionsCell.PaddingTop = 5f;
                instructionsCell.PaddingBottom = 5f;
                instructionsCell.PaddingLeft = 5f;
                instructionsCell.PaddingRight = 5f;

                IText.Paragraph instructions = new IText.Paragraph();
                instructions.Add(new IText.Chunk("1. Verifique la cantidad física de cada producto y anótela en la columna 'Cantidad Física'.\n", tableFont));
                instructions.Add(new IText.Chunk("2. En caso de discrepancias, anote las observaciones en la columna correspondiente.\n", tableFont));
                instructions.Add(new IText.Chunk("3. Los productos marcados en rojo tienen un stock por debajo del mínimo requerido.\n", tableFont));
                instructions.Add(new IText.Chunk("4. Al finalizar el conteo, firme el documento y entreguelo al supervisor correspondiente.", tableFont));

                instructionsCell.AddElement(instructions);
                instructionsTable.AddCell(instructionsCell);

                document.Add(instructionsTable);

                // Tabla de productos
                PdfPTable productTable = new PdfPTable(11);
                productTable.WidthPercentage = 100;
                productTable.SetWidths(new float[] { 0.6f, 0.8f, 2.2f, 1.0f, 1.0f, 1.2f, 0.8f, 0.8f, 0.8f, 0.8f, 2.0f });
                productTable.SpacingAfter = 15f;

                // Encabezados de tabla
                productTable.AddCell(CreateHeaderCell("Código", headerFont));
                productTable.AddCell(CreateHeaderCell("Categoría", headerFont));
                productTable.AddCell(CreateHeaderCell("Producto", headerFont));
                productTable.AddCell(CreateHeaderCell("Medidas", headerFont));
                productTable.AddCell(CreateHeaderCell("Marca/Modelo", headerFont));
                productTable.AddCell(CreateHeaderCell("Ubicación", headerFont));
                productTable.AddCell(CreateHeaderCell("Cantidad Sistema", headerFont));
                productTable.AddCell(CreateHeaderCell("Cantidad Física", headerFont));
                productTable.AddCell(CreateHeaderCell("Diferencia", headerFont));
                productTable.AddCell(CreateHeaderCell("Estado", headerFont));
                productTable.AddCell(CreateHeaderCell("Observaciones", headerFont));

                // Añadir productos
                int rowCount = 0;
                foreach (var producto in productos)
                {
                    // Determinar si la fila debe tener fondo alternado
                    IText.BaseColor rowColor = null;
                    if (producto.CantidadEnInventario <= producto.StockMinimo)
                    {
                        rowColor = lightPinkColor;
                    }
                    else if (rowCount % 2 == 0)
                    {
                        rowColor = lightGrayColor;
                    }

                    rowCount++;

                    // Determinar la categoría del producto
                    string categoria = producto.Llanta != null ? "Llanta" : "Accesorio";

                    // Determinar ubicación ficticia para demostración
                    string ubicacion = producto.Llanta != null
                        ? $"Bodega A - P{(producto.ProductoId % 5) + 1} - E{(producto.ProductoId % 10) + 1}"
                        : $"Bodega B - S{(producto.ProductoId % 3) + 1} - E{(producto.ProductoId % 8) + 1}";

                    // ID del producto
                    productTable.AddCell(CreateDataCell(producto.ProductoId.ToString(), tableFont, rowColor));

                    // Categoría
                    productTable.AddCell(CreateDataCell(categoria, tableFont, rowColor));

                    // Nombre del producto
                    PdfPCell productNameCell = CreateDataCell(producto.NombreProducto, tableBoldFont, rowColor);
                    productNameCell.HorizontalAlignment = IText.Element.ALIGN_LEFT;
                    productTable.AddCell(productNameCell);

                    // Medidas (para llantas)
                    string medidas = "N/A";
                    if (producto.Llanta != null && producto.Llanta.Ancho.HasValue && producto.Llanta.Perfil.HasValue)
                    {
                        // Asegúrate de que Diametro sea un número válido o usa un valor predeterminado
                        string diametro = producto.Llanta.Diametro ?? "0";
                        medidas = $"{producto.Llanta.Ancho}/{producto.Llanta.Perfil}/R{diametro}";
                    }
                    productTable.AddCell(CreateDataCell(medidas, tableFont, rowColor));

                    // Marca/Modelo
                    string marcaModelo = "N/A";
                    if (producto.Llanta != null)
                    {
                        if (!string.IsNullOrEmpty(producto.Llanta.Marca) && !string.IsNullOrEmpty(producto.Llanta.Modelo))
                        {
                            marcaModelo = $"{producto.Llanta.Marca}/{producto.Llanta.Modelo}";
                        }
                        else if (!string.IsNullOrEmpty(producto.Llanta.Marca))
                        {
                            marcaModelo = producto.Llanta.Marca;
                        }
                        else if (!string.IsNullOrEmpty(producto.Llanta.Modelo))
                        {
                            marcaModelo = producto.Llanta.Modelo;
                        }
                    }
                    productTable.AddCell(CreateDataCell(marcaModelo, tableFont, rowColor));

                    // Ubicación
                    productTable.AddCell(CreateDataCell(ubicacion, tableFont, rowColor));

                    // Cantidad en sistema
                    PdfPCell stockCell = CreateDataCell(producto.CantidadEnInventario.ToString(), tableFont, rowColor);
                    stockCell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                    productTable.AddCell(stockCell);

                    // Cantidad física (en blanco para llenar manualmente)
                    PdfPCell fisicaCell = CreateDataCell("_______", tableFont, lightYellowColor);
                    fisicaCell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                    productTable.AddCell(fisicaCell);

                    // Diferencia (en blanco para calcular manualmente)
                    PdfPCell diffCell = CreateDataCell("_______", tableFont, rowColor);
                    diffCell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                    productTable.AddCell(diffCell);

                    // Estado
                    string estado = producto.CantidadEnInventario <= producto.StockMinimo ? "STOCK BAJO" : "Normal";
                    IText.Font estadoFont = producto.CantidadEnInventario <= producto.StockMinimo ? alertFont : tableFont;
                    productTable.AddCell(CreateDataCell(estado, estadoFont, rowColor));

                    // Observaciones (celda en blanco)
                    productTable.AddCell(CreateDataCell("", tableFont, rowColor));
                }

                document.Add(productTable);

                // Sección de totales
                PdfPTable totalsTable = new PdfPTable(6);
                totalsTable.WidthPercentage = 60;
                totalsTable.HorizontalAlignment = IText.Element.ALIGN_RIGHT;
                totalsTable.SpacingAfter = 20f;

                totalsTable.AddCell(CreateInfoCell("Total Productos:", tableBoldFont));
                totalsTable.AddCell(CreateInfoCell(productos.Count.ToString(), tableFont));

                totalsTable.AddCell(CreateInfoCell("Total Unidades Sistema:", tableBoldFont));
                int totalUnidades = productos.Sum(p => p.CantidadEnInventario);
                totalsTable.AddCell(CreateInfoCell(totalUnidades.ToString(), tableFont));

                totalsTable.AddCell(CreateInfoCell("Productos con Stock Bajo:", tableBoldFont));
                int stockBajo = productos.Count(p => p.CantidadEnInventario <= p.StockMinimo);
                PdfPCell stockBajoCell = CreateInfoCell(stockBajo.ToString(), alertFont);
                totalsTable.AddCell(stockBajoCell);

                document.Add(totalsTable);

                // Sección para firmas
                PdfPTable signaturesTable = new PdfPTable(3);
                signaturesTable.WidthPercentage = 100;
                signaturesTable.SpacingBefore = 30f;

                PdfPCell elaboradoTitle = new PdfPCell(new IText.Phrase("ELABORADO POR:", tableBoldFont));
                elaboradoTitle.Border = IText.Rectangle.NO_BORDER;
                elaboradoTitle.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(elaboradoTitle);

                PdfPCell revisadoTitle = new PdfPCell(new IText.Phrase("REVISADO POR:", tableBoldFont));
                revisadoTitle.Border = IText.Rectangle.NO_BORDER;
                revisadoTitle.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(revisadoTitle);

                PdfPCell aprobadoTitle = new PdfPCell(new IText.Phrase("APROBADO POR:", tableBoldFont));
                aprobadoTitle.Border = IText.Rectangle.NO_BORDER;
                aprobadoTitle.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(aprobadoTitle);

                // Espacio para firmas
                PdfPCell elaboradoSpace = new PdfPCell(new IText.Phrase(" "));
                elaboradoSpace.Border = IText.Rectangle.NO_BORDER;
                elaboradoSpace.FixedHeight = 40f;
                signaturesTable.AddCell(elaboradoSpace);

                PdfPCell revisadoSpace = new PdfPCell(new IText.Phrase(" "));
                revisadoSpace.Border = IText.Rectangle.NO_BORDER;
                revisadoSpace.FixedHeight = 40f;
                signaturesTable.AddCell(revisadoSpace);

                PdfPCell aprobadoSpace = new PdfPCell(new IText.Phrase(" "));
                aprobadoSpace.Border = IText.Rectangle.NO_BORDER;
                aprobadoSpace.FixedHeight = 40f;
                signaturesTable.AddCell(aprobadoSpace);

                // Líneas para firma
                PdfPCell elaboradoLine = new PdfPCell(new IText.Phrase("_______________________"));
                elaboradoLine.Border = IText.Rectangle.NO_BORDER;
                elaboradoLine.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(elaboradoLine);

                PdfPCell revisadoLine = new PdfPCell(new IText.Phrase("_______________________"));
                revisadoLine.Border = IText.Rectangle.NO_BORDER;
                revisadoLine.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(revisadoLine);

                PdfPCell aprobadoLine = new PdfPCell(new IText.Phrase("_______________________"));
                aprobadoLine.Border = IText.Rectangle.NO_BORDER;
                aprobadoLine.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(aprobadoLine);

                // Nombre y firma
                PdfPCell elaboradoName = new PdfPCell(new IText.Phrase("Nombre y Firma", smallFont));
                elaboradoName.Border = IText.Rectangle.NO_BORDER;
                elaboradoName.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(elaboradoName);

                PdfPCell revisadoName = new PdfPCell(new IText.Phrase("Nombre y Firma", smallFont));
                revisadoName.Border = IText.Rectangle.NO_BORDER;
                revisadoName.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(revisadoName);

                PdfPCell aprobadoName = new PdfPCell(new IText.Phrase("Nombre y Firma", smallFont));
                aprobadoName.Border = IText.Rectangle.NO_BORDER;
                aprobadoName.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                signaturesTable.AddCell(aprobadoName);

                document.Add(signaturesTable);

                // Aviso de pie de página
                IText.Paragraph disclaimer = new IText.Paragraph();
                disclaimer.SpacingBefore = 50f;
                disclaimer.Add(new IText.Chunk("Este documento es oficial para la toma física de inventario. Cualquier alteración o falsificación constituye una falta grave.", smallFont));
                disclaimer.Alignment = IText.Element.ALIGN_CENTER;
                document.Add(disclaimer);

                // Cerrar documento
                document.Close();
                writer.Close();

                // Nombre del archivo
                string fileName = $"Inventario_Fisico_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                _logger.LogInformation($"Exportación a PDF de inventario físico completada: {fileName}");

                // Devolver el archivo
                return File(memoryStream.ToArray(), "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar a PDF para toma física de inventario");
                // En caso de error, redireccionar con mensaje
                TempData["Error"] = "No se pudo generar el archivo PDF. Inténtelo nuevamente.";
                return RedirectToAction(nameof(Index));
            }
        }

        // Métodos de ayuda para crear celdas - actualizados con los nuevos tipos
        private PdfPCell CreateHeaderCell(string text, IText.Font font)
        {
            PdfPCell cell = new PdfPCell(new IText.Phrase(text, font));
            cell.BackgroundColor = new IText.BaseColor(48, 84, 150);
            cell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
            cell.VerticalAlignment = IText.Element.ALIGN_MIDDLE;
            cell.PaddingTop = 5f;
            cell.PaddingBottom = 5f;
            cell.PaddingLeft = 3f;
            cell.PaddingRight = 3f;
            return cell;
        }

        private PdfPCell CreateDataCell(string text, IText.Font font, IText.BaseColor backgroundColor = null)
        {
            PdfPCell cell = new PdfPCell(new IText.Phrase(text, font));
            if (backgroundColor != null)
            {
                cell.BackgroundColor = backgroundColor;
            }
            cell.HorizontalAlignment = IText.Element.ALIGN_LEFT;
            cell.VerticalAlignment = IText.Element.ALIGN_MIDDLE;
            cell.PaddingTop = 4f;
            cell.PaddingBottom = 4f;
            cell.PaddingLeft = 3f;
            cell.PaddingRight = 3f;
            return cell;
        }

        private PdfPCell CreateInfoCell(string text, IText.Font font)
        {
            PdfPCell cell = new PdfPCell(new IText.Phrase(text, font));
            cell.Border = IText.Rectangle.BOX;
            cell.BorderColor = IText.BaseColor.LIGHT_GRAY;
            cell.BorderWidth = 0.5f;
            cell.PaddingTop = 5f;
            cell.PaddingBottom = 5f;
            cell.PaddingLeft = 5f;
            cell.PaddingRight = 5f;
            return cell;
        }

        // Clase para manejar encabezados y pies de página
        private class InventarioPdfPageEvent : PdfPageEventHelper
        {
            private readonly string _responsable;
            private readonly string _solicitante;
            private readonly string _idInventario;
            private readonly IText.Font _smallFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA, 8, IText.BaseColor.DARK_GRAY);
            private readonly IText.Font _headerFont = IText.FontFactory.GetFont(IText.FontFactory.HELVETICA_BOLD, 8, IText.BaseColor.DARK_GRAY);

            public InventarioPdfPageEvent(string responsable, string solicitante, string idInventario)
            {
                _responsable = responsable;
                _solicitante = solicitante;
                _idInventario = idInventario;
            }

            public override void OnEndPage(PdfWriter writer, IText.Document document)
            {
                // Encabezado
                /*
                // Si tienes un logo, puedes agregarlo así:
                string logoPath = Path.Combine(_webHostEnvironment.WebRootPath, "images", "logo.png");
                if (File.Exists(logoPath))
                {
                    IText.Image logo = IText.Image.GetInstance(logoPath);
                    logo.ScaleToFit(100f, 40f);
                    logo.SetAbsolutePosition(document.LeftMargin, document.PageSize.Height - 50);
                    writer.DirectContent.AddImage(logo);
                }
                */

                PdfPTable headerTable = new PdfPTable(3);
                headerTable.TotalWidth = document.PageSize.Width - document.LeftMargin - document.RightMargin;
                headerTable.DefaultCell.Border = IText.Rectangle.NO_BORDER;

                PdfPCell logoCell = new PdfPCell(new IText.Phrase("LLANTERA XYZ", _headerFont));
                logoCell.Border = IText.Rectangle.NO_BORDER;
                headerTable.AddCell(logoCell);

                PdfPCell titleCell = new PdfPCell(new IText.Phrase("FORMATO PARA TOMA FÍSICA DE INVENTARIO", _headerFont));
                titleCell.Border = IText.Rectangle.NO_BORDER;
                titleCell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                headerTable.AddCell(titleCell);

                PdfPCell pageCell = new PdfPCell(new IText.Phrase($"Página {writer.PageNumber}", _smallFont));
                pageCell.Border = IText.Rectangle.NO_BORDER;
                pageCell.HorizontalAlignment = IText.Element.ALIGN_RIGHT;
                headerTable.AddCell(pageCell);

                headerTable.WriteSelectedRows(0, -1, document.LeftMargin, document.PageSize.Height - 10, writer.DirectContent);

                // Pie de página
                PdfPTable footerTable = new PdfPTable(3);
                footerTable.TotalWidth = document.PageSize.Width - document.LeftMargin - document.RightMargin;
                footerTable.DefaultCell.Border = IText.Rectangle.NO_BORDER;

                PdfPCell idCell = new PdfPCell(new IText.Phrase($"ID Inventario: {_idInventario}", _smallFont));
                idCell.Border = IText.Rectangle.NO_BORDER;
                footerTable.AddCell(idCell);

                PdfPCell responsableCell = new PdfPCell(new IText.Phrase($"Responsable: {_responsable}", _smallFont));
                responsableCell.Border = IText.Rectangle.NO_BORDER;
                responsableCell.HorizontalAlignment = IText.Element.ALIGN_CENTER;
                footerTable.AddCell(responsableCell);

                PdfPCell dateCell = new PdfPCell(new IText.Phrase($"Fecha: {DateTime.Now:dd/MM/yyyy}", _smallFont));
                dateCell.Border = IText.Rectangle.NO_BORDER;
                dateCell.HorizontalAlignment = IText.Element.ALIGN_RIGHT;
                footerTable.AddCell(dateCell);

                footerTable.WriteSelectedRows(0, -1, document.LeftMargin, document.BottomMargin, writer.DirectContent);
            }
        }

        // Método para ExportarExcel
        [HttpGet]
        public async Task<IActionResult> ExportarExcel(string responsable = "", string solicitante = "", string fechaLimite = "")
        {
            try
            {
                // ✅ RESTRICCIÓN PARA EXPORTAR
                var validacion = await this.ValidarPermisoMvcAsync("Ver Reportes",
                    "No tienes permisos para exportar reportes.");
                if (validacion != null) return validacion;

                _logger.LogInformation("Iniciando exportación a Excel para toma física de inventario");

                // 🔑 OBTENER TOKEN USANDO EL MÉTODO AUXILIAR
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    TempData["Error"] = "Sesión expirada. Por favor, inicie sesión nuevamente.";
                    return RedirectToAction("Login", "Account");
                }

                // Parámetros por defecto si no se proporcionan
                responsable = string.IsNullOrEmpty(responsable) ? User.Identity.Name ?? "No especificado" : responsable;
                solicitante = string.IsNullOrEmpty(solicitante) ? "Administrador del Sistema" : solicitante;

                // Parsear fecha límite o usar por defecto 7 días
                DateTime fechaLimiteInventario;
                if (!DateTime.TryParse(fechaLimite, out fechaLimiteInventario))
                {
                    fechaLimiteInventario = DateTime.Now.AddDays(7);
                }


                // 📤 OBTENER LOS DATOS DE PRODUCTOS CON TOKEN
                var productos = await _inventarioService.ObtenerProductosAsync(token);


                // Configurar licencia de EPPlus
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();

                // Configurar propiedades del documento
                package.Workbook.Properties.Title = "Formato para Toma de Inventario Físico";
                package.Workbook.Properties.Author = "Sistema de Gestión Llantera";
                package.Workbook.Properties.Company = "Llantera XYZ";
                package.Workbook.Properties.Created = DateTime.Now;

                // Crear hoja principal
                var worksheet = package.Workbook.Worksheets.Add("Inventario Físico");

                // Crear título del reporte
                worksheet.Cells[1, 1].Value = "FORMATO PARA TOMA DE INVENTARIO FÍSICO";
                worksheet.Cells[1, 1, 1, 13].Merge = true;
                worksheet.Cells[1, 1, 1, 13].Style.Font.Size = 16;
                worksheet.Cells[1, 1, 1, 13].Style.Font.Bold = true;
                worksheet.Cells[1, 1, 1, 13].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                worksheet.Cells[1, 1, 1, 13].Style.Fill.PatternType = ExcelFillStyle.Solid;
                worksheet.Cells[1, 1, 1, 13].Style.Fill.BackgroundColor.SetColor(SystemDrawing.Color.FromArgb(48, 84, 150));
                worksheet.Cells[1, 1, 1, 13].Style.Font.Color.SetColor(SystemDrawing.Color.White);

                // Información del inventario
                var currentRow = 3;

                // Columna 1
                worksheet.Cells[currentRow, 1].Value = "Fecha Generación:";
                worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 2, currentRow, 3].Value = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cells[currentRow, 2, currentRow, 3].Merge = true;

                worksheet.Cells[currentRow, 5].Value = "Solicitante:";
                worksheet.Cells[currentRow, 5].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 6, currentRow, 8].Value = solicitante;
                worksheet.Cells[currentRow, 6, currentRow, 8].Merge = true;

                worksheet.Cells[currentRow, 10].Value = "Total Productos:";
                worksheet.Cells[currentRow, 10].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 11, currentRow, 13].Value = productos.Count;
                worksheet.Cells[currentRow, 11, currentRow, 13].Merge = true;

                currentRow++;

                worksheet.Cells[currentRow, 1].Value = "Fecha Inicio:";
                worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 2, currentRow, 3].Value = DateTime.Now.ToString("dd/MM/yyyy");
                worksheet.Cells[currentRow, 2, currentRow, 3].Merge = true;

                worksheet.Cells[currentRow, 5].Value = "Responsable:";
                worksheet.Cells[currentRow, 5].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 6, currentRow, 8].Value = responsable;
                worksheet.Cells[currentRow, 6, currentRow, 8].Merge = true;

                worksheet.Cells[currentRow, 10].Value = "Ubicación:";
                worksheet.Cells[currentRow, 10].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 11, currentRow, 13].Value = "Almacén Principal";
                worksheet.Cells[currentRow, 11, currentRow, 13].Merge = true;

                currentRow++;

                worksheet.Cells[currentRow, 1].Value = "Fecha Límite:";
                worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 2, currentRow, 3].Value = fechaLimiteInventario.ToString("dd/MM/yyyy");
                worksheet.Cells[currentRow, 2, currentRow, 3].Merge = true;

                worksheet.Cells[currentRow, 5].Value = "ID Inventario:";
                worksheet.Cells[currentRow, 5].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 6, currentRow, 8].Value = $"INV-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
                worksheet.Cells[currentRow, 6, currentRow, 8].Merge = true;

                currentRow += 2;

                // Instrucciones
                worksheet.Cells[currentRow, 1].Value = "INSTRUCCIONES:";
                worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 1, currentRow, 13].Merge = true;
                worksheet.Cells[currentRow, 1, currentRow, 13].Style.Fill.PatternType = ExcelFillStyle.Solid;
                worksheet.Cells[currentRow, 1, currentRow, 13].Style.Fill.BackgroundColor.SetColor(SystemDrawing.Color.LightGray);

                currentRow++;

                worksheet.Cells[currentRow, 1].Value = "1. Verifique la cantidad física de cada producto y anótela en la columna 'Cantidad Física'.";
                worksheet.Cells[currentRow, 1, currentRow, 13].Merge = true;

                currentRow++;

                worksheet.Cells[currentRow, 1].Value = "2. En caso de discrepancias, anote las observaciones en la columna correspondiente.";
                worksheet.Cells[currentRow, 1, currentRow, 13].Merge = true;

                currentRow++;

                worksheet.Cells[currentRow, 1].Value = "3. Los productos marcados en rojo tienen un stock por debajo del mínimo requerido.";
                worksheet.Cells[currentRow, 1, currentRow, 13].Merge = true;

                currentRow += 2;

                // Encabezados de tabla
                var headerRow = currentRow;

                worksheet.Cells[headerRow, 1].Value = "Código";
                worksheet.Cells[headerRow, 2].Value = "Categoría";
                worksheet.Cells[headerRow, 3, headerRow, 5].Value = "Producto";
                worksheet.Cells[headerRow, 3, headerRow, 5].Merge = true;
                worksheet.Cells[headerRow, 6].Value = "Medidas";
                worksheet.Cells[headerRow, 7].Value = "Marca/Modelo";
                worksheet.Cells[headerRow, 8].Value = "Ubicación";
                worksheet.Cells[headerRow, 9].Value = "Cantidad Sistema";
                worksheet.Cells[headerRow, 10].Value = "Cantidad Física";
                worksheet.Cells[headerRow, 11].Value = "Diferencia";
                worksheet.Cells[headerRow, 12].Value = "Estado";
                worksheet.Cells[headerRow, 13].Value = "Observaciones";

                // Estilo para encabezados
                var headerRange = worksheet.Cells[headerRow, 1, headerRow, 13];
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
                headerRange.Style.Fill.BackgroundColor.SetColor(SystemDrawing.Color.FromArgb(48, 84, 150));
                headerRange.Style.Font.Color.SetColor(SystemDrawing.Color.White);
                headerRange.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                headerRange.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                headerRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                headerRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                headerRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                headerRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;

                currentRow++;
                var dataStartRow = currentRow;

                // Agregar datos de productos
                for (int i = 0; i < productos.Count; i++)
                {
                    var producto = productos[i];
                    int row = currentRow + i;

                    // Determinar la categoría del producto
                    string categoria = producto.Llanta != null ? "Llanta" : "Accesorio";

                    // Determinar ubicación ficticia para demostración (en una aplicación real, esto vendría de la base de datos)
                    string ubicacion = producto.Llanta != null
                        ? $"Bodega A - Pasillo {(producto.ProductoId % 5) + 1} - Estante {(producto.ProductoId % 10) + 1}"
                        : $"Bodega B - Sección {(producto.ProductoId % 3) + 1} - Estante {(producto.ProductoId % 8) + 1}";

                    worksheet.Cells[row, 1].Value = producto.ProductoId;
                    worksheet.Cells[row, 2].Value = categoria;
                    worksheet.Cells[row, 3, row, 5].Value = producto.NombreProducto;
                    worksheet.Cells[row, 3, row, 5].Merge = true;

                    // Medidas (para llantas)
                    if (producto.Llanta != null && producto.Llanta.Ancho.HasValue && producto.Llanta.Perfil.HasValue)
                    {
                        worksheet.Cells[row, 6].Value = $"{producto.Llanta.Ancho}/{producto.Llanta.Perfil}/R{producto.Llanta.Diametro}";
                    }
                    else
                    {
                        worksheet.Cells[row, 6].Value = "N/A";
                    }

                    // Marca/Modelo
                    if (producto.Llanta != null)
                    {
                        if (!string.IsNullOrEmpty(producto.Llanta.Marca) && !string.IsNullOrEmpty(producto.Llanta.Modelo))
                        {
                            worksheet.Cells[row, 7].Value = $"{producto.Llanta.Marca}/{producto.Llanta.Modelo}";
                        }
                        else if (!string.IsNullOrEmpty(producto.Llanta.Marca))
                        {
                            worksheet.Cells[row, 7].Value = producto.Llanta.Marca;
                        }
                        else if (!string.IsNullOrEmpty(producto.Llanta.Modelo))
                        {
                            worksheet.Cells[row, 7].Value = producto.Llanta.Modelo;
                        }
                        else
                        {
                            worksheet.Cells[row, 7].Value = "Sin especificar";
                        }
                    }
                    else
                    {
                        worksheet.Cells[row, 7].Value = "N/A";
                    }

                    worksheet.Cells[row, 8].Value = ubicacion;
                    worksheet.Cells[row, 9].Value = producto.CantidadEnInventario;
                    worksheet.Cells[row, 9].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    // Dejar en blanco para llenar manualmente
                    worksheet.Cells[row, 10].Value = "";
                    worksheet.Cells[row, 10].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[row, 10].Style.Fill.BackgroundColor.SetColor(SystemDrawing.Color.LightYellow);

                    // Fórmula para calcular diferencia
                    worksheet.Cells[row, 11].Formula = $"J{row}-I{row}";
                    worksheet.Cells[row, 11].Style.Numberformat.Format = "+##;-##;0";

                    // Estado de inventario (stock bajo o normal)
                    if (producto.CantidadEnInventario <= producto.StockMinimo)
                    {
                        worksheet.Cells[row, 12].Value = "STOCK BAJO";
                        worksheet.Cells[row, 12].Style.Font.Color.SetColor(SystemDrawing.Color.Red);
                        worksheet.Cells[row, 12].Style.Font.Bold = true;
                    }
                    else
                    {
                        worksheet.Cells[row, 12].Value = "Normal";
                    }

                    // Dejar en blanco para observaciones
                    worksheet.Cells[row, 13].Value = "";

                    // Resaltar filas con stock bajo
                    if (producto.CantidadEnInventario <= producto.StockMinimo)
                    {
                        var rowStyle = worksheet.Cells[row, 1, row, 13];
                        rowStyle.Style.Fill.PatternType = ExcelFillStyle.Solid;
                        rowStyle.Style.Fill.BackgroundColor.SetColor(SystemDrawing.Color.LightPink);
                    }

                    // Alternar colores de fila para mejor legibilidad
                    if (i % 2 == 0 && producto.CantidadEnInventario > producto.StockMinimo)
                    {
                        var rowStyle = worksheet.Cells[row, 1, row, 13];
                        rowStyle.Style.Fill.PatternType = ExcelFillStyle.Solid;
                        rowStyle.Style.Fill.BackgroundColor.SetColor(SystemDrawing.Color.WhiteSmoke);
                    }

                    // Aplicar bordes a todas las celdas
                    var rowRange = worksheet.Cells[row, 1, row, 13];
                    rowRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    rowRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                    rowRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    rowRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                }

                var lastDataRow = dataStartRow + productos.Count - 1;

                // Agregar totales
                currentRow = lastDataRow + 2;

                worksheet.Cells[currentRow, 8].Value = "TOTAL UNIDADES:";
                worksheet.Cells[currentRow, 8].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 8].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

                worksheet.Cells[currentRow, 9].Formula = $"SUM(I{dataStartRow}:I{lastDataRow})";
                worksheet.Cells[currentRow, 9].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 9].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                worksheet.Cells[currentRow, 10].Formula = $"SUM(J{dataStartRow}:J{lastDataRow})";
                worksheet.Cells[currentRow, 10].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 10].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                worksheet.Cells[currentRow, 11].Formula = $"SUM(K{dataStartRow}:K{lastDataRow})";
                worksheet.Cells[currentRow, 11].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 11].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                // Agregar sección para firmas
                currentRow += 3;

                worksheet.Cells[currentRow, 2].Value = "ELABORADO POR:";
                worksheet.Cells[currentRow, 2].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 2].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                worksheet.Cells[currentRow, 6].Value = "REVISADO POR:";
                worksheet.Cells[currentRow, 6].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 6].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                worksheet.Cells[currentRow, 10].Value = "APROBADO POR:";
                worksheet.Cells[currentRow, 10].Style.Font.Bold = true;
                worksheet.Cells[currentRow, 10].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                currentRow += 3;

                worksheet.Cells[currentRow, 1, currentRow, 3].Style.Border.Top.Style = ExcelBorderStyle.Thin;
                worksheet.Cells[currentRow, 1, currentRow, 3].Merge = true;

                worksheet.Cells[currentRow, 5, currentRow, 7].Style.Border.Top.Style = ExcelBorderStyle.Thin;
                worksheet.Cells[currentRow, 5, currentRow, 7].Merge = true;

                worksheet.Cells[currentRow, 9, currentRow, 11].Style.Border.Top.Style = ExcelBorderStyle.Thin;
                worksheet.Cells[currentRow, 9, currentRow, 11].Merge = true;

                currentRow++;

                worksheet.Cells[currentRow, 1, currentRow, 3].Value = "Nombre y Firma";
                worksheet.Cells[currentRow, 1, currentRow, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                worksheet.Cells[currentRow, 1, currentRow, 3].Merge = true;

                worksheet.Cells[currentRow, 5, currentRow, 7].Value = "Nombre y Firma";
                worksheet.Cells[currentRow, 5, currentRow, 7].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                worksheet.Cells[currentRow, 5, currentRow, 7].Merge = true;

                worksheet.Cells[currentRow, 9, currentRow, 11].Value = "Nombre y Firma";
                worksheet.Cells[currentRow, 9, currentRow, 11].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                worksheet.Cells[currentRow, 9, currentRow, 11].Merge = true;

                // Desproteger las celdas que el usuario debe completar
                for (int i = dataStartRow; i <= lastDataRow; i++)
                {
                    worksheet.Cells[i, 10].Style.Locked = false; // Cantidad física
                    worksheet.Cells[i, 13].Style.Locked = false; // Observaciones
                }

                // Autoajustar columnas
                worksheet.Cells.AutoFitColumns();

                // Establecer anchos mínimos para algunas columnas
                worksheet.Column(3).Width = 30; // Producto
                worksheet.Column(8).Width = 25; // Ubicación
                worksheet.Column(13).Width = 30; // Observaciones

                // Establecer zoom de la hoja
                worksheet.View.ZoomScale = 100;

                // Imprimir configuración
                worksheet.PrinterSettings.Orientation = eOrientation.Landscape;
                worksheet.PrinterSettings.FitToPage = true;
                worksheet.PrinterSettings.FitToWidth = 1;
                worksheet.PrinterSettings.FitToHeight = 0;

                // En lugar de usar new ExcelAddress(), especificar las filas como enteros
                worksheet.PrinterSettings.RepeatRows = worksheet.Cells[headerRow, 1, headerRow, 13];
                worksheet.PrinterSettings.PrintArea = worksheet.Cells[1, 1, currentRow, 13];

                // Generar el archivo en memoria
                var stream = new MemoryStream();
                package.SaveAs(stream);
                stream.Position = 0;

                // Nombre del archivo
                string fileName = $"Inventario_Fisico_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

                _logger.LogInformation($"Exportación a Excel de inventario físico completada: {fileName}");

                // Devolver el archivo para descargar
                return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar a Excel para toma física de inventario");
                // En caso de error, redireccionar con mensaje
                TempData["Error"] = "No se pudo generar el archivo Excel. Inténtelo nuevamente.";
                return RedirectToAction(nameof(Index));
            }
        }

        // GET: /Inventario/ProgramarInventario
        [HttpGet]
        public async Task<IActionResult> ProgramarInventario()
        {
            ViewData["Title"] = "Programar Inventario";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                // ✅ PASO 1: VERIFICACIÓN DE PERMISOS (SEGURIDAD PRINCIPAL)
                var validacion = await this.ValidarPermisoMvcAsync("Programar Inventario",
                    "No tienes permisos para programar inventarios. Contacta al administrador.");
                if (validacion != null) return validacion;
                // Obtener la lista de usuarios para asignar responsabilidades
                // En un escenario real, esto sería inyectado como un servicio
                var usuarios = await _usuariosService.ObtenerTodosAsync();

                // Obtener la lista de inventarios programados
                var inventariosProgramados = await _inventarioService.ObtenerInventariosProgramadosAsync();

                // Crear el modelo de vista
                var viewModel = new ProgramarInventarioViewModel
                {
                    UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList(),
                    InventariosProgramados = inventariosProgramados
                };
                // ✅ AGREGAR ESTA LÍNEA para pasar el usuario actual
                ViewBag.UsuarioActualId = ObtenerIdUsuarioActual(); // Método que obtengas el ID del usuario logueado

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de programación de inventario");
                TempData["Error"] = "Error al cargar la información para programar inventario.";
                return RedirectToAction(nameof(Index));
            }
        }

        // ✅ AGREGAR ESTE MÉTODO al final de la clase InventarioController
        private int ObtenerIdUsuarioActual()
        {
            try
            {
                _logger.LogInformation("=== OBTENIENDO ID USUARIO ACTUAL ===");

                // Listar todos los claims para debugging
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
                }

                // Intentar diferentes claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("NameIdentifier claim: {Value}", userIdClaim ?? "NULL");

                var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
                _logger.LogInformation("Name claim: {Value}", nameClaim ?? "NULL");

                var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
                _logger.LogInformation("Email claim: {Value}", emailClaim ?? "NULL");

                // Intentar parsear
                if (int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation("ID parseado de NameIdentifier: {UserId}", userId);
                    return userId;
                }

                if (int.TryParse(nameClaim, out int userIdFromName))
                {
                    _logger.LogInformation("ID parseado de Name: {UserId}", userIdFromName);
                    return userIdFromName;
                }

                _logger.LogWarning("No se pudo obtener el ID del usuario, usando fallback 1");
                return 1; // Fallback que debe existir en tu BD
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ID del usuario");
                return 1; // Fallback
            }
        }

        // POST: /Inventario/ProgramarInventario
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ProgramarInventario(ProgramarInventarioViewModel model)
        {
            try
            {
                // ✅ VERIFICACIÓN TAMBIÉN EN POST
                var validacion = await this.ValidarPermisoMvcAsync("Programar Inventario",
                    "No tienes permisos para crear inventarios programados.");
                if (validacion != null) return validacion;

                _logger.LogInformation("Iniciando proceso de creación de inventario programado");

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState no es válido para crear inventario programado");

                    // Recargar los datos necesarios para la vista
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var inventarios = await _inventarioService.ObtenerInventariosProgramadosAsync();

                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();
                    model.InventariosProgramados = inventarios;

                    // Mostrar errores específicos en el log
                    foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
                    {
                        _logger.LogWarning($"Error de validación: {error.ErrorMessage}");
                    }

                    TempData["Error"] = "Por favor corrija los errores en el formulario.";
                    return View(model);
                }

                // Validaciones adicionales
                if (model.NuevoInventario.FechaInicio < DateTime.Today)
                {
                    ModelState.AddModelError("NuevoInventario.FechaInicio", "La fecha de inicio no puede ser anterior a hoy");
                    TempData["Error"] = "La fecha de inicio no puede ser anterior a hoy.";

                    // Recargar datos
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var inventarios = await _inventarioService.ObtenerInventariosProgramadosAsync();
                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();
                    model.InventariosProgramados = inventarios;

                    return View(model);
                }

                if (model.NuevoInventario.FechaFin <= model.NuevoInventario.FechaInicio)
                {
                    ModelState.AddModelError("NuevoInventario.FechaFin", "La fecha de fin debe ser posterior a la fecha de inicio");
                    TempData["Error"] = "La fecha de fin debe ser posterior a la fecha de inicio.";

                    // Recargar datos
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var inventarios = await _inventarioService.ObtenerInventariosProgramadosAsync();
                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();
                    model.InventariosProgramados = inventarios;

                    return View(model);
                }

                if (model.NuevoInventario.UsuariosAsignados == null || !model.NuevoInventario.UsuariosAsignados.Any())
                {
                    TempData["Error"] = "Debe asignar al menos un usuario al inventario.";

                    // Recargar datos
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var inventarios = await _inventarioService.ObtenerInventariosProgramadosAsync();
                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();
                    model.InventariosProgramados = inventarios;

                    return View(model);
                }

                // Obtener el ID del usuario actual (deberías tener esto en tu sistema de autenticación)
                var usuarioActualId = int.Parse(User.FindFirst("UserId")?.Value ?? "1"); // Por ahora usamos 1 como fallback

                // Crear el DTO para el inventario programado
                var inventarioProgramado = new InventarioProgramadoDTO
                {
                    Titulo = model.NuevoInventario.Titulo,
                    Descripcion = model.NuevoInventario.Descripcion ?? string.Empty,
                    FechaInicio = model.NuevoInventario.FechaInicio,
                    FechaFin = model.NuevoInventario.FechaFin,
                    TipoInventario = model.NuevoInventario.TipoInventario,
                    Estado = "Programado",
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = usuarioActualId,
                    UbicacionEspecifica = model.NuevoInventario.UbicacionEspecifica ?? string.Empty,
                    IncluirStockBajo = model.NuevoInventario.IncluirStockBajo,
                    AsignacionesUsuarios = model.NuevoInventario.UsuariosAsignados.Select(ua => new AsignacionUsuarioInventarioDTO
                    {
                        UsuarioId = ua.UsuarioId,
                        NombreUsuario = ua.NombreUsuario ?? string.Empty,
                        PermisoConteo = ua.PermisoConteo,
                        PermisoAjuste = ua.PermisoAjuste,
                        PermisoValidacion = ua.PermisoValidacion,
                        FechaAsignacion = DateTime.Now
                    }).ToList()
                };

                _logger.LogInformation($"Enviando inventario programado al servicio: {inventarioProgramado.Titulo}");

                // Guardar el inventario programado usando el servicio
                var resultado = await _inventarioService.GuardarInventarioProgramadoAsync(inventarioProgramado);

                if (resultado)
                {
                    _logger.LogInformation("Inventario programado creado exitosamente");
                    TempData["Success"] = "Inventario programado exitosamente.";
                    return RedirectToAction(nameof(ProgramarInventario));
                }
                else
                {
                    _logger.LogError("Error al guardar el inventario programado en el servicio");
                    TempData["Error"] = "Error al programar el inventario.";

                    // Recargar datos
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var inventarios = await _inventarioService.ObtenerInventariosProgramadosAsync();
                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();
                    model.InventariosProgramados = inventarios;

                    return View(model);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al programar el inventario: {Message}", ex.Message);
                TempData["Error"] = "Error al programar el inventario: " + ex.Message;

                // Recargar los datos necesarios para la vista en caso de error
                try
                {
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var inventarios = await _inventarioService.ObtenerInventariosProgramadosAsync();
                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();
                    model.InventariosProgramados = inventarios;
                }
                catch (Exception innerEx)
                {
                    _logger.LogError(innerEx, "Error adicional al recargar datos para la vista");
                }

                return View(model);
            }
        }

        // ✅ NUEVO MÉTODO POST PARA JSON (agregar ADEMÁS del existente)
        [HttpPost]
        [Route("Inventario/ProgramarInventarioJson")]
        public async Task<IActionResult> ProgramarInventarioJson([FromBody] InventarioProgramadoDTO inventarioDto)
        {
            _logger.LogInformation("=== MÉTODO JSON EJECUTADO ===");

            try
            {
                // ✅ LOGGING DETALLADO
                _logger.LogInformation("Datos recibidos:");
                _logger.LogInformation("- Título: {Titulo}", inventarioDto?.Titulo ?? "NULL");
                _logger.LogInformation("- UsuarioCreadorId recibido: {UsuarioCreadorId}", inventarioDto?.UsuarioCreadorId);

                // ✅ OBTENER ID DEL USUARIO ACTUAL
                var usuarioActualId = ObtenerIdUsuarioActual();
                _logger.LogInformation("- UsuarioActualId desde método: {UsuarioActualId}", usuarioActualId);

                // ✅ VERIFICAR SI EL USUARIO EXISTE usando el servicio
                try
                {
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    var usuarioExiste = usuarios.Any(u => u.UsuarioId == usuarioActualId);
                    _logger.LogInformation("- ¿Usuario existe en BD?: {UsuarioExiste}", usuarioExiste);

                    if (!usuarioExiste)
                    {
                        _logger.LogError("El usuario con ID {UsuarioId} no existe", usuarioActualId);

                        // ✅ USAR EL PRIMER USUARIO ACTIVO COMO FALLBACK
                        var primerUsuarioActivo = usuarios.FirstOrDefault(u => u.Activo);
                        if (primerUsuarioActivo != null)
                        {
                            usuarioActualId = primerUsuarioActivo.UsuarioId;
                            _logger.LogInformation("Usando usuario fallback: {UsuarioId}", usuarioActualId);
                        }
                        else
                        {
                            return BadRequest(new { success = false, message = "No se encontró un usuario válido" });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al verificar usuario");
                    // Continuar con el usuarioActualId obtenido
                }

                // Resto de validaciones...
                if (inventarioDto == null)
                {
                    return BadRequest(new { success = false, message = "Datos inválidos" });
                }

                if (string.IsNullOrEmpty(inventarioDto.Titulo))
                {
                    return BadRequest(new { success = false, message = "El título es requerido" });
                }

                // ✅ USAR EL ID VÁLIDO
                inventarioDto.Estado = "Programado";
                inventarioDto.FechaCreacion = DateTime.Now;
                inventarioDto.UsuarioCreadorId = usuarioActualId; // ✅ FORZAR EL ID CORRECTO

                _logger.LogInformation("Enviando al servicio con UsuarioCreadorId: {Id}", inventarioDto.UsuarioCreadorId);

                // Llamar al servicio
                var resultado = await _inventarioService.GuardarInventarioProgramadoAsync(inventarioDto);

                if (resultado)
                {
                    _logger.LogInformation("Inventario guardado exitosamente");
                    return Ok(new { success = true, message = "Inventario programado exitosamente" });
                }
                else
                {
                    _logger.LogError("El servicio retornó false");
                    return BadRequest(new { success = false, message = "Error al guardar el inventario" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al programar inventario JSON");
                return StatusCode(500, new { success = false, message = "Error interno: " + ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DetalleInventarioProgramado(int id)
        {
            ViewData["Title"] = "Detalle de Inventario Programado";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                // Obtener el inventario programado
                var inventario = await _inventarioService.ObtenerInventarioProgramadoPorIdAsync(id);
                if (inventario == null || inventario.InventarioProgramadoId == 0)
                {
                    TempData["Error"] = "Inventario programado no encontrado.";
                    return RedirectToAction(nameof(ProgramarInventario));
                }

                return View(inventario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar detalle del inventario programado {Id}", id);
                TempData["Error"] = "Error al cargar el detalle del inventario programado.";
                return RedirectToAction(nameof(ProgramarInventario));
            }
        }

        // GET: /Inventario/EditarInventarioProgramado/5
        [HttpGet]
        public async Task<IActionResult> EditarInventarioProgramado(int id)
        {
            ViewData["Title"] = "Editar Inventario Programado";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                // Obtener el inventario programado
                var inventario = await _inventarioService.ObtenerInventarioProgramadoPorIdAsync(id);
                if (inventario == null || inventario.InventarioProgramadoId == 0)
                {
                    TempData["Error"] = "Inventario programado no encontrado.";
                    return RedirectToAction(nameof(ProgramarInventario));
                }

                // Verificar que el inventario no esté en progreso o completado
                if (inventario.Estado != "Programado")
                {
                    TempData["Error"] = "No se puede editar un inventario que ya está en progreso o completado.";
                    return RedirectToAction(nameof(ProgramarInventario));
                }

                // Obtener la lista de usuarios para asignar responsabilidades
                var usuarios = await _usuariosService.ObtenerTodosAsync();

                // Crear el modelo de vista para edición
                var viewModel = new EditarInventarioViewModel
                {
                    InventarioProgramado = inventario,
                    UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList()
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de edición del inventario programado {Id}", id);
                TempData["Error"] = "Error al cargar el formulario de edición.";
                return RedirectToAction(nameof(ProgramarInventario));
            }
        }

        // POST: /Inventario/EditarInventarioProgramado/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarInventarioProgramado(int id, EditarInventarioViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    // Recargar los datos necesarios para la vista
                    var usuarios = await _usuariosService.ObtenerTodosAsync();
                    model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();

                    return View(model);
                }

                // Actualizar el inventario programado
                var resultado = await _inventarioService.ActualizarInventarioProgramadoAsync(id, model.InventarioProgramado);

                if (resultado)
                {
                    TempData["Success"] = "Inventario programado actualizado exitosamente.";
                    return RedirectToAction(nameof(ProgramarInventario));
                }

                TempData["Error"] = "Error al actualizar el inventario programado.";

                // Recargar los datos necesarios para la vista
                var usuariosRefresh = await _usuariosService.ObtenerTodosAsync();
                model.UsuariosDisponibles = usuariosRefresh.Where(u => u.Activo).ToList();

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar el inventario programado {Id}", id);
                TempData["Error"] = "Error al actualizar el inventario programado: " + ex.Message;

                // Recargar los datos necesarios para la vista
                var usuarios = await _usuariosService.ObtenerTodosAsync();
                model.UsuariosDisponibles = usuarios.Where(u => u.Activo).ToList();

                return View(model);
            }
        }

        // POST: /Inventario/IniciarInventario/5
        [HttpPost]
        public async Task<IActionResult> IniciarInventario(int id)
        {
            try
            {
                var resultado = await _inventarioService.IniciarInventarioAsync(id);

                return Json(new { success = resultado, message = resultado ? "Inventario iniciado exitosamente." : "No se pudo iniciar el inventario." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al iniciar inventario {Id}", id);
                return Json(new { success = false, message = "Error al iniciar el inventario: " + ex.Message });
            }
        }

        // POST: /Inventario/CancelarInventario/5
        [HttpPost]
        public async Task<IActionResult> CancelarInventario(int id)
        {
            try
            {
                var resultado = await _inventarioService.CancelarInventarioAsync(id);

                return Json(new { success = resultado, message = resultado ? "Inventario cancelado exitosamente." : "No se pudo cancelar el inventario." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cancelar inventario {Id}", id);
                return Json(new { success = false, message = "Error al cancelar el inventario: " + ex.Message });
            }
        }

        // POST: /Inventario/CompletarInventario/5
        [HttpPost]
        public async Task<IActionResult> CompletarInventario(int id)
        {
            try
            {
                var resultado = await _inventarioService.CompletarInventarioAsync(id);

                return Json(new { success = resultado, message = resultado ? "Inventario completado exitosamente." : "No se pudo completar el inventario." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al completar inventario {Id}", id);
                return Json(new { success = false, message = "Error al completar el inventario: " + ex.Message });
            }
        }

        // GET: /Inventario/ExportarResultadosInventario/5
        [HttpGet]
        public async Task<IActionResult> ExportarResultadosInventario(int id, string formato = "excel")
        {
            try
            {
                // Verificar el formato solicitado
                if (formato.ToLower() == "pdf")
                {
                    // Exportar a PDF
                    var pdfStream = await _inventarioService.ExportarResultadosInventarioPDFAsync(id);
                    return File(pdfStream, "application/pdf", $"Resultados_Inventario_{id}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
                }
                else
                {
                    // Por defecto, exportar a Excel
                    var excelStream = await _inventarioService.ExportarResultadosInventarioExcelAsync(id);
                    return File(excelStream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Resultados_Inventario_{id}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar resultados del inventario {Id}", id);
                TempData["Error"] = "Error al exportar los resultados del inventario.";
                return RedirectToAction(nameof(DetalleInventarioProgramado), new { id });
            }
        }

        // GET: /Inventario/BuscarMarcas?filtro=text
        [HttpGet]
        [Route("Inventario/BuscarMarcas")]
        public async Task<IActionResult> BuscarMarcas(string filtro = "")
        {
            try
            {
                _logger.LogInformation("🔍 Búsqueda de marcas solicitada con filtro: '{Filtro}'", filtro);

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ Token JWT no encontrado");
                    return Json(new List<string>());
                }

                // Llamar al servicio para obtener las marcas
                var marcas = await _inventarioService.BuscarMarcasLlantasAsync(filtro, token);

                _logger.LogInformation("✅ Devolviendo {Count} marcas encontradas", marcas.Count);

                // Devolver JSON directamente
                return Json(marcas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar marcas en controlador web");
                return Json(new List<string>());
            }
        }

        // GET: /Inventario/BuscarModelos?filtro=text&marca=brand
        [HttpGet]
        [Route("Inventario/BuscarModelos")]
        public async Task<IActionResult> BuscarModelos(string filtro = "", string marca = "")
        {
            try
            {
                _logger.LogInformation("🔍 Búsqueda de modelos solicitada - Filtro: '{Filtro}', Marca: '{Marca}'", filtro, marca);

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ Token JWT no encontrado para búsqueda de modelos");
                    return Json(new List<string>());
                }

                // Llamar al servicio para obtener los modelos
                var modelos = await _inventarioService.BuscarModelosLlantasAsync(filtro, marca, token);

                _logger.LogInformation("✅ Devolviendo {Count} modelos encontrados", modelos.Count);

                // Devolver JSON directamente
                return Json(modelos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar modelos en controlador web");
                return Json(new List<string>());
            }
        }

        // GET: /Inventario/BuscarIndicesVelocidad?filtro=text
        [HttpGet]
        [Route("Inventario/BuscarIndicesVelocidad")]
        public async Task<IActionResult> BuscarIndicesVelocidad(string filtro = "")
        {
            try
            {
                _logger.LogInformation("🔍 Búsqueda de índices de velocidad solicitada con filtro: '{Filtro}'", filtro);

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ Token JWT no encontrado para búsqueda de índices");
                    return Json(new List<string>());
                }

                // Llamar al servicio para obtener los índices
                var indices = await _inventarioService.BuscarIndicesVelocidadAsync(filtro, token);

                _logger.LogInformation("✅ Devolviendo {Count} índices de velocidad encontrados", indices.Count);

                // Devolver JSON directamente
                return Json(indices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar índices de velocidad en controlador web");
                return Json(new List<string>());
            }
        }

        // GET: /Inventario/BuscarTiposTerreno?filtro=text
        [HttpGet]
        [Route("Inventario/BuscarTiposTerreno")]
        public async Task<IActionResult> BuscarTiposTerreno(string filtro = "")
        {
            try
            {
                _logger.LogInformation("🔍 Búsqueda de tipos de terreno solicitada con filtro: '{Filtro}'", filtro);

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ Token JWT no encontrado para búsqueda de tipos de terreno");
                    return Json(new List<string>());
                }

                // Llamar al servicio para obtener los tipos
                var tipos = await _inventarioService.BuscarTiposTerrenoAsync(filtro, token);

                _logger.LogInformation("✅ Devolviendo {Count} tipos de terreno encontrados", tipos.Count);

                // Devolver JSON directamente
                return Json(tipos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar tipos de terreno en controlador web");
                return Json(new List<string>());
            }
        }
    }
}
    
