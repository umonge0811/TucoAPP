
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para solicitar el reconteo de un producto específico
    /// </summary>
    public class SolicitudReconteoDTO
    {
        /// <summary>
        /// ID del usuario específico al que se le solicita el reconteo (opcional)
        /// Si no se especifica, se notifica al usuario que hizo el conteo original
        /// </summary>
        public int? UsuarioAsignadoId { get; set; }

        /// <summary>
        /// Motivo por el cual se solicita el reconteo
        /// </summary>
        [StringLength(500)]
        public string? Motivo { get; set; }

        /// <summary>
        /// Observaciones adicionales para el reconteo
        /// </summary>
        [StringLength(1000)]
        public string? Observaciones { get; set; }

        /// <summary>
        /// Prioridad del reconteo (opcional)
        /// </summary>
        public string Prioridad { get; set; } = "Normal";
    }
}
