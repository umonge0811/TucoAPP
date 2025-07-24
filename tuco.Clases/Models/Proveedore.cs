using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class Proveedore
{
    public int ProveedorId { get; set; }

    public string NombreProveedor { get; set; } = null!;

    public string? Contacto { get; set; }

    public string? Telefono { get; set; }

    public string? Direccion { get; set; }

    public string? Email { get; set; }

    public bool Activo { get; set; } = true;

    public virtual ICollection<PedidosProveedor> PedidosProveedors { get; set; } = new List<PedidosProveedor>();
}
