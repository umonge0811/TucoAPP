using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para registrar el conteo de un producto específico
    /// Mejora y extiende el ConteoProductoDTO existente
    /// </summary>
    public class RegistrarConteoDTO
    {
        [Required]
        public int InventarioProgramadoId { get; set; }

        [Required]
        public int ProductoId { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "La cantidad física debe ser mayor o igual a 0")]
        public int CantidadFisica { get; set; }

        [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder 500 caracteres")]
        public string? Observaciones { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        // Información adicional para auditoria y validación
        public DateTime FechaConteo { get; set; } = DateTime.Now;
        public bool ForzarGuardado { get; set; } = false; // Para discrepancias grandes
        public string? MetodoConteo { get; set; } // "Manual", "Escaner", "Codigo"
        public string? UbicacionConteo { get; set; } // Donde se realizó el conteo

        // Información del dispositivo (útil para auditoría)
        public string? DispositivoInfo { get; set; }
        public string? IPAddress { get; set; }
    }
}
