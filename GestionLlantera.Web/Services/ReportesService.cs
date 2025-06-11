using GestionLlantera.Web.Services.Interfaces;
using System.Text;

namespace GestionLlantera.Web.Services
{
    public class ReportesService : IReportesService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ReportesService> _logger;

        public ReportesService(HttpClient httpClient, ILogger<ReportesService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<byte[]> DescargarExcelAsync(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📥 Descargando Excel para inventario {InventarioId}", inventarioId);

                var response = await _httpClient.GetAsync($"api/Reportes/inventario/{inventarioId}/excel");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API: {StatusCode} - {Error}", response.StatusCode, errorContent);
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

        public async Task<byte[]> DescargarPdfAsync(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📄 Descargando PDF para inventario {InventarioId}", inventarioId);

                var response = await _httpClient.GetAsync($"api/Reportes/inventario/{inventarioId}/pdf");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API: {StatusCode} - {Error}", response.StatusCode, errorContent);
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

        public async Task<object> ObtenerReporteAsync(int inventarioId)
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo datos del reporte para inventario {InventarioId}", inventarioId);

                var response = await _httpClient.GetAsync($"api/Reportes/inventario/{inventarioId}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error en API: {StatusCode} - {Error}", response.StatusCode, errorContent);
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