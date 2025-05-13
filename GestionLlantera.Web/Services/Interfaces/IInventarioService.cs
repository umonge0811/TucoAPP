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
    }
}