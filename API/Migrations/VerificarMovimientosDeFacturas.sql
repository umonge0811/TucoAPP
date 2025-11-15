-- =====================================================
-- VERIFICACIÓN ESPECÍFICA DE MOVIMIENTOS DE FACTURAS
-- =====================================================
-- Este script verifica si el backend está creando correctamente
-- movimientos de tipo "Venta" cuando se completan facturas

PRINT '========================================';
PRINT 'VERIFICACIÓN: MOVIMIENTOS DE FACTURAS';
PRINT '========================================';
PRINT '';

-- 1. ¿Existen movimientos con TipoDocumento = "Factura"?
PRINT '1. ¿Hay movimientos vinculados a facturas?';
PRINT '-------------------------------------------';
SELECT
    COUNT(*) AS TotalMovimientosFactura,
    MIN(FechaMovimiento) AS PrimerMovimiento,
    MAX(FechaMovimiento) AS UltimoMovimiento
FROM MovimientosPostCorte
WHERE TipoDocumento = 'Factura';

PRINT '';
PRINT '';

-- 2. Ver todos los movimientos de tipo "Factura"
PRINT '2. Detalle de movimientos vinculados a facturas:';
PRINT '-------------------------------------------------';
SELECT
    m.MovimientoPostCorteId,
    m.ProductoId,
    p.NombreProducto,
    m.TipoMovimiento AS '***TIPO_MOVIMIENTO***',
    m.TipoDocumento,
    m.DocumentoReferenciaId AS FacturaId,
    m.Cantidad,
    m.FechaMovimiento,
    m.Procesado
FROM MovimientosPostCorte m
LEFT JOIN Productos p ON p.ProductoId = m.ProductoId
WHERE m.TipoDocumento = 'Factura'
ORDER BY m.FechaMovimiento DESC;

PRINT '';
PRINT '';

-- 3. Comparar: Movimientos de "Factura" vs "AjusteManual"
PRINT '3. Comparación: Facturas vs Ajustes Manuales:';
PRINT '----------------------------------------------';
SELECT
    TipoDocumento,
    TipoMovimiento,
    COUNT(*) AS Cantidad,
    MIN(FechaMovimiento) AS PrimerRegistro,
    MAX(FechaMovimiento) AS UltimoRegistro
FROM MovimientosPostCorte
WHERE TipoDocumento IN ('Factura', 'AjusteManual')
GROUP BY TipoDocumento, TipoMovimiento
ORDER BY TipoDocumento, TipoMovimiento;

PRINT '';
PRINT '';

-- 4. Verificar facturas completadas recientemente
PRINT '4. Facturas completadas recientemente:';
PRINT '---------------------------------------';
SELECT TOP 10
    f.FacturaId,
    f.NumeroFactura,
    f.Estado,
    f.Total,
    f.FechaCreacion,
    f.FechaActualizacion,
    (SELECT COUNT(*)
     FROM MovimientosPostCorte m
     WHERE m.TipoDocumento = 'Factura'
       AND m.DocumentoReferenciaId = f.FacturaId) AS MovimientosRegistrados
FROM Facturas f
WHERE f.Estado = 'Pagada'
ORDER BY f.FechaActualizacion DESC;

PRINT '';
PRINT '';

-- 5. Facturas SIN movimientos post-corte
PRINT '5. Facturas completadas pero SIN movimientos registrados:';
PRINT '----------------------------------------------------------';
SELECT
    f.FacturaId,
    f.NumeroFactura,
    f.Estado,
    f.FechaActualizacion
FROM Facturas f
WHERE f.Estado = 'Pagada'
  AND f.FechaActualizacion >= DATEADD(DAY, -7, GETDATE()) -- Últimos 7 días
  AND NOT EXISTS (
      SELECT 1
      FROM MovimientosPostCorte m
      WHERE m.TipoDocumento = 'Factura'
        AND m.DocumentoReferenciaId = f.FacturaId
  )
ORDER BY f.FechaActualizacion DESC;

PRINT '';
PRINT '';
PRINT '========================================';
PRINT 'INTERPRETACIÓN DE RESULTADOS';
PRINT '========================================';
PRINT '';
PRINT 'CASO 1: NO hay movimientos con TipoDocumento = "Factura"';
PRINT '   → El backend NO se ha reiniciado después de git pull';
PRINT '   → El código nuevo NO se está ejecutando';
PRINT '   → SOLUCIÓN: Reinicie el backend completamente';
PRINT '';
PRINT 'CASO 2: SÍ hay movimientos con TipoDocumento = "Factura" pero TipoMovimiento = "Ajuste"';
PRINT '   → Hay un BUG en el código (muy improbable según revisión)';
PRINT '   → Contacte al desarrollador';
PRINT '';
PRINT 'CASO 3: SÍ hay movimientos con TipoDocumento = "Factura" Y TipoMovimiento = "Venta"';
PRINT '   → El sistema está funcionando CORRECTAMENTE';
PRINT '   → Las alertas que muestran "Ajuste" son ANTIGUAS';
PRINT '   → Fueron actualizadas por el script de migración';
PRINT '   → SOLUCIÓN: Complete una NUEVA factura y verifique esa alerta';
PRINT '';
PRINT 'CASO 4: Hay facturas recientes SIN movimientos';
PRINT '   → Las facturas se completaron cuando no había inventarios en progreso';
PRINT '   → O los productos facturados no están en ningún inventario en progreso';
PRINT '   → Esto es NORMAL si no hay inventarios activos';
PRINT '';
PRINT '========================================';
