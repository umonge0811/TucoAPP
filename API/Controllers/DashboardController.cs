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

                var productosConAlertaStock = await _context.Productos
                    .Where(p => p.CantidadEnInventario <= p.StockMinimo && p.CantidadEnInventario > 0)
                    .CountAsync();

                var productosAgotados = await _context.Productos
                    .Where(p => p.CantidadEnInventario == 0)
                    .CountAsync();

                var totalAlertas = productosConAlertaStock + productosAgotados;

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalAlertas = totalAlertas,
                        productosStockBajo = productosConAlertaStock,
                        productosAgotados = productosAgotados,
                        mensaje = totalAlertas > 0 ? 
                            $"{totalAlertas} productos requieren atención" : 
                            "Stock en niveles normales"
                    },
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo alertas de stock");
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
                _logger.LogInformation("🏆 Obteniendo top vendedor del mes");

                var fechaInicioMes = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
                var fechaFinMes = fechaInicioMes.AddMonths(1).AddDays(-1);

                // Obtener usuarios que NO son cajeros (excluir roles de caja)
                var usuariosVendedores = await _context.Usuarios
                    .Include(u => u.Rols)
                    .Where(u => u.Activo == true && 
                               !u.Rols.Any(r => r.NombreRol.ToLower().Contains("cajero") || 
                                              r.NombreRol.ToLower().Contains("caja")))
                    .ToListAsync();

                var estadisticasVendedores = new List<object>();

                foreach (var usuario in usuariosVendedores)
                {
                    // Contar facturas creadas en el mes (excluyendo proformas)
                    var facturasCreadas = await _context.Facturas
                        .Where(f => f.UsuarioCreadorId == usuario.UsuarioId &&
                                   f.TipoDocumento == "Factura" &&
                                   f.Estado == "Pagada" &&
                                   f.FechaCreacion >= fechaInicioMes &&
                                   f.FechaCreacion <= fechaFinMes)
                        .ToListAsync();

                    if (facturasCreadas.Any())
                    {
                        var totalVentas = facturasCreadas.Sum(f => f.Total);
                        var cantidadFacturas = facturasCreadas.Count;

                        // Calcular score híbrido: 70% monto, 30% cantidad
                        var scoreVentas = (double)totalVentas * 0.7;
                        var scoreCantidad = cantidadFacturas * 1000 * 0.3; // Multiplicar por 1000 para equiparar escalas
                        var scoreTotal = scoreVentas + scoreCantidad;

                        estadisticasVendedores.Add(new
                        {
                            usuarioId = usuario.UsuarioId,
                            nombreUsuario = usuario.NombreUsuario,
                            totalVentas = totalVentas,
                            cantidadFacturas = cantidadFacturas,
                            scoreTotal = scoreTotal,
                            roles = usuario.Rols.Select(r => r.NombreRol).ToList()
                        });
                    }
                }

                // Obtener el top vendedor
                var topVendedor = estadisticasVendedores
                    .OrderByDescending(v => ((dynamic)v).scoreTotal)
                    .FirstOrDefault();

                if (topVendedor != null)
                {
                    var vendedor = (dynamic)topVendedor;
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            nombreVendedor = vendedor.nombreUsuario,
                            totalVentas = vendedor.totalVentas,
                            cantidadFacturas = vendedor.cantidadFacturas,
                            periodo = $"{fechaInicioMes:MMMM yyyy}",
                            mensaje = $"₡{vendedor.totalVentas:N0} en {vendedor.cantidadFacturas} ventas"
                        },
                        debug = new
                        {
                            fechaInicioMes = fechaInicioMes,
                            fechaFinMes = fechaFinMes,
                            usuariosEvaluados = usuariosVendedores.Count,
                            conVentas = estadisticasVendedores.Count,
                            topTres = estadisticasVendedores.Take(3)
                        },
                        timestamp = DateTime.Now
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            nombreVendedor = "Sin ventas",
                            totalVentas = 0,
                            cantidadFacturas = 0,
                            periodo = $"{fechaInicioMes:MMMM yyyy}",
                            mensaje = "No hay ventas este mes"
                        },
                        timestamp = DateTime.Now
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo top vendedor");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error al obtener top vendedor" 
                });
            }
        }
    }
}