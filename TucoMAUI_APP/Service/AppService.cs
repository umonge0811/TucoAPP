using System.Net.Http.Json;
using Newtonsoft.Json;
using TucoMAUI_APP.Models;
using TucoMAUI_APP.Services;

namespace TucoMAUI.Services
{
    public class AppService : IAppService
    {
        private readonly HttpClient _httpClient;

        public AppService(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("TucoApi");
        }

        // Autenticación de usuario
        public async Task<MainResponse> AuthenticateUser(LoginModel loginModel)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(APIs.AuthenticateUser, loginModel);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadFromJsonAsync<MainResponse>();
                    return content ?? new MainResponse { IsSuccess = false, ErrorMessage = "Error desconocido." };
                }

                return new MainResponse { IsSuccess = false, ErrorMessage = "Credenciales inválidas." };
            }
            catch (Exception ex)
            {
                return new MainResponse { IsSuccess = false, ErrorMessage = ex.Message };
            }
        }

        // Registro de usuario
        public async Task<MainResponse> RegisterUser(RegistrationModel registrationModel)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(APIs.RegisterUser, registrationModel);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadFromJsonAsync<MainResponse>();
                    return content ?? new MainResponse { IsSuccess = false, ErrorMessage = "Error desconocido." };
                }

                return new MainResponse { IsSuccess = false, ErrorMessage = "Error al registrar usuario." };
            }
            catch (Exception ex)
            {
                return new MainResponse { IsSuccess = false, ErrorMessage = ex.Message };
            }
        }

        //// Refrescar token
        //public async Task<bool> RefreshToken()
        //{
        //    try
        //    {
        //        var refreshToken = Setting.UserBasicDetail.RefreshToken;
        //        if (string.IsNullOrEmpty(refreshToken))
        //        {
        //            return false;
        //        }

        //        var request = new { RefreshToken = refreshToken };
        //        var response = await _httpClient.PostAsJsonAsync(APIs.RefreshToken, request);

        //        if (response.IsSuccessStatusCode)
        //        {
        //            var content = await response.Content.ReadFromJsonAsync<AuthenticateRequestAndResponse>();
        //            Setting.UserBasicDetail.AccessToken = content.AccessToken;
        //            Setting.UserBasicDetail.RefreshToken = content.RefreshToken;

        //            var userBasicInfoStr = JsonConvert.SerializeObject(Setting.UserBasicDetail);
        //            await SecureStorage.SetAsync(nameof(Setting.UserBasicDetail), userBasicInfoStr);

        //            return true;
        //        }

        //        return false;
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine($"Error al refrescar el token: {ex.Message}");
        //        return false;
        //    }
        //}

        Task<(bool IsSuccess, string ErrorMessage)> IAppService.RegisterUser(RegistrationModel registerUser)
        {
            throw new NotImplementedException();
        }

        public Task<List<UsuarioDTO>> GetAllStudents()
        {
            throw new NotImplementedException();
        }

        public async Task<List<UsuarioDTO>> ObtenerUsuariosAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync(APIs.GetAllUsers);

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<List<UsuarioDTO>>() ?? new List<UsuarioDTO>();
                }

                return new List<UsuarioDTO>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener usuarios: {ex.Message}");
                return new List<UsuarioDTO>();
            }
        }

        public Task<bool> RefreshToken()
        {
            throw new NotImplementedException();
        }
    }
}
