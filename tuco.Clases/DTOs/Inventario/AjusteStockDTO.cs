// Tuco.Clases/DTOs/Inventario/AjusteStockDTO.cs (nuevo)
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class AjusteStockDTO
    {
        [Required]
        public string TipoAjuste { get; set; } // "entrada", "salida", "ajuste"

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor que cero")]
        public int Cantidad { get; set; }

        public string Comentario { get; set; }
    }
}