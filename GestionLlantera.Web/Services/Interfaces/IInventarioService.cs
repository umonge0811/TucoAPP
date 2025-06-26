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
        Task<List<string>> BuscarMarcasLlantasAsync(string filtro = "", string jwtToken = null);
        Task<List<string>> BuscarModelosLlantasAsync(string filtro = "", string marca = "", string jwtToken = null);
        Task<List<string>> BuscarIndicesVelocidadAsync(string filtro = "", string jwtToken = null);
        /// <summary>
        /// Busca tipos de terreno que coincidan con el filtro proporcionado
        /// </summary>
        /// <param name="filtro">Texto para filtrar los tipos</param>
        /// <param name="jwtToken">Token de autenticación</param>
        /// <returns>Lista de tipos de terreno que coinciden con el filtro</returns>
        Task<List<string>> BuscarTiposTerrenoAsync(string filtro = "", string jwtToken = null);
        Task<List<InventarioProgramadoDTO>> ObtenerTodosLosInventariosAsync(string jwtToken = null);
        Task<List<InventarioProgramadoDTO>> ObtenerInventariosAsignadosAsync(int usuarioId, string jwtToken = null);
    

        
        Task<bool> EliminarProductoAsync(int id, string jwtToken = null);

        Task<AjusteStockRapidoResponseDTO> AjustarStockRapidoAsync(int id, AjusteStockRapidoDTO ajusteDto, string jwtToken = null);


        // Métodos para manejo de inventarios programados
        Task<List<InventarioProgramadoDTO>> ObtenerInventariosProgramadosAsync(string jwtToken = null);
        Task<InventarioProgramadoDTO> ObtenerInventarioProgramadoPorIdAsync(int id, string jwtToken);
        Task<bool> GuardarInventarioProgramadoAsync(InventarioProgramadoDTO inventario, string jwtToken = null);
        Task<bool> ActualizarInventarioProgramadoAsync(int id, InventarioProgramadoDTO inventario, string jwtToken = null);
        Task<bool> IniciarInventarioAsync(int id, string jwtToken = null);
        Task<bool> CancelarInventarioAsync(int id, string jwtToken=null);
        Task<bool> CompletarInventarioAsync(int id, string jwtToken = null);
        Task<Stream> ExportarResultadosInventarioExcelAsync(int id, string jwtToken = null);
        Task<Stream> ExportarResultadosInventarioPDFAsync(int id, string jwtToken = null);
    }
}
