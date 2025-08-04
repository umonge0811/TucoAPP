
using System.Threading.Tasks;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<(bool success, object data, string mensaje)> ObtenerAlertasStockAsync();
    }
}
