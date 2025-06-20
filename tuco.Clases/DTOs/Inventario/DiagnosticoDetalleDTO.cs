
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para diagnóstico de detalles de inventario usando SQL directo
    /// Específicamente diseñado para evitar problemas de mapeo con Entity Framework
    /// </summary>
    public class DiagnosticoDetalleDTO
    {
        public int DetalleId { get; set; }
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int CantidadSistema { get; set; }
        public int? CantidadFisica { get; set; }
        public int? Diferencia { get; set; }
        public string Observaciones { get; set; } = "";
        public int? UsuarioConteoId { get; set; }
        public DateTime? FechaConteo { get; set; }
    }
}
