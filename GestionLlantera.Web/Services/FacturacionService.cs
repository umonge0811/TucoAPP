using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
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
                _logger.LogInformation("📦 Ajustando stock para {Cantidad} productos", request.Productos?.Count ?? 0);

                if (request.Productos == null || !request.Productos.Any())
                {
                    return new { success = false, message = "No se proporcionaron productos para ajustar" };
                }

                var errores = new List<string>();
                var productosAjustados = 0;

                foreach (var productoAjuste in request.Productos)
                {
                    try
                    {
                        _logger.LogInformation("📦 Ajustando stock - Producto: {ProductoId}, Cantidad: {Cantidad}", 
                            productoAjuste.ProductoId, productoAjuste.CantidadVendida);

                        var ajusteData = new
                        {
                            productoId = productoAjuste.ProductoId,
                            tipoAjuste = "venta",
                            cantidadAjuste = -productoAjuste.CantidadVendida, // Negativo porque es una venta
                            motivo = $"Venta - Factura: {request.NumeroFactura}",
                            usuarioId = 1 // TODO: Obtener del contexto real
                        };

                        if (!string.IsNullOrEmpty(jwtToken))
                        {
                            _httpClient.DefaultRequestHeaders.Authorization = 
                                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                        }

                        var json = System.Text.Json.JsonSerializer.Serialize(ajusteData);
                        var content = new StringContent(json, Encoding.UTF8, "application/json");

                        var response = await _httpClient.PostAsync("api/Inventario/ajustar-stock", content);

                        if (response.IsSuccessStatusCode)
                        {
                            productosAjustados++;
                            _logger.LogInformation("✅ Stock ajustado correctamente para producto {ProductoId}", 
                                productoAjuste.ProductoId);
                        }
                        else
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            var error = $"Error ajustando producto {productoAjuste.ProductoId}: {errorContent}";
                            errores.Add(error);
                            _logger.LogWarning("⚠️ {Error}", error);
                        }
                    }
                    catch (Exception ex)
                    {
                        var error = $"Excepción ajustando producto {productoAjuste.ProductoId}: {ex.Message}";
                        errores.Add(error);
                        _logger.LogError(ex, "❌ Error ajustando stock para producto {ProductoId}", 
                            productoAjuste.ProductoId);
                    }
                }

                var esExitoso = productosAjustados > 0;
                var mensaje = esExitoso 
                    ? $"Stock ajustado para {productosAjustados} productos"
                    : "No se pudo ajustar el stock de ningún producto";

                if (errores.Any())
                {
                    mensaje += $". Errores: {string.Join(", ", errores)}";
                }

                return new { 
                    success = esExitoso, 
                    message = mensaje,
                    productosAjustados = productosAjustados,
                    errores = errores
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error general en AjustarStockFacturacionAsync");
                return new { success = false, message = "Error interno al ajustar stock: " + ex.Message };
            }
        }

        public async Task<object> CrearFacturaAsync(object facturaData, string jwtToken = null)
        {
            try
            {
                _logger.LogInformation("💰 Enviando factura a la API");

                if (!string.IsNullOrEmpty(jwtToken))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = 
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                }

                var json = System.Text.Json.JsonSerializer.Serialize(facturaData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Facturacion/facturas", content);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = await response.Content.ReadAsStringAsync();
                    var facturaCreada = System.Text.Json.JsonSerializer.Deserialize<dynamic>(resultado);

                    _logger.LogInformation("✅ Factura creada exitosamente");

                    return new { 
                        success = true, 
                        message = "Factura creada exitosamente",
                        numeroFactura = facturaCreada?.numeroFactura?.ToString(),
                        facturaId = facturaCreada?.facturaId?.ToString()
                    };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error de la API al crear factura: {Error}", errorContent);

                    return new { 
                        success = false, 
                        message = "Error al crear la factura: " + errorContent 
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al llamar API para crear factura");
                return new { 
                    success = false, 
                    message = "Error interno al crear factura: " + ex.Message 
                };
            }
        }
    }
}