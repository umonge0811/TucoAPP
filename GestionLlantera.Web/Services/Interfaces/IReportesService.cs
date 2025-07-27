namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IReportesService
    {
        Task<byte[]> DescargarExcelAsync(int inventarioId, string jwtToken);
        Task<byte[]> DescargarPdfAsync(int inventarioId, string jwtToken);
        Task<byte[]> DescargarPedidoPdfAsync(int pedidoId, string jwtToken);
        Task<object> ObtenerReporteAsync(int inventarioId, string jwtToken);
    }
}