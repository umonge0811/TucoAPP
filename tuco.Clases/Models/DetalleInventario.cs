using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class DetalleInventario
{
    public int DetalleInventarioId { get; set; }

    public int? InventarioId { get; set; }

    public int? ProductoId { get; set; }

    public int? CantidadRegistrada { get; set; }

    public int? CantidadContada { get; set; }

    public int? Diferencia { get; set; }

    public string? Comentario { get; set; }

    public virtual Inventario? Inventario { get; set; }

    public virtual Producto? Producto { get; set; }
}
