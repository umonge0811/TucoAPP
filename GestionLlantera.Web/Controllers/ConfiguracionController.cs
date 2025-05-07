// Controllers/ConfiguracionController.cs

// Importaciones necesarias para el controlador
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Services.Interfaces;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;

// Controlador que maneja la configuración del sistema, incluyendo roles y permisos
[Authorize] // Asegura que solo usuarios autenticados puedan acceder a este controlador
public class ConfiguracionController : Controller
{
    // Declaración de servicios y logger que se usarán en el controlador
    private readonly IRolesService _rolesService;        // Servicio para gestionar roles
    private readonly ILogger<ConfiguracionController> _logger;  // Logger para registro de eventos

    // Constructor que recibe las dependencias necesarias mediante inyección
    public ConfiguracionController(
        IRolesService rolesService,
        ILogger<ConfiguracionController> logger)
    {
        // Inicialización de las dependencias
        _rolesService = rolesService;
        _logger = logger;
    }

    // Método que renderiza la vista principal de gestión de roles y permisos
    public async Task<IActionResult> RolesPermisos()
    {
        try
        {
            // Registramos el inicio de la carga de la vista
            _logger.LogInformation("Iniciando carga de la vista de roles y permisos");

            // Obtenemos todos los roles del sistema
            var roles = await _rolesService.ObtenerTodosLosRoles();

            // Registramos el éxito de la operación
            _logger.LogInformation("Vista de roles y permisos cargada exitosamente. Roles obtenidos: {Count}", roles.Count);

            // Retornamos la vista con los roles como modelo
            return View(roles);
        }
        catch (Exception ex)
        {
            // Registramos cualquier error que ocurra
            _logger.LogError(ex, "Error al cargar la vista de roles y permisos");

            // Añadimos un mensaje de error para mostrar al usuario
            TempData["Error"] = "Error al cargar la información de roles y permisos";

            // Retornamos la vista con una lista vacía para evitar errores
            return View(new List<RoleDTO>());
        }
    }

    // Endpoint API para obtener todos los roles del sistema
    [HttpGet]
    public async Task<IActionResult> ObtenerRoles()
    {
        try
        {
            var roles = await _rolesService.ObtenerTodosLosRoles();

            // Agregar log para verificar los datos
            _logger.LogInformation("Roles obtenidos: {Count}", roles.Count);
            foreach (var rol in roles)
            {
                _logger.LogInformation("Rol: {NombreRol}, Permisos: {NumPermisos}",
                    rol.NombreRol,
                    rol.Permisos?.Count ?? 0);
            }

            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener roles");
            return StatusCode(500, new { message = "Error al obtener roles" });
        }
    }

    // Endpoint API para obtener todos los permisos disponibles
    [HttpGet]
    public async Task<IActionResult> ObtenerPermisos()
    {
        try
        {
            // Registramos la solicitud de obtención de permisos
            _logger.LogInformation("Procesando solicitud de obtención de permisos");

            // Obtenemos los permisos mediante el servicio
            var permisos = await _rolesService.ObtenerTodosLosPermisos();

            // Registramos el éxito de la operación
            _logger.LogInformation("Permisos obtenidos exitosamente. Total: {Count}", permisos.Count);

            // Retornamos los permisos en formato JSON
            return Ok(permisos);
        }
        catch (Exception ex)
        {
            // Registramos el error detalladamente
            _logger.LogError(ex, "Error al procesar la solicitud de obtención de permisos");

            // Retornamos un error 500 con mensaje para el cliente
            return StatusCode(500, new { message = "Error al obtener permisos" });
        }
    }

    // Endpoint API para obtener un rol específico por su ID
    [HttpGet]
    public async Task<IActionResult> ObtenerRol(int id)
    {
        try
        {
            // Registramos la solicitud de obtención de rol específico
            _logger.LogInformation("Procesando solicitud de obtención de rol. ID: {Id}", id);

            // Obtenemos el rol mediante el servicio
            var rol = await _rolesService.ObtenerRolPorId(id);

            // Verificamos si se encontró el rol
            if (rol == null)
            {
                _logger.LogWarning("Rol no encontrado. ID: {Id}", id);
                return NotFound(new { message = "Rol no encontrado" });
            }

            // Registramos el éxito de la operación
            _logger.LogInformation("Rol obtenido exitosamente. ID: {Id}", id);

            // Retornamos el rol en formato JSON
            return Ok(rol);
        }
        catch (Exception ex)
        {
            // Registramos el error detalladamente
            _logger.LogError(ex, "Error al obtener rol. ID: {Id}", id);

            // Retornamos un error 500 con mensaje para el cliente
            return StatusCode(500, new { message = "Error al obtener rol" });
        }
    }

    // Endpoint API para crear un nuevo rol en el sistema
    [HttpPost("CrearRol")]
    public async Task<IActionResult> CrearRol([FromBody] RoleDTO rolDTO)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultado = await _rolesService.CrearRol(rolDTO);
            return Ok(new { message = "Rol creado exitosamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear rol");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // Endpoint API para actualizar un rol existente
    [HttpPut("ActualizarRol/{id}")]
    public async Task<IActionResult> ActualizarRol(int id, [FromBody] RoleDTO rolDTO)
    {
        try
        {
            var resultado = await _rolesService.ActualizarRol(id, rolDTO);
            return Ok(new { message = "Rol actualizado exitosamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar rol");
            return StatusCode(500, new { message = "Error al actualizar el rol" });
        }
    }

    // Endpoint API para eliminar un rol del sistema
    [HttpDelete]
    public async Task<IActionResult> EliminarRol(int id)
    {
        try
        {
            // Registramos el intento de eliminación
            _logger.LogInformation("Intentando eliminar rol. ID: {Id}", id);

            // Llamamos al servicio para eliminar el rol
            var resultado = await _rolesService.EliminarRol(id);

            // Verificamos el resultado de la operación
            if (resultado)
            {
                // Registramos el éxito de la operación
                _logger.LogInformation("Rol eliminado exitosamente. ID: {Id}", id);
                return Ok(new { message = "Rol eliminado exitosamente" });
            }

            // Si no se pudo eliminar, retornamos un error
            return BadRequest(new { message = "No se pudo eliminar el rol" });
        }
        catch (Exception ex)
        {
            // Registramos cualquier error no esperado
            _logger.LogError(ex, "Error al eliminar rol. ID: {Id}", id);
            return StatusCode(500, new { message = "Error al eliminar el rol" });
        }

    }

    // Endpoint API para asignar permisos a un rol específico
    [HttpPost]
    public async Task<IActionResult> AsignarPermisosARol(int rolId, [FromBody] List<int> permisoIds)
    {
        try
        {
            // Validamos que la lista de permisos no sea nula o vacía
            if (permisoIds == null || !permisoIds.Any())
            {
                // Registramos la validación fallida
                _logger.LogWarning("Intento de asignar lista vacía de permisos al rol {RolId}", rolId);
                return BadRequest(new { message = "Debe proporcionar al menos un permiso" });
            }

            // Registramos el intento de asignación de permisos
            _logger.LogInformation(
                "Intentando asignar {Count} permisos al rol {RolId}",
                permisoIds.Count,
                rolId
            );

            // Llamamos al servicio para asignar los permisos
            var resultado = await _rolesService.AsignarPermisosARol(rolId, permisoIds);

            // Verificamos el resultado de la operación
            if (resultado)
            {
                // Registramos el éxito de la operación
                _logger.LogInformation(
                    "Permisos asignados exitosamente al rol {RolId}. Total permisos: {Count}",
                    rolId,
                    permisoIds.Count
                );
                return Ok(new { message = "Permisos asignados exitosamente" });
            }

            // Si no se pudieron asignar los permisos, retornamos un error
            return BadRequest(new { message = "No se pudieron asignar los permisos" });
        }
        catch (Exception ex)
        {
            // Registramos cualquier error no esperado
            _logger.LogError(ex, "Error al asignar permisos al rol {RolId}", rolId);
            return StatusCode(500, new { message = "Error al asignar permisos" });
        }
    }

    // Endpoint API para actualizar los permisos existentes de un rol
    [HttpPut]
    public async Task<IActionResult> ActualizarPermisosDeRol(int rolId, [FromBody] List<int> permisoIds)
    {
        try
        {
            // Validamos que la lista de permisos no sea nula
            if (permisoIds == null)
            {
                // Registramos la validación fallida
                _logger.LogWarning("Lista de permisos nula al actualizar rol {RolId}", rolId);
                return BadRequest(new { message = "La lista de permisos no puede ser nula" });
            }

            // Registramos el intento de actualización de permisos
            _logger.LogInformation(
                "Intentando actualizar permisos del rol {RolId}. Nuevos permisos: {Count}",
                rolId,
                permisoIds.Count
            );

            // Llamamos al servicio para actualizar los permisos
            var resultado = await _rolesService.ActualizarPermisosDeRol(rolId, permisoIds);

            // Verificamos el resultado de la operación
            if (resultado)
            {
                // Registramos el éxito de la operación
                _logger.LogInformation(
                    "Permisos actualizados exitosamente para el rol {RolId}. Total permisos: {Count}",
                rolId,
                    permisoIds.Count
                );
                return Ok(new { message = "Permisos actualizados exitosamente" });
            }

            // Si no se pudieron actualizar los permisos, retornamos un error
            return BadRequest(new { message = "No se pudieron actualizar los permisos" });
        }
        catch (Exception ex)
        {
            // Registramos cualquier error no esperado
            _logger.LogError(ex, "Error al actualizar permisos del rol {RolId}", rolId);
            return StatusCode(500, new { message = "Error al actualizar los permisos" });
        }
    }

    // Endpoint API para obtener los permisos de un rol específico
    [HttpGet]
    public async Task<IActionResult> ObtenerPermisosDeRol(int rolId)
    {
        try
        {
            // Registramos la solicitud de obtención de permisos
            _logger.LogInformation("Obteniendo permisos del rol {RolId}", rolId);

            // Llamamos al servicio para obtener los permisos del rol
            var permisos = await _rolesService.ObtenerPermisosDeRol(rolId);

            // Registramos el éxito de la operación
            _logger.LogInformation(
                "Permisos obtenidos exitosamente para el rol {RolId}. Total: {Count}",
                rolId,
                permisos.Count
            );

            // Retornamos la lista de permisos
            return Ok(permisos);
        }
        catch (Exception ex)
        {
            // Registramos cualquier error no esperado
            _logger.LogError(ex, "Error al obtener permisos del rol {RolId}", rolId);
            return StatusCode(500, new { message = "Error al obtener los permisos del rol" });
        }
    }


}