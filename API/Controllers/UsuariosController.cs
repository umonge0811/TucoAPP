using API.Data;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;
using Tuco.Clases.Enums;
using Tuco.Clases.Models.Password;


[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly TucoContext _context;
    private readonly EmailService _emailService;


    public UsuariosController(TucoContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService; // Inyectar EmailService
    }

    private string GenerarToken()
    {
        return Guid.NewGuid().ToString();
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
        // Validar si el email ya está registrado
        var existeUsuario = await _context.Usuarios.AnyAsync(u => u.Email == request.Email);
        if (existeUsuario)
        {
            return BadRequest(new { Message = "El email ya está registrado." });
        }

        // Crear un token único para activación
        var tokenActivacion = GenerarToken(); // Llamada al método en lugar de Guid.NewGuid().ToString()


        // Crear una nueva instancia del usuario
        var usuario = new Usuario
        {
            NombreUsuario = request.NombreUsuario,
            Email = request.Email,
            Contrasena = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Contraseña temporal hasheada
            FechaCreacion = DateTime.Now,
            Activo = false, // Cuenta desactivada por defecto
            Token = tokenActivacion // Asignar el token de activación
        };

        // Guardar el nuevo usuario en la base de datos
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        // Generar enlace de activación con el enlace de ngrok
        var activationUrl = $"https://9e3b-186-64-223-105.ngrok-free.app/cambiar-contrasena?token={tokenActivacion}";
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

    private string HashearContraseña(string contraseña)
    {
        return BCrypt.Net.BCrypt.HashPassword(contraseña);
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
            usuario.Contrasena = BCrypt.Net.BCrypt.HashPassword(request.NuevaContrasena);

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
