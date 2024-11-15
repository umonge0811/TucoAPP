using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class DetallePedido
{
    public int DetalleId { get; set; }

    public int? PedidoId { get; set; }

    public int? ProductoId { get; set; }

    public int Cantidad { get; set; }

    public decimal? PrecioUnitario { get; set; }

    public virtual PedidosProveedor? Pedido { get; set; }

    public virtual Producto? Producto { get; set; }
}
