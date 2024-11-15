using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class PedidosProveedor
{
    public int PedidoId { get; set; }

    public int? ProveedorId { get; set; }

    public DateTime? FechaPedido { get; set; }

    public string? Estado { get; set; }

    public int? UsuarioId { get; set; }

    public virtual ICollection<DetallePedido> DetallePedidos { get; set; } = new List<DetallePedido>();

    public virtual Proveedore? Proveedor { get; set; }

    public virtual Usuario? Usuario { get; set; }
}
