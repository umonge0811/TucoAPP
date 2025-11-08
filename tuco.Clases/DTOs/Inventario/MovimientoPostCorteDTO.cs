using System;

namespace tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para representar un movimiento post-corte de inventario
    /// </summary>
    public class MovimientoPostCorteDTO
    {
        public int MovimientoPostCorteId { get; set; }
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; }
        public string TipoMovimiento { get; set; } // 'Venta', 'Ajuste', 'Traspaso', 'Devolucion'
        public int Cantidad { get; set; } // Negativo para salidas, positivo para entradas
        public int? DocumentoReferenciaId { get; set; }
        public string TipoDocumento { get; set; }
        public DateTime FechaMovimiento { get; set; }
        public bool Procesado { get; set; }
        public DateTime? FechaProcesado { get; set; }
        public int? UsuarioProcesadoId { get; set; }
        public string NombreUsuarioProcesado { get; set; }
    }
}
