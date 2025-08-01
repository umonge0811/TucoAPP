using API.Data;
using API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.Services
{
    /// <summary>
    /// Servicio específico para TOMA DE INVENTARIOS
    /// Separado del InventarioService para mejor organización
    /// </summary>
    public class TomaInventarioService : ITomaInventarioService
    {
        private readonly TucoContext _context;
        private readonly ILogger<TomaInventarioService> _logger;

        public TomaInventarioService(TucoContext context, ILogger<TomaInventarioService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene el progreso de un inventario
        /// </summary>
        public async Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo progreso del inventario: {InventarioId}", inventarioId);

                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    _logger.LogWarning("❌ Inventario no encontrado: {InventarioId}", inventarioId);
                    return null;
                }

                // Solo calcular progreso si el inventario está en progreso o completado
                if (inventario.Estado == "Programado")
                {
                    return new ProgresoInventarioDTO
                    {
                        InventarioProgramadoId = inventarioId,
                        Titulo = inventario.Titulo,
                        Estado = inventario.Estado,
                        TotalProductos = 0,
                        ProductosContados = 0,
                        ProductosPendientes = 0,
                        Discrepancias = 0,
                        PorcentajeProgreso = 0,
                        FechaInicio = inventario.FechaInicio,
                        FechaFin = inventario.FechaFin
                    };
                }

                // Obtener estadísticas de progreso
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .Select(d => new
                    {
                        d.CantidadFisica,
                        d.Diferencia
                    })
                    .ToListAsync();

                var totalProductos = detalles.Count;
                var productosContados = detalles.Count(d => d.CantidadFisica.HasValue);
                var productosPendientes = totalProductos - productosContados;
                var discrepancias = detalles.Count(d => d.Diferencia.HasValue && d.Diferencia.Value != 0);
                var porcentajeProgreso = totalProductos > 0 ? Math.Round((double)productosContados / totalProductos * 100, 1) : 0;

                _logger.LogInformation("✅ Progreso calculado: {Contados}/{Total} ({Porcentaje}%)",
                    productosContados, totalProductos, porcentajeProgreso);

                return new ProgresoInventarioDTO
                {
                    InventarioProgramadoId = inventarioId,
                    Titulo = inventario.Titulo,
                    Estado = inventario.Estado,
                    TotalProductos = totalProductos,
                    ProductosContados = productosContados,
                    ProductosPendientes = productosPendientes,
                    Discrepancias = discrepancias,
                    PorcentajeProgreso = porcentajeProgreso,
                    FechaInicio = inventario.FechaInicio,
                    FechaFin = inventario.FechaFin
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener progreso del inventario {InventarioId}", inventarioId);
                return null;
            }
        }

        /// <summary>
        /// Completa un inventario y calcula diferencias finales
        /// </summary>
        public async Task<ResultadoInventarioDTO> CompletarInventarioAsync(int inventarioId)
        {
            try
            {
                _logger.LogInformation("🏁 === COMPLETANDO INVENTARIO ===");
                _logger.LogInformation("🏁 Inventario ID: {InventarioId}", inventarioId);

                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    return new ResultadoInventarioDTO
                    {
                        Exitoso = false,
                        Mensaje = "Inventario no encontrado"
                    };
                }

                if (inventario.Estado != "En Progreso")
                {
                    return new ResultadoInventarioDTO
                    {
                        Exitoso = false,
                        Mensaje = "Solo se puede completar un inventario que esté en progreso"
                    };
                }

                // Obtener detalles del inventario
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .ToListAsync();

                // Completar productos sin contar (asumir cantidad del sistema)
                var detallesSinContar = detalles.Where(d => d.CantidadFisica == null).ToList();
                foreach (var detalle in detallesSinContar)
                {
                    detalle.CantidadFisica = detalle.CantidadSistema;
                    detalle.Diferencia = 0;
                    detalle.FechaConteo = DateTime.Now;
                    // No asignar usuario porque no fue contado manualmente
                }

                // Cambiar estado a completado
                inventario.Estado = "Completado";

                await _context.SaveChangesAsync();

                // Calcular estadísticas finales
                var totalProductos = detalles.Count;
                var discrepancias = detalles.Count(d => d.Diferencia.HasValue && d.Diferencia.Value != 0);

                _logger.LogInformation("🎉 === INVENTARIO COMPLETADO ===");
                _logger.LogInformation("📊 Total productos: {Total}, Discrepancias: {Discrepancias}",
                    totalProductos, discrepancias);

                return new ResultadoInventarioDTO
                {
                    Exitoso = true,
                    Mensaje = "Inventario completado exitosamente",
                    TotalProductos = totalProductos,
                    Discrepancias = discrepancias
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al completar inventario {InventarioId}", inventarioId);
                return new ResultadoInventarioDTO
                {
                    Exitoso = false,
                    Mensaje = $"Error al completar inventario: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Verifica si un usuario tiene acceso a un inventario específico
        /// </summary>
        public async Task<bool> UsuarioTieneAccesoAsync(int inventarioId, int usuarioId)
        {
            try
            {
                var tieneAcceso = await _context.AsignacionesUsuariosInventario
                    .AnyAsync(a => a.InventarioProgramadoId == inventarioId && a.UsuarioId == usuarioId);

                _logger.LogInformation("🔐 Usuario {UsuarioId} - Acceso a inventario {InventarioId}: {TieneAcceso}",
                    usuarioId, inventarioId, tieneAcceso);

                return tieneAcceso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error verificando acceso - Usuario: {UsuarioId}, Inventario: {InventarioId}",
                    usuarioId, inventarioId);
                return false;
            }
        }

        /// <summary>
        /// Obtiene los inventarios asignados a un usuario específico
        /// </summary>
        public async Task<List<InventarioProgramadoDTO>> ObtenerInventariosAsignadosAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo inventarios asignados al usuario: {UsuarioId}", usuarioId);

                var inventarios = await _context.AsignacionesUsuariosInventario
                    .Where(a => a.UsuarioId == usuarioId)
                    .Include(a => a.InventarioProgramado)
                        .ThenInclude(i => i.AsignacionesUsuarios)
                            .ThenInclude(au => au.Usuario)
                    .Select(a => new InventarioProgramadoDTO
                    {
                        InventarioProgramadoId = a.InventarioProgramado.InventarioProgramadoId,
                        Titulo = a.InventarioProgramado.Titulo,
                        Descripcion = a.InventarioProgramado.Descripcion,
                        FechaInicio = a.InventarioProgramado.FechaInicio,
                        FechaFin = a.InventarioProgramado.FechaFin,
                        TipoInventario = a.InventarioProgramado.TipoInventario,
                        Estado = a.InventarioProgramado.Estado,
                        FechaCreacion = a.InventarioProgramado.FechaCreacion,
                        UsuarioCreadorId = a.InventarioProgramado.UsuarioCreadorId,

                        // Información de la asignación del usuario
                        AsignacionesUsuarios = new List<AsignacionUsuarioInventarioDTO>
                        {
                            new AsignacionUsuarioInventarioDTO
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
                            }
                        },

                        // Estadísticas básicas
                        TotalProductos = a.InventarioProgramado.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == a.InventarioProgramado.InventarioProgramadoId) : 0,
                        ProductosContados = a.InventarioProgramado.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == a.InventarioProgramado.InventarioProgramadoId && d.CantidadFisica != null) : 0,
                        Discrepancias = a.InventarioProgramado.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == a.InventarioProgramado.InventarioProgramadoId && d.Diferencia != 0 && d.Diferencia != null) : 0
                    })
                    .OrderByDescending(i => i.FechaCreacion)
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} inventarios asignados", inventarios.Count);
                return inventarios;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener inventarios asignados para usuario {UsuarioId}", usuarioId);
                return new List<InventarioProgramadoDTO>();
            }
        }

        /// <summary>
        /// Obtiene estadísticas rápidas de un inventario
        /// </summary>
        public async Task<EstadisticasInventarioDTO> ObtenerEstadisticasAsync(int inventarioId)
        {
            try
            {
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == inventarioId)
                    .Select(d => new
                    {
                        d.CantidadFisica,
                        d.Diferencia
                    })
                    .ToListAsync();

                var total = detalles.Count;
                var contados = detalles.Count(d => d.CantidadFisica.HasValue);
                var pendientes = total - contados;
                var discrepancias = detalles.Count(d => d.Diferencia.HasValue && d.Diferencia.Value != 0);

                return new EstadisticasInventarioDTO
                {
                    TotalProductos = total,
                    ProductosContados = contados,
                    ProductosPendientes = pendientes,
                    Discrepancias = discrepancias,
                    PorcentajeProgreso = total > 0 ? Math.Round((double)contados / total * 100, 1) : 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener estadísticas del inventario {InventarioId}", inventarioId);
                return new EstadisticasInventarioDTO();
            }
        }

        // =====================================
        // NOTIFICACIONES
        // =====================================

        /// <summary>
        /// Notifica a los supervisores que un usuario completó su parte del conteo
        /// </summary>
        public async Task<bool> NotificarConteoCompletadoAsync(int inventarioId, int usuarioId)
        {
            try
            {
                _logger.LogInformation("📧 === NOTIFICANDO CONTEO COMPLETADO DESDE SERVICIO API ===");
                _logger.LogInformation("📧 Inventario ID: {InventarioId}, Usuario ID: {UsuarioId}", inventarioId, usuarioId);

                // Verificar que el inventario existe
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .ThenInclude(a => a.Usuario)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == inventarioId);

                if (inventario == null)
                {
                    _logger.LogError("❌ Inventario no encontrado: {InventarioId}", inventarioId);
                    return false;
                }

                // Verificar que el usuario está asignado al inventario
                var asignacion = inventario.AsignacionesUsuarios?.FirstOrDefault(a => a.UsuarioId == usuarioId);
                if (asignacion == null)
                {
                    _logger.LogError("❌ Usuario {UsuarioId} no está asignado al inventario {InventarioId}", usuarioId, inventarioId);
                    return false;
                }

                _logger.LogInformation("✅ Validaciones pasadas. Usuario {Usuario} puede notificar conteo completado", 
                    asignacion.Usuario?.NombreUsuario ?? "Desconocido");

                // Aquí se enviarían las notificaciones a los supervisores
                // Por ahora, solo registramos que la operación fue exitosa
                _logger.LogInformation("📧 Notificación de conteo completado procesada exitosamente");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al notificar conteo completado para inventario {InventarioId}", inventarioId);
                return false;
            }
        }


    }

//    // =====================================
//    // INTERFACES Y DTOS
//    // =====================================

//    public interface ITomaInventarioService
//    {
//        Task<ProgresoInventarioDTO?> ObtenerProgresoAsync(int inventarioId);
//        Task<ResultadoInventarioDTO> CompletarInventarioAsync(int inventarioId);
//        Task<bool> UsuarioTieneAccesoAsync(int inventarioId, int usuarioId);
//        Task<List<InventarioProgramadoDTO>> ObtenerInventariosAsignadosAsync(int usuarioId);
//        Task<EstadisticasInventarioDTO> ObtenerEstadisticasAsync(int inventarioId);
//    }
//}

//// =====================================
//// DTOS ESPECÍFICOS PARA TOMA DE INVENTARIO
//// =====================================

//namespace Tuco.Clases.DTOs.Inventario
//{
//    public class ProgresoInventarioDTO
//    {
//        public int InventarioProgramadoId { get; set; }
//        public string Titulo { get; set; } = string.Empty;
//        public string Estado { get; set; } = string.Empty;
//        public int TotalProductos { get; set; }
//        public int ProductosContados { get; set; }
//        public int ProductosPendientes { get; set; }
//        public int Discrepancias { get; set; }
//        public double PorcentajeProgreso { get; set; }
//        public DateTime FechaInicio { get; set; }
//        public DateTime FechaFin { get; set; }
//    }

//    public class ResultadoInventarioDTO
//    {
//        public bool Exitoso { get; set; }
//        public string Mensaje { get; set; } = string.Empty;
//        public int TotalProductos { get; set; }
//        public int Discrepancias { get; set; }
//    }

//    public class EstadisticasInventarioDTO
//    {
//        public int TotalProductos { get; set; }
//        public int ProductosContados { get; set; }
//        public int ProductosPendientes { get; set; }
//        public int Discrepancias { get; set; }
//        public double PorcentajeProgreso { get; set; }
//    }

//    public class DetalleInventarioDTO
//    {
//        public int DetalleId { get; set; }
//        public int InventarioProgramadoId { get; set; }
//        public int ProductoId { get; set; }
//        public int CantidadSistema { get; set; }
//        public int? CantidadFisica { get; set; }
//        public int? Diferencia { get; set; }
//        public string? Observaciones { get; set; }
//        public DateTime? FechaConteo { get; set; }
//        public int? UsuarioConteoId { get; set; }
//        public string? NombreUsuarioConteo { get; set; }

//        // Información del producto
//        public string NombreProducto { get; set; } = string.Empty;
//        public string? DescripcionProducto { get; set; }
//        public string? ImagenUrl { get; set; }

//        // Información específica de llantas
//        public bool EsLlanta { get; set; }
//        public string? MedidasLlanta { get; set; }
//        public string? MarcaLlanta { get; set; }
//        public string? ModeloLlanta { get; set; }

//        // Estados calculados
//        public string EstadoConteo { get; set; } = "Pendiente";
//        public bool TieneDiscrepancia { get; set; }
//    }

//    public class ConteoProductoDTO
//    {
//        public int InventarioProgramadoId { get; set; }
//        public int ProductoId { get; set; }
//        public int UsuarioId { get; set; }
//        public int CantidadFisica { get; set; }
//        public string? Observaciones { get; set; }
//    }
}