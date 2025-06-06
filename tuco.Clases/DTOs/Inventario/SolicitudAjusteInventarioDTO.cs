using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para solicitar un ajuste durante la toma de inventario
    /// </summary>
    public class SolicitudAjusteInventarioDTO
    {
        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        /// <summary>
        /// Tipo de ajuste: sistema_a_fisico, reconteo, validado
        /// </summary>
        [Required]
        public string TipoAjuste { get; set; } = string.Empty;

        [Required]
        public int CantidadSistemaOriginal { get; set; }

        [Required]
        public int CantidadFisicaContada { get; set; }

        /// <summary>
        /// Solo requerido para tipo "sistema_a_fisico"
        /// </summary>
        public int? CantidadFinalPropuesta { get; set; }

        [Required]
        [StringLength(500, MinimumLength = 10)]
        public string MotivoAjuste { get; set; } = string.Empty;

        [Required]
        public int UsuarioId { get; set; }
    }
}