
using System;

namespace Tuco.Clases.DTOs.Inventario
{
    public class DiagnosticoDetalleDTO
    {
        public int DetalleId { get; set; }
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int CantidadSistema { get; set; }
        public int? CantidadFisica { get; set; }
        public int? Diferencia { get; set; }
        public string? Observaciones { get; set; }
        public int? UsuarioConteoId { get; set; }
        public DateTime? FechaConteo { get; set; }
    }
}
namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para diagnóstico directo de la tabla DetallesInventarioProgramado
    /// Usado para consultas SQL RAW sin mapeo de Entity Framework
    /// </summary>
    public class DiagnosticoDetalleDTO
    {
        public int DetalleId { get; set; }
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int CantidadSistema { get; set; }
        public int? CantidadFisica { get; set; }      // ✅ NULLABLE - se llena durante el conteo
        public int? Diferencia { get; set; }          // ✅ NULLABLE - se calcula después del conteo
        public string? Observaciones { get; set; }    // ✅ NULLABLE - opcional
        public int? UsuarioConteoId { get; set; }     // ✅ NULLABLE - se asigna durante el conteo
        public DateTime? FechaConteo { get; set; }    // ✅ NULLABLE - se asigna durante el conteo
    }
}
