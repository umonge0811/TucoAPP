using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class AlertasInventario
{
    public int AlertaId { get; set; }

    public int? ProductoId { get; set; }

    public DateTime? FechaAlerta { get; set; }

    public string? TipoAlerta { get; set; }

    public string? Descripcion { get; set; }

    public virtual Producto? Producto { get; set; }
}
