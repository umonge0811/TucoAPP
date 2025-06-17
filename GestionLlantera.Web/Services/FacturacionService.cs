
using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using Tuco.Clases.DTOs.Facturacion;

namespace GestionLlantera.Web.Services
{
    public class FacturacionService : IFacturacionService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<FacturacionService> _logger;

        public FacturacionService(HttpClient httpClient, ILogger<FacturacionService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<(bool Exitoso, object Resultado, string? Error)> ObtenerProductosParaVentaAsync(
            string? busqueda = null, bool soloConStock = true, int pagina = 1, int tamano = 50, string token = "")
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                var queryParams = new List<string>();
                if (!string.IsNullOrWhiteSpace(busqueda))
                    queryParams.Add($"busqueda={Uri.EscapeDataString(busqueda)}");
                queryParams.Add($"soloConStock={soloConStock}");
                queryParams.Add($"pagina={pagina}");
                queryParams.Add($"tamano={tamano}");

                var queryString = string.Join("&", queryParams);
                var response = await _httpClient.GetAsync($"api/Facturacion/productos-venta?{queryString}");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var resultado = JsonConvert.DeserializeObject<object>(jsonResponse);
                    return (true, resultado!, null);
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("❌ Error al obtener productos para venta: {Error}", errorContent);
                return (false, null!, $"Error del servidor: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al obtener productos para venta");
                return (false, null!, "Error de conexión");
            }
        }

        public async Task<(bool Exitoso, ProductoVentaDTO? Producto, string? Error)> ObtenerProductoParaVentaAsync(int id, string token)
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                var response = await _httpClient.GetAsync($"api/Facturacion/producto-venta/{id}");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var producto = JsonConvert.DeserializeObject<ProductoVentaDTO>(jsonResponse);
                    return (true, producto, null);
                }

                return (false, null, $"Error del servidor: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener producto para venta: {Id}", id);
                return (false, null, "Error de conexión");
            }
        }

        public async Task<(bool Exitoso, object Resultado, string? Error)> CrearFacturaAsync(FacturaDTO factura, string token)
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                var json = JsonConvert.SerializeObject(factura);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("api/Facturacion/facturas", content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var resultado = JsonConvert.DeserializeObject<object>(responseContent);
                    return (true, resultado!, null);
                }

                _logger.LogError("❌ Error al crear factura: {Error}", responseContent);
                return (false, null!, responseContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción al crear factura");
                return (false, null!, "Error de conexión");
            }
        }

        public async Task<(bool Exitoso, object Resultado, string? Error)> ObtenerFacturasAsync(
            string? filtro = null, string? estado = null, string? tipoDocumento = null,
            DateTime? fechaDesde = null, DateTime? fechaHasta = null, int pagina = 1, int tamano = 20, string token = "")
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                var queryParams = new List<string>();
                if (!string.IsNullOrWhiteSpace(filtro))
                    queryParams.Add($"filtro={Uri.EscapeDataString(filtro)}");
                if (!string.IsNullOrWhiteSpace(estado))
                    queryParams.Add($"estado={Uri.EscapeDataString(estado)}");
                if (!string.IsNullOrWhiteSpace(tipoDocumento))
                    queryParams.Add($"tipoDocumento={Uri.EscapeDataString(tipoDocumento)}");
                if (fechaDesde.HasValue)
                    queryParams.Add($"fechaDesde={fechaDesde.Value:yyyy-MM-dd}");
                if (fechaHasta.HasValue)
                    queryParams.Add($"fechaHasta={fechaHasta.Value:yyyy-MM-dd}");
                queryParams.Add($"pagina={pagina}");
                queryParams.Add($"tamano={tamano}");

                var queryString = string.Join("&", queryParams);
                var response = await _httpClient.GetAsync($"api/Facturacion/facturas?{queryString}");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var resultado = JsonConvert.DeserializeObject<object>(jsonResponse);
                    return (true, resultado!, null);
                }

                return (false, null!, $"Error del servidor: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener facturas");
                return (false, null!, "Error de conexión");
            }
        }

        public async Task<(bool Exitoso, FacturaDTO? Factura, string? Error)> ObtenerFacturaPorIdAsync(int id, string token)
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                var response = await _httpClient.GetAsync($"api/Facturacion/facturas/{id}");

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var factura = JsonConvert.DeserializeObject<FacturaDTO>(jsonResponse);
                    return (true, factura, null);
                }

                return (false, null, $"Error del servidor: {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener factura: {Id}", id);
                return (false, null, "Error de conexión");
            }
        }

        public async Task<(bool Exitoso, string? Error)> ActualizarEstadoFacturaAsync(int id, string nuevoEstado, string token)
        {
            try
            {
                if (!string.IsNullOrEmpty(token))
                {
                    _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                var json = JsonConvert.SerializeObject(nuevoEstado);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"api/Facturacion/facturas/{id}/estado", content);

                if (response.IsSuccessStatusCode)
                {
                    return (true, null);
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                return (false, errorContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar estado de factura: {Id}", id);
                return (false, "Error de conexión");
            }
        }

        public async Task<string> GenerarNumeroFacturaAsync(string tipoDocumento, string token)
        {
            try
            {
                // Implementar lógica local para generar número de factura
                var prefijo = tipoDocumento == "Proforma" ? "PRO" : "FAC";
                var año = DateTime.Now.Year;
                var mes = DateTime.Now.Month;
                var timestamp = DateTime.Now.Ticks.ToString().Substring(10);
                
                return $"{prefijo}-{año:D4}{mes:D2}-{timestamp}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al generar número de factura");
                return $"FAC-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks.ToString().Substring(10)}";
            }
        }
    }
}
