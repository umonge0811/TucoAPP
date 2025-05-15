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
                var response = await _httpClient.GetAsync("/api/Inventario/productos");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var productos = JsonConvert.DeserializeObject<List<ProductoDTO>>(content);

                return productos ?? new List<ProductoDTO>();
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
                var response = await _httpClient.GetAsync($"/api/Inventario/productos/{id}");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var producto = JsonConvert.DeserializeObject<ProductoDTO>(content);

                return producto ?? new ProductoDTO();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto ID: {Id}", id);
                return new ProductoDTO();
            }
        }

        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes)
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de agregar producto: {NombreProducto}", producto.NombreProducto);

                // Crear un objeto exactamente con la estructura esperada por la API
                var productoRequest = new
                {
                    productoId = 0, // siempre 0 para nuevos productos
                    nombreProducto = producto.NombreProducto ?? "Sin nombre",
                    descripcion = producto.Descripcion ?? "Sin descripción",
                    precio = Math.Max(producto.Precio, 0.01m), // mínimo 0.01
                    cantidadEnInventario = producto.CantidadEnInventario,
                    stockMinimo = producto.StockMinimo,
                    fechaUltimaActualizacion = DateTime.Now,
                    llanta = producto.Llanta != null ? new
                    {
                        llantaId = 0, // siempre 0 para nuevas llantas
                        productoId = 0, // se asignará después
                        ancho = producto.Llanta.Ancho ?? 0,
                        perfil = producto.Llanta.Perfil ?? 0,
                        diametro = producto.Llanta.Diametro?.ToString() ?? string.Empty,
                        marca = producto.Llanta.Marca ?? string.Empty,
                        modelo = producto.Llanta.Modelo ?? string.Empty,
                        capas = producto.Llanta.Capas ?? 0,
                        indiceVelocidad = producto.Llanta.IndiceVelocidad ?? string.Empty,
                        tipoTerreno = producto.Llanta.TipoTerreno ?? string.Empty
                    } : null,
                    imagenes = new List<object>() // lista vacía, se subirán después
                };

                // Serializar con la estructura exacta esperada
                var jsonContent = JsonConvert.SerializeObject(productoRequest,
                    new JsonSerializerSettings
                    {
                        NullValueHandling = NullValueHandling.Include
                    });

                _logger.LogInformation("JSON enviado a la API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // Obtener la URL base para verificarla
                _logger.LogInformation("URL base del cliente HTTP: {BaseUrl}", _httpClient.BaseAddress?.ToString() ?? "null");

                // Enviar la solicitud
                var response = await _httpClient.PostAsync("/api/Inventario/productos", content);

                // Capturar la respuesta completa
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de la API. Status: {Status}, Contenido: {Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error al crear producto. Código: {StatusCode}, Error: {Error}",
                        response.StatusCode, responseContent);
                    return false;
                }

                // Extraer el ID del producto creado
                dynamic? responseObj;
                try
                {
                    responseObj = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    if (responseObj == null)
                    {
                        _logger.LogError("No se pudo deserializar la respuesta de la API");
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al deserializar respuesta: {Message}", ex.Message);
                    return false;
                }

                int productoId = responseObj.productoId;
                _logger.LogInformation("Producto creado exitosamente. ID: {ProductoId}", productoId);

                // Subir imágenes si existen
                if (imagenes != null && imagenes.Any())
                {
                    _logger.LogInformation("Preparando para subir {Count} imágenes para el producto ID: {ProductoId}",
                        imagenes.Count, productoId);

                    using var formData = new MultipartFormDataContent();

                    foreach (var imagen in imagenes)
                    {
                        if (imagen.Length > 0)
                        {
                            _logger.LogInformation("Procesando imagen: {FileName}, Tamaño: {Length} bytes",
                                imagen.FileName, imagen.Length);

                            var streamContent = new StreamContent(imagen.OpenReadStream());
                            streamContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);

                            // Es importante que el nombre del campo coincida con el parámetro en la API
                            formData.Add(streamContent, "imagenes", imagen.FileName);
                        }
                    }

                    var imageUploadUrl = $"/api/Inventario/productos/{productoId}/imagenes";
                    _logger.LogInformation("Enviando solicitud POST a: {Url}", imageUploadUrl);

                    var imageResponse = await _httpClient.PostAsync(imageUploadUrl, formData);
                    var imageResponseContent = await imageResponse.Content.ReadAsStringAsync();

                    _logger.LogInformation("Respuesta de subida de imágenes. Status: {Status}, Contenido: {Content}",
                        imageResponse.StatusCode, imageResponseContent);

                    if (!imageResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("No se pudieron subir todas las imágenes. Status: {Status}, Error: {Error}",
                            imageResponse.StatusCode, imageResponseContent);
                        // Continuamos porque el producto ya se creó, aunque las imágenes fallaran
                    }
                    else
                    {
                        _logger.LogInformation("Imágenes subidas exitosamente para producto ID: {ProductoId}", productoId);
                    }
                }
                else
                {
                    _logger.LogInformation("No se proporcionaron imágenes para el producto");
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el proceso de agregar producto: {Message}", ex.Message);

                // Registrar también la excepción interna si existe
                if (ex.InnerException != null)
                {
                    _logger.LogError("Excepción interna: {Message}", ex.InnerException.Message);
                }

                return false;
            }
        }

        // Método privado para validar el producto antes de enviarlo
        private void ValidarProducto(ProductoDTO producto)
        {
            _logger.LogInformation("Validando datos del producto");

            // Verifica y arregla valores inválidos
            if (string.IsNullOrEmpty(producto.NombreProducto))
            {
                _logger.LogWarning("Nombre de producto es nulo o vacío. Asignando valor predeterminado");
                producto.NombreProducto = "Sin nombre";
            }

            if (producto.Precio <= 0)
            {
                _logger.LogWarning("Precio inválido ({Precio}). Asignando valor predeterminado", producto.Precio);
                producto.Precio = 1;
            }

            if (producto.CantidadEnInventario < 0)
            {
                _logger.LogWarning("Cantidad en inventario inválida ({Cantidad}). Asignando valor predeterminado",
                    producto.CantidadEnInventario);
                producto.CantidadEnInventario = 0;
            }

            if (producto.StockMinimo < 0)
            {
                _logger.LogWarning("Stock mínimo inválido ({StockMinimo}). Asignando valor predeterminado",
                    producto.StockMinimo);
                producto.StockMinimo = 0;
            }

            // Verificar datos de llanta si existe
            if (producto.Llanta != null)
            {
                _logger.LogInformation("Validando datos de llanta");

                // Verifica y arregla valores inválidos en llanta
                if (producto.Llanta.Ancho < 0)
                {
                    _logger.LogWarning("Ancho de llanta inválido ({Ancho}). Asignando null", producto.Llanta.Ancho);
                    producto.Llanta.Ancho = null;
                }

                if (producto.Llanta.Perfil < 0)
                {
                    _logger.LogWarning("Perfil de llanta inválido ({Perfil}). Asignando null", producto.Llanta.Perfil);
                    producto.Llanta.Perfil = null;
                }

                if (producto.Llanta.Capas < 0)
                {
                    _logger.LogWarning("Capas de llanta inválido ({Capas}). Asignando null", producto.Llanta.Capas);
                    producto.Llanta.Capas = null;
                }

                // Verificar que propiedades string no sean nulas
                // Diámetro como string puede ser número también
                if (producto.Llanta.Diametro == null)
                {
                    _logger.LogWarning("Diámetro de llanta es null. Asignando cadena vacía");
                    producto.Llanta.Diametro = string.Empty;
                }

                if (producto.Llanta.Marca == null)
                {
                    _logger.LogWarning("Marca de llanta es null. Asignando cadena vacía");
                    producto.Llanta.Marca = string.Empty;
                }

                if (producto.Llanta.Modelo == null)
                {
                    _logger.LogWarning("Modelo de llanta es null. Asignando cadena vacía");
                    producto.Llanta.Modelo = string.Empty;
                }

                if (producto.Llanta.IndiceVelocidad == null)
                {
                    _logger.LogWarning("Índice de velocidad de llanta es null. Asignando cadena vacía");
                    producto.Llanta.IndiceVelocidad = string.Empty;
                }

                if (producto.Llanta.TipoTerreno == null)
                {
                    _logger.LogWarning("Tipo de terreno de llanta es null. Asignando cadena vacía");
                    producto.Llanta.TipoTerreno = string.Empty;
                }
            }

            _logger.LogInformation("Validación de producto completada");
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