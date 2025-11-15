-- Script para diagnosticar por qué el código de movimientos post-corte no se ejecuta
-- en FacturacionController.CompletarFactura

PRINT '========================================';
PRINT 'DIAGNÓSTICO: ¿Por qué no se ejecuta el código de movimientos post-corte?';
PRINT '========================================';
PRINT '';

-- 1. Verificar facturas completadas recientemente
PRINT '1. Facturas completadas recientemente (estado Pagada):';
PRINT '--------------------------------------------------------';
SELECT TOP 5
    f.FacturaId,
    f.NumeroFactura,
    f.TipoDocumento,
    f.Estado,
    f.FechaActualizacion,
    (SELECT COUNT(*) FROM DetallesFactura df WHERE df.FacturaId = f.FacturaId) AS CantidadDetalles
FROM Facturas f
WHERE f.Estado = 'Pagada'
ORDER BY f.FechaActualizacion DESC;

PRINT '';
PRINT '';

-- 2. Detalles de la factura más reciente completada
PRINT '2. Detalles de la última factura completada:';
PRINT '---------------------------------------------';
DECLARE @UltimaFacturaId INT = (SELECT TOP 1 FacturaId FROM Facturas WHERE Estado = 'Pagada' ORDER BY FechaActualizacion DESC);

SELECT
    df.DetalleId,
    df.ProductoId,
    df.ServicioId,
    df.NombreProducto,
    df.Cantidad,
    CASE
        WHEN df.ServicioId IS NOT NULL AND df.ServicioId > 0 THEN '❌ ES SERVICIO - se salta con continue'
        WHEN df.ProductoId IS NULL OR df.ProductoId = 0 THEN '❌ ProductoId nulo o 0'
        WHEN df.ProductoId IS NOT NULL AND df.ProductoId > 0 THEN '✅ ES PRODUCTO - debería ejecutar'
        ELSE '⚠️ Otro caso'
    END AS Evaluacion
FROM DetallesFactura df
WHERE df.FacturaId = @UltimaFacturaId;

PRINT '';
PRINT '';

-- 3. Verificar si los productos de esa factura existen
PRINT '3. Verificar si los productos existen en la tabla Productos:';
PRINT '-------------------------------------------------------------';
SELECT
    df.ProductoId,
    df.NombreProducto AS NombreEnFactura,
    CASE
        WHEN p.ProductoId IS NOT NULL THEN '✅ Producto existe'
        ELSE '❌ Producto NO existe'
    END AS ExisteEnBD,
    p.NombreProducto AS NombreEnProductos,
    p.CantidadEnInventario AS StockActual
FROM DetallesFactura df
LEFT JOIN Productos p ON p.ProductoId = df.ProductoId
WHERE df.FacturaId = @UltimaFacturaId
  AND df.ProductoId IS NOT NULL
  AND df.ProductoId > 0;

PRINT '';
PRINT '';

-- 4. Verificar si hay inventarios en progreso
PRINT '4. Inventarios en progreso en este momento:';
PRINT '--------------------------------------------';
SELECT
    ip.InventarioProgramadoId,
    ip.NombreInventario,
    ip.FechaInicio,
    ip.FechaFin,
    ip.Estado,
    (SELECT COUNT(DISTINCT dip.ProductoId)
     FROM DetallesInventarioProgramado dip
     WHERE dip.InventarioProgramadoId = ip.InventarioProgramadoId) AS CantidadProductos
FROM InventariosProgramados ip
WHERE ip.Estado = 'En Progreso';

PRINT '';
PRINT '';

-- 5. Verificar si los productos de la factura están en inventarios en progreso
PRINT '5. ¿Los productos de la última factura están en inventarios en progreso?';
PRINT '-------------------------------------------------------------------------';
SELECT
    df.ProductoId,
    df.NombreProducto,
    COUNT(DISTINCT dip.InventarioProgramadoId) AS InventariosEnProgreso,
    CASE
        WHEN COUNT(DISTINCT dip.InventarioProgramadoId) > 0 THEN '✅ SÍ está en inventario en progreso'
        ELSE '❌ NO está en ningún inventario en progreso'
    END AS Resultado
FROM DetallesFactura df
LEFT JOIN DetallesInventarioProgramado dip ON dip.ProductoId = df.ProductoId
LEFT JOIN InventariosProgramados ip ON ip.InventarioProgramadoId = dip.InventarioProgramadoId AND ip.Estado = 'En Progreso'
WHERE df.FacturaId = @UltimaFacturaId
  AND df.ProductoId IS NOT NULL
  AND df.ProductoId > 0
GROUP BY df.ProductoId, df.NombreProducto;

PRINT '';
PRINT '';
PRINT '========================================';
PRINT 'INTERPRETACIÓN';
PRINT '========================================';
PRINT '';
PRINT 'El código NO se ejecutará si:';
PRINT '';
PRINT '❌ Sección 2: Todos los detalles son SERVICIOS (ServicioId válido)';
PRINT '   → El loop hace "continue" y salta la lógica';
PRINT '';
PRINT '❌ Sección 2: ProductoId es NULL o 0';
PRINT '   → No entra en el if (detalle.ProductoId.HasValue && detalle.ProductoId.Value > 0)';
PRINT '';
PRINT '❌ Sección 3: El producto NO existe en la tabla Productos';
PRINT '   → No entra en el if (producto != null)';
PRINT '';
PRINT '❌ Sección 4: NO hay inventarios en estado "En Progreso"';
PRINT '   → No hay inventarios para registrar movimientos';
PRINT '';
PRINT '❌ Sección 5: Los productos NO están en ningún inventario en progreso';
PRINT '   → ObtenerInventariosEnProgresoConProductoAsync devuelve lista vacía';
PRINT '   → No entra en el if (inventariosEnProgreso != null && inventariosEnProgreso.Any())';
PRINT '';
PRINT '========================================';
