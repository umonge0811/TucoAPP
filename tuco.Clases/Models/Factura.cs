using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace tuco.Clases.Models
{
    public partial class Factura
    {
        public int FacturaId { get; set; }

        [Required]
        public string NumeroFactura { get; set; } = null!;

        public int? ClienteId { get; set; }

        [Required]
        public string NombreCliente { get; set; } = null!;

        public string? IdentificacionCliente { get; set; }

        public string? TelefonoCliente { get; set; }

        public string? EmailCliente { get; set; }

        public string? DireccionCliente { get; set; }

        [Required]
        public DateTime FechaFactura { get; set; }

        public DateTime? FechaVencimiento { get; set; }

        [Required]
        public decimal Subtotal { get; set; }

        public decimal? DescuentoGeneral { get; set; }

        public decimal? PorcentajeImpuesto { get; set; }

        public decimal? MontoImpuesto { get; set; }

        [Required]
        public decimal Total { get; set; }

        [Required]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Pagada, Anulada, Vigente, En Edición

        [Required]
        public string TipoDocumento { get; set; } = "Factura"; // Factura, Proforma

        public string? MetodoPago { get; set; }

        public string? Observaciones { get; set; }

        [Required]
        public int UsuarioCreadorId { get; set; }

        public DateTime FechaCreacion { get; set; }

        public DateTime? FechaActualizacion { get; set; }

        // Propiedades de navegación
        public virtual Cliente? Cliente { get; set; }
        public virtual ICollection<DetalleFactura> DetallesFactura { get; set; } = new List<DetalleFactura>();
        public virtual ICollection<DetallePago> DetallesPago { get; set; } = new List<DetallePago>();
        public virtual Usuario UsuarioCreador { get; set; } = null!;
    }
}