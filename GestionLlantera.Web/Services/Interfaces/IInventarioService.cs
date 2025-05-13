using GestionLlantera.Web.Models.DTOs.Inventario;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IInventarioService
    {
        Task<List<ProductoDTO>> ObtenerProductosAsync();
        Task<ProductoDTO> ObtenerProductoPorIdAsync(int id);
        Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes);
    }
}