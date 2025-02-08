﻿using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using GestionLlantera.Web.Models;
using GestionLlantera.Web.Models.ViewModels;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Org.BouncyCastle.Pqc.Crypto.Lms;
using Microsoft.AspNetCore.Authorization;

namespace GestionLlantera.Web.Controllers
{
    public class AccountController : Controller
    {
        // Declaración de servicios que usaremos
        private readonly IAuthService _authService;
        private readonly ILogger<AccountController> _logger;

        // Constructor: Inyección de dependencias
        // ASP.NET Core se encarga de crear las instancias de estos servicios
        public AccountController(
            IAuthService authService,
            ILogger<AccountController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        // GET: /Account/Login
        // Este método se ejecuta cuando el usuario accede a la página de login
        public IActionResult Login()
        {
            try
            {
                // Verificar si el usuario ya está autenticado
                if (User.Identity?.IsAuthenticated ?? false)
                {
                    _logger.LogInformation("Usuario ya autenticado, redirigiendo a Home");
                    return RedirectToAction("Index", "Home");
                }

                // Si no está autenticado, mostrar el formulario de login
                return View(new LoginViewModel());
            }
            catch (Exception ex)
            {
                // Registrar cualquier error que ocurra
                _logger.LogError(ex, "Error al cargar la página de login");

                // Almacenar mensaje de error para mostrarlo en la vista
                TempData["Error"] = "Ocurrió un error al cargar la página. Por favor, intente nuevamente.";
                return RedirectToAction("Index", "Home");
            }
        }

        // POST: /Account/Login
        // Este método se ejecuta cuando el usuario envía el formulario de login
        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginViewModel model)  // No tiene [FromBody]
        {
            if (!ModelState.IsValid)
                return View(model);

            try
            {
                var (success, token, errorMessage) = await _authService.LoginAsync(model);

                if (success && !string.IsNullOrEmpty(token))
                {
                    // Guardar el token en una cookie segura
                    Response.Cookies.Append("JwtToken", token, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Lax,
                        Expires = DateTime.Now.AddHours(1)
                    });

                    // Crear los claims para la identidad
                    var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, model.Email),
                new Claim("JwtToken", token)
            };

                    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    var principal = new ClaimsPrincipal(identity);

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        principal,
                        new AuthenticationProperties
                        {
                            IsPersistent = model.RecordarMe,
                            ExpiresUtc = DateTime.UtcNow.AddHours(1)
                        });

                    return RedirectToAction("Index", "Dashboard");
                }

                ModelState.AddModelError(string.Empty, errorMessage ?? "Credenciales inválidas");
                return View(model);
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, "Error al procesar el login");
                return View(model);
            }
        }
        /// <summary>
        /// Método para cerrar la sesión del usuario y limpiar todas las cookies
        /// </summary>
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Registrar el evento de logout
                _logger.LogInformation("Usuario cerró sesión");

                // Eliminar la cookie de autenticación
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

                // Eliminar la cookie que contiene el token JWT
                Response.Cookies.Delete("JwtToken");

                // Limpiar todas las cookies relacionadas con la autenticación
                foreach (var cookie in Request.Cookies.Keys)
                {
                    Response.Cookies.Delete(cookie);
                }

                // Redirigir al usuario a la página de inicio
                return RedirectToAction("Index", "Home");
            }
            catch (Exception ex)
            {
                // Registrar cualquier error durante el proceso de logout
                _logger.LogError(ex, "Error durante el proceso de logout");

                return RedirectToAction("Index", "Home");
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult OlvideContrasena()
        {
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> OlvideContrasena(string email)
        {
            try
            {
                var response = await _authService.SolicitarRecuperacion(email);
                if (response)
                {
                    TempData["Success"] = "Se han enviado las instrucciones a tu correo electrónico";
                    return View();
                }

                TempData["Error"] = "No se pudo procesar la solicitud";
                return View();
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Ocurrió un error al procesar la solicitud";
                return View();
            }
        }
    }
}