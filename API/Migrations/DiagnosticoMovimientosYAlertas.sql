-- Script de diagnóstico para verificar movimientos post-corte y alertas
-- Este script ayuda a identificar por qué las alertas muestran "Ajuste" en lugar de "Venta"

PRINT '========================================';
PRINT '1. MOVIMIENTOS POST-CORTE RECIENTES';
PRINT '========================================';

-- Verificar los 20 movimientos más recientes y su tipo
SELECT TOP 20
    m.MovimientoPostCorteId,
    m.InventarioProgramadoId,
    m.ProductoId,
    p.NombreProducto,
    m.TipoMovimiento,
    m.TipoDocumento,
    m.Cantidad,
    m.FechaMovimiento,
    m.DocumentoReferenciaId
FROM MovimientosPostCorte m
LEFT JOIN Productos p ON p.ProductoId = m.ProductoId
ORDER BY m.FechaMovimiento DESC;

PRINT '';
PRINT '========================================';
PRINT '2. CONTEO DE MOVIMIENTOS POR TIPO';
PRINT '========================================';

-- Ver cuántos movimientos hay de cada tipo
SELECT
    TipoMovimiento,
    COUNT(*) AS CantidadMovimientos,
    MIN(FechaMovimiento) AS PrimerMovimiento,
    MAX(FechaMovimiento) AS UltimoMovimiento
FROM MovimientosPostCorte
GROUP BY TipoMovimiento
ORDER BY TipoMovimiento;

PRINT '';
PRINT '========================================';
PRINT '3. ALERTAS RECIENTES Y SUS MOVIMIENTOS';
PRINT '========================================';

-- Ver las alertas más recientes y el tipo de movimiento asociado
SELECT TOP 20
    a.AlertaId,
    a.ProductoId,
    p.NombreProducto,
    a.InventarioProgramadoId,
    a.MovimientoPostCorteId,
    m.TipoMovimiento,
    m.TipoDocumento,
    m.Cantidad,
    m.FechaMovimiento AS FechaMovimiento,
    a.FechaCreacion AS FechaAlerta,
    a.Estado
FROM AlertasInventario a
LEFT JOIN Productos p ON p.ProductoId = a.ProductoId
LEFT JOIN MovimientosPostCorte m ON m.MovimientoPostCorteId = a.MovimientoPostCorteId
WHERE a.TipoAlerta = 'MovimientoPostCorte'
ORDER BY a.FechaCreacion DESC;

PRINT '';
PRINT '========================================';
PRINT '4. ALERTAS SIN MOVIMIENTO ASIGNADO';
PRINT '========================================';

-- Verificar si hay alertas sin MovimientoPostCorteId
SELECT
    COUNT(*) AS AlertasSinMovimiento
FROM AlertasInventario
WHERE TipoAlerta = 'MovimientoPostCorte'
  AND MovimientoPostCorteId IS NULL;

PRINT '';
PRINT '========================================';
PRINT '5. MOVIMIENTOS DE VENTA (FACTURACION)';
PRINT '========================================';

-- Ver específicamente los movimientos de tipo "Venta"
SELECT
    m.MovimientoPostCorteId,
    m.InventarioProgramadoId,
    m.ProductoId,
    p.NombreProducto,
    m.TipoMovimiento,
    m.TipoDocumento,
    m.DocumentoReferenciaId AS FacturaId,
    m.Cantidad,
    m.FechaMovimiento
FROM MovimientosPostCorte m
LEFT JOIN Productos p ON p.ProductoId = m.ProductoId
WHERE m.TipoMovimiento = 'Venta'
ORDER BY m.FechaMovimiento DESC;

PRINT '';
PRINT '========================================';
PRINT '6. ALERTAS VINCULADAS A VENTAS';
PRINT '========================================';

-- Ver alertas que están vinculadas a movimientos de tipo "Venta"
SELECT
    a.AlertaId,
    a.ProductoId,
    p.NombreProducto,
    a.MovimientoPostCorteId,
    m.TipoMovimiento,
    m.TipoDocumento,
    m.DocumentoReferenciaId AS FacturaId,
    m.Cantidad,
    m.FechaMovimiento,
    a.Estado
FROM AlertasInventario a
INNER JOIN MovimientosPostCorte m ON m.MovimientoPostCorteId = a.MovimientoPostCorteId
LEFT JOIN Productos p ON p.ProductoId = a.ProductoId
WHERE m.TipoMovimiento = 'Venta'
ORDER BY a.FechaCreacion DESC;

PRINT '';
PRINT '========================================';
PRINT 'RESUMEN DEL DIAGNÓSTICO';
PRINT '========================================';
PRINT 'Si NO hay movimientos de tipo "Venta" en la sección 5:';
PRINT '  → El backend no se ha reiniciado después de los cambios en el código';
PRINT '  → O los cambios no se aplicaron correctamente';
PRINT '';
PRINT 'Si hay movimientos de tipo "Venta" pero las alertas muestran "Ajuste":';
PRINT '  → Las alertas están vinculadas a movimientos antiguos de tipo "Ajuste"';
PRINT '  → Esto ocurrió con el script de migración que asignó el movimiento más reciente';
PRINT '  → Necesita crear NUEVAS facturas para ver alertas con tipo "Venta"';
PRINT '========================================';
