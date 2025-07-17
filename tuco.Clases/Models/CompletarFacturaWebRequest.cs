using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.Models
{
    public class CompletarFacturaWebRequest
    {
        public int FacturaId { get; set; }
        public string? MetodoPago { get; set; }
        public List<DetallePagoWebDTO>? DetallesPago { get; set; }
        public string? Observaciones { get; set; }
        public bool ForzarVerificacionStock { get; set; } = false;
        // ✅ NUEVAS PROPIEDADES PARA MANEJO DE PROFORMAS
        public bool EsProforma { get; set; } = false;
        public string? NumeroFacturaGenerada { get; set; }
        public int? FacturaGeneradaId { get; set; }
    }

    public class DetallePagoWebDTO
    {
        public string MetodoPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string? Referencia { get; set; }
        public string? Observaciones { get; set; }
        public DateTime? FechaPago { get; set; }
    }
}
