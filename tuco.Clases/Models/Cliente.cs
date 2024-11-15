using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class Cliente
{
    public int ClienteId { get; set; }

    public string NombreCliente { get; set; } = null!;

    public string? Contacto { get; set; }

    public string? Direccion { get; set; }

    public string? Email { get; set; }

    public string? Telefono { get; set; }

    public int? UsuarioId { get; set; }

    public virtual ICollection<Documento> Documentos { get; set; } = new List<Documento>();

    public virtual Usuario? Usuario { get; set; }
}
