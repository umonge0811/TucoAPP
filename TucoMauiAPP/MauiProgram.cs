using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using TucoMAUI.Services;

namespace TucoMauiAPP
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                });

            builder.Services.AddMauiBlazorWebView();
            builder.Services.AddSingleton<UsuarioService>();


#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
    		builder.Logging.AddDebug();
#endif
            // Configurar HttpClient con la URL base de la API
            builder.Services.AddHttpClient("TucoApi", client =>
            {
                client.BaseAddress = new Uri("http://localhost:7273/"); // Cambia 5000 por el puerto de tu API local
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            });
            return builder.Build();
        }
    }
}
