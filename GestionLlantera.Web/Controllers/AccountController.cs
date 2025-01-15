using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Models;
using GestionLlantera.Web.Models.ViewModels;

namespace GestionLlantera.Web.Controllers
{
    public class AccountController : Controller
    {
        // Declaración de servicios que usaremos
        private readonly IAuthService _authService;
        private readonly ILogger<AccountController> _logger;

        // Constructor: Inyección de dependencias
        // ASP.NET Core se encarga de crear las instancias de estos servicios
        public AccountController(
            IAuthService authService,
            ILogger<AccountController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        // GET: /Account/Login
        // Este método se ejecuta cuando el usuario accede a la página de login
        public IActionResult Login()
        {
            try
            {
                // Verificar si el usuario ya está autenticado
                if (User.Identity?.IsAuthenticated ?? false)
                {
                    _logger.LogInformation("Usuario ya autenticado, redirigiendo a Home");
                    return RedirectToAction("Index", "Home");
                }

                // Si no está autenticado, mostrar el formulario de login
                return View(new LoginViewModel());
            }
            catch (Exception ex)
            {
                // Registrar cualquier error que ocurra
                _logger.LogError(ex, "Error al cargar la página de login");

                // Almacenar mensaje de error para mostrarlo en la vista
                TempData["Error"] = "Ocurrió un error al cargar la página. Por favor, intente nuevamente.";
                return RedirectToAction("Index", "Home");
            }
        }

        // POST: /Account/Login
        // Este método se ejecuta cuando el usuario envía el formulario de login
        // POST: /Account/Login
        [HttpPost]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return View(model);
                }

                // Intentar login
                var (success, token, errorMessage) = await _authService.LoginAsync(model);

                if (success && !string.IsNullOrEmpty(token))
                {
                    // Agregar mensaje de éxito temporal
                    TempData["Success"] = "Login exitoso! Token: " + token;
                    return RedirectToAction("Index", "Home");
                }

                // Si falló, mostrar el error
                ModelState.AddModelError(string.Empty, errorMessage ?? "Credenciales inválidas");
                return View(model);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, "Error al procesar el login");
                return View(model);
            }
        }
    }
}