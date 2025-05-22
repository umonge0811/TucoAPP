// Ubicación: tuco.Clases/DTOs/Inventario/ImagenProductoDTO.cs

using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class ImagenProductoDTO
    {
        public int ImagenId { get; set; }

        public int ProductoId { get; set; }

        [Required]
        public string UrlImagen { get; set; }

        public string Descripcion { get; set; }

        public DateTime FechaCreacion { get; set; }
    }
}