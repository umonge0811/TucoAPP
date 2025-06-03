// Ubicación: tuco.Clases/DTOs/Inventario/ProductoDTO.cs

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.ConstrainedExecution;

namespace Tuco.Clases.DTOs.Inventario
{
    public class ProductoDTO
    {
        public int ProductoId { get; set; }

        [StringLength(100, ErrorMessage = "El nombre del producto no puede tener más de 100 caracteres")]
        public string NombreProducto { get; set; } = string.Empty; // Valor por defecto

        public string? Descripcion { get; set; } // Ahora es nullable

        // Precio se mantiene para compatibilidad, pero puede ser calculado
        [Range(0.01, 999999999.99, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal? Precio { get; set; }

        // ✅ NUEVO: Costo del producto
        [Range(0.01, 999999999.99, ErrorMessage = "El costo debe ser mayor a 0")]
        [Display(Name = "Costo del Producto")]
        public decimal? Costo { get; set; }

        // ✅ NUEVO: Porcentaje de utilidad
        [Range(0, 999.99, ErrorMessage = "El porcentaje de utilidad debe estar entre 0 y 999.99")]
        [Display(Name = "Porcentaje de Utilidad (%)")]
        public decimal? PorcentajeUtilidad { get; set; }


        [Required(ErrorMessage = "La cantidad en inventario es obligatoria")]
        [Range(0, int.MaxValue, ErrorMessage = "La cantidad en inventario debe ser un número positivo")]
        public int CantidadEnInventario { get; set; }

        [Required(ErrorMessage = "El stock mínimo es obligatorio")]
        [Range(0, int.MaxValue, ErrorMessage = "El stock mínimo debe ser un número positivo")]
        public int StockMinimo { get; set; }

        // ✅ NUEVO: Propiedades calculadas para el frontend
        public decimal? UtilidadEnDinero
        {
            get
            {
                if (Costo.HasValue && PorcentajeUtilidad.HasValue)
                {
                    return Costo.Value * (PorcentajeUtilidad.Value / 100);
                }
                return null;
            }
        }

        public decimal? PrecioCalculado
        {
            get
            {
                if (Costo.HasValue && PorcentajeUtilidad.HasValue)
                {
                    return Costo.Value + UtilidadEnDinero;
                }
                return Precio ?? 0m;
            }
        }

        public bool EsLlanta { get; set; } = false;

        public DateTime? FechaUltimaActualizacion { get; set; }

        // Propiedad específica para llantas - ahora nullable
        public LlantaDTO? Llanta { get; set; }

        // Lista de imágenes asociadas
        public List<ImagenProductoDTO> Imagenes { get; set; } = new List<ImagenProductoDTO>();

        // ✅ NUEVO: Propiedad para saber si usar cálculo automático
        public bool UsarCalculoAutomatico => Costo.HasValue && PorcentajeUtilidad.HasValue;
    }
}