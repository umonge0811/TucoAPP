﻿// Ubicación: GestionLlantera.Web/Services/InventarioService.cs
using Tuco.Clases.DTOs.Inventario;
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

        // En InventarioService.cs
        // REEMPLAZA COMPLETAMENTE el método ObtenerProductosAsync() en InventarioService.cs:

        public async Task<List<ProductoDTO>> ObtenerProductosAsync()
        {
            try
            {
                _logger.LogInformation("Iniciando solicitud para obtener productos");

                var response = await _httpClient.GetAsync("api/Inventario/productos");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error obteniendo productos: {response.StatusCode} - {errorContent}");
                    return new List<ProductoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Respuesta recibida de la API, procesando {content.Length} caracteres...");

                // Deserializar la respuesta JSON
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
                        // ✅ Mapeo directo basado en tu ProductoDTO
                        var producto = new ProductoDTO
                        {
                            ProductoId = (int)item.productoId,
                            NombreProducto = (string)item.nombreProducto ?? "Sin nombre",
                            Descripcion = item.descripcion?.ToString(), // nullable

                            // ✅ Campos de costo y utilidad (nullable en tu DTO)
                            Costo = item.costo != null ? (decimal?)item.costo : null,
                            PorcentajeUtilidad = item.porcentajeUtilidad != null ? (decimal?)item.porcentajeUtilidad : null,

                            // ✅ Precio - usar el precio calculado de la API o el precio normal
                            Precio = item.precioCalculado != null ? (decimal?)item.precioCalculado :
                                     item.precio != null ? (decimal?)item.precio : null,

                            CantidadEnInventario = (int)item.cantidadEnInventario,
                            StockMinimo = (int)item.stockMinimo,

                            FechaUltimaActualizacion = item.fechaUltimaActualizacion != null ?
                                DateTime.Parse(item.fechaUltimaActualizacion.ToString()) : (DateTime?)null,

                            EsLlanta = item.llanta != null, // Se determina por la presencia de datos de llanta

                            Imagenes = new List<ImagenProductoDTO>()
                        };

                        // ✅ Procesar imágenes
                        if (item.imagenesProductos != null)
                        {
                            foreach (var img in item.imagenesProductos)
                            {
                                var imagenUrl = img.urlimagen?.ToString() ?? "";

                                // Construir URL completa para las imágenes
                                if (!string.IsNullOrEmpty(imagenUrl) && !imagenUrl.StartsWith("http"))
                                {
                                    string apiBaseUrl = _httpClient.BaseAddress?.ToString()?.TrimEnd('/') ?? "";
                                    imagenUrl = $"{apiBaseUrl}{imagenUrl}";
                                }

                                producto.Imagenes.Add(new ImagenProductoDTO
                                {
                                    ImagenId = (int)img.imagenId,
                                    ProductoId = producto.ProductoId, // Usar el ProductoId del producto
                                    UrlImagen = imagenUrl,
                                    Descripcion = img.descripcion?.ToString() ?? ""
                                });
                            }
                        }

                        // ✅ Procesar llanta (objeto directo en tu API)
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

                        // Log cada producto procesado
                        _logger.LogInformation($"✅ Producto procesado: {producto.NombreProducto} " +
                            $"(ID: {producto.ProductoId}, Precio: {producto.Precio}, " +
                            $"Stock: {producto.CantidadEnInventario}, Es Llanta: {producto.EsLlanta})");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"❌ Error procesando producto individual: {ex.Message}");
                        // Continuar con el siguiente producto sin fallar todo el proceso
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
        
        // Añade este método en InventarioService
        private List<ProductoDTO> MapearRespuestaProductos(string jsonResponse)
        {
            try
            {
                // Deserializa a un objeto dinámico para inspeccionar la estructura
                dynamic? rawData = JsonConvert.DeserializeObject<dynamic>(jsonResponse);

                if (rawData == null)
                {
                    _logger.LogWarning("La respuesta se deserializó como null");
                    return new List<ProductoDTO>();
                }

                // Crea una lista para almacenar los productos mapeados manualmente
                var productos = new List<ProductoDTO>();

                // Recorre la colección dinámica y mapea a tus DTOs
                foreach (var item in rawData)
                {
                    try
                    {
                        var producto = new ProductoDTO
                        {
                            ProductoId = item.productoId ?? 0,
                            NombreProducto = item.nombreProducto ?? "Sin nombre",
                            Descripcion = item.descripcion,
                            Precio = item.precio ?? 0,
                            CantidadEnInventario = item.cantidadEnInventario ?? 0,
                            StockMinimo = item.stockMinimo ?? 0,
                            // Mapear imágenes si existen
                            Imagenes = item.imagenesProductos != null ?
                                MapearImagenes(item.imagenesProductos) :
                                new List<ImagenProductoDTO>(),
                            // Mapear llanta si existe
                            Llanta = item.llanta != null ?
                            MapearLlanta(item.llanta) :
                            null  // Ahora devolvemos null en lugar de una lista vacía
                        };

                        productos.Add(producto);
                        _logger.LogInformation($"Producto mapeado: {producto.NombreProducto}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al mapear un producto individual");
                    }
                }

                return productos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el mapeo manual de productos");
                return new List<ProductoDTO>();
            }
        }

        private List<ImagenProductoDTO> MapearImagenes(dynamic imagenesObj)
        {
            var imagenes = new List<ImagenProductoDTO>();

            try
            {
                foreach (var img in imagenesObj)
                {
                    imagenes.Add(new ImagenProductoDTO
                    {
                        ImagenId = img.imagenId ?? 0,
                        ProductoId = img.productoId ?? 0,
                        UrlImagen = img.urlimagen ?? "",
                        Descripcion = img.descripcion
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al mapear imágenes");
            }

            return imagenes;
        }

        private LlantaDTO MapearLlanta(dynamic llantaObj)
        {
            try
            {
                // Si llantaObj es null, retornar null
                if (llantaObj == null)
                {
                    return null;
                }

                // Mapear a un único objeto LlantaDTO
                return new LlantaDTO
                {
                    LlantaId = llantaObj.llantaId ?? 0,
                    ProductoId = llantaObj.productoId ?? 0,
                    Ancho = llantaObj.ancho,
                    Perfil = llantaObj.perfil,
                    Diametro = llantaObj.diametro,
                    Marca = llantaObj.marca,
                    Modelo = llantaObj.modelo,
                    Capas = llantaObj.capas,
                    IndiceVelocidad = llantaObj.indiceVelocidad,
                    TipoTerreno = llantaObj.tipoTerreno
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al mapear llanta");
                return null;
            }
        }

        //public async Task<ProductoDTO> ObtenerProductoPorIdAsync(int id)
        //{
        //    try
        //    {
        //        var response = await _httpClient.GetAsync($"/api/Inventario/productos/{id}");
        //        response.EnsureSuccessStatusCode();

        //        var content = await response.Content.ReadAsStringAsync();
        //        _logger.LogInformation($"Respuesta al obtener producto ID {id}: {content}");

        //        // Deserializar a un objeto dinámico
        //        var item = JsonConvert.DeserializeObject<dynamic>(content);

        //        var producto = new ProductoDTO
        //        {
        //            ProductoId = (int)item.productoId,
        //            NombreProducto = (string)item.nombreProducto,
        //            Descripcion = (string)item.descripcion,
        //            Precio = (decimal)item.precio,
        //            CantidadEnInventario = (int)item.cantidadEnInventario,
        //            StockMinimo = (int)item.stockMinimo,
        //            Imagenes = new List<ImagenProductoDTO>()
        //        };

        //        // Procesar imágenes si existen
        //        if (item.imagenesProductos != null && item.imagenesProductos.Count > 0)
        //        {
        //            foreach (var img in item.imagenesProductos)
        //            {
        //                // Obtener la URL de la API
        //                string apiBaseUrl = _httpClient.BaseAddress.ToString().TrimEnd('/');
        //                string imagenUrl = (string)img.urlimagen;

        //                // Si la URL de la imagen no comienza con http, combinarla con la URL base de la API
        //                if (!string.IsNullOrEmpty(imagenUrl) && !imagenUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        //                {
        //                    imagenUrl = $"{apiBaseUrl}{imagenUrl}";
        //                }

        //                producto.Imagenes.Add(new ImagenProductoDTO
        //                {
        //                    ImagenId = (int)img.imagenId,
        //                    ProductoId = (int)img.productoId,
        //                    UrlImagen = imagenUrl,
        //                    Descripcion = img.descripcion != null ? (string)img.descripcion : null
        //                });
        //            }
        //        }

        //        // Procesar llanta si existe (tomar solo el primer elemento del array)
        //        if (item.llanta != null && item.llanta.Count > 0)
        //        {
        //            var llantaItem = item.llanta[0]; // Tomar el primer elemento
        //            producto.Llanta = new LlantaDTO
        //            {
        //                LlantaId = (int)llantaItem.llantaId,
        //                ProductoId = (int)llantaItem.productoId,
        //                Ancho = llantaItem.ancho != null ? (int?)llantaItem.ancho : null,
        //                Perfil = llantaItem.perfil != null ? (int?)llantaItem.perfil : null,
        //                Diametro = llantaItem.diametro != null ? (string)llantaItem.diametro : null,
        //                Marca = llantaItem.marca != null ? (string)llantaItem.marca : null,
        //                Modelo = llantaItem.modelo != null ? (string)llantaItem.modelo : null,
        //                Capas = llantaItem.capas != null ? (int?)llantaItem.capas : null,
        //                IndiceVelocidad = llantaItem.indiceVelocidad != null ? (string)llantaItem.indiceVelocidad : null,
        //                TipoTerreno = llantaItem.tipoTerreno != null ? (string)llantaItem.tipoTerreno : null
        //            };
        //        }

        //        return producto;
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error al obtener producto ID: {Id}", id);
        //        return new ProductoDTO();
        //    }
        //}

        public async Task<ProductoDTO> ObtenerProductoPorIdAsync(int id)
        {
            try
            {
                _logger.LogInformation("🔍 Iniciando ObtenerProductoPorIdAsync para ID: {Id}", id);

                // ✅ CORREGIR: Quitar la barra inicial de la URL
                var response = await _httpClient.GetAsync($"api/Inventario/productos/{id}");

                _logger.LogInformation("📡 Respuesta del servidor: {StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error del servidor: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return new ProductoDTO { ProductoId = 0 }; // Retornar objeto vacío pero válido
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📄 Contenido recibido ({Length} chars): {Content}",
                    content.Length, content.Length > 500 ? content.Substring(0, 500) + "..." : content);

                // ✅ MANEJO SEGURO DE DESERIALIZACIÓN
                var item = JsonConvert.DeserializeObject<dynamic>(content);

                if (item == null)
                {
                    _logger.LogError("❌ Error: La deserialización retornó null");
                    return new ProductoDTO { ProductoId = 0 };
                }

                // ✅ MAPEO SEGURO DEL PRODUCTO PRINCIPAL
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
                    EsLlanta = false, // Se determinará después
                    FechaUltimaActualizacion = GetSafeDateTime(item.fechaUltimaActualizacion),
                    Imagenes = new List<ImagenProductoDTO>()
                };

                _logger.LogInformation("✅ Producto base mapeado: {Nombre} (ID: {Id})", producto.NombreProducto, producto.ProductoId);

                // ✅ PROCESAR IMÁGENES DE FORMA SEGURA
                try
                {
                    if (item.imagenesProductos != null)
                    {
                        _logger.LogInformation("🖼️ Procesando imágenes...");

                        // Obtener la URL base una sola vez
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
                                    // ✅ CONSTRUCCIÓN SEGURA DE URL
                                    if (!imagenUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                                    {
                                        // Asegurar que la URL empiece con /
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

                                    //_logger.LogInformation("🖼️ Imagen {Index} procesada: {Url}", imagenesCount, imagenUrl);
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
                    // Continuar sin imágenes en lugar de fallar
                }

                // ✅ PROCESAR LLANTA DE FORMA SEGURA Y UNIFICADA
                try
                {
                    if (item.llanta != null)
                    {
                        _logger.LogInformation("🚗 Procesando datos de llanta...");

                        dynamic llantaData = null;

                        // ✅ MANEJAR TANTO ARRAY COMO OBJETO DIRECTO
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
                    // Continuar sin datos de llanta en lugar de fallar
                }

                _logger.LogInformation("🎉 Producto completamente procesado: {Nombre} (Imágenes: {ImageCount}, Es Llanta: {EsLlanta})",
                    producto.NombreProducto, producto.Imagenes.Count, producto.EsLlanta);

                return producto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al obtener producto ID: {Id} - {Message}", id, ex.Message);

                // En lugar de retornar un objeto vacío, crear uno básico con el ID
                return new ProductoDTO
                {
                    ProductoId = 0, // Indica que hubo error
                    NombreProducto = "Error al cargar producto",
                    Imagenes = new List<ImagenProductoDTO>()
                };
            }
        }// ✅ MÉTODOS AUXILIARES PARA MAPEO SEGURO
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

        public async Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes)
        {
            try
            {
                _logger.LogInformation("Iniciando proceso de agregar producto: {NombreProducto}", producto.NombreProducto);

                // ✅ NUEVO: Calcular el precio final usando la misma lógica del controlador
                var precioFinal = CalcularPrecioFinal(producto);

                // ✅ CORREGIDO: Crear un objeto con la estructura EXACTA esperada por la API
                var productoRequest = new
                {
                    productoId = 0, // siempre 0 para nuevos productos
                    nombreProducto = producto.NombreProducto ?? "Sin nombre",
                    descripcion = producto.Descripcion ?? "Sin descripción",
                    precio = Math.Max(precioFinal, 0.01m), // mínimo 0.01
                    costo = producto.Costo,
                    porcentajeUtilidad = producto.PorcentajeUtilidad,
                    cantidadEnInventario = producto.CantidadEnInventario, // ✅ SIN ?? porque no es nullable
                    stockMinimo = producto.StockMinimo, // ✅ SIN ?? porque no es nullable
                    esLlanta = producto.EsLlanta, // ✅ AGREGADO: faltaba esta propiedad
                    fechaUltimaActualizacion = DateTime.Now,
                    llanta = producto.EsLlanta && producto.Llanta != null ? new
                    {
                        llantaId = 0, // siempre 0 para nuevas llantas
                        productoId = 0, // se asignará después
                        ancho = producto.Llanta.Ancho ?? 0,
                        perfil = producto.Llanta.Perfil ?? 0,
                        diametro = producto.Llanta.Diametro ?? string.Empty,
                        marca = producto.Llanta.Marca ?? string.Empty,
                        modelo = producto.Llanta.Modelo ?? string.Empty,
                        capas = producto.Llanta.Capas ?? 0,
                        indiceVelocidad = producto.Llanta.IndiceVelocidad ?? string.Empty,
                        tipoTerreno = producto.Llanta.TipoTerreno ?? string.Empty
                    } : null,
                    imagenes = new List<object>() // lista vacía, se subirán después por separado
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

        // ✅ NUEVO: Método auxiliar para calcular precio (agregar al final de la clase)
        private decimal CalcularPrecioFinal(ProductoDTO dto)
        {
            // Si tiene costo y utilidad, calcular automáticamente
            if (dto.Costo.HasValue && dto.PorcentajeUtilidad.HasValue)
            {
                var utilidad = dto.Costo.Value * (dto.PorcentajeUtilidad.Value / 100m);
                return dto.Costo.Value + utilidad;
            }

            // Si no, usar el precio manual o 0 si es null
            return dto.Precio.GetValueOrDefault(0m);
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

        // Añadir estos métodos a la clase InventarioService.cs

        /// <summary>
        /// Obtiene todos los inventarios programados
        /// </summary>
        public async Task<List<InventarioProgramadoDTO>> ObtenerInventariosProgramadosAsync()
        {
            try
            {
                _logger.LogInformation("Obteniendo inventarios programados");

                // Realizar la petición a la API
                var response = await _httpClient.GetAsync("api/Inventario/inventarios-programados");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error obteniendo inventarios programados: {response.StatusCode} - {errorContent}");
                    return new List<InventarioProgramadoDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Contenido recibido de la API para inventarios programados");

                // Deserializar a lista de inventarios programados
                var inventarios = JsonConvert.DeserializeObject<List<InventarioProgramadoDTO>>(content);

                // Si la API devuelve null, retornar una lista vacía
                return inventarios ?? new List<InventarioProgramadoDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener inventarios programados");
                return new List<InventarioProgramadoDTO>();
            }
        }

        /// <summary>
        /// Obtiene un inventario programado por su ID
        /// </summary>
        public async Task<InventarioProgramadoDTO> ObtenerInventarioProgramadoPorIdAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Obteniendo inventario programado con ID: {id}");

                // Realizar la petición a la API
                var response = await _httpClient.GetAsync($"api/Inventario/inventarios-programados/{id}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error obteniendo inventario programado: {response.StatusCode} - {errorContent}");
                    return new InventarioProgramadoDTO();
                }

                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Contenido recibido de la API para inventario programado ID {id}");

                // Deserializar a InventarioProgramadoDTO
                var inventario = JsonConvert.DeserializeObject<InventarioProgramadoDTO>(content);

                // Si la API devuelve null, retornar un objeto vacío
                return inventario ?? new InventarioProgramadoDTO();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener inventario programado con ID: {id}");
                return new InventarioProgramadoDTO();
            }
        }

        /// <summary>
        /// Guarda un nuevo inventario programado
        /// </summary>
        public async Task<bool> GuardarInventarioProgramadoAsync(InventarioProgramadoDTO inventario)
        {
            try
            {
                // ✅ AGREGAR ESTE LOGGING TEMPORAL
                Console.WriteLine("=== DATOS ENVIADOS A LA API ===");
                Console.WriteLine($"Título: {inventario.Titulo}");
                Console.WriteLine($"UsuarioCreadorId: {inventario.UsuarioCreadorId}");
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
                    }
                }
                Console.WriteLine("=== FIN DATOS ===");
                // Serializar el objeto para enviarlo a la API
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

        /// <summary>
        /// Actualiza un inventario programado existente
        /// </summary>
        public async Task<bool> ActualizarInventarioProgramadoAsync(int id, InventarioProgramadoDTO inventario)
        {
            try
            {
                _logger.LogInformation($"Actualizando inventario programado con ID: {id}");

                // Realizar la petición a la API
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

        /// <summary>
        /// Inicia un inventario programado
        /// </summary>
        public async Task<bool> IniciarInventarioAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Iniciando inventario programado con ID: {id}");

                // Realizar la petición a la API
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

        /// <summary>
        /// Cancela un inventario programado
        /// </summary>
        public async Task<bool> CancelarInventarioAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Cancelando inventario programado con ID: {id}");

                // Realizar la petición a la API
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

        /// <summary>
        /// Completa un inventario programado
        /// </summary>
        public async Task<bool> CompletarInventarioAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Completando inventario programado con ID: {id}");

                // Realizar la petición a la API
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

        /// <summary>
        /// Exporta los resultados de un inventario a Excel
        /// </summary>
        public async Task<Stream> ExportarResultadosInventarioExcelAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Exportando resultados de inventario a Excel para ID: {id}");

                // Realizar la petición a la API
                var response = await _httpClient.GetAsync($"api/Inventario/inventarios-programados/{id}/exportar-excel");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error exportando resultados a Excel: {response.StatusCode} - {errorContent}");
                    throw new Exception($"Error al exportar resultados a Excel: {response.StatusCode}");
                }

                // Leer el contenido del archivo como un stream
                var stream = await response.Content.ReadAsStreamAsync();

                _logger.LogInformation($"Resultados de inventario ID {id} exportados a Excel exitosamente");
                return stream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al exportar resultados de inventario a Excel para ID: {id}");
                throw; // Relanzar la excepción para que sea manejada en el controlador
            }
        }

        /// <summary>
        /// Exporta los resultados de un inventario a PDF
        /// </summary>
        public async Task<Stream> ExportarResultadosInventarioPDFAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Exportando resultados de inventario a PDF para ID: {id}");

                // Realizar la petición a la API
                var response = await _httpClient.GetAsync($"api/Inventario/inventarios-programados/{id}/exportar-pdf");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error exportando resultados a PDF: {response.StatusCode} - {errorContent}");
                    throw new Exception($"Error al exportar resultados a PDF: {response.StatusCode}");
                }

                // Leer el contenido del archivo como un stream
                var stream = await response.Content.ReadAsStreamAsync();

                _logger.LogInformation($"Resultados de inventario ID {id} exportados a PDF exitosamente");
                return stream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al exportar resultados de inventario a PDF para ID: {id}");
                throw; // Relanzar la excepción para que sea manejada en el controlador
            }
        }
    }
}