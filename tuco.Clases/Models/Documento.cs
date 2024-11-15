using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class Documento
{
    public int DocumentoId { get; set; }

    public int? ClienteId { get; set; }

    public bool? EsProforma { get; set; }

    public string? Estado { get; set; }

    public DateTime? FechaDocumento { get; set; }

    public DateTime? FechaVencimiento { get; set; }

    public decimal? Subtotal { get; set; }

    public decimal? Impuestos { get; set; }

    public decimal? Total { get; set; }

    public int? UsuarioId { get; set; }

    public virtual Cliente? Cliente { get; set; }

    public virtual ICollection<DetalleDocumento> DetalleDocumentos { get; set; } = new List<DetalleDocumento>();

    public virtual Usuario? Usuario { get; set; }
}
