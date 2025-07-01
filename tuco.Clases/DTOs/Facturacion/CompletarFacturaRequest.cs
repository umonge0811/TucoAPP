
using System;
using System.Collections.Generic;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class CompletarFacturaRequest
    {
        public string? MetodoPago { get; set; }
        public string? Referencia { get; set; }
        public string? Observaciones { get; set; }
        public List<DetallePagoDTO>? DetallesPago { get; set; }
    }
}
