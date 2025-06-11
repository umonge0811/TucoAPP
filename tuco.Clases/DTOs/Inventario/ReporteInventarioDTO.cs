public class ReporteInventarioDTO
{
    // Información del inventario
    public int InventarioProgramadoId { get; set; }
    public string Titulo { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string UsuarioCreador { get; set; }

    // Resumen ejecutivo
    public int TotalProductosContados { get; set; }
    public int ProductosConDiscrepancia { get; set; }
    public decimal PorcentajeDiscrepancia { get; set; }
    public decimal ValorTotalDiscrepancia { get; set; }

    // Detalles por producto
    public List<ProductoInventarioReporteDTO> Productos { get; set; }

    // Estadísticas
    public int ProductosConExceso { get; set; }
    public int ProductosConFaltante { get; set; }
    public decimal ValorExceso { get; set; }
    public decimal ValorFaltante { get; set; }

    public DateTime FechaGeneracionReporte { get; set; }
}

public class ProductoInventarioReporteDTO
{
    public string NombreProducto { get; set; }
    public int CantidadSistema { get; set; }
    public int CantidadFisica { get; set; }
    public int Diferencia { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal ImpactoEconomico { get; set; }
    public string Categoria { get; set; } // "Exceso", "Faltante", "Correcto"
    public string UsuarioConteo { get; set; }
    public DateTime? FechaConteo { get; set; }
}