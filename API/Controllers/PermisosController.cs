using API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using tuco.Utilities;
using Tuco.Clases.Utilities;
using Tuco.Clases.DTOs;
using Microsoft.AspNetCore.Cors;
using API.Extensions; // Para las extensiones de permisos
using API.ServicesAPI.Interfaces; // Para IPermisosService
using Microsoft.AspNetCore.Authorization;
using Tuco.Clases.Models; // Para [Authorize]

[ApiController]
[Route("api/[controller]")]
// Habilitar CORS para este controlador usando la política "AllowAll"
[EnableCors("AllowAll")]
public class PermisosController : ControllerBase
{
    TucoContext _context;
    HttpClient _httpClient;
    IPermisosService _permisosService;
    ILogger<PermisosController> _logger;
    INotificacionService _notificacionService;

    public PermisosController(
    TucoContext context,
    IHttpClientFactory httpClientFactory,
    IPermisosService permisosService,
    ILogger<PermisosController> logger,
    INotificacionService notificacionService)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient("TucoApi");
        _permisosService = permisosService;
        _logger = logger;
        _notificacionService = notificacionService;
    }

    #region Creacion de Permisos
    [HttpPost("crear-permiso")]
    public async Task<IActionResult> CrearPermiso([FromBody] PermisoDTO permisoDTO)
    {
        try
        {

            // Validar si el permiso ya existe
            if (await _context.Permisos.AnyAsync(p => p.NombrePermiso == permisoDTO.NombrePermiso))
            {
                // Registrar intento fallido en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                    usuarioId: 1, // Método para obtener el ID del usuario
                    tipoAccion: "Creación de Permiso",
                    modulo: "Permisos",
                    detalle: $"Intento de crear permiso fallido. El permiso '{permisoDTO.NombrePermiso}' ya existe.",
                    estadoAccion: "Error",
                    errorDetalle: "El permiso ya existe."
                );

                return BadRequest(new { Message = "El permiso ya existe." });
            }

            // Crear la entidad Permiso desde el DTO
            var permiso = new Permiso
            {
                NombrePermiso = permisoDTO.NombrePermiso,
                DescripcionPermiso = permisoDTO.DescripcionPermiso
            };

            // Guardar en la base de datos
            _context.Permisos.Add(permiso);
            await _context.SaveChangesAsync();

            // Registrar acción exitosa en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                usuarioId: 1, // Método para obtener el ID del usuario
                tipoAccion: "Creación de Permiso",
                modulo: "Permisos",
                detalle: $"Permiso creado exitosamente: {permisoDTO.NombrePermiso}",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Permiso creado exitosamente.", PermisoId = permiso.PermisoId });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient, // Puedes pasar un HttpClient si es necesario
                usuarioId: 1, // Método para obtener el ID del usuario
                tipoAccion: "Creación de Permiso",
                modulo: "Permisos",
                detalle: "Error al crear el permiso.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Consulta de Permisos
    // Obtener todos los permisos
    [HttpGet("obtener-todos")]
    public async Task<ActionResult<List<Permiso>>> ObtenerPermisos()
    {
        return Ok(await _context.Permisos.ToListAsync());
    }

    // Obtener todos los permisos
    [HttpGet("obtener-por-id/{id}")]
    public async Task<ActionResult> ObtenerPermisosPorID(int id)
    {
        // Busca el permiso en la base de datos por su ID
        var permisoExistenteID = await _context.Permisos.FindAsync(id);
        // Verifica si el permiso existe
        if (permisoExistenteID == null)
        {
            // Retorna un error 404 si no se encuentra el permiso
            return NotFound(new { Message = "Permiso no encontrado." });
        }
        return Ok(permisoExistenteID);
    }
    #endregion

    #region Actualización de Permisos
    [HttpPut("actualizar/{id}")]
    public async Task<IActionResult> ActualizarPermiso(int id, [FromBody] Permiso permiso)
    {
        try
        {
            // Buscar el permiso existente por ID
            var permisoExistente = await _context.Permisos.FindAsync(id);
            if (permisoExistente == null)
            {
                // Registrar intento fallido en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 1, // Usuario ID para pruebas
                    tipoAccion: "Actualización de Permiso",
                    modulo: "Permisos",
                    detalle: $"Intento de actualizar permiso fallido. Permiso con ID '{id}' no encontrado.",
                    estadoAccion: "Error",
                    errorDetalle: "Permiso no encontrado."
                );

                return NotFound(new { Message = "Permiso no encontrado." });
            }

            // Actualizar los valores del permiso existente
            permisoExistente.NombrePermiso = permiso.NombrePermiso;
            permisoExistente.DescripcionPermiso = permiso.DescripcionPermiso;

            // Guardar los cambios en la base de datos
            await _context.SaveChangesAsync();

            // Registrar acción exitosa en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 1, // Usuario ID para pruebas
                tipoAccion: "Actualización de Permiso",
                modulo: "Permisos",
                detalle: $"Permiso actualizado exitosamente: {permiso.NombrePermiso}.",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Permiso actualizado exitosamente." });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 1, // Usuario ID para pruebas
                tipoAccion: "Actualización de Permiso",
                modulo: "Permisos",
                detalle: "Error al actualizar el permiso.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Eliminación de Permisos
    [HttpDelete("eliminar/{id}")]
    public async Task<ActionResult> EliminarPermiso(int id)
    {
        try
        {
            var permiso = await _context.Permisos.FindAsync(id);
            if (permiso == null)
            {
                return NotFound("Permiso no encontrado");
            }

            _context.Permisos.Remove(permiso);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Permiso eliminado exitosamente" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("solicitar-permiso")]
    public async Task<IActionResult> SolicitarPermiso([FromBody] SolicitudPermisoRequest request)
    {
        try
        {
            // Aquí implementarías la lógica para crear una notificación o registro de solicitud
            // Por ahora, solo devolvemos éxito
            return Ok(new { success = true, message = "Solicitud enviada correctamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar solicitud de permiso");
            return StatusCode(500, new { success = false, message = "Error interno del servidor" });
        }
    }

    [HttpGet("funciones")]
    public async Task<IActionResult> ObtenerFunciones()
    {
        try
        {
            var funciones = new Dictionary<string, string>
                {
                    {"Ver Inventario", "Permite visualizar el listado de productos en inventario"},
                    {"Crear Productos", "Permite agregar nuevos productos al sistema"},
                    {"Editar Productos", "Permite modificar información de productos existentes"},
                    {"Eliminar Productos", "Permite eliminar productos del sistema"},
                    {"Ver Costos", "Permite visualizar los costos de compra de los productos"},
                    {"Ver Utilidades", "Permite ver márgenes de ganancia y utilidades"},
                    {"Programar Inventario", "Permite crear y programar nuevos inventarios"},
                    {"Iniciar Inventario", "Permite dar inicio a inventarios programados"},
                    {"Completar Inventario", "Permite finalizar inventarios en proceso"},
                    {"Ajustar Stock", "Permite realizar ajustes manuales de inventario"},
                    {"Ver Facturación", "Permite acceder al módulo de ventas y facturación"},
                    {"Crear Facturas", "Permite crear nuevas facturas de venta"},
                    {"Completar Facturas", "Permite finalizar y cobrar facturas"},
                    {"Editar Facturas", "Permite modificar facturas existentes"},
                    {"Anular Facturas", "Permite anular facturas procesadas"},
                    {"Ver Clientes", "Permite visualizar el listado de clientes"},
                    {"Crear Clientes", "Permite registrar nuevos clientes"},
                    {"Editar Clientes", "Permite modificar información de clientes"},
                    {"Eliminar Clientes", "Permite eliminar clientes del sistema"},
                    {"Ver Reportes", "Permite acceder a reportes y estadísticas"},
                    {"Descargar Reportes", "Permite descargar reportes en Excel y PDF"},
                    {"Gestión Usuarios", "Permite gestionar usuarios y sus permisos"},
                    {"Configuración Sistema", "Permite acceder a configuraciones avanzadas"}
                };

            return Ok(funciones);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener funciones");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    [HttpGet("funcion/{funcion}")]
    public async Task<IActionResult> ObtenerPermisosRequeridosPorFuncion(string funcion)
    {
        try
        {
            var funcionesPermisos = new Dictionary<string, List<string>>
                {
                    {"Ver Inventario", new List<string> {"Ver Productos"}},
                    {"Crear Productos", new List<string> {"Editar Productos"}},
                    {"Editar Productos", new List<string> {"Editar Productos"}},
                    {"Eliminar Productos", new List<string> {"Eliminar Productos"}},
                    {"Ver Costos", new List<string> {"Ver Costos"}},
                    {"Ver Utilidades", new List<string> {"Ver Utilidades"}},
                    {"Programar Inventario", new List<string> {"Programar Inventario"}},
                    {"Iniciar Inventario", new List<string> {"Iniciar Inventario"}},
                    {"Completar Inventario", new List<string> {"Completar Inventario"}},
                    {"Ajustar Stock", new List<string> {"Ajustar Stock"}},
                    {"Ver Facturación", new List<string> {"Ver Facturación"}},
                    {"Crear Facturas", new List<string> {"Crear Facturas"}},
                    {"Completar Facturas", new List<string> {"CompletarFacturas"}},
                    {"Editar Facturas", new List<string> {"EditarFacturas"}},
                    {"Anular Facturas", new List<string> {"AnularFacturas"}},
                    {"Ver Clientes", new List<string> {"Ver Clientes"}},
                    {"Crear Clientes", new List<string> {"Crear Clientes"}},
                    {"Editar Clientes", new List<string> {"Editar Clientes"}},
                    {"Eliminar Clientes", new List<string> {"Eliminar Clientes"}},
                    {"Ver Reportes", new List<string> {"Ver Reportes"}},
                    {"Descargar Reportes", new List<string> {"Descargar Reportes"}},
                    {"Gestión Usuarios", new List<string> {"Gestion Usuarios"}},
                    {"Configuración Sistema", new List<string> {"Configuracion Sistema"}}
                };

            if (funcionesPermisos.ContainsKey(funcion))
            {
                return Ok(funcionesPermisos[funcion]);
            }

            return Ok(new List<string>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener permisos requeridos para función {Funcion}", funcion);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    [HttpPost("solicitar")]
    public async Task<IActionResult> SolicitarPermisos([FromBody] SolicitudPermisosRequest request)
    {
        try
        {
            var usuarioId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(usuarioId))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            // Crear notificación para el administrador usando el servicio
            await _notificacionService.CrearNotificacionAsync(
                usuarioId: 1, // ID del administrador
                titulo: "Solicitud de Permisos",
                mensaje: $"El usuario {User.Identity.Name} solicita permisos para: {request.Funcion}. Justificación: {request.Justificacion}",
                tipo: "SolicitudPermisos",
                icono: "fas fa-user-shield"
            );

            return Ok(new { success = true, message = "Solicitud enviada correctamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar solicitud de permisos");
            return StatusCode(500, new { success = false, message = "Error interno del servidor" });
        }
    }
    #endregion

    #region Verificación de Permisos (Sistema Global)
    /// <summary>
    /// Verifica si el usuario actual tiene un permiso específico
    /// GET: api/Permisos/verificar/{permiso}
    /// </summary>
    [HttpGet("verificar/{permiso}")]
    [Authorize] // Requiere autenticación
    public async Task<IActionResult> VerificarPermiso(string permiso)
    {
        try
        {
            _logger.LogInformation("🔍 Verificando permiso {Permiso} para usuario {Usuario}",
                permiso, User.Identity?.Name ?? "Anónimo");

            var tienePermiso = await this.TienePermisoAsync(_permisosService, permiso);

            return Ok(new
            {
                tienePermiso = tienePermiso,
                permiso = permiso,
                usuario = User.Identity?.Name ?? "Anónimo",
                timestamp = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar permiso {Permiso}", permiso);
            return Ok(new { tienePermiso = false }); // Por seguridad, denegar en caso de error
        }
    }

    /// <summary>
    /// Verifica múltiples permisos de una vez (optimización para páginas complejas)
    /// POST: api/Permisos/verificar-multiples
    /// </summary>
    [HttpPost("verificar-multiples")]
    [Authorize]
    public async Task<IActionResult> VerificarMultiplesPermisos([FromBody] List<string> permisos)
    {
        try
        {
            _logger.LogInformation("🔍 Verificando {Cantidad} permisos para usuario {Usuario}",
                permisos.Count, User.Identity?.Name ?? "Anónimo");

            var resultados = new Dictionary<string, bool>();

            foreach (var permiso in permisos)
            {
                var tienePermiso = await this.TienePermisoAsync(_permisosService, permiso);
                resultados[permiso] = tienePermiso;
            }

            return Ok(new
            {
                permisos = resultados,
                usuario = User.Identity?.Name ?? "Anónimo",
                timestamp = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar múltiples permisos");
            return StatusCode(500, new { message = "Error al verificar permisos" });
        }
    }

    /// <summary>
    /// Obtiene todos los permisos del usuario actual (útil para debugging)
    /// GET: api/Permisos/mis-permisos
    /// </summary>
    [HttpGet("mis-permisos")]
    [Authorize]
    public async Task<IActionResult> ObtenerMisPermisos()
    {
        try
        {
            var userId = _permisosService.ObtenerUsuarioId(User);
            if (userId == null)
            {
                return BadRequest(new { message = "No se pudo obtener el ID del usuario" });
            }

            var permisos = await _permisosService.ObtenerPermisosUsuarioAsync(userId.Value);

            return Ok(new
            {
                permisos = permisos,
                usuario = User.Identity?.Name ?? "Anónimo",
                userId = userId.Value,
                timestamp = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener permisos del usuario");
            return StatusCode(500, new { message = "Error al obtener permisos" });
        }
    }

    /// <summary>
    /// Endpoint para verificar si el usuario es administrador (útil para el frontend)
    /// GET: api/Permisos/es-administrador
    /// </summary>
    [HttpGet("es-administrador")]
    [Authorize]
    public async Task<IActionResult> EsAdministrador()
    {
        try
        {
            var esAdmin = await _permisosService.EsAdministradorAsync(User);

            return Ok(new
            {
                esAdministrador = esAdmin,
                usuario = User.Identity?.Name ?? "Anónimo",
                timestamp = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar si es administrador");
            return Ok(new { esAdministrador = false });
        }
    }
    #endregion
}