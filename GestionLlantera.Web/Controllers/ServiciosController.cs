using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class ServiciosController : Controller
    {
        private readonly ILogger<ServiciosController> _logger;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ServiciosController(
            ILogger<ServiciosController> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient("ApiClient");
            _configuration = configuration;
        }

        /// <summary>
        /// Vista principal de gestión de servicios
        /// </summary>
        public async Task<IActionResult> Index()
        {
            try
            {
                // ✅ VERIFICAR PERMISO PARA ACCEDER A SERVICIOS
                if (!await this.TienePermisoAsync("Ver Servicios"))
                {
                    _logger.LogWarning("🚫 Usuario sin permiso 'Ver Servicios' intentó acceder al módulo");
                    TempData["AccesoNoAutorizado"] = "Ver Servicios";
                    TempData["ModuloAcceso"] = "Servicios";
                    return RedirectToAction("AccessDenied", "Account");
                }

                _logger.LogInformation("🔧 === ACCESO AL MÓDULO DE SERVICIOS ===");

                ViewData["Title"] = "Gestión de Servicios";
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al cargar módulo de servicios");
                TempData["ErrorMessage"] = "Error al cargar el módulo de servicios";
                return RedirectToAction("Index", "Home");
            }
        }

        /// <summary>
        /// Obtiene servicios via AJAX para DataTables
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerServicios(
            string busqueda = "",
            string tipoServicio = "",
            bool soloActivos = true,
            int pagina = 1,
            int tamano = 50)
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Servicios"))
                {
                    return Json(new { success = false, message = "No tiene permisos para ver servicios" });
                }

                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("⚠️ Token JWT no disponible para obtener servicios");
                    return Json(new { success = false, message = "Sesión expirada. Recargue la página." });
                }

                // Limpiar headers anteriores y configurar autorización
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                // Construir URL con parámetros seguros
                var baseUrl = _configuration["ApiSettings:BaseUrl"] ?? "https://localhost:7273";
                var url = $"{baseUrl}/api/Servicios?busqueda={Uri.EscapeDataString(busqueda ?? "")}&tipoServicio={Uri.EscapeDataString(tipoServicio ?? "")}&soloActivos={soloActivos}&pagina={pagina}&tamano={tamano}";
                
                _logger.LogInformation("🔧 Llamando a API: {Url}", url);
                
                var response = await _httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📋 Respuesta de API: {Content}", content);
                    
                    var resultado = JsonConvert.DeserializeObject<dynamic>(content);
                    
                    _logger.LogInformation("✅ Servicios obtenidos exitosamente");
                    
                    // Retornar directamente el array de servicios para DataTables
                    return Json(resultado);
                }
                else
                {
                    _logger.LogWarning("⚠️ Error en API al obtener servicios: {StatusCode}", response.StatusCode);
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("⚠️ Contenido del error: {ErrorContent}", errorContent);
                    return Json(new { success = false, message = "Error al obtener servicios de la API" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicios");
                return Json(new { success = false, message = "Error interno al obtener servicios" });
            }
        }

        /// <summary>
        /// Obtiene un servicio específico por ID
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerServicioPorId(int id)
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Servicios"))
                {
                    return Json(new { success = false, message = "No tiene permisos para ver servicios" });
                }

                var token = ObtenerTokenJWT();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var baseUrl = _configuration["ApiSettings:BaseUrl"] ?? "https://localhost:7273";
                var response = await _httpClient.GetAsync($"{baseUrl}/api/Servicios/{id}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var servicio = JsonConvert.DeserializeObject(content);
                    
                    return Json(new { success = true, data = servicio });
                }
                else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return Json(new { success = false, message = "Servicio no encontrado" });
                }
                else
                {
                    return Json(new { success = false, message = "Error al obtener el servicio" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicio {ServicioId}", id);
                return Json(new { success = false, message = "Error interno" });
            }
        }

        /// <summary>
        /// Crea un nuevo servicio
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearServicio([FromBody] ServicioDTO servicioDto)
        {
            try
            {
                if (!await this.TienePermisoAsync("Editar Servicios"))
                {
                    return Json(new { success = false, message = "No tiene permisos para crear servicios" });
                }

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        );
                    
                    return Json(new { success = false, message = "Datos de validación incorrectos", errors = errores });
                }

                var token = ObtenerTokenJWT();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var json = JsonConvert.SerializeObject(servicioDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var baseUrl = _configuration["ApiSettings:BaseUrl"] ?? "https://localhost:7273";
                var response = await _httpClient.PostAsync($"{baseUrl}/api/Servicios", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Servicio creado: {Nombre}", servicioDto.NombreServicio);
                    return Json(new { success = true, message = "Servicio creado exitosamente" });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("⚠️ Error al crear servicio: {Error}", errorContent);
                    
                    var errorData = JsonConvert.DeserializeObject<dynamic>(errorContent);
                    return Json(new { success = false, message = errorData?.message?.ToString() ?? "Error al crear servicio" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear servicio");
                return Json(new { success = false, message = "Error interno al crear servicio" });
            }
        }

        /// <summary>
        /// Actualiza un servicio existente
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> ActualizarServicio(int id, [FromBody] ServicioDTO servicioDto)
        {
            try
            {
                if (!await this.TienePermisoAsync("Editar Servicios"))
                {
                    return Json(new { success = false, message = "No tiene permisos para editar servicios" });
                }

                var token = ObtenerTokenJWT();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var json = JsonConvert.SerializeObject(servicioDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var baseUrl = _configuration["ApiSettings:BaseUrl"] ?? "https://localhost:7273";
                var response = await _httpClient.PutAsync($"{baseUrl}/api/Servicios/{id}", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ Servicio actualizado: {Id}", id);
                    return Json(new { success = true, message = "Servicio actualizado exitosamente" });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("⚠️ Error al actualizar servicio: {Error}", errorContent);
                    
                    var errorData = JsonConvert.DeserializeObject<dynamic>(errorContent);
                    return Json(new { success = false, message = errorData?.message?.ToString() ?? "Error al actualizar servicio" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar servicio {Id}", id);
                return Json(new { success = false, message = "Error interno al actualizar servicio" });
            }
        }

        /// <summary>
        /// Elimina (desactiva) un servicio
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> EliminarServicio(int id)
        {
            try
            {
                if (!await this.TienePermisoAsync("Editar Servicios"))
                {
                    return Json(new { success = false, message = "No tiene permisos para eliminar servicios" });
                }

                var token = ObtenerTokenJWT();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var baseUrl = _configuration["ApiSettings:BaseUrl"] ?? "https://localhost:7273";
                var response = await _httpClient.DeleteAsync($"{baseUrl}/api/Servicios/{id}");

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("🗑️ Servicio eliminado: {Id}", id);
                    return Json(new { success = true, message = "Servicio desactivado exitosamente" });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    var errorData = JsonConvert.DeserializeObject<dynamic>(errorContent);
                    return Json(new { success = false, message = errorData?.message?.ToString() ?? "Error al eliminar servicio" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al eliminar servicio {Id}", id);
                return Json(new { success = false, message = "Error interno al eliminar servicio" });
            }
        }

        /// <summary>
        /// Obtiene tipos de servicios disponibles
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerTiposServicios()
        {
            try
            {
                var token = ObtenerTokenJWT();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var baseUrl = _configuration["ApiSettings:BaseUrl"] ?? "https://localhost:7273";
                var response = await _httpClient.GetAsync($"{baseUrl}/api/Servicios/tipos");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var tipos = JsonConvert.DeserializeObject(content);
                    
                    return Json(new { success = true, data = tipos });
                }
                else
                {
                    return Json(new { success = false, data = new string[] { } });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener tipos de servicios");
                return Json(new { success = false, data = new string[] { } });
            }
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        private string? ObtenerTokenJWT()
        {
            var token = User.FindFirst("JwtToken")?.Value;

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");

                // Listar todos los claims disponibles para debug
                var claims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
                _logger.LogWarning("📋 Claims disponibles: {Claims}", string.Join(", ", claims));
            }
            else
            {
                _logger.LogInformation("✅ Token JWT obtenido correctamente para usuario: {Usuario}, Longitud: {Length}",
                    User.Identity?.Name ?? "Anónimo", token.Length);
            }

            return token;
        }
    }
}