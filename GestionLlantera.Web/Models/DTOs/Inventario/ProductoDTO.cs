using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace GestionLlantera.Web.Models.DTOs.Inventario
{
    public class ProductoDTO
    {
        public int ProductoId { get; set; }

        [Required(ErrorMessage = "El nombre del producto es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres")]
        [Display(Name = "Nombre del Producto")]
        public string NombreProducto { get; set; }

        [Display(Name = "Descripción")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio es obligatorio")]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor que cero")]
        [Display(Name = "Precio")]
        public decimal Precio { get; set; }

        [Display(Name = "Cantidad en Inventario")]
        [Range(0, int.MaxValue, ErrorMessage = "La cantidad debe ser un número positivo")]
        public int CantidadEnInventario { get; set; }

        [Display(Name = "Stock Mínimo")]
        [Range(0, int.MaxValue, ErrorMessage = "El stock mínimo debe ser un número positivo")]
        public int StockMinimo { get; set; }

        public bool EsLlanta { get; set; } = false;

        // Imágenes del producto (para la carga)
        [Display(Name = "Imágenes del Producto")]
        public List<IFormFile> ImagenesArchivos { get; set; } = new List<IFormFile>();

        // Imágenes ya guardadas (para mostrar)
        public List<ImagenProductoDTO> Imagenes { get; set; } = new List<ImagenProductoDTO>();

        // Para llantas (opcional si el producto es una llanta)
        public LlantaDTO Llanta { get; set; }

        // Indica si el producto tiene pedidos pendientes de ingresar
        public bool TienePedidoPendiente { get; set; } = false;
    }
}