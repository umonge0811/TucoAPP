using API.Data;
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

    public UsuariosController(TucoContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Endpoint para registrar un nuevo usuario en el sistema.
    /// </summary>
    /// <param name="request">Datos del usuario a registrar.</param>
    /// <returns>Confirmación del registro o mensaje de error.</returns>
    [Authorize(Roles = "Admin")]
    [HttpPost("registrar-usuario")]
    public async Task<IActionResult> RegistrarUsuario([FromBody] RegistroUsuarioRequestDTO request)
    {
        // Validar si el email ya está registrado
        var existeUsuario = await _context.Usuarios.AnyAsync(u => u.Email == request.Email);
        if (existeUsuario)
        {
            return BadRequest(new { Message = "El email ya está registrado." });
        }

        // Crear una nueva instancia del usuario
        var usuario = new Usuario
        {
            NombreUsuario = request.NombreUsuario,
            Email = request.Email,
            Contraseña = BCrypt.Net.BCrypt.HashPassword(request.Contraseña), // Hashear la contraseña
            FechaCreacion = DateTime.Now,
            Activo = request.Activo ?? true, // Por defecto, usuario activo
            Token = null // Se puede generar un token para validaciones futuras
        };

        // Guardar el nuevo usuario en la base de datos
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Usuario registrado exitosamente." });
    }

    

    private void EnviarEmailActivacion(string email, string token)
    {
        string activationLink = $"https://tu-dominio.com/activar-cuenta?token={token}";
        // Lógica para enviar email (usa un servicio de email como SendGrid)
        Console.WriteLine($"Enviar este enlace al correo: {activationLink}");
    }

    

}
