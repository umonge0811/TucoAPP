using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using Tuco.Clases.DTOs.Inventario;
using System.Net.Http.Json;

namespace GestionLlantera.Web.Services
{
    public class InventarioService : IInventarioService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<InventarioService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _apiUrl = "https://localhost:7126";

        public InventarioService(IHttpClientFactory httpClientFactory, ILogger<InventarioService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<List<ProductoDTO>> ObtenerProductosAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("🚀 Iniciando solicitud para obtener productos con autenticación");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);

                _logger.LogInformation("🔐 Token JWT configurado en headers de autorización");

                var response = await _httpClient.GetAsync("api/Inventario/productos");
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error obteniendo productos: {response.StatusCode} - {errorContent}");

                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        _logger.LogWarning("🚫 Error 401: Token JWT inválido o expirado");
                    }

                    return new List<ProductoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Respuesta recibida de la API, procesando {content.Length} caracteres...");

                var rawData = JsonConvert.DeserializeObject<dynamic>(content);
                var productos = new List<ProductoDTO>();

                if (rawData == null)
                {
                    _logger.LogWarning("La respuesta de la API es null");
                    return new List<ProductoDTO>();
                }

                foreach (var item in rawData)
                {
                    try
                    {
                        var producto = new ProductoDTO
                        {
                            ProductoId = (int)item.productoId,
                            NombreProducto = (string)item.nombreProducto ?? "Sin nombre",
                            Descripcion = item.descripcion?.ToString(),
                            Costo = item.costo != null ? (decimal?)item.costo : null,
                            PorcentajeUtilidad = item.porcentajeUtilidad != null ? (decimal?)item.porcentajeUtilidad : null,
                            Precio = item.precioCalculado != null ? (decimal?)item.precioCalculado :
                                     item.precio != null ? (decimal?)item.precio : null,
                            CantidadEnInventario = (int)item.cantidadEnInventario,
                            StockMinimo = (int)item.stockMinimo,
                            FechaUltimaActualizacion = item.fechaUltimaActualizacion != null ?
                                DateTime.Parse(item.fechaUltimaActualizacion.ToString()) : (DateTime?)null,
                            EsLlanta = item.llanta != null,
                            Imagenes = new List<ImagenProductoDTO>()
                        };

                        if (item.imagenesProductos != null)
                        {
                            foreach (var img in item.imagenesProductos)
                            {
                                var imagenUrl = img.urlimagen?.ToString() ?? "";

                                if (!string.IsNullOrEmpty(imagenUrl) && !imagenUrl.StartsWith("http"))
                                {
                                    string apiBaseUrl = _httpClient.BaseAddress?.ToString()?.TrimEnd('/') ?? "";
                                    imagenUrl = $"{apiBaseUrl}{imagenUrl}";
                                }

                                producto.Imagenes.Add(new ImagenProductoDTO
                                {
                                    ImagenId = (int)img.imagenId,
                                    ProductoId = producto.ProductoId,
                                    UrlImagen = imagenUrl,
                                    Descripcion = img.descripcion?.ToString() ?? ""
                                });
                            }
                        }

                        if (item.llanta != null)
                        {
                            var llantaData = item.llanta;

                            producto.Llanta = new LlantaDTO
                            {
                                LlantaId = (int)llantaData.llantaId,
                                ProductoId = producto.ProductoId,
                                Ancho = llantaData.ancho != null ? (int?)llantaData.ancho : null,
                                Perfil = llantaData.perfil != null ? (int?)llantaData.perfil : null,
                                Diametro = llantaData.diametro?.ToString() ?? "",
                                Marca = llantaData.marca?.ToString() ?? "",
                                Modelo = llantaData.modelo?.ToString() ?? "",
                                Capas = llantaData.capas != null ? (int?)llantaData.capas : null,
                                IndiceVelocidad = llantaData.indiceVelocidad?.ToString() ?? "",
                                TipoTerreno = llantaData.tipoTerreno?.ToString() ?? ""
                            };

                            producto.EsLlanta = true;
                        }

                        productos.Add(producto);

                        _logger.LogInformation($"✅ Producto procesado: {producto.NombreProducto} " +
                            $"(ID: {producto.ProductoId}, Precio: {producto.Precio}, " +
                            $"Stock: {producto.CantidadEnInventario}, Es Llanta: {producto.EsLlanta})");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"❌ Error procesando producto individual: {ex.Message}");
                    }
                }

                _logger.LogInformation($"🎉 PROCESO COMPLETADO: {productos.Count} productos procesados exitosamente");
                return productos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al obtener productos");
                return new List<ProductoDTO>();
            }
        }

        public async Task<ProductoDTO> ObtenerProductoPorIdAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 Iniciando ObtenerProductoPorIdAsync para ID: {Id}", id);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                var response = await _httpClient.GetAsync($"api/Inventario/productos/{id}");

                _logger.LogInformation("📡 Respuesta del servidor: {StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error del servidor: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return new ProductoDTO { ProductoId = 0 };
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📄 Contenido recibido ({Length} chars): {Content}",
                    content.Length, content.Length > 500 ? content.Substring(0, 500) + "..." : content);

                var item = JsonConvert.DeserializeObject<dynamic>(content);

                if (item == null)
                {
                    _logger.LogError("❌ Error: La deserialización retornó null");
                    return new ProductoDTO { ProductoId = 0 };
                }

                var producto = new ProductoDTO
                {
                    ProductoId = GetSafeInt(item.productoId, 0),
                    NombreProducto = GetSafeString(item.nombreProducto, "Sin nombre"),
                    Descripcion = GetSafeString(item.descripcion, null),
                    Precio = GetSafeDecimal(item.precio, null),
                    Costo = GetSafeDecimal(item.costo, null),
                    PorcentajeUtilidad = GetSafeDecimal(item.porcentajeUtilidad, null),
                    CantidadEnInventario = GetSafeInt(item.cantidadEnInventario, 0),
                    StockMinimo = GetSafeInt(item.stockMinimo, 0),
                    EsLlanta = false,
                    FechaUltimaActualizacion = GetSafeDateTime(item.fechaUltimaActualizacion),
                    Imagenes = new List<ImagenProductoDTO>()
                };

                _logger.LogInformation("✅ Producto base mapeado: {Nombre} (ID: {Id})", producto.NombreProducto, producto.ProductoId);

                try
                {
                    if (item.imagenesProductos != null)
                    {
                        _logger.LogInformation("🖼️ Procesando imágenes...");

                        string apiBaseUrl = _httpClient.BaseAddress?.ToString()?.TrimEnd('/') ?? "";
                        _logger.LogInformation("🔗 URL base de la API: {BaseUrl}", apiBaseUrl);

                        int imagenesCount = 0;
                        foreach (var img in item.imagenesProductos)
                        {
                            try
                            {
                                var imagenUrl = GetSafeString(img.urlimagen, "");

                                if (!string.IsNullOrEmpty(imagenUrl))
                                {
                                    if (!imagenUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                                    {
                                        if (!imagenUrl.StartsWith("/"))
                                        {
                                            imagenUrl = "/" + imagenUrl;
                                        }
                                        imagenUrl = $"{apiBaseUrl}{imagenUrl}";
                                    }

                                    var imagen = new ImagenProductoDTO
                                    {
                                        ImagenId = GetSafeInt(img.imagenId, 0),
                                        ProductoId = producto.ProductoId,
                                        UrlImagen = imagenUrl,
                                        Descripcion = GetSafeString(img.descripcion, "")
                                    };

                                    producto.Imagenes.Add(imagen);
                                    imagenesCount++;
                                }
                            }
                            catch (Exception imgEx)
                            {
                                _logger.LogWarning(imgEx, "⚠️ Error procesando imagen individual, continuando...");
                            }
                        }

                        _logger.LogInformation("✅ Total de imágenes procesadas: {Count}", imagenesCount);
                    }
                    else
                    {
                        _logger.LogInformation("ℹ️ No hay imágenes para este producto");
                    }
                }
                catch (Exception imgEx)
                {
                    _logger.LogError(imgEx, "❌ Error procesando imágenes, pero continuando...");
                }

                try
                {
                    if (item.llanta != null)
                    {
                        _logger.LogInformation("🚗 Procesando datos de llanta...");

                        dynamic llantaData = null;

                        if (item.llanta is Newtonsoft.Json.Linq.JArray)
                        {
                            var llantaArray = item.llanta as Newtonsoft.Json.Linq.JArray;
                            if (llantaArray != null && llantaArray.Count > 0)
                            {
                                llantaData = llantaArray[0];
                                _logger.LogInformation("🔄 Llanta procesada como array, tomando primer elemento");
                            }
                        }
                        else
                        {
                            llantaData = item.llanta;
                            _logger.LogInformation("🔄 Llanta procesada como objeto directo");
                        }

                        if (llantaData != null)
                        {
                            producto.Llanta = new LlantaDTO
                            {
                                LlantaId = GetSafeInt(llantaData.llantaId, 0),
                                ProductoId = producto.ProductoId,
                                Ancho = GetSafeNullableInt(llantaData.ancho),
                                Perfil = GetSafeNullableInt(llantaData.perfil),
                                Diametro = GetSafeString(llantaData.diametro, ""),
                                Marca = GetSafeString(llantaData.marca, ""),
                                Modelo = GetSafeString(llantaData.modelo, ""),
                                Capas = GetSafeNullableInt(llantaData.capas),
                                IndiceVelocidad = GetSafeString(llantaData.indiceVelocidad, ""),
                                TipoTerreno = GetSafeString(llantaData.tipoTerreno, "")
                            };

                            producto.EsLlanta = true;
                            _logger.LogInformation("✅ Llanta procesada: {Marca} {Modelo}", producto.Llanta.Marca, producto.Llanta.Modelo);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("ℹ️ Este producto no es una llanta");
                    }
                }
                catch (Exception llantaEx)
                {
                    _logger.LogError(llantaEx, "❌ Error procesando llanta, pero continuando...");
                }

                _logger.LogInformation("🎉 Producto completamente procesado: {Nombre} (Imágenes: {ImageCount}, Es Llanta: {EsLlanta})",
                    producto.NombreProducto, producto.Imagenes.Count, producto.EsLlanta);

                return producto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al obtener producto ID: {Id} - {Message}", id, ex.Message);

                return new ProductoDTO
                {
                    ProductoId = 0,
                    NombreProducto = "Error al cargar producto",
                    Imagenes = new List<ImagenProductoDTO>()
                };
            }
        }

        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de agregar producto: {NombreProducto}", producto.NombreProducto);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT - la petición podría fallar");
                }

                var precioFinal = CalcularPrecioFinal(producto);

                var productoRequest = new
                {
                    productoId = 0,
                    nombreProducto = producto.NombreProducto ?? "Sin nombre",
                    descripcion = producto.Descripcion ?? "Sin descripción",
                    precio = Math.Max(precioFinal, 0.01m),
                    costo = producto.Costo,
                    porcentajeUtilidad = producto.PorcentajeUtilidad,
                    cantidadEnInventario = producto.CantidadEnInventario,
                    stockMinimo = producto.StockMinimo,
                    esLlanta = producto.EsLlanta,
                    fechaUltimaActualizacion = DateTime.Now,
                    llanta = producto.EsLlanta && producto.Llanta != null ? new
                    {
                        llantaId = 0,
                        productoId = 0,
                        ancho = producto.Llanta.Ancho ?? 0,
                        perfil = producto.Llanta.Perfil ?? 0,
                        diametro = producto.Llanta.Diametro ?? string.Empty,
                        marca = producto.Llanta.Marca ?? string.Empty,
                        modelo = producto.Llanta.Modelo ?? string.Empty,
                        capas = producto.Llanta.Capas ?? 0,
                        indiceVelocidad = producto.Llanta.IndiceVelocidad ?? string.Empty,
                        tipoTerreno = producto.Llanta.TipoTerreno ?? string.Empty
                    } : null,
                    imagenes = new List<object>()
                };

                var jsonContent = JsonConvert.SerializeObject(productoRequest,
                    new JsonSerializerSettings
                    {
                        NullValueHandling = NullValueHandling.Include
                    });

                _logger.LogInformation("JSON enviado a la API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation("URL base del cliente HTTP: {BaseUrl}", _httpClient.BaseAddress?.ToString() ?? "null");

                var response = await _httpClient.PostAsync("api/Inventario/productos", content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de la API. Status: {Status}, Contenido: {Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error al crear producto. Código: {StatusCode}, Error: {Error}",
                        response.StatusCode, responseContent);
                    return false;
                }

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

                            formData.Add(streamContent, "imagenes", imagen.FileName);
                        }
                    }

                    var imageUploadUrl = $"api/Inventario/productos/{productoId}/imagenes";
                    _logger.LogInformation("Enviando solicitud POST a: {Url}", imageUploadUrl);

                    var imageResponse = await _httpClient.PostAsync(imageUploadUrl, formData);
                    var imageResponseContent = await imageResponse.Content.ReadAsStringAsync();

                    _logger.LogInformation("Respuesta de subida de imágenes. Status: {Status}, Contenido: {Content}",
                        imageResponse.StatusCode, imageResponseContent);

                    if (!imageResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("No se pudieron subir todas las imágenes. Status: {Status}, Error: {Error}",
                            imageResponse.StatusCode, imageResponseContent);
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

                if (ex.InnerException != null)
                {
                    _logger.LogError("Excepción interna: {Message}", ex.InnerException.Message);
                }

                return false;
            }
        }

        public async Task<bool> ActualizarProductoAsync(int id, ProductoDTO producto, List<IFormFile> nuevasImagenes, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔄 === INICIANDO ACTUALIZACIÓN DE PRODUCTO ===");
                _logger.LogInformation("📋 ID: {Id}, Nombre: '{Nombre}'", id, producto.NombreProducto);
                _logger.LogInformation("📊 === DATOS RECIBIDOS EN SERVICIO ===");
                _logger.LogInformation("💳 Costo: {Costo}", producto.Costo);
                _logger.LogInformation("📈 Utilidad: {Utilidad}%", producto.PorcentajeUtilidad);
                _logger.LogInformation("💵 Precio: {Precio}", producto.Precio);
                _logger.LogInformation("📦 Stock: {Stock}, Stock Mín: {StockMin}", producto.CantidadEnInventario, producto.StockMinimo);
                _logger.LogInformation("🛞 Es Llanta: {EsLlanta}", producto.EsLlanta);
                if (producto.EsLlanta && producto.Llanta != null)
                {
                    _logger.LogInformation("🛞 Marca: '{Marca}', Modelo: '{Modelo}'", producto.Llanta.Marca, producto.Llanta.Modelo);
                }

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para actualización");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT - la petición podría fallar");
                }

                var precioFinal = CalcularPrecioFinal(producto);

                var productoRequest = new
                {
                    productoId = producto.ProductoId,
                    nombreProducto = producto.NombreProducto ?? "Sin nombre",
                    descripcion = producto.Descripcion ?? "",
                    precio = Math.Max(precioFinal, 0.01m),
                    costo = producto.Costo,
                    porcentajeUtilidad = producto.PorcentajeUtilidad,
                    cantidadEnInventario = producto.CantidadEnInventario,
                    stockMinimo = producto.StockMinimo,
                    esLlanta = producto.EsLlanta,
                    fechaUltimaActualizacion = DateTime.Now,
                    llanta = producto.EsLlanta && producto.Llanta != null ? new
                    {
                        llantaId = producto.Llanta.LlantaId,
                        productoId = producto.ProductoId,
                        ancho = producto.Llanta.Ancho ?? 0,
                        perfil = producto.Llanta.Perfil ?? 0,
                        diametro = producto.Llanta.Diametro ?? string.Empty,
                        marca = producto.Llanta.Marca ?? string.Empty,
                        modelo = producto.Llanta.Modelo ?? string.Empty,
                        capas = producto.Llanta.Capas ?? 0,
                        indiceVelocidad = producto.Llanta.IndiceVelocidad ?? string.Empty,
                        tipoTerreno = producto.Llanta.TipoTerreno ?? string.Empty
                    } : null
                };

                var jsonContent = JsonConvert.SerializeObject(productoRequest,
                    new JsonSerializerSettings
                    {
                        NullValueHandling = NullValueHandling.Include
                    });

                _logger.LogInformation("📤 JSON enviado a la API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                var response = await _httpClient.PutAsync($"api/Inventario/productos/{id}", content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📡 Respuesta de actualización: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al actualizar producto: {StatusCode} - {Error}",
                        response.StatusCode, responseContent);
                    return false;
                }

                _logger.LogInformation("✅ Producto actualizado exitosamente en la API");

                if (nuevasImagenes != null && nuevasImagenes.Any())
                {
                    _logger.LogInformation("📷 Subiendo {Count} nuevas imágenes...", nuevasImagenes.Count);

                    bool imagenesSubidas = await SubirNuevasImagenesAsync(id, nuevasImagenes);
                    if (!imagenesSubidas)
                    {
                        _logger.LogWarning("⚠️ Algunas imágenes no se pudieron subir, pero el producto fue actualizado");
                    }
                    else
                    {
                        _logger.LogInformation("✅ Todas las nuevas imágenes subidas correctamente");
                    }
                }

                _logger.LogInformation("🎉 Actualización de producto completada exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al actualizar producto ID: {Id} - {Message}", id, ex.Message);
                return false;
            }
        }

        public async Task<bool> EliminarProductoAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🗑️ === INICIANDO ELIMINACIÓN DE PRODUCTO ===");
                _logger.LogInformation("🗑️ Producto ID: {Id}", id);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para eliminación");
                }
                else
                {
                    _logger.LogError("❌ TOKEN JWT FALTANTE EN ELIMINACIÓN DE PRODUCTO");
                    return false;
                }

                var deleteUrl = $"api/Inventario/productos/{id}";
                _logger.LogInformation("📤 Enviando DELETE a: {Url}", deleteUrl);

                var response = await _httpClient.DeleteAsync(deleteUrl);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 === RESPUESTA DE ELIMINACIÓN ===");
                _logger.LogInformation("📡 Status Code: {StatusCode}", response.StatusCode);
                _logger.LogInformation("📡 Content: {Content}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al eliminar producto: {Status} - {Content}",
                        response.StatusCode, responseContent);
                    return false;
                }

                _logger.LogInformation("✅ Producto {Id} eliminado exitosamente", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al eliminar producto {Id}", id);
                return false;
            }
        }

        public async Task<bool> EliminarImagenProductoAsync(int productoId, int imagenId, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🗑️ === INICIANDO ELIMINACIÓN EN SERVICIO ===");
                _logger.LogInformation("🗑️ ProductoId: {ProductoId}, ImagenId: {ImagenId}", productoId, imagenId);
                _logger.LogInformation("🔐 Token recibido en servicio: {HasToken}", !string.IsNullOrEmpty(jwtToken) ? "SÍ" : "NO");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado correctamente");
                }
                else
                {
                    _logger.LogError("❌ TOKEN JWT FALTANTE EN SERVICIO DE ELIMINACIÓN");
                    return false;
                }

                var deleteUrl = $"api/Inventario/productos/{productoId}/imagenes/{imagenId}";
                _logger.LogInformation("📤 Enviando DELETE a: {Url}", deleteUrl);

                var response = await _httpClient.DeleteAsync(deleteUrl);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 === RESPUESTA DE LA API ===");
                _logger.LogInformation("📡 Status Code: {StatusCode}", response.StatusCode);
                _logger.LogInformation("📡 Content: {Content}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al eliminar imagen: {Status} - {Content}",
                        response.StatusCode, responseContent);
                    return false;
                }

                _logger.LogInformation("✅ Imagen {ImagenId} eliminada exitosamente", imagenId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al eliminar imagen {ImagenId} del producto {ProductoId}",
                    imagenId, productoId);
                return false;
            }
        }

        public async Task<List<string>> BuscarMarcasLlantasAsync(string filtro = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando marcas con filtro: '{Filtro}'", filtro);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                string url = "api/Inventario/marcas-busqueda";
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    url += $"?filtro={Uri.EscapeDataString(filtro)}";
                }

                _logger.LogInformation("📡 Realizando petición a: {Url}", url);

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo marcas: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var marcas = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} marcas", marcas.Count);
                return marcas;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar marcas en el servicio");
                return new List<string>();
            }
        }

        public async Task<List<string>> BuscarModelosLlantasAsync(string filtro = "", string marca = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando modelos con filtro: '{Filtro}', marca: '{Marca}'", filtro, marca);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                string url = "api/Inventario/modelos-busqueda";
                var parameters = new List<string>();

                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    parameters.Add($"filtro={Uri.EscapeDataString(filtro)}");
                }

                if (!string.IsNullOrWhiteSpace(marca))
                {
                    parameters.Add($"marca={Uri.EscapeDataString(marca)}");
                }

                if (parameters.Any())
                {
                    url += "?" + string.Join("&", parameters);
                }

                _logger.LogInformation("📡 Realizando petición a: {Url}", url);

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo modelos: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var modelos = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} modelos", modelos.Count);
                return modelos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar modelos en el servicio");
                return new List<string>();
            }
        }

        public async Task<List<string>> BuscarIndicesVelocidadAsync(string filtro = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando índices de velocidad con filtro: '{Filtro}'", filtro);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                string url = "api/Inventario/indices-velocidad-busqueda";
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    url += $"?filtro={Uri.EscapeDataString(filtro)}";
                }

                _logger.LogInformation("📡 Realizando petición a: {Url}", url);

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo índices de velocidad: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var indices = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} índices de velocidad", indices.Count);
                return indices;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar índices de velocidad en el servicio");
                return new List<string>();
            }
        }

        public async Task<List<string>> BuscarTiposTerrenoAsync(string filtro = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 Buscando tipos de terreno con filtro: '{Filtro}'", filtro);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                string url = "api/Inventario/tipos-terreno-busqueda";
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    url += $"?filtro={Uri.EscapeDataString(filtro)}";
                }

                _logger.LogInformation("📡 Realizando petición a: {Url}", url);

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo tipos de terreno: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var tipos = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} tipos de terreno", tipos.Count);
                return tipos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar tipos de terreno en el servicio");
                return new List<string>();
            }
        }

        public async Task<bool> AjustarStockProductoAsync(int productoId, int cantidad, string motivo, string token = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                }

                var ajusteData = new
                {
                    tipoAjuste = "SALIDA",
                    cantidad = cantidad,
                    motivo = motivo
                };

                var json = JsonConvert.SerializeObject(ajusteData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"api/Inventario/productos/{productoId}/ajustar-stock", content);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = await response.Content.ReadAsStringAsync();
                    var ajusteResult = JsonConvert.DeserializeObject<dynamic>(resultado);
                    return ajusteResult?.success == true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ajustando stock del producto {ProductoId}", productoId);
                return false;
            }
        }

        public async Task<AjusteStockRapidoResponseDTO> AjustarStockRapidoAsync(int id, AjusteStockRapidoDTO ajusteDto, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 === INICIANDO AJUSTE DE STOCK EN SERVICIO ===");
                _logger.LogInformation("📦 Producto ID: {Id}, Tipo: {Tipo}, Cantidad: {Cantidad}",
                    id, ajusteDto.TipoAjuste, ajusteDto.Cantidad);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para ajuste de stock");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para ajuste de stock");
                }

                var jsonContent = JsonConvert.SerializeObject(ajusteDto, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Include,
                    DateTimeZoneHandling = DateTimeZoneHandling.Local
                });

                _logger.LogInformation("📤 JSON enviado a la API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var url = $"api/Inventario/productos/{id}/ajustar-stock";
                _logger.LogInformation("🌐 Enviando petición POST a: {Url}", url);

                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta de la API - Status: {Status}, Content: {Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en la API al ajustar stock: {Status} - {Content}",
                        response.StatusCode, responseContent);

                    try
                    {
                        var errorResponse = JsonConvert.DeserializeObject<dynamic>(responseContent);
                        var errorMessage = errorResponse?.message?.ToString() ?? "Error desconocido";

                        return new AjusteStockRapidoResponseDTO
                        {
                            Success = false,
                            Message = errorMessage
                        };
                    }
                    catch
                    {
                        return new AjusteStockRapidoResponseDTO
                        {
                            Success = false,
                            Message = $"Error en la API: {response.StatusCode}"
                        };
                    }
                }

                var resultado = JsonConvert.DeserializeObject<AjusteStockRapidoResponseDTO>(responseContent);

                if (resultado == null)
                {
                    _logger.LogError("❌ No se pudo deserializar la respuesta de la API");
                    return new AjusteStockRapidoResponseDTO
                    {
                        Success = false,
                        Message = "Error al procesar la respuesta de la API"
                    };
                }

                _logger.LogInformation("✅ === AJUSTE DE STOCK COMPLETADO ===");
                _logger.LogInformation("✅ Resultado: {Success}, Mensaje: {Message}",
                    resultado.Success, resultado.Message);

                if (resultado.Success)
                {
                    _logger.LogInformation("✅ Stock actualizado: {Anterior} → {Nuevo} (Diferencia: {Diferencia})",
                        resultado.StockAnterior, resultado.StockNuevo, resultado.Diferencia);

                    if (resultado.StockBajo)
                    {
                        _logger.LogWarning("⚠️ ALERTA: El producto quedó con stock bajo ({Stock} <= {Minimo})",
                            resultado.StockNuevo, resultado.StockMinimo);
                    }
                }

                return resultado;
            }
            catch (HttpRequestException httpEx)
            {
                _logger.LogError(httpEx, "🌐 Error de conexión al ajustar stock del producto {Id}", id);
                return new AjusteStockRapidoResponseDTO
                {
                    Success = false,
                    Message = "Error de conexión con el servidor. Verifique su conexión a internet."
                };
            }
            catch (TaskCanceledException tcEx)
            {
                _logger.LogError(tcEx, "⏱️ Timeout al ajustar stock del producto {Id}", id);
                return new AjusteStockRapidoResponseDTO
                {
                    Success = false,
                    Message = "La operación tardó demasiado tiempo. Inténtelo nuevamente."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al ajustar stock del producto {Id}", id);
                return new AjusteStockRapidoResponseDTO
                {
                    Success = false,
                    Message = $"Error interno: {ex.Message}"
                };
            }
        }

        public async Task<List<InventarioProgramadoDTO>> ObtenerInventariosProgramadosAsync(string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("Obteniendo inventarios programados");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener inventarios programados");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener inventarios programados");
                }

                var response = await _httpClient.GetAsync("api/Inventario/inventarios-programados");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error obteniendo inventarios programados: {response.StatusCode} - {errorContent}");
                    return new List<InventarioProgramadoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Contenido recibido de la API para inventarios programados");

                var inventarios = JsonConvert.DeserializeObject<List<InventarioProgramadoDTO>>(content);

                return inventarios ?? new List<InventarioProgramadoDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener inventarios programados");
                return new List<InventarioProgramadoDTO>();
            }
        }

        public async Task<InventarioProgramadoDTO> ObtenerInventarioProgramadoPorIdAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Obteniendo inventario programado con ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para obtener inventario programado por ID");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener inventario programado por ID");
                }

                var response = await _httpClient.GetAsync($"api/Inventario/inventarios-programados/{id}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error obteniendo inventario programado: {response.StatusCode} - {errorContent}");
                    return new InventarioProgramadoDTO();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Contenido recibido de la API para inventario programado ID {id}");

                var inventario = JsonConvert.DeserializeObject<InventarioProgramadoDTO>(content);

                return inventario ?? new InventarioProgramadoDTO();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener inventario programado con ID: {id}");
                return new InventarioProgramadoDTO();
            }
        }

        public async Task<bool> GuardarInventarioProgramadoAsync(InventarioProgramadoDTO inventario, string jwtToken = null)
        {
            try
            {
                Console.WriteLine("=== DATOS ENVIADOS A LA API ===");
                Console.WriteLine($"Título: {inventario.Titulo}");
                Console.WriteLine($"UsuarioCreadorId: {inventario.UsuarioCreadorId}");

                _logger.LogInformation("🔐 Token recibido: {HasToken}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para guardar inventario programado");
                }
                else
                {
                    _logger.LogError("❌ NO SE PROPORCIONÓ TOKEN JWT - LA PETICIÓN PUEDE FALLAR");
                }

                Console.WriteLine($"UsuarioCreadorNombre: '{inventario.UsuarioCreadorNombre}'");
                Console.WriteLine($"Asignaciones count: {inventario.AsignacionesUsuarios?.Count ?? 0}");

                if (inventario.AsignacionesUsuarios != null)
                {
                    for (int i = 0; i < inventario.AsignacionesUsuarios.Count; i++)
                    {
                        var asignacion = inventario.AsignacionesUsuarios[i];
                        Console.WriteLine($"Asignación [{i}]:");
                        Console.WriteLine($"  - UsuarioId: {asignacion.UsuarioId}");
                        Console.WriteLine($"  - NombreUsuario: '{asignacion.NombreUsuario}'");
                        Console.WriteLine($"  - EmailUsuario: '{asignacion.EmailUsuario}'");
                        Console.WriteLine($"  - PermisoConteo: {asignacion.PermisoConteo}");
                        Console.WriteLine($"  - PermisoAjuste: {asignacion.PermisoAjuste}");
                        Console.WriteLine($"  - PermisoValidacion: {asignacion.PermisoValidacion}");
                        Console.WriteLine($"  - PermisoCompletar: {asignacion.PermisoCompletar}");
                    }
                }
                Console.WriteLine("=== FIN DATOS ===");

                var json = JsonConvert.SerializeObject(inventario, new JsonSerializerSettings
                {
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("JSON enviado a la API: {Json}", json);

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("api/Inventario/inventarios-programados", content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Respuesta de la API - Status: {Status}, Content: {Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Error guardando inventario programado: {Status} - {Content}",
                        response.StatusCode, responseContent);
                    return false;
                }

                _logger.LogInformation("Inventario programado guardado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar inventario programado: {Message}", ex.Message);
                return false;
            }
        }

        public async Task<bool> ActualizarInventarioProgramadoAsync(int id, InventarioProgramadoDTO inventario, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Actualizando inventario programado con ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para actualizar inventario programado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para actualizar inventario programado");
                }

                var json = JsonConvert.SerializeObject(inventario);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PutAsync($"api/Inventario/inventarios-programados/{id}", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error actualizando inventario programado: {response.StatusCode} - {errorContent}");
                    return false;
                }

                _logger.LogInformation($"Inventario programado con ID {id} actualizado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar inventario programado con ID: {id}");
                return false;
            }
        }

        public async Task<bool> IniciarInventarioAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Iniciando inventario programado con ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para iniciar inventario programado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para iniciar inventario programado");
                }

                var response = await _httpClient.PostAsync($"api/Inventario/inventarios-programados/{id}/iniciar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error iniciando inventario programado: {response.StatusCode} - {errorContent}");
                    return false;
                }

                _logger.LogInformation($"Inventario programado con ID {id} iniciado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al iniciar inventario programado con ID: {id}");
                return false;
            }
        }

        public async Task<bool> CancelarInventarioAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Cancelando inventario programado con ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para cancelar inventario programado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para cancelar inventario programado");
                }

                var response = await _httpClient.PostAsync($"api/Inventario/inventarios-programados/{id}/cancelar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error cancelando inventario programado: {response.StatusCode} - {errorContent}");
                    return false;
                }

                _logger.LogInformation($"Inventario programado con ID {id} cancelado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al cancelar inventario programado con ID: {id}");
                return false;
            }
        }

        public async Task<bool> CompletarInventarioAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Completando inventario programado con ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para completar inventario programado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para completar inventario programado");
                }

                var response = await _httpClient.PostAsync($"api/Inventario/inventarios-programados/{id}/completar", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error completando inventario programado: {response.StatusCode} - {errorContent}");
                    return false;
                }

                _logger.LogInformation($"Inventario programado con ID {id} completado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al completar inventario programado con ID: {id}");
                return false;
            }
        }

        public async Task<Stream> ExportarResultadosInventarioExcelAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Exportando resultados de inventario a Excel para ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para exportar resultados a Excel");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para exportar resultados a Excel");
                }

                var response = await _httpClient.GetAsync($"api/Inventario/inventarios-programados/{id}/exportar-excel");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error exportando resultados a Excel: {response.StatusCode} - {errorContent}");
                    throw new Exception($"Error al exportar resultados a Excel: {response.StatusCode}");
                }

                var stream = await response.Content.ReadAsStreamAsync();

                _logger.LogInformation($"Resultados de inventario ID {id} exportados a Excel exitosamente");
                return stream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al exportar resultados de inventario a Excel para ID: {id}");
                throw;
            }
        }

        public async Task<Stream> ExportarResultadosInventarioPDFAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation($"Exportando resultados de inventario a PDF para ID: {id}");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para exportar resultados a PDF");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para exportar resultados a PDF");
                }

                var response = await _httpClient.GetAsync($"api/Inventario/inventarios-programados/{id}/exportar-pdf");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error exportando resultados a PDF: {response.StatusCode} - {errorContent}");
                    throw new Exception($"Error al exportar resultados a PDF: {response.StatusCode}");
                }

                var stream = await response.Content.ReadAsStreamAsync();

                _logger.LogInformation($"Resultados de inventario ID {id} exportados a PDF exitosamente");
                return stream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al exportar resultados de inventario a PDF para ID: {id}");
                throw;
            }
        }

        // Métodos auxiliares privados
        private async Task<bool> SubirNuevasImagenesAsync(int productoId, List<IFormFile> imagenes)
        {
            try
            {
                if (imagenes == null || !imagenes.Any())
                {
                    return true;
                }

                _logger.LogInformation("📷 Subiendo {Count} nuevas imágenes para producto {ProductoId}",
                    imagenes.Count, productoId);

                using var formData = new MultipartFormDataContent();

                foreach (var imagen in imagenes)
                {
                    if (imagen.Length > 0)
                    {
                        _logger.LogInformation("📎 Agregando imagen: {FileName}, Tamaño: {Length} bytes",
                            imagen.FileName, imagen.Length);

                        var streamContent = new StreamContent(imagen.OpenReadStream());
                        streamContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);
                        formData.Add(streamContent, "imagenes", imagen.FileName);
                    }
                }

                var imageUploadUrl = $"api/Inventario/productos/{productoId}/imagenes";
                _logger.LogInformation("📤 Enviando imágenes a: {Url}", imageUploadUrl);

                var imageResponse = await _httpClient.PostAsync(imageUploadUrl, formData);
                var imageResponseContent = await imageResponse.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta de subida de imágenes: Status={Status}, Content={Content}",
                    imageResponse.StatusCode, imageResponseContent);

                if (!imageResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al subir nuevas imágenes: {Status} - {Error}",
                        imageResponse.StatusCode, imageResponseContent);
                    return false;
                }

                _logger.LogInformation("✅ Nuevas imágenes subidas exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al subir nuevas imágenes para producto {ProductoId}", productoId);
                return false;
            }
        }

        private decimal CalcularPrecioFinal(ProductoDTO dto)
        {
            _logger.LogInformation("💰 === CALCULANDO PRECIO FINAL ===");
            _logger.LogInformation("💳 Costo recibido: {Costo}", dto.Costo);
            _logger.LogInformation("📊 Utilidad recibida: {Utilidad}%", dto.PorcentajeUtilidad);
            _logger.LogInformation("💵 Precio manual recibido: {Precio}", dto.Precio);

            if (dto.Costo.HasValue && dto.Costo.Value > 0 &&
                dto.PorcentajeUtilidad.HasValue && dto.PorcentajeUtilidad.Value >= 0)
            {
                var utilidadDinero = dto.Costo.Value * (dto.PorcentajeUtilidad.Value / 100m);
                var precioCalculado = dto.Costo.Value + utilidadDinero;

                _logger.LogInformation("🧮 === CÁLCULO AUTOMÁTICO ===");
                _logger.LogInformation("   - Costo base: ₡{Costo:N2}", dto.Costo.Value);
                _logger.LogInformation("   - Porcentaje utilidad: {Utilidad:N2}%", dto.PorcentajeUtilidad.Value);
                _logger.LogInformation("   - Utilidad en dinero: ₡{UtilidadDinero:N2}", utilidadDinero);
                _logger.LogInformation("   - Precio final calculado: ₡{PrecioFinal:N2}", precioCalculado);

                return precioCalculado;
            }

            var precioManual = dto.Precio.GetValueOrDefault(0m);
            _logger.LogInformation("📝 === PRECIO MANUAL ===");
            _logger.LogInformation("   - Precio recibido: ₡{PrecioManual:N2}", precioManual);

            var precioFinal = Math.Max(precioManual, 0.01m);
            _logger.LogInformation("✅ Precio final determinado: ₡{PrecioFinal:N2}", precioFinal);

            return precioFinal;
        }

        private static string GetSafeString(dynamic value, string defaultValue = "")
        {
            try
            {
                return value?.ToString() ?? defaultValue;
            }
            catch
            {
                return defaultValue;
            }
        }

        private static int GetSafeInt(dynamic value, int defaultValue = 0)
        {
            try
            {
                if (value == null) return defaultValue;
                if (int.TryParse(value.ToString(), out int result))
                    return result;
                return defaultValue;
            }
            catch
            {
                return defaultValue;
            }
        }

        private static decimal? GetSafeDecimal(dynamic value, decimal? defaultValue = null)
        {
            try
            {
                if (value == null) return defaultValue;
                if (decimal.TryParse(value.ToString(), out decimal result))
                    return result;
                return defaultValue;
            }
            catch
            {
                return defaultValue;
            }
        }

        private static int? GetSafeNullableInt(dynamic value)
        {
            try
            {
                if (value == null) return null;
                if (int.TryParse(value.ToString(), out int result))
                    return result;
                return null;
            }
            catch
            {
                return null;
            }
        }

        private static DateTime? GetSafeDateTime(dynamic value)
        {
            try
            {
                if (value == null) return null;
                if (DateTime.TryParse(value.ToString(), out DateTime result))
                    return result;
                return null;
            }
            catch
            {
                return null;
            }
        }

    public async Task<bool> ActualizarStockAsync(int productoId, int cantidadVendida)
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.PostAsJsonAsync($"{_apiUrl}/api/inventario/actualizar-stock", new
            {
                ProductoId = productoId,
                CantidadVendida = cantidadVendida
            });

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<ResultadoOperacionDTO>();
                return result?.Exitoso ?? false;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar stock del producto {ProductoId}", productoId);
            return false;
        }
    }
}