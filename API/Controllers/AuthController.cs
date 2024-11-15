using API.Data;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs;
using Tuco.API.Models.Requests;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;



[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    TucoContext _context;
    IConfiguration _configuration;



    public AuthController(TucoContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration; 
    }

    /// <summary>
    /// Endpoint para activar la cuenta de un usuario.
    /// Valida el token de activación y permite al usuario configurar su contraseña.
    /// </summary>
    /// <param name="token">Token único enviado al correo del usuario.</param>
    /// <param name="request">Contiene la nueva contraseña enviada por el usuario.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    /// 

    [HttpPost("activar-cuenta")]
    public async Task<IActionResult> ActivarCuenta([FromQuery] string token, [FromBody] ActivacionRequest request)
    {
        // Busca al usuario en la base de datos utilizando el token proporcionado
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Token == token);

        // Verifica si el token es válido o si la cuenta ya está activada
        if (usuario == null || (usuario.Activo ?? false))
        {
            return BadRequest(new { Message = "Token inválido o cuenta ya activada." });
        }

        // Hashea la nueva contraseña proporcionada por el usuario
        usuario.Contraseña = HashPassword(request.NuevaContraseña);

        // Marca la cuenta como activada
        usuario.Activo = true;

        // Limpia el token de activación para evitar su reutilización
        usuario.Token = null;

        // Guarda los cambios en la base de datos
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Cuenta activada con éxito." });
    }

    /// <summary>
    /// Método auxiliar para hashear contraseñas usando BCrypt.
    /// </summary>
    /// <param name="password">La contraseña en texto plano proporcionada por el usuario.</param>
    /// <returns>La contraseña hasheada.</returns>
    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// Endpoint para autenticar a los usuarios.
    /// Verifica las credenciales y genera un token JWT para la sesión.
    /// </summary>
    /// <param name="request">Contiene el email y la contraseña del usuario.</param>
    /// <returns>Token JWT en caso de éxito o un mensaje de error.</returns>
    /// 
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
    {
        // Busca al usuario por correo electrónico
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Contraseña, usuario.Contraseña))
        {
            // Devuelve un error si el usuario no existe o la contraseña no es válida
            return Unauthorized(new { Message = "Credenciales inválidas." });
        }

        if (usuario.Activo == false)
        {
            // Devuelve un error si la cuenta no está activa
            return Unauthorized(new { Message = "La cuenta no está activa. Por favor, activa tu cuenta." });
        }

        // Generar el token JWT para la sesión
        var token = GenerarToken(usuario);

        return Ok(new
        {
            Message = "Login exitoso.",
            Token = token
        });
    }

    /// <summary>
    /// Endpoint protegido que requiere un token JWT.
    /// </summary>
    /// <returns>Mensaje de éxito si el usuario está autenticado.</returns>
    [HttpGet("protegido")]
    [Authorize]
    public IActionResult Protegido()
    {
        return Ok(new { Message = "Has accedido a un endpoint protegido." });
    }


    /// <summary>
    /// Genera un token JWT para un usuario autenticado.
    /// </summary>
    /// <param name="usuario">Información del usuario.</param>
    /// <returns>Token JWT.</returns>
    private string GenerarToken(Usuario usuario)
    {
        // Obtener los roles del usuario
        var roles = _context.UsuarioRoles
            .Where(ur => ur.UsuarioId == usuario.UsuarioId)
            .Select(ur => ur.Rol.NombreRol) // Asegúrate de que la relación con la tabla Roles está configurada
            .ToList();

        // Obtener los permisos del rol del usuario
        var permisosRol = _context.RolPermiso
            .Where(rp => roles.Any(r => rp.Rol.NombreRol == r))
            .Select(rp => rp.Permiso.NombrePermiso)
            .ToList();

        // Obtener los permisos específicos del usuario
        var permisosUsuario = _context.UsuarioPermisos
            .Where(up => up.UsuarioID == usuario.UsuarioId)
            .Select(up => up.Permiso.NombrePermiso)
            .ToList();

        // Combinar permisos de rol y permisos personalizados
        var permisosTotales = permisosRol.Union(permisosUsuario).Distinct();

        // Crear los claims del token
        var claims = new List<Claim>
    {
        new Claim(ClaimTypes.Name, usuario.NombreUsuario),
        new Claim(ClaimTypes.Email, usuario.Email)
    };

        // Agregar roles y permisos como claims
        claims.AddRange(roles.Select(rol => new Claim(ClaimTypes.Role, rol)));
        claims.AddRange(permisosTotales.Select(permiso => new Claim("Permission", permiso)));

        // Generar el token JWT
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiryMinutes"])),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }









}

