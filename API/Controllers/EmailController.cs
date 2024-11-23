using API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmailController : ControllerBase
    {
        private readonly EmailService _emailService;
        public EmailController(EmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpPost("enviar-correo")]
        public async Task<IActionResult> EnviarCorreo([FromBody] string email)
        {
            try
            {
                var subject = "Activa tu cuenta";
                var htmlContent = "<p>Haz clic en el siguiente enlace para activar tu cuenta:</p>" +
                                  "<a href='https://tu-sitio.com/activar?token=12345'>Activar cuenta</a>";

                await _emailService.EnviarCorreoAsync(email, subject, htmlContent);

                return Ok(new { Message = "Correo enviado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
