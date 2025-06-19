using System;
using System.Collections.Generic;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class FacturaDTO
    {
        public int FacturaId { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public DateTime FechaFactura { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public int ClienteId { get; set; }
        public string NombreCliente { get; set; } = string.Empty;
        public string EmailCliente { get; set; } = string.Empty;
        public string TelefonoCliente { get; set; } = string.Empty;
        public string DireccionCliente { get; set; } = string.Empty;
        public string IdentificacionCliente { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal DescuentoGeneral { get; set; }
        public decimal PorcentajeImpuesto { get; set; }
        public decimal MontoImpuesto { get; set; }
        public decimal Total { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public string EstadoFactura { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
        public List<DetalleFacturaDTO> DetallesFactura { get; set; } = new List<DetalleFacturaDTO>();

        // Propiedades calculadas
        public decimal SubtotalConDescuento => Subtotal - DescuentoGeneral;
        public decimal ImpuestoCalculado => SubtotalConDescuento * (PorcentajeImpuesto / 100);
        public decimal TotalCalculado => SubtotalConDescuento + ImpuestoCalculado;
    }
}