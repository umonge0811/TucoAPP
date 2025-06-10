using API.Data;
using API.Extensions; // ✅ CONSISTENTE CON TU ESTILO
using API.Services.Interfaces;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;
using Tuco.Clases.DTOs.Inventario;
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
        private readonly IAjustesInventarioPendientesService _ajustesService;

        public TomaInventarioController(
            TucoContext context,
            ITomaInventarioService tomaInventarioService,
            IPermisosService permisosService,
            INotificacionService notificacionService,
            IAjustesInventarioPendientesService ajustesService,
            ILogger<TomaInventarioController> logger)
        {
            _context = context;
            _tomaInventarioService = tomaInventarioService;
            _permisosService = permisosService;
            _notificacionService = notificacionService;
            _logger = logger;
            _ajustesService = ajustesService;
        }

        // =====================================
        // MÉTODOS PARA AJUSTE DE INVENTARIOS
        // =====================================

        /// <summary>
        /// Crea un ajuste pendiente para resolver discrepancias durante la toma de inventario
        /// </summary>
        [HttpPost("{inventarioId}/ajustar-discrepancia")]
        [Authorize]
        public async Task<IActionResult> CrearAjustePendiente(int inventarioId, [FromBody] SolicitudAjusteInventarioDTO solicitud)
        {
            try
            {
                _logger.LogInformation("📝 === AJUSTE PENDIENTE SOLICITADO ===");
                _logger.LogInformation("📝 Inventario: {InventarioId}, Producto: {ProductoId}", inventarioId, solicitud.ProductoId);

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // ✅ VALIDAR QUE EL INVENTARIO ID COINCIDA
                if (solicitud.InventarioProgramadoId != inventarioId)
                {
                    return BadRequest(new { success = false, message = "El ID del inventario no coincide" });
                }

                // ✅ OBTENER ID DEL USUARIO DESDE EL TOKEN
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "No se pudo identificar el usuario" });
                }

                solicitud.UsuarioId = userId;

                // ✅ CREAR EL AJUSTE PENDIENTE
                var ajusteId = await _ajustesService.CrearAjustePendienteAsync(solicitud);

                _logger.LogInformation("✅ Ajuste pendiente creado con ID: {AjusteId}", ajusteId);

                return Ok(new
                {
                    success = true,
                    message = "Ajuste pendiente registrado exitosamente",
                    data = new
                    {
                        ajusteId = ajusteId,
                        tipoAjuste = solicitud.TipoAjuste,
                        productoId = solicitud.ProductoId,
                        diferencia = solicitud.CantidadFisicaContada - solicitud.CantidadSistemaOriginal,
                        cantidadFinalPropuesta = solicitud.CantidadFinalPropuesta ?? solicitud.CantidadFisicaContada,
                        timestamp = DateTime.Now
                    }
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Solicitud inválida: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Operación no permitida: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear ajuste pendiente");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }


        /// <summary>
        /// Obtiene todos los ajustes pendientes de un inventario específico
        /// </summary>
        [HttpGet("{inventarioId}/ajustes")]
        [Authorize]
        public async Task<IActionResult> ObtenerAjustesPendientes(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo ajustes pendientes para inventario {InventarioId}", inventarioId);

                var ajustes = await _ajustesService.ObtenerAjustesPorInventarioAsync(inventarioId);

                return Ok(new
                {
                    success = true,
                    inventarioId = inventarioId,
                    totalAjustes = ajustes.Count,
                    ajustes = ajustes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener ajustes del inventario {InventarioId}", inventarioId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtiene ajustes pendientes de un producto específico
        /// </summary>
        [HttpGet("{inventarioId}/productos/{productoId}/ajustes")]
        [Authorize]
        public async Task<IActionResult> ObtenerAjustesProducto(int inventarioId, int productoId)
        {
            try
            {
                var ajustes = await _ajustesService.ObtenerAjustesPorProductoAsync(inventarioId, productoId);
                var tienePendientes = await _ajustesService.TieneAjustesPendientesAsync(inventarioId, productoId);

                return Ok(new
                {
                    success = true,
                    productoId = productoId,
                    tieneAjustesPendientes = tienePendientes,
                    totalAjustes = ajustes.Count,
                    ajustes = ajustes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener ajustes del producto {ProductoId}", productoId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Elimina un ajuste pendiente específico
        /// </summary>
        [HttpDelete("ajustes/{ajusteId}")]
        [Authorize]
        public async Task<IActionResult> EliminarAjustePendiente(int ajusteId)
        {
            try
            {
                _logger.LogInformation("🗑️ Eliminando ajuste pendiente {AjusteId}", ajusteId);

                var eliminado = await _ajustesService.EliminarAjustePendienteAsync(ajusteId);

                if (eliminado)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Ajuste eliminado exitosamente",
                        ajusteId = ajusteId
                    });
                }
                else
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Ajuste no encontrado o no se puede eliminar (ya fue aplicado)"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar ajuste {AjusteId}", ajusteId);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtiene un resumen de todos los ajustes de un inventario
        /// </summary>
        [HttpGet("{inventarioId}/ajustes/resumen")]
        [Authorize]
        public async Task<IActionResult> ObtenerResumenAjustes(int inventarioId)
        {
            try
            {
                var resumen = await _ajustesService.ObtenerResumenAjustesAsync(inventarioId);
                return Ok(new
                {
                    success = true,
                    inventarioId = inventarioId,
                    resumen = resumen
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener resumen de ajustes");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// MÉTODO CRÍTICO: Aplica todos los ajustes pendientes al completar el inventario
        /// Solo debe llamarse cuando se completa un inventario
        /// </summary>
        [HttpPost("{inventarioId}/aplicar-ajustes")]
        [Authorize]
        public async Task<IActionResult> AplicarAjustesPendientes(int inventarioId)
        {
            try
            {
                _logger.LogInformation("🔥 === OPERACIÓN CRÍTICA: APLICANDO AJUSTES ===");
                _logger.LogInformation("🔥 Inventario ID: {InventarioId}", inventarioId);
                _logger.LogInformation("🔥 Usuario: {Usuario}", User.Identity?.Name);

                // ✅ AQUÍ PUEDES AGREGAR VALIDACIONES DE PERMISOS ESPECÍFICOS
                // Por ejemplo, verificar que el usuario tenga permiso "Completar Inventario"

                var aplicado = await _ajustesService.AplicarAjustesPendientesAsync(inventarioId);

                if (aplicado)
                {
                    _logger.LogInformation("✅ === AJUSTES APLICADOS EXITOSAMENTE ===");
                    _logger.LogInformation("✅ Inventario: {InventarioId}", inventarioId);

                    return Ok(new
                    {
                        success = true,
                        message = "Todos los ajustes pendientes han sido aplicados al stock del sistema",
                        inventarioId = inventarioId,
                        fechaAplicacion = DateTime.Now,
                        nota = "Los cambios en el stock son irreversibles"
                    });
                }
                else
                {
                    _logger.LogError("❌ No se pudieron aplicar los ajustes para inventario {InventarioId}", inventarioId);
                    return BadRequest(new
                    {
                        success = false,
                        message = "No se pudieron aplicar los ajustes pendientes"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 ERROR CRÍTICO al aplicar ajustes para inventario {InventarioId}", inventarioId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error crítico al aplicar ajustes. Contacte al administrador del sistema"
                });
            }
        }


        /// <summary>
        /// Actualiza un ajuste pendiente específico
        /// </summary>
        [HttpPut("ajustes/{ajusteId}")]
        [Authorize]
        public async Task<IActionResult> ActualizarAjustePendiente(int ajusteId, [FromBody] SolicitudAjusteInventarioDTO solicitud)
        {
            try
            {
                _logger.LogInformation("✏️ === ACTUALIZANDO AJUSTE PENDIENTE ===");
                _logger.LogInformation("✏️ Ajuste ID: {AjusteId}, Producto: {ProductoId}", ajusteId, solicitud.ProductoId);

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // ✅ OBTENER ID DEL USUARIO DESDE EL TOKEN
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "No se pudo identificar el usuario" });
                }

                solicitud.UsuarioId = userId;

                // ✅ ACTUALIZAR EL AJUSTE PENDIENTE
                var actualizado = await _ajustesService.ActualizarAjustePendienteAsync(ajusteId, solicitud);

                if (actualizado)
                {
                    _logger.LogInformation("✅ Ajuste pendiente actualizado con ID: {AjusteId}", ajusteId);

                    return Ok(new
                    {
                        success = true,
                        message = "Ajuste pendiente actualizado exitosamente",
                        data = new
                        {
                            ajusteId = ajusteId,
                            tipoAjuste = solicitud.TipoAjuste,
                            productoId = solicitud.ProductoId,
                            cantidadFinalPropuesta = solicitud.CantidadFinalPropuesta ?? solicitud.CantidadFisicaContada,
                            timestamp = DateTime.Now
                        }
                    });
                }
                else
                {
                    _logger.LogError("❌ No se pudo actualizar el ajuste pendiente {AjusteId}", ajusteId);
                    return BadRequest(new { success = false, message = "No se pudo actualizar el ajuste pendiente" });
                }
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Solicitud inválida: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Operación no permitida: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar ajuste pendiente");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
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
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Iniciar Inventario",
                "Solo usuarios con permiso 'Iniciar Inventario' pueden iniciar inventarios");
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

                // ✅ VERIFICAR ACCESO AL INVENTARIO
                var tieneAcceso = await VerificarAccesoInventario(inventarioId);
                if (!tieneAcceso)
                {
                    return Forbid("No tienes acceso a este inventario");
                }

                // ✅ OBTENER DETALLES SIN RELACIONES COMPLEJAS
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .ToListAsync();

                _logger.LogInformation("🔍 Detalles obtenidos: {Count}", detalles.Count);

                if (!detalles.Any())
                {
                    return Ok(new
                    {
                        productos = new List<DetalleInventarioDTO>(),
                        estadisticas = new { total = 0, contados = 0, pendientes = 0, discrepancias = 0, porcentajeProgreso = 0.0 }
                    });
                }

                var productosDTO = new List<DetalleInventarioDTO>();

                foreach (var detalle in detalles)
                {
                    try
                    {
                        // ✅ OBTENER PRODUCTO
                        var producto = await _context.Productos
                            .FirstOrDefaultAsync(p => p.ProductoId == detalle.ProductoId);

                        // ✅ OBTENER LLANTA (SOLO UNA)
                        var llanta = await _context.Llantas
                            .FirstOrDefaultAsync(l => l.ProductoId == detalle.ProductoId);

                        // ✅ OBTENER SOLO LA PRIMERA IMAGEN (EVITAR DUPLICADOS)
                        var imagenPrincipal = await _context.ImagenesProductos
                            .Where(img => img.ProductoId == detalle.ProductoId)
                            .OrderBy(img => img.ImagenId) // Tomar la primera imagen por ID
                            .Select(img => img.Urlimagen)
                            .FirstOrDefaultAsync();

                        // ✅ OBTENER USUARIO DE CONTEO
                        var usuario = detalle.UsuarioConteoId.HasValue
                            ? await _context.Usuarios.FirstOrDefaultAsync(u => u.UsuarioId == detalle.UsuarioConteoId.Value)
                            : null;

                        // ✅ CONSTRUIR MEDIDAS DE LLANTA
                        string? medidasLlanta = null;
                        if (llanta != null && llanta.Ancho.HasValue && llanta.Perfil.HasValue && !string.IsNullOrEmpty(llanta.Diametro))
                        {
                            medidasLlanta = $"{llanta.Ancho}/{llanta.Perfil}R{llanta.Diametro}";
                        }

                        // ✅ CREAR DTO COMPLETO
                        var dto = new DetalleInventarioDTO
                        {
                            DetalleId = detalle.DetalleId,
                            InventarioProgramadoId = detalle.InventarioProgramadoId,
                            ProductoId = detalle.ProductoId,
                            CantidadSistema = detalle.CantidadSistema,
                            CantidadFisica = detalle.CantidadFisica,
                            Diferencia = detalle.Diferencia,
                            Observaciones = detalle.Observaciones ?? "",
                            FechaConteo = detalle.FechaConteo,
                            UsuarioConteoId = detalle.UsuarioConteoId,

                            // ✅ INFORMACIÓN DEL PRODUCTO
                            NombreProducto = producto?.NombreProducto ?? $"Producto {detalle.ProductoId}",
                            DescripcionProducto = producto?.Descripcion ?? "",

                            // ✅ INFORMACIÓN DE LLANTA
                            EsLlanta = llanta != null,
                            MarcaLlanta = llanta?.Marca,
                            ModeloLlanta = llanta?.Modelo,
                            MedidasLlanta = medidasLlanta,

                            // ✅ IMAGEN PRINCIPAL (SOLO UNA)
                            ImagenUrl = imagenPrincipal,

                            // ✅ ESTADOS CALCULADOS
                            EstadoConteo = detalle.CantidadFisica.HasValue ? "Contado" : "Pendiente",
                            TieneDiscrepancia = detalle.Diferencia.HasValue && detalle.Diferencia.Value != 0,

                            // ✅ USUARIO QUE HIZO EL CONTEO
                            NombreUsuarioConteo = usuario?.NombreUsuario
                        };

                        productosDTO.Add(dto);

                        _logger.LogInformation("✅ Producto {ProductoId} mapeado: {Nombre} (Llanta: {EsLlanta})",
                            detalle.ProductoId, dto.NombreProducto, dto.EsLlanta);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Error mapeando producto {ProductoId}: {Error}", detalle.ProductoId, ex.Message);

                        // ✅ PRODUCTO BÁSICO EN CASO DE ERROR
                        productosDTO.Add(new DetalleInventarioDTO
                        {
                            DetalleId = detalle.DetalleId,
                            InventarioProgramadoId = detalle.InventarioProgramadoId,
                            ProductoId = detalle.ProductoId,
                            CantidadSistema = detalle.CantidadSistema,
                            CantidadFisica = detalle.CantidadFisica,
                            Diferencia = detalle.Diferencia,
                            NombreProducto = $"ERROR - Producto {detalle.ProductoId}",
                            EstadoConteo = detalle.CantidadFisica.HasValue ? "Contado" : "Pendiente",
                            TieneDiscrepancia = detalle.Diferencia.HasValue && detalle.Diferencia.Value != 0
                        });
                    }
                }

                _logger.LogInformation("✅ Productos mapeados correctamente: {Count}", productosDTO.Count);

                // ✅ ESTADÍSTICAS
                var contados = productosDTO.Count(p => p.EstadoConteo == "Contado");
                var pendientes = productosDTO.Count(p => p.EstadoConteo == "Pendiente");
                var discrepancias = productosDTO.Count(p => p.TieneDiscrepancia);

                _logger.LogInformation("📊 Estadísticas: {Contados} contados, {Pendientes} pendientes, {Discrepancias} discrepancias",
                    contados, pendientes, discrepancias);

                return Ok(new
                {
                    productos = productosDTO,
                    estadisticas = new
                    {
                        total = productosDTO.Count,
                        contados = contados,
                        pendientes = pendientes,
                        discrepancias = discrepancias,
                        porcentajeProgreso = productosDTO.Count > 0 ? Math.Round((double)contados / productosDTO.Count * 100, 1) : 0
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
        /// MÉTODO DE PRUEBA - Solo datos básicos sin relaciones
        /// GET: api/TomaInventario/{inventarioId}/productos-simple
        /// </summary>
        [HttpGet("{inventarioId}/productos-simple")]
        public async Task<ActionResult> ObtenerProductosSimple(int inventarioId)
        {
            try
            {
                _logger.LogInformation("🧪 === MÉTODO DE PRUEBA SIMPLE ===");
                _logger.LogInformation("🧪 Inventario ID: {InventarioId}", inventarioId);

                // ✅ AHORA DEBERÍA FUNCIONAR CON EL MODELO CORREGIDO
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .Select(d => new DetalleInventarioSimpleDTO
                    {
                        DetalleId = d.DetalleId,
                        InventarioProgramadoId = d.InventarioProgramadoId,
                        ProductoId = d.ProductoId,
                        CantidadSistema = d.CantidadSistema,
                        CantidadFisica = d.CantidadFisica,
                        Diferencia = d.Diferencia,
                        Observaciones = d.Observaciones,  // ✅ AHORA ES NULLABLE
                        FechaConteo = d.FechaConteo,
                        UsuarioConteoId = d.UsuarioConteoId,
                        EstadoConteo = d.CantidadFisica != null ? "Contado" : "Pendiente",
                        TieneDiscrepancia = d.Diferencia != null && d.Diferencia != 0
                    })
                    .ToListAsync();

                _logger.LogInformation("🧪 Detalles obtenidos: {Count}", detalles.Count);

                if (detalles.Any())
                {
                    var primer = detalles.First();
                    _logger.LogInformation("🧪 Primer detalle - ID: {DetalleId}, ProductoId: {ProductoId}, Estado: {Estado}",
                        primer.DetalleId, primer.ProductoId, primer.EstadoConteo);
                }

                return Ok(new
                {
                    success = true,
                    total = detalles.Count,
                    productos = detalles,
                    mensaje = $"Método simple - {detalles.Count} detalles encontrados"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🧪 💥 Error en método simple: {Message}", ex.Message);

                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
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
    

