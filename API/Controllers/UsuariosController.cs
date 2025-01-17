using API.Data;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using tuco.Clases.Models;
using tuco.Utilities;
using Tuco.Clases.DTOs;
using Tuco.Clases.Enums;
using Tuco.Clases.Helpers;
using Tuco.Clases.Models;
using Tuco.Clases.Models.Password;
using Tuco.Clases.Utilities;
using static System.Net.WebRequestMethods;


[ApiController]
[Route("api/[controller]")]
// Habilitar CORS para este controlador
[EnableCors("AllowAll")]
public class UsuariosController : ControllerBase
{
    private readonly TucoContext _context;
    private readonly EmailService _emailService;
    private HttpClient _httpClient;


    public UsuariosController(TucoContext context, EmailService emailService, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _emailService = emailService; // Inyectar EmailService
        _httpClient = httpClientFactory.CreateClient("TucoApi");
    }


    #region Registro de Usuarios
    /// <summary>
    /// Endpoint para registrar un nuevo usuario en el sistema.
    /// </summary>
    /// <param name="request">Datos del usuario a registrar.</param>
    /// <returns>Confirmación del registro o mensaje de error.</returns>
    //[Authorize(Roles = "Admin")]
    [HttpPost("registrar-usuario")]
    public async Task<IActionResult> RegistrarUsuario([FromBody] RegistroUsuarioRequestDTO request)
    {
        try
        {
            // Validar si el email ya está registrado
            var existeUsuario = await _context.Usuarios.AnyAsync(u => u.Email == request.Email);
            if (existeUsuario)
            {
                // Registrar historial de error por intento de registro fallido
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient, // Cliente HTTP inicializado
                    usuarioId: 0, // No hay usuario creado todavía
                    tipoAccion: "Registro",
                    modulo: "Usuarios",
                    detalle: $"Intento de registro fallido. Email: {request.Email} ya está registrado.",
                    estadoAccion: "Error",
                    errorDetalle: "El email ya está registrado."
                );

                return BadRequest(new { Message = "El email ya está registrado." });
            }

            // Crear un token único para activación usando el método centralizado
            var tokenActivacion = TokenHelper.GenerarToken();

            // Crear una nueva instancia del usuario
            var usuario = new Usuario

            {
                NombreUsuario = request.NombreUsuario,
                Email = request.Email,
                Contrasena = HashContrasena.HashearContrasena(Guid.NewGuid().ToString()), // Contraseña temporal hasheada
                FechaCreacion = DateTime.Now,
                Activo = false, // Cuenta desactivada por defecto
                Token = tokenActivacion, // Asignar el token de activación
                PropositoToken = PropositoTokenEnum.ActivarCuenta, // Usar Enum para propósito del token
                FechaExpiracionToken = DateTime.Now.AddMinutes(30) // Expiración del token
            };

            // Guardar el nuevo usuario en la base de datos
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            // Registrar historial de registro exitoso
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId, // ID del usuario recién creado
                tipoAccion: "Registro",
                modulo: "Usuarios",
                detalle: $"Usuario registrado exitosamente. Email: {usuario.Email}",
                token: tokenActivacion,
                propositoToken: PropositoTokenEnum.ActivarCuenta.ToString()
            );

            // Generar enlace de activación con el enlace de ngrok
            // Generar enlace de activación con la ruta esperada por el Razor Component
            var activationUrl = $"https://789f-186-26-118-107.ngrok-free.app/cambiar-contrasena/{tokenActivacion}";

            // Contenido del correo
            var subject = "Activa tu cuenta";
            var htmlContent = $@"
            <p>Haz clic en el siguiente enlace para activar tu cuenta y cambiar tu contraseña:</p>
            <a href='{activationUrl}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Activar Cuenta</a>
            ";

            // Enviar el correo de activación
            await _emailService.EnviarCorreoAsync(usuario.Email, subject, htmlContent);

            return Ok(new { Message = "Usuario registrado exitosamente. Revisa tu correo para activar la cuenta." });
        }
        catch (Exception ex)
        {
            // Registrar historial de error en caso de excepción
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0, // No hay usuario creado
                tipoAccion: "Registro",
                modulo: "Usuarios",
                detalle: "Error al registrar usuario.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = $"Error al registrar usuario: {ex.Message}" });
        }
    }
    #endregion

    #region Endpoint para listar todos los usuarios
    [HttpGet("usuarios")]
    public async Task<IActionResult> ObtenerUsuarios()
    {
        // Consulta a la base de datos para obtener todos los usuarios con sus roles
        var usuarios = await _context.Usuarios
            .Select(u => new
            {
                u.UsuarioId,
                u.NombreUsuario,
                u.Email,
                u.Activo,
                Roles = u.UsuarioRoles
                        .Select(ur => ur.Rol.NombreRol)
                        .ToList()
            })
            .ToListAsync();

        return Ok(usuarios);
    }
    #endregion

    #region Cambio de Contraseña
    [HttpPost("CambiarContrasena")]
    public async Task<IActionResult> CambiarContraseña(CambiarContraseñaRequest request)
    {
        try
        {
            // Buscar al usuario por el token y el propósito
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Token == request.Token && u.PropositoToken == PropositoTokenEnum.CambioContrasena);

            if (usuario == null)
            {
                // Registrar intento fallido en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 0,
                    tipoAccion: "Cambio de Contraseña",
                    modulo: "Usuarios",
                    detalle: $"Intento fallido de cambio de contraseña. Token inválido o propósito incorrecto.",
                    token: request.Token,
                    propositoToken: PropositoTokenEnum.CambioContrasena.ToString(),
                    estadoAccion: "Error",
                    errorDetalle: "Token inválido o propósito incorrecto."
                );

                return BadRequest(new { message = "Token inválido o propósito incorrecto." });
            }

            // Validar que el usuario esté activo
            if (usuario.Activo != true)
            {
                // Registrar historial de usuario inactivo
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: usuario.UsuarioId,
                    tipoAccion: "Cambio de Contraseña",
                    modulo: "Usuarios",
                    detalle: "Intento de cambio de contraseña fallido. Usuario inactivo.",
                    estadoAccion: "Error",
                    errorDetalle: "El usuario está inactivo."
                );

                return BadRequest(new { message = "El usuario está inactivo. No se puede realizar esta acción." });
            }

            // Validar la expiración del token
            if (usuario.FechaExpiracionToken.HasValue && usuario.FechaExpiracionToken.Value < DateTime.Now)
            {
                // Registrar historial de token expirado
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: usuario.UsuarioId,
                    tipoAccion: "Cambio de Contraseña",
                    modulo: "Usuarios",
                    detalle: "Intento de cambio de contraseña fallido. Token expirado.",
                    token: request.Token,
                    propositoToken: PropositoTokenEnum.CambioContrasena.ToString(),
                    estadoAccion: "Error",
                    errorDetalle: "El token ha expirado."
                );

                return BadRequest(new { message = "El token ha expirado." });
            }

            // Hashear la nueva contraseña utilizando BCrypt
            usuario.Contrasena = HashContrasena.HashearContrasena(request.NuevaContrasena);

            // Invalidar el token después de su uso
            usuario.Token = null;
            usuario.PropositoToken = null;
            usuario.FechaExpiracionToken = null;

            // Guardar los cambios
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            // Registrar historial de cambio exitoso
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Cambio de Contraseña",
                modulo: "Usuarios",
                detalle: $"El usuario {usuario.Email} cambió su contraseña exitosamente.",
                estadoAccion: "Exito"
            );

            return Ok(new { message = "Contraseña cambiada exitosamente." });
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0,
                tipoAccion: "Cambio de Contraseña",
                modulo: "Usuarios",
                detalle: "Error al intentar cambiar la contraseña.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Obtener Roles de Usuario
    /// <summary>
    /// Endpoint para obtener los roles de un usuario.
    /// </summary>
    /// <param name="id">ID del usuario.</param>
    /// <returns>Lista de roles del usuario.</returns>
    [HttpGet("usuarios/{id}/roles")]
    public async Task<IActionResult> ObtenerRolesUsuario(int id)
    {
        try
        {
            // Obtener los roles disponibles y los asignados al usuario
            var rolesDisponibles = await _context.Roles.ToListAsync();
            var rolesUsuario = await _context.UsuarioRoles
                .Where(ur => ur.UsuarioId == id)
                .Select(ur => ur.RolId)
                .ToListAsync();

            var rolesInfo = rolesDisponibles.Select(rol => new
            {
                rolId = rol.RolId,
                nombreRol = rol.NombreRol,
                asignado = rolesUsuario.Contains(rol.RolId)
            });

            return Ok(rolesInfo);
        }
        catch (Exception ex)
        {
            // Registrar error en historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Consulta de Roles",
                modulo: "Usuarios",
                detalle: "Error al obtener roles del usuario",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = "Error al obtener roles" });
        }
    }
    #endregion

    #region Asignar Roles a Usuario
    /// <summary>
    /// Endpoint para asignar roles a un usuario.
    /// </summary>
    /// <param name="id">ID del usuario.</param>
    /// <param name="rolesIds">Lista de IDs de roles a asignar.</param>
    /// <returns>Confirmación de la asignación de roles o mensaje de error.</returns>
    [HttpPost("usuarios/{id}/roles")]
    public async Task<IActionResult> AsignarRoles(int id, [FromBody] List<int> rolesIds)
    {
        try
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return NotFound(new { Message = "Usuario no encontrado" });

            // Eliminar roles actuales
            var rolesActuales = await _context.UsuarioRoles
                .Where(ur => ur.UsuarioId == id)
                .ToListAsync();
            _context.UsuarioRoles.RemoveRange(rolesActuales);

            // Asignar nuevos roles
            foreach (var rolId in rolesIds)
            {
                _context.UsuarioRoles.Add(new UsuarioRolRE
                {
                    UsuarioId = id,
                    RolId = rolId
                });
            }

            await _context.SaveChangesAsync();

            // Registrar en historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Actualización de Roles",
                modulo: "Usuarios",
                detalle: $"Se actualizaron los roles del usuario. Roles asignados: {string.Join(", ", rolesIds)}",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Roles actualizados exitosamente" });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Actualización de Roles",
                modulo: "Usuarios",
                detalle: "Error al actualizar roles",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = "Error al actualizar roles" });
        }
    }
    #endregion

    #region Activar Usuario
    /// <summary>
    /// Endpoint para activar un usuario.
    /// </summary>
    /// <param name="id">ID del usuario.</param>
    /// <returns>Confirmación de la activación o mensaje de error.</returns>
    [HttpPost("usuarios/{id}/activar")]
    public async Task<IActionResult> ActivarUsuario(int id)
    {
        try
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return NotFound(new { Message = "Usuario no encontrado" });

            usuario.Activo = true;
            await _context.SaveChangesAsync();

            // Registrar en historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Activación de Usuario",
                modulo: "Usuarios",
                detalle: "Usuario activado exitosamente",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Usuario activado exitosamente" });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Activación de Usuario",
                modulo: "Usuarios",
                detalle: "Error al activar usuario",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = "Error al activar usuario" });
        }
    }
    #endregion

    #region Desactivar Usuario
    /// <summary>
    /// Endpoint para desactivar un usuario.
    /// </summary>
    /// <param name="id">ID del usuario.</param>
    /// <returns>Confirmación de la desactivación o mensaje de error.</returns>
    [HttpPost("usuarios/{id}/desactivar")]
    public async Task<IActionResult> DesactivarUsuario(int id)
    {
        try
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return NotFound(new { Message = "Usuario no encontrado" });

            usuario.Activo = false;
            await _context.SaveChangesAsync();

            // Registrar en historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Desactivación de Usuario",
                modulo: "Usuarios",
                detalle: "Usuario desactivado exitosamente",
                estadoAccion: "Éxito"
            );

            return Ok(new { Message = "Usuario desactivado exitosamente" });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: id,
                tipoAccion: "Desactivación de Usuario",
                modulo: "Usuarios",
                detalle: "Error al desactivar usuario",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { Message = "Error al desactivar usuario" });
        }
    }
    #endregion
}
