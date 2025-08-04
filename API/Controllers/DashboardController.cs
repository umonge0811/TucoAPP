
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

        [HttpGet("inventario-total")]
        public async Task<IActionResult> ObtenerInventarioTotal()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo resumen de inventario total para dashboard");

                // Obtener estadísticas del inventario
                var estadisticas = await _context.Productos
                    .GroupBy(p => 1)
                    .Select(g => new
                    {
                        TotalProductos = g.Count(),
                        TotalCantidad = g.Sum(p => p.CantidadEnInventario),
                        ValorTotalInventario = g.Sum(p => p.CantidadEnInventario * p.Precio),
                        ProductosActivos = g.Count(p => p.CantidadEnInventario > 0),
                        ProductosAgotados = g.Count(p => p.CantidadEnInventario == 0)
                    })
                    .FirstOrDefaultAsync();

                if (estadisticas == null)
                {
                    return Ok(new
                    {
                        success = true,
                        valorTotal = 0m,
                        totalProductos = 0,
                        totalCantidad = 0,
                        productosActivos = 0,
                        productosAgotados = 0,
                        mensaje = "No hay productos en el inventario"
                    });
                }

                _logger.LogInformation("📊 Inventario total: ₡{Valor:N0}, {Productos} productos, {Cantidad} unidades", 
                    estadisticas.ValorTotalInventario, estadisticas.TotalProductos, estadisticas.TotalCantidad);

                return Ok(new
                {
                    success = true,
                    valorTotal = estadisticas.ValorTotalInventario,
                    totalProductos = estadisticas.TotalProductos,
                    totalCantidad = estadisticas.TotalCantidad,
                    productosActivos = estadisticas.ProductosActivos,
                    productosAgotados = estadisticas.ProductosAgotados,
                    mensaje = $"{estadisticas.TotalProductos} productos en inventario"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener estadísticas de inventario total");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error al obtener estadísticas de inventario" 
                });
            }
        }

        [HttpGet("top-vendedor")]
        public async Task<IActionResult> ObtenerTopVendedor()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo top vendedor para dashboard");

                // Obtener el vendedor con más ventas del mes actual
                var fechaInicio = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
                var fechaFin = fechaInicio.AddMonths(1).AddDays(-1);

                var topVendedor = await _context.Facturas
                    .Where(f => f.FechaFactura >= fechaInicio && f.FechaFactura <= fechaFin)
                    .GroupBy(f => new { f.UsuarioCreadorId, f.UsuarioCreador.NombreUsuario })
                    .Select(g => new
                    {
                        UsuarioId = g.Key.UsuarioCreadorId,
                        NombreVendedor = g.Key.NombreUsuario,
                        TotalVentas = g.Count(),
                        MontoTotal = g.Sum(f => f.Total),
                        PromedioVenta = g.Average(f => f.Total)
                    })
                    .OrderByDescending(v => v.TotalVentas)
                    .ThenByDescending(v => v.MontoTotal)
                    .FirstOrDefaultAsync();

                if (topVendedor == null)
                {
                    _logger.LogInformation("📊 No se encontraron ventas para el mes actual");
                    return Ok(new
                    {
                        success = true,
                        vendedor = "Sin ventas",
                        totalVentas = 0,
                        montoTotal = 0m,
                        promedioVenta = 0m,
                        mensaje = "No hay ventas registradas este mes"
                    });
                }

                _logger.LogInformation("📊 Top vendedor: {Vendedor} con {Ventas} ventas por ₡{Monto:N0}", 
                    topVendedor.NombreVendedor, topVendedor.TotalVentas, topVendedor.MontoTotal);

                return Ok(new
                {
                    success = true,
                    vendedor = topVendedor.NombreVendedor,
                    totalVentas = topVendedor.TotalVentas,
                    montoTotal = topVendedor.MontoTotal,
                    promedioVenta = topVendedor.PromedioVenta,
                    mensaje = $"{topVendedor.NombreVendedor} lidera con {topVendedor.TotalVentas} ventas"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener top vendedor");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error al obtener estadísticas de vendedor" 
                });
            }
        }
    }
}
