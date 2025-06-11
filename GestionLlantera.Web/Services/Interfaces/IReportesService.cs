namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IReportesService
    {
        Task<byte[]> DescargarExcelAsync(int inventarioId);
        Task<byte[]> DescargarPdfAsync(int inventarioId);
        Task<object> ObtenerReporteAsync(int inventarioId);
    }
}