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



// Configurar l�mites de tama�o para subida de archivos (opcional)
builder.Services.Configure<FormOptions>(options =>
{
    // Aumentar el l�mite a 50MB (ajusta seg�n tus necesidades)
    // Aumentar el l�mite a 20MB
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
            .WithOrigins("https://localhost:7038") // URL de la aplicaci�n web
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

// Configurar autorizaci�n
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireRole("Admin"));
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
app.UseStaticFiles(); // Ahora est� en la posici�n correcta
app.UseRouting(); // Agrega esta l�nea despu�s de UseStaticFiles

// Usar la pol�tica de CORS
app.UseCors("AllowAll"); // Usa la pol�tica definida correctamente

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();