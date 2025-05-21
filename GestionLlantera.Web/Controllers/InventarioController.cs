using GestionLlantera.Web.Models.DTOs.Inventario;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml; // Para manejar archivos Excel
using OfficeOpenXml.Style;
using System.Drawing;
using System.IO;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.tool.xml;
using iTextSharp.text.html.simpleparser;


namespace GestionLlantera.Web.Controllers
{
    [Authorize] // Solo usuarios autenticados
    public class InventarioController : Controller
    {
        private readonly IInventarioService _inventarioService;
        private readonly ILogger<InventarioController> _logger;

        public InventarioController(
            IInventarioService inventarioService,
            ILogger<InventarioController> logger)
        {
            _inventarioService = inventarioService;
            _logger = logger;
        }

        // GET: /Inventario
        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Inventario de Productos";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                var productos = await _inventarioService.ObtenerProductosAsync();
                return View(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la lista de productos");
                TempData["Error"] = "Error al cargar los productos.";
                return View(new List<ProductoDTO>());
            }
        }

        // GET: /Inventario/DetalleProducto/5
        public async Task<IActionResult> DetalleProducto(int id)
        {
            ViewData["Title"] = "Detalle de Producto";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id);
                if (producto == null || producto.ProductoId == 0)
                {
                    TempData["Error"] = "Producto no encontrado.";
                    return RedirectToAction(nameof(Index));
                }

                return View(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar detalle del producto {Id}", id);
                TempData["Error"] = "Error al cargar el detalle del producto.";
                return RedirectToAction(nameof(Index));
            }
        }

        // Método GET para mostrar el formulario de agregar producto
        [HttpGet]
        public async Task<IActionResult> AgregarProducto()
        {
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
                // Registra información para diagnóstico
                _logger.LogInformation("Método AgregarProducto llamado");
                _logger.LogInformation($"Content-Type: {Request.ContentType}");
                _logger.LogInformation($"Archivos: {Request.Form.Files.Count}");

                // Verificar el modelo
                if (producto != null)
                {
                    _logger.LogInformation($"ProductoDTO vinculado: NombreProducto={producto.NombreProducto}, Precio={producto.Precio}");
                }
                else
                {
                    _logger.LogWarning("El modelo ProductoDTO no se pudo vincular (es null)");
                }

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState no es válido:");
                    foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
                    {
                        _logger.LogWarning($"  - Error: {error.ErrorMessage}");
                    }
                    return View(producto);
                }

                // Obtener las imágenes
                var imagenes = Request.Form.Files.GetFiles("imagenes").ToList();
                _logger.LogInformation($"Recibidas {imagenes.Count} imágenes");

                // Intentar guardar el producto
                var resultado = await _inventarioService.AgregarProductoAsync(producto, imagenes);

                if (resultado)
                {
                    TempData["Success"] = "Producto agregado exitosamente";
                    return RedirectToAction(nameof(Index));
                }

                // Si no se pudo guardar, mostrar error
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


        // Asegúrate de que la ruta sea correcta
        [HttpGet("ObtenerImagenesProducto/{id}")]
        public async Task<IActionResult> ObtenerImagenesProducto(int id)
        {
            try
            {
                _logger.LogInformation($"Obteniendo imágenes para el producto ID: {id}");

                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id);

                if (producto == null || producto.ProductoId == 0)
                {
                    _logger.LogWarning($"Producto no encontrado o ID inválido: {id}");
                    return Json(new List<object>());
                }

                _logger.LogInformation($"Imágenes encontradas: {producto.Imagenes?.Count ?? 0}");

                // Devolver las imágenes en formato JSON
                return Json(producto.Imagenes ?? new List<ImagenProductoDTO>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener imágenes del producto {Id}", id);
                return Json(new List<object>());
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


        // Agrega esto a tu clase InventarioController
        [HttpGet]
        public async Task<IActionResult> ExportarExcel()
        {
            try
            {
                _logger.LogInformation("Iniciando exportación a Excel");

                // Obtener los datos de productos
                var productos = await _inventarioService.ObtenerProductosAsync();

                // Configurar licencia de EPPlus (importante para cumplir con los términos de uso)
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();
                var worksheet = package.Workbook.Worksheets.Add("Inventario");

                // Estilos para encabezados
                var headerStyle = worksheet.Cells[1, 1, 1, 9].Style;
                headerStyle.Font.Bold = true;
                headerStyle.Fill.PatternType = ExcelFillStyle.Solid;
                headerStyle.Fill.BackgroundColor.SetColor(Color.LightBlue);
                headerStyle.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                // Definir encabezados
                worksheet.Cells[1, 1].Value = "ID";
                worksheet.Cells[1, 2].Value = "Nombre";
                worksheet.Cells[1, 3].Value = "Descripción";
                worksheet.Cells[1, 4].Value = "Precio";
                worksheet.Cells[1, 5].Value = "Stock Actual";
                worksheet.Cells[1, 6].Value = "Stock Mínimo";
                worksheet.Cells[1, 7].Value = "Medidas";
                worksheet.Cells[1, 8].Value = "Marca";
                worksheet.Cells[1, 9].Value = "Modelo";

                // Llenar datos
                for (int i = 0; i < productos.Count; i++)
                {
                    var producto = productos[i];
                    int row = i + 2; // Empezar en la fila 2 (después de los encabezados)

                    worksheet.Cells[row, 1].Value = producto.ProductoId;
                    worksheet.Cells[row, 2].Value = producto.NombreProducto;
                    worksheet.Cells[row, 3].Value = producto.Descripcion;
                    worksheet.Cells[row, 4].Value = producto.Precio;
                    // Formatear columna de precio como moneda
                    worksheet.Cells[row, 4].Style.Numberformat.Format = "₡#,##0.00";

                    worksheet.Cells[row, 5].Value = producto.CantidadEnInventario;
                    worksheet.Cells[row, 6].Value = producto.StockMinimo;

                    // Para productos tipo llanta
                    if (producto.Llanta != null)
                    {
                        // Medidas (si hay datos disponibles)
                        if (producto.Llanta.Ancho.HasValue && producto.Llanta.Perfil.HasValue && !string.IsNullOrEmpty(producto.Llanta.Diametro))
                        {
                            worksheet.Cells[row, 7].Value = $"{producto.Llanta.Ancho}/{producto.Llanta.Perfil}/R{producto.Llanta.Diametro}";
                        }

                        worksheet.Cells[row, 8].Value = producto.Llanta.Marca;
                        worksheet.Cells[row, 9].Value = producto.Llanta.Modelo;
                    }

                    // Resaltar filas con stock bajo
                    if (producto.CantidadEnInventario <= producto.StockMinimo)
                    {
                        var rowStyle = worksheet.Cells[row, 1, row, 9].Style;
                        rowStyle.Fill.PatternType = ExcelFillStyle.Solid;
                        rowStyle.Fill.BackgroundColor.SetColor(Color.LightPink);
                    }
                }

                // Autoajustar columnas
                worksheet.Cells.AutoFitColumns();

                // Generar el archivo en memoria
                var stream = new MemoryStream();
                package.SaveAs(stream);
                stream.Position = 0;

                // Nombre del archivo
                string fileName = $"Inventario_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

                _logger.LogInformation($"Exportación a Excel completada: {fileName}");

                // Devolver el archivo para descargar
                return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar a Excel");
                // En caso de error, redireccionar con mensaje
                TempData["Error"] = "No se pudo generar el archivo Excel. Inténtelo nuevamente.";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpGet]
        public async Task<IActionResult> ExportarPDF()
        {
            try
            {
                _logger.LogInformation("Iniciando exportación a PDF");

                // Obtener los datos de productos
                var productos = await _inventarioService.ObtenerProductosAsync();

                // Crear documento PDF
                using var memoryStream = new MemoryStream();
                var document = new Document(PageSize.A4.Rotate(), 10f, 10f, 10f, 10f);
                var writer = PdfWriter.GetInstance(document, memoryStream);

                // Metadata
                document.AddTitle("Inventario de Productos");
                document.AddAuthor("Sistema de Gestión de Llantera");
                document.AddCreationDate();

                // Abrir documento
                document.Open();

                // Fuentes
                var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
                var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE);
                var cellFont = FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
                var lowStockFont = FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.RED);

                // Título
                var title = new Paragraph("Inventario de Productos", titleFont);
                title.Alignment = Element.ALIGN_CENTER;
                title.SpacingAfter = 20f;
                document.Add(title);

                // Fecha de generación
                var dateText = new Paragraph($"Generado el: {DateTime.Now:dd/MM/yyyy HH:mm:ss}", cellFont);
                dateText.Alignment = Element.ALIGN_RIGHT;
                dateText.SpacingAfter = 20f;
                document.Add(dateText);

                // Crear tabla
                var table = new PdfPTable(8) { WidthPercentage = 100 };

                // Establecer anchos relativos de columnas
                float[] widths = new float[] { 1f, 3f, 3f, 1.5f, 1.2f, 1.2f, 2f, 2f };
                table.SetWidths(widths);

                // Encabezados
                AddHeaderCell(table, "ID", headerFont);
                AddHeaderCell(table, "Nombre", headerFont);
                AddHeaderCell(table, "Descripción", headerFont);
                AddHeaderCell(table, "Precio", headerFont);
                AddHeaderCell(table, "Stock Actual", headerFont);
                AddHeaderCell(table, "Stock Mín", headerFont);
                AddHeaderCell(table, "Medidas", headerFont);
                AddHeaderCell(table, "Marca/Modelo", headerFont);

                // Datos
                foreach (var producto in productos)
                {
                    // Determinar si tiene stock bajo
                    bool stockBajo = producto.CantidadEnInventario <= producto.StockMinimo;
                    var font = stockBajo ? lowStockFont : cellFont;

                    // Agregar celdas
                    AddCell(table, producto.ProductoId.ToString(), font);
                    AddCell(table, producto.NombreProducto, font);
                    AddCell(table, producto.Descripcion ?? "", font);
                    AddCell(table, $"₡{producto.Precio:N0}", font);
                    AddCell(table, producto.CantidadEnInventario.ToString(), font);
                    AddCell(table, producto.StockMinimo.ToString(), font);

                    // Medidas (si es llanta)
                    string medidas = "";
                    if (producto.Llanta != null && producto.Llanta.Ancho.HasValue && producto.Llanta.Perfil.HasValue)
                    {
                        medidas = $"{producto.Llanta.Ancho}/{producto.Llanta.Perfil}/R{producto.Llanta.Diametro}";
                    }
                    AddCell(table, medidas, font);

                    // Marca y modelo
                    string marcaModelo = "";
                    if (producto.Llanta != null)
                    {
                        if (!string.IsNullOrEmpty(producto.Llanta.Marca) && !string.IsNullOrEmpty(producto.Llanta.Modelo))
                        {
                            marcaModelo = $"{producto.Llanta.Marca} / {producto.Llanta.Modelo}";
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
                    AddCell(table, marcaModelo, font);
                }

                // Agregar tabla al documento
                document.Add(table);

                // Agregar leyenda
                var legend = new Paragraph("* Productos en rojo indican stock por debajo del mínimo.", lowStockFont);
                legend.SpacingBefore = 15f;
                document.Add(legend);

                // Agregar resumen
                var summary = new Paragraph($"Total de productos: {productos.Count}", cellFont);
                var lowStockCount = productos.Count(p => p.CantidadEnInventario <= p.StockMinimo);
                summary.Add(new Chunk($"\nProductos con stock bajo: {lowStockCount}", lowStockFont));
                summary.SpacingBefore = 15f;
                document.Add(summary);

                // Cerrar documento
                document.Close();
                writer.Close();

                // Nombre del archivo
                string fileName = $"Inventario_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                _logger.LogInformation($"Exportación a PDF completada: {fileName}");

                // Devolver el archivo
                return File(memoryStream.ToArray(), "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar a PDF");
                // En caso de error, redireccionar con mensaje
                TempData["Error"] = "No se pudo generar el archivo PDF. Inténtelo nuevamente.";
                return RedirectToAction(nameof(Index));
            }
        }

        // Método auxiliar para agregar encabezados a la tabla PDF
        private void AddHeaderCell(PdfPTable table, string text, iTextSharp.text.Font font)
        {
            var cell = new PdfPCell(new Phrase(text, font));
            cell.HorizontalAlignment = Element.ALIGN_CENTER;
            cell.VerticalAlignment = Element.ALIGN_MIDDLE;
            cell.BackgroundColor = new BaseColor(51, 122, 183); // Color azul
            cell.Padding = 5f;
            table.AddCell(cell);
        }

        // Método auxiliar para agregar celdas a la tabla PDF
        private void AddCell(PdfPTable table, string text, iTextSharp.text.Font font)
        {
            var cell = new PdfPCell(new Phrase(text, font));
            cell.HorizontalAlignment = Element.ALIGN_LEFT;
            cell.VerticalAlignment = Element.ALIGN_MIDDLE;
            cell.Padding = 5f;
            table.AddCell(cell);
        }
    }
}