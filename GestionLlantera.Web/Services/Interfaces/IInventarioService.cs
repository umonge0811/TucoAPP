// Ubicación: GestionLlantera.Web/Services/Interfaces/IInventarioService.cs

using GestionLlantera.Web.Models.DTOs.Inventario;
using Microsoft.AspNetCore.Http;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IInventarioService
    {
        Task<List<ProductoDTO>> ObtenerProductosAsync();
        Task<ProductoDTO> ObtenerProductoPorIdAsync(int id);
        Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes);
        Task<bool> ActualizarProductoAsync(int id, ProductoDTO producto, List<IFormFile> nuevasImagenes);
        Task<bool> AjustarStockAsync(int id, int cantidad, string tipoAjuste);

        // En IInventarioService.cs, añadir estos métodos:

        // Métodos para manejo de inventarios programados
        Task<List<InventarioProgramadoDTO>> ObtenerInventariosProgramadosAsync();
        Task<InventarioProgramadoDTO> ObtenerInventarioProgramadoPorIdAsync(int id);
        Task<bool> GuardarInventarioProgramadoAsync(InventarioProgramadoDTO inventario);
        Task<bool> ActualizarInventarioProgramadoAsync(int id, InventarioProgramadoDTO inventario);
        Task<bool> IniciarInventarioAsync(int id);
        Task<bool> CancelarInventarioAsync(int id);
        Task<bool> CompletarInventarioAsync(int id);
        Task<Stream> ExportarResultadosInventarioExcelAsync(int id);
        Task<Stream> ExportarResultadosInventarioPDFAsync(int id);
    }
}