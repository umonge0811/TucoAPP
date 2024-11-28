using TucoWEB.Client.Pages; // Importa las páginas del cliente (TucoWEB.Client).
using TucoWEB.Components;  // Importa componentes adicionales definidos en el cliente.

var builder = WebApplication.CreateBuilder(args); // Crea un constructor para configurar los servicios y el pipeline de la aplicación.
builder.Services.AddScoped(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["ApiSettings:BaseUrl"];
    if (string.IsNullOrEmpty(baseUrl))
    {
        throw new Exception("La URL base de la API no está configurada en ApiSettings:BaseUrl.");
    }
    return new HttpClient
    {
        BaseAddress = new Uri(baseUrl),
        Timeout = TimeSpan.FromSeconds(30) // Ajusta el tiempo de espera según sea necesario
    };
});


// Configuración de servicios
builder.Services.AddRazorComponents() // Habilita el uso de Razor Components.
    .AddInteractiveServerComponents() // Habilita el modo de renderizado en servidor para componentes interactivos.
    .AddInteractiveWebAssemblyComponents(); // Habilita el modo de renderizado en cliente (WebAssembly) para componentes interactivos.

builder.Logging.AddConsole(); // Agrega logs a la consola para revisar los errores


var app = builder.Build(); // Construye la aplicación con los servicios y configuraciones definidos anteriormente.

// Configuración del pipeline HTTP
if (app.Environment.IsDevelopment()) // Si estamos en un entorno de desarrollo:
{
    app.UseWebAssemblyDebugging(); // Habilita herramientas de depuración para WebAssembly.
}
else // Si estamos en un entorno de producción:
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true); // Maneja errores no controlados redirigiéndolos a una página de error.
    app.UseHsts(); // Habilita HSTS para mejorar la seguridad en HTTPS.
}

app.UseHttpsRedirection(); // Redirige automáticamente solicitudes HTTP a HTTPS.
app.UseStaticFiles(); // Habilita el acceso a archivos estáticos como CSS, imágenes, etc.
app.UseAntiforgery(); // Agrega protección contra ataques CSRF para formularios y endpoints sensibles.

// Mapeo de Razor Components
app.MapRazorComponents<App>() // Configura el componente principal `App` para renderizarlo.
    .AddInteractiveServerRenderMode() // Habilita el renderizado en servidor para los Razor Components.
    .AddInteractiveWebAssemblyRenderMode() // Habilita el renderizado en cliente para los Razor Components.
    .AddAdditionalAssemblies(typeof(TucoWEB.Client._Imports).Assembly); // Asegura que los componentes y recursos de TucoWEB.Client estén disponibles.

app.Run(); // Inicia la aplicación y bloquea el hilo hasta que esta se detenga.
