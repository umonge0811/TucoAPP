using API.Authorization;
using API.Data;
using API.Services;
using API.Services.Interfaces;
using API.ServicesAPI;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Tuco.Clases.Models.Emails;

var builder = WebApplication.CreateBuilder(args);

// Configurar servicios de email
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<EmailService>();

// Configurar servicios de notificaciones
builder.Services.AddScoped<INotificacionService, NotificacionService>();

// EN Program.cs - AGREGAR ESTA L�NEA:
builder.Services.AddScoped<ITomaInventarioService, TomaInventarioService>();

// ? SERVICIOS DE PERMISOS - Sistema completamente din�mico
builder.Services.AddScoped<IPermisosService, PermisosService>();
builder.Services.AddMemoryCache(); // Para el cach� de permisos

// ? HANDLER DE AUTORIZACI�N DIN�MICO - Mantener para funcionalidades espec�ficas
builder.Services.AddScoped<IAuthorizationHandler, PermisoAuthorizationHandler>();

builder.Services.AddHttpClient();

// Configurar l�mites de tama�o para subida de archivos
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 20 * 1024 * 1024;
});

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policyBuilder =>
    {
        policyBuilder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
    options.AddPolicy("AllowWeb", policyBuilder =>
    {
        policyBuilder
            .WithOrigins("https://localhost:7038")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Configurar DbContext
builder.Services.AddDbContext<TucoContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configurar controladores con opciones JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ? SERVICIOS NECESARIOS PARA EL SISTEMA DIN�MICO
builder.Services.AddHttpContextAccessor();
builder.Services.AddRazorPages(); // Para TagHelpers

// Configurar Swagger
// ? DESPU�S (configuraci�n completa):
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Tuco API",
        Version = "v1",
        Description = "API del sistema Tuco con autenticaci�n JWT"
    });

    // ? CONFIGURACI�N JWT PARA SWAGGER
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
// Configurar HttpClient
builder.Services.AddHttpClient("TucoApi", client =>
{
    client.BaseAddress = new Uri("https://localhost:7273/");
});

// Configurar autenticaci�n JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Key"]))
    };
});

// ? CONFIGURACI�N DE AUTORIZACI�N 100% DIN�MICA
// ?? TODO SE MANEJA DESDE LA BASE DE DATOS - SIN HARDCODEO
builder.Services.AddAuthorization(options =>
{
    // ? �NICA POLICY B�SICA: Solo requiere autenticaci�n
    options.AddPolicy("RequireAuthentication", policy =>
        policy.RequireAuthenticatedUser());

    // ? YA NO HAY M�S POLICIES EST�TICAS
    // ?? Todos los permisos y roles se gestionan din�micamente desde:
    //    - Interfaz de usuario para crear/editar roles
    //    - Interfaz de usuario para crear/editar permisos  
    //    - TagHelper autom�tico: asp-permiso="CualquierPermiso"
    //    - Controladores: await this.ValidarPermisoAsync(_permisosService, "CualquierPermiso")
    //
    // ?? VENTAJAS DEL SISTEMA DIN�MICO:
    //    ? Crear permiso en interfaz ? Funciona inmediatamente
    //    ? Crear rol en interfaz ? Funciona inmediatamente
    //    ? Asignar permisos a roles ? Funciona inmediatamente
    //    ? Sin tocar c�digo nunca m�s
    //    ? Sistema escalable y mantenible
});

// Construir la aplicaci�n
var app = builder.Build();

// Configurar el pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configurar middleware en el orden correcto
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// Usar la pol�tica de CORS
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();