// Tuco.Clases.DTOs.Inventario/ConteoProductoDTO.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    public class ConteoProductoDTO
    {
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int CantidadFisica { get; set; }
        public string? Observaciones { get; set; }
        public int UsuarioId { get; set; }
        public DateTime FechaConteo { get; set; } = DateTime.Now;
    }
}