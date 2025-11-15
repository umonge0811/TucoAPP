using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using tuco.Clases.DTOs.Inventario;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MovimientosPostCorteController : ControllerBase
    {
        private readonly IMovimientosPostCorteService _movimientosService;
        private readonly ILogger<MovimientosPostCorteController> _logger;

        public MovimientosPostCorteController(
            IMovimientosPostCorteService movimientosService,
            ILogger<MovimientosPostCorteController> logger)
        {
            _movimientosService = movimientosService;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todos los movimientos post-corte de un inventario agrupados por producto
        /// GET: api/MovimientosPostCorte/inventario/5
        /// </summary>
        [HttpGet("inventario/{inventarioProgramadoId}")]
        public async Task<IActionResult> ObtenerMovimientosPorInventario(int inventarioProgramadoId)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo movimientos post-corte para inventario {InventarioId}", inventarioProgramadoId);

                var movimientos = await _movimientosService.ObtenerMovimientosPorInventarioAsync(inventarioProgramadoId);

                return Ok(new
                {
                    success = true,
                    data = movimientos,
                    total = movimientos.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo movimientos post-corte para inventario {InventarioId}", inventarioProgramadoId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener movimientos post-corte"
                });
            }
        }

        /// <summary>
        /// Obtiene los movimientos post-corte de un producto específico en un inventario
        /// GET: api/MovimientosPostCorte/inventario/5/producto/123
        /// </summary>
        [HttpGet("inventario/{inventarioProgramadoId}/producto/{productoId}")]
        public async Task<IActionResult> ObtenerMovimientosPorProducto(int inventarioProgramadoId, int productoId)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo movimientos post-corte para producto {ProductoId} en inventario {InventarioId}",
                    productoId, inventarioProgramadoId);

                var movimientos = await _movimientosService.ObtenerMovimientosPorProductoAsync(inventarioProgramadoId, productoId);

                if (movimientos == null)
                {
                    return Ok(new
                    {
                        success = true,
                        data = (object)null,
                        message = "No hay movimientos post-corte para este producto"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = movimientos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo movimientos post-corte para producto {ProductoId}", productoId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener movimientos post-corte"
                });
            }
        }

        /// <summary>
        /// Actualiza una línea de inventario procesando sus movimientos post-corte
        /// POST: api/MovimientosPostCorte/actualizar-linea
        /// </summary>
        [HttpPost("actualizar-linea")]
        public async Task<IActionResult> ActualizarLinea([FromBody] ActualizarLineaInventarioDTO solicitud)
        {
            try
            {
                _logger.LogInformation("🔄 Actualizando línea de inventario: Producto {ProductoId} en Inventario {InventarioId}",
                    solicitud.ProductoId, solicitud.InventarioProgramadoId);

                var resultado = await _movimientosService.ActualizarLineaAsync(solicitud);

                if (resultado.Exito)
                {
                    return Ok(new
                    {
                        success = true,
                        message = resultado.Mensaje,
                        data = new
                        {
                            lineasActualizadas = resultado.LineasActualizadas,
                            movimientosProcesados = resultado.MovimientosProcesados
                        }
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = resultado.Mensaje,
                        errores = resultado.Errores
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando línea de inventario");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar la línea de inventario"
                });
            }
        }

        /// <summary>
        /// Actualiza todas las líneas con movimientos post-corte pendientes
        /// POST: api/MovimientosPostCorte/actualizar-masivo
        /// </summary>
        [HttpPost("actualizar-masivo")]
        public async Task<IActionResult> ActualizarLineasMasivo([FromBody] ActualizarLineasMasivaDTO solicitud)
        {
            try
            {
                _logger.LogInformation("🔄 Actualizando líneas masivamente para inventario {InventarioId}", solicitud.InventarioProgramadoId);

                var resultado = await _movimientosService.ActualizarLineasMasivaAsync(solicitud);

                if (resultado.Exito)
                {
                    return Ok(new
                    {
                        success = true,
                        message = resultado.Mensaje,
                        data = new
                        {
                            lineasActualizadas = resultado.LineasActualizadas,
                            movimientosProcesados = resultado.MovimientosProcesados,
                            errores = resultado.Errores
                        }
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = resultado.Mensaje,
                        errores = resultado.Errores
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en actualización masiva de líneas");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error en la actualización masiva"
                });
            }
        }

        /// <summary>
        /// Obtiene los inventarios en progreso que contienen un producto específico
        /// GET: api/MovimientosPostCorte/inventarios-activos/producto/123
        /// </summary>
        [HttpGet("inventarios-activos/producto/{productoId}")]
        public async Task<IActionResult> ObtenerInventariosActivosConProducto(int productoId)
        {
            try
            {
                var inventarios = await _movimientosService.ObtenerInventariosEnProgresoConProductoAsync(productoId);

                return Ok(new
                {
                    success = true,
                    data = inventarios,
                    total = inventarios.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo inventarios activos para producto {ProductoId}", productoId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener inventarios activos"
                });
            }
        }
    }
}
