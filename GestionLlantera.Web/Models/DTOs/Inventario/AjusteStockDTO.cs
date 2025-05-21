// Tuco.Clases.DTOs.Inventario/AjusteStockDTO.cs
using System;

namespace Tuco.Clases.DTOs.Inventario
{
    public class AjusteStockDTO
    {
        public int DetalleId { get; set; }
        public int NuevoStock { get; set; }
        public string Motivo { get; set; }
        public int UsuarioId { get; set; }
    }
}