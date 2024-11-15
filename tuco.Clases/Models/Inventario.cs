using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class Inventario
{
    public int InventarioId { get; set; }

    public DateTime FechaProgramada { get; set; }

    public DateTime? FechaRealizacion { get; set; }

    public DateTime? FechaReprogramada { get; set; }

    public string? Estado { get; set; }

    public int? UsuarioId { get; set; }

    public virtual ICollection<DetalleInventario> DetalleInventarios { get; set; } = new List<DetalleInventario>();

    public virtual Usuario? Usuario { get; set; }
}
