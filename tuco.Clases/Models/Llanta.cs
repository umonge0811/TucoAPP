using System;
using System.Collections.Generic;

namespace tuco.Clases.Models;

public partial class Llanta
{
    public int LlantaId { get; set; }

    public int? ProductoId { get; set; }

    public decimal? Ancho { get; set; }

    public decimal? Perfil { get; set; }

    public string? Diametro { get; set; }

    public string? Marca { get; set; }

    public string? Modelo { get; set; }

    public int? Capas { get; set; }

    public string? IndiceVelocidad { get; set; }

    public string? TipoTerreno { get; set; }

    public string? TipoVehiculo { get; set; }

    public virtual Producto? Producto { get; set; }
}