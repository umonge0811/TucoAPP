using API.Data;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using tuco.Clases.Models;
using tuco.Utilities;
using Tuco.Clases.DTOs;
using Tuco.Clases.Enums;
using Tuco.Clases.Helpers;
using Tuco.Clases.Models.Password;
using Tuco.Clases.Utilities;
using static System.Net.WebRequestMethods;


[ApiController]
[Route("api/[controller]")]
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
            var activationUrl = $"https://5565-186-26-118-106.ngrok-free.app/cambiar-contrasena/{tokenActivacion}";

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


    // Endpoint para listar todos los usuarios
    [HttpGet("usuarios")]
    public async Task<IActionResult> ObtenerUsuarios()
    {
        // Consulta a la base de datos para obtener todos los usuarios
        var usuarios = await _context.Usuarios
            .Select(u => new
            {
                u.NombreUsuario, // Nombre del usuario
                u.Email,         // Correo del usuario
                u.Activo         // Estado de activación del usuario
            })
            .ToListAsync();

        // Retornar la lista de usuarios como una respuesta exitosa
        return Ok(usuarios);
    }



    [HttpPost("CambiarContrasena")]
    public async Task<IActionResult> CambiarContraseña(CambiarContraseñaRequest request)
    {
        try
        {
            // Buscar al usuario por el token y el propósito (ahora comparando con el enumerador)
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Token == request.Token && u.PropositoToken == PropositoTokenEnum.CambioContrasena);

            if (usuario == null)
            {
                return BadRequest(new { message = "Token inválido o propósito incorrecto." });
            }

            // Validar que el usuario esté activo
            if (usuario.Activo != true) // Cambiamos el chequeo para mayor claridad
            {
                return BadRequest(new { message = "El usuario está inactivo. No se puede realizar esta acción." });
            }

            // Validar la expiración del token
            if (usuario.FechaExpiracionToken.HasValue && usuario.FechaExpiracionToken.Value < DateTime.Now)
            {
                return BadRequest(new { message = "El token ha expirado." });
            }

            // Hashear la nueva contraseña utilizando BCrypt
            usuario.Contrasena = HashContrasena.HashearContrasena(request.NuevaContrasena);

            // Invalidar el token después de su uso
            usuario.Token = null;
            usuario.PropositoToken = null; // Invalidamos el propósito
            usuario.FechaExpiracionToken = null; // Limpiamos la fecha de expiración

            // Guardar los cambios
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Contraseña cambiada exitosamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Ocurrió un error: {ex.Message}" });
        }
    }
}
