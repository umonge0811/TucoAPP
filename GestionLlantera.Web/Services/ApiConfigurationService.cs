
using Microsoft.Extensions.Options;

namespace GestionLlantera.Web.Services
{
    /// <summary>
    /// Servicio centralizado para gestionar la configuración de la API
    /// Permite acceder a la URL base de la API desde un solo lugar
    /// </summary>
    public class ApiConfigurationService
    {
        private readonly ApiSettings _apiSettings;

        /// <summary>
        /// Constructor que recibe la configuración desde appsettings.json
        /// </summary>
        /// <param name="apiSettings">Configuración de la API inyectada por el contenedor DI</param>
        public ApiConfigurationService(IOptions<ApiSettings> apiSettings)
        {
            // Extrae los valores de configuración del wrapper IOptions
            _apiSettings = apiSettings.Value;
        }

        /// <summary>
        /// Propiedad que devuelve la URL base de la API
        /// Ejemplo: "https://localhost:7273"
        /// </summary>
        public string BaseUrl => _apiSettings.BaseUrl;

        /// <summary>
        /// Construye una URL completa de la API agregando el prefijo "/api/"
        /// </summary>
        /// <param name="endpoint">El endpoint sin el prefijo /api/, ejemplo: "usuarios"</param>
        /// <returns>URL completa, ejemplo: "https://localhost:7273/api/usuarios"</returns>
        public string GetApiUrl(string endpoint)
        {
            // Quita las barras al final de BaseUrl y al inicio de endpoint para evitar duplicados
            // Luego construye la URL con el formato: BaseUrl/api/endpoint
            return $"{BaseUrl.TrimEnd('/')}/api/{endpoint.TrimStart('/')}";
        }

        /// <summary>
        /// Construye una URL completa SIN el prefijo "/api/"
        /// Útil para endpoints especiales que no siguen el patrón /api/
        /// </summary>
        /// <param name="endpoint">El endpoint completo, ejemplo: "auth/login"</param>
        /// <returns>URL completa, ejemplo: "https://localhost:7273/auth/login"</returns>
        public string GetApiUrlWithoutApiPrefix(string endpoint)
        {
            // Similar al método anterior pero sin agregar "/api/"
            // Útil para endpoints como auth, uploads, etc.
            return $"{BaseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
        }
    }

    /// <summary>
    /// Clase que representa la sección "ApiSettings" del appsettings.json
    /// Se mapea automáticamente con los valores de configuración
    /// </summary>
    public class ApiSettings
    {
        /// <summary>
        /// URL base de la API que se lee desde appsettings.json
        /// Ejemplo: "https://localhost:7273"
        /// </summary>
        public string BaseUrl { get; set; } = string.Empty;
    }
}
