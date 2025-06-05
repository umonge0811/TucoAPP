using API.Data;
using API.Services.Interfaces;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;

namespace API.Services
{
    /// <summary>
    /// Servicio para gestión de toma de inventarios físicos
    /// ✅ Implementa TODOS los métodos de la interfaz ITomaInventarioService
    /// </summary>
    public class TomaInventarioService : ITomaInventarioService
    {
        #region ✅ DEPENDENCIAS
        private readonly TucoContext _context;
        private readonly ILogger<TomaInventarioService> _logger;
        private readonly INotificacionService _notificacionService;
        private readonly IPermisosService _permisosService;

        public TomaInventarioService(
            TucoContext context,
            ILogger<TomaInventarioService> logger,
            INotificacionService notificacionService,
            IPermisosService permisosService)
        {
            _context = context;
            _logger = logger;
            _notificacionService = notificacionService;
            _permisosService = permisosService;
        }
        #endregion

        #region 📋 GESTIÓN DE INVENTARIOS PROGRAMADOS

        /// <summary>
        /// Obtiene un inventario programado por su ID
        /// </summary>
        public async Task<InventarioProgramadoDTO?> ObtenerInventarioPorIdAsync(int inventarioId)
        {
            _logger.LogInformation("📋 Obteniendo inventario {InventarioId}", inventarioId);

            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                        .ThenInclude(a => a.Usuario)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario {InventarioId} no encontrado", inventarioId);
                    return null;
                }

                // Mapear a DTO (usarás tu lógica de mapeo existente)
                var dto = new InventarioProgramadoDTO
                {
                    InventarioProgramadoId = inventario.InventarioProgramadoId,
                    Titulo = inventario.Titulo,
                    Descripcion = inventario.Descripcion,
                    Estado = inventario.Estado,
                    FechaInicio = inventario.FechaInicio,
                    FechaFin = inventario.FechaFin,
                    TipoInventario = inventario.TipoInventario,
                    UsuarioCreadorId = inventario.UsuarioCreadorId,
                    FechaCreacion = inventario.FechaCreacion
                    // ... agregar más propiedades según tu DTO
                };

                _logger.LogInformation("✅ Inventario obtenido: {Titulo}", inventario.Titulo);
                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        /// <summary>
        /// Inicia un inventario programado
        /// </summary>
        public async Task<ResultadoOperacionDTO> IniciarInventarioAsync(int inventarioId)
        {
            _logger.LogInformation("🚀 === INICIANDO INVENTARIO {InventarioId} ===", inventarioId);

            try
            {
                // ✅ OBTENER INVENTARIO
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario no encontrado");
                    return ResultadoOperacionDTO.Error("Inventario no encontrado", "INVENTARIO_NO_ENCONTRADO");
                }

                if (inventario.Estado != "Programado")
                {
                    _logger.LogWarning("❌ Inventario en estado inválido: {Estado}", inventario.Estado);
                    return ResultadoOperacionDTO.Error($"El inventario está en estado '{inventario.Estado}' y no puede ser iniciado", "ESTADO_INVALIDO");
                }

                // ✅ CAMBIAR ESTADO
                inventario.Estado = "En Progreso";
                inventario.FechaInicio = DateTime.Now;

                // ✅ GENERAR PRODUCTOS PARA CONTAR
                var productosGenerados = await GenerarProductosInventarioAsync(inventario);

                // ✅ GUARDAR CAMBIOS
                await _context.SaveChangesAsync();

                // ✅ ENVIAR NOTIFICACIONES
                await EnviarNotificacionesInicioAsync(inventario);

                _logger.LogInformation("🎉 Inventario iniciado exitosamente. Productos: {Productos}", productosGenerados);

                return ResultadoOperacionDTO.ExitoConEstadisticas(
                    "Inventario iniciado exitosamente",
                    totalProductos: productosGenerados,
                    usuariosNotificados: inventario.AsignacionesUsuarios.Count
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al iniciar inventario");
                return ResultadoOperacionDTO.Error("Error interno al iniciar inventario", "ERROR_INTERNO");
            }
        }

        /// <summary>
        /// Completa un inventario programado
        /// </summary>
        public async Task<ResultadoOperacionDTO> CompletarInventarioAsync(int inventarioId)
        {
            _logger.LogInformation("🏁 Completando inventario {InventarioId}", inventarioId);

            try
            {
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    return ResultadoOperacionDTO.Error("Inventario no encontrado", "INVENTARIO_NO_ENCONTRADO");
                }

                if (inventario.Estado != "En Progreso")
                {
                    return ResultadoOperacionDTO.Error($"El inventario está en estado '{inventario.Estado}' y no puede ser completado", "ESTADO_INVALIDO");
                }

                // Completar productos sin contar
                var productosSinContar = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId && d.CantidadFisica == null)
                    .ToListAsync();

                foreach (var detalle in productosSinContar)
                {
                    detalle.CantidadFisica = detalle.CantidadSistema;
                    detalle.Diferencia = 0;
                    detalle.Observaciones = "Completado automáticamente";
                    detalle.FechaConteo = DateTime.Now;
                }

                inventario.Estado = "Completado";
                inventario.FechaFin = DateTime.Now;

                // Calcular estadísticas finales
                var totalDiscrepancias = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId && d.Diferencia != null && d.Diferencia != 0)
                    .CountAsync();

                var totalProductos = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .CountAsync();

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Inventario completado");

                return ResultadoOperacionDTO.ExitoConEstadisticas(
                    "Inventario completado exitosamente",
                    totalProductos: totalProductos,
                    discrepancias: totalDiscrepancias
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al completar inventario");
                return ResultadoOperacionDTO.Error("Error interno al completar inventario", "ERROR_INTERNO");
            }
        }

        /// <summary>
        /// Cancela un inventario programado
        /// </summary>
        public async Task<ResultadoOperacionDTO> CancelarInventarioAsync(int inventarioId)
        {
            _logger.LogInformation("❌ Cancelando inventario {InventarioId}", inventarioId);

            try
            {
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    return ResultadoOperacionDTO.Error("Inventario no encontrado", "INVENTARIO_NO_ENCONTRADO");
                }

                if (inventario.Estado == "Completado")
                {
                    return ResultadoOperacionDTO.Error("No se puede cancelar un inventario ya completado", "ESTADO_INVALIDO");
                }

                inventario.Estado = "Cancelado";
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Inventario cancelado");
                return ResultadoOperacionDTO.Exito("Inventario cancelado exitosamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al cancelar inventario");
                return ResultadoOperacionDTO.Error("Error interno al cancelar inventario", "ERROR_INTERNO");
            }
        }

        #endregion

        #region 📦 GESTIÓN DE PRODUCTOS Y CONTEOS

        /// <summary>
        /// Obtiene todos los productos de un inventario
        /// </summary>
        public async Task<List<DetalleInventarioDTO>> ObtenerProductosInventarioAsync(int inventarioId)
        {
            _logger.LogInformation("📦 Obteniendo productos del inventario {InventarioId}", inventarioId);

            try
            {
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .Include(d => d.Producto)
                        .ThenInclude(p => p.Llanta)
                    .Include(d => d.UsuarioConteo)
                    .Select(d => new DetalleInventarioDTO
                    {
                        DetalleId = d.DetalleId,
                        InventarioProgramadoId = d.InventarioProgramadoId,
                        ProductoId = d.ProductoId,
                        CantidadSistema = d.CantidadSistema,
                        CantidadFisica = d.CantidadFisica,
                        Diferencia = d.Diferencia,
                        Observaciones = d.Observaciones,
                        FechaConteo = d.FechaConteo,
                        UsuarioConteoId = d.UsuarioConteoId,
                        NombreUsuarioConteo = d.UsuarioConteo != null ? d.UsuarioConteo.NombreUsuario : null,

                        // Información del producto
                        NombreProducto = d.Producto.NombreProducto,
                        DescripcionProducto = d.Producto.Descripcion,
                        EsLlanta = d.Producto.Llanta.Any(),

                        // Información de llanta
                        MarcaLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Marca : null,
                        ModeloLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Modelo : null,
                        MedidasLlanta = d.Producto.Llanta.Any() ?
                            $"{d.Producto.Llanta.First().Ancho}/{d.Producto.Llanta.First().Perfil}R{d.Producto.Llanta.First().Diametro}" : null,

                        // Estado
                        EstadoConteo = d.CantidadFisica.HasValue ? "Contado" : "Pendiente",
                        TieneDiscrepancia = d.Diferencia.HasValue && d.Diferencia.Value != 0,

                        // Información de llanta completa
                        InformacionLlanta = d.Producto.Llanta.Any() ? new LlantaTomaDTO
                        {
                            Ancho = d.Producto.Llanta.First().Ancho,
                            Perfil = d.Producto.Llanta.First().Perfil,
                            Diametro = d.Producto.Llanta.First().Diametro,
                            Marca = d.Producto.Llanta.First().Marca,
                            Modelo = d.Producto.Llanta.First().Modelo,
                            IndiceVelocidad = d.Producto.Llanta.First().IndiceVelocidad,
                            TipoTerreno = d.Producto.Llanta.First().TipoTerreno
                        } : null
                    })
                    .ToListAsync();

                _logger.LogInformation("✅ Obtenidos {Cantidad} productos", detalles.Count);
                return detalles;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos");
                return new List<DetalleInventarioDTO>();
            }
        }

        /// <summary>
        /// Obtiene un producto específico del inventario
        /// </summary>
        public async Task<DetalleInventarioDTO?> ObtenerProductoInventarioAsync(int inventarioId, int productoId)
        {
            _logger.LogInformation("📦 Obteniendo producto {ProductoId} del inventario {InventarioId}",
                productoId, inventarioId);

            try
            {
                var productos = await ObtenerProductosInventarioAsync(inventarioId);
                return productos.FirstOrDefault(p => p.ProductoId == productoId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener producto específico");
                return null;
            }
        }

        /// <summary>
        /// Registra el conteo físico de un producto
        /// </summary>
        public async Task<bool> RegistrarConteoAsync(ConteoProductoDTO conteo)
        {
            _logger.LogInformation("📝 Registrando conteo: Producto {ProductoId}, Cantidad {Cantidad}",
                conteo.ProductoId, conteo.CantidadFisica);

            try
            {
                var detalle = await _context.DetallesInventarioProgramado
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == conteo.InventarioProgramadoId
                                            && d.ProductoId == conteo.ProductoId);

                if (detalle == null)
                {
                    _logger.LogWarning("❌ Detalle no encontrado");
                    return false;
                }

                // Registrar conteo
                detalle.CantidadFisica = conteo.CantidadFisica;
                detalle.Diferencia = conteo.CantidadFisica - detalle.CantidadSistema;
                detalle.Observaciones = conteo.Observaciones;
                detalle.UsuarioConteoId = conteo.UsuarioId;
                detalle.FechaConteo = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Conteo registrado. Diferencia: {Diferencia}", detalle.Diferencia);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al registrar conteo");
                return false;
            }
        }

        /// <summary>
        /// Obtiene el historial de conteos de un producto
        /// </summary>
        public async Task<List<ConteoProductoDTO>> ObtenerHistorialConteosAsync(int inventarioId, int productoId)
        {
            _logger.LogInformation("📖 Obteniendo historial de conteos");

            // Implementación simplificada - puedes expandir después
            return new List<ConteoProductoDTO>();
        }

        #endregion

        #region 📊 PROGRESO Y ESTADÍSTICAS

        /// <summary>
        /// Obtiene el progreso actual de un inventario
        /// </summary>
        public async Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId)
        {
            _logger.LogInformation("📊 Calculando progreso del inventario {InventarioId}", inventarioId);

            try
            {
                var estadisticas = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .GroupBy(d => 1)
                    .Select(g => new
                    {
                        Total = g.Count(),
                        Contados = g.Count(d => d.CantidadFisica != null),
                        Discrepancias = g.Count(d => d.Diferencia != null && d.Diferencia != 0)
                    })
                    .FirstOrDefaultAsync();

                if (estadisticas == null)
                {
                    return null;
                }

                var porcentaje = estadisticas.Total > 0
                    ? (decimal)estadisticas.Contados / estadisticas.Total * 100
                    : 0;

                return new ProgresoInventarioDTO
                {
                    InventarioId = inventarioId,
                    TotalProductos = estadisticas.Total,
                    ProductosContados = estadisticas.Contados,
                    PorcentajeProgreso = Math.Round(porcentaje, 1),
                    TotalDiscrepancias = estadisticas.Discrepancias,
                    FechaCalculo = DateTime.Now
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al calcular progreso");
                return null;
            }
        }

        /// <summary>
        /// Obtiene productos con discrepancias
        /// </summary>
        public async Task<List<DetalleInventarioDTO>> ObtenerDiscrepanciasAsync(int inventarioId)
        {
            _logger.LogInformation("⚠️ Obteniendo discrepancias del inventario {InventarioId}", inventarioId);

            try
            {
                var productos = await ObtenerProductosInventarioAsync(inventarioId);
                return productos.Where(p => p.TieneDiscrepancia).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener discrepancias");
                return new List<DetalleInventarioDTO>();
            }
        }

        /// <summary>
        /// Obtiene productos pendientes de contar
        /// </summary>
        public async Task<List<DetalleInventarioDTO>> ObtenerProductosPendientesAsync(int inventarioId, int? usuarioId = null)
        {
            _logger.LogInformation("⏳ Obteniendo productos pendientes");

            try
            {
                var productos = await ObtenerProductosInventarioAsync(inventarioId);
                return productos.Where(p => p.EstadoConteo == "Pendiente").ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos pendientes");
                return new List<DetalleInventarioDTO>();
            }
        }

        #endregion

        #region 🔒 PERMISOS Y ACCESO

        /// <summary>
        /// Verifica si un usuario tiene acceso a un inventario
        /// </summary>
        public async Task<bool> UsuarioTieneAccesoAsync(int inventarioId, int usuarioId)
        {
            try
            {
                return await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId && a.UsuarioId == usuarioId);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Verifica si un usuario puede realizar conteos
        /// </summary>
        public async Task<bool> UsuarioPuedeContarAsync(int inventarioId, int usuarioId)
        {
            try
            {
                return await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId
                                && a.UsuarioId == usuarioId
                                && a.PermisoConteo);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Verifica si un usuario puede validar conteos
        /// </summary>
        public async Task<bool> UsuarioPuedeValidarAsync(int inventarioId, int usuarioId)
        {
            try
            {
                return await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId
                                && a.UsuarioId == usuarioId
                                && a.PermisoValidacion);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Verifica si un usuario puede ajustar stock
        /// </summary>
        public async Task<bool> UsuarioPuedeAjustarAsync(int inventarioId, int usuarioId)
        {
            try
            {
                return await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId
                                && a.UsuarioId == usuarioId
                                && a.PermisoAjuste);
            }
            catch
            {
                return false;
            }
        }

        #endregion

        #region 📄 REPORTES Y EXPORTACIÓN (SIMPLIFICADOS)

        public async Task<object> GenerarReporteAsync(int inventarioId)
        {
            // Implementación básica - expandir después
            _logger.LogInformation("📄 Generando reporte básico");
            return new { mensaje = "Reporte generado" };
        }

        public async Task<object> ObtenerDatosParaExportacionAsync(int inventarioId)
        {
            // Implementación básica - expandir después
            _logger.LogInformation("📊 Preparando datos para exportación");
            return new { mensaje = "Datos preparados" };
        }

        public async Task<int> EnviarRecordatoriosAsync(int inventarioId)
        {
            // Implementación básica - expandir después
            _logger.LogInformation("📧 Enviando recordatorios");
            return 0;
        }

        public async Task<bool> NotificarDiscrepanciaCriticaAsync(int inventarioId, int detalleId)
        {
            // Implementación básica - expandir después
            _logger.LogInformation("🚨 Notificando discrepancia crítica");
            return true;
        }

        #endregion

        #region 🔧 MÉTODOS AUXILIARES PRIVADOS

        /// <summary>
        /// Genera los productos que serán incluidos en el inventario
        /// </summary>
        private async Task<int> GenerarProductosInventarioAsync(InventarioProgramado inventario)
        {
            _logger.LogInformation("🔧 Generando productos para inventario...");

            var productosQuery = _context.Productos.AsQueryable();

            // Aplicar filtros según tipo de inventario
            if (inventario.TipoInventario?.ToLower() == "llantas")
            {
                productosQuery = productosQuery.Where(p => p.Llanta.Any());
            }

            if (inventario.IncluirStockBajo == false)
            {
                productosQuery = productosQuery.Where(p => p.CantidadEnInventario > p.StockMinimo);
            }

            var productos = await productosQuery.ToListAsync();

            var detalles = productos.Select(p => new DetalleInventarioProgramado
            {
                InventarioProgramadoId = inventario.InventarioProgramadoId,
                ProductoId = p.ProductoId,
                CantidadSistema = (int)p.CantidadEnInventario
            }).ToList();

            _context.DetallesInventarioProgramado.AddRange(detalles);

            return detalles.Count;
        }

        /// <summary>
        /// Envía notificaciones cuando se inicia un inventario
        /// </summary>
        private async Task EnviarNotificacionesInicioAsync(InventarioProgramado inventario)
        {
            _logger.LogInformation("📧 Enviando notificaciones de inicio...");

            if (!inventario.AsignacionesUsuarios.Any())
            {
                _logger.LogWarning("⚠️ No hay usuarios asignados para notificar");
                return;
            }

            var usuariosIds = inventario.AsignacionesUsuarios.Select(a => a.UsuarioId).ToList();
            var titulo = "🚀 Inventario Iniciado";
            var mensaje = $"El inventario '{inventario.Titulo}' ha comenzado. ¡Puedes empezar a contar!";
            var urlAccion = $"/TomaInventario/Ejecutar/{inventario.InventarioProgramadoId}";

            await _notificacionService.CrearNotificacionesAsync(
                usuariosIds: usuariosIds,
                titulo: titulo,
                mensaje: mensaje,
                tipo: "success",
                icono: "fas fa-play-circle",
                urlAccion: urlAccion,
                entidadTipo: "InventarioProgramado",
                entidadId: inventario.InventarioProgramadoId
            );

            _logger.LogInformation("✅ Notificaciones enviadas a {Cantidad} usuarios", usuariosIds.Count);
        }

        #endregion
    }
}