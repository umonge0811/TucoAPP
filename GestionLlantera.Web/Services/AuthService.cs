// Services/AuthService.cs
using GestionLlantera.Web.Models;
using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Models.ViewModels;
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    public class AuthService : IAuthService
    {
        private readonly IHttpClientFactory _clientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IHttpClientFactory clientFactory,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _clientFactory = clientFactory; ;
            _configuration = configuration;
            _logger = logger;

        }

        

        public async Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(LoginViewModel model)
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                var response = await client.PostAsJsonAsync("/api/auth/login", new
                {
                    email = model.Email,
                    contrasena = model.Contrasena
                });

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<LoginResponseDTO>();
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

        // Verificar si el usuario está activo
        public async Task<(bool activo, bool expirado)> CheckUsuarioActivo(string token)
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                var response = await client.GetAsync($"/api/auth/check-usuario-activo?token={token}");

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<UsuarioActivoDTO>();
                    return (result.Active, result.TokenExpirado);
                }

                return (false, true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar estado de usuario");
                throw;
            }
        }


        // Activar la cuenta del usuario
        public async Task<bool> ActivarCuenta(string token)
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                var response = await client.GetAsync($"/api/auth/activar-cuenta?token={token}");

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<Tuco.Clases.DTOs.ActivationResponseDTO>();
                    return result?.Message?.Contains("exitosamente") ?? false;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar cuenta");
                throw;
            }
        }


        // Solicitar nuevo token
        public async Task<bool> RegenerarToken(string token)
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                var response = await client.PostAsJsonAsync("/api/auth/regenerar-token", token);

                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                _logger.LogWarning("Error al regenerar token");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al regenerar token");
                throw;
            }
        }

        // Cambiar contraseña durante activación
        public async Task<bool> CambiarContrasena(string token, string nuevaContrasena)
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                var request = new
                {
                    Token = token,
                    NuevaContrasena = nuevaContrasena
                };

                var response = await client.PostAsJsonAsync("/api/auth/CambiarContrasena", request);

                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                _logger.LogWarning("Error al cambiar contraseña");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar contraseña");
                throw;
            }
        }
    }

   
}