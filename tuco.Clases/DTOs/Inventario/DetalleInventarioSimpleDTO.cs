namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO súper simple para depurar - Solo datos de la tabla DetallesInventarioProgramado
    /// </summary>
    public class DetalleInventarioSimpleDTO
    {
        public int DetalleId { get; set; }
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int CantidadSistema { get; set; }
        public int? CantidadFisica { get; set; }
        public int? Diferencia { get; set; }
        public string? Observaciones { get; set; }
        public DateTime? FechaConteo { get; set; }
        public int? UsuarioConteoId { get; set; }

        // Solo campos calculados básicos
        public string EstadoConteo { get; set; } = "Pendiente";
        public bool TieneDiscrepancia { get; set; }
    }
}