using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;

namespace API.ServicesAPI
{
    /// <summary>
    /// Servicio para gestión de ajustes pendientes durante la toma de inventario
    /// Los ajustes NO se aplican inmediatamente al stock real
    /// </summary>
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

        /// <summary>
        /// Crea un nuevo ajuste pendiente sin tocar el stock real
        /// </summary>
        public async Task<int> CrearAjustePendienteAsync(SolicitudAjusteInventarioDTO solicitud)
        {
            try
            {
                _logger.LogInformation("📝 === CREANDO AJUSTE PENDIENTE ===");
                _logger.LogInformation("📝 Inventario: {InventarioId}, Producto: {ProductoId}, Tipo: {Tipo}",
                    solicitud.InventarioProgramadoId, solicitud.ProductoId, solicitud.TipoAjuste);

                // ✅ VALIDAR LA SOLICITUD
                var (esValido, mensajeValidacion) = await ValidarAjusteAsync(solicitud, null);
                if (!esValido)
                {
                    throw new ArgumentException($"Ajuste no válido: {mensajeValidacion}");
                }

                // ✅ VERIFICAR QUE EL INVENTARIO ESTÉ EN PROGRESO
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == solicitud.InventarioProgramadoId);

                if (inventario == null)
                {
                    throw new InvalidOperationException("Inventario no encontrado");
                }

                if (inventario.Estado != "En Progreso")
                {
                    throw new InvalidOperationException($"No se pueden crear ajustes en un inventario en estado '{inventario.Estado}'");
                }

                // ✅ VERIFICAR QUE EL PRODUCTO EXISTE EN EL INVENTARIO
                var detalleInventario = await _context.DetallesInventarioProgramado
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == solicitud.InventarioProgramadoId &&
                                             d.ProductoId == solicitud.ProductoId);

                if (detalleInventario == null)
                {
                    throw new InvalidOperationException("El producto no pertenece a este inventario");
                }

                // ✅ DETERMINAR LA CANTIDAD FINAL PROPUESTA
                int cantidadFinalPropuesta = solicitud.CantidadFinalPropuesta ?? solicitud.CantidadFisicaContada;

                // ✅ CREAR EL AJUSTE PENDIENTE
                var ajustePendiente = new AjusteInventarioPendiente
                {
                    InventarioProgramadoId = solicitud.InventarioProgramadoId,
                    ProductoId = solicitud.ProductoId,
                    TipoAjuste = solicitud.TipoAjuste,
                    CantidadSistemaOriginal = solicitud.CantidadSistemaOriginal,
                    CantidadFisicaContada = solicitud.CantidadFisicaContada,
                    CantidadFinalPropuesta = cantidadFinalPropuesta,
                    MotivoAjuste = solicitud.MotivoAjuste,
                    UsuarioId = solicitud.UsuarioId,
                    FechaCreacion = DateTime.Now,
                    Estado = "Pendiente"
                };

                _context.AjustesInventarioPendientes.Add(ajustePendiente);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Ajuste pendiente creado con ID: {AjusteId}", ajustePendiente.AjusteId);

                return ajustePendiente.AjusteId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando ajuste pendiente");
                throw;
            }
        }

        /// <summary>
        /// Actualiza un ajuste pendiente existente (solo si está en estado Pendiente)
        /// </summary>
        public async Task<bool> ActualizarAjustePendienteAsync(int ajusteId, SolicitudAjusteInventarioDTO solicitud)
        {
            try
            {
                _logger.LogInformation("✏️ === ACTUALIZANDO AJUSTE PENDIENTE ===");
                _logger.LogInformation("✏️ Ajuste ID: {AjusteId}, Producto: {ProductoId}, Nuevo Tipo: {Tipo}",
                    ajusteId, solicitud.ProductoId, solicitud.TipoAjuste);

                // ✅ BUSCAR EL AJUSTE EXISTENTE
                var ajusteExistente = await _context.AjustesInventarioPendientes
                    .FirstOrDefaultAsync(a => a.AjusteId == ajusteId);

                if (ajusteExistente == null)
                {
                    _logger.LogWarning("⚠️ Ajuste {AjusteId} no encontrado para actualizar", ajusteId);
                    return false;
                }

                // ✅ VERIFICAR QUE ESTÉ EN ESTADO PENDIENTE
                if (ajusteExistente.Estado != "Pendiente")
                {
                    _logger.LogWarning("⚠️ No se puede actualizar ajuste {AjusteId} en estado {Estado}",
                        ajusteId, ajusteExistente.Estado);
                    throw new InvalidOperationException($"No se puede actualizar un ajuste en estado '{ajusteExistente.Estado}'");
                }

                // ✅ VERIFICAR QUE PERTENECE AL MISMO INVENTARIO Y PRODUCTO
                if (ajusteExistente.InventarioProgramadoId != solicitud.InventarioProgramadoId ||
                    ajusteExistente.ProductoId != solicitud.ProductoId)
                {
                    throw new InvalidOperationException("El ajuste no corresponde al inventario o producto especificado");
                }

                // ✅ VALIDAR LA NUEVA SOLICITUD
                // ✅ LÍNEA CORREGIDA (excluye el ajuste actual)
                var (esValido, mensajeValidacion) = await ValidarAjusteAsync(solicitud, ajusteId);
                if (!esValido)
                {
                    throw new ArgumentException($"Ajuste actualizado no válido: {mensajeValidacion}");
                }

                // ✅ VERIFICAR QUE EL INVENTARIO SIGA EN PROGRESO
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == solicitud.InventarioProgramadoId);

                if (inventario == null || inventario.Estado != "En Progreso")
                {
                    throw new InvalidOperationException($"No se pueden actualizar ajustes en un inventario en estado '{inventario?.Estado ?? "NULL"}'");
                }

                // ✅ DETERMINAR LA NUEVA CANTIDAD FINAL PROPUESTA
                int cantidadFinalPropuesta = solicitud.CantidadFinalPropuesta ?? solicitud.CantidadFisicaContada;

                // ✅ REGISTRAR CAMBIOS EN LOG
                _logger.LogInformation("📝 Cambios detectados:");
                if (ajusteExistente.TipoAjuste != solicitud.TipoAjuste)
                {
                    _logger.LogInformation("📝 Tipo: {TipoAnterior} → {TipoNuevo}",
                        ajusteExistente.TipoAjuste, solicitud.TipoAjuste);
                }
                if (ajusteExistente.CantidadFinalPropuesta != cantidadFinalPropuesta)
                {
                    _logger.LogInformation("📝 Cantidad Final: {CantidadAnterior} → {CantidadNueva}",
                        ajusteExistente.CantidadFinalPropuesta, cantidadFinalPropuesta);
                }
                if (ajusteExistente.MotivoAjuste != solicitud.MotivoAjuste)
                {
                    _logger.LogInformation("📝 Motivo actualizado: {MotivoNuevo}", solicitud.MotivoAjuste);
                }

                // ✅ ACTUALIZAR EL AJUSTE EXISTENTE
                ajusteExistente.TipoAjuste = solicitud.TipoAjuste;
                ajusteExistente.CantidadSistemaOriginal = solicitud.CantidadSistemaOriginal; // Actualizar por si cambió
                ajusteExistente.CantidadFisicaContada = solicitud.CantidadFisicaContada; // Actualizar por si cambió
                ajusteExistente.CantidadFinalPropuesta = cantidadFinalPropuesta;
                ajusteExistente.MotivoAjuste = solicitud.MotivoAjuste;
                ajusteExistente.UsuarioId = solicitud.UsuarioId; // Usuario que hace la actualización
                                                                 // NO cambiar FechaCreacion, pero podrías agregar FechaModificacion si quieres

                // ✅ GUARDAR CAMBIOS
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Ajuste {AjusteId} actualizado correctamente", ajusteId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando ajuste pendiente {AjusteId}", ajusteId);
                throw; // Re-lanzar para que el controlador maneje el error
            }
        }

        /// <summary>
        /// Obtiene todos los ajustes pendientes de un inventario
        /// </summary>
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
                        NombreProducto = a.Producto != null ? a.Producto.NombreProducto : "Producto desconocido",
                        NombreUsuario = a.Usuario != null ? a.Usuario.NombreUsuario : "Usuario desconocido"
                    })
                    .ToListAsync();

                _logger.LogInformation("📋 Obtenidos {Count} ajustes para inventario {InventarioId}",
                    ajustes.Count, inventarioProgramadoId);

                return ajustes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo ajustes del inventario {InventarioId}", inventarioProgramadoId);
                throw;
            }
        }

        /// <summary>
        /// Obtiene ajustes pendientes de un producto específico
        /// </summary>
        public async Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPorProductoAsync(int inventarioProgramadoId, int productoId)
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
                    NombreUsuario = a.Usuario != null ? a.Usuario.NombreUsuario : "Usuario desconocido"
                })
                .ToListAsync();

            return ajustes;
        }

        /// <summary>
        /// Verifica si un producto tiene ajustes pendientes
        /// </summary>
        public async Task<bool> TieneAjustesPendientesAsync(int inventarioProgramadoId, int productoId)
        {
            return await _context.AjustesInventarioPendientes
                .AnyAsync(a => a.InventarioProgramadoId == inventarioProgramadoId &&
                              a.ProductoId == productoId &&
                              a.Estado == "Pendiente");
        }

        /// <summary>
        /// Elimina un ajuste pendiente (solo si está en estado Pendiente)
        /// </summary>
        public async Task<bool> EliminarAjustePendienteAsync(int ajusteId)
        {
            try
            {
                var ajuste = await _context.AjustesInventarioPendientes
                    .FirstOrDefaultAsync(a => a.AjusteId == ajusteId);

                if (ajuste == null)
                {
                    _logger.LogWarning("⚠️ Ajuste {AjusteId} no encontrado para eliminar", ajusteId);
                    return false;
                }

                if (ajuste.Estado != "Pendiente")
                {
                    _logger.LogWarning("⚠️ No se puede eliminar ajuste {AjusteId} en estado {Estado}",
                        ajusteId, ajuste.Estado);
                    return false;
                }

                _context.AjustesInventarioPendientes.Remove(ajuste);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Ajuste {AjusteId} eliminado correctamente", ajusteId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando ajuste {AjusteId}", ajusteId);
                return false;
            }
        }

        /// <summary>
        /// Obtiene resumen de ajustes de un inventario
        /// </summary>
        public async Task<ResumenAjustesInventarioDTO> ObtenerResumenAjustesAsync(int inventarioProgramadoId)
        {
            try
            {
                _logger.LogInformation("📊 Generando resumen de ajustes para inventario {InventarioId}",
                    inventarioProgramadoId);

                // Obtener inventario
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioProgramadoId);

                if (inventario == null)
                {
                    throw new InvalidOperationException("Inventario no encontrado");
                }

                // Obtener todos los ajustes
                var ajustes = await ObtenerAjustesPorInventarioAsync(inventarioProgramadoId);

                // Calcular estadísticas
                var ajustesPendientes = ajustes.Where(a => a.Estado == "Pendiente").ToList();
                var ajustesAplicados = ajustes.Where(a => a.Estado == "Aplicado").ToList();
                var ajustesRechazados = ajustes.Where(a => a.Estado == "Rechazado").ToList();

                var resumen = new ResumenAjustesInventarioDTO
                {
                    InventarioProgramadoId = inventarioProgramadoId,
                    TituloInventario = inventario.Titulo,
                    TotalAjustesPendientes = ajustesPendientes.Count,
                    AjustesAplicados = ajustesAplicados.Count,
                    AjustesRechazados = ajustesRechazados.Count,
                    ProductosConAjustes = ajustes.Select(a => a.ProductoId).Distinct().Count(),

                    // Clasificación por tipo
                    AjustesSistemaAFisico = ajustes.Count(a => a.TipoAjuste == "sistema_a_fisico"),
                    AjustesReconteo = ajustes.Count(a => a.TipoAjuste == "reconteo"),
                    AjustesValidados = ajustes.Count(a => a.TipoAjuste == "validado"),

                    // Impacto en stock
                    TotalUnidadesAumento = ajustesPendientes.Where(a => a.CantidadAjuste > 0).Sum(a => a.CantidadAjuste),
                    TotalUnidadesDisminucion = Math.Abs(ajustesPendientes.Where(a => a.CantidadAjuste < 0).Sum(a => a.CantidadAjuste)),
                    ImpactoNetoUnidades = ajustesPendientes.Sum(a => a.CantidadAjuste),

                    // Información temporal
                    FechaUltimaActualizacion = ajustes.Any() ? ajustes.Max(a => a.FechaCreacion) : null,
                    FechaPrimerAjuste = ajustes.Any() ? ajustes.Min(a => a.FechaCreacion) : null,

                    AjustesPendientes = ajustesPendientes,
                    ListoParaAplicar = ajustesPendientes.Any() && !ajustesPendientes.Any(a => a.TipoAjuste == "reconteo")
                };

                // Generar alertas
                GenerarAlertasYRecomendaciones(resumen, ajustesPendientes);

                return resumen;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando resumen de ajustes");
                throw;
            }
        }

        /// <summary>
        /// MÉTODO CRÍTICO: Aplica todos los ajustes pendientes al stock real
        /// </summary>
        public async Task<bool> AplicarAjustesPendientesAsync(int inventarioProgramadoId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _logger.LogInformation("🔥 === OPERACIÓN CRÍTICA: APLICANDO AJUSTES AL STOCK REAL ===");
                _logger.LogInformation("🔥 Inventario ID: {InventarioId}", inventarioProgramadoId);

                // Obtener ajustes pendientes
                var ajustesPendientes = await _context.AjustesInventarioPendientes
                    .Where(a => a.InventarioProgramadoId == inventarioProgramadoId && a.Estado == "Pendiente")
                    .Include(a => a.Producto)
                    .ToListAsync();

                if (!ajustesPendientes.Any())
                {
                    _logger.LogInformation("ℹ️ No hay ajustes pendientes para aplicar");
                    await transaction.CommitAsync();
                    return true;
                }

                _logger.LogInformation("📊 Aplicando {Count} ajustes pendientes", ajustesPendientes.Count);

                // Aplicar cada ajuste al stock real
                foreach (var ajuste in ajustesPendientes)
                {
                    var producto = ajuste.Producto;
                    if (producto == null)
                    {
                        _logger.LogError("❌ Producto {ProductoId} no encontrado para ajuste {AjusteId}",
                            ajuste.ProductoId, ajuste.AjusteId);
                        continue;
                    }

                    var stockAnterior = producto.CantidadEnInventario;

                    // Aplicar el ajuste
                    switch (ajuste.TipoAjuste)
                    {
                        case "sistema_a_fisico":
                            producto.CantidadEnInventario = ajuste.CantidadFinalPropuesta;
                            break;
                        case "validado":
                            // No cambiar el stock, solo marcar como validado
                            break;
                        default:
                            _logger.LogWarning("⚠️ Tipo de ajuste {Tipo} no manejado", ajuste.TipoAjuste);
                            continue;
                    }

                    producto.FechaUltimaActualizacion = DateTime.Now;

                    // Marcar ajuste como aplicado
                    ajuste.Estado = "Aplicado";
                    ajuste.FechaAplicacion = DateTime.Now;

                    _logger.LogInformation("✅ Producto {ProductoId}: {StockAnterior} → {StockNuevo}",
                        producto.ProductoId, stockAnterior, producto.CantidadEnInventario);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("🎉 === AJUSTES APLICADOS EXITOSAMENTE ===");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "💥 ERROR CRÍTICO al aplicar ajustes");
                throw;
            }
        }

        /// <summary>
        /// Valida que un ajuste sea coherente antes de crearlo o actualizarlo
        /// </summary>
        public async Task<(bool esValido, string mensaje)> ValidarAjusteAsync(SolicitudAjusteInventarioDTO solicitud, int? ajusteIdExcluir = null)
        {
            // Validaciones básicas
            if (solicitud.CantidadSistemaOriginal < 0)
                return (false, "La cantidad del sistema no puede ser negativa");

            if (solicitud.CantidadFisicaContada < 0)
                return (false, "La cantidad física contada no puede ser negativa");

            if (string.IsNullOrWhiteSpace(solicitud.MotivoAjuste) || solicitud.MotivoAjuste.Length < 10)
                return (false, "El motivo del ajuste debe tener al menos 10 caracteres");

            // Validación específica por tipo
            switch (solicitud.TipoAjuste)
            {
                case "sistema_a_fisico":
                    if (!solicitud.CantidadFinalPropuesta.HasValue)
                        return (false, "Para ajuste al sistema se requiere especificar la cantidad final");
                    if (solicitud.CantidadFinalPropuesta < 0)
                        return (false, "La cantidad final propuesta no puede ser negativa");
                    break;

                case "reconteo":
                case "validado":
                    // Estos tipos no requieren validaciones adicionales
                    break;

                default:
                    return (false, $"Tipo de ajuste '{solicitud.TipoAjuste}' no válido");
            }

            // ✅ VERIFICAR AJUSTES DUPLICADOS - CORREGIDO PARA ACTUALIZACIÓN
            var queryAjustesRecientes = _context.AjustesInventarioPendientes
                .Where(a => a.InventarioProgramadoId == solicitud.InventarioProgramadoId &&
                            a.ProductoId == solicitud.ProductoId &&
                            a.UsuarioId == solicitud.UsuarioId &&
                            a.FechaCreacion > DateTime.Now.AddMinutes(-5));

            // ✅ EXCLUIR EL AJUSTE ACTUAL SI SE ESTÁ ACTUALIZANDO
            if (ajusteIdExcluir.HasValue)
            {
                queryAjustesRecientes = queryAjustesRecientes.Where(a => a.AjusteId != ajusteIdExcluir.Value);
            }

            var ajusteReciente = await queryAjustesRecientes.AnyAsync();

            if (ajusteReciente)
                return (false, "Ya existe un ajuste reciente para este producto. Espere unos minutos antes de crear otro.");

            return (true, "Ajuste válido");
        }

        /// <summary>
        /// Genera alertas y recomendaciones para el resumen
        /// </summary>
        private void GenerarAlertasYRecomendaciones(ResumenAjustesInventarioDTO resumen, List<AjusteInventarioPendienteDTO> ajustesPendientes)
        {
            // Alertas por productos con stock que quedaría negativo
            var productosStockNegativo = ajustesPendientes
                .Where(a => a.CantidadFinalPropuesta < 0)
                .ToList();

            if (productosStockNegativo.Any())
            {
                resumen.Alertas.Add($"⚠️ {productosStockNegativo.Count} productos quedarían con stock negativo");
                resumen.ListoParaAplicar = false;
                resumen.MotivoNoListo = "Hay productos que quedarían con stock negativo";
            }

            // Alertas por ajustes de reconteo pendientes
            var reconteosPendientes = ajustesPendientes.Where(a => a.TipoAjuste == "reconteo").ToList();
            if (reconteosPendientes.Any())
            {
                resumen.Alertas.Add($"📋 {reconteosPendientes.Count} productos requieren reconteo antes de aplicar ajustes");
                resumen.ListoParaAplicar = false;
                resumen.MotivoNoListo = "Hay productos pendientes de reconteo";
            }

            // Recomendaciones
            if (resumen.ImpactoNetoUnidades > 100)
            {
                resumen.Recomendaciones.Add("📈 El impacto neto es positivo (+100 unidades). Verificar capacidad de almacenamiento.");
            }
            else if (resumen.ImpactoNetoUnidades < -100)
            {
                resumen.Recomendaciones.Add("📉 El impacto neto es significativamente negativo (-100 unidades). Revisar causas de faltantes.");
            }

            if (resumen.ProductosConAjustes > 20)
            {
                resumen.Recomendaciones.Add("🔍 Alto número de productos con ajustes. Considerar revisar procesos de inventario.");
            }
        }
    }
}