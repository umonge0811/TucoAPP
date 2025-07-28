using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class SesionUsuario
{
    public int SesionId { get; set; }

    public int? UsuarioId { get; set; }

    public DateTime? FechaHoraInicio { get; set; }

    public string? Token { get; set; }

    public bool EstaActiva { get; set; } = true;

    public DateTime? FechaInvalidacion { get; set; }

    public virtual Usuario? Usuario { get; set; }
}
