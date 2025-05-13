// Ubicación: tuco.Clases/DTOs/Inventario/ImagenProductoDTO.cs

namespace Tuco.Clases.DTOs.Inventario
{
    public class ImagenProductoDTO
    {
        public int ImagenId { get; set; }
        public int ProductoId { get; set; }
        public string Urlimagen { get; set; }
        public string Descripcion { get; set; }
        public DateTime? FechaCreacion { get; set; }
    }
}