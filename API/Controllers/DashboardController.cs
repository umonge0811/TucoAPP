
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using API.Data;

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

        /// <summary>
        /// Obtiene el top vendedor del mes actual
        /// </summary>
        [HttpGet("top-vendedor")]
        public async Task<IActionResult> ObtenerTopVendedor()
        {
            try
            {
                var fechaInicioMes = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
                var fechaFinMes = fechaInicioMes.AddMonths(1).AddDays(-1);

                var topVendedor = await _context.Facturas
                    .Include(f => f.Usuario)
                    .Where(f => f.FechaCreacion >= fechaInicioMes && 
                               f.FechaCreacion <= fechaFinMes &&
                               f.Estado != "Cancelada")
                    .GroupBy(f => new { f.UsuarioId, f.Usuario.Nombre })
                    .Select(g => new
                    {
                        UsuarioId = g.Key.UsuarioId,
                        Nombre = g.Key.Nombre,
                        TotalVentas = g.Sum(f => f.Total ?? 0),
                        CantidadFacturas = g.Count()
                    })
                    .OrderByDescending(x => x.TotalVentas)
                    .FirstOrDefaultAsync();

                if (topVendedor == null)
                {
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            nombre = "Sin ventas",
                            totalVentas = 0m,
                            cantidadFacturas = 0
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        nombre = topVendedor.Nombre,
                        totalVentas = topVendedor.TotalVentas,
                        cantidadFacturas = topVendedor.CantidadFacturas
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener top vendedor");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }
    }
}
