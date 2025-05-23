using API.Data;
using API.Services;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
builder.Services.AddHttpClient();



// Configurar límites de tamaño para subida de archivos (opcional)
builder.Services.Configure<FormOptions>(options =>
{
    // Aumentar el límite a 50MB (ajusta según tus necesidades)
    // Aumentar el límite a 20MB
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
            .WithOrigins("https://localhost:7038") // URL de la aplicación web
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

// Configurar autenticación JWT
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

// Configurar autorización
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireRole("Admin"));
});

// Construir la aplicación
var app = builder.Build();

// Configurar el pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configurar middleware en el orden correcto
app.UseHttpsRedirection();
app.UseStaticFiles(); // Ahora está en la posición correcta
app.UseRouting(); // Agrega esta línea después de UseStaticFiles

// Usar la política de CORS
app.UseCors("AllowAll"); // Usa la política definida correctamente

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();