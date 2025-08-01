
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class SolicitudReconteoDTO
    {
        [Required(ErrorMessage = "El motivo es obligatorio")]
        [StringLength(500, ErrorMessage = "El motivo no puede exceder 500 caracteres")]
        public string Motivo { get; set; } = string.Empty;

        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        
        /// <summary>
        /// ID del usuario que solicita el reconteo
        /// </summary>
        public int? UsuarioSolicitanteId { get; set; }
        
        /// <summary>
        /// Información adicional sobre la discrepancia encontrada
        /// </summary>
        public string? InformacionDiscrepancia { get; set; }
    }
}
