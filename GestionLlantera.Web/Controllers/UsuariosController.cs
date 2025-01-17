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
                // Agrega log para debug
                _logger.LogInformation("Intentando obtener lista de usuarios");

                var usuarios = await _usuariosService.ObtenerTodosAsync();

                // Log del resultado
                _logger.LogInformation($"Se obtuvieron {usuarios.Count} usuarios");

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
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de creación de usuario");
                TempData["Error"] = "Error al cargar el formulario de creación";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CreateUsuarioDTO modelo)
        {
            if (!ModelState.IsValid)
            {
                ViewBag.Roles = await _rolesService.ObtenerTodosLosRoles();
                return View(modelo);
            }

            try
            {
                var resultado = await _usuariosService.CrearUsuarioAsync(modelo);
                if (resultado)
                {
                    TempData["Success"] = "Usuario creado exitosamente";
                    return RedirectToAction(nameof(Index));
                }

                ModelState.AddModelError("", "Error al crear el usuario");
                ViewBag.Roles = await _rolesService.ObtenerTodosLosRoles();
                return View(modelo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                TempData["Error"] = "Error al crear el usuario";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpGet("roles/{id}")] // Ruta: /Usuarios/roles/{id}
        public async Task<IActionResult> ObtenerRoles(int id)
        {
            try
            {
                _logger.LogInformation($"Obteniendo roles para usuario {id}");
                var response = await _usuariosService.ObtenerRolesUsuarioAsync(id);
                return Ok(new { roles = response }); // Cambiado a Ok() para consistencia
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles del usuario");
                return StatusCode(500, new { error = "Error al obtener roles" });
            }
        }


        [HttpPost("roles/{id}")] // Ruta: /Usuarios/roles/{id}
        public async Task<IActionResult> GuardarRoles(int id, [FromBody] List<int> rolesIds)
        {
            try
            {
                _logger.LogInformation($"Guardando roles para usuario {id}: {string.Join(", ", rolesIds)}");
                var resultado = await _usuariosService.AsignarRolesAsync(id, rolesIds);
                if (resultado)
                {
                    _logger.LogInformation($"Roles actualizados exitosamente para usuario {id}");
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

        [HttpPost("{id}/activar")] // Ruta: /Usuarios/{id}/activar
        public async Task<IActionResult> Activar(int id)
        {
            try
            {
                _logger.LogInformation($"Activando usuario {id}");
                var resultado = await _usuariosService.ActivarUsuarioAsync(id);
                if (resultado)
                {
                    _logger.LogInformation($"Usuario {id} activado exitosamente");
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

        [HttpPost("{id}/desactivar")] // Ruta: /Usuarios/{id}/desactivar
        public async Task<IActionResult> Desactivar(int id)
        {
            try
            {
                _logger.LogInformation($"Desactivando usuario {id}");
                var resultado = await _usuariosService.DesactivarUsuarioAsync(id);
                if (resultado)
                {
                    _logger.LogInformation($"Usuario {id} desactivado exitosamente");
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
