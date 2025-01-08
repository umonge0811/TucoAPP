using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class HistorialAccionDTO
{
    public int? UsuarioID { get; set; }
    public string TipoAccion { get; set; } = null!;
    public string Modulo { get; set; } = null!;
    public string Detalle { get; set; } = null!;
    public string? Token { get; set; }
    public string? PropositoToken { get; set; }
    public string EstadoAccion { get; set; } = "Exito";
    public string? ErrorDetalle { get; set; }
}
