using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class FacturaDTO
    {
        public int FacturaId { get; set; }

        [Required(ErrorMessage = "El número de factura es requerido")]
        public string NumeroFactura { get; set; } = string.Empty;

        [Required]
        public int ClienteId { get; set; }

        [Required(ErrorMessage = "El nombre del cliente es requerido")]
        [StringLength(200, ErrorMessage = "El nombre no puede tener más de 200 caracteres")]
        public string NombreCliente { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "El formato del email no es válido")]
        public string? EmailCliente { get; set; }

        [StringLength(300, ErrorMessage = "La dirección no puede tener más de 300 caracteres")]
        public string? DireccionCliente { get; set; }

        [Phone(ErrorMessage = "El formato del teléfono no es válido")]
        public string? TelefonoCliente { get; set; }

        [Required]
        public string MetodoPago { get; set; } = "efectivo";

        [Range(0.01, double.MaxValue, ErrorMessage = "El total debe ser mayor a 0")]
        public decimal MontoTotal { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "El subtotal debe ser mayor o igual a 0")]
        public decimal MontoSubtotal { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "El IVA debe ser mayor o igual a 0")]
        public decimal MontoIVA { get; set; }

        public decimal? EfectivoRecibido { get; set; }

        public decimal? Cambio { get; set; }

        [StringLength(500, ErrorMessage = "Las observaciones no pueden tener más de 500 caracteres")]
        public string? Observaciones { get; set; }

        [Required]
        public DateTime FechaFactura { get; set; } = DateTime.Now;

        [Required]
        public List<ProductoVentaDTO> Productos { get; set; } = new List<ProductoVentaDTO>();

        // Propiedades calculadas
        public int TotalProductos => Productos?.Count ?? 0;
        public int TotalCantidadItems => Productos?.Sum(p => p.Cantidad) ?? 0;

        [Required]
        public string Estado { get; set; } = "Pendiente";

        [Required]
        public string TipoDocumento { get; set; } = "Factura";

        public int UsuarioCreadorId { get; set; }
        public string? UsuarioCreadorNombre { get; set; }

        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}