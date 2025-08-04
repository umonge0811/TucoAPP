using System.Threading.Tasks;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<(bool success, object data, string message)> ObtenerInventarioTotalAsync();
        Task<(bool success, object data, string message)> ObtenerAlertasStockAsync();
        Task<(bool success, object data, string message)> ObtenerTopVendedorAsync();
    }
}