using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class HistorialAccione
{
    public int HistorialId { get; set; }

    public int? UsuarioId { get; set; }

    public DateTime? FechaAccion { get; set; }

    public string? TipoAccion { get; set; }

    public string? Modulo { get; set; }

    public string? Detalle { get; set; }

    public virtual Usuario? Usuario { get; set; }
}
