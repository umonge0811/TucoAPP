
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text;
using Tuco.Clases.Models;

namespace GestionLlantera.Web.Services
{
    public class ClientesService : IClientesService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ClientesService> _logger;

        public ClientesService(IHttpClientFactory httpClientFactory, ILogger<ClientesService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        public async Task<List<Cliente>> ObtenerTodosAsync(string jwtToken = null)
        {
            try
            {
                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync("api/Clientes");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error obteniendo clientes: {StatusCode}", response.StatusCode);
                    return new List<Cliente>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var clientes = JsonConvert.DeserializeObject<List<Cliente>>(content) ?? new List<Cliente>();

                return clientes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener clientes");
                return new List<Cliente>();
            }
        }

        public async Task<Cliente> ObtenerPorIdAsync(int id, string jwtToken = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync($"api/Clientes/{id}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error obteniendo cliente {Id}: {StatusCode}", id, response.StatusCode);
                    return new Cliente();
                }

                var content = await response.Content.ReadAsStringAsync();
                var cliente = JsonConvert.DeserializeObject<Cliente>(content) ?? new Cliente();

                return cliente;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener cliente {Id}", id);
                return new Cliente();
            }
        }

        public async Task<List<Cliente>> BuscarClientesAsync(string termino = "", string jwtToken = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var url = "api/Clientes/buscar";
                if (!string.IsNullOrWhiteSpace(termino))
                {
                    url += $"?termino={Uri.EscapeDataString(termino)}";
                }

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error buscando clientes: {StatusCode}", response.StatusCode);
                    return new List<Cliente>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var clientes = JsonConvert.DeserializeObject<List<Cliente>>(content) ?? new List<Cliente>();

                return clientes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar clientes");
                return new List<Cliente>();
            }
        }

        public async Task<bool> CrearClienteAsync(Cliente cliente, string jwtToken = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonConvert.SerializeObject(cliente);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Clientes", content);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear cliente");
                return false;
            }
        }

        public async Task<bool> ActualizarClienteAsync(int id, Cliente cliente, string jwtToken = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = JsonConvert.SerializeObject(cliente);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/Clientes/{id}", content);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar cliente {Id}", id);
                return false;
            }
        }

        public async Task<bool> EliminarClienteAsync(int id, string jwtToken = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.DeleteAsync($"api/Clientes/{id}");

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar cliente {Id}", id);
                return false;
            }
        }
    }
}
