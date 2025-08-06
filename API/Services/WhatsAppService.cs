
using RestSharp;
using System.Text.Json;

namespace API.Services
{
    public class WhatsAppService
    {
        private readonly ILogger<WhatsAppService> _logger;
        private readonly string _token;
        private readonly string _apiUrl;

        public WhatsAppService(ILogger<WhatsAppService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _token = configuration["WhatsApp:Token"] ?? "tutoken"; // Token por defecto para pruebas
            _apiUrl = configuration["WhatsApp:ApiUrl"] ?? "https://script.google.com/macros/s/AKfycbyoBhxuklU5D3LTguTcYAS85klwFINHxxd-FroauC4CmFVvS0ua/exec";
        }

        public async Task<bool> EnviarMensajeAsync(string numero, string mensaje)
        {
            try
            {
                _logger.LogInformation("📱 Enviando mensaje de WhatsApp a: {Numero}", numero);

                var client = new RestClient(_apiUrl);
                var request = new RestRequest("", Method.Post);
                
                request.AddHeader("Content-Type", "application/json");

                var payload = new
                {
                    op = "registermessage",
                    token_qr = _token,
                    mensajes = new[]
                    {
                        new { numero = numero, mensaje = mensaje }
                    }
                };

                var jsonPayload = JsonSerializer.Serialize(payload);
                request.AddParameter("application/json", jsonPayload, ParameterType.RequestBody);

                _logger.LogInformation("📤 Enviando payload: {Payload}", jsonPayload);

                var response = await client.ExecuteAsync(request);

                if (response.IsSuccessful)
                {
                    _logger.LogInformation("✅ Mensaje enviado exitosamente. Respuesta: {Response}", response.Content);
                    return true;
                }
                else
                {
                    _logger.LogError("❌ Error enviando mensaje. StatusCode: {StatusCode}, Content: {Content}", 
                        response.StatusCode, response.Content);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción enviando mensaje de WhatsApp");
                return false;
            }
        }

        public async Task<bool> EnviarImagenAsync(string numero, string urlImagen)
        {
            try
            {
                _logger.LogInformation("📱🖼️ Enviando imagen de WhatsApp a: {Numero}", numero);

                var client = new RestClient(_apiUrl);
                var request = new RestRequest("", Method.Post);
                
                request.AddHeader("Content-Type", "application/json");

                var payload = new
                {
                    op = "registermessage",
                    token_qr = _token,
                    mensajes = new[]
                    {
                        new { numero = numero, url = urlImagen }
                    }
                };

                var jsonPayload = JsonSerializer.Serialize(payload);
                request.AddParameter("application/json", jsonPayload, ParameterType.RequestBody);

                var response = await client.ExecuteAsync(request);

                if (response.IsSuccessful)
                {
                    _logger.LogInformation("✅ Imagen enviada exitosamente");
                    return true;
                }
                else
                {
                    _logger.LogError("❌ Error enviando imagen. StatusCode: {StatusCode}", response.StatusCode);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción enviando imagen de WhatsApp");
                return false;
            }
        }
    }
}
