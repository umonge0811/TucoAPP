// Se agregan métodos para la obtención de productos públicos para el sitio web.
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using Tuco.Clases.DTOs.Inventario;
using System.Text.Json; // Se necesita para JsonSerializerOptions

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// 🏪 SERVICIO DE INVENTARIO - GESTIÓN COMPLETA DE PRODUCTOS Y STOCK
    /// Utiliza ApiConfigurationService para URLs centralizadas y proporciona
    /// funcionalidades completas para el manejo del inventario del sistema
    /// </summary>
    public class InventarioService : IInventarioService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<InventarioService> _logger;
        private readonly IConfiguration _configuration;

        /// ✅ SERVICIO DE CONFIGURACIÓN CENTRALIZADA
        /// Este servicio permite acceder a la URL base de la API de forma centralizada
        /// y construir URLs completas para los endpoints del inventario
        private readonly ApiConfigurationService _apiConfig;

        // Opciones para JsonSerializer para manejar la serialización de forma consistente
        private readonly JsonSerializerOptions _jsonOptions;

        /// ✅ CONSTRUCTOR: CONFIGURACIÓN DE DEPENDENCIAS
        /// <summary>
        /// Inicializa el servicio de inventario con todas las dependencias necesarias
        /// </summary>
        /// <param name="httpClient">Cliente HTTP para realizar peticiones a la API</param>
        /// <param name="logger">Logger para registrar operaciones y errores</param>
        /// <param name="configuration">Configuración de la aplicación</param>
        /// <param name="apiConfig">Servicio centralizado para URLs de la API</param>
        public InventarioService(HttpClient httpClient, ILogger<InventarioService> logger, IConfiguration configuration, ApiConfigurationService apiConfig)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;

            /// ✅ INYECCIÓN DEL SERVICIO DE CONFIGURACIÓN CENTRALIZADA
            _apiConfig = apiConfig;

            // Configuración de JsonSerializerOptions para consistencia
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true, // Ignora mayúsculas/minúsculas en los nombres de propiedad
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase // Convierte nombres de propiedad a camelCase si es necesario
            };

            // Log de diagnóstico para verificar la configuración
            _logger.LogInformation("🔧 InventarioService inicializado. URL base API: {BaseUrl}", _apiConfig.BaseUrl);
        }

        /// ✅ OPERACIÓN: OBTENER TODOS LOS PRODUCTOS DEL INVENTARIO
        /// <summary>
        /// 📦 Obtiene la lista completa de productos desde la API
        /// Incluye información de imágenes, llantas y stock actualizado
        /// </summary>
        /// <param name="jwtToken">Token JWT para autenticación (opcional)</param>
        /// <returns>Lista de productos del inventario</returns>
        public async Task<List<ProductoDTO>> ObtenerProductosAsync(string? jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 === INICIANDO OBTENCIÓN DE PRODUCTOS ===");

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA - CORREGIDA
                var url = _apiConfig.GetApiUrl("Inventario/productos");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error obteniendo productos: {response.StatusCode} - {errorContent}");

                    /// ✅ LOG ADICIONAL PARA DEBUGGING
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        _logger.LogWarning("🚫 Error 401: Token JWT inválido o expirado");
                    }

                    return new List<ProductoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"📄 Respuesta recibida de la API, procesando {content.Length} caracteres...");

                // Deserializar la respuesta JSON
                var rawData = JsonConvert.DeserializeObject<dynamic>(content);
                var productos = new List<ProductoDTO>();

                if (rawData == null)
                {
                    _logger.LogWarning("⚠️ La respuesta de la API es null");
                    return new List<ProductoDTO>();
                }

                /// ✅ PROCESAMIENTO: MAPEO DE PRODUCTOS
                foreach (var item in rawData)
                {
                    try
                    {
                        // Mapeo directo basado en ProductoDTO
                        var producto = new ProductoDTO
                        {
                            ProductoId = (int)item.productoId,
                            NombreProducto = (string)item.nombreProducto ?? "Sin nombre",
                            Descripcion = item.descripcion?.ToString(),

                            // Campos de costo y utilidad (nullable en DTO)
                            Costo = item.costo != null ? (decimal?)item.costo : null,
                            PorcentajeUtilidad = item.porcentajeUtilidad != null ? (decimal?)item.porcentajeUtilidad : null,

                            // Precio - usar el precio calculado de la API o el precio normal
                            Precio = item.precio ,

                            CantidadEnInventario = (int)item.cantidadEnInventario,
                            StockMinimo = (int)item.stockMinimo,

                            FechaUltimaActualizacion = item.fechaUltimaActualizacion != null ?
                                DateTime.Parse(item.fechaUltimaActualizacion.ToString()) : (DateTime?)null,

                            EsLlanta = item.llanta != null,
                            TienePedidoPendiente = item.tienePedidoPendiente != null ? (bool)item.tienePedidoPendiente : false,

                            Imagenes = new List<ImagenProductoDTO>()
                        };

                        /// ✅ PROCESAMIENTO: IMÁGENES DEL PRODUCTO - CORREGIDO
                        if (item.imagenesProductos != null)
                        {
                            foreach (var img in item.imagenesProductos)
                            {
                                var imagenUrl = img.urlimagen?.ToString() ?? "";

                                // ✅ CONSTRUIR URL COMPLETA USANDO EL SERVICIO CENTRALIZADO
                                if (!string.IsNullOrEmpty(imagenUrl) && !imagenUrl.StartsWith("http"))
                                {
                                    // Usar la URL base del servicio centralizado
                                    string apiBaseUrl = _apiConfig.BaseUrl.TrimEnd('/');

                                    // Asegurar que la URL de imagen comience con "/"
                                    if (!imagenUrl.StartsWith("/"))
                                    {
                                        imagenUrl = "/" + imagenUrl;
                                    }

                                    imagenUrl = $"{apiBaseUrl}{imagenUrl}";
                                }

                                producto.Imagenes.Add(new ImagenProductoDTO
                                {
                                    ImagenId = (int)img.imagenId,
                                    ProductoId = producto.ProductoId,
                                    UrlImagen = imagenUrl,
                                    Descripcion = img.descripcion?.ToString() ?? ""
                                });

                                _logger.LogInformation($"🖼️ Imagen procesada: {imagenUrl}");
                            }
                        }

                        /// ✅ PROCESAMIENTO: INFORMACIÓN DE LLANTA
                        if (item.llanta != null)
                        {
                            var llantaData = item.llanta;

                            producto.Llanta = new LlantaDTO
                            {
                                LlantaId = (int)llantaData.llantaId,
                                ProductoId = producto.ProductoId,
                                Ancho = llantaData.ancho != null ? (decimal?)llantaData.ancho : null,
                                Perfil = llantaData.perfil != null ? (decimal?)llantaData.perfil : null,
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
                _logger.LogError(ex, "💥 Error general al obtener productos: {Message}", ex.Message);
                return new List<ProductoDTO>();
            }
        }

        /// ✅ OPERACIÓN: OBTENER PRODUCTO POR ID
        /// <summary>
        /// 🔎 Obtiene un producto específico por su ID con toda su información detallada
        /// Incluye imágenes, información de llanta si aplica, y datos de stock
        /// </summary>
        /// <param name="id">ID del producto a obtener</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Producto completo con toda su información</returns>
        public async Task<ProductoDTO> ObtenerProductoPorIdAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 === INICIANDO OBTENCIÓN DE PRODUCTO POR ID ===");
                _logger.LogInformation("📋 Producto ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error del servidor: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return new ProductoDTO { ProductoId = 0 };
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📄 Contenido recibido ({Length} chars)", content.Length);

                /// ✅ PROCESAMIENTO: DESERIALIZACIÓN SEGURA
                var item = JsonConvert.DeserializeObject<dynamic>(content);

                if (item == null)
                {
                    _logger.LogError("❌ Error: La deserialización retornó null");
                    return new ProductoDTO { ProductoId = 0 };
                }

                /// ✅ PROCESAMIENTO: MAPEO SEGURO DEL PRODUCTO
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

                /// ✅ PROCESAMIENTO: IMÁGENES DE FORMA SEGURA - CORREGIDO
                try
                {
                    if (item.imagenesProductos != null)
                    {
                        string apiBaseUrl = _apiConfig.BaseUrl.TrimEnd('/');

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
                                    _logger.LogInformation($"🖼️ Imagen procesada: {imagenUrl}");
                                }
                            }
                            catch (Exception imgEx)
                            {
                                _logger.LogWarning(imgEx, "⚠️ Error procesando imagen individual");
                            }
                        }

                        _logger.LogInformation("✅ Total de imágenes procesadas: {Count}", producto.Imagenes.Count);
                    }
                }
                catch (Exception imgEx)
                {
                    _logger.LogError(imgEx, "❌ Error procesando imágenes");
                }

                /// ✅ PROCESAMIENTO: LLANTA DE FORMA SEGURA
                try
                {
                    if (item.llanta != null)
                    {
                        dynamic llantaData = null;

                        // Manejar tanto array como objeto directo
                        if (item.llanta is Newtonsoft.Json.Linq.JArray)
                        {
                            var llantaArray = item.llanta as Newtonsoft.Json.Linq.JArray;
                            if (llantaArray != null && llantaArray.Count > 0)
                            {
                                llantaData = llantaArray[0];
                            }
                        }
                        else
                        {
                            llantaData = item.llanta;
                        }

                        if (llantaData != null)
                        {
                            producto.Llanta = new LlantaDTO
                            {
                                LlantaId = GetSafeInt(llantaData.llantaId, 0),
                                ProductoId = producto.ProductoId,
                                Ancho = GetSafeNullableDecimal(llantaData.ancho),
                                Perfil = GetSafeNullableDecimal(llantaData.perfil),
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
                }
                catch (Exception llantaEx)
                {
                    _logger.LogError(llantaEx, "❌ Error procesando llanta");
                }

                _logger.LogInformation("🎉 === PRODUCTO COMPLETAMENTE PROCESADO ===");
                return producto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al obtener producto ID: {Id}", id);
                return new ProductoDTO
                {
                    ProductoId = 0,
                    NombreProducto = "Error al cargar producto",
                    Imagenes = new List<ImagenProductoDTO>()
                };
            }
        }

        /// ✅ OPERACIÓN: AGREGAR NUEVO PRODUCTO
        /// <summary>
        /// ➕ Agrega un nuevo producto al inventario con imágenes opcionales
        /// Calcula automáticamente el precio si se proporcionan costo y utilidad
        /// </summary>
        /// <param name="producto">Datos del producto a agregar</param>
        /// <param name="imagenes">Lista de archivos de imagen (opcional)</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se agregó exitosamente</returns>
        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("➕ === INICIANDO AGREGAR PRODUCTO ===");
                _logger.LogInformation("📋 Producto: {NombreProducto}", producto.NombreProducto);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ PROCESAMIENTO: CÁLCULO DE PRECIO FINAL
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
                        tipoTerreno = producto.Llanta.TipoTerreno ?? string.Empty,
                        tipoVehiculo = producto.Llanta.TipoVehiculo ?? string.Empty
                    } : null,
                    Imagenes = new List<object>()
                };

                var jsonContent = JsonConvert.SerializeObject(productoRequest,
                    new JsonSerializerSettings
                    {
                        NullValueHandling = NullValueHandling.Include
                    });

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl("Inventario/productos");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta de la API. Status: {Status}, Contenido: {Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al crear producto. Código: {StatusCode}, Error: {Error}",
                        response.StatusCode, responseContent);
                    return false;
                }

                /// ✅ PROCESAMIENTO: SUBIR IMÁGENES SI EXISTEN
                dynamic? responseObj;
                try
                {
                    responseObj = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    if (responseObj == null)
                    {
                        _logger.LogError("❌ No se pudo deserializar la respuesta de la API");
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error al deserializar respuesta: {Message}", ex.Message);
                    return false;
                }

                int productoId = responseObj.productoId;
                _logger.LogInformation("✅ Producto creado exitosamente. ID: {ProductoId}", productoId);

                /// ✅ PROCESAMIENTO: SUBIR IMÁGENES
                if (imagenes != null && imagenes.Any())
                {
                    _logger.LogInformation("📷 Subiendo {Count} imágenes para el producto ID: {ProductoId}",
                        imagenes.Count, productoId);

                    using var formData = new MultipartFormDataContent();

                    foreach (var imagen in imagenes)
                    {
                        if (imagen.Length > 0)
                        {
                            var streamContent = new StreamContent(imagen.OpenReadStream());
                            streamContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);
                            formData.Add(streamContent, "imagenes", imagen.FileName);
                        }
                    }

                    /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA PARA IMÁGENES
                    var imageUploadUrl = _apiConfig.GetApiUrl($"Inventario/productos/{productoId}/imagenes");
                    _logger.LogInformation($"🌐 URL construida para imágenes: {imageUploadUrl}");

                    var imageResponse = await _httpClient.PostAsync(imageUploadUrl, formData);
                    var imageResponseContent = await imageResponse.Content.ReadAsStringAsync();

                    _logger.LogInformation("📡 Respuesta de subida de imágenes. Status: {Status}",
                        imageResponse.StatusCode);

                    if (!imageResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("⚠️ No se pudieron subir todas las imágenes. Status: {Status}",
                            imageResponse.StatusCode);
                    }
                    else
                    {
                        _logger.LogInformation("✅ Imágenes subidas exitosamente");
                    }
                }

                _logger.LogInformation("🎉 === PRODUCTO AGREGADO EXITOSAMENTE ===");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error en el proceso de agregar producto: {Message}", ex.Message);
                return false;
            }
        }

        /// ✅ OPERACIÓN: ACTUALIZAR PRODUCTO EXISTENTE
        /// <summary>
        /// 🔄 Actualiza un producto existente en el inventario
        /// Puede incluir nuevas imágenes y actualizar información de llanta
        /// </summary>
        /// <param name="id">ID del producto a actualizar</param>
        /// <param name="producto">Nuevos datos del producto</param>
        /// <param name="nuevasImagenes">Nuevas imágenes a agregar (opcional)</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se actualizó exitosamente</returns>
        public async Task<bool> ActualizarProductoAsync(int id, ProductoDTO producto, List<IFormFile> nuevasImagenes, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔄 === INICIANDO ACTUALIZACIÓN DE PRODUCTO ===");
                _logger.LogInformation("📋 ID: {Id}, Nombre: '{Nombre}'", id, producto.NombreProducto);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para actualización");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ PROCESAMIENTO: CÁLCULO DE PRECIO FINAL
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
                        tipoTerreno = producto.Llanta.TipoTerreno ?? string.Empty,
                        tipoVehiculo = producto.Llanta.TipoVehiculo ?? string.Empty
                    } : null
                };

                var jsonContent = JsonConvert.SerializeObject(productoRequest,
                    new JsonSerializerSettings
                    {
                        NullValueHandling = NullValueHandling.Include
                    });

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PutAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta de actualización: Status={Status}",
                    response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al actualizar producto: {StatusCode}",
                        response.StatusCode);
                    return false;
                }

                _logger.LogInformation("✅ Producto actualizado exitosamente en la API");

                /// ✅ PROCESAMIENTO: SUBIR NUEVAS IMÁGENES
                if (nuevasImagenes != null && nuevasImagenes.Any())
                {
                    _logger.LogInformation("📷 Subiendo {Count} nuevas imágenes...", nuevasImagenes.Count);

                    bool imagenesSubidas = await SubirNuevasImagenesAsync(id, nuevasImagenes);
                    if (!imagenesSubidas)
                    {
                        _logger.LogWarning("⚠️ Algunas imágenes no se pudieron subir");
                    }
                    else
                    {
                        _logger.LogInformation("✅ Todas las nuevas imágenes subidas correctamente");
                    }
                }

                _logger.LogInformation("🎉 === ACTUALIZACIÓN COMPLETADA EXITOSAMENTE ===");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al actualizar producto ID: {Id}", id);
                return false;
            }
        }

        /// ✅ OPERACIÓN: ELIMINAR IMAGEN ESPECÍFICA
        /// <summary>
        /// 🗑️ Elimina una imagen específica de un producto
        /// </summary>
        /// <param name="productoId">ID del producto</param>
        /// <param name="imagenId">ID de la imagen a eliminar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se eliminó exitosamente</returns>
        public async Task<bool> EliminarImagenProductoAsync(int productoId, int imagenId, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🗑️ === INICIANDO ELIMINACIÓN DE IMAGEN ===");
                _logger.LogInformation("📋 ProductoId: {ProductoId}, ImagenId: {ImagenId}", productoId, imagenId);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado correctamente");
                }
                else
                {
                    _logger.LogError("❌ TOKEN JWT FALTANTE EN ELIMINACIÓN");
                    return false;
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{productoId}/imagenes/{imagenId}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.DeleteAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta: Status={StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al eliminar imagen: {Status}",
                        response.StatusCode);
                    return false;
                }

                _logger.LogInformation("✅ Imagen {ImagenId} eliminada exitosamente", imagenId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al eliminar imagen {ImagenId}", imagenId);
                return false;
            }
        }

        /// ✅ OPERACIÓN: ELIMINAR PRODUCTO COMPLETO
        /// <summary>
        /// 🗑️ Elimina un producto completo del sistema
        /// </summary>
        /// <param name="id">ID del producto a eliminar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se eliminó exitosamente</returns>
        public async Task<bool> EliminarProductoAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🗑️ === INICIANDO ELIMINACIÓN DE PRODUCTO ===");
                _logger.LogInformation("📋 Producto ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para eliminación");
                }
                else
                {
                    _logger.LogError("❌ TOKEN JWT FALTANTE EN ELIMINACIÓN");
                    return false;
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.DeleteAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al eliminar producto: {Status}",
                        response.StatusCode);
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

        /// ✅ OPERACIÓN: AJUSTAR STOCK RÁPIDO
        /// <summary>
        /// 📦 Realiza un ajuste rápido de stock en un producto específico
        /// </summary>
        /// <param name="id">ID del producto</param>
        /// <param name="ajusteDto">Datos del ajuste de stock</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Resultado detallado del ajuste</returns>
        public async Task<AjusteStockRapidoResponseDTO> AjustarStockRapidoAsync(int id, AjusteStockRapidoDTO ajusteDto, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 === INICIANDO AJUSTE DE STOCK ===");
                _logger.LogInformation("📋 Producto ID: {Id}, Tipo: {Tipo}, Cantidad: {Cantidad}",
                    id, ajusteDto.TipoAjuste, ajusteDto.Cantidad);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
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

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{id}/ajustar-stock");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta - Status: {Status}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en la API al ajustar stock: {Status}",
                        response.StatusCode);

                    return new AjusteStockRapidoResponseDTO
                    {
                        Success = false,
                        Message = $"Error en la API: {response.StatusCode}"
                    };
                }

                var resultado = JsonConvert.DeserializeObject<AjusteStockRapidoResponseDTO>(responseContent);

                if (resultado == null)
                {
                    return new AjusteStockRapidoResponseDTO
                    {
                        Success = false,
                        Message = "Error al procesar la respuesta de la API"
                    };
                }

                _logger.LogInformation("✅ === AJUSTE DE STOCK COMPLETADO ===");
                return resultado;
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

        /// ✅ OPERACIÓN: OBTENER INVENTARIOS PROGRAMADOS
        /// <summary>
        /// 📋 Obtiene todos los inventarios programados del sistema
        /// </summary>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de inventarios programados</returns>
        public async Task<List<InventarioProgramadoDTO>> ObtenerInventariosProgramadosAsync(string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO INVENTARIOS PROGRAMADOS ===");

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl("Inventario/inventarios-programados");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error obteniendo inventarios programados: {response.StatusCode}");
                    return new List<InventarioProgramadoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var inventarios = JsonConvert.DeserializeObject<List<InventarioProgramadoDTO>>(content);

                _logger.LogInformation("✅ Se obtuvieron {Count} inventarios programados", inventarios?.Count ?? 0);
                return inventarios ?? new List<InventarioProgramadoDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener inventarios programados");
                return new List<InventarioProgramadoDTO>();
            }
        }

        /// ✅ OPERACIÓN: OBTENER INVENTARIO PROGRAMADO POR ID
        /// <summary>
        /// 🔎 Obtiene un inventario programado específico por su ID
        /// </summary>
        /// <param name="id">ID del inventario programado</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Inventario programado con detalles completos</returns>
        public async Task<InventarioProgramadoDTO> ObtenerInventarioProgramadoPorIdAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔎 === OBTENIENDO INVENTARIO PROGRAMADO POR ID ===");
                _logger.LogInformation("📋 Inventario ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error obteniendo inventario programado: {response.StatusCode}");
                    return new InventarioProgramadoDTO();
                }

                var content = await response.Content.ReadAsStringAsync();
                var inventario = JsonConvert.DeserializeObject<InventarioProgramadoDTO>(content);

                _logger.LogInformation("✅ Inventario programado obtenido exitosamente");
                return inventario ?? new InventarioProgramadoDTO();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener inventario programado con ID: {Id}", id);
                return new InventarioProgramadoDTO();
            }
        }

        /// ✅ OPERACIÓN: GUARDAR INVENTARIO PROGRAMADO
        /// <summary>
        /// 💾 Guarda un nuevo inventario programado en el sistema
        /// </summary>
        /// <param name="inventario">Datos del inventario a programar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se guardó exitosamente</returns>
        public async Task<bool> GuardarInventarioProgramadoAsync(InventarioProgramadoDTO inventario, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("💾 === INICIANDO GUARDAR INVENTARIO PROGRAMADO ===");
                _logger.LogInformation("📋 Título: {Titulo}", inventario.Titulo);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogError("❌ NO SE PROPORCIONÓ TOKEN JWT");
                }

                var json = JsonConvert.SerializeObject(inventario, new JsonSerializerSettings
                {
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                var content = new StringContent(json, Encoding.UTF8, "application/json");

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl("Inventario/inventarios-programados");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta - Status: {Status}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error guardando inventario programado: {Status}",
                        response.StatusCode);
                    return false;
                }

                _logger.LogInformation("✅ Inventario programado guardado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al guardar inventario programado: {Message}", ex.Message);
                return false;
            }
        }

        /// ✅ OPERACIÓN: ACTUALIZAR INVENTARIO PROGRAMADO
        /// <summary>
        /// 🔄 Actualiza un inventario programado existente
        /// </summary>
        /// <param name="id">ID del inventario a actualizar</param>
        /// <param name="inventario">Nuevos datos del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se actualizó exitosamente</returns>
        public async Task<bool> ActualizarInventarioProgramadoAsync(int id, InventarioProgramadoDTO inventario, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔄 === ACTUALIZANDO INVENTARIO PROGRAMADO ===");
                _logger.LogInformation("📋 ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                var json = JsonConvert.SerializeObject(inventario);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PutAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error actualizando inventario programado: {response.StatusCode}");
                    return false;
                }

                _logger.LogInformation("✅ Inventario programado actualizado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al actualizar inventario programado con ID: {Id}", id);
                return false;
            }
        }

        /// ✅ OPERACIÓN: INICIAR INVENTARIO
        /// <summary>
        /// 🚀 Inicia un inventario programado para comenzar el proceso de conteo
        /// </summary>
        /// <param name="id">ID del inventario a iniciar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se inició exitosamente</returns>
        public async Task<bool> IniciarInventarioAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🚀 === INICIANDO INVENTARIO ===");
                _logger.LogInformation("📋 Inventario ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}/iniciar");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error iniciando inventario: {response.StatusCode}");
                    return false;
                }

                _logger.LogInformation("✅ Inventario iniciado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al iniciar inventario con ID: {Id}", id);
                return false;
            }
        }

        /// ✅ OPERACIÓN: CANCELAR INVENTARIO
        /// <summary>
        /// ❌ Cancela un inventario programado
        /// </summary>
        /// <param name="id">ID del inventario a cancelar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se canceló exitosamente</returns>
        public async Task<bool> CancelarInventarioAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("❌ === CANCELANDO INVENTARIO ===");
                _logger.LogInformation("📋 Inventario ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}/cancelar");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error cancelando inventario: {response.StatusCode}");
                    return false;
                }

                _logger.LogInformation("✅ Inventario cancelado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al cancelar inventario con ID: {Id}", id);
                return false;
            }
        }

        /// ✅ OPERACIÓN: COMPLETAR INVENTARIO
        /// <summary>
        /// ✅ Completa un inventario programado aplicando todos los ajustes
        /// </summary>
        /// <param name="id">ID del inventario a completar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>True si se completó exitosamente</returns>
        public async Task<bool> CompletarInventarioAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("✅ === COMPLETANDO INVENTARIO ===");
                _logger.LogInformation("📋 Inventario ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}/completar");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error completando inventario: {response.StatusCode}");
                    return false;
                }

                _logger.LogInformation("✅ Inventario completado exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al completar inventario con ID: {Id}", id);
                return false;
            }
        }

        /// ✅ OPERACIÓN: EXPORTAR INVENTARIO A EXCEL
        /// <summary>
        /// 📊 Exporta los resultados de un inventario a formato Excel
        /// </summary>
        /// <param name="id">ID del inventario a exportar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Stream del archivo Excel generado</returns>
        public async Task<Stream> ExportarResultadosInventarioExcelAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📊 === EXPORTANDO INVENTARIO A EXCEL ===");
                _logger.LogInformation("📋 Inventario ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}/exportar-excel");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error exportando a Excel: {response.StatusCode}");
                    throw new Exception($"Error al exportar a Excel: {response.StatusCode}");
                }

                var stream = await response.Content.ReadAsStreamAsync();
                _logger.LogInformation("✅ Archivo Excel generado exitosamente");
                return stream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al exportar inventario a Excel para ID: {Id}", id);
                throw;
            }
        }

        /// ✅ OPERACIÓN: EXPORTAR INVENTARIO A PDF
        /// <summary>
        /// 📄 Exporta los resultados de un inventario a formato PDF
        /// </summary>
        /// <param name="id">ID del inventario a exportar</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Stream del archivo PDF generado</returns>
        public async Task<Stream> ExportarResultadosInventarioPDFAsync(int id, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📄 === EXPORTANDO INVENTARIO A PDF ===");
                _logger.LogInformation("📋 Inventario ID: {Id}", id);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{id}/exportar-pdf");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error exportando a PDF: {response.StatusCode}");
                    throw new Exception($"Error al exportar a PDF: {response.StatusCode}");
                }

                var stream = await response.Content.ReadAsStreamAsync();
                _logger.LogInformation("✅ Archivo PDF generado exitosamente");
                return stream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al exportar inventario a PDF para ID: {Id}", id);
                throw;
            }
        }

        /// ✅ OPERACIÓN: BUSCAR MARCAS DE LLANTAS
        /// <summary>
        /// 🔍 Busca marcas de llantas que coincidan con el filtro proporcionado
        /// </summary>
        /// <param name="filtro">Texto para filtrar las marcas</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de marcas que coinciden con el filtro</returns>
        public async Task<List<string>> BuscarMarcasLlantasAsync(string filtro = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 === BUSCANDO MARCAS DE LLANTAS ===");
                _logger.LogInformation("🔍 Filtro: '{Filtro}'", filtro);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA CON PARÁMETROS
                string endpoint = "Inventario/marcas-busqueda";
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    endpoint += $"?filtro={Uri.EscapeDataString(filtro)}";
                }

                var url = _apiConfig.GetApiUrl(endpoint);
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo marcas: {StatusCode}", response.StatusCode);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var marcas = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} marcas", marcas.Count);
                return marcas;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar marcas");
                return new List<string>();
            }
        }

        /// ✅ OPERACIÓN: BUSCAR MODELOS DE LLANTAS
        /// <summary>
        /// 🔍 Busca modelos de llantas que coincidan con el filtro, opcionalmente por marca
        /// </summary>
        /// <param name="filtro">Texto para filtrar los modelos</param>
        /// <param name="marca">Marca específica para filtrar (opcional)</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de modelos que coinciden con el filtro</returns>
        public async Task<List<string>> BuscarModelosLlantasAsync(string filtro = "", string marca = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 === BUSCANDO MODELOS DE LLANTAS ===");
                _logger.LogInformation("🔍 Filtro: '{Filtro}', Marca: '{Marca}'", filtro, marca);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA CON PARÁMETROS
                string endpoint = "Inventario/modelos-busqueda";
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
                    endpoint += "?" + string.Join("&", parameters);
                }

                var url = _apiConfig.GetApiUrl(endpoint);
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo modelos: {StatusCode}", response.StatusCode);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var modelos = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} modelos", modelos.Count);
                return modelos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar modelos");
                return new List<string>();
            }
        }

        /// ✅ OPERACIÓN: BUSCAR ÍNDICES DE VELOCIDAD
        /// <summary>
        /// 🔍 Busca índices de velocidad que coincidan con el filtro proporcionado
        /// </summary>
        /// <param name="filtro">Texto para filtrar los índices</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de índices de velocidad</returns>
        public async Task<List<string>> BuscarIndicesVelocidadAsync(string filtro = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 === BUSCANDO ÍNDICES DE VELOCIDAD ===");
                _logger.LogInformation("🔍 Filtro: '{Filtro}'", filtro);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA CON PARÁMETROS
                string endpoint = "Inventario/indices-velocidad-busqueda";
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    endpoint += $"?filtro={Uri.EscapeDataString(filtro)}";
                }

                var url = _apiConfig.GetApiUrl(endpoint);
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo índices de velocidad: {StatusCode}", response.StatusCode);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var indices = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} índices de velocidad", indices.Count);
                return indices;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar índices de velocidad");
                return new List<string>();
            }
        }

        /// ✅ OPERACIÓN: BUSCAR TIPOS DE TERRENO
        /// <summary>
        /// 🔍 Busca tipos de terreno que coincidan con el filtro proporcionado
        /// </summary>
        /// <param name="filtro">Texto para filtrar los tipos</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de tipos de terreno</returns>
        public async Task<List<string>> BuscarTiposTerrenoAsync(string filtro = "", string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔍 === BUSCANDO TIPOS DE TERRENO ===");
                _logger.LogInformation("🔍 Filtro: '{Filtro}'", filtro);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA CON PARÁMETROS
                string endpoint = "Inventario/tipos-terreno-busqueda";
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    endpoint += $"?filtro={Uri.EscapeDataString(filtro)}";
                }

                var url = _apiConfig.GetApiUrl(endpoint);
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo tipos de terreno: {StatusCode}", response.StatusCode);
                    return new List<string>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var tipos = JsonConvert.DeserializeObject<List<string>>(content) ?? new List<string>();

                _logger.LogInformation("✅ Se obtuvieron {Count} tipos de terreno", tipos.Count);
                return tipos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar tipos de terreno");
                return new List<string>();
            }
        }

        /// ✅ OPERACIÓN: OBTENER TODOS LOS INVENTARIOS (ADMINISTRADOR)
        /// <summary>
        /// 👑 Obtiene todos los inventarios del sistema (funcionalidad de administrador)
        /// </summary>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista completa de inventarios del sistema</returns>
        public async Task<List<InventarioProgramadoDTO>> ObtenerTodosLosInventariosAsync(string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("👑 === OBTENIENDO TODOS LOS INVENTARIOS (ADMIN) ===");

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl("Inventario/inventarios-programados");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error obteniendo todos los inventarios: {response.StatusCode}");
                    return new List<InventarioProgramadoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var inventarios = JsonConvert.DeserializeObject<List<InventarioProgramadoDTO>>(content);

                _logger.LogInformation("✅ Se obtuvieron {Count} inventarios del sistema", inventarios?.Count ?? 0);
                return inventarios ?? new List<InventarioProgramadoDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener todos los inventarios del sistema");
                return new List<InventarioProgramadoDTO>();
            }
        }

        /// ✅ OPERACIÓN: OBTENER DISCREPANCIAS DE INVENTARIO
        /// <summary>
        /// ⚠️ Obtiene las discrepancias detectadas en un inventario específico
        /// </summary>
        /// <param name="inventarioId">ID del inventario</param>
        /// <param name="jwtToken">Token JWT para autenticación</param>
        /// <returns>Lista de discrepancias encontradas</returns>
        public async Task<List<dynamic>> ObtenerDiscrepanciasInventarioAsync(int inventarioId, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("⚠️ === OBTENIENDO DISCREPANCIAS DE INVENTARIO ===");
                _logger.LogInformation("📋 Inventario ID: {InventarioId}", inventarioId);

                /// ✅ CONFIGURACIÓN: AUTENTICACIÓN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado correctamente");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT");
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"TomaInventario/{inventarioId}/discrepancias");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API: {StatusCode}", response.StatusCode);
                    return new List<dynamic>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📄 Contenido recibido: {Length} caracteres", content?.Length ?? 0);

                if (string.IsNullOrEmpty(content))
                {
                    _logger.LogWarning("⚠️ Respuesta vacía de la API");
                    return new List<dynamic>();
                }

                var discrepancias = JsonConvert.DeserializeObject<List<object>>(content);

                if (discrepancias == null)
                {
                    _logger.LogWarning("⚠️ No se pudo deserializar la respuesta");
                    return new List<dynamic>();
                }

                var discrepanciasDinamicas = discrepancias.Cast<dynamic>().ToList();

                _logger.LogInformation("✅ === DISCREPANCIAS PROCESADAS ===");
                _logger.LogInformation("📊 Total discrepancias: {Count}", discrepanciasDinamicas.Count);

                return discrepanciasDinamicas;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al obtener discrepancias del inventario {InventarioId}", inventarioId);
                return new List<dynamic>();
            }
        }

        /// ✅ OPERACIÓN: AJUSTAR STOCK (MÉTODO SIMPLE)
        /// <summary>
        /// 📦 Realiza un ajuste simple de stock en un producto
        /// </summary>
        /// <param name="id">ID del producto</param>
        /// <param name="cantidad">Cantidad a ajustar</param>
        /// <param name="tipoAjuste">Tipo de ajuste a realizar</param>
        /// <returns>True si se ajustó exitosamente</returns>
        public async Task<bool> AjustarStockAsync(int id, int cantidad, string tipoAjuste)
        {
            try
            {
                _logger.LogInformation("📦 === AJUSTE SIMPLE DE STOCK ===");
                _logger.LogInformation("📋 Producto ID: {Id}, Cantidad: {Cantidad}, Tipo: {Tipo}",
                    id, cantidad, tipoAjuste);

                var ajuste = new
                {
                    Cantidad = cantidad,
                    TipoAjuste = tipoAjuste
                };

                var json = JsonConvert.SerializeObject(ajuste);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{id}/ajuste-stock");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var response = await _httpClient.PostAsync(url, content);

                _logger.LogInformation("📡 Respuesta: {StatusCode}", response.StatusCode);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al ajustar stock. Producto ID: {Id}", id);
                return false;
            }
        }

        // =====================================
        // 🛠️ MÉTODOS AUXILIARES PRIVADOS
        // =====================================

        /// ✅ MÉTODO AUXILIAR: CALCULAR PRECIO FINAL
        /// <summary>
        /// 💰 Calcula el precio final del producto basado en costo, utilidad o precio manual
        /// </summary>
        /// <param name="dto">Datos del producto</param>
        /// <returns>Precio final calculado</returns>
        private decimal CalcularPrecioFinal(ProductoDTO dto)
        {
            _logger.LogInformation("💰 === CALCULANDO PRECIO FINAL ===");
            _logger.LogInformation("💳 Costo: {Costo}, Utilidad: {Utilidad}%, Precio: {Precio}",
                dto.Costo, dto.PorcentajeUtilidad, dto.Precio);

            // Si tiene costo Y utilidad, calcular automáticamente (PRIORIDAD)
            if (dto.Costo.HasValue && dto.Costo.Value > 0 &&
                dto.PorcentajeUtilidad.HasValue && dto.PorcentajeUtilidad.Value >= 0)
            {
                var utilidadDinero = dto.Costo.Value * (dto.PorcentajeUtilidad.Value / 100m);
                var precioCalculado = dto.Costo.Value + utilidadDinero;

                _logger.LogInformation("🧮 Precio calculado automáticamente: ₡{Precio:N2}", precioCalculado);
                return precioCalculado;
            }

            // Si no, usar el precio manual
            var precioManual = dto.Precio.GetValueOrDefault(0m);
            var precioFinal = Math.Max(precioManual, 0.01m);

            _logger.LogInformation("📝 Precio manual usado: ₡{Precio:N2}", precioFinal);
            return precioFinal;
        }

        /// ✅ MÉTODO AUXILIAR: SUBIR NUEVAS IMÁGENES
        /// <summary>
        /// 📷 Sube nuevas imágenes para un producto específico
        /// </summary>
        /// <param name="productoId">ID del producto</param>
        /// <param name="imagenes">Lista de archivos de imagen</param>
        /// <returns>True si se subieron exitosamente</returns>
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
                        var streamContent = new StreamContent(imagen.OpenReadStream());
                        streamContent.Headers.ContentType = new MediaTypeHeaderValue(imagen.ContentType);
                        formData.Add(streamContent, "imagenes", imagen.FileName);
                    }
                }

                /// ✅ CONSTRUCCIÓN DE URL CENTRALIZADA
                var url = _apiConfig.GetApiUrl($"Inventario/productos/{productoId}/imagenes");
                _logger.LogInformation($"🌐 URL construida: {url}");

                var imageResponse = await _httpClient.PostAsync(url, formData);

                if (!imageResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error al subir nuevas imágenes: {Status}",
                        imageResponse.StatusCode);
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

        // =====================================
        // 🛡️ MÉTODOS AUXILIARES PARA MAPEO SEGURO
        // =====================================

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

        private static int? GetSafeNullableInt(object value)
        {
            if (value == null) return null;
            if (int.TryParse(value.ToString(), out int result))
                return result;
            return null;
        }

        private static decimal? GetSafeNullableDecimal(object value)
        {
            if (value == null) return null;
            if (decimal.TryParse(value.ToString(), out decimal result))
                return result;
            return null;
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

        // Nuevos métodos para vistas públicas
        public async Task<List<ProductoDTO>> ObtenerProductosPublicosAsync()
        {
            try
            {
                _logger.LogInformation("🔧 InventarioService inicializado. URL base API: {BaseUrl}", _httpClient.BaseAddress);

                var url = "api/Inventario/productos-publicos";
                _logger.LogInformation("🌐 URL construida para productos públicos: {Url}", $"{_httpClient.BaseAddress}{url}");

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();

                // ✅ El API devuelve: { success: true, productos: [...] }
                // Necesitamos extraer solo el array de productos
                using var document = System.Text.Json.JsonDocument.Parse(json);
                var root = document.RootElement;

                if (root.TryGetProperty("productos", out var productosElement))
                {
                    var productosJson = productosElement.GetRawText();
                    var productos = System.Text.Json.JsonSerializer.Deserialize<List<ProductoDTO>>(productosJson, _jsonOptions);

                    // Procesar URLs de imágenes para productos públicos
                    if (productos != null)
                    {
                        foreach (var producto in productos)
                        {
                            if (producto.Imagenes?.Any() == true)
                            {
                                foreach (var imagen in producto.Imagenes)
                                {
                                    if (!string.IsNullOrEmpty(imagen.UrlImagen) && !imagen.UrlImagen.StartsWith("http"))
                                    {
                                        // Asegurarse de que la URL base termina con '/' y la URL de la imagen no empieza con '/'
                                        imagen.UrlImagen = $"{_httpClient.BaseAddress?.ToString().TrimEnd('/')}/{imagen.UrlImagen.TrimStart('/')}";
                                    }
                                }
                            }
                        }
                    }

                    _logger.LogInformation($"✅ Se obtuvieron {productos?.Count ?? 0} productos públicos");
                    return productos ?? new List<ProductoDTO>();
                }
                else
                {
                    _logger.LogWarning("⚠️ No se encontró la propiedad 'productos' en la respuesta del API");
                    return new List<ProductoDTO>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al obtener productos públicos");
                return new List<ProductoDTO>();
            }
        }

        public async Task<ProductoDTO> ObtenerProductoPublicoPorIdAsync(int id)
        {
            try
            {
                // Se utiliza el endpoint específico para el detalle de productos públicos
                var url = _apiConfig.GetApiUrl($"Inventario/productos-publicos/{id}");
                _logger.LogInformation($"🌐 URL construida para producto público por ID: {url}");

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    // Usamos JsonSerializer de System.Text.Json con las opciones configuradas
                    var producto = System.Text.Json.JsonSerializer.Deserialize<ProductoDTO>(json, _jsonOptions);

                    // Procesar URLs de imágenes
                    if (producto?.Imagenes?.Any() == true)
                    {
                        foreach (var imagen in producto.Imagenes)
                        {
                            if (!string.IsNullOrEmpty(imagen.UrlImagen) && !imagen.UrlImagen.StartsWith("http"))
                            {
                                // Asegurarse de que la URL base termina con '/' y la URL de la imagen no empieza con '/'
                                imagen.UrlImagen = $"{_httpClient.BaseAddress?.ToString().TrimEnd('/')}/{imagen.UrlImagen.TrimStart('/')}";
                            }
                        }
                    }

                    _logger.LogInformation($"✅ Se obtuvo el producto público con ID: {id}.");
                    return producto;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Error al obtener producto público con ID {id}: {response.StatusCode} - {errorContent}");
                    return null; // Retorna null si no se encuentra o hay un error
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener producto público con ID: {Id}", id);
                return null;
            }
        }
    }
}