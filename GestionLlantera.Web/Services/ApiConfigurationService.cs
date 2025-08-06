
using Microsoft.Extensions.Options;

namespace GestionLlantera.Web.Services
{
    public class ApiConfigurationService
    {
        private readonly ApiSettings _apiSettings;

        public ApiConfigurationService(IOptions<ApiSettings> apiSettings)
        {
            _apiSettings = apiSettings.Value;
        }

        public string BaseUrl => _apiSettings.BaseUrl;

        public string GetApiUrl(string endpoint)
        {
            return $"{BaseUrl.TrimEnd('/')}/api/{endpoint.TrimStart('/')}";
        }

        public string GetApiUrlWithoutApiPrefix(string endpoint)
        {
            return $"{BaseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
        }
    }

    public class ApiSettings
    {
        public string BaseUrl { get; set; } = string.Empty;
    }
}
