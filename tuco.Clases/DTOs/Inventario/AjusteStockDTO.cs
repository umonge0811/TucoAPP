// ========================================
// NUEVO DTO PARA AJUSTES RÁPIDOS DE STOCK
// Crear archivo: Tuco.Clases/DTOs/Inventario/AjusteStockRapidoDTO.cs
// ========================================

using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para realizar ajustes rápidos de stock desde la interfaz web
    /// </summary>
    public class AjusteStockRapidoDTO
    {
        /// <summary>
        /// Tipo de ajuste: entrada, salida, ajuste
        /// </summary>
        [Required(ErrorMessage = "El tipo de ajuste es requerido")]
        [RegularExpression("^(entrada|salida|ajuste)$", ErrorMessage = "Tipo de ajuste no válido. Use: entrada, salida o ajuste")]
        public string TipoAjuste { get; set; } = string.Empty;

        /// <summary>
        /// Cantidad a ajustar (positiva)
        /// </summary>
        [Required(ErrorMessage = "La cantidad es requerida")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero")]
        public int Cantidad { get; set; }

        /// <summary>
        /// Comentario o motivo del ajuste
        /// </summary>
        [MaxLength(500, ErrorMessage = "El comentario no puede exceder 500 caracteres")]
        public string? Comentario { get; set; }

        /// <summary>
        /// ID del usuario que realiza el ajuste (se llena automáticamente)
        /// </summary>
        public int? UsuarioId { get; set; }

        // ✅ NUEVOS CAMPOS PARA FINALIZACIÓN DE INVENTARIO
        public bool EsFinalizacionInventario { get; set; } = false;
        public int? InventarioProgramadoId { get; set; }
    }

    /// <summary>
    /// DTO para la respuesta del ajuste de stock rápido
    /// </summary>
    public class AjusteStockRapidoResponseDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int StockAnterior { get; set; }
        public int StockNuevo { get; set; }
        public int Diferencia { get; set; }
        public string TipoAjuste { get; set; } = string.Empty;
        public bool StockBajo { get; set; }
        public int StockMinimo { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Modelo para recibir datos desde el frontend web
    /// </summary>
    public class AjusteStockRequestModel
    {
        [Required(ErrorMessage = "El tipo de ajuste es requerido")]
        public string TipoAjuste { get; set; } = string.Empty;

        [Required(ErrorMessage = "La cantidad es requerida")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero")]
        public int Cantidad { get; set; }

        [MaxLength(500, ErrorMessage = "El comentario no puede exceder 500 caracteres")]
        public string? Comentario { get; set; }
    }
}