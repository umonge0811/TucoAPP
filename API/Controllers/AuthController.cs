using API.Data;
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
using API.ServicesAPI;
using Tuco.Clases.Models.Password;
using Tuco.Clases.Utilities;



[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    TucoContext _context;
    IConfiguration _configuration;
    HttpClient _httpClient;
    private readonly EmailService _emailService;
    private readonly ILogger<AuthController> _logger;




    public AuthController(TucoContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory, EmailService emailService, ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService; // Inyectar EmailService
        _httpClient = httpClientFactory.CreateClient("TucoApi");
        _logger = logger;
    }

    /// <summary>
    /// Endpoint para activar la cuenta de un usuario.
    /// Valida el token de activación y permite al usuario configurar su contraseña.
    /// </summary>
    /// <param name="token">Token único enviado al correo del usuario.</param>
    /// <param name="request">Contiene la nueva contraseña enviada por el usuario.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    /// 

    #region Activacion de Cuenta

    [AllowAnonymous]
    [HttpGet("activar-cuenta")]
    public async Task<IActionResult> ActivarCuenta(string token)
    {
        try
        {

             var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Token == token.Trim('"') &&
                                    u.PropositoToken == PropositoTokenEnum.ActivarCuenta);


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
                propositoToken: PropositoTokenEnum.CambioContrasena.ToString()
            );

            // Modificar el final del método ActivarCuenta
            return Ok(new
            {
                message = "Cuenta activada exitosamente.",
                token = usuario.Token

            });
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

    [AllowAnonymous]
    [HttpGet("check-usuario-activo")]
    public async Task<IActionResult> CheckUsuarioActivo(string token)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Token == token);
        if (usuario == null) return NotFound();

        // Validar expiración
        var tokenExpirado = usuario.FechaExpiracionToken.HasValue &&
                           usuario.FechaExpiracionToken.Value < DateTime.Now;

        return Ok(new
        {
            active = usuario.Activo,
            expired = tokenExpirado
        });
    }
    #endregion

    #region Login
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

        // ✅ REGISTRAR SESIÓN EN LA BASE DE DATOS
        try
        {
            // Generar hash del token para almacenamiento seguro
            var tokenHash = BCrypt.Net.BCrypt.HashString(token.Substring(token.Length - 20)); // Usamos los últimos 20 caracteres

            var sesion = new SesionUsuario
            {
                UsuarioId = usuario.UsuarioId,
                FechaHoraInicio = DateTime.Now,
                TokenHash = tokenHash,
                EstaActiva = true,
                FechaInvalidacion = null
            };

            _context.SesionUsuario.Add(sesion);
            await _context.SaveChangesAsync();

            _logger?.LogInformation($"✅ Sesión registrada para usuario {usuario.Email} (ID: {usuario.UsuarioId})");
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, $"❌ Error registrando sesión para usuario {usuario.Email}");
            // No fallar el login por esto, solo registrar el error
        }

        return Ok(new
        {
            Message = "Login exitoso.",
            Token = token
        });
    }

    #endregion    

    #region Generar Token
    /// <summary>
    /// Genera un token JWT para un usuario autenticado.
    /// </summary>
    /// <param name="usuario">Información del usuario.</param>
    /// <returns>Token JWT.</returns>
    private string GenerarToken(Usuario usuario)
    {
        try
        {
            // Obtener los roles del usuario (maneja caso vacío)
            var roles = _context.UsuarioRoles
                .Where(ur => ur.UsuarioId == usuario.UsuarioId)
                .Select(ur => ur.Rol.NombreRol)
                .ToList() ?? new List<string>();

            // Obtener los permisos del rol del usuario (maneja caso vacío)
            var permisosRol = _context.RolPermisos
                .Where(rp => roles.Any(r => rp.Rol.NombreRol == r))
                .Select(rp => rp.Permiso.NombrePermiso)
                .ToList() ?? new List<string>();

            // Obtener los permisos específicos del usuario (maneja caso vacío)
            var permisosUsuario = _context.UsuarioPermiso
                .Where(up => up.UsuarioID == usuario.UsuarioId)
                .Select(up => up.Permiso.NombrePermiso)
                .ToList() ?? new List<string>();

            // Combinar permisos de rol y permisos personalizados (maneja caso vacío)
            var permisosTotales = permisosRol.Union(permisosUsuario).Distinct();

            // Crear los claims del token (sin roles ni permisos si están vacíos)
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, usuario.NombreUsuario),
            new Claim(ClaimTypes.Email, usuario.Email),
             // ✅ AGREGAR EL ID DEL USUARIO
            new Claim(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
            new Claim("userId", usuario.UsuarioId.ToString()) // Claim personalizado también
        };

            // Agregar roles y permisos solo si existen
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
        catch (Exception ex)
        {
            // Log del error (puedes usar un servicio de logging o simplemente registrarlo en consola)
            Console.WriteLine($"Error al generar el token: {ex.Message}");

            // Puedes lanzar una excepción específica si lo deseas
            throw new Exception("Hubo un error al generar el token. Por favor, revisa los detalles del error.", ex);
        }
    }
    #endregion

    #region Regenerar Token
    /// <summary>
    /// Endpoint para regenerar un token de activación para un usuario.
    /// Decodifica el token JWT proporcionado, obtiene el correo del usuario y genera un nuevo token si es necesario.
    /// </summary>
    /// <param name="token">Token JWT enviado desde el frontend.</param>
    /// <returns>Mensaje de confirmación o error.</returns>
    [HttpPost("regenerar-token")]
    public async Task<IActionResult> RegenerarToken([FromBody] string token)
    {
        try
        {
            // Decodificar el token JWT para obtener el correo
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(emailClaim))
            {
                return BadRequest(new { Message = "El token no contiene un correo válido." });
            }

            // Buscar al usuario por correo electrónico
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == emailClaim);

            // Validar si el usuario existe
            if (usuario == null)
            {
                return NotFound(new { Message = "Usuario no encontrado." });
            }

            // Validar si el usuario ya está activo
            if (usuario.Activo == true)
            {
                return BadRequest(new { Message = "El usuario ya está activo. No es necesario regenerar el token." });
            }

            // Validar si el token actual aún no ha expirado
            if (usuario.FechaExpiracionToken.HasValue && usuario.FechaExpiracionToken.Value > DateTime.Now)
            {
                return BadRequest(new { Message = "El token actual aún no ha expirado. Revisa tu correo." });
            }

            // Generar un nuevo token de activación
            var nuevoToken = TokenHelper.GenerarToken();

            // Asignar el nuevo token y su propósito al usuario
            usuario.Token = nuevoToken;
            usuario.PropositoToken = PropositoTokenEnum.ActivarCuenta;
            usuario.FechaExpiracionToken = DateTime.Now.AddMinutes(30);

            // Actualizar los cambios en la base de datos
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            // Generar el enlace de activación con el nuevo token
            var activationUrl = $"https://3256-186-26-118-107.ngrok-free.app/cambiar-contrasena/{nuevoToken}";

            // Configurar el asunto y el contenido del correo de activación
            var subject = "Regeneración de Token de Activación";
            var htmlContent = $@"
        <p>Haz clic en el siguiente enlace para activar tu cuenta y cambiar tu contraseña:</p>
        <a href='{activationUrl}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Activar Cuenta</a>";

            // Enviar el correo al usuario con el nuevo token
            await _emailService.EnviarCorreoAsync(usuario.Email, subject, htmlContent);

            // Registrar la acción exitosa en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Regenerar Token",
                modulo: "Usuarios",
                detalle: "Se generó un nuevo token para el usuario.",
                token: nuevoToken,
                propositoToken: PropositoTokenEnum.ActivarCuenta.ToString(),
                estadoAccion: "Éxito"
            );

            // Retornar un mensaje indicando que el token fue generado exitosamente
            return Ok(new { Message = "Se generó un nuevo token. Revisa tu correo." });
        }
        catch (Exception ex)
        {
            // Registrar el error en el historial
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0,
                tipoAccion: "Regenerar Token",
                modulo: "Usuarios",
                detalle: "Error al regenerar el token.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            // Retornar un error 500 con el mensaje de excepción
            return StatusCode(500, new { Message = $"Error al regenerar token: {ex.Message}" });
        }
    }
    #endregion

    #region Cambio de Contraseña en Activación de Usuario
    [HttpPost("CambiarContrasenaActivacion")]
    public async Task<IActionResult> CambiarContrasenaActivacion([FromBody] CambiarContrasenaRequest request)
    {
        try
        {

            Console.WriteLine($"Token recibido: {request?.Token}"); // Log directo a consola
            Console.WriteLine($"PropositoToken buscado: {PropositoTokenEnum.CambioContrasena}");

            // Primero busquemos el usuario solo por token para ver si existe
            var usuarioSoloToken = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Token == request.Token);

            if (usuarioSoloToken == null)
            {
                Console.WriteLine("No se encontró usuario con ese token");
                return BadRequest(new { message = "Token no encontrado" });
            }

            Console.WriteLine($"Usuario encontrado por token: {usuarioSoloToken.Email}");
            Console.WriteLine($"Propósito actual del token: {usuarioSoloToken.PropositoToken}");

            if (request == null || string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NuevaContrasena))
            {
                _logger.LogWarning("Request inválido - datos faltantes");
                return BadRequest(new { message = "Datos inválidos" });
            }

            // Buscar al usuario por el token y el propósito
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Token == request.Token && u.PropositoToken == PropositoTokenEnum.CambioContrasena);

            if (usuario == null)
            {
                Console.WriteLine("Usuario no encontrado con token y propósito específico");
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 0,
                    tipoAccion: "Cambio de Contraseña Activación",
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
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: usuario.UsuarioId,
                    tipoAccion: "Cambio de Contraseña Activación",
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
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: usuario.UsuarioId,
                    tipoAccion: "Cambio de Contraseña Activación",
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

            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Cambio de Contraseña Activación",
                modulo: "Usuarios",
                detalle: $"El usuario {usuario.Email} cambió su contraseña exitosamente.",
                estadoAccion: "Exito"
            );

            return Ok(new { message = "Contraseña cambiada exitosamente." });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0,
                tipoAccion: "Cambio de Contraseña Activación",
                modulo: "Usuarios",
                detalle: "Error al intentar cambiar la contraseña.",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { message = $"Ocurrió un error: {ex.Message}" });
        }
    }
    #endregion

    #region Olvide Contraseña
    //El usuario Solicita la recuperacion
    [HttpPost("solicitar-recuperacion")]
    [AllowAnonymous]
    public async Task<IActionResult> SolicitarRecuperacion([FromBody] SolicitarRecuperacionRequest request)
    {
        try
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (usuario == null)
            {
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 0,
                    tipoAccion: "Solicitud Recuperación",
                    modulo: "Usuarios",
                    detalle: $"Intento de recuperación con email no registrado: {request.Email}",
                    estadoAccion: "Error",
                    errorDetalle: "Email no encontrado"
                );

                return NotFound(new { message = "Email no encontrado" });
            }

            // Generar token de recuperación
            var token = TokenHelper.GenerarToken();
            usuario.Token = token;
            usuario.PropositoToken = PropositoTokenEnum.RecuperacionContrasena;
            usuario.FechaExpiracionToken = DateTime.Now.AddHours(1);

            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            // Enviar correo
            var baseUrl = _configuration["WebAppSettings:BaseUrl"];
            var recuperacionUrl = $"{baseUrl}/Account/RestablecerContrasena?token={token}";

            var subject = "Recuperación de Contraseña";
            var htmlContent = $@"
            <h2>Recuperación de Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
            <a href='{recuperacionUrl}' style='padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>
                Restablecer Contraseña
            </a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, ignora este correo.</p>";

            await _emailService.EnviarCorreoAsync(usuario.Email, subject, htmlContent);

            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Solicitud Recuperación",
                modulo: "Usuarios",
                detalle: "Solicitud de recuperación exitosa",
                token: token,
                propositoToken: PropositoTokenEnum.RecuperacionContrasena.ToString(),
                estadoAccion: "Éxito"
            );

            return Ok(new { message = "Se han enviado las instrucciones a tu correo" });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0,
                tipoAccion: "Solicitud Recuperación",
                modulo: "Usuarios",
                detalle: "Error en solicitud de recuperación",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { message = "Error al procesar la solicitud" });
        }
    }


    [HttpGet("verificar-token-recuperacion")]
    [AllowAnonymous]
    public async Task<IActionResult> VerificarTokenRecuperacion(string token)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Token == token &&
                                    u.PropositoToken == PropositoTokenEnum.RecuperacionContrasena);

        if (usuario == null)
        {
            return Ok(new
            {
                valido = false,
                mensaje = "El enlace ya no es válido o ha sido utilizado"
            });
        }

        if (usuario.FechaExpiracionToken < DateTime.Now)
        {
            return Ok(new
            {
                valido = false,
                mensaje = "El enlace ha expirado. Por favor, solicita un nuevo enlace"
            });
        }

        return Ok(new { valido = true });
    }


    /*El usuario despues de dar click en el enlace del correo y poner sus contraseña nueva en el formulario ejecuta este endpoint para asi cambiarla*/
    [HttpPost("restablecer-contrasena")]
    [AllowAnonymous]
    public async Task<IActionResult> RestablecerContrasena([FromBody] RestablecerContrasenaRequestDTO request)
    {
        try
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Token == request.Token &&
                                        u.PropositoToken == PropositoTokenEnum.RecuperacionContrasena);

            if (usuario == null)
            {
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: 0,
                    tipoAccion: "Restablecer Contraseña",
                    modulo: "Usuarios",
                    detalle: "Intento fallido de restablecimiento. Token inválido.",
                    token: request.Token,
                    propositoToken: PropositoTokenEnum.RecuperacionContrasena.ToString(),
                    estadoAccion: "Error",
                    errorDetalle: "Token inválido"
                );

                return BadRequest(new { message = "Token inválido o expirado" });
            }

            // Validar expiración del token
            if (usuario.FechaExpiracionToken < DateTime.Now)
            {
                await HistorialHelper.RegistrarHistorial(
                    httpClient: _httpClient,
                    usuarioId: usuario.UsuarioId,
                    tipoAccion: "Restablecer Contraseña",
                    modulo: "Usuarios",
                    detalle: "Intento de restablecimiento fallido. Token expirado.",
                    token: request.Token,
                    propositoToken: PropositoTokenEnum.RecuperacionContrasena.ToString(),
                    estadoAccion: "Error",
                    errorDetalle: "Token expirado"
                );

                return BadRequest(new { message = "El enlace ha expirado" });
            }

            // Actualizar contraseña
            usuario.Contrasena = HashContrasena.HashearContrasena(request.NuevaContrasena);

            // Limpiar token usado
            usuario.Token = null;
            usuario.PropositoToken = null;
            usuario.FechaExpiracionToken = null;

            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: usuario.UsuarioId,
                tipoAccion: "Restablecer Contraseña",
                modulo: "Usuarios",
                detalle: "Contraseña restablecida exitosamente",
                estadoAccion: "Éxito"
            );

            return Ok(new { message = "Contraseña actualizada exitosamente" });
        }
        catch (Exception ex)
        {
            await HistorialHelper.RegistrarHistorial(
                httpClient: _httpClient,
                usuarioId: 0,
                tipoAccion: "Restablecer Contraseña",
                modulo: "Usuarios",
                detalle: "Error al restablecer contraseña",
                estadoAccion: "Error",
                errorDetalle: ex.Message
            );

            return StatusCode(500, new { message = "Error al restablecer contraseña" });
        }
    }
    #endregion

    #region Invalidar Sesiones Usuario
    /// <summary>
    /// Invalida todas las sesiones activas de un usuario específico
    /// Útil cuando se cambian permisos o se requiere re-autenticación
    /// </summary>
    /// <param name="usuarioId">ID del usuario cuyas sesiones se invalidarán</param>
    /// <returns>Resultado de la operación</returns>
    [HttpPost("invalidar-sesiones-usuario/{usuarioId}")]
    [Authorize] // Solo usuarios autenticados pueden hacer esto
    public async Task<IActionResult> InvalidarSesionesUsuario(int usuarioId)
    {
        try
        {
            var sesionesActivas = await _context.SesionUsuario
                .Where(s => s.UsuarioId == usuarioId && s.EstaActiva == true)
                .ToListAsync();

            if (sesionesActivas.Any())
            {
                foreach (var sesion in sesionesActivas)
                {
                    sesion.EstaActiva = false;
                    sesion.FechaInvalidacion = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                _logger?.LogInformation($"✅ Invalidadas {sesionesActivas.Count} sesiones para usuario {usuarioId}");

                return Ok(new 
                { 
                    Message = $"Se invalidaron {sesionesActivas.Count} sesiones activas",
                    SesionesInvalidadas = sesionesActivas.Count
                });
            }

            return Ok(new { Message = "No se encontraron sesiones activas para invalidar" });
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, $"❌ Error invalidando sesiones para usuario {usuarioId}");
            return StatusCode(500, new { Message = "Error al invalidar sesiones" });
        }
    }

    /// <summary>
    /// Invalida todas las sesiones activas de todos los usuarios
    /// Útil para mantenimiento o cambios globales
    /// </summary>
    [HttpPost("invalidar-todas-sesiones")]
    [Authorize] // Solo administradores deberían poder hacer esto
    public async Task<IActionResult> InvalidarTodasLasSesiones()
    {
        try
        {
            var sesionesActivas = await _context.SesionUsuario
                .Where(s => s.EstaActiva == true)
                .ToListAsync();

            if (sesionesActivas.Any())
            {
                foreach (var sesion in sesionesActivas)
                {
                    sesion.EstaActiva = false;
                    sesion.FechaInvalidacion = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                _logger?.LogInformation($"✅ Invalidadas TODAS las sesiones ({sesionesActivas.Count} sesiones)");

                return Ok(new 
                { 
                    Message = $"Se invalidaron todas las sesiones activas",
                    SesionesInvalidadas = sesionesActivas.Count
                });
            }

            return Ok(new { Message = "No había sesiones activas para invalidar" });
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "❌ Error invalidando todas las sesiones");
            return StatusCode(500, new { Message = "Error al invalidar sesiones" });
        }
    }
    #endregion


}

