
namespace GestionLlantera.Web.Models.DTOs
{
    public class CrearPedidoProveedorRequest
    {
        public int ProveedorId { get; set; }
        public List<ProductoPedidoRequest> Productos { get; set; } = new List<ProductoPedidoRequest>();
    }

    public class ProductoPedidoRequest
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
    }
}
