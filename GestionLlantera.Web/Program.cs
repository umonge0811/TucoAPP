using GestionLlantera.Web.Middleware;
using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using GestionLlantera.Web.Middleware;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configuración de base de datos removida - ahora se comunica con API

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
builder.Services.AddScoped<INotificacionService, NotificacionService>();


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

// ✅ NUEVO: Servicio global de permisos
builder.Services.AddScoped<IPermisosGlobalService, PermisosGlobalService>();
builder.Services.AddScoped<IPermisosInfoService, PermisosInfoService>();

// ✅ NUEVO: Servicio de Dashboard (usando el mismo patrón que otros servicios)
builder.Services.AddScoped<IDashboardService, DashboardService>();

// ✅ NUEVO: Servicio de Notas Rápidas
builder.Services.AddScoped<INotasRapidasService, NotasRapidasService>();
builder.Services.AddScoped<IAnunciosService, AnunciosService>();

// ✅ NUEVO: Agregar cache en memoria para optimización
builder.Services.AddMemoryCache();

// ✅ HTTPCLIENT FACTORY (más simple y confiable)
builder.Services.AddHttpClient();

// ✅ REGISTRAR CONFIGURACIÓN DE LA API (CENTRALIZADA)
// Configura la sección ApiSettings del appsettings.json para inyección de dependencias
builder.Services.Configure<GestionLlantera.Web.Services.ApiSettings>(
    builder.Configuration.GetSection("ApiSettings"));

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

// ✅ SERVICIO CENTRALIZADO DE CONFIGURACIÓN API (PRIMERO)
builder.Services.AddSingleton<ApiConfigurationService>();

// ✅ SERVICIOS DE NEGOCIO (ORDEN ALFABÉTICO)
builder.Services.AddScoped<IAjustesInventarioService, AjustesInventarioService>();
builder.Services.AddScoped<IAnunciosService, AnunciosService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IClientesService, ClientesService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IFacturacionService, FacturacionService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();
builder.Services.AddScoped<INotasRapidasService, NotasRapidasService>();
builder.Services.AddScoped<IProveedoresService, ProveedoresService>();
builder.Services.AddScoped<IReportesService, ReportesService>();
builder.Services.AddScoped<IRolesService, RolesService>();
builder.Services.AddScoped<ITomaInventarioService, TomaInventarioService>();
builder.Services.AddScoped<IUsuariosService, UsuariosService>();

// ✅ SERVICIOS DE PERMISOS
builder.Services.AddScoped<IPermisosService, PermisosService>();
builder.Services.AddScoped<IPermisosGlobalService, PermisosGlobalService>();
builder.Services.AddScoped<IPermisosInfoService, PermisosInfoService>();


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