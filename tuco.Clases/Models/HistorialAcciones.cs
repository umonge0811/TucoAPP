using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public class HistorialAcciones
{
    public int HistorialId { get; set; }
    public int UsuarioId { get; set; }
    public DateTime FechaAccion { get; set; }
    public string TipoAccion { get; set; } = null!;
    public string Modulo { get; set; } = null!;
    public string Detalle { get; set; } = null!;
    public string? Token { get; set; }
    public string? PropositoToken { get; set; }
    public string EstadoAccion { get; set; } = "Exito";
    public string? ErrorDetalle { get; set; }

    public virtual Usuario Usuario { get; set; } = null!;
}
