using GestionLlantera.Web.Services;
using GestionLlantera.Web.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Registrar los servicios necesarios para MVC
builder.Services.AddControllersWithViews();

// Configuración del HttpClient para comunicarse con la API
// Registramos el HttpClient como un servicio tipado que se puede inyectar
builder.Services.AddHttpClient<IAuthService, AuthService>(client =>
{
    // Obtener la URL base de la API desde la configuración
    var apiSettings = builder.Configuration.GetSection("ApiSettings").Get<ApiSettings>();
    client.BaseAddress = new Uri(apiSettings?.BaseUrl ?? throw new InvalidOperationException("API BaseUrl not configured"));

    // Configurar headers por defecto
    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
});

// Registrar el servicio de autenticación
// AddScoped significa que se crea una nueva instancia por cada solicitud HTTP
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// Configurar el pipeline de solicitudes HTTP
if (!app.Environment.IsDevelopment())
{
    // En producción, redirige errores a una página específica
    app.UseExceptionHandler("/Home/Error");
    // Configurar HSTS (HTTP Strict Transport Security)
    app.UseHsts();
}

// Middleware para redirigir HTTP a HTTPS
app.UseHttpsRedirection();

// Middleware para servir archivos estáticos (CSS, JavaScript, imágenes)
app.UseStaticFiles();

// Middleware para el enrutamiento
app.UseRouting();

// Middleware para la autorización
app.UseAuthorization();

// Configurar las rutas por defecto
app.MapControllerRoute(
    name: "default",
    // Cambiar Home por Account
    pattern: "{controller=Account}/{action=Login}/{id?}");

app.Run();

// Clase para tipar la configuración de la API
public class ApiSettings
{
    public string BaseUrl { get; set; } = string.Empty;
}