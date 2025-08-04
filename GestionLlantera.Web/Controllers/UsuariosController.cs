using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class UsuariosController : Controller
    {
        private readonly IUsuariosService _usuariosService;
        private readonly IRolesService _rolesService;
        private readonly ILogger<UsuariosController> _logger;

        public UsuariosController(
            IUsuariosService usuariosService,
            IRolesService rolesService,
            ILogger<UsuariosController> logger)
        {
            _usuariosService = usuariosService;
            _rolesService = rolesService;
            _logger = logger;
        }



        [HttpGet]
        public async Task<IActionResult> CrearUsuario()
        {
            try
            {

                var validacion = await this.ValidarPermisoMvcAsync("Gestión Usuarios");
                if (validacion != null) return validacion;

                // Obtener roles usando el servicio
                var roles = await _rolesService.ObtenerTodosLosRoles();
                _logger.LogInformation($"Roles cargados: {roles.Count}");

                // Pasar los roles a la vista usando ViewData o ViewBag
                ViewBag.Roles = roles;

                // Importante: Devolver una vista con un modelo vacío en lugar de null
                return View(new CreateUsuarioDTO());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de crear usuario");
                TempData["Error"] = "Error al cargar el formulario";
                return RedirectToAction(nameof(Index));
            }
        }

        public async Task<IActionResult> Index()
        {
            try
            {

                // ✅ VERIFICAR PERMISO PARA VER PRODUCTOS
                if (!await this.TienePermisoAsync("Gestión Usuarios"))
                {
                    _logger.LogWarning("🚫 Usuario sin permiso 'Gestionar Usuarios' intentó acceder al Modulo Gestion de Usuarios");

                    TempData["AccesoNoAutorizado"] = "Gestión Usuarios";
                    TempData["ModuloAcceso"] = "usuarios";
                    return RedirectToAction("AccessDenied", "Account");
                }

                _logger.LogInformation("Obteniendo lista de usuarios");
                var usuarios = await _usuariosService.ObtenerTodosAsync();

                // Comprobar si usuarios es null y proporcionar una lista vacía en su lugar
                if (usuarios == null)
                {
                    _logger.LogWarning("El servicio de usuarios devolvió NULL");
                    return View(new List<UsuarioDTO>());
                }

                return View(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                TempData["Error"] = "Error al cargar los usuarios";
                // Proporcionar una lista vacía en caso de error
                return View(new List<UsuarioDTO>());
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearUsuario([FromBody] CreateUsuarioDTO modelo)
        {
            try
            {
                var validacion = await this.ValidarPermisoMvcAsync("Gestión Usuarios");
                if (validacion != null) return validacion;

                // Validación básica
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .Select(x => new { 
                            Field = x.Key, 
                            Errors = x.Value.Errors.Select(e => e.ErrorMessage) 
                        });

                    return BadRequest(new
                    {
                        message = "Datos inválidos. Por favor, corrija los errores.",
                        errors = errors
                    });
                }

                // Llamada al servicio para crear el usuario
                var resultado = await _usuariosService.CrearUsuarioAsync(modelo);

                if (resultado.Success)
                {
                    return Ok(new
                    {
                        message = "Usuario creado exitosamente. Se ha enviado un correo de activación al email proporcionado."
                    });
                }

                // Manejar errores específicos del servicio
                return BadRequest(new
                {
                    message = resultado.Message,
                    errorType = resultado.ErrorType,
                    field = resultado.Field
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario: {Email}", modelo.Email);
                return StatusCode(500, new
                {
                    message = "Error interno del servidor al crear el usuario"
                });
            }
        }


        /// <summary>
        /// Obtiene los roles asignados y disponibles para un usuario específico
        /// </summary>
        /// <param name="id">ID del usuario</param>
        [HttpGet]
        public async Task<IActionResult> ObtenerRolesUsuario(int id)
        {
            try
            {
                // Obtener roles mediante el servicio
                var roles = await _usuariosService.ObtenerRolesUsuarioAsync(id);
                return Ok(new { roles = roles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles del usuario {Id}", id);
                return StatusCode(500, new { message = "Error al obtener roles" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AsignarRoles(int id, [FromBody] List<int> rolesIds)
        {
            try
            {
                var resultado = await _usuariosService.AsignarRolesAsync(id, rolesIds);

                if (resultado)
                {
                    return Json(new { success = true, message = "Roles asignados correctamente" });
                }
                else
                {
                    return Json(new { success = false, message = "Error al asignar roles" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al asignar roles al usuario {Id}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> EditarUsuario(int id)
        {
            try
            {
                var validacion = await this.ValidarPermisoMvcAsync("Gestión Usuarios");
                if (validacion != null) return validacion;

                var usuario = await _usuariosService.ObtenerUsuarioPorIdAsync(id);
                if (usuario == null)
                {
                    return NotFound();
                }

                // Obtener roles para la vista
                var roles = await _rolesService.ObtenerTodosLosRoles();
                ViewBag.Roles = roles;

                return View(usuario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuario para editar: {Id}", id);
                return View("Error");
            }
        }

        [HttpPost]
        public async Task<IActionResult> EditarUsuario(int id, [FromBody] CreateUsuarioDTO modelo)
        {
            try
            {
                var resultado = await _usuariosService.EditarUsuarioAsync(id, modelo);

                if (resultado)
                {
                    return Json(new { success = true, message = "Usuario editado correctamente" });
                }
                else
                {
                    return Json(new { success = false, message = "Error al editar usuario" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al editar usuario {Id}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ActivarUsuario(int id)
        {
            try
            {
                var resultado = await _usuariosService.ActivarUsuarioAsync(id);
                return resultado
                    ? Ok(new { message = "Usuario activado exitosamente" })
                    : BadRequest(new { message = "Error al activar usuario" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuario");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DesactivarUsuario(int id)
        {
            try
            {
                var resultado = await _usuariosService.DesactivarUsuarioAsync(id);
                return resultado
                    ? Ok(new { message = "Usuario desactivado exitosamente" })
                    : BadRequest(new { message = "Error al desactivar usuario" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar usuario");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [HttpPut]
        public async Task<IActionResult> EditarUsuario(int id, [FromBody] CreateUsuarioDTO modelo)
        {
            try
            {
                var validacion = await this.ValidarPermisoMvcAsync("Gestión Usuarios");
                if (validacion != null) return validacion;

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var resultado = await _usuariosService.EditarUsuarioAsync(id, modelo);
                return resultado
                    ? Ok(new { message = "Usuario editado exitosamente" })
                    : BadRequest(new { message = "Error al editar usuario" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al editar usuario {Id}", id);
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }
    }
}