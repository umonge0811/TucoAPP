using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

// ==========================================
// ARCHIVO: Tuco.Clases/DTOs/Inventario/ResultadoOperacionDTO.cs
// ==========================================

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para resultados de operaciones de inventario
    /// Compatible con el controlador existente
    /// </summary>
    public class ResultadoOperacionDTO
    {
        /// <summary>
        /// Indica si la operación fue exitosa
        /// </summary>
        public bool Exitoso { get; set; }

        /// <summary>
        /// Mensaje descriptivo del resultado
        /// </summary>
        public string Mensaje { get; set; } = string.Empty;

        /// <summary>
        /// Número de productos generados (para inicio de inventario)
        /// </summary>
        public int? ProductosGenerados { get; set; }

        /// <summary>
        /// Número de usuarios notificados
        /// </summary>
        public int? UsuariosNotificados { get; set; }

        /// <summary>
        /// Total de productos en el inventario
        /// </summary>
        public int? TotalProductos { get; set; }

        /// <summary>
        /// Número de discrepancias encontradas
        /// </summary>
        public int? Discrepancias { get; set; }

        /// <summary>
        /// Marca de tiempo de la operación
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.Now;

        /// <summary>
        /// Datos adicionales opcionales
        /// </summary>
        public Dictionary<string, object>? DatosAdicionales { get; set; }

        /// <summary>
        /// Código de error si la operación falló
        /// </summary>
        public string? CodigoError { get; set; }

        /// <summary>
        /// Detalles del error para debugging
        /// </summary>
        public string? ErrorDetalle { get; set; }

        // ==========================================
        // MÉTODOS DE CONVENIENCIA
        // ==========================================

        /// <summary>
        /// Crea un resultado exitoso
        /// </summary>
        public static ResultadoOperacionDTO Exito(string mensaje, int? productosGenerados = null)
        {
            return new ResultadoOperacionDTO
            {
                Exitoso = true,
                Mensaje = mensaje,
                ProductosGenerados = productosGenerados
            };
        }

        /// <summary>
        /// Crea un resultado de error
        /// </summary>
        public static ResultadoOperacionDTO Error(string mensaje, string? codigoError = null)
        {
            return new ResultadoOperacionDTO
            {
                Exitoso = false,
                Mensaje = mensaje,
                CodigoError = codigoError
            };
        }

        /// <summary>
        /// Crea un resultado exitoso con estadísticas
        /// </summary>
        public static ResultadoOperacionDTO ExitoConEstadisticas(
            string mensaje,
            int? totalProductos = null,
            int? discrepancias = null,
            int? usuariosNotificados = null)
        {
            return new ResultadoOperacionDTO
            {
                Exitoso = true,
                Mensaje = mensaje,
                TotalProductos = totalProductos,
                Discrepancias = discrepancias,
                UsuariosNotificados = usuariosNotificados
            };
        }
    }
}