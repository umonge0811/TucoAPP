using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Controllers
{
    /// <summary>
    /// Controlador público para mostrar productos sin autenticación
    /// </summary>
    public class PublicController : Controller
    {
        private readonly IInventarioService _inventarioService;
        private readonly ILogger<PublicController> _logger;

        public PublicController(IInventarioService inventarioService, ILogger<PublicController> logger)
        {
            _inventarioService = inventarioService;
            _logger = logger;
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
        [HttpGet]
        public async Task<IActionResult> DetalleProducto(int id)
        {
            try
            {
                var producto = await _inventarioService.ObtenerProductoPorIdAsync(id);

                if (producto == null || producto.CantidadEnInventario <= 0)
                {
                    TempData["Error"] = "El producto no está disponible o no existe.";
                    return RedirectToAction("Productos");
                }

                return View(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar detalle del producto {ProductoId}", id);
                TempData["Error"] = "Error al cargar el detalle del producto.";
                return RedirectToAction("Productos");
            }
        }
    }
}