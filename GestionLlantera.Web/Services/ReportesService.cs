using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using System;

namespace GestionLlantera.Web.Services
{
    public class ReportesService : IReportesService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ReportesService> _logger;
        private readonly ApiConfigurationService _apiConfig; // Agregado ApiConfigurationService

        public ReportesService(IHttpClientFactory httpClientFactory, ILogger<ReportesService> logger, ApiConfigurationService apiConfig) // Inyectado ApiConfigurationService
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _apiConfig = apiConfig; // Asignado ApiConfigurationService
        }

        public async Task<byte[]> DescargarExcelAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📥 Descargando Excel para inventario {InventarioId}", inventarioId);

                var httpClient = _httpClientFactory.CreateClient("APIClient");

                // ✅ CONFIGURAR TOKEN JWT SI SE PROPORCIONA
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    httpClient.DefaultRequestHeaders.Clear();
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición Excel");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para Excel");
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Reportes/inventario/{inventarioId}/excel");
                _logger.LogDebug("🌐 URL construida para descargar Excel: {url}", url);

                var response = await httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API Excel: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    throw new Exception($"Error del servidor: {response.StatusCode}");
                }

                var bytes = await response.Content.ReadAsByteArrayAsync();
                _logger.LogInformation("✅ Excel descargado correctamente, tamaño: {Size} bytes", bytes.Length);

                return bytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error descargando Excel para inventario {InventarioId}", inventarioId);
                throw;
            }
        }

        public async Task<byte[]> DescargarPdfAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📄 Descargando PDF para inventario {InventarioId}", inventarioId);

                var httpClient = _httpClientFactory.CreateClient("APIClient");

                // ✅ CONFIGURAR TOKEN JWT SI SE PROPORCIONA
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    httpClient.DefaultRequestHeaders.Clear();
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición PDF");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para PDF");
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Reportes/inventario/{inventarioId}/pdf");
                _logger.LogDebug("🌐 URL construida para descargar PDF: {url}", url);

                var response = await httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API PDF: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    throw new Exception($"Error del servidor: {response.StatusCode}");
                }

                var bytes = await response.Content.ReadAsByteArrayAsync();
                _logger.LogInformation("✅ PDF descargado correctamente, tamaño: {Size} bytes", bytes.Length);

                return bytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error descargando PDF para inventario {InventarioId}", inventarioId);
                throw;
            }
        }

        public async Task<object> ObtenerReporteAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo datos del reporte para inventario {InventarioId}", inventarioId);

                var httpClient = _httpClientFactory.CreateClient("APIClient");

                // ✅ CONFIGURAR TOKEN JWT SI SE PROPORCIONA
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    httpClient.DefaultRequestHeaders.Clear();
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición de datos");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener datos");
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Reportes/inventario/{inventarioId}");
                _logger.LogDebug("🌐 URL construida para obtener reporte: {url}", url);

                var response = await httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API datos: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    throw new Exception($"Error del servidor: {response.StatusCode}");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var reporte = JsonSerializer.Deserialize<object>(jsonContent);

                _logger.LogInformation("✅ Datos del reporte obtenidos correctamente");
                return reporte;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error obteniendo reporte para inventario {InventarioId}", inventarioId);
                throw;
            }
        }

        public async Task<byte[]> DescargarPedidoPdfAsync(int pedidoId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📥 Descargando PDF para pedido {PedidoId}", pedidoId);

                var httpClient = _httpClientFactory.CreateClient("APIClient");

                // ✅ CONFIGURAR TOKEN JWT SI SE PROPORCIONA
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    httpClient.DefaultRequestHeaders.Clear();
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición PDF de pedido");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para PDF de pedido");
                }

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"reportes/pedido/{pedidoId}/pdf");
                _logger.LogDebug("🌐 URL construida para descargar PDF pedido: {url}", url);

                var response = await httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API al descargar PDF pedido: {StatusCode} - {Content}", 
                        response.StatusCode, errorContent);
                    throw new Exception($"Error del servidor: {response.StatusCode}");
                }

                var archivoBytes = await response.Content.ReadAsByteArrayAsync();
                _logger.LogInformation("✅ PDF de pedido descargado exitosamente. Tamaño: {Size} bytes", archivoBytes.Length);

                return archivoBytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al descargar PDF del pedido {PedidoId}", pedidoId);
                throw;
            }
        }
    }
}