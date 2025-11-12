-- Script para actualizar alertas existentes sin MovimientoPostCorteId
-- Este script asigna el movimiento post-corte más reciente de cada producto a las alertas antiguas

-- Actualizar alertas que no tienen MovimientoPostCorteId asignado
UPDATE a
SET a.MovimientoPostCorteId = m.MovimientoPostCorteId
FROM AlertasInventario a
CROSS APPLY (
    SELECT TOP 1 MovimientoPostCorteId
    FROM MovimientosPostCorte m
    WHERE m.InventarioProgramadoId = a.InventarioProgramadoId
      AND m.ProductoId = a.ProductoId
    ORDER BY m.FechaMovimiento DESC
) m
WHERE a.MovimientoPostCorteId IS NULL
  AND a.TipoAlerta = 'MovimientoPostCorte';

-- Verificar cuántas alertas se actualizaron
SELECT
    COUNT(*) AS AlertasActualizadas
FROM AlertasInventario
WHERE TipoAlerta = 'MovimientoPostCorte'
  AND MovimientoPostCorteId IS NOT NULL;

-- Verificar si quedan alertas sin MovimientoPostCorteId
SELECT
    COUNT(*) AS AlertasSinMovimiento
FROM AlertasInventario
WHERE TipoAlerta = 'MovimientoPostCorte'
  AND MovimientoPostCorteId IS NULL;

-- Ver detalles de alertas que se actualizaron
SELECT
    a.AlertaId,
    a.ProductoId,
    p.NombreProducto,
    a.InventarioProgramadoId,
    a.MovimientoPostCorteId,
    m.TipoMovimiento,
    m.Cantidad,
    m.FechaMovimiento
FROM AlertasInventario a
INNER JOIN Productos p ON p.ProductoId = a.ProductoId
LEFT JOIN MovimientosPostCorte m ON m.MovimientoPostCorteId = a.MovimientoPostCorteId
WHERE a.TipoAlerta = 'MovimientoPostCorte'
ORDER BY a.FechaCreacion DESC;
