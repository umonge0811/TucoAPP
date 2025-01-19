using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace GestionLlantera.Web.Services
{
    public class UsuariosService : IUsuariosService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UsuariosService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public UsuariosService(HttpClient httpClient, ILogger<UsuariosService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<List<UsuarioDTO>> ObtenerTodosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("api/Usuarios/usuarios");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var usuarios = JsonSerializer.Deserialize<List<UsuarioDTO>>(content, _jsonOptions);

                return usuarios ?? new List<UsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                throw;
            }
        }

       

        public async Task<bool> CrearUsuarioAsync(CreateUsuarioDTO usuario)
        {
            try
            {
                var json = JsonSerializer.Serialize(usuario);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/usuarios/registrar-usuario", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                throw;
            }
        }

        public async Task<List<RolUsuarioDTO>> ObtenerRolesUsuarioAsync(int usuarioId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/Usuarios/usuarios/{usuarioId}/roles");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var roles = JsonSerializer.Deserialize<List<RolUsuarioDTO>>(content, _jsonOptions);

                return roles ?? new List<RolUsuarioDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles del usuario");
                throw;
            }
        }

        public async Task<bool> AsignarRolesAsync(int usuarioId, List<int> rolesIds)
        {
            try
            {
                var json = JsonSerializer.Serialize(rolesIds);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{usuarioId}/roles", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al asignar roles");
                throw;
            }
        }

        public async Task<bool> ActivarUsuarioAsync(int id)
        {
            try
            {
                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{id}/activar", null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuario");
                throw;
            }
        }

        public async Task<bool> DesactivarUsuarioAsync(int id)
        {
            try
            {
                var response = await _httpClient.PostAsync($"api/Usuarios/usuarios/{id}/desactivar", null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar usuario");
                throw;
            }
        }
    }
}