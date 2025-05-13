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

        // Método en el servicio InventarioService para agregar un producto
        // En GestionLlantera.Web/Services/InventarioService.cs

        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes)
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de agregar producto: {NombreProducto}", producto.NombreProducto);

                // 1. Crear el producto base
                var productoJson = JsonConvert.SerializeObject(producto);
                var productoContent = new StringContent(productoJson, Encoding.UTF8, "application/json");

                _logger.LogInformation("Enviando solicitud para crear producto: {ProductoJson}", productoJson);

                var response = await _httpClient.PostAsync("api/Inventario/productos", productoContent);
                response.EnsureSuccessStatusCode();

                // 2. Obtener ID del producto creado
                var resultado = await response.Content.ReadFromJsonAsync<dynamic>();
                int productoId = resultado.productoId;

                _logger.LogInformation("Producto creado con ID: {ProductoId}", productoId);

                // 3. Si hay imágenes, subirlas
                if (imagenes != null && imagenes.Count > 0)
                {
                    _logger.LogInformation("Iniciando carga de {CantidadImagenes} imágenes para producto {ProductoId}",
                        imagenes.Count, productoId);

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

                    var imagenesResponse = await _httpClient.PostAsync($"api/Inventario/productos/{productoId}/imagenes", formData);

                    if (!imagenesResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("No se pudieron subir algunas imágenes del producto {ProductoId}", productoId);
                        // Consideramos éxito parcial si al menos el producto se creó
                    }
                }

                _logger.LogInformation("Proceso de agregar producto completado exitosamente: {ProductoId}", productoId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al agregar producto: {NombreProducto}", producto.NombreProducto);
                throw;
            }
        }

        // Método auxiliar para subir imágenes al producto
        private async Task<bool> SubirImagenesProductoAsync(int productoId, List<IFormFile> imagenes)
        {
            try
            {
                // Verificar si hay imágenes para subir
                if (imagenes == null || !imagenes.Any())
                {
                    _logger.LogInformation("No hay imágenes para subir al producto {ProductoId}", productoId);
                    return true;
                }

                // Crear objeto MultipartFormDataContent para las imágenes
                var formData = new MultipartFormDataContent();

                // Agregar cada imagen al form data
                foreach (var imagen in imagenes)
                {
                    if (imagen.Length > 0)
                    {
                        _logger.LogInformation("Preparando imagen {NombreArchivo} ({Tamaño} bytes) para producto {ProductoId}",
                            imagen.FileName, imagen.Length, productoId);

                        // Verificar tipo de archivo para asegurar que sea una imagen
                        if (!EsImagenValida(imagen))
                        {
                            _logger.LogWarning("Tipo de archivo no válido para imagen: {FileName}, {ContentType}",
                                imagen.FileName, imagen.ContentType);
                            continue;
                        }

                        // Crear stream content para la imagen
                        var streamContent = new StreamContent(imagen.OpenReadStream());
                        streamContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);

                        // Agregar al form data
                        formData.Add(streamContent, "imagenes", imagen.FileName);
                    }
                }

                // Si no hay imágenes válidas para subir
                if (formData.Count() == 0)
                {
                    _logger.LogWarning("No se encontraron imágenes válidas para subir al producto {ProductoId}", productoId);
                    return false;
                }

                // Enviar imágenes a la API
                _logger.LogInformation("Enviando {NumImagenes} imágenes a la API para producto {ProductoId}",
                    formData.Count(), productoId);

                var response = await _httpClient.PostAsync($"api/Inventario/productos/{productoId}/imagenes", formData);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Imágenes subidas exitosamente para producto {ProductoId}", productoId);
                    return true;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Error al subir imágenes: {StatusCode}, {ErrorContent}",
                        response.StatusCode, errorContent);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir imágenes para el producto {ProductoId}", productoId);
                return false;
            }
        }

        // Método auxiliar para validar que un archivo sea una imagen
        private bool EsImagenValida(IFormFile archivo)
        {
            // Lista de tipos MIME permitidos para imágenes
            var tiposPermitidos = new[]
            {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp"
    };

            // Verificar extensión y tipo de contenido
            if (string.IsNullOrEmpty(archivo.ContentType))
            {
                return false;
            }

            return tiposPermitidos.Contains(archivo.ContentType.ToLower());
        }
    }
}