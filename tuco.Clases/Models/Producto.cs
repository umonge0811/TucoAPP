using System;
using System.Collections.Generic;
using Tuco.Clases.Models;

namespace tuco.Clases.Models;

public partial class Producto
{
    public int ProductoId { get; set; }

    public string NombreProducto { get; set; } = null!;

    public string? Descripcion { get; set; }

    // ✅ NUEVO: Costo del producto (precio al que lo compramos)
    public decimal? Costo { get; set; }

    // ✅ NUEVO: Porcentaje de utilidad (ej: 30 para 30%)
    public decimal? PorcentajeUtilidad { get; set; }

    public decimal? Precio { get; set; }

    public int? CantidadEnInventario { get; set; }

    public DateTime? FechaUltimaActualizacion { get; set; }

    public int? StockMinimo { get; set; }

    // ✅ NUEVO: Propiedad calculada para obtener la utilidad en dinero
    public decimal? UtilidadEnDinero
    {
        get
        {
            if (Costo.HasValue && PorcentajeUtilidad.HasValue)
            {
                return Costo.Value * (PorcentajeUtilidad.Value / 100);
            }
            return null;
        }
    }

    // ✅ NUEVO: Propiedad calculada para el precio de venta
    public decimal? PrecioCalculado
    {
        get
        {
            if (Costo.HasValue && PorcentajeUtilidad.HasValue)
            {
                return Costo.Value + UtilidadEnDinero;
            }
            return Precio; // Si no hay costo/utilidad, usar el precio manual
        }
    }

    public virtual ICollection<AlertasInvProgramado> AlertasInventarios { get; set; } = new List<AlertasInvProgramado>();

    public virtual ICollection<DetalleDocumento> DetalleDocumentos { get; set; } = new List<DetalleDocumento>();

    public virtual ICollection<DetalleInventario> DetalleInventarios { get; set; } = new List<DetalleInventario>();

    public virtual ICollection<DetallePedido> DetallePedidos { get; set; } = new List<DetallePedido>();

    public virtual ICollection<ImagenesProducto> ImagenesProductos { get; set; } = new List<ImagenesProducto>();

    public virtual ICollection<Llanta> Llanta { get; set; } = new List<Llanta>();
}
