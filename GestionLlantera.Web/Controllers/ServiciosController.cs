using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;
using Tuco.Clases.DTOs;
using System.Text.Json;
using Microsoft.AspNetCore.Http; // Agregado para HttpContext.Session

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class ServiciosController : Controller
    {
        private readonly ILogger<ServiciosController> _logger;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IServiciosService _serviciosService;


        public ServiciosController(
            ILogger<ServiciosController> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IServiciosService serviciosService)
        {
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient("ApiClient");
            _configuration = configuration;
            _serviciosService = serviciosService;
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
                    _logger.LogWarning("🚫 Usuario sin permiso 'Ver Servicios' al intentar obtener servicios.");
                    return Json(new { success = false, message = "No tiene permisos para ver servicios" });
                }

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para obtener servicios");
                    return Json(new { success = false, message = "Sesión expirada. Inicie sesión nuevamente." });
                }

                _logger.LogInformation("🔧 Solicitud para obtener servicios: Busqueda='{Busqueda}', TipoServicio='{TipoServicio}', SoloActivos={SoloActivos}, Pagina={Pagina}, Tamano={Tamano}",
                    busqueda, tipoServicio, soloActivos, pagina, tamano);

                // Pasar los parámetros directamente al servicio
                var servicios = await _serviciosService.ObtenerServiciosAsync(busqueda, tipoServicio, soloActivos, pagina, tamano);

                if (servicios != null)
                {
                    return Json(servicios); // Retornar directamente el objeto de respuesta del servicio
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudieron obtener servicios o la respuesta fue nula.");
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
                     _logger.LogWarning("🚫 Usuario sin permiso 'Ver Servicios' al intentar obtener servicio {Id}.", id);
                    return Json(new { success = false, message = "No tiene permisos para ver servicios" });
                }

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para obtener servicio {Id}", id);
                    return Json(new { success = false, message = "Sesión expirada. Inicie sesión nuevamente." });
                }

                _logger.LogInformation("🔧 Solicitud para obtener servicio por ID: {Id}", id);
                var servicio = await _serviciosService.ObtenerServicioPorIdAsync(id);

                if (servicio != null)
                {
                    _logger.LogInformation("✅ Servicio {Id} obtenido exitosamente.", id);
                    return Json(new { success = true, data = servicio });
                }
                else
                {
                    _logger.LogWarning("⚠️ Servicio con ID {Id} no encontrado.", id);
                    return Json(new { success = false, message = "Servicio no encontrado" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener servicio {Id}", id);
                return Json(new { success = false, message = "Error interno al obtener servicio" });
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
                    _logger.LogWarning("🚫 Usuario sin permiso 'Editar Servicios' al intentar crear servicio.");
                    return Json(new { success = false, message = "No tiene permisos para crear servicios" });
                }

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para crear servicio");
                    return Json(new { success = false, message = "Sesión expirada. Inicie sesión nuevamente." });
                }

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        );
                    _logger.LogWarning("⚠️ Datos de validación incorrectos para crear servicio: {Errors}", JsonConvert.SerializeObject(errores));
                    return Json(new { success = false, message = "Datos de validación incorrectos", errors = errores });
                }

                _logger.LogInformation("🔧 Solicitud para crear servicio: Nombre='{NombreServicio}'", servicioDto.NombreServicio);
                var resultado = await _serviciosService.CrearServicioAsync(servicioDto);

                if (resultado)
                {
                    _logger.LogInformation("✅ Servicio creado exitosamente: {NombreServicio}", servicioDto.NombreServicio);
                    return Json(new { success = true, message = "Servicio creado exitosamente" });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error al crear servicio en el servicio: {NombreServicio}", servicioDto.NombreServicio);
                    return Json(new { success = false, message = "Error al crear servicio" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al crear servicio {NombreServicio}", servicioDto.NombreServicio);
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
                    _logger.LogWarning("🚫 Usuario sin permiso 'Editar Servicios' al intentar actualizar servicio {Id}.", id);
                    return Json(new { success = false, message = "No tiene permisos para editar servicios" });
                }

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para actualizar servicio {Id}", id);
                    return Json(new { success = false, message = "Sesión expirada. Inicie sesión nuevamente." });
                }

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        );
                    _logger.LogWarning("⚠️ Datos de validación incorrectos para actualizar servicio {Id}: {Errors}", id, JsonConvert.SerializeObject(errores));
                    return Json(new { success = false, message = "Datos de validación incorrectos", errors = errores });
                }

                _logger.LogInformation("🔧 Solicitud para actualizar servicio {Id}: Nombre='{NombreServicio}'", id, servicioDto.NombreServicio);
                var resultado = await _serviciosService.ActualizarServicioAsync(id, servicioDto);

                if (resultado)
                {
                    _logger.LogInformation("✅ Servicio {Id} actualizado exitosamente.", id);
                    return Json(new { success = true, message = "Servicio actualizado exitosamente" });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error al actualizar servicio {Id} en el servicio.", id);
                    return Json(new { success = false, message = "Error al actualizar servicio" });
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
                    _logger.LogWarning("🚫 Usuario sin permiso 'Editar Servicios' al intentar eliminar servicio {Id}.", id);
                    return Json(new { success = false, message = "No tiene permisos para eliminar servicios" });
                }

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para eliminar servicio {Id}", id);
                    return Json(new { success = false, message = "Sesión expirada. Inicie sesión nuevamente." });
                }

                _logger.LogInformation("🔧 Solicitud para eliminar servicio {Id}", id);
                var resultado = await _serviciosService.EliminarServicioAsync(id);

                if (resultado)
                {
                    _logger.LogInformation("✅ Servicio {Id} eliminado exitosamente.", id);
                    return Json(new { success = true, message = "Servicio desactivado exitosamente" });
                }
                else
                {
                    _logger.LogWarning("⚠️ Error al eliminar servicio {Id} en el servicio.", id);
                    return Json(new { success = false, message = "Error al eliminar servicio" });
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
                 if (!await this.TienePermisoAsync("Ver Servicios"))
                {
                    _logger.LogWarning("🚫 Usuario sin permiso 'Ver Servicios' al intentar obtener tipos de servicios.");
                    return Json(new { success = false, message = "No tiene permisos para ver tipos de servicios" });
                }

                // Obtener token JWT del usuario autenticado
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para obtener tipos de servicios");
                    return Json(new { success = false, message = "Sesión expirada. Inicie sesión nuevamente." });
                }

                _logger.LogInformation("🔧 Solicitud para obtener tipos de servicios");
                var tipos = await _serviciosService.ObtenerTiposServiciosAsync();

                if (tipos != null)
                {
                    _logger.LogInformation("✅ Tipos de servicios obtenidos exitosamente. Total: {Count}", tipos.Count());
                    return Json(new { success = true, data = tipos });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudieron obtener tipos de servicios o la respuesta fue nula.");
                    return Json(new { success = false, message = "Error al obtener tipos de servicios" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener tipos de servicios");
                return Json(new { success = false, message = "Error al obtener tipos de servicios" });
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
            }
            else
            {
                _logger.LogDebug("✅ Token JWT obtenido correctamente para usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }

            return token;
        }
    }
}