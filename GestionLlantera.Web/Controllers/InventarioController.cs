using GestionLlantera.Web.Models.DTOs.Inventario;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        // Método POST para procesar el formulario
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AgregarProducto(ProductoDTO producto)
        {
            if (!ModelState.IsValid)
            {
                return View(producto);
            }

            // Obtener los archivos de imágenes del formulario
            var imagenes = Request.Form.Files.ToList();

            // Llamar al servicio para guardar el producto con las imágenes
            var exito = await _inventarioService.AgregarProductoAsync(producto, imagenes);

            if (exito)
            {
                TempData["Success"] = "Producto agregado exitosamente";
                return RedirectToAction(nameof(Index));
            }

            TempData["Error"] = "Error al agregar el producto";
            return View(producto);
        }


        // GET: /Inventario/Programaciones
        public IActionResult Programaciones()
        {
            ViewData["Title"] = "Inventarios Programados";
            ViewData["Layout"] = "_AdminLayout";

            // Por ahora solo mostrará una vista vacía
            return View();
        }
    }
}