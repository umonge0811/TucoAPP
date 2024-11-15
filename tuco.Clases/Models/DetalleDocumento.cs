using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class DetalleDocumento
{
    public int DetalleId { get; set; }

    public int? DocumentoId { get; set; }

    public int? ProductoId { get; set; }

    public int Cantidad { get; set; }

    public decimal? PrecioUnitario { get; set; }

    public decimal? Descuento { get; set; }

    public virtual Documento? Documento { get; set; }

    public virtual Producto? Producto { get; set; }
}
