using API.Data;
using GestionLlantera.Web.Middleware;
using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using GestionLlantera.Web.Middleware;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ✅ Configuración de la base de datos para acceso directo
builder.Services.AddDbContext<TucoContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Agregar servicios al contenedor
builder.Services.AddControllersWithViews();
builder.Services.AddHttpContextAccessor();

// ✅ CONFIGURACIÓN DE SESIONES
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
// ✅ REGISTRO DEL NUEVO SERVICIO DE TOMA DE INVENTARIO
builder.Services.AddScoped<ITomaInventarioService, TomaInventarioService>();
// ✅ AGREGAR ESTA LÍNEA donde registras los otros servicios
builder.Services.AddScoped<IAjustesInventarioService, AjustesInventarioService>();
// ✅ AGREGAR SERVICIO DE REPORTES
builder.Services.AddScoped<IReportesService, ReportesService>();
builder.Services.AddScoped<IFacturacionService, FacturacionService>();
builder.Services.AddScoped<IProveedoresService, ProveedoresService>();

// ✅ SOLO EL SERVICIO DIRECTO (sin HTTP)
builder.Services.AddScoped<INotificacionService, NotificacionDirectService>();

builder.Services.AddAntiforgery(options => options.HeaderName = "X-CSRF-TOKEN");

// ✅ CONFIGURACIÓN DE AUTENTICACIÓN
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;
    });

// Registrar servicios
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();
builder.Services.AddScoped<IUsuariosService, UsuariosService>();
builder.Services.AddScoped<IRolesService, RolesService>();
builder.Services.AddScoped<IPermisosService, PermisosService>();
builder.Services.AddScoped<IReportesService, ReportesService>();
builder.Services.AddScoped<INotificacionService, NotificacionDirectService>();
builder.Services.AddScoped<ITomaInventarioService, TomaInventarioService>();
builder.Services.AddScoped<IAjustesInventarioService, AjustesInventarioService>();
builder.Services.AddScoped<IFacturacionService, FacturacionService>();
builder.Services.AddScoped<IClientesService, ClientesService>();

// ✅ NUEVO: Servicio global de permisos
builder.Services.AddScoped<IPermisosGlobalService, PermisosGlobalService>();
builder.Services.AddScoped<IPermisosService, PermisosService>();
builder.Services.AddScoped<IPermisosInfoService, PermisosInfoService>();

// ✅ NUEVO: Servicio de Dashboard (usando el mismo patrón que otros servicios)
builder.Services.AddScoped<IDashboardService, DashboardService>();

// ✅ NUEVO: Servicio de Notas Rápidas
builder.Services.AddScoped<INotasRapidasService, NotasRapidasService>();

// ✅ NUEVO: Agregar cache en memoria para optimización
builder.Services.AddMemoryCache();

// ✅ HTTPCLIENT FACTORY (más simple y confiable)
builder.Services.AddHttpClient();

// ✅ CONFIGURACIÓN ADICIONAL DE HTTP CLIENT (opcional - se puede mantener o eliminar)
builder.Services.AddHttpClient("APIClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiSettings:BaseUrl"]);
    client.Timeout = TimeSpan.FromMinutes(5);
});

// ✅ AUTORIZACIÓN
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
});

var app = builder.Build();

// Configurar el pipeline de solicitudes HTTP
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// ✅ HABILITAR SESIONES (debe ir antes de autenticación)
app.UseSession();

// Pipeline de autenticación y autorización
app.UseAuthentication();
app.UseJwtClaimsMiddleware();
app.UseAuthorization();

// ✅ NUEVO: Middleware de auditoría de permisos
app.UsePermisosAuditoria();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();