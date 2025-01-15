using TucoMAUI_APP.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TucoMAUI_APP.Services
{
    public interface IAppService
    {
        Task<bool> RefreshToken();
        public Task<MainResponse> AuthenticateUser(LoginModel loginModel);
        Task<(bool IsSuccess, string ErrorMessage)> RegisterUser(RegistrationModel registerUser);
        Task<List<UsuarioDTO>> GetAllStudents();
    }
}
