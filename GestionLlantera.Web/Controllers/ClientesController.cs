using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Controllers
{
    [Authorize]
    public class ClientesController : Controller
    {
        private readonly ILogger<ClientesController> _logger;
        private readonly IClientesService _clientesService;

        public ClientesController(
            ILogger<ClientesController> logger,
            IClientesService clientesService)
        {
            _logger = logger;
            _clientesService = clientesService;
        }

        /// <summary>
        /// Vista principal de clientes
        /// </summary>
        public async Task<IActionResult> Index()
        {
            try
            {
                // Verificar permisos
                if (!await this.TienePermisoAsync("Ver Clientes"))
                {
                    _logger.LogWarning("🚫 Usuario sin permiso 'Ver Clientes' intentó acceder al módulo de clientes");
                    TempData["AccesoNoAutorizado"] = "Ver Clientes";
                    TempData["ModuloAcceso"] = "Clientes";
                    return RedirectToAction("AccessDenied", "Account");
                }

                // Cargar clientes para mostrar en la vista (como en inventario)
                var jwtToken = this.ObtenerTokenJWT();
                var clientes = await _clientesService.ObtenerTodosAsync(jwtToken);

                // Transformar datos para la vista usando ClienteDTO
                var clientesViewModel = clientes.Select(c => new Tuco.Clases.DTOs.ClienteDTO
                {
                    ClienteId = c.ClienteId,
                    NombreCliente = c.NombreCliente,
                    Contacto = c.Contacto ?? "",
                    Email = c.Email ?? "",
                    Telefono = c.Telefono ?? "",
                    Direccion = c.Direccion ?? "",
                    UsuarioId = c.UsuarioId
                }).ToList();

                ViewData["Title"] = "Gestión de Clientes";
                return View(clientesViewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en vista de clientes");
                return View("Error");
            }
        }

        /// <summary>
        /// API para obtener clientes (AJAX)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerClientes()
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Clientes"))
                {
                    return Json(new { success = false, message = "Sin permisos para consultar clientes" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clientes = await _clientesService.ObtenerTodosAsync(jwtToken);

                var resultado = clientes.Select(c => new {
                    id = c.ClienteId,
                    nombre = c.NombreCliente,
                    contacto = c.Contacto ?? "",
                    email = c.Email ?? "",
                    telefono = c.Telefono ?? "",
                    direccion = c.Direccion ?? ""
                }).ToList();

                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener clientes");
                return Json(new { success = false, message = "Error al obtener clientes" });
            }
        }

        /// <summary>
        /// API para buscar clientes (AJAX)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> BuscarClientes(string termino = "")
        {
            try
            {
                // Permitir búsqueda si tiene permisos de ver clientes O de ver facturación (para el módulo de ventas)
                if (!await this.TienePermisoAsync("Ver Clientes") && !await this.TienePermisoAsync("Ver Facturación"))
                {
                    return Json(new { success = false, message = "Sin permisos para buscar clientes" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clientes = await _clientesService.BuscarClientesAsync(termino, jwtToken);

                var resultado = clientes.Take(20).Select(c => new {
                    id = c.ClienteId,
                    nombre = c.NombreCliente,
                    email = c.Email ?? "",
                    telefono = c.Telefono ?? "",
                    contacto = c.Contacto ?? "",
                    identificacion = c.Contacto ?? "",
                    direccion = c.Direccion ?? ""
                }).ToList();

                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar clientes");
                return Json(new { success = false, message = "Error al buscar clientes" });
            }
        }

        /// <summary>
        /// API para obtener un cliente por ID (AJAX)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ObtenerClientePorId(int id)
        {
            try
            {
                if (!await this.TienePermisoAsync("Ver Clientes"))
                {
                    return Json(new { success = false, message = "Sin permisos para consultar cliente" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var cliente = await _clientesService.ObtenerPorIdAsync(id, jwtToken);

                if (cliente == null || cliente.ClienteId == 0)
                {
                    return Json(new { success = false, message = "Cliente no encontrado" });
                }

                var resultado = new {
                    id = cliente.ClienteId,
                    nombre = cliente.NombreCliente,
                    contacto = cliente.Contacto ?? "",
                    email = cliente.Email ?? "",
                    telefono = cliente.Telefono ?? "",
                    direccion = cliente.Direccion ?? ""
                };

                return Json(new { success = true, data = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener cliente {Id}", id);
                return Json(new { success = false, message = "Error al obtener cliente" });
            }
        }

        /// <summary>
        /// API para crear cliente (AJAX)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CrearCliente([FromBody] Cliente cliente)
        {
            try
            {
                // Permitir crear clientes si tiene el permiso específico O si tiene permiso de facturación (para ventas)
                if (!await this.TienePermisoAsync("Crear Clientes") && !await this.TienePermisoAsync("Ver Facturación"))
                {
                    return Json(new { success = false, message = "Sin permisos para crear clientes" });
                }

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());
                    return Json(new { success = false, message = "Error de validación", errores });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clienteCreado = await _clientesService.CrearClienteAsync(cliente, jwtToken);

                if (clienteCreado)
                {
                    return Json(new { 
                        success = true, 
                        message = "Cliente creado exitosamente",
                        clienteId = cliente.ClienteId
                    });
                }

                return Json(new { success = false, message = "Error al crear cliente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear cliente");
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API para actualizar cliente (AJAX)
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> ActualizarCliente(int id, [FromBody] Cliente cliente)
        {
            try
            {
                if (!await this.TienePermisoAsync("Editar Clientes"))
                {
                    return Json(new { success = false, message = "Sin permisos para editar clientes" });
                }

                if (id != cliente.ClienteId)
                {
                    return Json(new { success = false, message = "ID del cliente no coincide" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clienteActualizado = await _clientesService.ActualizarClienteAsync(id, cliente, jwtToken);

                if (clienteActualizado)
                {
                    return Json(new { 
                        success = true, 
                        message = "Cliente actualizado exitosamente"
                    });
                }

                return Json(new { success = false, message = "Error al actualizar cliente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar cliente {Id}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// API para eliminar cliente (AJAX)
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> EliminarCliente(int id)
        {
            try
            {
                if (!await this.TienePermisoAsync("Eliminar Clientes"))
                {
                    return Json(new { success = false, message = "Sin permisos para eliminar clientes" });
                }

                var jwtToken = this.ObtenerTokenJWT();
                var clienteEliminado = await _clientesService.EliminarClienteAsync(id, jwtToken);

                if (clienteEliminado)
                {
                    return Json(new { 
                        success = true, 
                        message = "Cliente eliminado exitosamente"
                    });
                }

                return Json(new { success = false, message = "Error al eliminar cliente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar cliente {Id}", id);
                return Json(new { success = false, message = "Error interno del servidor" });
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

            return token;
        }
    }
}