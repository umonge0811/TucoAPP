using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class FacturaDTO
    {
        public int FacturaId { get; set; }

        public string NumeroFactura { get; set; } = string.Empty;

        public int? ClienteId { get; set; }

        [Required(ErrorMessage = "El nombre del cliente es requerido")]
        [StringLength(200, ErrorMessage = "El nombre no puede tener más de 200 caracteres")]
        public string NombreCliente { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "La identificación no puede tener más de 50 caracteres")]
        public string? IdentificacionCliente { get; set; }

        [Phone(ErrorMessage = "El formato del teléfono no es válido")]
        public string? TelefonoCliente { get; set; }

        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        public string? EmailCliente { get; set; }

        [StringLength(300, ErrorMessage = "La dirección no puede tener más de 300 caracteres")]
        public string? DireccionCliente { get; set; }

        [Required]
        public DateTime FechaFactura { get; set; }

        public DateTime? FechaVencimiento { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "El subtotal debe ser mayor o igual a 0")]
        public decimal Subtotal { get; set; }

        [Range(0, 100, ErrorMessage = "El descuento debe estar entre 0 y 100")]
        public decimal? DescuentoGeneral { get; set; }

        [Range(0, 100, ErrorMessage = "El porcentaje de impuesto debe estar entre 0 y 100")]
        public decimal? PorcentajeImpuesto { get; set; } = 13; // IVA Costa Rica por defecto

        public decimal? MontoImpuesto { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "El total debe ser mayor a 0")]
        public decimal Total { get; set; }

        [Required]
        public string Estado { get; set; } = "Pendiente";

        [Required]
        public string TipoDocumento { get; set; } = "Factura";

        public string? MetodoPago { get; set; }

        // Nuevas propiedades para pagos múltiples
        public List<DetallePagoDTO> DetallesPago { get; set; } = new List<DetallePagoDTO>();
        public bool EsPagoMultiple => DetallesPago.Any();

        [StringLength(500, ErrorMessage = "Las observaciones no pueden tener más de 500 caracteres")]
        public string? Observaciones { get; set; }

        public int UsuarioCreadorId { get; set; }
        public string? UsuarioCreadorNombre { get; set; }

        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }

        // Lista de productos en la factura
        public List<DetalleFacturaDTO>? DetallesFactura { get; set; }

        // Propiedades calculadas
        public decimal SubtotalSinDescuento => DetallesFactura.Sum(d => d.Subtotal);
        public decimal MontoDescuentoTotal => (SubtotalSinDescuento * (DescuentoGeneral ?? 0)) / 100;
        public decimal SubtotalConDescuento => SubtotalSinDescuento - MontoDescuentoTotal;
        public decimal ImpuestoCalculado => (SubtotalConDescuento * (PorcentajeImpuesto ?? 0)) / 100;
        public decimal TotalCalculado => SubtotalConDescuento + ImpuestoCalculado;

        public int CantidadItems => DetallesFactura.Sum(d => d.Cantidad);
        public bool EsProforma => TipoDocumento == "Proforma";
    }
}