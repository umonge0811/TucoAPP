using API.Data;
using API.Services;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Tuco.Clases.Models.Emails;
using API.Authorization;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Configurar servicios de email
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<EmailService>();

// Configurar servicios de notificaciones
builder.Services.AddScoped<INotificacionService, NotificacionService>();

// ? SERVICIOS DE PERMISOS
builder.Services.AddScoped<IPermisosService, PermisosService>();
builder.Services.AddMemoryCache(); // Para el cach� de permisos

// ? HANDLER DE AUTORIZACI�N DIN�MICO
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

// Configurar Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// ? CONFIGURACI�N DE AUTORIZACI�N DIN�MICA
builder.Services.AddAuthorization(options =>
{
    // ? POLICIES B�SICAS
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Administrador"));

    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireRole("Admin")); // Mantener por compatibilidad

    // ? POLICIES DIN�MICAS PARA INVENTARIO
    options.AgregarPolicyPermiso("PuedeVerCostos", "VerCostos");
    options.AgregarPolicyPermiso("PuedeVerUtilidades", "VerUtilidades");
    options.AgregarPolicyPermiso("PuedeProgramarInventario", "ProgramarInventario");
    options.AgregarPolicyPermiso("PuedeEditarProductos", "EditarProductos");
    options.AgregarPolicyPermiso("PuedeEliminarProductos", "EliminarProductos");
    options.AgregarPolicyPermiso("PuedeAjustarStock", "AjustarStock");

    // ? POLICIES DIN�MICAS GENERALES
    options.AgregarPolicyPermiso("PuedeVerReportes", "VerReportes");
    options.AgregarPolicyPermiso("PuedeGestionarUsuarios", "GestionUsuarios");
    options.AgregarPolicyPermiso("PuedeConfigurarSistema", "ConfiguracionSistema");

    // ? POLICIES DIN�MICAS PARA VENTAS (preparado para futuro)
    options.AgregarPolicyPermiso("PuedeCrearVentas", "CrearVentas");
    options.AgregarPolicyPermiso("PuedeVerVentas", "VerVentas");
    options.AgregarPolicyPermiso("PuedeAnularVentas", "AnularVentas");

    // ? POLICIES DIN�MICAS PARA CLIENTES (preparado para futuro)
    options.AgregarPolicyPermiso("PuedeGestionarClientes", "GestionClientes");
    options.AgregarPolicyPermiso("PuedeVerClientes", "VerClientes");
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