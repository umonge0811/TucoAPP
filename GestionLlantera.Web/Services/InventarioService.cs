using GestionLlantera.Web.Models.DTOs.Inventario;
using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace GestionLlantera.Web.Services
{
    public class InventarioService : IInventarioService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<InventarioService> _logger;

        public InventarioService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<InventarioService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        // Obtener todos los productos
        public async Task<List<ProductoDTO>> ObtenerProductosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("api/Inventario/productos");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var productos = JsonConvert.DeserializeObject<List<ProductoDTO>>(content);
                return productos ?? new List<ProductoDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener productos");
                throw;
            }
        }

        // Obtener un producto por ID
        public async Task<ProductoDTO> ObtenerProductoPorIdAsync(int id)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/Inventario/productos/{id}");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var producto = JsonConvert.DeserializeObject<ProductoDTO>(content);
                return producto ?? new ProductoDTO();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto por ID: {Id}", id);
                throw;
            }
        }

        // Agregar un producto nuevo
        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes)
        {
            try
            {
                // Primero crear el producto sin imágenes
                var productoJson = JsonConvert.SerializeObject(producto);
                var productoContent = new StringContent(productoJson, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Inventario/productos", productoContent);
                response.EnsureSuccessStatusCode();

                var resultado = await response.Content.ReadFromJsonAsync<dynamic>();
                int productoId = resultado.productoId;

                // Si hay imágenes, subirlas
                if (imagenes != null && imagenes.Count > 0)
                {
                    var exito = await SubirImagenesProductoAsync(productoId, imagenes);
                    if (!exito)
                    {
                        _logger.LogWarning("No se pudieron subir algunas imágenes del producto {Id}", productoId);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar producto");
                throw;
            }
        }

        // Método privado para subir imágenes
        private async Task<bool> SubirImagenesProductoAsync(int productoId, List<IFormFile> imagenes)
        {
            try
            {
                var formData = new MultipartFormDataContent();

                foreach (var imagen in imagenes)
                {
                    if (imagen.Length > 0)
                    {
                        var streamContent = new StreamContent(imagen.OpenReadStream());
                        streamContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);
                        formData.Add(streamContent, "imagenes", imagen.FileName);
                    }
                }

                var response = await _httpClient.PostAsync($"api/Inventario/productos/{productoId}/imagenes", formData);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir imágenes para el producto {Id}", productoId);
                return false;
            }
        }
    }
}