using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class Producto
{
    public int ProductoId { get; set; }

    public string NombreProducto { get; set; } = null!;

    public string? Descripcion { get; set; }

    public decimal? Precio { get; set; }

    public int? CantidadEnInventario { get; set; }

    public DateTime? FechaUltimaActualizacion { get; set; }

    public int? StockMinimo { get; set; }

    public virtual ICollection<AlertasInventario> AlertasInventarios { get; set; } = new List<AlertasInventario>();

    public virtual ICollection<DetalleDocumento> DetalleDocumentos { get; set; } = new List<DetalleDocumento>();

    public virtual ICollection<DetalleInventario> DetalleInventarios { get; set; } = new List<DetalleInventario>();

    public virtual ICollection<DetallePedido> DetallePedidos { get; set; } = new List<DetallePedido>();

    public virtual ICollection<ImagenesProducto> ImagenesProductos { get; set; } = new List<ImagenesProducto>();

    public virtual ICollection<Llanta> Llanta { get; set; } = new List<Llanta>();
}
