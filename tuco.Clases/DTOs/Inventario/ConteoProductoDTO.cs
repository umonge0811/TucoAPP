// Tuco.Clases.DTOs.Inventario/ConteoProductoDTO.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class ConteoProductoDTO
    {
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int UsuarioId { get; set; }
        public int CantidadFisica { get; set; }
        public string? Observaciones { get; set; }

        // ✅ AGREGAR ESTA PROPIEDAD QUE FALTA:
        public DateTime? FechaConteo { get; set; }
    }
}