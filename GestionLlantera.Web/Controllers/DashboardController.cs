using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using tuco.Clases.DTOs; // Agregada esta directiva using
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.Extensions.Logging; // Asegurarse de que ILogger esté disponible
using System.Linq; // Necesario para FirstOrDefault

namespace GestionLlantera.Web.Controllers
{
    // Este atributo asegura que solo usuarios autenticados puedan acceder
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ILogger<DashboardController> _logger;
        private readonly IDashboardService _dashboardService;
        // Se asume que tienes un servicio para gestionar anuncios
        private readonly IAnunciosService _anunciosService;

        public DashboardController(ILogger<DashboardController> logger, IDashboardService dashboardService, IAnunciosService anunciosService)
        {
            _logger = logger;
            _dashboardService = dashboardService;
            _anunciosService = anunciosService; // Inicializar el servicio de anuncios
        }

        public IActionResult Index()
        {
            // Especificamos que use el layout administrativo
            ViewData["Layout"] = "_AdminLayout";
            return View();
        }

        /// <summary>
        /// Método auxiliar para obtener el token JWT del usuario autenticado
        /// </summary>
        /// <returns>El token JWT o null si no se encuentra</returns>
        private string? ObtenerTokenJWT()
        {
            // Intentar diferentes métodos para obtener el token, igual que otros controladores
            var token = User.FindFirst("jwt_token")?.Value;

            if (string.IsNullOrEmpty(token))
            {
                token = User.FindFirst("JwtToken")?.Value;
            }

            if (string.IsNullOrEmpty(token))
            {
                token = User.FindFirst("access_token")?.Value;
            }

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en los claims del usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
                _logger.LogDebug("📋 Claims disponibles: {Claims}",
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            }
            else
            {
                _logger.LogDebug("✅ Token JWT obtenido correctamente para usuario: {Usuario}",
                    User.Identity?.Name ?? "Anónimo");
            }

            return token;
        }


        [HttpGet]
        public async Task<IActionResult> ObtenerAlertasStock()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo alertas de stock para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerAlertasStockAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo alertas: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Alertas de stock obtenidas correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo alertas de stock");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerInventarioTotal()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo estadísticas de inventario total para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerInventarioTotalAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo inventario total: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Estadísticas de inventario total obtenidas correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo estadísticas de inventario total");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTopVendedor()
        {
            try
            {
                _logger.LogInformation("📊 Obteniendo top vendedor para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerTopVendedorAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo top vendedor: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Top vendedor obtenido correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo top vendedor");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerUsuariosConectados()
        {
            try
            {
                _logger.LogInformation("👥 Obteniendo usuarios conectados para dashboard");

                // ✅ OBTENER TOKEN JWT
                var token = ObtenerTokenJWT();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Token JWT no encontrado para Dashboard");
                    return Json(new { success = false, message = "Sesión expirada. Por favor, inicie sesión nuevamente." });
                }

                var resultado = await _dashboardService.ObtenerUsuariosConectadosAsync(token);

                if (!resultado.success)
                {
                    _logger.LogError("❌ Error obteniendo usuarios conectados: {Mensaje}", resultado.mensaje);
                    return Json(new { success = false, message = resultado.mensaje });
                }

                _logger.LogInformation("✅ Usuarios conectados obtenidos correctamente");
                return Json(new { success = true, data = resultado.data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error crítico obteniendo usuarios conectados");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        // Métodos para la gestión de Anuncios

        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncios()
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncios desde el servicio...");
                var jwtToken = GetJwtToken();
                var resultado = await _anunciosService.ObtenerAnunciosAsync(jwtToken);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncios obtenidos exitosamente. Total: {Count}", resultado.anuncios.Count);
                    return Ok(new { success = true, data = resultado.anuncios });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudieron obtener los anuncios: {Message}", resultado.mensaje);
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo anuncios");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAnuncioPorId(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Obteniendo anuncio {AnuncioId} desde el servicio...", id);
                var jwtToken = GetJwtToken();
                // Implementación temporal - necesitarás agregar este método a IAnunciosService para obtener un solo anuncio por ID
                var resultado = await _anunciosService.ObtenerAnunciosAsync(jwtToken); // Se llama a ObtenerAnunciosAsync como placeholder

                if (resultado.success)
                {
                    var anuncio = resultado.anuncios.FirstOrDefault(a => a.AnuncioId == id);
                    if (anuncio != null)
                    {
                        _logger.LogInformation("✅ Anuncio {AnuncioId} obtenido exitosamente: {Titulo}", id, anuncio.Titulo);
                        return Ok(new { success = true, data = anuncio });
                    }
                    _logger.LogWarning("⚠️ Anuncio {AnuncioId} no encontrado.", id);
                    return NotFound(new { success = false, message = "Anuncio no encontrado" });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudieron obtener los anuncios para buscar el ID {AnuncioId}: {Message}", id, resultado.mensaje);
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearAnuncio([FromBody] CrearAnuncioDTO request)
        {
            try
            {
                _logger.LogInformation("🔔 Creando nuevo anuncio - Datos recibidos: {@Request}", request);
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    _logger.LogWarning("⚠️ ModelState inválido al crear anuncio: {Errors}", string.Join(", ", errors));
                    return BadRequest(new { success = false, message = "Datos de entrada inválidos: " + string.Join(", ", errors) });
                }

                var jwtToken = GetJwtToken();
                var resultado = await _anunciosService.CrearAnuncioAsync(request, jwtToken);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncio creado exitosamente: {Titulo}", resultado.anuncio?.Titulo);
                    return Ok(new { success = true, data = resultado.anuncio, message = resultado.mensaje });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo crear el anuncio: {Message}", resultado.mensaje);
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando anuncio");
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpPut]
        public async Task<IActionResult> ActualizarAnuncio(int id, [FromBody] ActualizarAnuncioDTO request)
        {
            try
            {
                _logger.LogInformation("🔔 Actualizando anuncio {AnuncioId}", id);
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    _logger.LogWarning("⚠️ ModelState inválido al actualizar anuncio {AnuncioId}: {Errors}", id, string.Join(", ", errors));
                    return BadRequest(new { success = false, message = "Datos de entrada inválidos: " + string.Join(", ", errors) });
                }

                var jwtToken = GetJwtToken();
                var resultado = await _anunciosService.ActualizarAnuncioAsync(request, id, jwtToken);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncio {AnuncioId} actualizado exitosamente", id);
                    return Ok(new { success = true, data = resultado.anuncio, message = resultado.mensaje });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo actualizar el anuncio {AnuncioId}: {Message}", id, resultado.mensaje);
                    return BadRequest(new { success = false, message = resultado.mensaje });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> EliminarAnuncio(int id)
        {
            try
            {
                _logger.LogInformation("🔔 Eliminando anuncio {AnuncioId}", id);
                var jwtToken = GetJwtToken();
                var currentUserId = GetCurrentUserId(); // Asumiendo que GetCurrentUserId está implementado y es seguro llamarlo
                var resultado = await _anunciosService.EliminarAnuncioAsync(id, currentUserId, jwtToken);

                if (resultado.success)
                {
                    _logger.LogInformation("✅ Anuncio {AnuncioId} eliminado exitosamente", id);
                    return Ok(new { success = true, message = resultado.message });
                }
                else
                {
                    _logger.LogWarning("⚠️ No se pudo eliminar el anuncio {AnuncioId}: {Message}", id, resultado.message);
                    return BadRequest(new { success = false, message = resultado.message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando anuncio {AnuncioId}", id);
                return StatusCode(500, new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtiene el nombre de usuario actual.
        /// </summary>
        /// <returns>El nombre de usuario o "Usuario" si no se puede determinar.</returns>
        private string GetUserName()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "Usuario";
        }

        /// <summary>
        /// Obtiene el token JWT del usuario autenticado. Busca en cookies y encabezados.
        /// </summary>
        /// <returns>El token JWT o una cadena vacía si no se encuentra.</returns>
        private string GetJwtToken()
        {
            // Prioridad: Cookies, luego encabezado Authorization
            var token = Request.Cookies["jwt"]; // Intentar obtener de las cookies primero

            if (string.IsNullOrEmpty(token))
            {
                token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", ""); // Luego del encabezado Authorization
            }

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ Token JWT no encontrado en cookies ni en encabezado Authorization.");
            }
            else
            {
                _logger.LogDebug("✅ Token JWT obtenido.");
            }

            return token ?? string.Empty; // Devolver cadena vacía si el token es nulo
        }

        /// <summary>
        /// Obtiene el ID del usuario actual a partir de los claims del token.
        /// </summary>
        /// <returns>El ID del usuario.</returns>
        /// <exception cref="UnauthorizedAccessException">Se lanza si el ID del usuario no se puede obtener.</exception>
        private int GetCurrentUserId()
        {
            // Buscar el ID del usuario en varios claims comunes
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                             User.FindFirst("UserId")?.Value ??
                             User.FindFirst("sub")?.Value; // 'sub' es común en JWT

            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogError("❌ No se encontró el claim del ID de usuario en el token.");
                throw new UnauthorizedAccessException("No se pudo obtener el ID del usuario.");
            }

            if (int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogDebug("✅ ID de usuario obtenido: {UserId}", userId);
                return userId;
            }
            else
            {
                _logger.LogError("❌ El claim del ID de usuario no es un entero válido: {UserIdClaim}", userIdClaim);
                throw new FormatException($"El ID de usuario '{userIdClaim}' no tiene un formato numérico válido.");
            }
        }
    }
}