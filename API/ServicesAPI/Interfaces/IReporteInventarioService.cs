using Tuco.Clases.DTOs.Inventario;

namespace API.ServicesAPI.Interfaces
{
    public interface IReporteInventarioService
    {
        Task<ReporteInventarioDTO> GenerarReporteAsync(int inventarioProgramadoId);
        Task<byte[]> GenerarReporteExcelAsync(int inventarioProgramadoId);
        Task<byte[]> GenerarReportePdfAsync(int inventarioProgramadoId);
    }
}