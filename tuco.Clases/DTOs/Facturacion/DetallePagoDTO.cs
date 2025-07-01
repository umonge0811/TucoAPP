
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Facturacion
{
    public class DetallePagoDTO
    {
        public int DetallePagoId { get; set; }
        
        [Required(ErrorMessage = "El método de pago es requerido")]
        public string MetodoPago { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "El monto es requerido")]
        [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0")]
        public decimal Monto { get; set; }
        
        [StringLength(200, ErrorMessage = "La referencia no puede tener más de 200 caracteres")]
        public string? Referencia { get; set; }
        
        [StringLength(300, ErrorMessage = "Las observaciones no pueden tener más de 300 caracteres")]
        public string? Observaciones { get; set; }
        
        public DateTime FechaPago { get; set; } = DateTime.Now;
        
        // Propiedades calculadas
        public decimal PorcentajeDelTotal { get; set; }
        public string DescripcionMetodo => MetodoPago switch
        {
            "efectivo" => "Efectivo",
            "transferencia" => "Transferencia",
            "sinpe" => "SINPE Móvil",
            "tarjeta" => "Tarjeta",
            _ => MetodoPago
        };
    }
}
