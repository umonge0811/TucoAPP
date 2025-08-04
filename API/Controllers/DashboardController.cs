
using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(TucoContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("alertas-stock")]
        public async Task<IActionResult> ObtenerAlertasStock()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo alertas de stock para dashboard");

                // Obtener productos con stock bajo (cantidad <= stock mínimo)
                var productosStockBajo = await _context.Productos
                    .Where(p => p.CantidadEnInventario <= p.StockMinimo)
                    .Select(p => new
                    {
                        p.ProductoId,
                        p.NombreProducto,
                        p.CantidadEnInventario,
                        p.StockMinimo,
                        Diferencia = p.StockMinimo - p.CantidadEnInventario
                    })
                    .OrderBy(p => p.CantidadEnInventario)
                    .ToListAsync();

                var totalAlertas = productosStockBajo.Count;
                var productosAgotados = productosStockBajo.Count(p => p.CantidadEnInventario == 0);
                var productosCriticos = productosStockBajo.Count(p => p.CantidadEnInventario > 0 && p.CantidadEnInventario <= p.StockMinimo);

                _logger.LogInformation("📊 Alertas encontradas: {Total} total, {Agotados} agotados, {Criticos} críticos", 
                    totalAlertas, productosAgotados, productosCriticos);

                return Ok(new
                {
                    success = true,
                    totalAlertas = totalAlertas,
                    productosAgotados = productosAgotados,
                    productosCriticos = productosCriticos,
                    productos = productosStockBajo,
                    mensaje = totalAlertas > 0 ? "Productos requieren atención" : "Stock en buen estado"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener alertas de stock");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error al obtener alertas de stock" 
                });
            }
        }
    }
}
