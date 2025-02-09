// Services/AuthService.cs
using GestionLlantera.Web.Models;
using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Models.ViewModels;
using GestionLlantera.Web.Services.Interfaces;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models.Password;

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


        #region Login
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

        #endregion

        #region CheckUsuarioActivo
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
        #endregion

        #region ActivarCuenta
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
                    // Guardamos el token que se usará para el cambio de contraseña
                    if (result?.Token != null)
                    {
                        // Aquí podrías guardarlo en TempData o devolverlo para su uso
                        return true;
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar cuenta");
                throw;
            }
        }
        #endregion

        #region RegenerarToken
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
        #endregion

        #region CambiarContrasena ACTIVACION
        // Cambiar contraseña durante activación
        public async Task<bool> CambiarContrasena(string token, string nuevaContrasena)
        {
            try
            {
                _logger.LogInformation($"Iniciando cambio de contraseña. Token: {token}");

                var client = _clientFactory.CreateClient("APIClient");
                var request = new CambiarContrasenaRequest
                {
                    Token = token,
                    NuevaContrasena = nuevaContrasena
                };

                // Log del contenido que vamos a enviar
                _logger.LogInformation($"Request Content: Token={request.Token}, NuevaContrasena={request.NuevaContrasena}");

                var response = await client.PostAsJsonAsync("api/auth/CambiarContrasenaActivacion", request);

                // Log detallado de la respuesta
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Status Code: {response.StatusCode}");
                _logger.LogInformation($"Response Content: {responseContent}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Contraseña cambiada exitosamente");
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar contraseña");
                throw;
            }
        }
        #endregion

        #region CambiarContrasena RECUPERACION
        public async Task<bool> SolicitarRecuperacion(string email)
        {
            try
            {
                var client = _clientFactory.CreateClient("APIClient");
                var response = await client.PostAsJsonAsync("/api/auth/solicitar-recuperacion",
                    new { email = email });

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al solicitar recuperación de contraseña");
                return false;
            }
        }

        // En GestionLlantera.Web/Services/AuthService.cs
        public async Task<bool> RestablecerContrasena(string token, string nuevaContrasena)
        {
            try
            {
                _logger.LogInformation("Iniciando solicitud de restablecimiento de contraseña");

                var client = _clientFactory.CreateClient("APIClient");
                var request = new
                {
                    Token = token,
                    NuevaContrasena = nuevaContrasena
                };

                var response = await client.PostAsJsonAsync("/api/auth/restablecer-contrasena", request);

                // Log de la respuesta
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Respuesta del servidor: {response.StatusCode}, Contenido: {responseContent}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Contraseña restablecida exitosamente");
                    return true;
                }

                _logger.LogWarning($"Error al restablecer contraseña. StatusCode: {response.StatusCode}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al intentar restablecer la contraseña");
                return false;
            }
        }
        #endregion
    }



}