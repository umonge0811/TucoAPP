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

        // Este método se llamará cuando el usuario haga clic en el enlace del correo
        // Método que maneja el POST del formulario
        [HttpPost("activar-cuenta")]
        public async Task<IActionResult> ActivarCuenta(ActivacionCuentaViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return View(model);
                }

                // Primero activamos la cuenta
                var activacionExitosa = await _authService.ActivarCuenta(model.Token);

                if (!activacionExitosa)
                {
                    ModelState.AddModelError("", "Error al activar la cuenta. Por favor, intente nuevamente.");
                    return View(model);
                }

                // Si la activación fue exitosa, cambiamos la contraseña
                var cambioContrasenaExitoso = await _authService.CambiarContrasena(model.Token, model.NuevaContrasena);

                if (!cambioContrasenaExitoso)
                {
                    ModelState.AddModelError("", "Error al establecer la contraseña. Por favor, intente nuevamente.");
                    return View(model);
                }

                // Si todo fue exitoso, redirigimos al login con mensaje de éxito
                TempData["SuccessMessage"] = "Cuenta activada exitosamente. Ya puede iniciar sesión.";
                return RedirectToAction("Login", "Account");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el proceso de activación de cuenta");
                ModelState.AddModelError("", "Ocurrió un error inesperado. Por favor, intente nuevamente.");
                return View(model);
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
