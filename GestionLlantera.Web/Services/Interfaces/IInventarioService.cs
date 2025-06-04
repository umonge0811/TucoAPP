// Ubicación: GestionLlantera.Web/Services/Interfaces/IInventarioService.cs

using Tuco.Clases.DTOs.Inventario;
using Microsoft.AspNetCore.Http;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IInventarioService
    {
        Task<List<ProductoDTO>> ObtenerProductosAsync(string jwtToken);
        Task<ProductoDTO> ObtenerProductoPorIdAsync(int id, string jwtToken = null);
        Task<bool> AgregarProductoAsync(ProductoDTO producto, List<IFormFile> imagenes, string jwtToken = null);
        Task<bool> ActualizarProductoAsync(int id, ProductoDTO producto, List<IFormFile> nuevasImagenes, string jwtToken=null);
        Task<bool> EliminarImagenProductoAsync(int productoId, int imagenId, string jwtToken = null);
        Task<bool> AjustarStockAsync(int id, int cantidad, string tipoAjuste);
        Task<List<string>> BuscarMarcasLlantasAsync(string filtro = "", string jwtToken = null);
        Task<List<string>> BuscarModelosLlantasAsync(string filtro = "", string marca = "", string jwtToken = null);
        Task<List<string>> BuscarIndicesVelocidadAsync(string filtro = "", string jwtToken = null);
        Task<List<string>> BuscarTiposTerrenoAsync(string filtro = "", string jwtToken = null);


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