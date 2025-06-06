﻿using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para manejar los detalles de un producto en un inventario programado
    /// Contiene información del producto y del progreso del conteo
    /// </summary>
    public class DetalleInventarioDTO
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
        public string? NombreUsuarioConteo { get; set; }

        // Información del producto
        public string NombreProducto { get; set; } = string.Empty;
        public string? DescripcionProducto { get; set; }
        public string? ImagenUrl { get; set; }

        // Información específica de llantas
        public bool EsLlanta { get; set; }
        public string? MedidasLlanta { get; set; }
        public string? MarcaLlanta { get; set; }
        public string? ModeloLlanta { get; set; }

        // Estados calculados
        public string EstadoConteo { get; set; } = "Pendiente";
        public bool TieneDiscrepancia { get; set; }
    }



}