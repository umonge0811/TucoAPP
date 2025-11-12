using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio para gestión de movimientos post-corte en inventarios
    /// </summary>
    public class MovimientosPostCorteService : IMovimientosPostCorteService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MovimientosPostCorteService> _logger;
        private readonly ApiConfigurationService _apiConfig;

        public MovimientosPostCorteService(
            IHttpClientFactory httpClientFactory,
            ILogger<MovimientosPostCorteService> logger,
            ApiConfigurationService apiConfig)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
            _apiConfig = apiConfig;

            _logger.LogInformation("🔧 MovimientosPostCorteService inicializado con URL base: {BaseUrl}",
                _apiConfig.BaseUrl);
        }

        public async Task<(bool Success, object? Data)> ObtenerAlertasAsync(
            int inventarioId,
            int? usuarioId,
            bool soloNoLeidas,
            string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔔 === OBTENIENDO ALERTAS POST-CORTE (WEB SERVICE) ===");
                _logger.LogInformation("🔔 Inventario: {InventarioId}, Usuario: {UsuarioId}, SoloNoLeidas: {SoloNoLeidas}",
                    inventarioId, usuarioId, soloNoLeidas);

                // ✅ CONSTRUIR URL CON QUERY PARAMETERS
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{inventarioId}/alertas");
                if (usuarioId.HasValue)
                {
                    url += $"?usuarioId={usuarioId.Value}&soloNoLeidas={soloNoLeidas}";
                }
                else
                {
                    url += $"?soloNoLeidas={soloNoLeidas}";
                }

                _logger.LogInformation("🌐 URL construida: {Url}", url);

                // ✅ CONFIGURAR TOKEN JWT
                ConfigurarAutenticacion(jwtToken);

                // ✅ LLAMAR A LA API
                var response = await _httpClient.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta API: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en API: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);
                    return (false, null);
                }

                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);

                return (true, resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener alertas post-corte en servicio web");
                return (false, null);
            }
        }

        public async Task<(bool Success, string Message)> ActualizarLineaAsync(
            ActualizarLineaInventarioDTO solicitud,
            string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔄 === ACTUALIZANDO LÍNEA POST-CORTE (WEB SERVICE) ===");
                _logger.LogInformation("🔄 Inventario: {InventarioId}, Producto: {ProductoId}, Usuario: {UsuarioId}",
                    solicitud.InventarioProgramadoId, solicitud.ProductoId, solicitud.UsuarioId);

                // ✅ CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("MovimientosPostCorte/actualizar-linea");
                _logger.LogInformation("🌐 URL construida: {Url}", url);

                // ✅ CONFIGURAR TOKEN JWT
                ConfigurarAutenticacion(jwtToken);

                // ✅ SERIALIZAR SOLICITUD
                var jsonContent = JsonConvert.SerializeObject(solicitud, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("📤 JSON enviado: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // ✅ ENVIAR A LA API
                var response = await _httpClient.PostAsync(url, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta API: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en API: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);
                    return (false, "Error al actualizar la línea en el servidor");
                }

                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                bool success = resultado?.success ?? false;
                string message = resultado?.message ?? "Línea actualizada";

                return (success, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al actualizar línea post-corte en servicio web");
                return (false, $"Error interno: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> MarcarAlertaLeidaAsync(
            int alertaId,
            string jwtToken)
        {
            try
            {
                _logger.LogInformation("✔️ === MARCANDO ALERTA COMO LEÍDA (WEB SERVICE) ===");
                _logger.LogInformation("✔️ Alerta ID: {AlertaId}", alertaId);

                // ✅ CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Inventario/alertas/{alertaId}/marcar-leida");
                _logger.LogInformation("🌐 URL construida: {Url}", url);

                // ✅ CONFIGURAR TOKEN JWT
                ConfigurarAutenticacion(jwtToken);

                // ✅ ENVIAR A LA API
                var response = await _httpClient.PutAsync(url, null);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta API: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en API: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);
                    return (false, "Error al marcar alerta como leída");
                }

                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                bool success = resultado?.success ?? false;
                string message = resultado?.message ?? "Alerta marcada como leída";

                return (success, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al marcar alerta como leída en servicio web");
                return (false, $"Error interno: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> MarcarTodasAlertasLeidasAsync(
            int inventarioId,
            int usuarioId,
            string jwtToken)
        {
            try
            {
                _logger.LogInformation("✔️✔️ === MARCANDO TODAS LAS ALERTAS COMO LEÍDAS (WEB SERVICE) ===");
                _logger.LogInformation("✔️✔️ Inventario: {InventarioId}, Usuario: {UsuarioId}",
                    inventarioId, usuarioId);

                // ✅ CONSTRUIR URL
                var url = _apiConfig.GetApiUrl($"Inventario/inventarios-programados/{inventarioId}/alertas/marcar-todas-leidas");
                _logger.LogInformation("🌐 URL construida: {Url}", url);

                // ✅ CONFIGURAR TOKEN JWT
                ConfigurarAutenticacion(jwtToken);

                // ✅ ENVIAR A LA API
                var response = await _httpClient.PutAsync(url, null);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📡 Respuesta API: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en API: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);
                    return (false, "Error al marcar todas las alertas como leídas");
                }

                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                bool success = resultado?.success ?? false;
                string message = resultado?.message ?? "Todas las alertas han sido marcadas como leídas";

                return (success, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al marcar todas las alertas como leídas en servicio web");
                return (false, $"Error interno: {ex.Message}");
            }
        }

        private void ConfigurarAutenticacion(string jwtToken)
        {
            if (!string.IsNullOrEmpty(jwtToken))
            {
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
            }
        }
    }
}
