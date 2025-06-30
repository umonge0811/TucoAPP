using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using System.Text.Json;

namespace GestionLlantera.Web.Services
{
    public class FacturacionService : IFacturacionService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<FacturacionService> _logger;
        private const decimal IVA_PORCENTAJE = 0.13m; // 13% IVA en Costa Rica
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        public FacturacionService(IHttpClientFactory httpClientFactory, ILogger<FacturacionService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
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
                        var response = await _httpClient.GetAsync($"api/Inventario/productos/{producto.ProductoId}");

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

                var url = "/api/Facturacion/productos-venta?soloConStock=true";
                if (!string.IsNullOrWhiteSpace(busqueda))
                {
                    url += $"&busqueda={Uri.EscapeDataString(busqueda)}";
                }

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

        public async Task<object> AjustarStockFacturacionAsync(AjusteStockFacturacionRequest request, string jwtToken = null)
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
                    return new { 
                        success = false, 
                        message = "No se proporcionaron productos para ajustar" 
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
                        var httpResponse = await _httpClient.PostAsync($"api/Inventario/productos/{productoAjuste.ProductoId}/ajustar-stock", content);

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
                var response = new {
                    success = ajustesExitosos > 0,
                    message = ajustesExitosos > 0 ? 
                        $"Stock ajustado para {ajustesExitosos} productos" : 
                        "No se pudo ajustar el stock de ningún producto",
                    ajustesExitosos = ajustesExitosos,
                    totalProductos = request.Productos.Count,
                    resultados = resultados,
                    errores = errores.Any() ? errores : null
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
                return new { 
                    success = false, 
                    message = "Error interno al ajustar stock: " + ex.Message 
                };
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> ObtenerFacturasPendientesAsync(string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo facturas pendientes desde la API");

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var response = await _httpClient.GetAsync("api/Facturacion/facturas/pendientes");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📋 Respuesta de la API: {StatusCode}", response.StatusCode);
                _logger.LogInformation("📋 Contenido de respuesta: {Content}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("📋 Respuesta exitosa de la API");
                    
                    // Deserializar como JObject para mejor control
                    var jObject = JObject.Parse(responseContent);
                    
                    _logger.LogInformation("📋 Estructura de respuesta de API: {Estructura}", 
                        string.Join(", ", jObject.Properties().Select(p => p.Name)));
                    
                    // Extraer datos según la estructura de la API
                    var success = jObject["success"]?.Value<bool>() ?? false;
                    var facturas = jObject["facturas"]?.ToObject<List<object>>() ?? new List<object>();
                    var message = jObject["message"]?.Value<string>() ?? "";
                    
                    _logger.LogInformation("📋 Facturas extraídas: {Count} elementos", facturas.Count);
                    
                    if (facturas.Any())
                    {
                        _logger.LogInformation("📋 Se encontraron {Count} facturas pendientes", facturas.Count);
                        
                        return (success: true, data: new { 
                            success = true,
                            facturas = facturas,
                            totalFacturas = facturas.Count,
                            message = $"Se encontraron {facturas.Count} facturas pendientes"
                        }, message: "Facturas pendientes obtenidas", details: null);
                    }
                    else
                    {
                        _logger.LogInformation("📋 No se encontraron facturas pendientes");
                        return (success: true, data: new { 
                            success = true,
                            facturas = new List<object>(),
                            totalFacturas = 0,
                            message = "No hay facturas pendientes"
                        }, message: "No hay facturas pendientes", details: null);
                    }
                }
                else
                {
                    _logger.LogError("❌ Error obteniendo facturas pendientes: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);
                    return (success: false, data: null, message: "Error al obtener facturas pendientes", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo facturas pendientes");
                return (success: false, data: null, message: "Error interno: " + ex.Message, details: ex.ToString());
            }
        }

        public async Task<(bool success, object? data, string? message, string? details)> CompletarFacturaAsync(int facturaId, object datosCompletamiento, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("✅ Completando factura ID: {FacturaId}", facturaId);

                // Configurar token JWT si se proporciona
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var jsonContent = JsonConvert.SerializeObject(datosCompletamiento, new JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss",
                    NullValueHandling = NullValueHandling.Include
                });

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/Facturacion/facturas/{facturaId}/completar", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject(responseContent);
                    return (success: true, data: resultado, message: "Factura completada exitosamente", details: null);
                }
                else
                {
                    _logger.LogError("❌ Error completando factura: {StatusCode} - {Content}", 
                        response.StatusCode, responseContent);
                    return (success: false, data: null, message: "Error al completar factura", details: responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error completando factura");
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

                // Usar el endpoint correcto de la API
                var response = await _httpClient.PostAsync("api/Facturacion/facturas", content);

                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📥 Respuesta de API: {StatusCode} - {Content}", response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject(responseContent);

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
                {
                    _logger.LogError("❌ No se encontraron productos en la factura. Propiedades disponibles: {Propiedades}", 
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
                var prefijo = tipoDocumento == "Proforma" ? "PRO" : "FAC";
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

                _logger.LogInformation("📋 Número de factura generado: {NumeroFactura}", numeroFactura);

                return numeroFactura;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando número de factura");
                // Fallback a un número simple
                return $"FAC-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks.ToString().Substring(10, 6)}";
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
                        _logger.LogInformation("🔍   - {Propiedad}: {Valor}", property.Name, valorTruncado);
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
    }
}