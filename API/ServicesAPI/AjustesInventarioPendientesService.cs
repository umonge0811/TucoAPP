using API.Data;
using API.ServiceAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;

namespace API.ServiceAPI
{
    public class AjustesInventarioPendientesService : IAjustesInventarioPendientesService
    {
        private readonly TucoContext _context;
        private readonly ILogger<AjustesInventarioPendientesService> _logger;

        public AjustesInventarioPendientesService(
            TucoContext context,
            ILogger<AjustesInventarioPendientesService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CrearAjustePendienteAsync(SolicitudAjusteInventarioDTO solicitud)
        {
            try
            {
                _logger.LogInformation("🆕 Creando ajuste pendiente para producto {ProductoId}", solicitud.ProductoId);

                // ✅ VALIDAR QUE EL INVENTARIO ESTÉ EN PROGRESO
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == solicitud.InventarioProgramadoId);

                if (inventario == null)
                {
                    throw new ArgumentException("Inventario no encontrado");
                }

                if (inventario.Estado != "En Progreso")
                {
                    throw new InvalidOperationException("Solo se pueden crear ajustes en inventarios en progreso");
                }

                // ✅ DETERMINAR LA CANTIDAD FINAL SEGÚN EL TIPO DE AJUSTE
                int cantidadFinalPropuesta = solicitud.TipoAjuste.ToLower() switch
                {
                    "sistema_a_fisico" => solicitud.CantidadFinalPropuesta ?? solicitud.CantidadFisicaContada,
                    "reconteo" => solicitud.CantidadSistemaOriginal, // No cambia hasta recontar
                    "validado" => solicitud.CantidadSistemaOriginal, // Se acepta la discrepancia
                    _ => throw new ArgumentException("Tipo de ajuste no válido")
                };

                // ✅ CREAR EL AJUSTE
                var ajuste = new AjusteInventarioPendiente
                {
                    InventarioProgramadoId = solicitud.InventarioProgramadoId,
                    ProductoId = solicitud.ProductoId,
                    TipoAjuste = solicitud.TipoAjuste.ToLower(),
                    CantidadSistemaOriginal = solicitud.CantidadSistemaOriginal,
                    CantidadFisicaContada = solicitud.CantidadFisicaContada,
                    CantidadFinalPropuesta = cantidadFinalPropuesta,
                    MotivoAjuste = solicitud.MotivoAjuste,
                    UsuarioId = solicitud.UsuarioId,
                    FechaCreacion = DateTime.Now,
                    Estado = "Pendiente"
                };

                _context.AjustesInventarioPendientes.Add(ajuste);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Ajuste pendiente creado con ID {AjusteId}", ajuste.AjusteId);
                return ajuste.AjusteId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear ajuste pendiente");
                throw;
            }
        }

        public async Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorInventarioAsync(int inventarioProgramadoId)
        {
            try
            {
                var ajustes = await _context.AjustesInventarioPendientes
                    .Include(a => a.Producto)
                    .Include(a => a.Usuario)
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId)
                    .OrderByDescending(a => a.FechaCreacion)
                    .Select(a => new AjusteInventarioPendienteDTO
                    {
                        AjusteId = a.AjusteId,
                        InventarioProgramadoId = a.InventarioProgramadoId,
                        ProductoId = a.ProductoId,
                        TipoAjuste = a.TipoAjuste,
                        CantidadSistemaOriginal = a.CantidadSistemaOriginal,
                        CantidadFisicaContada = a.CantidadFisicaContada,
                        CantidadFinalPropuesta = a.CantidadFinalPropuesta,
                        MotivoAjuste = a.MotivoAjuste,
                        UsuarioId = a.UsuarioId,
                        FechaCreacion = a.FechaCreacion,
                        Estado = a.Estado,
                        FechaAplicacion = a.FechaAplicacion,
                        NombreProducto = a.Producto != null ? a.Producto.NombreProducto : "Sin nombre",
                        NombreUsuario = a.Usuario != null ? a.Usuario.NombreUsuario : "Sin usuario"
                    })
                    .ToListAsync();

                return ajustes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ajustes por inventario {InventarioId}", inventarioProgramadoId);
                throw;
            }
        }

        public async Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorProductoAsync(int inventarioProgramadoId, int productoId)
        {
            try
            {
                var ajustes = await _context.AjustesInventarioPendientes
                    .Include(a => a.Usuario)
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId && a.ProductoId == productoId)
                    .OrderByDescending(a => a.FechaCreacion)
                    .Select(a => new AjusteInventarioPendienteDTO
                    {
                        AjusteId = a.AjusteId,
                        InventarioProgramadoId = a.InventarioProgramadoId,
                        ProductoId = a.ProductoId,
                        TipoAjuste = a.TipoAjuste,
                        CantidadSistemaOriginal = a.CantidadSistemaOriginal,
                        CantidadFisicaContada = a.CantidadFisicaContada,
                        CantidadFinalPropuesta = a.CantidadFinalPropuesta,
                        MotivoAjuste = a.MotivoAjuste,
                        UsuarioId = a.UsuarioId,
                        FechaCreacion = a.FechaCreacion,
                        Estado = a.Estado,
                        FechaAplicacion = a.FechaAplicacion,
                        NombreUsuario = a.Usuario != null ? a.Usuario.NombreUsuario : "Sin usuario"
                    })
                    .ToListAsync();

                return ajustes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener ajustes por producto {ProductoId}", productoId);
                throw;
            }
        }

        public async Task<bool> ActualizarEstadoAjusteAsync(int ajusteId, string nuevoEstado, DateTime? fechaAplicacion = null)
        {
            try
            {
                var ajuste = await _context.AjustesInventarioPendientes.FindAsync(ajusteId);
                if (ajuste == null)
                {
                    _logger.LogWarning("Ajuste {AjusteId} no encontrado", ajusteId);
                    return false;
                }

                ajuste.Estado = nuevoEstado;
                if (fechaAplicacion.HasValue)
                {
                    ajuste.FechaAplicacion = fechaAplicacion.Value;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Estado del ajuste {AjusteId} actualizado a {Estado}", ajusteId, nuevoEstado);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar estado del ajuste {AjusteId}", ajusteId);
                throw;
            }
        }

        public async Task<bool> EliminarAjustePendienteAsync(int ajusteId)
        {
            try
            {
                var ajuste = await _context.AjustesInventarioPendientes.FindAsync(ajusteId);
                if (ajuste == null)
                {
                    _logger.LogWarning("Ajuste {AjusteId} no encontrado para eliminar", ajusteId);
                    return false;
                }

                if (ajuste.Estado == "Aplicado")
                {
                    _logger.LogWarning("No se puede eliminar el ajuste {AjusteId} porque ya fue aplicado", ajusteId);
                    return false;
                }

                _context.AjustesInventarioPendientes.Remove(ajuste);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Ajuste {AjusteId} eliminado exitosamente", ajusteId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar ajuste {AjusteId}", ajusteId);
                throw;
            }
        }

        public async Task<bool> AplicarAjustesPendientesAsync(int inventarioProgramadoId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("🔄 Aplicando ajustes pendientes para inventario {InventarioId}", inventarioProgramadoId);

                // ✅ OBTENER AJUSTES PENDIENTES DEL TIPO "sistema_a_fisico"
                var ajustesParaAplicar = await _context.AjustesInventarioPendientes
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId
                               && a.Estado == "Pendiente"
                               && a.TipoAjuste == "sistema_a_fisico")
                    .ToListAsync();

                _logger.LogInformation("📊 Se encontraron {Count} ajustes para aplicar", ajustesParaAplicar.Count);

                foreach (var ajuste in ajustesParaAplicar)
                {
                    // ✅ ACTUALIZAR EL STOCK DEL PRODUCTO
                    var producto = await _context.Productos.FindAsync(ajuste.ProductoId);
                    if (producto != null)
                    {
                        var stockAnterior = producto.CantidadEnInventario;
                        producto.CantidadEnInventario = ajuste.CantidadFinalPropuesta;
                        producto.FechaUltimaActualizacion = DateTime.Now;

                        _logger.LogInformation("📦 Producto {ProductoId}: {StockAnterior} → {StockNuevo}",
                            ajuste.ProductoId, stockAnterior, ajuste.CantidadFinalPropuesta);
                    }

                    // ✅ MARCAR EL AJUSTE COMO APLICADO
                    ajuste.Estado = "Aplicado";
                    ajuste.FechaAplicacion = DateTime.Now;
                }

                // ✅ MARCAR OTROS TIPOS COMO "PROCESADO" (sin aplicar al stock)
                var otrosAjustes = await _context.AjustesInventarioPendientes
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId
                               && a.Estado == "Pendiente"
                               && a.TipoAjuste != "sistema_a_fisico")
                    .ToListAsync();

                foreach (var ajuste in otrosAjustes)
                {
                    ajuste.Estado = "Procesado";
                    ajuste.FechaAplicacion = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Ajustes aplicados exitosamente. Aplicados: {Aplicados}, Procesados: {Procesados}",
                    ajustesParaAplicar.Count, otrosAjustes.Count);

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ Error al aplicar ajustes pendientes");
                throw;
            }
        }

        public async Task<bool> TieneAjustesPendientesAsync(int inventarioProgramadoId, int productoId)
        {
            try
            {
                return await _context.AjustesInventarioPendientes
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioProgramadoId
                              && a.ProductoId == productoId
                              && a.Estado == "Pendiente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar ajustes pendientes");
                throw;
            }
        }

        public async Task<object> ObtenerResumenAjustesAsync(int inventarioProgramadoId)
        {
            try
            {
                var resumen = await _context.AjustesInventarioPendientes
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId)
                    .GroupBy(a => a.Estado)
                    .Select(g => new { Estado = g.Key, Cantidad = g.Count() })
                    .ToListAsync();

                var ajustesStock = await _context.AjustesInventarioPendientes
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId && a.TipoAjuste == "sistema_a_fisico")
                    .SumAsync(a => a.CantidadFinalPropuesta - a.CantidadSistemaOriginal);

                return new
                {
                    ResumenPorEstado = resumen,
                    TotalAjustesStock = ajustesStock,
                    FechaGeneracion = DateTime.Now
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener resumen de ajustes");
                throw;
            }
        }
    }
}