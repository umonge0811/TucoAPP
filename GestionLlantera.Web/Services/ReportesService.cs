using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Services
{
    public class ReportesService : IReportesService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ReportesService> _logger;

        public ReportesService(IHttpClientFactory httpClientFactory, ILogger<ReportesService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
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
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición Excel");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para Excel");
                }

                var response = await httpClient.GetAsync($"api/Reportes/inventario/{inventarioId}/excel");

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
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición PDF");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para PDF");
                }

                var response = await httpClient.GetAsync($"api/Reportes/inventario/{inventarioId}/pdf");

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
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);
                    _logger.LogInformation("🔐 Token JWT configurado para la petición de datos");
                }
                else
                {
                    _logger.LogWarning("⚠️ No se proporcionó token JWT para obtener datos");
                }

                var response = await httpClient.GetAsync($"api/Reportes/inventario/{inventarioId}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API datos: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    throw new Exception($"Error del servidor: {response.StatusCode}");
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var reporte = System.Text.Json.JsonSerializer.Deserialize<object>(jsonContent);

                _logger.LogInformation("✅ Datos del reporte obtenidos correctamente");
                return reporte;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error obteniendo reporte para inventario {InventarioId}", inventarioId);
                throw;
            }
        }
    }
}