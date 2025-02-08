using GestionLlantera.Web.Models.ViewModels;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Controllers
{
    public class ActivacionController : Controller
    {
        private readonly IAuthService _authService;
        private readonly ILogger<ActivacionController> _logger;

        public ActivacionController(IAuthService authService, ILogger<ActivacionController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpGet]
        [Route("Activacion/ActivarCuenta/{token}")]
        public async Task<IActionResult> ActivarCuenta(string token)
        {
            try
            {
                var resultado = await _authService.CheckUsuarioActivo(token);
                bool activo = resultado.activo;
                bool expirado = resultado.expirado;

                if (expirado)
                {
                    TempData["Error"] = "El enlace de activación ha expirado.";
                    return RedirectToAction("Index", "Home");
                }

                var modelo = new ActivacionCuentaViewModel
                {
                    Token = token,
                    TokenExpirado = expirado,
                    CuentaActiva = activo
                };

                return View(modelo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar vista de activación");
                TempData["Error"] = "Error al procesar la activación de la cuenta.";
                return RedirectToAction("Error", "Home");
            }
        }


        // Este método se llamará cuando el usuario haga clic en el boton de activar cuenta despues de colocar las contraseñas
        // Método que maneja el POST del formulario
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ActivarCuenta(ActivacionCuentaViewModel modelo)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return View(modelo);
                }

                // Primero activamos la cuenta
                var resultadoActivacion = await _authService.ActivarCuenta(modelo.Token);
                if (!resultadoActivacion)
                {
                    ModelState.AddModelError("", "No se pudo activar la cuenta. Por favor, inténtelo de nuevo.");
                    return View(modelo);
                }

                // Si la activación fue exitosa, procedemos a cambiar la contraseña
                var resultadoCambioContraseña = await _authService.CambiarContrasena(modelo.Token, modelo.NuevaContrasena);
                if (!resultadoCambioContraseña)
                {
                    ModelState.AddModelError("", "La cuenta se activó pero no se pudo establecer la contraseña. Por favor, contacte al administrador.");
                    return View(modelo);
                }

                // Si todo fue exitoso
                TempData["Success"] = "¡Cuenta activada y contraseña establecida exitosamente! Ya puedes iniciar sesión.";
                return RedirectToAction("Login", "Account");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar la activación y cambio de contraseña");
                ModelState.AddModelError("", "Ocurrió un error al procesar la solicitud.");
                return View(modelo);
            }
        }


        // Método para solicitar nuevo token
        [HttpPost("solicitar-nuevo-token")]
        public async Task<IActionResult> SolicitarNuevoToken([FromBody] string token)
        {
            try
            {
                var resultado = await _authService.RegenerarToken(token);

                if (resultado)
                {
                    return Ok(new { message = "Se ha enviado un nuevo enlace de activación a su correo." });
                }

                return BadRequest(new { message = "Error al solicitar nuevo token." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al solicitar nuevo token");
                return StatusCode(500, new { message = "Error al procesar la solicitud." });
            }
        }
    }
}
