using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO optimizado para productos en dispositivos móviles
    /// </summary>
    public class ProductoMovilDTO
    {
        public int DetalleId { get; set; }
        public int ProductoId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int CantidadSistema { get; set; }
        public bool EsLlanta { get; set; }
        public string? InfoLlanta { get; set; }

        // Optimizaciones para móvil
        public string NombreCorto => Nombre.Length > 30 ? Nombre.Substring(0, 27) + "..." : Nombre;
        public string CodigoQR { get; set; } = string.Empty;
        public string CodigoBarras { get; set; } = string.Empty;

        // Estado de sincronización
        public bool SincronizadoOffline { get; set; }
        public DateTime? FechaUltimaActualizacion { get; set; }
    }
}