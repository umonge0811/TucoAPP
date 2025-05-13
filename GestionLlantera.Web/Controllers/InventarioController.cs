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

        // GET: /Inventario/AgregarProducto
        public IActionResult AgregarProducto()
        {
            ViewData["Title"] = "Agregar Producto";
            ViewData["Layout"] = "_AdminLayout";
            return View(new ProductoDTO());
        }

        // POST: /Inventario/AgregarProducto
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AgregarProducto(ProductoDTO producto)
        {
            ViewData["Title"] = "Agregar Producto";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                if (!ModelState.IsValid)
                {
                    return View(producto);
                }

                var imagenes = Request.Form.Files.ToList();
                var exito = await _inventarioService.AgregarProductoAsync(producto, imagenes);

                if (exito)
                {
                    TempData["Success"] = "Producto agregado exitosamente.";
                    return RedirectToAction(nameof(Index));
                }
                else
                {
                    TempData["Error"] = "Error al agregar el producto.";
                    return View(producto);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar producto");
                TempData["Error"] = "Ocurrió un error al agregar el producto.";
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
    }
}