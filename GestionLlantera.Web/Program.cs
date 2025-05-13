using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Cors;
using Microsoft.Extensions.Configuration;
using Microsoft.Win32;
using Org.BouncyCastle.Math;
using Microsoft.Extensions.DependencyInjection;
using tuco.Clases.Models;

var builder = WebApplication.CreateBuilder(args);

// Registrar los servicios necesarios para MVC
builder.Services.AddControllersWithViews();

// CONFIGURACI�N DE SERVICIOS HTTP Y API

// 1. Servicio de Autenticaci�n
builder.Services.AddHttpClient<IAuthService, AuthService>(client =>
{
    var apiSettings = builder.Configuration.GetSection("ApiSettings").Get<ApiSettings>();
    var baseUrl = apiSettings?.BaseUrl ??
        throw new InvalidOperationException("API BaseUrl not configured");

    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Accept.Clear();
    client.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/json"));
});

// Configuraci�n del HttpClient
// Configuraci�n centralizada del HttpClient
builder.Services.AddHttpClient("APIClient", (serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
var baseUrl = configuration.GetValue<string>("ApiSettings:BaseUrl")
    ?? throw new InvalidOperationException("API BaseUrl not configured");

client.BaseAddress = new Uri(baseUrl);
client.DefaultRequestHeaders.Accept.Clear();
client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
client.Timeout = TimeSpan.FromSeconds(30);
});


builder.Services.AddHttpClient<IUsuariosService, UsuariosService>(client =>
{
    var apiSettings = builder.Configuration.GetSection("ApiSettings").Get<ApiSettings>();
    var baseUrl = apiSettings?.BaseUrl ??
        throw new InvalidOperationException("API BaseUrl not configured");

    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Accept.Clear();
    client.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/json"));
});

// REGISTRO DE SERVICIOS
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRolesService, RolesService>(); // NUEVO
builder.Services.AddHttpClient<IUsuariosService, UsuariosService>();

// Configuraci�n de autenticaci�n por cookies
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromHours(1);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    // Esto es importante para prevenir redirects infinitos
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// Configuraci�n de CORS (Cross-Origin Resource Sharing)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            // Permite solicitudes desde cualquier origen
            .AllowAnyOrigin()
            // Permite todos los m�todos HTTP (GET, POST, etc.)
            .AllowAnyMethod()
            // Permite todos los headers en la solicitud
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configuraci�n del pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Habilitar el uso de CORS con la pol�tica definida
app.UseCors("AllowAll"); 
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

// Clase de configuraci�n de la API
public class ApiSettings
{
    public string BaseUrl { get; set; } = string.Empty;
}

