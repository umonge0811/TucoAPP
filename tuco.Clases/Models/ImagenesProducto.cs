using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class ImagenesProducto
{
    public int ImagenId { get; set; }

    public int? ProductoId { get; set; }

    public string Urlimagen { get; set; } = null!;

    public string? Descripcion { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public virtual Producto? Producto { get; set; }
}
