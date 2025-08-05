
using System.Threading.Tasks;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<(bool success, object data, string mensaje)> ObtenerAlertasStockAsync(string jwtToken);
        Task<(bool success, object data, string mensaje)> ObtenerInventarioTotalAsync(string jwtToken);
        Task<(bool success, object data, string mensaje)> ObtenerTopVendedorAsync(string jwtToken);
        Task<(bool success, object data, string mensaje)> ObtenerUsuariosConectadosAsync(string jwtToken);
    }
}
