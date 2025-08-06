
// ✅ SERVICIO DE AUTENTICACIÓN - CENTRALIZADO CON ApiConfigurationService
// Este servicio gestiona todas las operaciones de autenticación, activación y recuperación de contraseñas
// utilizando URLs centralizadas desde appsettings.json

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
        private readonly ApiConfigurationService _apiConfigService; // ✅ SERVICIO CENTRALIZADO PARA URLs

        // ✅ CONSTRUCTOR: Inyección de dependencias incluyendo el servicio de configuración centralizado
        public AuthService(
            IHttpClientFactory clientFactory,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            ApiConfigurationService apiConfigService) // ✅ NUEVA DEPENDENCIA
        {
            _clientFactory = clientFactory;
            _configuration = configuration;
            _logger = logger;
            _apiConfigService = apiConfigService; // ✅ ASIGNAR SERVICIO CENTRALIZADO
        }

        #region Login
        /// <summary>
        /// ✅ OPERACIÓN: Autenticar usuario con email y contraseña
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="model">Datos de login del usuario</param>
        /// <returns>Resultado de autenticación con token JWT si es exitoso</returns>
        public async Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(LoginViewModel model)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ URL CENTRALIZADA: Construir endpoint usando servicio de configuración
                var loginUrl = _apiConfigService.BuildApiUrl("/api/auth/login");
                
                // ✅ PETICIÓN: Enviar credenciales al endpoint de autenticación
                var response = await client.PostAsJsonAsync(loginUrl, new
                {
                    email = model.Email,
                    contrasena = model.Contrasena
                });

                // ✅ PROCESAMIENTO: Verificar respuesta exitosa
                if (response.IsSuccessStatusCode)
                {
                    // ✅ DESERIALIZACIÓN: Obtener token JWT de la respuesta
                    var result = await response.Content.ReadFromJsonAsync<LoginResponseDTO>();
                    return (true, result?.Token, null);
                }

                // ✅ MANEJO DE ERRORES: Procesar respuesta de error
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Error en el login: {Error}", error);
                return (false, null, "Credenciales inválidas");
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error inesperado
                _logger.LogError(ex, "Error al intentar hacer login");
                return (false, null, "Error al intentar iniciar sesión");
            }
        }
        #endregion

        #region CheckUsuarioActivo
        /// <summary>
        /// ✅ OPERACIÓN: Verificar si el usuario está activo y el token no ha expirado
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="token">Token de verificación del usuario</param>
        /// <returns>Estado de activación y expiración del token</returns>
        public async Task<(bool activo, bool expirado)> CheckUsuarioActivo(string token)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ URL CENTRALIZADA: Construir endpoint de verificación
                var checkUrl = _apiConfigService.BuildApiUrl($"/api/auth/check-usuario-activo?token={token}");
                
                // ✅ PETICIÓN: Verificar estado del usuario
                var response = await client.GetAsync(checkUrl);

                // ✅ PROCESAMIENTO: Analizar respuesta del servidor
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<UsuarioActivoDTO>();
                    return (result.Active, result.TokenExpirado);
                }

                // ✅ DEFAULT: Retornar usuario inactivo con token expirado si hay error
                return (false, true);
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error de verificación
                _logger.LogError(ex, "Error al verificar estado de usuario");
                throw;
            }
        }
        #endregion

        #region ActivarCuenta
        /// <summary>
        /// ✅ OPERACIÓN: Activar cuenta de usuario usando token de activación
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="token">Token de activación enviado por email</param>
        /// <returns>Resultado de la activación</returns>
        public async Task<bool> ActivarCuenta(string token)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ URL CENTRALIZADA: Construir endpoint de activación
                var activarUrl = _apiConfigService.BuildApiUrl($"/api/auth/activar-cuenta?token={token}");
                
                // ✅ PETICIÓN: Solicitar activación de cuenta
                var response = await client.GetAsync(activarUrl);

                // ✅ PROCESAMIENTO: Verificar activación exitosa
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<Tuco.Clases.DTOs.ActivationResponseDTO>();
                    
                    // ✅ VALIDACIÓN: Verificar que se recibió token válido
                    if (result?.Token != null)
                    {
                        // ✅ NOTA: Token disponible para cambio de contraseña posterior
                        return true;
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error de activación
                _logger.LogError(ex, "Error al activar cuenta");
                throw;
            }
        }
        #endregion

        #region RegenerarToken
        /// <summary>
        /// ✅ OPERACIÓN: Solicitar regeneración de token de activación/recuperación
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="token">Token actual para regenerar</param>
        /// <returns>Resultado de la regeneración</returns>
        public async Task<bool> RegenerarToken(string token)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ URL CENTRALIZADA: Construir endpoint de regeneración
                var regenerarUrl = _apiConfigService.BuildApiUrl("/api/auth/regenerar-token");
                
                // ✅ PETICIÓN: Solicitar nuevo token
                var response = await client.PostAsJsonAsync(regenerarUrl, token);

                // ✅ PROCESAMIENTO: Verificar regeneración exitosa
                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                // ✅ LOG DE ADVERTENCIA: Registrar error de regeneración
                _logger.LogWarning("Error al regenerar token");
                return false;
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error inesperado
                _logger.LogError(ex, "Error al regenerar token");
                throw;
            }
        }
        #endregion

        #region CambiarContrasena ACTIVACION
        /// <summary>
        /// ✅ OPERACIÓN: Cambiar contraseña durante proceso de activación de cuenta
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="token">Token de activación válido</param>
        /// <param name="nuevaContrasena">Nueva contraseña del usuario</param>
        /// <returns>Resultado del cambio de contraseña</returns>
        public async Task<bool> CambiarContrasena(string token, string nuevaContrasena)
        {
            try
            {
                // ✅ LOG INICIAL: Registrar inicio del proceso
                _logger.LogInformation($"Iniciando cambio de contraseña. Token: {token}");

                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ PREPARACIÓN: Crear objeto de solicitud
                var request = new CambiarContrasenaRequest
                {
                    Token = token,
                    NuevaContrasena = nuevaContrasena
                };

                // ✅ LOG DE DATOS: Registrar contenido de la solicitud (sin mostrar contraseña)
                _logger.LogInformation($"Request Content: Token={request.Token}, NuevaContrasena=[OCULTA]");

                // ✅ URL CENTRALIZADA: Construir endpoint de cambio de contraseña
                var cambiarUrl = _apiConfigService.BuildApiUrl("/api/auth/CambiarContrasenaActivacion");
                
                // ✅ PETICIÓN: Enviar solicitud de cambio
                var response = await client.PostAsJsonAsync(cambiarUrl, request);

                // ✅ LOG DETALLADO: Registrar detalles de la respuesta
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Status Code: {response.StatusCode}");
                _logger.LogInformation($"Response Content: {responseContent}");

                // ✅ PROCESAMIENTO: Verificar cambio exitoso
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Contraseña cambiada exitosamente");
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error del cambio
                _logger.LogError(ex, "Error al cambiar contraseña");
                throw;
            }
        }
        #endregion

        #region CambiarContrasena RECUPERACION
        /// <summary>
        /// ✅ OPERACIÓN: Solicitar recuperación de contraseña por email
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="email">Email del usuario para recuperar contraseña</param>
        /// <returns>Resultado de la solicitud de recuperación</returns>
        public async Task<bool> SolicitarRecuperacion(string email)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ URL CENTRALIZADA: Construir endpoint de solicitud de recuperación
                var recuperacionUrl = _apiConfigService.BuildApiUrl("/api/auth/solicitar-recuperacion");
                
                // ✅ PETICIÓN: Enviar solicitud de recuperación
                var response = await client.PostAsJsonAsync(recuperacionUrl,
                    new { email = email });

                // ✅ RESULTADO: Retornar éxito basado en código de respuesta
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error de solicitud
                _logger.LogError(ex, "Error al solicitar recuperación de contraseña");
                return false;
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Restablecer contraseña usando token de recuperación
        /// Utiliza URL centralizada desde appsettings.json
        /// </summary>
        /// <param name="token">Token de recuperación enviado por email</param>
        /// <param name="nuevaContrasena">Nueva contraseña del usuario</param>
        /// <returns>Resultado del restablecimiento</returns>
        public async Task<bool> RestablecerContrasena(string token, string nuevaContrasena)
        {
            try
            {
                // ✅ LOG INICIAL: Registrar inicio del restablecimiento
                _logger.LogInformation("Iniciando solicitud de restablecimiento de contraseña");

                // ✅ CONFIGURACIÓN: Crear cliente HTTP con configuración centralizada
                var client = _clientFactory.CreateClient("APIClient");
                
                // ✅ PREPARACIÓN: Crear objeto de solicitud
                var request = new
                {
                    Token = token,
                    NuevaContrasena = nuevaContrasena
                };

                // ✅ URL CENTRALIZADA: Construir endpoint de restablecimiento
                var restablecerUrl = _apiConfigService.BuildApiUrl("/api/auth/restablecer-contrasena");
                
                // ✅ PETICIÓN: Enviar solicitud de restablecimiento
                var response = await client.PostAsJsonAsync(restablecerUrl, request);

                // ✅ LOG DE RESPUESTA: Registrar detalles de la respuesta
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Respuesta del servidor: {response.StatusCode}, Contenido: {responseContent}");

                // ✅ PROCESAMIENTO: Verificar restablecimiento exitoso
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Contraseña restablecida exitosamente");
                    return true;
                }

                // ✅ LOG DE ADVERTENCIA: Registrar error del restablecimiento
                _logger.LogWarning($"Error al restablecer contraseña. StatusCode: {response.StatusCode}");
                return false;
            }
            catch (Exception ex)
            {
                // ✅ LOG DE EXCEPCIÓN: Registrar error inesperado
                _logger.LogError(ex, "Error al intentar restablecer la contraseña");
                return false;
            }
        }
        #endregion
    }
}
