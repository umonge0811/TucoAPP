
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace tuco.Clases.Models
{
    [Table("DetallesPago")]
    public class DetallePago
    {
        [Key]
        public int DetallePagoId { get; set; }
        
        [Required]
        public int FacturaId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string MetodoPago { get; set; } = string.Empty;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }
        
        [StringLength(200)]
        public string? Referencia { get; set; }
        
        [StringLength(300)]
        public string? Observaciones { get; set; }
        
        [Required]
        public DateTime FechaPago { get; set; } = DateTime.Now;
        
        // Navegación
        public virtual Factura Factura { get; set; } = null!;
    }
}
