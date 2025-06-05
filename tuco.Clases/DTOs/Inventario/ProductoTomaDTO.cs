// =============================================
// PASO 1B: PRODUCTO OPTIMIZADO PARA TOMA FÍSICA
// Ubicación: tuco.Clases/DTOs/Inventario/ProductoTomaDTO.cs
// =============================================

using System.ComponentModel.DataAnnotations;

namespace Tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para cada producto en la toma de inventario
    /// Diseñado específicamente para facilitar el conteo físico
    /// Extiende la funcionalidad del ProductoDTO existente
    /// </summary>
    public class ProductoTomaDTO
    {
        public int ProductoId { get; set; }
        public int DetalleInventarioId { get; set; }

        // Información básica del producto (similar a ProductoDTO)
        public string NombreProducto { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal? Precio { get; set; }

        // Códigos para escaneo (NUEVO para toma física)
        public string? CodigoBarras { get; set; }
        public string? CodigoQR { get; set; }
        public string? CodigoInterno { get; set; }

        // Información de inventario (del DetalleInventarioProgramado)
        public int CantidadSistema { get; set; }
        public int? CantidadFisica { get; set; }
        public int? Diferencia { get; set; }
        public string? Observaciones { get; set; }

        // Estado del conteo (NUEVO para toma física)
        public bool YaContado { get; set; }
        public bool TieneDiscrepancia { get; set; }
        public DateTime? FechaConteo { get; set; }
        public string? UsuarioConteoNombre { get; set; }

        // Información para facilitar ubicación (NUEVO para eficiencia)
        public string? Ubicacion { get; set; }
        public string? Pasillo { get; set; }
        public string? Estante { get; set; }
        public string? Zona { get; set; }

        // Información específica de llantas (reutilizando LlantaDTO existente)
        public bool EsLlanta { get; set; }
        public LlantaTomaDTO? Llanta { get; set; }

        // Imágenes para identificación (reutilizando ImagenProductoDTO)
        public List<ImagenProductoDTO> Imagenes { get; set; } = new List<ImagenProductoDTO>();
        public string? ImagenPrincipal { get; set; }

        // Propiedades calculadas para la interfaz
        public string DescripcionCompleta =>
            $"{NombreProducto}{(!string.IsNullOrEmpty(Descripcion) ? $" - {Descripcion}" : "")}";

        public string UbicacionCompleta =>
            !string.IsNullOrEmpty(Ubicacion) ? Ubicacion :
            !string.IsNullOrEmpty(Pasillo) && !string.IsNullOrEmpty(Estante) ?
            $"Pasillo {Pasillo}, Estante {Estante}" : "Sin ubicación";

        public string EstadoConteo =>
            YaContado ? (TieneDiscrepancia ? "Contado con discrepancia" : "Contado OK") : "Pendiente";
    }

    

   
   

}