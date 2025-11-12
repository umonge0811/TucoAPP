# Diagnóstico: Por qué las alertas muestran "Ajuste" en lugar de "Venta"

## Paso 1: Reiniciar el Backend

**MUY IMPORTANTE:** Antes de hacer cualquier otra cosa, asegúrese de que el backend de la API ha sido reiniciado después de hacer `git pull` de los últimos cambios.

```bash
# Detenga el backend si está corriendo
# Luego inícielo de nuevo
```

Si el backend no se reinicia, seguirá usando el código antiguo y NO creará movimientos de tipo "Venta".

## Paso 2: Ejecutar el Script de Diagnóstico

Ejecute el archivo `DiagnosticoMovimientosYAlertas.sql` en su base de datos para verificar qué está pasando.

### Qué buscar en los resultados:

#### Sección 5: "MOVIMIENTOS DE VENTA (FACTURACION)"
- **Si está VACÍA**: El backend NO se reinició o los cambios no se aplicaron
  - ✅ Solución: Reinicie el backend y complete una nueva factura

- **Si tiene registros**: El código está funcionando correctamente
  - ✅ El backend está creando movimientos de tipo "Venta"

#### Sección 3: "ALERTAS RECIENTES Y SUS MOVIMIENTOS"
- Observe la columna `TipoMovimiento` de las alertas más recientes
- Observe las fechas: `FechaMovimiento` vs `FechaAlerta`

## Paso 3: Entender el Problema con Alertas Antiguas

### El Script de Migración (UpdateAlertasAntiguasConMovimientoPostCorteId.sql)

Cuando ejecutó este script, hizo lo siguiente para las alertas antiguas sin `MovimientoPostCorteId`:

```sql
UPDATE a
SET a.MovimientoPostCorteId = m.MovimientoPostCorteId
FROM AlertasInventario a
CROSS APPLY (
    SELECT TOP 1 MovimientoPostCorteId
    FROM MovimientosPostCorte m
    WHERE m.InventarioProgramadoId = a.InventarioProgramadoId
      AND m.ProductoId = a.ProductoId
    ORDER BY m.FechaMovimiento DESC  -- ← Toma el MÁS RECIENTE
) m
WHERE a.MovimientoPostCorteId IS NULL
```

**Problema:** Este script asignó el movimiento MÁS RECIENTE de cada producto a las alertas antiguas.

**Resultado:** Si el movimiento más reciente era de tipo "Ajuste", entonces todas las alertas antiguas de ese producto ahora muestran "Ajuste", AUNQUE originalmente hayan sido creadas por ventas.

## Paso 4: Verificar con Datos Nuevos

Para verificar que el sistema está funcionando correctamente:

1. **Asegúrese de que el backend esté reiniciado**
2. **Complete UNA NUEVA FACTURA** de un producto que está en un inventario en progreso
3. **Verifique que se creó un nuevo movimiento de tipo "Venta":**

```sql
SELECT TOP 5
    m.MovimientoPostCorteId,
    m.ProductoId,
    m.TipoMovimiento,
    m.TipoDocumento,
    m.Cantidad,
    m.FechaMovimiento
FROM MovimientosPostCorte m
ORDER BY m.FechaMovimiento DESC;
```

4. **Verifique que se creó una nueva alerta vinculada a ese movimiento:**

```sql
SELECT TOP 5
    a.AlertaId,
    a.ProductoId,
    a.MovimientoPostCorteId,
    m.TipoMovimiento,
    a.FechaCreacion
FROM AlertasInventario a
INNER JOIN MovimientosPostCorte m ON m.MovimientoPostCorteId = a.MovimientoPostCorteId
ORDER BY a.FechaCreacion DESC;
```

5. **Vaya a la interfaz de "Ejecutar Inventario" y verifique que la nueva alerta muestre "Venta"**

## Resumen

### Si NO aparecen movimientos de tipo "Venta":
- ❌ El backend no se reinició
- ✅ Reinicie el backend y vuelva a intentar

### Si aparecen movimientos de tipo "Venta" pero las alertas muestran "Ajuste":
- ❌ Está viendo alertas ANTIGUAS que fueron actualizadas por el script de migración
- ✅ Complete una NUEVA factura y verifique que esa alerta muestre "Venta"

### Si las nuevas facturas también crean alertas con "Ajuste":
- ❌ Hay un problema con el código
- ✅ Verifique los logs del backend para ver errores
- ✅ Contacte al desarrollador con los resultados del script de diagnóstico

## Código Correcto

El código en `FacturacionController.cs` línea 829 está correcto:

```csharp
var movimientoId = await _movimientosPostCorteService.RegistrarMovimientoAsync(
    inventarioId,
    detalle.ProductoId.Value,
    "Venta",  // ← CORRECTO
    cantidadMovimiento,
    factura.FacturaId,
    "Factura"
);
```

Este código crea movimientos con `TipoMovimiento = "Venta"`, pero SOLO si el backend está ejecutando este código (requiere reinicio después de `git pull`).
