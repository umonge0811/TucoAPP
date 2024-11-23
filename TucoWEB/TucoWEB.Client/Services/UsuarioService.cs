using System.Net.Http.Json;
using TucoWEB.Client.Models;

namespace TucoWEB.Client.Services
{
    public class UsuarioService
    {
        private readonly HttpClient _httpClient;

        public UsuarioService(HttpClient httpClient)
        {
            _httpClient = httpClient; // Inyecta el cliente HTTP configurado
        }

        // Método para obtener la lista de usuarios
        public async Task<List<Usuario>> ObtenerUsuariosAsync()
        {
            try
            {
                // Llama al endpoint de la API y deserializa la respuesta a una lista de usuarios
                var usuarios = await _httpClient.GetFromJsonAsync<List<Usuario>>("usuarios");
                return usuarios ?? new List<Usuario>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener usuarios: {ex.Message}");
                return new List<Usuario>();
            }
        }
    }
}
