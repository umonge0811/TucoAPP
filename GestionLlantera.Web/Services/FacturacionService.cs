using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;

namespace GestionLlantera.Web.Services
{
    public class FacturacionService : IFacturacionService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<FacturacionService> _logger;
        private readonly ApiConfigurationService _apiConfig;
        private readonly IConfiguration _configuration;
        private const decimal IVA_PORCENTAJE = 0.13m; // 13% IVA en Costa Rica
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        private readonly string _baseUrl;

        /// <summary>
        /// ✅ CONSTRUCTOR: CONFIGURACIÓN DE DEPENDENCIAS
        /// Inicializa el servicio de facturación con todas las dependencias necesarias
        /// </summary>
        /// <param name="httpClientFactory">Factory para crear clientes HTTP</param>
        /// <param name="logger">Logger para registrar operaciones y errores</param>
        /// <param name="config">Configuración de la aplicación</param>
        /// <param name="apiConfig">Servicio centralizado para URLs de la API</param>
        public FacturacionService(IHttpClientFactory httpClientFactory, ILogger<FacturacionService> logger, IConfiguration config, ApiConfigurationService apiConfig)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _configuration = config;
            _baseUrl = config.GetSection("ApiSettings:BaseUrl").Value;

            /// ✅ INYECCIÓN DEL SERVICIO DE CONFIGURACIÓN CENTRALIZADA
            _apiConfig = apiConfig;

            // Log de diagnóstico para verificar la configuración
            _logger.LogInformation("🔧 FacturacionService inicializado. URL base API: {BaseUrl}", _apiConfig.BaseUrl);
        }

        public async Task<decimal> CalcularTotalVentaAsync(List<ProductoVentaDTO> productos)
        {
            try
            {
                if (productos == null || !productos.Any())
                    return 0m;

                var subtotal = productos.Sum(p => p.Subtotal);
                var iva = subtotal * IVA_PORCENTAJE;
                var total = subtotal + iva;

                _logger.LogInformation("💰 Cálculo de venta - Subtotal: {Subtotal}, IVA: {IVA}, Total: {Total}", 
                    subtotal, iva, total);

                return total;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculando total de venta");
                return 0m;
            }
        }

        public async Task<bool> ProcesarVentaAsync(VentaDTO venta, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🛒 Procesando venta para cliente: {Cliente}", venta.NombreCliente);

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // Serializar venta
                var jsonContent = JsonConvert.SerializeObject(venta, new JsonSerializerSettings
                {
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // Enviar a la API (cuando esté implementada)
                // var response = await _httpClient.PostAsync("api/Facturacion/procesar-venta", content);

                // Por ahora, simular éxito
                await Task.Delay(500); // Simular tiempo de procesamiento

                _logger.LogInformation("✅ Venta procesada exitosamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error procesando venta");
                return false;
            }
        }

        public async Task<bool> VerificarStockDisponibleAsync(List<ProductoVentaDTO> productos, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 Verificando stock para {Count} productos", productos.Count);

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // Verificar stock producto por producto
                foreach (var producto in productos)
                {
                    try
                    {
                        var url = _apiConfig.GetApiUrl($"Inventario/productos/{producto.ProductoId}");
                        _logger.LogInformation("🌐 URL construida: {url}", url);

                        var response = await _httpClient.GetAsync(url);

                        if (!response.IsSuccessStatusCode)
                        {
                            _logger.LogWarning("⚠️ No se pudo verificar stock del producto {ProductoId}", producto.ProductoId);
                            continue;
                        }

                        var content = await response.Content.ReadAsStringAsync();
                        var productoInfo = JsonConvert.DeserializeObject<dynamic>(content);

                        var stockDisponible = (int)(productoInfo?.cantidadEnInventario ?? 0);

                        if (stockDisponible < producto.Cantidad)
                        {
                            _logger.LogWarning("❌ Stock insuficiente para {Producto}. Disponible: {Stock}, Requerido: {Requerido}",
                                producto.NombreProducto, stockDisponible, producto.Cantidad);
                            return false;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error verificando stock del producto {ProductoId}", producto.ProductoId);
                        return false;
                    }
                }

                _logger.LogInformation("✅ Stock verificado correctamente para todos los productos");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error general verificando stock");
                return false;
            }
        }

        public async Task<byte[]> GenerarFacturaPDFAsync(int ventaId, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📄 Generando factura PDF para venta {VentaId}", ventaId);

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // Por ahora retornar array vacío hasta implementar generación de PDF
                // var response = await _httpClient.GetAsync($"api/Facturacion/generar-pdf/{ventaId}");

                await Task.Delay(100); // Simular procesamiento

                _logger.LogInformation("✅ Factura PDF generada");
                return new byte[0]; // Placeholder
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generando factura PDF");
                return new byte[0];
            }
        }

        // =====================================
        // PRODUCTOS PARA VENTA
        // =====================================

        public async Task<ApiResponse<List<ProductoVentaDTO>>> ObtenerProductosParaVentaAsync(string busqueda = null, bool soloConStock = true)
        {
            try
            {
                _logger.LogInformation("🛒 Obteniendo productos para venta desde FacturacionService");

                var url = _apiConfig.GetApiUrl("Facturacion/productos-venta?soloConStock=true");
                if (!string.IsNullOrWhiteSpace(busqueda))
                {
                    url += $"&busqueda={Uri.EscapeDataString(busqueda)}";
                }

                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = System.Text.Json.JsonSerializer.Deserialize<ApiResponse<object>>(content, _jsonOptions);

                    if (result?.Data != null)
                    {
                        // Deserializar la propiedad productos específicamente
                        var jsonElement = (JsonElement)result.Data;
                        if (jsonElement.TryGetProperty("productos", out var productosElement))
                        {
                            var productos = System.Text.Json.JsonSerializer.Deserialize<List<ProductoVentaDTO>>(productosElement.GetRawText(), _jsonOptions);
                            return new ApiResponse<List<ProductoVentaDTO>>
                            {
                                IsSuccess = true,
                                Data = productos ?? new List<ProductoVentaDTO>(),
                                Message = "Productos obtenidos exitosamente"
                            };
                        }
                    }
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("⚠️ Error al obtener productos: {StatusCode} - {Content}", response.StatusCode, errorContent);

                return new ApiResponse<List<ProductoVentaDTO>>
                {
                    IsSuccess = false,
                    Message = $"Error al obtener productos: {response.StatusCode}",
                    Data = new List<ProductoVentaDTO>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en FacturacionService.ObtenerProductosParaVentaAsync");
                return new ApiResponse<List<ProductoVentaDTO>>
                {
                    IsSuccess = false,
                    Message = "Error interno al obtener productos",
                    Data = new List<ProductoVentaDTO>()
                };
            }
        }

        public async Task<AjusteStockResultado> AjustarStockFacturacionAsync(AjusteStockFacturacionRequest request, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 === INICIO AJUSTE STOCK FACTURACIÓN ===");
                _logger.LogInformation("📦 Factura: {NumeroFactura}", request.NumeroFactura);
                _logger.LogInformation("📦 Cantidad de productos: {Cantidad}", request.Productos?.Count ?? 0);
                _logger.LogInformation("📦 Thread ID: {ThreadId}", Thread.CurrentThread.ManagedThreadId);
                _logger.LogInformation("📦 Timestamp: {Timestamp}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"));

                if (request.Productos == null || !request.Productos.Any())
                {
                    return new AjusteStockResultado { 
                        Success = false, 
                        Message = "No se proporcionaron productos para ajustar" 
                    };
                }

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var resultados = new List<object>();
                var ajustesExitosos = 0;
                var errores = new List<string>();

                foreach (var productoAjuste in request.Productos)
                {
                    try
                    {
                        // Crear DTO que coincida con AjusteStockRapidoDTO de la API
                        var ajusteDto = new
                        {
                            TipoAjuste = "salida",  // Para ventas es salida de stock
                            Cantidad = productoAjuste.Cantidad,
                            Comentario = $"Ajuste por facturación {request.NumeroFactura}",
                            EsFinalizacionInventario = false,
                            InventarioProgramadoId = (int?)null
                        };

                        var jsonContent = JsonConvert.SerializeObject(ajusteDto);
                        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                        _logger.LogInformation("📤 Enviando ajuste: ProductoId={ProductoId}, TipoAjuste=salida, Cantidad={Cantidad}", 
                            productoAjuste.ProductoId, productoAjuste.Cantidad);

                        // Llamar al endpoint de ajuste de stock en la API
                        var urlAjuste = _apiConfig.GetApiUrl($"Inventario/productos/{productoAjuste.ProductoId}/ajustar-stock");
                        _logger.LogInformation("🌐 URL construida: {url}", urlAjuste);

                        var httpResponse = await _httpClient.PostAsync(urlAjuste, content);

                        if (httpResponse.IsSuccessStatusCode)
                        {
                            var responseContent = await httpResponse.Content.ReadAsStringAsync();
                            var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);

                            // Convertir valores dinámicos a tipos específicos
                            var stockAnterior = resultado?.stockAnterior != null ? Convert.ToInt32(resultado.stockAnterior) : 0;
                            var stockNuevo = resultado?.stockNuevo != null ? Convert.ToInt32(resultado.stockNuevo) : 0;
                            var diferencia = resultado?.diferencia != null ? Convert.ToInt32(resultado.diferencia) : 0;

                            resultados.Add(new {
                                productoId = productoAjuste.ProductoId,
                                nombreProducto = productoAjuste.NombreProducto,
                                success = true,
                                stockAnterior = stockAnterior,
                                stockNuevo = stockNuevo,
                                diferencia = diferencia,
                                mensaje = $"Stock actualizado correctamente"
                            });

                            ajustesExitosos++;

                            _logger.LogInformation($"✅ Stock ajustado para {productoAjuste.NombreProducto}: {stockAnterior} → {stockNuevo}");
                        }
                        else
                        {
                            var errorContent = await httpResponse.Content.ReadAsStringAsync();
                            var error = $"Error ajustando {productoAjuste.NombreProducto}: {httpResponse.StatusCode} - {errorContent}";
                            errores.Add(error);
                            resultados.Add(new {
                                productoId = productoAjuste.ProductoId,
                                nombreProducto = productoAjuste.NombreProducto,
                                success = false,
                                error = error
                            });

                            _logger.LogError("❌ Error ajustando stock para {Producto}: {Error}", 
                                productoAjuste.NombreProducto, error);
                        }
                    }
                    catch (Exception ex)
                    {
                        var error = $"Error ajustando {productoAjuste.NombreProducto}: {ex.Message}";
                        errores.Add(error);
                        resultados.Add(new {
                            productoId = productoAjuste.ProductoId,
                            nombreProducto = productoAjuste.NombreProducto,
                            success = false,
                            error = error
                        });

                        _logger.LogError(ex, "❌ Error ajustando stock para producto {ProductoId}", 
                            productoAjuste.ProductoId);
                    }
                }

                // Preparar respuesta
                var response = new AjusteStockResultado {
                    Success = ajustesExitosos > 0,
                    Message = ajustesExitosos > 0 ? 
                        $"Stock ajustado para {ajustesExitosos} productos" : 
                        "No se pudo ajustar el stock de ningún producto",
                    AjustesExitosos = ajustesExitosos,
                    TotalProductos = request.Productos.Count,
                    Resultados = resultados,
                    Errores = errores.Any() ? errores : null
                };

                _logger.LogInformation("📦 === FIN AJUSTE STOCK FACTURACIÓN ===");
                _logger.LogInformation("📦 Resultados: {Exitosos}/{Total} productos actualizados", 
                    ajustesExitosos, request.Productos.Count);
                _logger.LogInformation("📦 Thread ID: {ThreadId}", Thread.CurrentThread.ManagedThreadId);
                _logger.LogInformation("📦 Timestamp: {Timestamp}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"));

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error general ajustando stock para facturación");
                return new AjusteStockResultado { 
                    Success = false, 
                    Message = "Error interno al ajustar stock: " + ex.Message 
                };
            }
        }

        public async Task<(bool success, object data, string message, string details)> ObtenerFacturasAsync(string jwtToken, string estado = null, int tamano = 1000)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO FACTURAS CON FILTROS ===");
                _logger.LogInformation("📋 Estado: {Estado}, Tamaño: {Tamano}", estado, tamano);

                using var client = new HttpClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

                // Construir URL con parámetros
                var url = $"{_configuration["ApiSettings:BaseUrl"]}/api/Facturacion/facturas?tamano={tamano}";
                if (!string.IsNullOrEmpty(estado) && estado != "todos")
                {
                    url += $"&estado={estado}";
                }

                _logger.LogInformation("📋 URL de consulta: {Url}", url);

                var response = await client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var resultado = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content);

                    if (resultado.TryGetProperty("facturas", out var facturasElement))
                    {
                        var facturas = System.Text.Json.JsonSerializer.Deserialize<List<object>>(facturasElement.GetRawText());
                        var totalFacturas = facturas?.Count ?? 0;

                        _logger.LogInformation("✅ Facturas obtenidas exitosamente: {Total} facturas", totalFacturas);

                        return (true, new
                        {
                            success = true,
                            facturas = facturas,
                            totalFacturas = totalFacturas,
                            message = $"Se encontraron {totalFacturas} facturas"
                        }, "Facturas obtenidas exitosamente", null);
                    }
                    else
                    {
                        return (false, null, "Formato de respuesta inesperado del API", null);
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error del API obteniendo facturas: {StatusCode} - {Content}",
                        response.StatusCode, errorContent);

                    return (false, null, "Error del servidor al obtener facturas", errorContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo facturas");
                return (false, null, "Error interno al obtener facturas", ex.Message);
            }
        }

        public async Task<(bool success, object data, string message, string details)> ObtenerFacturasPendientesAsync(string jwtToken)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO FACTURAS PENDIENTES DESDE SERVICIO ===");

                using var client = new HttpClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

                var url = _apiConfig.GetApiUrl("Facturacion/facturas/pendientes");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📋 Respuesta del API recibida exitosamente");

                    var apiResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(jsonContent);

                    // Verificar si la respuesta tiene la estructura correcta
                    if (apiResponse.TryGetProperty("success", out var successElement) && successElement.GetBoolean())
                    {
                        _logger.LogInformation("📋 API confirmed success in obtaining pending invoices");

                        // Extraer las facturas del response
                        if (apiResponse.TryGetProperty("facturas", out var facturasElement))
                        {
                            var facturas = System.Text.Json.JsonSerializer.Deserialize<List<object>>(facturasElement.GetRawText());
                            var totalFacturas = apiResponse.TryGetProperty("totalFacturas", out var totalElement) ? totalElement.GetInt32() : 0;
                            var mensaje = apiResponse.TryGetProperty("message", out var msgElement) ? msgElement.GetString() : "Facturas obtenidas";

                            return (true, new
                            {
                                success = true,
                                facturas = facturas,
                                totalFacturas = totalFacturas,
                                message = mensaje
                            }, mensaje, null);
                        }
                        else
                        {
                            _logger.LogWarning("📋 No se encontró propiedad 'facturas' en la respuesta del API");
                            return (false, null, "Estructura de respuesta inválida", "Missing 'facturas' property");
                        }
                    }
                    else
                    {
                        var errorMsg = apiResponse.TryGetProperty("message", out var msgElement) ? 
                            msgElement.GetString() : "Error desconocido desde el API";
                        return (false, null, errorMsg, "API returned success=false");
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("📋 Error HTTP del API: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return (false, null, $"Error HTTP {response.StatusCode}", errorContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo facturas pendientes desde servicio");
                return (false, null, "Error interno del servicio", ex.Message);
            }
        }

        public async Task<(bool success, object data, string message)> ObtenerTodasLasFacturasAsync()
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO TODAS LAS FACTURAS DESDE SERVICIO ===");

                // Se utiliza _httpClient que ya tiene la configuración base
                var url = _apiConfig.GetApiUrl("Facturacion/facturas?tamano=1000");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                _logger.LogInformation("📋 Respuesta del API: {StatusCode}", response.StatusCode);

                if (response.IsSuccessStatusCode)
                {
                    var contenido = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📋 Contenido recibido (primeros 500 chars): {Contenido}", 
                        contenido.Length > 500 ? contenido.Substring(0, 500) + "..." : contenido);

                    var resultado = System.Text.Json.JsonSerializer.Deserialize<dynamic>(contenido, _jsonOptions);

                    return (true, resultado, "Todas las facturas obtenidas exitosamente");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error del API: {StatusCode} - {Error}", response.StatusCode, error);
                    return (false, null, $"Error del servidor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo todas las facturas desde servicio");
                return (false, null, "Error interno del servicio");
            }
        }

        public async Task<(bool success, object data, string message)> ObtenerFacturasPorEstadoAsync(string estado)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO FACTURAS POR ESTADO: {Estado} ===", estado);

                // Se utiliza _httpClient que ya tiene la configuración base
                var url = _apiConfig.GetApiUrl($"Facturacion/facturas?estado={estado}&tamano=1000");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                _logger.LogInformation("📋 Respuesta del API: {StatusCode}", response.StatusCode);

                if (response.IsSuccessStatusCode)
                {
                    var contenido = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📋 Contenido recibido (primeros 500 chars): {Contenido}", 
                        contenido.Length > 500 ? contenido.Substring(0, 500) + "..." : contenido);

                    var resultado = System.Text.Json.JsonSerializer.Deserialize<dynamic>(contenido, _jsonOptions);

                    return (true, resultado, $"Facturas con estado {estado} obtenidas exitosamente");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error del API: {StatusCode} - {Error}", response.StatusCode, error);
                    return (false, null, $"Error del servidor: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo facturas por estado desde servicio");
                return (false, null, "Error interno del servicio");
            }
        }

        public async Task<(bool success, object data, string message, string details)> ObtenerProformasAsync(string jwtToken, string estado = null, int pagina = 1, int tamano = 20)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO PROFORMAS DESDE SERVICIO ===");
                _logger.LogInformation("📋 Parámetros: Estado={Estado}, Página={Pagina}, Tamaño={Tamano}", estado, pagina, tamano);

                using var client = new HttpClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

                var queryParams = new List<string>
                {
                    $"pagina={pagina}",
                    $"tamano={tamano}"
                };

                if (!string.IsNullOrWhiteSpace(estado))
                {
                    queryParams.Add($"estado={Uri.EscapeDataString(estado)}");
                }

                var queryString = string.Join("&", queryParams);
                var endpoint = $"Facturacion/proformas?{queryString}";
                var url = _apiConfig.GetApiUrl(endpoint);

                _logger.LogInformation("📋 URL construida: {Url}", url);

                var response = await client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📋 Respuesta del API recibida exitosamente");

                    var apiResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(jsonContent);

                    // Verificar si la respuesta tiene la estructura correcta
                    if (apiResponse.TryGetProperty("success", out var successElement) && successElement.GetBoolean())
                    {
                        _logger.LogInformation("📋 API confirmed success in obtaining proformas");

                        // Extraer las proformas del response
                        if (apiResponse.TryGetProperty("proformas", out var proformasElement))
                        {
                            var proformas = System.Text.Json.JsonSerializer.Deserialize<List<object>>(proformasElement.GetRawText());
                            var totalProformas = apiResponse.TryGetProperty("totalProformas", out var totalElement) ? totalElement.GetInt32() : 0;
                            var totalPaginas = apiResponse.TryGetProperty("totalPaginas", out var paginasElement) ? paginasElement.GetInt32() : 1;
                            var mensaje = apiResponse.TryGetProperty("message", out var msgElement) ? msgElement.GetString() : "Proformas obtenidas";

                            return (true, new
                            {
                                success = true,
                                proformas = proformas,
                                totalProformas = totalProformas,
                                pagina = pagina,
                                tamano = tamano,
                                totalPaginas = totalPaginas,
                                message = mensaje
                            }, mensaje, null);
                        }
                        else
                        {
                            _logger.LogWarning("📋 No se encontró propiedad 'proformas' en la respuesta del API");
                            return (false, null, "Estructura de respuesta inválida", "Missing 'proformas' property");
                        }
                    }
                    else
                    {
                        var errorMsg = apiResponse.TryGetProperty("message", out var msgElement) ? 
                            msgElement.GetString() : "Error desconocido desde el API";
                        return (false, null, errorMsg, "API returned success=false");
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("📋 Error HTTP del API: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return (false, null, $"Error HTTP {response.StatusCode}", errorContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo proformas desde servicio");
                return (false, null, "Error interno del servicio", ex.Message);
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> CompletarFacturaAsync(int facturaId, object datosCompletamiento, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("✅ Completando documento ID: {FacturaId}", facturaId);
                _logger.LogInformation("📋 Datos de completamiento: {Datos}", JsonConvert.SerializeObject(datosCompletamiento));

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // ✅ EXTRAER INFORMACIÓN PARA DETERMINAR EL ENDPOINT
                dynamic datos = JsonConvert.DeserializeObject(JsonConvert.SerializeObject(datosCompletamiento));
                bool esProforma = datos?.esProforma == true;

                string endpoint;
                string tipoDocumento;

                if (esProforma)
                {
                    // ✅ PARA PROFORMAS: Usar servicio centralizado
                    endpoint = _apiConfig.GetApiUrl($"Facturacion/proformas/{facturaId}/marcar-facturada");
                    tipoDocumento = "Proforma";
                    _logger.LogInformation("📋 Marcando proforma como facturada usando endpoint: {Endpoint}", endpoint);
                }
                else
                {
                    // ✅ PARA FACTURAS: Usar servicio centralizado
                    endpoint = _apiConfig.GetApiUrl($"Facturacion/facturas/{facturaId}/completar");
                    tipoDocumento = "Factura";
                    _logger.LogInformation("📋 Completando factura usando endpoint: {Endpoint}", endpoint);
                }

                var jsonContent = JsonConvert.SerializeObject(datosCompletamiento, new JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("📤 JSON enviado al API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // ✅ USAR PUT PARA AMBOS CASOS (COMPLETAR Y MARCAR COMO FACTURADA)
                var response = await _httpClient.PutAsync(endpoint, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📥 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject(responseContent);
                    return (success: true, data: resultado, message: $"{tipoDocumento} procesada exitosamente", details: null);
                }
                else
                {
                    _logger.LogError("❌ Error procesando {TipoDocumento}: {StatusCode} - {Content}",
                        tipoDocumento, response.StatusCode, responseContent);
                    return (success: false, data: null, message: $"Error al procesar {tipoDocumento.ToLower()}", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error procesando documento");
                return (success: false, data: null, message: "Error interno: " + ex.Message, details: ex.ToString());
            }
        }


        public async Task<(bool success, object? data, string? message, string? details)> CrearFacturaAsync(object facturaDto, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🧾 Creando factura usando servicio de facturación");

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
                }

                // Procesar el DTO para generar campos automáticos
                var facturaData = await ProcesarFacturaParaEnvio(facturaDto, jwtToken);

                var jsonContent = JsonConvert.SerializeObject(facturaData, new JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("📤 JSON enviado a API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Facturacion/facturas");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PostAsync(url, content);

                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📥 Respuesta de API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    // ✅ DESERIALIZAR CORRECTAMENTE LA RESPUESTA DEL API
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);

                        JsonConvert.SerializeObject(resultado, Formatting.Indented);

                    return (
                        success: true, 
                        data: resultado,
                        message: "Factura creada exitosamente",
                        details: null
                    );
                }
                else
                {
                    _logger.LogError("❌ Error de API al crear factura: {StatusCode} - {Content}", response.StatusCode, responseContent);

                    // Manejar específicamente error 401 (Unauthorized)
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        return (
                            success: false,
                            data: null,
                            message: "Sesión expirada. Inicie sesión nuevamente.",
                            details: "Token de autenticación no válido o expirado"
                        );
                    }

                    // Intentar deserializar el error para obtener más detalles
                    try
                    {
                        var errorData = JsonConvert.DeserializeObject<dynamic>(responseContent);
                        var errorMessage = errorData?.message?.ToString() ?? "Error desconocido";

                        return (
                            success: false,
                            data: null,
                            message: errorMessage,
                            details: responseContent
                        );
                    }
                    catch
                    {
                        return (
                            success: false,
                            data: null,
                            message: $"Error del servidor: {response.StatusCode}",
                            details: responseContent
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico en servicio de facturación");
                return (
                    success: false,
                    data: null,
                    message: "Error interno del servicio: " + ex.Message,
                    details: ex.ToString()
                );
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> VerificarStockFacturaAsync(int facturaId, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 === VERIFICANDO STOCK DE FACTURA PENDIENTE ===");
                _logger.LogInformation("📦 Factura ID: {FacturaId}", facturaId);

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // Crear el request para enviar al API
                var request = new { FacturaId = facturaId };
                var jsonContent = JsonConvert.SerializeObject(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation("📤 Enviando request al API: {Request}", jsonContent);

                // Llamar al endpoint del API para verificar stock
                var url = _apiConfig.GetApiUrl("Facturacion/verificar-stock-factura");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📥 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    // Configurar las opciones de deserialización
                    var settings = new JsonSerializerSettings
                    {
                        NullValueHandling = NullValueHandling.Ignore,
                        MissingMemberHandling = MissingMemberHandling.Ignore
                    };

                    // Deserializar con modelo fuertemente tipado
                    var resultado = JsonConvert.DeserializeObject<StockVerificationResponse>(responseContent, settings);

                    if (resultado?.success == true)
                    {
                        // Procesar productos con problemas
                        var productosConProblemas = new List<ProductoConProblemaInfo>();

                        if (resultado.productosConProblemas != null && resultado.productosConProblemas.Any())
                        {
                            foreach (var producto in resultado.productosConProblemas)
                            {
                                productosConProblemas.Add(new ProductoConProblemaInfo
                                {
                                    productoId = producto.productoId,
                                    nombreProducto = producto.nombreProducto ?? "Sin nombre",
                                    descripcion = producto.descripcion ?? "",
                                    precio = producto.precio,
                                    cantidadRequerida = producto.cantidadRequerida,
                                    stockDisponible = producto.stockDisponible,
                                    problema = producto.problema ?? "Stock insuficiente",
                                    diferencia = producto.cantidadRequerida - producto.stockDisponible
                                });
                            }
                        }

                        bool hayProblemas = productosConProblemas.Any();

                        _logger.LogInformation("📦 Verificación completada - Hay problemas: {HayProblemas}, Productos afectados: {Count}",
                            hayProblemas, productosConProblemas.Count);

                        // Crear respuesta estructurada
                        var dataResult = new StockVerificationResult
                        {
                            hayProblemasStock = hayProblemas,
                            productosConProblemas = productosConProblemas,
                            message = hayProblemas ?
                                $"Se encontraron {productosConProblemas.Count} productos con problemas de stock" :
                                "Todos los productos tienen stock suficiente"
                        };

                        return (
                            success: true,
                            data: dataResult,
                            message: "Verificación de stock completada exitosamente",
                            details: null
                        );
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ API devolvió success=false: {Message}", resultado?.message);
                        return (
                            success: false,
                            data: null,
                            message: resultado?.message ?? "Error verificando stock",
                            details: responseContent
                        );
                    }
                }
                else
                {
                    _logger.LogError("❌ Error del API verificando stock: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);

                    string errorMessage = response.StatusCode switch
                    {
                        System.Net.HttpStatusCode.Unauthorized => "Token de autenticación inválido o expirado",
                        System.Net.HttpStatusCode.NotFound => "Factura no encontrada",
                        System.Net.HttpStatusCode.BadRequest => "Datos de la solicitud inválidos",
                        System.Net.HttpStatusCode.InternalServerError => "Error interno del servidor",
                        _ => $"Error del servidor: {response.StatusCode}"
                    };

                    return (
                        success: false,
                        data: null,
                        message: errorMessage,
                        details: responseContent
                    );
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "❌ Error deserializando respuesta JSON para factura: {FacturaId}", facturaId);
                return (
                    success: false,
                    data: null,
                    message: "Error procesando respuesta del servidor: formato JSON inválido",
                    details: jsonEx.Message
                );
            }
            catch (HttpRequestException httpEx)
            {
                _logger.LogError(httpEx, "❌ Error de conexión verificando stock de factura: {FacturaId}", facturaId);
                return (
                    success: false,
                    data: null,
                    message: "Error de conexión con el servidor de stock",
                    details: httpEx.Message
                );
            }
            catch (TaskCanceledException timeoutEx)
            {
                _logger.LogError(timeoutEx, "❌ Timeout verificando stock de factura: {FacturaId}", facturaId);
                return (
                    success: false,
                    data: null,
                    message: "Tiempo de espera agotado al verificar stock",
                    details: timeoutEx.Message
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error inesperado verificando stock de factura: {FacturaId}", facturaId);
                return (
                    success: false,
                    data: null,
                    message: "Error interno al verificar stock: " + ex.Message,
                    details: ex.ToString()
                );
            }
        }

        // =====================================
        // MÉTODOS AUXILIARES PRIVADOS
        // =====================================

        private async Task<object> ProcesarFacturaParaEnvio(object facturaDto, string jwtToken = null)
        {
            try
            {
                // Convertir a dynamic para poder modificar propiedades
                var facturaJson = JsonConvert.SerializeObject(facturaDto);
                dynamic factura = JsonConvert.DeserializeObject(facturaJson);

                _logger.LogInformation("📋 Factura recibida para procesamiento: {FacturaJson}", facturaJson);

                // ✅ DIAGNÓSTICO DETALLADO DE LA FACTURA
                _logger.LogInformation("🔍 Propiedades de la factura recibida:");
                if (factura is Newtonsoft.Json.Linq.JObject jObject)
                {
                    foreach (var property in jObject.Properties())
                    {
                        var value = property.Value?.ToString() ?? "null";
                        if (value.Length > 100) value = value.Substring(0, 100) + "...";
                        _logger.LogInformation("🔍   {PropertyName}: {PropertyValue}", property.Name, value);
                    }
                }

                // ✅ 1. GENERAR NÚMERO DE FACTURA AUTOMÁTICAMENTE
                var tipoDocumento = factura.tipoDocumento?.ToString() ?? "Factura";
                var numeroFactura = GenerarNumeroFactura(tipoDocumento);
                factura.numeroFactura = numeroFactura;


                // ✅ 2. EXTRAER INFORMACIÓN DEL USUARIO DEL TOKEN JWT
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    var nombreUsuario = ExtraerNombreUsuarioDelToken(jwtToken);
                    if (!string.IsNullOrEmpty(nombreUsuario))
                    {
                        factura.usuarioCreadorNombre = nombreUsuario;
                        _logger.LogInformation("👤 Usuario extraído del token: {Usuario}", nombreUsuario);
                    }
                }

                // ✅ 3. ESTABLECER FECHA DE CREACIÓN Y ESTADO SEGÚN ROL
                factura.fechaCreacion = DateTime.Now;

                // ✅ DETERMINAR ESTADO SEGÚN ROL DEL USUARIO
                var estadoFactura = await DeterminarEstadoFacturaSegunUsuarioAsync(jwtToken);
                factura.estado = estadoFactura;

                _logger.LogInformation("📋 Estado de factura asignado: {Estado}", estadoFactura);

                // ✅ 4. VALIDAR CAMPOS REQUERIDOS
                var nombreCliente = factura.nombreCliente?.ToString() ?? 
                                  factura.NombreCliente?.ToString() ?? 
                                  factura.cliente?.ToString() ?? 
                                  factura.Cliente?.ToString() ?? "";

                if (string.IsNullOrEmpty(nombreCliente))
                {
                    _logger.LogError("❌ Validación fallida: No se encontró nombre del cliente. Propiedades disponibles: {Propiedades}", 
                        string.Join(", ", ((Newtonsoft.Json.Linq.JObject)factura).Properties().Select(p => p.Name)));
                    throw new ArgumentException("El nombre del cliente es requerido");
                }

                // Asegurar que la propiedad esté correctamente asignada
                factura.nombreCliente = nombreCliente;

                // ✅ VALIDAR QUE EXISTAN PRODUCTOS - BÚSQUEDA ROBUSTA
                var detallesFactura = factura.detallesFactura ?? 
                                    factura.DetallesFactura ?? 
                                    factura.productos ?? 
                                    factura.Productos ?? 
                                    factura.items ?? 
                                    factura.Items;

                if (detallesFactura == null)
                {                    _logger.LogError("❌ No se encontraron productos en la factura. Propiedades disponibles: {Propiedades}", 
                        string.Join(", ", ((Newtonsoft.Json.Linq.JObject)factura).Properties().Select(p => p.Name)));
                    throw new ArgumentException("La factura debe tener al menos un producto");
                }

                // Verificar que es enumerable y tiene elementos
                bool tieneProductos = false;
                try
                {
                    if (detallesFactura is System.Collections.IEnumerable enumerable)
                    {
                        tieneProductos = enumerable.Cast<object>().Any();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error validando productos de la factura");
                }

                if (!tieneProductos)
                {
                    _logger.LogError("❌ La factura no contiene productos válidos");
                    throw new ArgumentException("La factura debe tener al menos un producto");
                }

                // Asegurar que la propiedad esté correctamente asignada
                factura.detallesFactura = detallesFactura;

                _logger.LogInformation("✅ Validación de productos exitosa: se encontraron productos en la factura");

                return factura;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error procesando factura para envío");
                throw;
            }
        }

        private string GenerarNumeroFactura(string tipoDocumento)
        {
            try
            {
                var prefijo = tipoDocumento == "Proforma" ? "PROF" : "FAC";
                var año = DateTime.Now.Year;
                var mes = DateTime.Now.Month;
                var dia = DateTime.Now.Day;
                var hora = DateTime.Now.Hour;
                var minuto = DateTime.Now.Minute;
                var segundo = DateTime.Now.Second;

                // Generar número único basado en timestamp
                var timestamp = DateTime.Now.Ticks.ToString().Substring(10); // Últimos dígitos del timestamp
                var numeroConsecutivo = timestamp.Substring(0, Math.Min(6, timestamp.Length)).PadLeft(6, '0');

                var numeroFactura = $"{prefijo}-{año:D4}{mes:D2}-{numeroConsecutivo}";

                _logger.LogInformation("📋 Número de {TipoDocumento} generado: {NumeroFactura}", tipoDocumento, numeroFactura);

                return numeroFactura;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando número de {TipoDocumento}", tipoDocumento);
                // Fallback a un número simple
                var prefijoFallback = tipoDocumento == "Proforma" ? "PROF" : "FAC";
                return $"{prefijoFallback}-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks.ToString().Substring(10, 6)}";
            }
        }

        private async Task<string> DeterminarEstadoFacturaSegunUsuarioAsync(string jwtToken)
        {
            try
            {
                if (string.IsNullOrEmpty(jwtToken))
                    return "Pendiente"; // Estado por defecto si no hay token

                // Decodificar el token JWT para obtener roles
                var parts = jwtToken.Split('.');
                if (parts.Length != 3)
                    return "Pendiente";

                // Decodificar el payload (segunda parte)
                var payload = parts[1];

                // Agregar padding necesario para Base64
                switch (payload.Length % 4)
                {
                    case 2: payload += "=="; break;
                    case 3: payload += "="; break;
                }

                var payloadBytes = Convert.FromBase64String(payload);
                var payloadJson = Encoding.UTF8.GetString(payloadBytes);

                _logger.LogInformation("🔍 === DEBUGGING JWT TOKEN COMPLETO ===");
                _logger.LogInformation("🔍 Payload JWT completo: {Payload}", payloadJson);

                dynamic claims = JsonConvert.DeserializeObject(payloadJson);

                // ✅ LOGGING ADICIONAL PARA DEBUGGING DE ESTRUCTURA
                if (claims is Newtonsoft.Json.Linq.JObject debugObject)
                {
                    _logger.LogInformation("🔍 Propiedades disponibles en el token:");
                    foreach (var property in debugObject.Properties())
                    {
                        var valorTruncado = property.Value?.ToString();
                        if (valorTruncado?.Length > 200) valorTruncado = valorTruncado.Substring(0, 200) + "...";
                        _logger.LogInformation("🔍   {PropertyName}: {PropertyValue}", property.Name, valorTruncado);
                    }
                }

                // Buscar roles en el token
                string roles = "";
                try
                {
                    roles = claims?.role?.ToString() ??
                           claims?.roles?.ToString() ??
                           claims?["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?.ToString() ?? "";
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("⚠️ Error extrayendo roles del token: {Error}", ex.Message);
                }

                // ✅ EXTRAER PERMISOS CORRECTAMENTE DEL TOKEN JWT
                // Los permisos se almacenan como claims individuales con tipo "Permission"
                var permisosEncontrados = new List<string>();

                // Buscar en la estructura del token los claims de permisos
                if (claims is Newtonsoft.Json.Linq.JObject jwtObject)
                {
                    // Buscar arrays de permisos en diferentes campos posibles
                    var camposPermisos = new[] { "Permission", "permissions", "permisos", "Permisos" };

                    foreach (var campo in camposPermisos)
                    {
                        var permisosToken = jwtObject[campo];
                        if (permisosToken != null)
                        {
                            var permisosTexto = permisosToken.ToString();
                            _logger.LogInformation("🔍 Permisos encontrados en campo '{Campo}': {Permisos}", campo, permisosTexto);

                            if (permisosToken.Type == Newtonsoft.Json.Linq.JTokenType.Array)
                            {
                                // Es un array de permisos
                                foreach (var permiso in permisosToken)
                                {
                                    permisosEncontrados.Add(permiso.ToString());
                                }
                            }
                            else if (permisosToken.Type == Newtonsoft.Json.Linq.JTokenType.String)
                            {
                                // Es un string único
                                permisosEncontrados.Add(permisosTexto);
                            }
                            break; // Si encontramos permisos, salimos del bucle
                        }
                    }
                }

                _logger.LogInformation("🔐 Permisos extraídos del token: {Permisos}", string.Join(", ", permisosEncontrados));

                // Verificar si el usuario tiene el permiso "CompletarFacturas"
                var tienePermisoCompletar = permisosEncontrados.Any(p => 
                    p.Equals("CompletarFacturas", StringComparison.OrdinalIgnoreCase) ||
                    p.Equals("Completar Facturas", StringComparison.OrdinalIgnoreCase) ||
                    p.Equals("CompletarFactura", StringComparison.OrdinalIgnoreCase));

                if (tienePermisoCompletar)
                {
                    _logger.LogInformation("✅ Usuario tiene permiso CompletarFacturas - Estado: Pagada");
                    return "Pagada";
                }

                // Si es Administrador, puede crear facturas completadas
                if (roles.Contains("Administrador", StringComparison.OrdinalIgnoreCase))
                {
                    return "Pagada";
                }

                // Para cualquier otro rol (Colaborador, etc.), crear como pendiente
                _logger.LogInformation("⚠️ Usuario sin permisos de CompletarFacturas - Estado: Pendiente");
                _logger.LogInformation("🔐 Roles encontrados: {Roles}", roles);
                _logger.LogInformation("🔐 Permisos evaluados: {Permisos}", string.Join(", ", permisosEncontrados));
                return "Pendiente";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error determinando estado de factura según usuario");
                return "Pendiente"; // Estado seguro por defecto
            }
        }

        private string ExtraerNombreUsuarioDelToken(string jwtToken)
        {
            try
            {
                if (string.IsNullOrEmpty(jwtToken))
                    return null;

                // Decodificar el token JWT (formato: header.payload.signature)
                var parts = jwtToken.Split('.');
                if (parts.Length != 3)
                    return null;

                // Decodificar el payload (segunda parte)
                var payload = parts[1];

                // Agregar padding necesario para Base64
                switch (payload.Length % 4)
                {
                    case 2: payload += "=="; break;
                    case 3: payload += "="; break;
                }

                var payloadBytes = Convert.FromBase64String(payload);
                var payloadJson = Encoding.UTF8.GetString(payloadBytes);

                dynamic claims = JsonConvert.DeserializeObject(payloadJson);

                // Buscar el nombre del usuario en diferentes campos posibles
                var nombreUsuario = claims?.unique_name?.ToString() ??
                                 claims?.name?.ToString() ??
                                 claims?.username?.ToString() ??
                                 claims?.sub?.ToString();


                return nombreUsuario;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error extrayendo usuario del token JWT");
                return null;
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> EliminarProductosFacturaAsync(object request, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🗑️ === ELIMINANDO PRODUCTOS DE FACTURA ===");

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var jsonContent = JsonConvert.SerializeObject(request, new JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("📤 Enviando request al API: {Request}", jsonContent);

                // Llamar al endpoint del API para eliminar productos
                var url = _apiConfig.GetApiUrl("Facturacion/eliminar-productos-factura");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📥 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);

                    return (
                        success: true,
                        data: resultado,
                        message: "Productos eliminados exitosamente",
                        details: null
                    );
                }
                else
                {
                    _logger.LogError("❌ Error del API eliminando productos: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);

                    string errorMessage = response.StatusCode switch
                    {
                        System.Net.HttpStatusCode.Unauthorized => "Token de autenticación inválido o expirado",
                        System.Net.HttpStatusCode.NotFound => "Factura no encontrada",
                        System.Net.HttpStatusCode.BadRequest => "Datos de la solicitud inválidos",
                        System.Net.HttpStatusCode.InternalServerError => "Error interno del servidor",
                        _ => $"Error del servidor: {response.StatusCode}"
                    };

                    return (
                        success: false,
                        data: null,
                        message: errorMessage,
                        details: responseContent
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error inesperado eliminando productos de factura");
                return (
                    success: false,
                    data: null,
                    message: "Error interno al eliminar productos: " + ex.Message,
                    details: ex.ToString()
                );
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> ObtenerPendientesEntregaAsync(string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 === OBTENIENDO PENDIENTES DE ENTREGA ===");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Facturacion/pendientes-entrega");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📦 Respuesta de la API: {StatusCode}", response.StatusCode);
                _logger.LogInformation("📦 Contenido de respuesta: {Content}", responseContent.Substring(0, Math.Min(1000, responseContent.Length)));

                if (response.IsSuccessStatusCode)
                {
                    if (string.IsNullOrWhiteSpace(responseContent))
                    {
                        _logger.LogWarning("📦 Respuesta vacía del API");
                        return (success: false, data: null, message: "Respuesta vacía del servidor", details: null);
                    }

                    // Deserializar la respuesta JSON completa
                    var apiResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(responseContent, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });

                    _logger.LogInformation("📦 Respuesta del API deserializada. Kind: {Kind}", apiResponse.ValueKind);

                    // El API de pendientes devuelve directamente la estructura con pendientes
                    if (apiResponse.TryGetProperty("pendientes", out var pendientesElement))
                    {
                        var pendientesArray = System.Text.Json.JsonSerializer.Deserialize<object[]>(pendientesElement.GetRawText(), new JsonSerializerOptions 
                        { 
                            PropertyNameCaseInsensitive = true 
                        });

                        _logger.LogInformation("📦 Pendientes deserializados: {Count}", pendientesArray?.Length ?? 0);

                        // Devolver la estructura exacta que espera el frontend (igual que facturas)
                        return (success: true, 
                               data: pendientesArray ?? new object[0], 
                               message: "Pendientes de entrega obtenidos", 
                               details: null);
                    }
                    else
                    {
                        // Si no tiene la propiedad pendientes, verificar si es directamente un array
                        if (apiResponse.ValueKind == JsonValueKind.Array)
                        {
                            var pendientesArray = System.Text.Json.JsonSerializer.Deserialize<object[]>(responseContent, new JsonSerializerOptions 
                            { 
                                PropertyNameCaseInsensitive = true 
                            });

                            _logger.LogInformation("📦 Array directo de pendientes deserializado: {Count}", pendientesArray?.Length ?? 0);

                            return (success: true, 
                                   data: pendientesArray ?? new object[0], 
                                   message: "Pendientes de entrega obtenidos", 
                                   details: null);
                        }
                        else
                        {
                            _logger.LogInformation("📦 No se encontró propiedad 'pendientes' en la respuesta");
                            return (success: true, 
                                   data: new object[0], 
                                   message: "No hay pendientes de entrega", 
                                   details: null);
                        }
                    }
                }
                else
                {
                    _logger.LogError("❌ Error obteniendo pendientes de entrega: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);
                    return (success: false, data: null, message: "Error al obtener pendientes de entrega", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo pendientes de entrega");
                return (success: false, data: null, message: "Error interno al obtener pendientes de entrega", details: ex.ToString());
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> RegistrarPendientesEntregaAsync(object request, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📦 === ENVIANDO PENDIENTES DE ENTREGA A API ===");

                // Convertir object a RegistrarPendientesEntregaRequest
                RegistrarPendientesEntregaRequest typedRequest;
                if (request is RegistrarPendientesEntregaRequest directRequest)
                {
                    typedRequest = directRequest;
                }
                else
                {
                    // Deserializar desde JSON si es necesario
                    var jsonString = JsonConvert.SerializeObject(request);
                    typedRequest = JsonConvert.DeserializeObject<RegistrarPendientesEntregaRequest>(jsonString);
                }

                _logger.LogInformation("📦 Factura ID: {FacturaId}", typedRequest.FacturaId);
                _logger.LogInformation("📦 Usuario Creación: {UsuarioCreacion}", typedRequest.UsuarioCreacion);
                _logger.LogInformation("📦 Productos: {Count}", typedRequest.ProductosPendientes?.Count ?? 0);

                // ✅ CREAR ESTRUCTURA EXACTA QUE ESPERA LA API
                var datosParaAPI = new
                {
                    facturaId = typedRequest.FacturaId,
                    usuarioCreacion = typedRequest.UsuarioCreacion,
                    productosPendientes = typedRequest.ProductosPendientes.Select(p => new
                    {
                        productoId = p.ProductoId,
                        nombreProducto = p.NombreProducto,
                        cantidadSolicitada = p.CantidadSolicitada,
                        cantidadPendiente = p.CantidadPendiente,
                        stockDisponible = p.StockDisponible
                    }).ToList()
                };

                _logger.LogInformation("📦 Datos estructurados para API: {Datos}", 
                    System.Text.Json.JsonSerializer.Serialize(datosParaAPI, new JsonSerializerOptions { WriteIndented = true }));

                // ✅ CONFIGURAR HEADERS CON TOKEN JWT
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Facturacion/registrar-pendientes-entrega");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PostAsJsonAsync(url, datosParaAPI);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📦 Respuesta de API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        // ✅ DESERIALIZAR RESPUESTA COMPLETA Y EXTRAER PENDIENTES CREADOS
                        var jsonDocument = System.Text.Json.JsonDocument.Parse(responseContent);
                        var root = jsonDocument.RootElement;

                        if (root.TryGetProperty("pendientesCreados", out var pendientesElement))
                        {
                            var pendientesCreados = System.Text.Json.JsonSerializer.Deserialize<object[]>(pendientesElement.GetRawText());

                            _logger.LogInformation("📦 Pendientes extraídos correctamente: {Count} items", pendientesCreados?.Length ?? 0);

                            return (true, new { pendientesCreados = pendientesCreados }, "Pendientes registrados exitosamente", null);
                        }
                        else
                        {
                            // Si no hay propiedad pendientesCreados, devolver respuesta completa
                            var data = System.Text.Json.JsonSerializer.Deserialize<object>(responseContent);
                            return (true, data, "Pendientes registrados exitosamente", null);
                        }
                    }
                    catch (System.Text.Json.JsonException ex)
                    {
                        _logger.LogError(ex, "❌ Error deserializando respuesta de pendientes");
                        return (true, (object)responseContent, "Pendientes registrados exitosamente", null);
                    }
                }
                else
                {
                    _logger.LogError("❌ Error en API registrando pendientes: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);

                    return (false, $"Error del servidor: {response.StatusCode}", null, responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error de comunicación registrando pendientes de entrega");
                return (false, "Error de comunicación con el servidor", null, ex.Message);
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> ObtenerFacturaPorIdAsync(int facturaId, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📋 === OBTENIENDO FACTURA/PROFORMA POR ID DESDE SERVICIO ===");
                _logger.LogInformation("📋 Factura ID: {FacturaId}", facturaId);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Facturacion/facturas/{facturaId}");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📋 Respuesta del API recibida exitosamente");

                    var factura = System.Text.Json.JsonSerializer.Deserialize<object>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return (success: true, data: factura, message: "Factura obtenida exitosamente", details: null);
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("📋 Error HTTP del API: {StatusCode} - {Content}", response.StatusCode, errorContent);
                    return (success: false, data: null, message: $"Error HTTP {response.StatusCode}", details: errorContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo factura por ID desde servicio");
                return (success: false, data: null, message: "Error interno del servicio", details: ex.Message);
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> MarcarProductosEntregadosAsync(object request, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("✅ === MARCANDO PRODUCTOS COMO ENTREGADOS ===");

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var jsonContent = JsonConvert.SerializeObject(request, new JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("📤 JSON enviado al API: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Facturacion/marcar-entregados");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PutAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📥 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (success: true, data: resultado, message: "Productos marcados como entregados exitosamente", details: null);
                }
                else
                {
                    _logger.LogError("❌ Error marcando productos como entregados: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);
                    return (success: false, data: null, message: "Error al marcar productos como entregados", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error marcando productos como entregados");
                return (success: false, data: null, message: "Error interno: " + ex.Message, details: ex.ToString());
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> MarcarProformaComoFacturadaAsync(int proformaId, object request, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🔄 === MARCANDO PROFORMA COMO FACTURADA ===");
                _logger.LogInformation("🔄 Proforma ID: {ProformaId}", proformaId);

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Facturacion/marcar-proforma-facturada/{proformaId}");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PutAsync(url, 
                    new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📥 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (success: true, data: resultado, message: "Proforma marcada como facturada exitosamente", details: null);
                }
                else
                {
                    _logger.LogError("❌ Error marcando proforma como facturada: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);
                    return (success: false, data: null, message: "Error al marcar proforma como facturada", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error marcando proforma como facturada");
                return (success: false, data: null, message: "Error interno: " + ex.Message, details: ex.ToString());
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> MarcarComoEntregadoPorCodigoAsync(object request, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("🚚 === MARCANDO COMO ENTREGADO POR CÓDIGO EN SERVICIO ===");
                _logger.LogInformation("🚚 Request recibido en servicio: {Request}", 
                    System.Text.Json.JsonSerializer.Serialize(request));
                _logger.LogInformation("🚚 URL de API: {Url}", "api/Facturacion/marcar-entregado-por-codigo");

                // ✅ CONFIGURAR TOKEN JWT ANTES DE LA LLAMADA
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para marcar entregado por código");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para marcar entregado por código");
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("Facturacion/marcar-entregado-por-codigo");
                _logger.LogInformation("🌐 URL construida: {url}", url);

                var response = await _httpClient.PostAsJsonAsync(url, request);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📥 Respuesta del API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return (success: true, data: resultado, message: "Producto marcado como entregado exitosamente", details: null);
                }
                else
                {
                    _logger.LogError("❌ Error marcando producto como entregado: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);
                    return (success: false, data: null, message: "Error al marcar producto como entregado", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error marcando producto como entregado por código");
                return (success: false, data: null, message: "Error interno: " + ex.Message, details: ex.ToString());
            }
        }
    }
    // Modelos para la deserialización
    public class StockVerificationResponse
    {
        public bool success { get; set; }
        public bool hayProblemasStock { get; set; }
        public bool tieneProblemas { get; set; }
        public List<ProductoConProblema> productosConProblemas { get; set; } = new List<ProductoConProblema>();
        public string message { get; set; }
    }

    public class ProductoConProblema
    {
        public int productoId { get; set; }
        public string nombreProducto { get; set; }
        public string descripcion { get; set; }
        public decimal precio { get; set; }
        public int cantidadRequerida { get; set; }
        public int stockDisponible { get; set; }
        public string problema { get; set; }
    }

    // Modelo para la respuesta del método
    public class StockVerificationResult
    {
        public bool hayProblemasStock { get; set; }
        public List<ProductoConProblemaInfo> productosConProblemas { get; set; } = new List<ProductoConProblemaInfo>();
        public string message { get; set; }
    }

    public class ProductoConProblemaInfo
    {
        public int productoId { get; set; }
        public string nombreProducto { get; set; }
        public string descripcion { get; set; }
        public decimal precio { get; set; }
        public int cantidadRequerida { get; set; }
        public int stockDisponible { get; set; }
        public string problema { get; set; }
        public int diferencia { get; set; } // Calculada: cantidadRequerida - stockDisponible
    }

    public class FacturaDTO
    {
        public int Id { get; set; }
        public string NumeroFactura { get; set; }
        public DateTime FechaCreacion { get; set; }
        public string NombreCliente { get; set; }
        public decimal Total { get; set; }
        public string Estado { get; set; }
    }

    public class FacturaCompletaDTO
    {
        public int FacturaId { get; set; }
        public string NumeroFactura { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaFactura { get; set; }
        public string NombreCliente { get; set; }
        public string? IdentificacionCliente { get; set; }
        public string? TelefonoCliente { get; set; }
        public string? EmailCliente { get; set; }
        public string? DireccionCliente { get; set; }
        public decimal Subtotal { get; set; }
        public decimal? MontoImpuesto { get; set; }
        public decimal Total { get; set; }
        public string Estado { get; set; }
        public string TipoDocumento { get; set; }
        public string? MetodoPago { get; set; }
        public string? Observaciones { get; set; }
        public string? UsuarioCreadorNombre { get; set; }
        public List<DetalleFacturaCompletaDTO> DetallesFactura { get; set; } = new List<DetalleFacturaCompletaDTO>();
        public int CantidadItems => DetallesFactura?.Sum(d => d.Cantidad) ?? 0;
    }

    public class DetalleFacturaCompletaDTO
    {
        public int DetalleFacturaId { get; set; }
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; }
        public string? DescripcionProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal? PorcentajeDescuento { get; set; }
        public decimal? MontoDescuento { get; set; }
        public decimal Subtotal { get; set; }
        public bool EsLlanta { get; set; }
        public string? MedidaLlanta { get; set; }
        public string? MarcaLlanta { get; set; }
        public string? ModeloLlanta { get; set; }
        public int StockDisponible { get; set; }
    }

    public class RegistrarPendientesEntregaRequest
    {
        public int FacturaId { get; set; }
        public int UsuarioCreacion { get; set; }
        public List<ProductoPendienteEntrega> ProductosPendientes { get; set; } = new List<ProductoPendienteEntrega>();
    }

    public class ProductoPendienteEntrega
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; }
        public int CantidadSolicitada { get; set; }
        public int CantidadPendiente { get; set; }
        public int StockDisponible { get; set; }
    }

    public class PendienteEntregaDTO
    {
        public int Id { get; set; }
        public int FacturaId { get; set; }
        public string NumeroFactura { get; set; }
        public string ClienteNombre { get; set; }
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; }
        public string DescripcionProducto { get; set; }
        public bool EsLlanta { get; set; }
        public string MedidaLlanta { get; set; }
        public string MarcaLlanta { get; set; }
        public int CantidadSolicitada { get; set; }
        public int CantidadPendiente { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaEntrega { get; set; }
        public string Estado { get; set; }
        public string Observaciones { get; set; }
        public int UsuarioCreacion { get; set; }
        public int UsuarioEntrega { get; set; }
        public string CodigoSeguimiento { get; set; }

    }
}