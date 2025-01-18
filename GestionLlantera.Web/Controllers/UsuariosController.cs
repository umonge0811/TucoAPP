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

        [HttpGet]
        public async Task<IActionResult> Crear()
        {
            try
            {
                ViewBag.Roles = await _rolesService.ObtenerTodosLosRoles();
                return View(new CreateUsuarioDTO());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de creación");
                TempData["Error"] = "Error al cargar el formulario";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CreateUsuarioDTO modelo)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var resultado = await _usuariosService.CrearUsuarioAsync(modelo);
                if (resultado)
                {
                    return Ok(new { message = "Usuario creado exitosamente" });
                }
                return BadRequest(new { message = "Error al crear el usuario" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("roles/{id}")]
        public async Task<IActionResult> ObtenerRoles(int id)
        {
            try
            {
                var roles = await _usuariosService.ObtenerRolesUsuarioAsync(id);
                return Ok(new { roles = roles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles del usuario");
                return StatusCode(500, new { error = "Error al obtener roles" });
            }
        }

        [HttpPost("roles/{id}")]
        public async Task<IActionResult> GuardarRoles(int id, [FromBody] List<int> rolesIds)
        {
            try
            {
                _logger.LogInformation($"Guardando roles para usuario {id}: {string.Join(", ", rolesIds)}");
                var resultado = await _usuariosService.AsignarRolesAsync(id, rolesIds);

                if (resultado)
                {
                    return Ok(new { message = "Roles actualizados exitosamente" });
                }

                return BadRequest(new { error = "Error al actualizar roles" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar roles");
                return StatusCode(500, new { error = "Error al guardar roles" });
            }
        }

        [HttpPost("{id}/activar")]
        public async Task<IActionResult> Activar(int id)
        {
            try
            {
                _logger.LogInformation($"Activando usuario {id}");
                var resultado = await _usuariosService.ActivarUsuarioAsync(id);

                if (resultado)
                {
                    return Ok(new { message = "Usuario activado exitosamente" });
                }

                return BadRequest(new { error = "Error al activar usuario" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuario");
                return StatusCode(500, new { error = "Error al activar usuario" });
            }
        }

        [HttpPost("{id}/desactivar")]
        public async Task<IActionResult> Desactivar(int id)
        {
            try
            {
                _logger.LogInformation($"Desactivando usuario {id}");
                var resultado = await _usuariosService.DesactivarUsuarioAsync(id);

                if (resultado)
                {
                    return Ok(new { message = "Usuario desactivado exitosamente" });
                }

                return BadRequest(new { error = "Error al desactivar usuario" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar usuario");
                return StatusCode(500, new { error = "Error al desactivar usuario" });
            }
        }
    }
}

