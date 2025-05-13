using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs.Inventario
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