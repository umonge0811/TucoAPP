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
using Tuco.Clases.Enums;
using Tuco.Clases.Helpers;
using System.Net.Http;
using tuco.Utilities;



[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    TucoContext _context;
    IConfiguration _configuration;
    HttpClient _httpClient;



    public AuthController(TucoContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient("TucoApi");
    }

    /// <summary>
    /// Endpoint para activar la cuenta de un usuario.
    /// Valida el token de activación y permite al usuario configurar su contraseña.
    /// </summary>
    /// <param name="token">Token único enviado al correo del usuario.</param>
    /// <param name="request">Contiene la nueva contraseña enviada por el usuario.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    /// 

    [AllowAnonymous]
    [HttpGet("activar-cuenta")]
    public async Task<IActionResult> ActivarCuenta(string token)
    {
        try
        {
            // Buscar el usuario por el token y el propósito
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Token == token && u.PropositoToken == PropositoTokenEnum.ActivarCuenta);

            if (usuario == null)
            {
                // Registrar intento fallido de activación en el historial
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 0, // No podemos identificar el usuario en este caso
                    tipoAccion: "Activación",
                    modulo: "Usuarios",
                    detalle: "Intento de activación fallido. Token no válido o propósito incorrecto.",
                    token: token,
                    propositoToken: PropositoTokenEnum.ActivarCuenta.ToString(),
                    estadoAccion: "Error",
                    errorDetalle: "Token inválido o propósito incorrecto."
                );

                return BadRequest(new { message = "Token inválido o propósito incorrecto." });
            }

            // Validar la expiración del token
            if (usuario.FechaExpiracionToken.HasValue && usuario.FechaExpiracionToken.Value < DateTime.Now)
            {
                // Registrar intento fallido de activación por token expirado
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: usuario.UsuarioId,
                    tipoAccion: "Activación",
                    modulo: "Usuarios",
                    detalle: "Intento de activación fallido. Token expirado.",
                    token: token,
                    propositoToken: PropositoTokenEnum.ActivarCuenta.ToString(),
                    estadoAccion: "Error",
                    errorDetalle: "El token ha expirado."
                );

                return BadRequest(new { message = "El token ha expirado." });
            }

            // Activar el usuario
            usuario.Activo = true;

            // Generar un nuevo token para el cambio de contraseña
            var tokenCambio = TokenHelper.GenerarToken();
            usuario.Token = tokenCambio;
            usuario.PropositoToken = PropositoTokenEnum.CambioContrasena;
            usuario.FechaExpiracionToken = DateTime.Now.AddMinutes(30); // Token válido por 30 minutos

            // Guardar los cambios en la base de datos
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            // Registrar activación exitosa en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Activación",
                modulo: "Usuarios",
                detalle: "Usuario activado exitosamente.",
                token: tokenCambio,
                propositoToken: PropositoTokenEnum.CambioContrasena.ToString()
            );

            // Redirigir a la página de cambio de contraseña
            var cambiarContrasenaUrl = $"https://9e3b-186-64-223-105.ngrok-free.app/cambiar-contrasena?token={tokenCambio}";
            return Redirect(cambiarContrasenaUrl);
        }
        catch (Exception ex)
        {
            // Registrar error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0, // No podemos identificar el usuario en este caso
                tipoAccion: "Activación",
                modulo: "Usuarios",
                detalle: "Error al intentar activar usuario.",
                token: token,
                propositoToken: PropositoTokenEnum.ActivarCuenta.ToString(),
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { message = $"Ocurrió un error: {ex.Message}" });
        }
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

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Contrasena, usuario.Contrasena))
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
        var permisosRol = _context.RolPermisos
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

