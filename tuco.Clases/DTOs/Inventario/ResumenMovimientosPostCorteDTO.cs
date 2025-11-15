using System;
using System.Collections.Generic;

namespace tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO que agrupa los movimientos post-corte por producto
    /// </summary>
    public class ResumenMovimientosPostCorteDTO
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; }
        public int TotalMovimientos { get; set; } // Suma algebraica de movimientos
        public int CantidadVentas { get; set; }
        public int CantidadDevoluciones { get; set; }
        public int CantidadAjustes { get; set; }
        public int CantidadTraspasos { get; set; }
        public DateTime? UltimoMovimiento { get; set; }
        public List<MovimientoPostCorteDTO> Detalles { get; set; } // Lista de movimientos individuales

        public ResumenMovimientosPostCorteDTO()
        {
            Detalles = new List<MovimientoPostCorteDTO>();
        }
    }
}
