// Ubicación: tuco.Clases/DTOs/Inventario/ProductoDTO.cs

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class ProductoDTO
    {
        public int ProductoId { get; set; }

        [Required(ErrorMessage = "El nombre del producto es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre del producto no puede tener más de 100 caracteres")]
        public string NombreProducto { get; set; } = string.Empty; // Valor por defecto

        public string? Descripcion { get; set; } // Ahora es nullable

        [Required(ErrorMessage = "El precio es obligatorio")]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor que cero")]
        public decimal Precio { get; set; }

        [Required(ErrorMessage = "La cantidad en inventario es obligatoria")]
        [Range(0, int.MaxValue, ErrorMessage = "La cantidad en inventario debe ser un número positivo")]
        public int CantidadEnInventario { get; set; }

        [Required(ErrorMessage = "El stock mínimo es obligatorio")]
        [Range(0, int.MaxValue, ErrorMessage = "El stock mínimo debe ser un número positivo")]
        public int StockMinimo { get; set; }

        public DateTime? FechaUltimaActualizacion { get; set; }

        // Propiedad específica para llantas - ahora nullable
        public LlantaDTO? Llanta { get; set; }

        // Lista de imágenes asociadas
        public List<ImagenProductoDTO> Imagenes { get; set; } = new List<ImagenProductoDTO>();
    }
}