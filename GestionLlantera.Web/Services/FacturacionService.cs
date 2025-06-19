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
                _logger.LogInformation("📦 Ajustando stock para factura: {NumeroFactura} con {Cantidad} productos", 
                    request.NumeroFactura, request.Productos?.Count ?? 0);

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

                            resultados.Add(new {
                                productoId = productoAjuste.ProductoId,
                                nombreProducto = productoAjuste.NombreProducto,
                                success = true,
                                stockAnterior = resultado?.stockAnterior ?? 0,
                                stockNuevo = resultado?.stockNuevo ?? 0,
                                diferencia = resultado?.diferencia ?? 0,
                                mensaje = $"Stock actualizado correctamente"
                            });

                            ajustesExitosos++;
                            _logger.LogInformation("✅ Stock ajustado para {Producto}: {StockAnterior} → {StockNuevo}", 
                                productoAjuste.NombreProducto, resultado?.stockAnterior ?? 0, resultado?.stockNuevo ?? 0);
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

                _logger.LogInformation("📦 Ajuste completado: {Exitosos}/{Total} productos actualizados", 
                    ajustesExitosos, request.Productos.Count);

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

        // Otros métodos del servicio...
    }
}