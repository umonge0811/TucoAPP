using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using TucoMAUI.Services;

namespace TucoMAUI
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


#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
            builder.Logging.AddDebug();
#endif

            // Configurar HttpClient con la URL base correcta según la plataforma
            builder.Services.AddHttpClient("TucoApi", client =>
            {
                var baseUrl = DeviceInfo.Platform == DevicePlatform.Android
                    ? "https://10.0.2.2:7273/"  // Para emulador Android
                    : "https://localhost:7273/"; // Para Windows/iOS

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/json"));

                // Aumentar el timeout
                client.Timeout = TimeSpan.FromSeconds(30);
            }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                UseProxy = false,
                AutomaticDecompression = System.Net.DecompressionMethods.All
            });

            builder.Services.AddSingleton<UsuarioService>(); // Registra UsuarioService como Singleton

            return builder.Build();
        }
    }
}
