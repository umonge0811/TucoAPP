using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using TucoMAUI.DTO;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace TucoMAUI.Services
{
    public class UsuarioService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<UsuarioService> _logger;

        public UsuarioService(IHttpClientFactory httpClientFactory, ILogger<UsuarioService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<List<UsuarioDTO>> GetUsuariosAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient("TucoApi");
                var response = await client.GetAsync("api/Usuarios/usuarios");

                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };

                    var content = await response.Content.ReadAsStringAsync();
                    // Logger.LogInformation($"Respuesta recibida: {content}");

                    return JsonSerializer.Deserialize<List<UsuarioDTO>>(content, options);
                }

                return new List<UsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener usuarios: {ex.Message}");
                return new List<UsuarioDTO>();
            }
        }
    }
}
