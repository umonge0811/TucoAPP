using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using API.ServicesAPI.Interfaces;
using API.Extensions;

namespace API.Controllers
{
    /// <summary>
    /// Controlador para probar el sistema de permisos dinámico
    /// ✅ Demuestra cómo usar permisos sin hardcodeo
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Solo requiere estar autenticado
    public class TestPermisosController : ControllerBase
    {
        private readonly IPermisosService _permisosService;
        private readonly ILogger<TestPermisosController> _logger;

        public TestPermisosController(IPermisosService permisosService, ILogger<TestPermisosController> logger)
        {
            _permisosService = permisosService;
            _logger = logger;
        }

        /// <summary>
        /// Endpoint público - solo requiere autenticación
        /// </summary>
        [HttpGet("publico")]
        public IActionResult EndpointPublico()
        {
            return Ok(new
            {
                message = "✅ Este endpoint es accesible para cualquier usuario autenticado",
                usuario = User.Identity?.Name,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint que requiere permiso "VerCostos" - dinámicamente
        /// </summary>
        [HttpGet("ver-costos")]
        public async Task<IActionResult> VerCostos()
        {
            // ✅ VERIFICACIÓN DINÁMICA - Sin hardcodeo
            var validacion = await this.ValidarPermisoAsync(_permisosService, "VerCostos",
                "Solo usuarios con permiso 'VerCostos' pueden ver esta información");
            if (validacion != null) return validacion;

            // Si llegamos aquí, el usuario SÍ tiene el permiso
            return Ok(new
            {
                message = "✅ Tienes permiso para ver costos",
                costoEjemplo = 500.00m,
                permiso = "VerCostos",
                usuario = User.Identity?.Name,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint que requiere permiso "VerUtilidades" - dinámicamente
        /// </summary>
        [HttpGet("ver-utilidades")]
        public async Task<IActionResult> VerUtilidades()
        {
            // ✅ VERIFICACIÓN DINÁMICA
            var validacion = await this.ValidarPermisoAsync(_permisosService, "VerUtilidades");
            if (validacion != null) return validacion;

            return Ok(new
            {
                message = "✅ Tienes permiso para ver utilidades",
                utilidadEjemplo = "25%",
                gananciaEjemplo = 125.00m,
                permiso = "VerUtilidades",
                usuario = User.Identity?.Name,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint que requiere permiso "ProgramarInventario" - dinámicamente
        /// </summary>
        [HttpGet("programar-inventario")]
        public async Task<IActionResult> ProgramarInventario()
        {
            var validacion = await this.ValidarPermisoAsync(_permisosService, "ProgramarInventario");
            if (validacion != null) return validacion;

            return Ok(new
            {
                message = "✅ Tienes permiso para programar inventarios",
                accion = "Crear nuevo inventario programado",
                permiso = "ProgramarInventario",
                usuario = User.Identity?.Name,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint que demuestra verificación de múltiples permisos
        /// </summary>
        [HttpGet("administrador-completo")]
        public async Task<IActionResult> AdministradorCompleto()
        {
            // Verificar que tenga TODOS estos permisos
            var tienePermisos = await this.TieneTodosLosPermisosAsync(_permisosService,
                "VerCostos", "VerUtilidades", "ProgramarInventario");

            if (!tienePermisos)
            {
                return StatusCode(403, new
                {
                    message = "❌ Necesitas todos los permisos de administrador",
                    permisosRequeridos = new[] { "VerCostos", "VerUtilidades", "ProgramarInventario" },
                    usuario = User.Identity?.Name
                });
            }

            return Ok(new
            {
                message = "✅ Eres administrador completo - tienes todos los permisos",
                permisos = new[] { "VerCostos", "VerUtilidades", "ProgramarInventario" },
                usuario = User.Identity?.Name,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint para probar cualquier permiso dinámicamente
        /// </summary>
        [HttpGet("probar-permiso/{nombrePermiso}")]
        public async Task<IActionResult> ProbarPermiso(string nombrePermiso)
        {
            if (string.IsNullOrEmpty(nombrePermiso))
            {
                return BadRequest(new { message = "Debes especificar un nombre de permiso" });
            }

            var tienePermiso = await this.TienePermisoAsync(_permisosService, nombrePermiso);

            return Ok(new
            {
                permiso = nombrePermiso,
                tienePermiso = tienePermiso,
                mensaje = tienePermiso
                    ? $"✅ Tienes el permiso '{nombrePermiso}'"
                    : $"❌ NO tienes el permiso '{nombrePermiso}'",
                usuario = User.Identity?.Name,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint para obtener información completa del usuario actual
        /// </summary>
        [HttpGet("mi-info")]
        public async Task<IActionResult> MiInformacion()
        {
            var info = await this.ObtenerInfoPermisosAsync(_permisosService);

            return Ok(new
            {
                mensaje = "Información completa del usuario actual",
                usuario = info,
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Endpoint específico para probar el permiso "Entregar Pendientes"
        /// </summary>
        [HttpGet("test-entregar-pendientes")]
        public async Task<IActionResult> TestEntregarPendientes()
        {
            var userId = _permisosService.ObtenerUsuarioId(User);

            if (!userId.HasValue)
            {
                return Ok(new
                {
                    mensaje = "Usuario no autenticado",
                    usuarioId = (int?)null,
                    tienePermiso = false,
                    timestamp = DateTime.Now
                });
            }

            var permisos = await _permisosService.ObtenerPermisosUsuarioAsync(userId.Value);
            var tienePermiso = await _permisosService.TienePermisoAsync(User, "Entregar Pendientes");

            return Ok(new
            {
                mensaje = "Diagnóstico del permiso 'Entregar Pendientes'",
                usuarioId = userId,
                permisoBuscado = "Entregar Pendientes",
                tienePermiso = tienePermiso,
                todosLosPermisos = permisos.OrderBy(p => p).ToList(),
                totalPermisos = permisos.Count(),
                coincidenciasExactas = permisos.Where(p => p == "Entregar Pendientes").ToList(),
                coincidenciasParciales = permisos.Where(p => p.Contains("Entregar") || p.Contains("Pendientes")).ToList(),
                usuario = User.Identity?.Name,
                claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList(),
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Diagnóstico completo del flujo de validación de permisos
        /// </summary>
        [HttpGet("diagnóstico-validacion/{permiso}")]
        public async Task<IActionResult> DiagnosticoValidacion(string permiso)
        {
            try
            {
                var resultado = new
                {
                    permisoSolicitado = permiso,
                    usuario = User.Identity?.Name,
                    timestamp = DateTime.Now,
                    pasos = new List<object>()
                };

                var pasos = new List<object>();

                // PASO 1: Verificar autenticación
                pasos.Add(new
                {
                    paso = 1,
                    descripcion = "Verificar autenticación",
                    esAutenticado = User.Identity?.IsAuthenticated ?? false,
                    tipoAutenticacion = User.Identity?.AuthenticationType,
                    nombreUsuario = User.Identity?.Name
                });

                if (!User.Identity?.IsAuthenticated ?? true)
                {
                    return Ok(new
                    {
                        resultado.permisoSolicitado,
                        resultado.usuario,
                        resultado.timestamp,
                        pasos,
                        conclusion = "FALLO: Usuario no autenticado",
                        tienePermiso = false
                    });
                }

                // PASO 2: Obtener ID del usuario
                var userId = _permisosService.ObtenerUsuarioId(User);
                pasos.Add(new
                {
                    paso = 2,
                    descripcion = "Obtener ID del usuario",
                    userId = userId,
                    claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
                });

                if (!userId.HasValue)
                {
                    return Ok(new
                    {
                        resultado.permisoSolicitado,
                        resultado.usuario,
                        resultado.timestamp,
                        pasos,
                        conclusion = "FALLO: No se pudo obtener ID del usuario",
                        tienePermiso = false
                    });
                }

                // PASO 3: Verificar si es administrador
                var esAdministrador = await _permisosService.EsAdministradorAsync(User);
                pasos.Add(new
                {
                    paso = 3,
                    descripcion = "Verificar si es administrador",
                    esAdministrador = esAdministrador,
                    roles = User.Claims.Where(c => c.Type == "role" || c.Type.Contains("role")).Select(c => c.Value).ToList()
                });

                // PASO 4: Obtener permisos del usuario
                var permisosUsuario = await _permisosService.ObtenerPermisosUsuarioAsync(userId.Value);
                pasos.Add(new
                {
                    paso = 4,
                    descripcion = "Obtener permisos del usuario",
                    totalPermisos = permisosUsuario.Count,
                    permisos = permisosUsuario.OrderBy(p => p).ToList(),
                    coincidenciaExacta = permisosUsuario.Contains(permiso),
                    coincidenciasParciales = permisosUsuario.Where(p => 
                        p.Contains(permiso.Split(' ')[0]) || 
                        (permiso.Contains(' ') && p.Contains(permiso.Split(' ')[1]))).ToList()
                });

                // PASO 5: Llamar al método TienePermisoAsync directamente
                var tienePermisoDirecto = await _permisosService.TienePermisoAsync(User, permiso);
                pasos.Add(new
                {
                    paso = 5,
                    descripcion = "Verificar permiso con TienePermisoAsync",
                    tienePermiso = tienePermisoDirecto,
                    metodoUsado = "PermisosService.TienePermisoAsync"
                });

                // PASO 6: Simular ValidarPermisoAsync
                IActionResult? validacionSimulada = null;
                try
                {
                    validacionSimulada = await this.ValidarPermisoAsync(_permisosService, permiso, 
                        "Mensaje de prueba para validación");
                }
                catch (Exception ex)
                {
                    pasos.Add(new
                    {
                        paso = 6,
                        descripcion = "Simular ValidarPermisoAsync",
                        error = ex.Message,
                        stackTrace = ex.StackTrace?.Take(500)
                    });
                }

                pasos.Add(new
                {
                    paso = 6,
                    descripcion = "Simular ValidarPermisoAsync",
                    validacionEsNull = validacionSimulada == null,
                    tipoRespuesta = validacionSimulada?.GetType().Name,
                    interpretacion = validacionSimulada == null ? "TIENE PERMISO" : "NO TIENE PERMISO"
                });

                var conclusionFinal = esAdministrador ? 
                    "TIENE PERMISO (es administrador)" : 
                    (tienePermisoDirecto ? "TIENE PERMISO (permiso específico)" : "NO TIENE PERMISO");

                return Ok(new
                {
                    resultado.permisoSolicitado,
                    resultado.usuario,
                    resultado.timestamp,
                    pasos,
                    resumen = new
                    {
                        userId = userId,
                        esAdministrador = esAdministrador,
                        tienePermisoDirecto = tienePermisoDirecto,
                        totalPermisosUsuario = permisosUsuario.Count,
                        validarPermisoAsyncEsNull = validacionSimulada == null
                    },
                    conclusion = conclusionFinal,
                    tienePermiso = esAdministrador || tienePermisoDirecto
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    error = "Error en diagnóstico",
                    mensaje = ex.Message,
                    stackTrace = ex.StackTrace,
                    timestamp = DateTime.Now
                });
            }
        }
    }
}