using API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using tuco.Utilities;
using Tuco.Clases.Utilities;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;
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
    IPermisosService _permisosService; // ← AGREGAR ESTA LÍNEA
    ILogger<PermisosController> _logger; // ← AGREGAR ESTA LÍNEA

    public PermisosController(
    TucoContext context,
    IHttpClientFactory httpClientFactory,
    IPermisosService permisosService, // ← AGREGAR ESTE PARÁMETRO
    ILogger<PermisosController> logger) // ← AGREGAR ESTE PARÁMETRO
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient("TucoApi");
        _permisosService = permisosService; // ← AGREGAR ESTA ASIGNACIÓN
        _logger = logger; // ← AGREGAR ESTA ASIGNACIÓN
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

    [HttpGet("funciones")]
    public async Task<ActionResult<Dictionary<string, string>>> ObtenerFunciones()
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
            return StatusCode(500, new { message = "Error interno del servidor", details = ex.Message });
        }
    }

    [HttpGet("por-categoria")]
    public async Task<ActionResult<Dictionary<string, List<PermisoDTO>>>> ObtenerPermisosPorCategoria()
    {
        try
        {
            var permisos = await _context.Permisos
                .OrderBy(p => p.Categoria)
                .ThenBy(p => p.NombrePermiso)
                .ToListAsync();

            var permisosPorCategoria = permisos
                .GroupBy(p => p.Categoria ?? "General")
                .ToDictionary(g => g.Key, g => g.Select(p => new PermisoDTO
                {
                    PermisoId = p.PermisoId,
                    NombrePermiso = p.NombrePermiso,
                    DescripcionPermiso = p.DescripcionPermiso,
                    Categoria = p.Categoria
                }).ToList());

            return Ok(permisosPorCategoria);
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("solicitar-permiso")]
    public async Task<IActionResult> SolicitarPermiso([FromBody] object solicitud)
    {
        try
        {
            // Aquí podrías implementar la lógica para crear una notificación
            // Por ahora solo retornamos éxito
            var notificacion = new tuco.Clases.Models.Notificacion
            {
                UsuarioId = 1, // ID del administrador
                Titulo = "Solicitud de Permiso",
                Mensaje = $"El usuario {User.Identity?.Name ?? "Anónimo"} solicita el permiso '{solicitud.GetType().GetProperty("permiso")?.GetValue(solicitud, null)}'. Justificación: {solicitud.GetType().GetProperty("justificacion")?.GetValue(solicitud, null)}",
                FechaCreacion = DateTime.Now,
                Leida = false,
                Tipo = "SolicitudPermiso"
            };

            _context.Notificaciones.Add(notificacion);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Solicitud enviada al administrador" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
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