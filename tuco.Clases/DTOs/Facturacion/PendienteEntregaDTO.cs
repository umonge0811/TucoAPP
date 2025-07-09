using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class PendienteEntregaDTO
    {
        public int Id { get; set; }

        public int FacturaId { get; set; }
        public string? NumeroFactura { get; set; }

        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string? DescripcionProducto { get; set; }

        public int CantidadSolicitada { get; set; }
        public int CantidadPendiente { get; set; }

        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaEntrega { get; set; }

        [Required]
        public string Estado { get; set; } = "Pendiente";

        public string? Observaciones { get; set; }

        public int UsuarioCreacion { get; set; }
        public string? NombreUsuarioCreacion { get; set; }

        public int? UsuarioEntrega { get; set; }
        public string? NombreUsuarioEntrega { get; set; }

        // Información del cliente
        public string? NombreCliente { get; set; }
        public string? TelefonoCliente { get; set; }
        public string? EmailCliente { get; set; }

        // Información del producto
        public decimal? PrecioUnitario { get; set; }
        public int? StockActual { get; set; }

        // Campos calculados
        public int DiasDesdeCreacion => (DateTime.Now - FechaCreacion).Days;
        public bool EsUrgente => DiasDesdeCreacion > 7;
        public decimal? MontoTotalPendiente => PrecioUnitario * CantidadPendiente;
    }

    public class EntregarPendienteRequest
    {
        [Required]
        public int Id { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        public int CantidadEntregada { get; set; }

        [StringLength(500, ErrorMessage = "Las observaciones no pueden tener más de 500 caracteres")]
        public string? ObservacionesEntrega { get; set; }

        public DateTime FechaEntrega { get; set; } = DateTime.Now;
    }

    public class ConsultarPendientesRequest
    {
        public string? Estado { get; set; } // Pendiente, Entregado, Cancelado
        public int? ClienteId { get; set; }
        public int? ProductoId { get; set; }
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }
        public bool SoloUrgentes { get; set; } = false;
        public int Pagina { get; set; } = 1;
        public int TamanoPagina { get; set; } = 20;
    }
}