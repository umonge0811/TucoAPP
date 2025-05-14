// Ubicación: GestionLlantera.Web/Services/InventarioService.cs

using GestionLlantera.Web.Models.DTOs.Inventario;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace GestionLlantera.Web.Services
{
    public class InventarioService : IInventarioService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<InventarioService> _logger;

        public InventarioService(IHttpClientFactory httpClientFactory, ILogger<InventarioService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        public async Task<List<ProductoDTO>> ObtenerProductosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("api/Inventario/productos");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<List<ProductoDTO>>(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener productos");
                return new List<ProductoDTO>();
            }
        }

        public async Task<ProductoDTO> ObtenerProductoPorIdAsync(int id)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/Inventario/productos/{id}");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<ProductoDTO>(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto por ID: {Id}", id);
                return new ProductoDTO();
            }
        }

        // Verificar que el servicio incluya esta lógica para agregar productos con imágenes
        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes)
        {
            try
            {
                // 1. Primero crear el producto básico
                using var content = new StringContent(
                    JsonConvert.SerializeObject(producto),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.PostAsync("api/Inventario/productos", content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Error al crear producto: {response.StatusCode}");
                    return false;
                }

                // 2. Obtener el ID del producto creado
                var responseContent = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                int productoId = resultado.productoId;

                // 3. Si hay imágenes, subirlas como un segundo paso
                if (imagenes != null && imagenes.Any())
                {
                    _logger.LogInformation($"Enviando {imagenes.Count} imágenes para el producto ID {productoId}");

                    using var formContent = new MultipartFormDataContent();

                    foreach (var imagen in imagenes)
                    {
                        var imageContent = new StreamContent(imagen.OpenReadStream());
                        imageContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);

                        // Importante: usar el nombre exacto que la API espera
                        formContent.Add(imageContent, "imagenes", imagen.FileName);
                    }

                    var imageResponse = await _httpClient.PostAsync($"api/Inventario/productos/{productoId}/imagenes", formContent);

                    if (!imageResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning($"Error al subir imágenes: {imageResponse.StatusCode}");
                        // No fallamos todo el proceso si solo fallan las imágenes
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar producto");
                return false;
            }
        }

        public async Task<bool> ActualizarProductoAsync(int id, ProductoDTO producto, List<IFormFile> nuevasImagenes)
        {
            try
            {
                // 1. Actualizar el producto
                var json = JsonConvert.SerializeObject(producto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/Inventario/productos/{id}", content);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error al actualizar producto. Status: {Status}", response.StatusCode);
                    return false;
                }

                // 2. Subir nuevas imágenes si hay alguna
                if (nuevasImagenes != null && nuevasImagenes.Any())
                {
                    using var formContent = new MultipartFormDataContent();
                    foreach (var imagen in nuevasImagenes)
                    {
                        var fileContent = new StreamContent(imagen.OpenReadStream());
                        fileContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);
                        formContent.Add(fileContent, "imagenes", imagen.FileName);
                    }

                    var imagenesResponse = await _httpClient.PostAsync($"api/Inventario/productos/{id}/imagenes", formContent);
                    if (!imagenesResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Error al subir imágenes. Status: {Status}", imagenesResponse.StatusCode);
                        // No fallamos todo el proceso si solo fallan las imágenes
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar producto");
                return false;
            }
        }

        public async Task<bool> AjustarStockAsync(int id, int cantidad, string tipoAjuste)
        {
            try
            {
                var ajuste = new
                {
                    Cantidad = cantidad,
                    TipoAjuste = tipoAjuste
                };

                var json = JsonConvert.SerializeObject(ajuste);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"api/Inventario/productos/{id}/ajuste-stock", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ajustar stock. Producto ID: {Id}", id);
                return false;
            }
        }
    }
}