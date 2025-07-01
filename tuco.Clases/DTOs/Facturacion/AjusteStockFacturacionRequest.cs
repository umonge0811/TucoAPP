
using System.Collections.Generic;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class AjusteStockFacturacionRequest
    {
        public string NumeroFactura { get; set; } = string.Empty;
        public List<ProductoAjusteStock> Productos { get; set; } = new List<ProductoAjusteStock>();
    }

    public class ProductoAjusteStock
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }
}
