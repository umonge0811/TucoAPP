using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using TucoMAUI.DTO;

namespace TucoMAUI.Services
{
    public class UsuarioService
    {
        HttpClient _httpClient;

        public UsuarioService(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("TucoApi");
        }

        public async Task<List<UsuarioDTO>> ObtenerUsuariosAsync()
        {
            var response = await _httpClient.GetAsync("api/Usuarios/usuarios");
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<List<UsuarioDTO>>() ?? new List<UsuarioDTO>();
        }
    }
}
