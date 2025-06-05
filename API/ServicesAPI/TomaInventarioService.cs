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

        // ✅ MÉTODO MEJORADO PARA INICIAR INVENTARIO
        /// <summary>
        /// Inicia un inventario programado y genera productos para contar
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

        // ✅ NUEVO MÉTODO: OBTENER PRODUCTOS DEL INVENTARIO PARA LA INTERFAZ WEB
        /// <summary>
        /// Obtiene productos del inventario con información optimizada para la interfaz web
        /// </summary>
        public async Task<List<DetalleInventarioDTO>> ObtenerProductosParaTomaAsync(int inventarioId, int? usuarioId = null)
        {
            _logger.LogInformation("📦 Obteniendo productos para toma del inventario {InventarioId}", inventarioId);

            try
            {
                var query = _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .Include(d => d.Producto)
                        .ThenInclude(p => p.Llanta)
                    .Include(d => d.Producto)
                        .ThenInclude(p => p.ImagenesProductos)
                    .Include(d => d.UsuarioConteo)
                    .AsQueryable();

                // 🔍 FILTRAR POR USUARIO SI SE ESPECIFICA (para asignaciones específicas)
                if (usuarioId.HasValue)
                {
                    // Opcional: Filtrar productos asignados a un usuario específico
                    // query = query.Where(d => d.UsuarioConteoId == usuarioId || d.UsuarioConteoId == null);
                }

                var detalles = await query
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

                        // ✅ INFORMACIÓN DEL PRODUCTO
                        NombreProducto = d.Producto.NombreProducto,
                        DescripcionProducto = d.Producto.Descripcion,
                        EsLlanta = d.Producto.Llanta.Any(),

                        // ✅ INFORMACIÓN DE LLANTA SIMPLIFICADA
                        MarcaLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Marca : null,
                        ModeloLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Modelo : null,
                        MedidasLlanta = d.Producto.Llanta.Any() && d.Producto.Llanta.First().Ancho.HasValue ?
                            $"{d.Producto.Llanta.First().Ancho}/{d.Producto.Llanta.First().Perfil}R{d.Producto.Llanta.First().Diametro}" : null,

                        // ✅ PRIMERA IMAGEN PARA VISTA RÁPIDA
                        ImagenUrl = d.Producto.ImagenesProductos.Any() ? d.Producto.ImagenesProductos.First().Urlimagen : null,

                        // ✅ ESTADO CALCULADO
                        EstadoConteo = d.CantidadFisica.HasValue ? "Contado" : "Pendiente",
                        TieneDiscrepancia = d.Diferencia.HasValue && d.Diferencia.Value != 0,

                        // ✅ INFORMACIÓN COMPLETA DE LLANTA PARA EL SERVICIO
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
                    .OrderBy(d => d.NombreProducto)
                    .ToListAsync();

                _logger.LogInformation("✅ Obtenidos {Cantidad} productos para toma", detalles.Count);
                return detalles;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos para toma");
                return new List<DetalleInventarioDTO>();
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

        // ✅ MÉTODO MEJORADO PARA REGISTRAR CONTEO
        /// <summary>
        /// Registra el conteo de un producto y maneja discrepancias
        /// </summary>
        public async Task<bool> RegistrarConteoAsync(ConteoProductoDTO conteo)
        {
            _logger.LogInformation("📝 Registrando conteo: Producto {ProductoId}, Cantidad {Cantidad}",
                conteo.ProductoId, conteo.CantidadFisica);

            try
            {
                // ✅ BUSCAR DETALLE DEL INVENTARIO
                var detalle = await _context.DetallesInventarioProgramado
                    .Include(d => d.Producto)
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == conteo.InventarioProgramadoId
                                            && d.ProductoId == conteo.ProductoId);

                if (detalle == null)
                {
                    _logger.LogWarning("❌ Detalle no encontrado");
                    return false;
                }

                // ✅ VERIFICAR QUE EL INVENTARIO ESTÉ EN PROGRESO
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == conteo.InventarioProgramadoId);

                if (inventario?.Estado != "En Progreso")
                {
                    _logger.LogWarning("❌ Inventario no está en progreso: Estado={Estado}", inventario?.Estado);
                    return false;
                }

                // ✅ REGISTRAR CONTEO
                detalle.CantidadFisica = conteo.CantidadFisica;
                detalle.Diferencia = conteo.CantidadFisica - detalle.CantidadSistema;
                detalle.Observaciones = conteo.Observaciones;
                detalle.UsuarioConteoId = conteo.UsuarioId;
                detalle.FechaConteo = DateTime.Now;

                await _context.SaveChangesAsync();

                // ✅ MANEJAR DISCREPANCIAS SI LAS HAY
                if (detalle.Diferencia.HasValue && Math.Abs(detalle.Diferencia.Value) > 0)
                {
                    await NotificarDiscrepanciaAsync(conteo.InventarioProgramadoId, detalle);
                }

                _logger.LogInformation("✅ Conteo registrado. Diferencia: {Diferencia}", detalle.Diferencia);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al registrar conteo");
                return false;
            }
        }

        // ✅ MÉTODO AUXILIAR PARA NOTIFICAR DISCREPANCIAS
        private async Task NotificarDiscrepanciaAsync(int inventarioId, DetalleInventarioProgramado detalle)
        {
            try
            {
                _logger.LogInformation("⚠️ Notificando discrepancia en producto {ProductoId}", detalle.ProductoId);

                // ✅ OBTENER USUARIOS CON PERMISO DE VALIDACIÓN
                var usuariosValidacion = await _context.AsignacionesUsuariosInventario
                    .Where(a => a.InventarioProgramadoId == inventarioId && a.PermisoValidacion)
                    .Select(a => a.UsuarioId)
                    .ToListAsync();

                if (!usuariosValidacion.Any())
                {
                    _logger.LogWarning("⚠️ No hay usuarios con permiso de validación para notificar");
                    return;
                }

                // ✅ OBTENER NOMBRE DEL PRODUCTO
                var nombreProducto = detalle.Producto?.NombreProducto ??
                    (await _context.Productos.Where(p => p.ProductoId == detalle.ProductoId)
                                            .Select(p => p.NombreProducto)
                                            .FirstOrDefaultAsync()) ??
                    $"Producto ID: {detalle.ProductoId}";

                // ✅ CREAR NOTIFICACIÓN
                var titulo = "⚠️ Discrepancia Detectada";
                var mensaje = $"Discrepancia en '{nombreProducto}': Sistema={detalle.CantidadSistema}, " +
                             $"Físico={detalle.CantidadFisica}, Diferencia={detalle.Diferencia}";
                var urlAccion = $"/Inventario/DetalleInventarioProgramado/{inventarioId}";

                await _notificacionService.CrearNotificacionesAsync(
                    usuariosIds: usuariosValidacion,
                    titulo: titulo,
                    mensaje: mensaje,
                    tipo: "warning",
                    icono: "fas fa-exclamation-triangle",
                    urlAccion: urlAccion,
                    entidadTipo: "InventarioProgramado",
                    entidadId: inventarioId
                );

                _logger.LogInformation("✅ Notificación de discrepancia enviada a {Count} usuarios", usuariosValidacion.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error notificando discrepancia");
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

        // ✅ MÉTODO MEJORADO PARA OBTENER PROGRESO
        public async Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId)
        {
            _logger.LogInformation("📊 Calculando progreso del inventario {InventarioId}", inventarioId);

            try
            {
                // ✅ VERIFICAR QUE EL INVENTARIO EXISTE
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    return null;
                }

                // ✅ CALCULAR ESTADÍSTICAS
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

                if (estadisticas == null || estadisticas.Total == 0)
                {
                    return new ProgresoInventarioDTO
                    {
                        InventarioId = inventarioId,
                        TotalProductos = 0,
                        ProductosContados = 0,
                        PorcentajeProgreso = 0,
                        TotalDiscrepancias = 0,
                        FechaCalculo = DateTime.Now,
                        Mensaje = "No hay productos en este inventario"
                    };
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
                    FechaCalculo = DateTime.Now,
                    Mensaje = $"Progreso: {estadisticas.Contados}/{estadisticas.Total} productos contados"
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