using System.Threading.Tasks;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<(bool success, object data, string message)> ObtenerInventarioTotalAsync(string jwtToken);
        Task<(bool success, object data, string message)> ObtenerAlertasStockAsync(string jwtToken);
        Task<(bool success, object data, string message)> ObtenerTopVendedorAsync(string jwtToken);
    }
}