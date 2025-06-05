using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO optimizado para dispositivos móviles con información esencial del inventario
    /// </summary>
    public class InventarioMovilDTO
    {
        public bool Exitoso { get; set; }
        public string Mensaje { get; set; } = string.Empty;

        // Información básica del inventario
        public int InventarioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;

        // Permisos del usuario actual
        public bool PermisoConteo { get; set; }
        public bool PermisoAjuste { get; set; }
        public bool PermisoValidacion { get; set; }

        // Progreso condensado
        public ProgresoInventarioDTO? Progreso { get; set; }

        // Productos para caché offline (limitados)
        public List<ProductoMovilDTO> ProductosPendientes { get; set; } = new List<ProductoMovilDTO>();

        // Información de sincronización
        public DateTime FechaSincronizacion { get; set; }
        public bool ModoOffline { get; set; }
        public int CantidadMaximaOffline { get; set; } = 50;
    }
}