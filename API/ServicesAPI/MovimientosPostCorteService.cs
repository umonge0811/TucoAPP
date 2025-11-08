using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using tuco.Clases.DTOs.Inventario;
using tuco.Clases.Models;

namespace API.ServicesAPI
{
    public class MovimientosPostCorteService : IMovimientosPostCorteService
    {
        private readonly TucoContext _context;
        private readonly ILogger<MovimientosPostCorteService> _logger;

        public MovimientosPostCorteService(TucoContext context, ILogger<MovimientosPostCorteService> _logger)
        {
            _context = context;
            this._logger = _logger;
        }

        public async Task<List<ResumenMovimientosPostCorteDTO>> ObtenerMovimientosPorInventarioAsync(int inventarioProgramadoId)
        {
            try
            {
                var movimientos = await _context.MovimientosPostCorte
                    .Where(m => m.InventarioProgramadoId == inventarioProgramadoId && !m.Procesado)
                    .Include(m => m.Producto)
                    .Include(m => m.UsuarioProcesado)
                    .ToListAsync();

                // Agrupar por producto
                var resumen = movimientos
                    .GroupBy(m => m.ProductoId)
                    .Select(g => new ResumenMovimientosPostCorteDTO
                    {
                        ProductoId = g.Key,
                        NombreProducto = g.First().Producto?.NombreProducto ?? "Producto desconocido",
                        TotalMovimientos = g.Sum(m => m.Cantidad),
                        CantidadVentas = g.Where(m => m.TipoMovimiento == "Venta").Sum(m => Math.Abs(m.Cantidad)),
                        CantidadDevoluciones = g.Where(m => m.TipoMovimiento == "Devolucion").Sum(m => m.Cantidad),
                        CantidadAjustes = g.Where(m => m.TipoMovimiento == "Ajuste").Sum(m => Math.Abs(m.Cantidad)),
                        CantidadTraspasos = g.Where(m => m.TipoMovimiento == "Traspaso").Sum(m => Math.Abs(m.Cantidad)),
                        UltimoMovimiento = g.Max(m => m.FechaMovimiento),
                        Detalles = g.Select(m => new MovimientoPostCorteDTO
                        {
                            MovimientoPostCorteId = m.MovimientoPostCorteId,
                            InventarioProgramadoId = m.InventarioProgramadoId,
                            ProductoId = m.ProductoId,
                            NombreProducto = m.Producto?.NombreProducto ?? "Producto desconocido",
                            TipoMovimiento = m.TipoMovimiento,
                            Cantidad = m.Cantidad,
                            DocumentoReferenciaId = m.DocumentoReferenciaId,
                            TipoDocumento = m.TipoDocumento,
                            FechaMovimiento = m.FechaMovimiento,
                            Procesado = m.Procesado,
                            FechaProcesado = m.FechaProcesado,
                            UsuarioProcesadoId = m.UsuarioProcesadoId,
                            NombreUsuarioProcesado = m.UsuarioProcesado?.NombreUsuario
                        }).ToList()
                    })
                    .ToList();

                return resumen;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo movimientos post-corte para inventario {InventarioId}", inventarioProgramadoId);
                throw;
            }
        }

        public async Task<ResumenMovimientosPostCorteDTO> ObtenerMovimientosPorProductoAsync(int inventarioProgramadoId, int productoId)
        {
            try
            {
                var movimientos = await _context.MovimientosPostCorte
                    .Where(m => m.InventarioProgramadoId == inventarioProgramadoId &&
                               m.ProductoId == productoId &&
                               !m.Procesado)
                    .Include(m => m.Producto)
                    .Include(m => m.UsuarioProcesado)
                    .ToListAsync();

                if (!movimientos.Any())
                {
                    return null;
                }

                var resumen = new ResumenMovimientosPostCorteDTO
                {
                    ProductoId = productoId,
                    NombreProducto = movimientos.First().Producto?.NombreProducto ?? "Producto desconocido",
                    TotalMovimientos = movimientos.Sum(m => m.Cantidad),
                    CantidadVentas = movimientos.Where(m => m.TipoMovimiento == "Venta").Sum(m => Math.Abs(m.Cantidad)),
                    CantidadDevoluciones = movimientos.Where(m => m.TipoMovimiento == "Devolucion").Sum(m => m.Cantidad),
                    CantidadAjustes = movimientos.Where(m => m.TipoMovimiento == "Ajuste").Sum(m => Math.Abs(m.Cantidad)),
                    CantidadTraspasos = movimientos.Where(m => m.TipoMovimiento == "Traspaso").Sum(m => Math.Abs(m.Cantidad)),
                    UltimoMovimiento = movimientos.Max(m => m.FechaMovimiento),
                    Detalles = movimientos.Select(m => new MovimientoPostCorteDTO
                    {
                        MovimientoPostCorteId = m.MovimientoPostCorteId,
                        InventarioProgramadoId = m.InventarioProgramadoId,
                        ProductoId = m.ProductoId,
                        NombreProducto = m.Producto?.NombreProducto ?? "Producto desconocido",
                        TipoMovimiento = m.TipoMovimiento,
                        Cantidad = m.Cantidad,
                        DocumentoReferenciaId = m.DocumentoReferenciaId,
                        TipoDocumento = m.TipoDocumento,
                        FechaMovimiento = m.FechaMovimiento,
                        Procesado = m.Procesado,
                        FechaProcesado = m.FechaProcesado,
                        UsuarioProcesadoId = m.UsuarioProcesadoId,
                        NombreUsuarioProcesado = m.UsuarioProcesado?.NombreUsuario
                    }).ToList()
                };

                return resumen;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo movimientos post-corte para producto {ProductoId} en inventario {InventarioId}",
                    productoId, inventarioProgramadoId);
                throw;
            }
        }

        public async Task<bool> RegistrarMovimientoAsync(int inventarioProgramadoId, int productoId, string tipoMovimiento,
            int cantidad, int? documentoReferenciaId = null, string tipoDocumento = null)
        {
            try
            {
                // Verificar que el inventario existe y está en progreso
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioProgramadoId);

                if (inventario == null || inventario.Estado != "En Progreso")
                {
                    _logger.LogWarning("Inventario {InventarioId} no existe o no está en progreso", inventarioProgramadoId);
                    return false;
                }

                // Crear el movimiento
                var movimiento = new MovimientoPostCorte
                {
                    InventarioProgramadoId = inventarioProgramadoId,
                    ProductoId = productoId,
                    TipoMovimiento = tipoMovimiento,
                    Cantidad = cantidad,
                    DocumentoReferenciaId = documentoReferenciaId,
                    TipoDocumento = tipoDocumento,
                    FechaMovimiento = DateTime.Now,
                    Procesado = false
                };

                _context.MovimientosPostCorte.Add(movimiento);

                // Actualizar el contador en DetalleInventarioProgramado
                var detalle = await _context.DetallesInventarioProgramado
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == inventarioProgramadoId &&
                                            d.ProductoId == productoId);

                if (detalle != null)
                {
                    // Calcular el total de movimientos no procesados
                    var totalMovimientos = await _context.MovimientosPostCorte
                        .Where(m => m.InventarioProgramadoId == inventarioProgramadoId &&
                                   m.ProductoId == productoId &&
                                   !m.Procesado)
                        .SumAsync(m => m.Cantidad);

                    detalle.MovimientosPostCorte = totalMovimientos + cantidad;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Movimiento post-corte registrado: {TipoMovimiento} de {Cantidad} unidades para producto {ProductoId}",
                    tipoMovimiento, cantidad, productoId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registrando movimiento post-corte");
                return false;
            }
        }

        public async Task<ResultadoActualizacionDTO> ActualizarLineaAsync(ActualizarLineaInventarioDTO solicitud)
        {
            try
            {
                var resultado = new ResultadoActualizacionDTO();

                // Obtener el detalle del inventario
                var detalle = await _context.DetallesInventarioProgramado
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == solicitud.InventarioProgramadoId &&
                                            d.ProductoId == solicitud.ProductoId);

                if (detalle == null)
                {
                    resultado.Exito = false;
                    resultado.Mensaje = "Detalle de inventario no encontrado";
                    return resultado;
                }

                // Obtener movimientos pendientes
                var movimientos = await _context.MovimientosPostCorte
                    .Where(m => m.InventarioProgramadoId == solicitud.InventarioProgramadoId &&
                               m.ProductoId == solicitud.ProductoId &&
                               !m.Procesado)
                    .ToListAsync();

                if (!movimientos.Any())
                {
                    resultado.Exito = false;
                    resultado.Mensaje = "No hay movimientos pendientes para este producto";
                    return resultado;
                }

                // Calcular el total de movimientos
                var totalMovimientos = movimientos.Sum(m => m.Cantidad);

                // Actualizar la cantidad del sistema
                detalle.CantidadSistema += totalMovimientos;

                // Si ya fue contado, recalcular la diferencia
                if (detalle.CantidadFisica.HasValue)
                {
                    detalle.Diferencia = detalle.CantidadFisica.Value - detalle.CantidadSistema;
                }

                // Marcar movimientos como procesados
                foreach (var movimiento in movimientos)
                {
                    movimiento.Procesado = true;
                    movimiento.FechaProcesado = DateTime.Now;
                    movimiento.UsuarioProcesadoId = solicitud.UsuarioId;
                }

                // Actualizar información de tracking
                detalle.MovimientosPostCorte = 0; // Ya no hay movimientos pendientes
                detalle.UltimaActualizacion = DateTime.Now;
                detalle.UsuarioActualizacionId = solicitud.UsuarioId;

                await _context.SaveChangesAsync();

                resultado.Exito = true;
                resultado.Mensaje = "Línea actualizada correctamente";
                resultado.LineasActualizadas = 1;
                resultado.MovimientosProcesados = movimientos.Count;

                _logger.LogInformation("Línea actualizada: Producto {ProductoId}, Movimientos: {Total}",
                    solicitud.ProductoId, totalMovimientos);

                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando línea de inventario");
                return new ResultadoActualizacionDTO
                {
                    Exito = false,
                    Mensaje = "Error al actualizar la línea",
                    Errores = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ResultadoActualizacionDTO> ActualizarLineasMasivaAsync(ActualizarLineasMasivaDTO solicitud)
        {
            try
            {
                var resultado = new ResultadoActualizacionDTO();
                var productosActualizados = new List<int>();
                var totalMovimientos = 0;

                // Obtener productos con movimientos pendientes
                IQueryable<MovimientoPostCorte> query = _context.MovimientosPostCorte
                    .Where(m => m.InventarioProgramadoId == solicitud.InventarioProgramadoId && !m.Procesado);

                // Si se especificaron productos específicos, filtrar
                if (solicitud.ProductoIds != null && solicitud.ProductoIds.Any())
                {
                    query = query.Where(m => solicitud.ProductoIds.Contains(m.ProductoId));
                }

                var productosConMovimientos = await query
                    .Select(m => m.ProductoId)
                    .Distinct()
                    .ToListAsync();

                // Actualizar cada producto
                foreach (var productoId in productosConMovimientos)
                {
                    var solicitudIndividual = new ActualizarLineaInventarioDTO
                    {
                        InventarioProgramadoId = solicitud.InventarioProgramadoId,
                        ProductoId = productoId,
                        UsuarioId = solicitud.UsuarioId
                    };

                    var resultadoIndividual = await ActualizarLineaAsync(solicitudIndividual);

                    if (resultadoIndividual.Exito)
                    {
                        productosActualizados.Add(productoId);
                        totalMovimientos += resultadoIndividual.MovimientosProcesados;
                    }
                    else
                    {
                        resultado.Errores.Add($"Producto {productoId}: {resultadoIndividual.Mensaje}");
                    }
                }

                resultado.Exito = productosActualizados.Any();
                resultado.LineasActualizadas = productosActualizados.Count;
                resultado.MovimientosProcesados = totalMovimientos;
                resultado.Mensaje = $"{productosActualizados.Count} líneas actualizadas correctamente";

                if (resultado.Errores.Any())
                {
                    resultado.Mensaje += $" ({resultado.Errores.Count} errores)";
                }

                _logger.LogInformation("Actualización masiva completada: {LineasActualizadas} líneas, {MovimientosProcesados} movimientos",
                    resultado.LineasActualizadas, resultado.MovimientosProcesados);

                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en actualización masiva de líneas");
                return new ResultadoActualizacionDTO
                {
                    Exito = false,
                    Mensaje = "Error en la actualización masiva",
                    Errores = new List<string> { ex.Message }
                };
            }
        }

        public async Task<List<int>> ObtenerInventariosEnProgresoConProductoAsync(int productoId)
        {
            try
            {
                _logger.LogInformation("🔍 === BUSCANDO INVENTARIOS EN PROGRESO PARA PRODUCTO {ProductoId} ===", productoId);

                // Primero verificar si hay inventarios en progreso
                var inventariosEnProgreso = await _context.InventariosProgramados
                    .Where(i => i.Estado == "En Progreso")
                    .ToListAsync();

                _logger.LogInformation("📋 Inventarios en estado 'En Progreso': {Count}", inventariosEnProgreso.Count);

                if (!inventariosEnProgreso.Any())
                {
                    _logger.LogWarning("⚠️ No hay inventarios en estado 'En Progreso'");
                    return new List<int>();
                }

                // Verificar detalles para cada inventario
                var resultados = new List<int>();
                foreach (var inv in inventariosEnProgreso)
                {
                    var tieneProducto = await _context.DetallesInventarioProgramado
                        .AnyAsync(d => d.InventarioProgramadoId == inv.InventarioProgramadoId &&
                                      d.ProductoId == productoId);

                    _logger.LogInformation("📦 Inventario '{Titulo}' (ID: {Id}): {TieneProducto}",
                        inv.Titulo, inv.InventarioProgramadoId, tieneProducto ? "SÍ tiene el producto" : "NO tiene el producto");

                    if (tieneProducto)
                    {
                        resultados.Add(inv.InventarioProgramadoId);
                    }
                }

                _logger.LogInformation("✅ Encontrados {Count} inventarios en progreso con el producto {ProductoId}",
                    resultados.Count, productoId);

                return resultados;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo inventarios en progreso para producto {ProductoId}", productoId);
                return new List<int>();
            }
        }
    }
}
