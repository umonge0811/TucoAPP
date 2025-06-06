using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para manejar ajustes pendientes durante la toma de inventario
    /// Estos ajustes NO se aplican inmediatamente al stock real
    /// </summary>
    public class AjusteInventarioPendienteDTO
    {
        public int AjusteId { get; set; }

        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        /// <summary>
        /// Tipo de ajuste a realizar
        /// </summary>
        [Required]
        [StringLength(50)]
        public string TipoAjuste { get; set; } = string.Empty;

        /// <summary>
        /// Cantidad que tenía el sistema al momento del inventario
        /// </summary>
        [Required]
        public int CantidadSistemaOriginal { get; set; }

        /// <summary>
        /// Cantidad física contada por el usuario
        /// </summary>
        [Required]
        public int CantidadFisicaContada { get; set; }

        /// <summary>
        /// Cantidad final que quedará en el sistema después del ajuste
        /// </summary>
        [Required]
        public int CantidadFinalPropuesta { get; set; }

        /// <summary>
        /// Justificación del ajuste
        /// </summary>
        [Required]
        [StringLength(500)]
        public string MotivoAjuste { get; set; } = string.Empty;

        [Required]
        public int UsuarioId { get; set; }

        public DateTime FechaCreacion { get; set; }

        /// <summary>
        /// Estado del ajuste: Pendiente, Aplicado, Rechazado
        /// </summary>
        [StringLength(20)]
        public string Estado { get; set; } = "Pendiente";

        public DateTime? FechaAplicacion { get; set; }

        // Propiedades calculadas
        public int Diferencia => CantidadFisicaContada - CantidadSistemaOriginal;
        public int CantidadAjuste => CantidadFinalPropuesta - CantidadSistemaOriginal;

        // Información adicional para la vista
        public string? NombreProducto { get; set; }
        public string? NombreUsuario { get; set; }
    }
}