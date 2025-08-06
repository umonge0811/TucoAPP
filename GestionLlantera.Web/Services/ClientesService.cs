
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text;
using tuco.Clases.Models;
using Tuco.Clases.Models;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestionar clientes del sistema
    /// Utiliza ApiConfigurationService para URLs centralizadas
    /// </summary>
    public class ClientesService : IClientesService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ClientesService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApiConfigurationService _apiConfig;

        /// <summary>
        /// Constructor con inyección del servicio de configuración centralizado
        /// </summary>
        public ClientesService(
            IHttpClientFactory httpClientFactory, 
            ILogger<ClientesService> logger,
            IHttpContextAccessor httpContextAccessor,
            ApiConfigurationService apiConfig)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _apiConfig = apiConfig;
        }

        /// <summary>
        /// ✅ CONFIGURACIÓN: Configurar header de autorización con token JWT
        /// </summary>
        private void ConfigurarAuthorizationHeader()
        {
            try
            {
                var token = _httpContextAccessor.HttpContext?.Request.Cookies["JwtToken"];

                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    _logger.LogInformation("🔐 Token JWT configurado en el HttpClient");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se encontró token JWT en cookies");
                    var cookies = _httpContextAccessor.HttpContext?.Request.Cookies;
                    if (cookies != null)
                    {
                        _logger.LogInformation($"🍪 Cookies disponibles: {string.Join(", ", cookies.Keys)}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al configurar el header de autorización");
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Obtener todos los clientes del sistema
        /// </summary>
        public async Task<List<Cliente>> ObtenerTodosAsync(string jwtToken = null)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener clientes");
                }
                else
                {
                    ConfigurarAuthorizationHeader();
                }

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl("Clientes");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error obteniendo clientes: {StatusCode}", response.StatusCode);
                    return new List<Cliente>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"📄 Clientes recibidos: {content.Length} caracteres");

                var clientes = JsonConvert.DeserializeObject<List<Cliente>>(content) ?? new List<Cliente>();

                return clientes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener clientes");
                return new List<Cliente>();
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Obtener cliente específico por ID
        /// </summary>
        public async Task<Cliente> ObtenerPorIdAsync(int id, string jwtToken = null)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener cliente {Id}", id);
                }
                else
                {
                    ConfigurarAuthorizationHeader();
                }

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl($"Clientes/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error obteniendo cliente {Id}: {StatusCode}", id, response.StatusCode);
                    return new Cliente();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"📄 Cliente {id} recibido: {content.Length} caracteres");

                var cliente = JsonConvert.DeserializeObject<Cliente>(content) ?? new Cliente();

                return cliente;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener cliente {Id}", id);
                return new Cliente();
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Buscar clientes por término de búsqueda
        /// </summary>
        public async Task<List<Cliente>> BuscarClientesAsync(string termino = "", string jwtToken = null)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para buscar clientes");
                }
                else
                {
                    ConfigurarAuthorizationHeader();
                }

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl("Clientes/buscar");
                if (!string.IsNullOrWhiteSpace(termino))
                {
                    url += $"?termino={Uri.EscapeDataString(termino)}";
                }
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error buscando clientes: {StatusCode}", response.StatusCode);
                    return new List<Cliente>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"🔍 Búsqueda de clientes completada: {content.Length} caracteres");

                var clientes = JsonConvert.DeserializeObject<List<Cliente>>(content) ?? new List<Cliente>();

                return clientes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al buscar clientes");
                return new List<Cliente>();
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Crear nuevo cliente en el sistema
        /// </summary>
        public async Task<bool> CrearClienteAsync(Cliente cliente, string jwtToken = null)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para crear cliente");
                }
                else
                {
                    ConfigurarAuthorizationHeader();
                }

                var json = JsonConvert.SerializeObject(cliente);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl("Clientes");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Cliente creado exitosamente");
                }
                else
                {
                    _logger.LogError("❌ Error al crear cliente: {StatusCode}", response.StatusCode);
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al crear cliente");
                return false;
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Actualizar cliente existente
        /// </summary>
        public async Task<bool> ActualizarClienteAsync(int id, Cliente cliente, string jwtToken = null)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para actualizar cliente {Id}", id);
                }
                else
                {
                    ConfigurarAuthorizationHeader();
                }

                var json = JsonConvert.SerializeObject(cliente);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl($"Clientes/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PutAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Cliente {Id} actualizado exitosamente", id);
                }
                else
                {
                    _logger.LogError("❌ Error al actualizar cliente {Id}: {StatusCode}", id, response.StatusCode);
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al actualizar cliente {Id}", id);
                return false;
            }
        }

        /// <summary>
        /// ✅ OPERACIÓN: Eliminar cliente del sistema
        /// </summary>
        public async Task<bool> EliminarClienteAsync(int id, string jwtToken = null)
        {
            try
            {
                // ✅ CONFIGURACIÓN: Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para eliminar cliente {Id}", id);
                }
                else
                {
                    ConfigurarAuthorizationHeader();
                }

                // ✅ USAR URL CENTRALIZADA - Construye la URL completa desde configuración
                var url = _apiConfig.GetApiUrl($"Clientes/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.DeleteAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Cliente {Id} eliminado exitosamente", id);
                }
                else
                {
                    _logger.LogError("❌ Error al eliminar cliente {Id}: {StatusCode}", id, response.StatusCode);
                }

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al eliminar cliente {Id}", id);
                return false;
            }
        }
    }
}
