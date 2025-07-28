using API.Data;
using API.ServicesAPI;
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
    private readonly ILogger<UsuariosController> _logger;
    private readonly IConfiguration _configuration;
    private readonly API.ServicesAPI.Interfaces.IPermisosService _permisosService;

    public UsuariosController(TucoContext context, EmailService emailService, IHttpClientFactory httpClientFactory, ILogger<UsuariosController> logger, IConfiguration configuration,
        API.ServicesAPI.Interfaces.IPermisosService permisosService)
    {
        _context = context;
        _emailService = emailService; // Inyectar EmailService
        _httpClient = httpClientFactory.CreateClient("TucoApi");
        _logger = logger;
        _configuration = configuration;
        _permisosService = permisosService;
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
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 0,
                    tipoAccion: "Registro",
                    modulo: "Usuarios",
                    detalle: $"Intento de registro fallido. Email: {request.Email} ya está registrado.",
                    estadoAccion: "Error",
                    errorDetalle: "El email ya está registrado."
                );

                return BadRequest(new { Message = "El email ya está registrado." });
            }

            // Crear token de activación
            var tokenActivacion = TokenHelper.GenerarToken();

            // Crear usuario
            var usuario = new Usuario
            {
                NombreUsuario = request.NombreUsuario,
                Email = request.Email,
                Contrasena = HashContrasena.HashearContrasena(Guid.NewGuid().ToString()), // Contraseña temporal
                FechaCreacion = DateTime.Now,
                Activo = false,
                Token = tokenActivacion,
                PropositoToken = PropositoTokenEnum.ActivarCuenta,
                FechaExpiracionToken = DateTime.Now.AddHours(24) // Para 24 horas            };
            };

            // Agregar usuario y rol en una transacción
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Guardar usuario
                    _context.Usuarios.Add(usuario);
                    await _context.SaveChangesAsync();

                    // Asociar rol al usuario
                    var usuarioRol = new UsuarioRolRE
                    {
                        UsuarioId = usuario.UsuarioId,
                        RolId = request.RolId
                    };

                    _context.UsuarioRoles.Add(usuarioRol);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }

            // Enviar correo de activación
            // En el endpoint RegistrarUsuario de la API
            var activationUrl = $"{_configuration["WebAppSettings:BaseUrl"]}/Activacion/ActivarCuenta/{tokenActivacion}";
            var subject = "Activa tu cuenta";
            var logoUrl = $"{_configuration["WebAppSettings:BaseUrl"]}/images/logo.png";
            var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background-color: #007bff;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px 5px 0 0;
                    }}
                    .content {{
                        background-color: #fff;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 0 0 5px 5px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 20px;
                        color: #666;
                        font-size: 0.9em;
                    }}
                </style>
            </head>
            <body>
                <div class='header'>
                    <img src='{logoUrl}' alt='Logo TUCO' class='logo'/>
                    <h1>Multiservicios TUCO</h1>
                </div>
                <div class='content'>
                    <h2>¡Gracias por registrarte!</h2>
                    <p>Para comenzar a usar tu cuenta, necesitas activarla haciendo clic en el siguiente botón:</p>
                    <div style='text-align: center;'>
                        <a href='{activationUrl}' class='button'>Activar mi cuenta</a>
                    </div>
                    <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style='word-break: break-all; color: #666;'>{activationUrl}</p>
                    <p><strong>Este enlace expirará en 24 horas por razones de seguridad.</strong></p>
                </div>
                <div class='footer'>
                    <p>Mensaje enviado automáticamente por el sistema Multiservicios TUCO.</p>
                    <p>Por favor, no responda a este correo electrónico.</p>
                </div>
            </body>   
            </html>";
            await _emailService.EnviarCorreoAsync(usuario.Email, subject, htmlContent);

            // Registrar en historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Registro",
                modulo: "Usuarios",
                detalle: $"Usuario registrado exitosamente. Email: {usuario.Email}",
                token: tokenActivacion,
                propositoToken: PropositoTokenEnum.ActivarCuenta.ToString()
            );

            return Ok(new { Message = "Usuario registrado exitosamente. Revisa tu correo para activar la cuenta." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar usuario");
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

    //#region Cambio de Contraseña
    //[HttpPost("CambiarContrasena")]
    //public async Task<IActionResult> CambiarContraseña(CambiarContraseñaRequest request)
    //{
    //    try
    //    {
    //        // Buscar al usuario por el token y el propósito
    //        var usuario = await _context.Usuarios
    //            .FirstOrDefaultAsync(u => u.Token == request.Token && u.PropositoToken == PropositoTokenEnum.CambioContrasena);

    //        if (usuario == null)
    //        {
    //            // Registrar intento fallido en el historial
    //            await HistorialHelper.RegistrarHistorial(
    //                httpClient: _httpClient,
    //                usuarioId: 0,
    //                tipoAccion: "Cambio de Contraseña",
    //                modulo: "Usuarios",
    //                detalle: $"Intento fallido de cambio de contraseña. Token inválido o propósito incorrecto.",
    //                token: request.Token,
    //                propositoToken: PropositoTokenEnum.CambioContrasena.ToString(),
    //                estadoAccion: "Error",
    //                errorDetalle: "Token inválido o propósito incorrecto."
    //            );

    //            return BadRequest(new { message = "Token inválido o propósito incorrecto." });
    //        }

    //        // Validar que el usuario esté activo
    //        if (usuario.Activo != true)
    //        {
    //            // Registrar historial de usuario inactivo
    //            await HistorialHelper.RegistrarHistorial(
    //                httpClient: _httpClient,
    //                usuarioId: usuario.UsuarioId,
    //                tipoAccion: "Cambio de Contraseña",
    //                modulo: "Usuarios",
    //                detalle: "Intento de cambio de contraseña fallido. Usuario inactivo.",
    //                estadoAccion: "Error",
    //                errorDetalle: "El usuario está inactivo."
    //            );

    //            return BadRequest(new { message = "El usuario está inactivo. No se puede realizar esta acción." });
    //        }

    //        // Validar la expiración del token
    //        if (usuario.FechaExpiracionToken.HasValue && usuario.FechaExpiracionToken.Value < DateTime.Now)
    //        {
    //            // Registrar historial de token expirado
    //            await HistorialHelper.RegistrarHistorial(
    //                httpClient: _httpClient,
    //                usuarioId: usuario.UsuarioId,
    //                tipoAccion: "Cambio de Contraseña",
    //                modulo: "Usuarios",
    //                detalle: "Intento de cambio de contraseña fallido. Token expirado.",
    //                token: request.Token,
    //                propositoToken: PropositoTokenEnum.CambioContrasena.ToString(),
    //                estadoAccion: "Error",
    //                errorDetalle: "El token ha expirado."
    //            );

    //            return BadRequest(new { message = "El token ha expirado." });
    //        }

    //        // Hashear la nueva contraseña utilizando BCrypt
    //        usuario.Contrasena = HashContrasena.HashearContrasena(request.NuevaContrasena);

    //        // Invalidar el token después de su uso
    //        usuario.Token = null;
    //        usuario.PropositoToken = null;
    //        usuario.FechaExpiracionToken = null;

    //        // Guardar los cambios
    //        _context.Usuarios.Update(usuario);
    //        await _context.SaveChangesAsync();

    //        // Registrar historial de cambio exitoso
    //        await HistorialHelper.RegistrarHistorial(
    //            httpClient: _httpClient,
    //            usuarioId: usuario.UsuarioId,
    //            tipoAccion: "Cambio de Contraseña",
    //            modulo: "Usuarios",
    //            detalle: $"El usuario {usuario.Email} cambió su contraseña exitosamente.",
    //            estadoAccion: "Exito"
    //        );

    //        return Ok(new { message = "Contraseña cambiada exitosamente." });
    //    }
    //    catch (Exception ex)
    //    {
    //        // Registrar error en el historial
    //        await HistorialHelper.RegistrarHistorial(
    //            httpClient: _httpClient,
    //            usuarioId: 0,
    //            tipoAccion: "Cambio de Contraseña",
    //            modulo: "Usuarios",
    //            detalle: "Error al intentar cambiar la contraseña.",
    //            estadoAccion: "Error",
    //            errorDetalle: ex.Message
    //        );

    //        return StatusCode(500, new { message = $"Ocurrió un error: {ex.Message}" });
    //    }
    //}
    //#endregion

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
                descripcionRol = rol.DescripcionRol, // Añadimos la descripción del rol
                asignado = rolesUsuario.Contains(rol.RolId)
            });

            return Ok(new { roles = rolesInfo }); // Envolvemos en un objeto con propiedad 'roles'
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