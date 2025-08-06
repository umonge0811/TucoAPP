
using RestSharp;
using System.Text.Json;
using System.Linq;

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

        /// <summary>
        /// Formatea un número de teléfono para Costa Rica (+506)
        /// </summary>
        /// <param name="numero">Número original</param>
        /// <returns>Número formateado con código de país +506</returns>
        private string FormatearNumeroCostaRica(string numero)
        {
            if (string.IsNullOrEmpty(numero))
                return numero;

            // Limpiar el número de espacios, guiones y otros caracteres
            var numeroLimpio = numero.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "").Replace("+", "");

            // Si ya empieza con 506, agregar el +
            if (numeroLimpio.StartsWith("506"))
            {
                return "+" + numeroLimpio;
            }

            // Si es un número local de 8 dígitos de Costa Rica, agregar +506
            if (numeroLimpio.Length == 8 && numeroLimpio.All(char.IsDigit))
            {
                return "+506" + numeroLimpio;
            }

            // Si no cumple los criterios anteriores, devolver tal como llegó con + al inicio si no lo tiene
            return numeroLimpio.StartsWith("+") ? numeroLimpio : "+" + numeroLimpio;
        }

        public async Task<bool> EnviarMensajeAsync(string numero, string mensaje)
        {
            try
            {
                // Formatear el número para Costa Rica
                var numeroFormateado = FormatearNumeroCostaRica(numero);
                _logger.LogInformation("📱 Enviando mensaje de WhatsApp a: {NumeroOriginal} -> {NumeroFormateado}", numero, numeroFormateado);

                var client = new RestClient(_apiUrl);
                var request = new RestRequest("", Method.Post);
                
                request.AddHeader("Content-Type", "application/json");

                var payload = new
                {
                    op = "registermessage",
                    token_qr = _token,
                    mensajes = new[]
                    {
                        new { numero = numeroFormateado, mensaje = mensaje }
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
                // Formatear el número para Costa Rica
                var numeroFormateado = FormatearNumeroCostaRica(numero);
                _logger.LogInformation("📱🖼️ Enviando imagen de WhatsApp a: {NumeroOriginal} -> {NumeroFormateado}", numero, numeroFormateado);

                var client = new RestClient(_apiUrl);
                var request = new RestRequest("", Method.Post);
                
                request.AddHeader("Content-Type", "application/json");

                var payload = new
                {
                    op = "registermessage",
                    token_qr = _token,
                    mensajes = new[]
                    {
                        new { numero = numeroFormateado, url = urlImagen }
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
