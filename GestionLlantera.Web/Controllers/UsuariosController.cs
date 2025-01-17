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
                return View(new CreateUsuarioDTO());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar el formulario de creación");
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        public async Task<IActionResult> Crear(CreateUsuarioDTO modelo)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    ViewBag.Roles = await _rolesService.ObtenerTodosLosRoles();
                    return View(modelo);
                }

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
    }
}
