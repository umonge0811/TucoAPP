using API.Data;
using GestionLlantera.Web.Middleware;
using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// ? AGREGAR ESTA LÍNEA - Configuración de la base de datos
builder.Services.AddDbContext<TucoContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Agregar servicios al contenedor.
builder.Services.AddControllersWithViews();
builder.Services.AddHttpContextAccessor();

// Configurar HTTP client para llamadas a la API
builder.Services.AddHttpClient("APIClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiSettings:BaseUrl"]);
    // Aumentar el timeout a 5 minutos para permitir subidas de archivos grandes o múltiples
    // El timeout por defecto es 100 segundos, lo cual puede ser insuficiente para imágenes
    client.Timeout = TimeSpan.FromMinutes(5);
});

// Registrar servicios
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRolesService, RolesService>();
builder.Services.AddScoped<IPermisosService, PermisosService>();
builder.Services.AddScoped<IUsuariosService, UsuariosService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();
//builder.Services.AddScoped<INotificacionService, NotificacionService>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;
    });


// Servicios HTTP Client existentes (estos se mantienen igual)
builder.Services.AddHttpClient<IAuthService, AuthService>(client =>
{
    client.BaseAddress = new Uri("https://localhost:7273/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IUsuariosService, UsuariosService>(client =>
{
    client.BaseAddress = new Uri("https://localhost:7273/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IRolesService, RolesService>(client =>
{
    client.BaseAddress = new Uri("https://localhost:7273/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IPermisosService, PermisosService>(client =>
{
    client.BaseAddress = new Uri("https://localhost:7273/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IInventarioService, InventarioService>(client =>
{
    client.BaseAddress = new Uri("https://localhost:7273/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddAuthorization(options =>
{
    // Puedes añadir políticas personalizadas aquí
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
});

var app = builder.Build();

// Configurar el pipeline de solicitudes HTTP.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Añadir autenticación y autorización al pipeline
app.UseAuthentication();
app.UseJwtClaimsMiddleware();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();