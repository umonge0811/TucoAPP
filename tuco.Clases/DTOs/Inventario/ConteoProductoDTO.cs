// Tuco.Clases.DTOs.Inventario/ConteoProductoDTO.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO específico para registrar conteos (más ligero)
    /// </summary>
    public class ConteoProductoDTO
    {
        /// <summary>
        /// ID del inventario programado
        /// </summary>
        [Required]
        public int InventarioProgramadoId { get; set; }

        /// <summary>
        /// ID del producto a contar
        /// </summary>
        [Required]
        public int ProductoId { get; set; }

        /// <summary>
        /// Cantidad contada físicamente
        /// </summary>
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "La cantidad física debe ser mayor o igual a 0")]
        public int CantidadFisica { get; set; }

        /// <summary>
        /// Observaciones del conteo (opcional)
        /// </summary>
        [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder 500 caracteres")]
        public string? Observaciones { get; set; }

        /// <summary>
        /// ID del usuario que realiza el conteo (se establece automáticamente)
        /// </summary>
        public int UsuarioId { get; set; }

        /// <summary>
        /// Indica si es un reconteo (para tracking)
        /// </summary>
        public bool EsReconteo { get; set; } = false;

        /// <summary>
        /// Coordenadas GPS donde se realizó el conteo (opcional, para inventarios móviles)
        /// </summary>
        public string? Ubicacion { get; set; }
    }
}