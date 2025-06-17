
using Tuco.Clases.DTOs.Facturacion;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IFacturacionService
    {
        // Productos para venta
        Task<(bool Exitoso, object Resultado, string? Error)> ObtenerProductosParaVentaAsync(
            string? busqueda = null, bool soloConStock = true, int pagina = 1, int tamano = 50, string token = "");
        Task<(bool Exitoso, ProductoVentaDTO? Producto, string? Error)> ObtenerProductoParaVentaAsync(int id, string token);

        // Facturas
        Task<(bool Exitoso, object Resultado, string? Error)> CrearFacturaAsync(FacturaDTO factura, string token);
        Task<(bool Exitoso, object Resultado, string? Error)> ObtenerFacturasAsync(
            string? filtro = null, string? estado = null, string? tipoDocumento = null,
            DateTime? fechaDesde = null, DateTime? fechaHasta = null, int pagina = 1, int tamano = 20, string token = "");
        Task<(bool Exitoso, FacturaDTO? Factura, string? Error)> ObtenerFacturaPorIdAsync(int id, string token);
        Task<(bool Exitoso, string? Error)> ActualizarEstadoFacturaAsync(int id, string nuevoEstado, string token);

        // Utilidades
        Task<string> GenerarNumeroFacturaAsync(string tipoDocumento, string token);
    }
}
