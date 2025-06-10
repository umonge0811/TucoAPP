using GestionLlantera.Web.Services.Interfaces;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using Tuco.Clases.DTOs.Inventario;

namespace GestionLlantera.Web.Services
{
    public class AjustesInventarioService : IAjustesInventarioService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AjustesInventarioService> _logger;

        public AjustesInventarioService(IHttpClientFactory httpClientFactory, ILogger<AjustesInventarioService> logger)
        {
            _httpClient = httpClientFactory.CreateClient("APIClient");
            _logger = logger;
        }

        public async Task<bool> CrearAjustePendienteAsync(SolicitudAjusteInventarioDTO solicitud, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📝 === CREANDO AJUSTE PENDIENTE (WEB SERVICE) ===");
                _logger.LogInformation("📝 Inventario: {InventarioId}, Producto: {ProductoId}",
                    solicitud.InventarioProgramadoId, solicitud.ProductoId);

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
                var response = await _httpClient.PostAsync($"api/TomaInventario/{solicitud.InventarioProgramadoId}/ajustar-discrepancia", content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📡 Respuesta API: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en API: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return false;
                }

                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                var success = resultado?.success ?? false;

                return success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al crear ajuste pendiente en servicio web");
                return false;
            }
        }

        /// <summary>
        /// Actualiza un ajuste pendiente existente
        /// </summary>
        public async Task<bool> ActualizarAjustePendienteAsync(int ajusteId, SolicitudAjusteInventarioDTO solicitud, string jwtToken)
        {
            try
            {
                _logger.LogInformation("✏️ === ACTUALIZANDO AJUSTE PENDIENTE (WEB SERVICE) ===");
                _logger.LogInformation("✏️ Ajuste ID: {AjusteId}, Producto: {ProductoId}", ajusteId, solicitud.ProductoId);

                // ✅ CONFIGURAR TOKEN JWT
                ConfigurarAutenticacion(jwtToken);

                // ✅ SERIALIZAR SOLICITUD
                var jsonContent = JsonConvert.SerializeObject(solicitud, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Include
                });

                _logger.LogInformation("📤 JSON actualización enviado: {Json}", jsonContent);

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                // ✅ ENVIAR A LA API (USAR PUT)
                var response = await _httpClient.PutAsync($"api/TomaInventario/ajustes/{ajusteId}", content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📡 Respuesta actualización API: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error en API actualizando: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return false;
                }

                // ✅ DESERIALIZACIÓN SEGURA - CORREGIDA
                try
                {
                    var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);

                    // ✅ CONVERSIÓN EXPLÍCITA Y SEGURA
                    bool success = false;
                    if (resultado?.success != null)
                    {
                        // Manejar diferentes tipos de valores que puede devolver la API
                        if (resultado.success is bool successBool)
                        {
                            success = successBool;
                        }
                        else if (resultado.success is string successString)
                        {
                            success = bool.TryParse(successString, out bool parsedBool) && parsedBool;
                        }
                        else
                        {
                            // Intentar convertir usando ToString() y luego Parse
                            var successValue = resultado.success.ToString();
                            success = bool.TryParse(successValue, out bool parsedValue) && parsedValue;
                        }
                    }

                    if (success)
                    {
                        _logger.LogInformation("✅ Ajuste actualizado exitosamente");
                    }
                    else
                    {
                        _logger.LogError("❌ La API reportó fallo al actualizar ajuste");
                    }

                    return success;
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "❌ Error deserializando respuesta JSON: {Content}", responseContent);

                    // ✅ FALLBACK: Si la respuesta no es JSON válido, verificar por texto
                    if (responseContent.Contains("\"success\":true") || responseContent.Contains("success: true"))
                    {
                        _logger.LogInformation("✅ Actualización exitosa detectada por análisis de texto");
                        return true;
                    }

                    return false;
                }
            }
            catch (HttpRequestException httpEx)
            {
                _logger.LogError(httpEx, "💥 Error de conexión al actualizar ajuste pendiente");
                return false;
            }
            catch (TaskCanceledException taskEx)
            {
                _logger.LogError(taskEx, "💥 Timeout al actualizar ajuste pendiente");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error general al actualizar ajuste pendiente en servicio web");
                return false;
            }
        }

        public async Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesPendientesAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo ajustes pendientes para inventario {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}/ajustes");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ Error obteniendo ajustes: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);
                    return new List<AjusteInventarioPendienteDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                // La API devuelve { success: true, ajustes: [...] }
                if (resultado?.success == true && resultado?.ajustes != null)
                {
                    var ajustesJson = resultado.ajustes.ToString();
                    var ajustes = JsonConvert.DeserializeObject<List<AjusteInventarioPendienteDTO>>(ajustesJson);

                    return ajustes ?? new List<AjusteInventarioPendienteDTO>();
                }

                return new List<AjusteInventarioPendienteDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener ajustes pendientes");
                return new List<AjusteInventarioPendienteDTO>();
            }
        }

        public async Task<List<AjusteInventarioPendienteDTO>> ObtenerAjustesProductoAsync(int inventarioId, int productoId, string jwtToken)
        {
            try
            {
                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}/productos/{productoId}/ajustes");

                if (!response.IsSuccessStatusCode)
                {
                    return new List<AjusteInventarioPendienteDTO>();
                }

                var content = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                if (resultado?.success == true && resultado?.ajustes != null)
                {
                    var ajustesJson = resultado.ajustes.ToString();
                    var ajustes = JsonConvert.DeserializeObject<List<AjusteInventarioPendienteDTO>>(ajustesJson);
                    return ajustes ?? new List<AjusteInventarioPendienteDTO>();
                }

                return new List<AjusteInventarioPendienteDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener ajustes del producto");
                return new List<AjusteInventarioPendienteDTO>();
            }
        }

        public async Task<bool> EliminarAjustePendienteAsync(int ajusteId, string jwtToken)
        {
            try
            {
                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.DeleteAsync($"api/TomaInventario/ajustes/{ajusteId}");

                if (!response.IsSuccessStatusCode)
                {
                    return false;
                }

                var content = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                return resultado?.success ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al eliminar ajuste pendiente");
                return false;
            }
        }

        public async Task<object> ObtenerResumenAjustesAsync(int inventarioId, string jwtToken)
        {
            try
            {
                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.GetAsync($"api/TomaInventario/{inventarioId}/ajustes/resumen");

                if (!response.IsSuccessStatusCode)
                {
                    return new { error = "No se pudo obtener el resumen" };
                }

                var content = await response.Content.ReadAsStringAsync();
                var resultado = JsonConvert.DeserializeObject<dynamic>(content);

                return resultado?.resumen ?? new { };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error al obtener resumen de ajustes");
                return new { error = ex.Message };
            }
        }

        public async Task<bool> AplicarAjustesPendientesAsync(int inventarioId, string jwtToken)
        {
            try
            {
                _logger.LogInformation("🔥 === APLICANDO AJUSTES PENDIENTES (WEB SERVICE) ===");
                _logger.LogInformation("🔥 Inventario ID: {InventarioId}", inventarioId);

                ConfigurarAutenticacion(jwtToken);

                var response = await _httpClient.PostAsync($"api/TomaInventario/{inventarioId}/aplicar-ajustes", null);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📡 Respuesta aplicar ajustes: Status={Status}, Content={Content}",
                    response.StatusCode, responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Error aplicando ajustes: {StatusCode} - {Content}",
                        response.StatusCode, responseContent);
                    return false;
                }

                var resultado = JsonConvert.DeserializeObject<dynamic>(responseContent);
                var success = resultado?.success ?? false;

                if (success)
                {
                    _logger.LogInformation("✅ Ajustes aplicados exitosamente");
                }
                else
                {
                    _logger.LogError("❌ La API reportó fallo al aplicar ajustes");
                }

                return success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al aplicar ajustes pendientes");
                return false;
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