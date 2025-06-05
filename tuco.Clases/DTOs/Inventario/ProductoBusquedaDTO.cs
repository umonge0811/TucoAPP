using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO optimizado para mostrar productos en resultados de búsqueda
    /// </summary>
    public class ProductoBusquedaDTO
    {
        public int DetalleId { get; set; }
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string? DescripcionProducto { get; set; }

        // Información de conteo
        public int CantidadSistema { get; set; }
        public int? CantidadFisica { get; set; }
        public int? Diferencia { get; set; }
        public bool YaContado { get; set; }
        public bool TieneDiscrepancia { get; set; }

        // Información de llanta (si aplica)
        public bool EsLlanta { get; set; }
        public string? MedidaLlanta { get; set; }
        public string? MarcaLlanta { get; set; }
        public string? ModeloLlanta { get; set; }

        // Información de usuario
        public string? UsuarioConteoNombre { get; set; }
        public DateTime? FechaConteo { get; set; }

        // Relevancia de búsqueda
        public int PuntuacionRelevancia { get; set; }
        public string? CampoCoincidencia { get; set; }
    }
}