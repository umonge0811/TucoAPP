// Services/AuthService.cs
using GestionLlantera.Web.Models;
using GestionLlantera.Web.Models.ViewModels;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Services
{
    public class AuthService : IAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            // Configurar la URL base desde appsettings.json
            _httpClient.BaseAddress = new Uri(_configuration["ApiSettings:BaseUrl"]!);
        }

        public async Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(LoginViewModel model)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/api/auth/login", new
                {
                    email = model.Email,
                    contrasena = model.Contrasena
                });

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                    return (true, result?.Token, null);
                }

                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Error en el login: {Error}", error);
                return (false, null, "Credenciales inválidas");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al intentar hacer login");
                return (false, null, "Error al intentar iniciar sesión");
            }
        }


    }

    // Clase para deserializar la respuesta de la API
    internal class LoginResponse
    {
        public string? Message { get; set; }
        public string? Token { get; set; }
    }
}