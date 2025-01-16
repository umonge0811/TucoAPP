using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

// Registrar los servicios necesarios para MVC
builder.Services.AddControllersWithViews();

// Configurar el HttpClient para comunicarse con la API
builder.Services.AddHttpClient<IAuthService, AuthService>(client =>
{
    // Obtener la configuración de la API desde appsettings.json
    var apiSettings = builder.Configuration.GetSection("ApiSettings").Get<ApiSettings>();
    var baseUrl = apiSettings?.BaseUrl ??
        throw new InvalidOperationException("API BaseUrl not configured");

    // Configurar el cliente HTTP
    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Accept.Clear();
    client.DefaultRequestHeaders.Accept.Add(
        new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
});

// Registrar el servicio de autenticación como Scoped (una instancia por solicitud)
builder.Services.AddScoped<IAuthService, AuthService>();

// Configurar la autenticación por cookies
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.LoginPath = "/Account/Login";  // Ruta para el login
    options.LogoutPath = "/Account/Logout"; // Ruta para el logout
    options.AccessDeniedPath = "/Account/AccessDenied"; // Ruta para acceso denegado
    options.ExpireTimeSpan = TimeSpan.FromHours(1); // Tiempo de expiración de la cookie

    // Configuraciones adicionales de seguridad para las cookies
    options.Cookie.HttpOnly = true;  // La cookie no es accesible via JavaScript
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Solo HTTPS
    options.Cookie.SameSite = SameSiteMode.Strict; // Protección contra CSRF
});

// Construir la aplicación
var app = builder.Build();

// Configurar el pipeline de HTTP
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Middleware para redireccionar HTTP a HTTPS
app.UseHttpsRedirection();

// Middleware para servir archivos estáticos (CSS, JavaScript, etc.)
app.UseStaticFiles();

// Middleware para el enrutamiento
app.UseRouting();

// Middleware de autenticación y autorización (el orden es importante)
app.UseAuthentication();
app.UseAuthorization();

// Program.cs
// Modificar la ruta por defecto
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"); // Cambiado de Account/Login a Home/Index

// Iniciar la aplicación
app.Run();

// Clase para tipar la configuración de la API
public class ApiSettings
{
    public string BaseUrl { get; set; } = string.Empty;
}