using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using TucoWEB.Client.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddScoped<UsuarioService>(); // Registra el servicio de usuarios


await builder.Build().RunAsync();
