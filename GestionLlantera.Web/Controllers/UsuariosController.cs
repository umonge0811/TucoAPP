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
                var roles = await _rolesService.ObtenerTodosLosRoles();
                _logger.LogInformation($"Roles cargados: {roles.Count}");

                // Verificar explícitamente que hay datos
                if (roles != null && roles.Any())
                {
                    foreach (var rol in roles)
                    {
                        _logger.LogInformation($"Rol: {rol.NombreRol}");
                    }
                    ViewBag.Roles = roles;
                }
                else
                {
                    _logger.LogWarning("No se obtuvieron roles de la API");
                    ViewBag.Roles = new List<RoleDTO>();
                }

                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar roles");
                ViewBag.Roles = new List<RoleDTO>();
                return View();
            }
        }

       
        public async Task<IActionResult> Index()
        {
            try
            {
                _logger.LogInformation("Obteniendo lista de usuarios");
                var usuarios = await _usuariosService.ObtenerTodosAsync();
                return View(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                TempData["Error"] = "Error al cargar los usuarios";
                return View(new List<UsuarioDTO>());
            }
        }


        [HttpPost]
        public async Task<IActionResult> CrearUsuario([FromBody] CreateUsuarioDTO modelo)
        {
            try
            {
                // Validación básica
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Llamada al servicio para crear el usuario
                var resultado = await _usuariosService.CrearUsuarioAsync(modelo);

                if (resultado)
                {
                    // Si la creación fue exitosa
                    return Ok(new
                    {
                        message = "Usuario creado exitosamente. Se ha enviado un correo de activación."
                    });
                }

                // Si hubo un error en la creación
                return BadRequest(new
                {
                    message = "No se pudo crear el usuario. Por favor, intente nuevamente."
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
        public async Task<IActionResult> GuardarRoles(int id, [FromBody] List<int> rolesIds)
        {
            try
            {
                var resultado = await _usuariosService.AsignarRolesAsync(id, rolesIds);
                return resultado
                    ? Ok(new { message = "Roles actualizados exitosamente" })
                    : BadRequest(new { message = "Error al actualizar roles" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar roles");
                return StatusCode(500, new { message = "Error interno del servidor" });
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
    }
}

