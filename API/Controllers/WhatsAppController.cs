
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WhatsAppController : ControllerBase
    {
        private readonly WhatsAppService _whatsAppService;
        private readonly ILogger<WhatsAppController> _logger;

        public WhatsAppController(WhatsAppService whatsAppService, ILogger<WhatsAppController> logger)
        {
            _whatsAppService = whatsAppService;
            _logger = logger;
        }

        [HttpPost("enviar-mensaje")]
        public async Task<IActionResult> EnviarMensaje([FromBody] EnviarMensajeRequest request)
        {
            try
            {
                _logger.LogInformation("🧪 Prueba de envío de WhatsApp - Número: {Numero}", request.Numero);

                if (string.IsNullOrEmpty(request.Numero) || string.IsNullOrEmpty(request.Mensaje))
                {
                    return BadRequest(new { success = false, message = "Número y mensaje son requeridos" });
                }

                var resultado = await _whatsAppService.EnviarMensajeAsync(request.Numero, request.Mensaje);

                if (resultado)
                {
                    return Ok(new 
                    { 
                        success = true, 
                        message = "Mensaje enviado exitosamente",
                        numero = request.Numero,
                        timestamp = DateTime.Now
                    });
                }
                else
                {
                    return StatusCode(500, new { success = false, message = "Error al enviar el mensaje" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en prueba de WhatsApp");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost("enviar-imagen")]
        public async Task<IActionResult> EnviarImagen([FromBody] EnviarImagenRequest request)
        {
            try
            {
                _logger.LogInformation("🧪 Prueba de envío de imagen - Número: {Numero}", request.Numero);

                if (string.IsNullOrEmpty(request.Numero) || string.IsNullOrEmpty(request.UrlImagen))
                {
                    return BadRequest(new { success = false, message = "Número y URL de imagen son requeridos" });
                }

                var resultado = await _whatsAppService.EnviarImagenAsync(request.Numero, request.UrlImagen);

                if (resultado)
                {
                    return Ok(new 
                    { 
                        success = true, 
                        message = "Imagen enviada exitosamente",
                        numero = request.Numero,
                        timestamp = DateTime.Now
                    });
                }
                else
                {
                    return StatusCode(500, new { success = false, message = "Error al enviar la imagen" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error enviando imagen de WhatsApp");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet("test")]
        public async Task<IActionResult> PruebaRapida()
        {
            try
            {
                _logger.LogInformation("🧪 Ejecutando prueba rápida de WhatsApp");

                // Número de prueba de Costa Rica (puedes cambiarlo por tu número)
                var numeroTest = "64724275"; // Se formateará automáticamente a +50664724275
                var mensajeTest = "Prueba desde la API de Gestión Llantera 🛞";

                var resultado = await _whatsAppService.EnviarMensajeAsync(numeroTest, mensajeTest);

                return Ok(new 
                { 
                    success = resultado,
                    message = resultado ? "Prueba exitosa" : "Prueba falló",
                    numeroUsado = numeroTest,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en prueba rápida");
                return StatusCode(500, new { success = false, message = "Error en prueba rápida" });
            }
        }
    }

    public class EnviarMensajeRequest
    {
        public string Numero { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
    }

    public class EnviarImagenRequest
    {
        public string Numero { get; set; } = string.Empty;
        public string UrlImagen { get; set; } = string.Empty;
    }
}
