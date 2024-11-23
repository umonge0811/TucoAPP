using API.Data;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;

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
        var tokenActivacion = Guid.NewGuid().ToString();

        // Crear una nueva instancia del usuario
        var usuario = new Usuario
        {
            NombreUsuario = request.NombreUsuario,
            Email = request.Email,
            Contraseña = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Contraseña temporal hasheada
            FechaCreacion = DateTime.Now,
            Activo = false, // Cuenta desactivada por defecto
            Token = tokenActivacion // Asignar el token de activación
        };

        // Guardar el nuevo usuario en la base de datos
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        // Generar enlace de activación
        var activationUrl = $"https://localhost:7273/cambiar-contrasena?token={tokenActivacion}";


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









}
