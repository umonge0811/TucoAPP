using API.Data;
using API.Extensions; // ✅ CONSISTENTE CON TU ESTILO
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.Controllers
{
    /// <summary>
    /// Controlador específico para la TOMA DE INVENTARIOS
    /// Separado del InventarioController para mejor organización
    /// Maneja el proceso completo desde iniciar hasta completar inventarios
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // 🔒 Todos los métodos requieren autenticación
    public class TomaInventarioController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ITomaInventarioService _tomaInventarioService;
        private readonly IPermisosService _permisosService;
        private readonly INotificacionService _notificacionService;
        private readonly ILogger<TomaInventarioController> _logger;

        public TomaInventarioController(
            TucoContext context,
            ITomaInventarioService tomaInventarioService,
            IPermisosService permisosService,
            INotificacionService notificacionService,
            ILogger<TomaInventarioController> logger)
        {
            _context = context;
            _tomaInventarioService = tomaInventarioService;
            _permisosService = permisosService;
            _notificacionService = notificacionService;
            _logger = logger;
        }

        // =====================================
        // MÉTODOS PARA GESTIÓN DE INVENTARIOS
        // =====================================

        /// <summary>
        /// Obtiene un inventario programado por su ID con detalles de progreso
        /// GET: api/TomaInventario/{inventarioId}
        /// </summary>
        [HttpGet("{inventarioId}")]
        public async Task<ActionResult<InventarioProgramadoDTO>> ObtenerInventarioPorId(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO INVENTARIO PROGRAMADO ===");
                _logger.LogInformation("📋 ID solicitado: {InventarioId}, Usuario: {Usuario}",
                    inventarioId, User.Identity?.Name ?? "Anónimo");

                // ✅ VERIFICAR ACCESO AL INVENTARIO
                var tieneAcceso = await VerificarAccesoInventario(inventarioId);
                if (!tieneAcceso)
                {
                    _logger.LogWarning("🚫 Usuario {Usuario} sin acceso al inventario {InventarioId}",
                        User.Identity?.Name, inventarioId);
                    return Forbid("No tienes acceso a este inventario");
                }

                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                        .ThenInclude(a => a.Usuario)
                    .Where(i => i.InventarioProgramadoId == inventarioId)
                    .Select(i => new InventarioProgramadoDTO
                    {
                        InventarioProgramadoId = i.InventarioProgramadoId,
                        Titulo = i.Titulo,
                        Descripcion = i.Descripcion,
                        FechaInicio = i.FechaInicio,
                        FechaFin = i.FechaFin,
                        TipoInventario = i.TipoInventario,
                        Estado = i.Estado,
                        FechaCreacion = i.FechaCreacion,
                        UsuarioCreadorId = i.UsuarioCreadorId,
                        UbicacionEspecifica = i.UbicacionEspecifica,
                        IncluirStockBajo = i.IncluirStockBajo,

                        // ✅ INFORMACIÓN DE USUARIOS ASIGNADOS
                        AsignacionesUsuarios = i.AsignacionesUsuarios.Select(a => new AsignacionUsuarioInventarioDTO
                        {
                            AsignacionId = a.AsignacionId,
                            InventarioProgramadoId = a.InventarioProgramadoId,
                            UsuarioId = a.UsuarioId,
                            NombreUsuario = a.Usuario.NombreUsuario,
                            EmailUsuario = a.Usuario.Email,
                            PermisoConteo = a.PermisoConteo,
                            PermisoAjuste = a.PermisoAjuste,
                            PermisoValidacion = a.PermisoValidacion,
                            FechaAsignacion = a.FechaAsignacion
                        }).ToList(),

                        // ✅ ESTADÍSTICAS DE PROGRESO (SOLO SI ESTÁ EN PROGRESO O COMPLETADO)
                        TotalProductos = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId) : 0,
                        ProductosContados = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.CantidadFisica != null) : 0,
                        Discrepancias = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.Diferencia != 0 && d.Diferencia != null) : 0
                    })
                    .FirstOrDefaultAsync();

                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario no encontrado: {InventarioId}", inventarioId);
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                _logger.LogInformation("✅ Inventario obtenido: '{Titulo}', Estado: {Estado}",
                    inventario.Titulo, inventario.Estado);
                return Ok(inventario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener inventario ID: {InventarioId}", inventarioId);
                return StatusCode(500, new
                {
                    message = "Error interno del servidor",
                    timestamp = DateTime.Now
                });
            }
        }

        /// <summary>
        /// 🚀 MÉTODO PRINCIPAL: Inicia un inventario programado
        /// POST: api/TomaInventario/{inventarioId}/iniciar
        /// </summary>
        [HttpPost("{inventarioId}/iniciar")]
        public async Task<IActionResult> IniciarInventario(int inventarioId)
        {
            try
            {
                // 🔒 VERIFICAR PERMISOS (CONSISTENTE CON TU ESTILO)
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Programar Inventario",
                    "Solo usuarios con permiso 'Programar Inventario' pueden iniciar inventarios");
                if (validacion != null) return validacion;

                _logger.LogInformation("🚀 === INICIANDO INVENTARIO ===");
                _logger.LogInformation("👤 Usuario: {Usuario}, Inventario ID: {InventarioId}",
                    User.Identity?.Name ?? "Anónimo", inventarioId);

                // ✅ VERIFICAR QUE EL INVENTARIO EXISTE Y ESTÁ EN ESTADO CORRECTO
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario no encontrado: {InventarioId}", inventarioId);
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                if (inventario.Estado != "Programado")
                {
                    _logger.LogWarning("❌ Inventario en estado incorrecto: {Estado}", inventario.Estado);
                    return BadRequest(new { message = "Este inventario ya está en progreso o completado" });
                }

                _logger.LogInformation("✅ Inventario válido: '{Titulo}'", inventario.Titulo);

                // ✅ CAMBIAR ESTADO A "EN PROGRESO"
                inventario.Estado = "En Progreso";
                _logger.LogInformation("🔄 Estado cambiado a: En Progreso");

                // ✅ GENERAR REGISTROS DE DETALLE PARA TODOS LOS PRODUCTOS
                await GenerarDetallesInventario(inventario);

                // ✅ ENVIAR NOTIFICACIONES DE INICIO
                await EnviarNotificacionesInicio(inventario);

                // ✅ GUARDAR CAMBIOS
                await _context.SaveChangesAsync();

                _logger.LogInformation("🎉 === INVENTARIO INICIADO EXITOSAMENTE ===");
                _logger.LogInformation("✅ Inventario '{Titulo}' iniciado por {Usuario}",
                    inventario.Titulo, User.Identity?.Name);

                return Ok(new
                {
                    message = "Inventario iniciado exitosamente",
                    inventarioId = inventarioId,
                    titulo = inventario.Titulo,
                    usuariosNotificados = inventario.AsignacionesUsuarios.Count,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al iniciar inventario {InventarioId}", inventarioId);
                return StatusCode(500, new
                {
                    message = "Error interno al iniciar inventario",
                    timestamp = DateTime.Now
                });
            }
        }

        /// <summary>
        /// Envía notificaciones de inicio a todos los usuarios asignados
        /// </summary>
        private async Task EnviarNotificacionesInicio(InventarioProgramado inventario)
        {
            try
            {
                _logger.LogInformation("📧 === ENVIANDO NOTIFICACIONES DE INICIO ===");

                var usuariosAsignados = inventario.AsignacionesUsuarios.Select(a => a.UsuarioId).ToList();
                if (!usuariosAsignados.Any())
                {
                    _logger.LogWarning("⚠️ No hay usuarios asignados para notificar");
                    return;
                }

                var titulo = "🚀 Inventario Iniciado";
                var mensaje = $"El inventario '{inventario.Titulo}' ha comenzado. ¡Puedes empezar a contar!";
                var urlAccion = $"/Inventario/DetalleInventarioProgramado/{inventario.InventarioProgramadoId}";

                await _notificacionService.CrearNotificacionesAsync(
                    usuariosIds: usuariosAsignados,
                    titulo: titulo,
                    mensaje: mensaje,
                    tipo: "success",
                    icono: "fas fa-play-circle",
                    urlAccion: urlAccion,
                    entidadTipo: "InventarioProgramado",
                    entidadId: inventario.InventarioProgramadoId
                );

                _logger.LogInformation("✅ Notificaciones enviadas a {Count} usuarios", usuariosAsignados.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error enviando notificaciones de inicio");
                // No lanzar excepción para no interrumpir el proceso principal
            }
        }

        /// <summary>
        /// Maneja las discrepancias encontradas durante el conteo
        /// </summary>
        private async Task ManejearDiscrepancia(int inventarioId, DetalleInventarioProgramado detalle)
        {
            try
            {
                _logger.LogInformation("⚠️ === MANEJANDO DISCREPANCIA ===");
                _logger.LogInformation("⚠️ Producto: {ProductoId}, Diferencia: {Diferencia}",
                    detalle.ProductoId, detalle.Diferencia);

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

                // ✅ CREAR NOTIFICACIÓN DE DISCREPANCIA
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
                _logger.LogError(ex, "❌ Error manejando discrepancia");
                // No lanzar excepción para no interrumpir el proceso principal
            }
        }

        /// <summary>
        /// Verifica si el usuario tiene permisos de conteo en el inventario
        /// </summary>
        private async Task<bool> VerificarPermisoConteo(int inventarioId, int usuarioId)
        {
            try
            {
                // ✅ VERIFICAR SI ES ADMINISTRADOR
                var esAdmin = await this.TienePermisoAsync(_permisosService, "Programar Inventario");
                if (esAdmin) return true;

                // ✅ VERIFICAR PERMISO ESPECÍFICO DE CONTEO
                var tienePermiso = await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId &&
                                  a.UsuarioId == usuarioId &&
                                  a.PermisoConteo);

                return tienePermiso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verificando permiso de conteo");
                return false;
            }
        }


        /// <summary>
        /// Verifica si el usuario actual tiene acceso al inventario
        /// </summary>
        private async Task<bool> VerificarAccesoInventario(int inventarioId)
        {
            try
            {
                var usuarioId = ObtenerIdUsuarioActual();

                // ✅ VERIFICAR SI ES ADMINISTRADOR (SIEMPRE TIENE ACCESO)
                var esAdmin = await this.TienePermisoAsync(_permisosService, "Programar Inventario");
                if (esAdmin)
                {
                    _logger.LogInformation("✅ Acceso concedido por permisos de administrador");
                    return true;
                }

                // ✅ VERIFICAR SI ESTÁ ASIGNADO AL INVENTARIO
                var estaAsignado = await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId && a.UsuarioId == usuarioId);

                if (estaAsignado)
                {
                    _logger.LogInformation("✅ Acceso concedido por asignación al inventario");
                    return true;
                }

                _logger.LogWarning("⚠️ Usuario {UsuarioId} sin acceso al inventario {InventarioId}", usuarioId, inventarioId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verificando acceso al inventario {InventarioId}", inventarioId);
                return false;
            }
        }

        /// <summary>
        /// Genera los registros de detalle para todos los productos del inventario
        /// </summary>
        private async Task GenerarDetallesInventario(InventarioProgramado inventario)
        {
            _logger.LogInformation("📋 === GENERANDO DETALLES DE INVENTARIO ===");

            // ✅ OBTENER PRODUCTOS SEGÚN CONFIGURACIÓN DEL INVENTARIO
            var productosQuery = _context.Productos.AsQueryable();

            // 🔍 FILTRAR POR UBICACIÓN SI SE ESPECIFICÓ
            if (!string.IsNullOrEmpty(inventario.UbicacionEspecifica))
            {
                _logger.LogInformation("🏢 Filtrando por ubicación: {Ubicacion}", inventario.UbicacionEspecifica);
                // TODO: Implementar filtro por ubicación cuando tengas ese campo en Productos
                // productosQuery = productosQuery.Where(p => p.Ubicacion == inventario.UbicacionEspecifica);
            }

            // 📉 FILTRAR POR STOCK BAJO SI NO SE INCLUYEN
            if (!inventario.IncluirStockBajo)
            {
                _logger.LogInformation("📊 Excluyendo productos con stock bajo");
                productosQuery = productosQuery.Where(p => p.CantidadEnInventario > p.StockMinimo);
            }

            var productos = await productosQuery.ToListAsync();
            _logger.LogInformation("✅ Se encontraron {Count} productos para el inventario", productos.Count);

            // ✅ CREAR REGISTROS DE DETALLE
            var detallesGenerados = 0;
            foreach (var producto in productos)
            {
                var detalle = new DetalleInventarioProgramado
                {
                    InventarioProgramadoId = inventario.InventarioProgramadoId,
                    ProductoId = producto.ProductoId,
                    CantidadSistema = (int)producto.CantidadEnInventario,
                    // CantidadFisica, Diferencia, UsuarioConteoId y FechaConteo se llenarán durante el conteo
                };

                _context.DetallesInventarioProgramado.Add(detalle);
                detallesGenerados++;
            }

            _logger.LogInformation("📋 Se generaron {Count} registros de detalle", detallesGenerados);
        }

        /// <summary>
        /// Obtiene los productos de un inventario para realizar conteo
        /// GET: api/TomaInventario/{inventarioId}/productos
        /// </summary>
        [HttpGet("{inventarioId}/productos")]
        public async Task<ActionResult<List<DetalleInventarioDTO>>> ObtenerProductosInventario(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📦 === OBTENIENDO PRODUCTOS DEL INVENTARIO ===");
                _logger.LogInformation("📦 Inventario ID: {InventarioId}, Usuario: {Usuario}",
                    inventarioId, User.Identity?.Name ?? "Anónimo");

                // 🔒 VERIFICAR ACCESO AL INVENTARIO
                var tieneAcceso = await VerificarAccesoInventario(inventarioId);
                if (!tieneAcceso)
                {
                    return Forbid("No tienes acceso a este inventario");
                }

                // ✅ OBTENER PRODUCTOS CON INFORMACIÓN COMPLETA
                var productos = await _context.DetallesInventarioProgramado
                    .Include(d => d.Producto)
                        .ThenInclude(p => p.Llanta)
                    .Include(d => d.Producto)
                        .ThenInclude(p => p.ImagenesProductos)
                    .Include(d => d.UsuarioConteo)
                    .Where(d => d.InventarioProgramadoId == inventarioId)
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

                        // ✅ INFORMACIÓN DE LLANTA (SI APLICA)
                        EsLlanta = d.Producto.Llanta.Any(),
                        MedidasLlanta = d.Producto.Llanta.Any() && d.Producto.Llanta.First().Ancho.HasValue ?
                            $"{d.Producto.Llanta.First().Ancho}/{d.Producto.Llanta.First().Perfil}/R{d.Producto.Llanta.First().Diametro}" : null,
                        MarcaLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Marca : null,
                        ModeloLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Modelo : null,

                        // ✅ PRIMERA IMAGEN (PARA VISTA RÁPIDA)
                        ImagenUrl = d.Producto.ImagenesProductos.Any() ? d.Producto.ImagenesProductos.First().Urlimagen : null,

                        // ✅ ESTADO DEL CONTEO
                        EstadoConteo = d.CantidadFisica.HasValue ? "Contado" : "Pendiente",
                        TieneDiscrepancia = d.Diferencia.HasValue && d.Diferencia.Value != 0
                    })
                    .OrderBy(d => d.NombreProducto)
                    .ToListAsync();

                _logger.LogInformation("✅ Se obtuvieron {Count} productos para inventario", productos.Count);

                // ✅ ESTADÍSTICAS RÁPIDAS
                var contados = productos.Count(p => p.EstadoConteo == "Contado");
                var pendientes = productos.Count(p => p.EstadoConteo == "Pendiente");
                var discrepancias = productos.Count(p => p.TieneDiscrepancia);

                _logger.LogInformation("📊 Estadísticas: {Contados} contados, {Pendientes} pendientes, {Discrepancias} discrepancias",
                    contados, pendientes, discrepancias);

                return Ok(new
                {
                    productos = productos,
                    estadisticas = new
                    {
                        total = productos.Count,
                        contados = contados,
                        pendientes = pendientes,
                        discrepancias = discrepancias,
                        porcentajeProgreso = productos.Count > 0 ? Math.Round((double)contados / productos.Count * 100, 1) : 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener productos del inventario {InventarioId}", inventarioId);
                return StatusCode(500, new
                {
                    message = "Error interno del servidor",
                    timestamp = DateTime.Now
                });
            }
        }

        /// <summary>
        /// 📝 MÉTODO PRINCIPAL: Registra un conteo de producto
        /// POST: api/TomaInventario/{inventarioId}/productos/{productoId}/conteo
        /// </summary>
        [HttpPost("{inventarioId}/productos/{productoId}/conteo")]
        public async Task<IActionResult> RegistrarConteo(int inventarioId, int productoId, [FromBody] ConteoProductoDTO conteo)
        {
            try
            {
                _logger.LogInformation("📝 === REGISTRANDO CONTEO ===");
                _logger.LogInformation("📝 Inventario: {InventarioId}, Producto: {ProductoId}, Cantidad: {Cantidad}, Usuario: {Usuario}",
                    inventarioId, productoId, conteo.CantidadFisica, User.Identity?.Name ?? "Anónimo");

                // 🔒 VERIFICAR PERMISOS DE CONTEO
                var usuarioId = ObtenerIdUsuarioActual();
                var puedeContar = await VerificarPermisoConteo(inventarioId, usuarioId);
                if (!puedeContar)
                {
                    _logger.LogWarning("🚫 Usuario {Usuario} sin permisos de conteo en inventario {InventarioId}",
                        User.Identity?.Name, inventarioId);
                    return Forbid("No tienes permisos para realizar conteos en este inventario");
                }

                // ✅ BUSCAR EL DETALLE DEL INVENTARIO
                var detalle = await _context.DetallesInventarioProgramado
                    .Include(d => d.Producto)
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == inventarioId && d.ProductoId == productoId);

                if (detalle == null)
                {
                    _logger.LogWarning("❌ Detalle de inventario no encontrado: Inventario={InventarioId}, Producto={ProductoId}",
                        inventarioId, productoId);
                    return NotFound(new { message = "Detalle de inventario no encontrado" });
                }

                // ✅ VERIFICAR QUE EL INVENTARIO ESTÉ EN PROGRESO
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null || inventario.Estado != "En Progreso")
                {
                    _logger.LogWarning("❌ Inventario no está en progreso: Estado={Estado}", inventario?.Estado ?? "NULL");
                    return BadRequest(new { message = "El inventario no está en progreso" });
                }

                // ✅ REGISTRAR EL CONTEO
                var stockAnterior = detalle.CantidadFisica;
                var cantidadAnterior = detalle.CantidadSistema;

                detalle.CantidadFisica = conteo.CantidadFisica;
                detalle.Diferencia = conteo.CantidadFisica - detalle.CantidadSistema;
                detalle.Observaciones = conteo.Observaciones;
                detalle.UsuarioConteoId = usuarioId;
                detalle.FechaConteo = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Conteo registrado exitosamente");
                _logger.LogInformation("📊 Sistema: {Sistema}, Físico: {Fisico}, Diferencia: {Diferencia}",
                    detalle.CantidadSistema, detalle.CantidadFisica, detalle.Diferencia);

                // ✅ MANEJAR DISCREPANCIAS (SI LAS HAY)
                if (detalle.Diferencia.HasValue && Math.Abs(detalle.Diferencia.Value) > 0)
                {
                    await ManejearDiscrepancia(inventarioId, detalle);
                }

                return Ok(new
                {
                    message = "Conteo registrado exitosamente",
                    diferencia = detalle.Diferencia,
                    hayDiscrepancia = detalle.Diferencia.HasValue && detalle.Diferencia.Value != 0,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al registrar conteo");
                return StatusCode(500, new
                {
                    message = "Error interno del servidor",
                    timestamp = DateTime.Now
                });
            }
        }

        /// <summary>
        /// Obtiene el progreso de un inventario
        /// GET: api/TomaInventario/{inventarioId}/progreso
        /// </summary>
        [HttpGet("{inventarioId}/progreso")]
        public async Task<ActionResult<ProgresoInventarioDTO>> ObtenerProgreso(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo progreso del inventario: {InventarioId}", inventarioId);

                var progreso = await _tomaInventarioService.ObtenerProgresoAsync(inventarioId);

                if (progreso == null)
                {
                    return NotFound(new { message = "Inventario no encontrado" });
                }

                return Ok(progreso);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener progreso del inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Completa un inventario
        /// POST: api/TomaInventario/{inventarioId}/completar
        /// </summary>
        [HttpPost("{inventarioId}/completar")]
        public async Task<IActionResult> CompletarInventario(int inventarioId)
        {
            try
            {
                // 🔒 Verificar permisos
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Programar Inventario",
                    "Solo usuarios con permiso 'Programar Inventario' pueden completar inventarios");
                if (validacion != null) return validacion;

                _logger.LogInformation("🏁 Completando inventario: {InventarioId}", inventarioId);

                var resultado = await _tomaInventarioService.CompletarInventarioAsync(inventarioId);

                if (resultado.Exitoso)
                {
                    _logger.LogInformation("✅ Inventario completado exitosamente");
                    return Ok(new
                    {
                        message = "Inventario completado exitosamente",
                        totalProductos = resultado.TotalProductos,
                        discrepancias = resultado.Discrepancias
                    });
                }
                else
                {
                    return BadRequest(new { message = resultado.Mensaje });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al completar inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        // =====================================
        // MÉTODOS AUXILIARES PRIVADOS
        // =====================================

        /// <summary>
        /// Obtiene el ID del usuario actual desde los claims
        /// </summary>
        private int ObtenerIdUsuarioActual()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId")?.Value ??
                                  User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }

                _logger.LogWarning("⚠️ No se pudo obtener el ID del usuario desde los claims");
                return 1; // Fallback - en producción esto debería manejarse mejor
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener ID del usuario");
                return 1; // Fallback
            }
        }
    }
}
    

