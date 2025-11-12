# Diagnóstico: Por qué las alertas muestran "Ajuste" en lugar de "Venta"

## Resumen del Problema

Después de una revisión exhaustiva del código, he confirmado que:

✅ **El código es CORRECTO** - `FacturacionController.cs` línea 829 pasa "Venta" correctamente
✅ **No hay sobrescrituras** - No hay código, triggers, ni valores por defecto que cambien esto
✅ **El flujo es directo** - El valor "Venta" se guarda directamente en la base de datos

Si está viendo "Ajuste" en lugar de "Venta", solo hay **3 posibilidades**:

### Posibilidad 1: Backend no reiniciado
El backend está ejecutando código antiguo que NO tenía esta funcionalidad.

### Posibilidad 2: Viendo alertas antiguas
Las alertas antiguas fueron actualizadas por el script de migración con movimientos tipo "Ajuste".

### Posibilidad 3: No hay movimientos de factura
Las facturas se completaron cuando NO había inventarios en progreso.

## Paso 1: Verificar Movimientos de Facturas

**PRIMERO EJECUTE ESTE SCRIPT:** `VerificarMovimientosDeFacturas.sql`

Este script le dirá **exactamente** cuál es el problema.

### Interpretación de Resultados:

#### Resultado A: "NO hay movimientos con TipoDocumento = 'Factura'"
📌 **Causa:** El backend NO se reinició después de `git pull`
📌 **Solución:** Reinicie el backend completamente y complete UNA NUEVA factura

#### Resultado B: "SÍ hay movimientos con TipoDocumento = 'Factura' y TipoMovimiento = 'Ajuste'"
📌 **Causa:** BUG en el código (muy improbable según revisión)
📌 **Solución:** Enviar screenshot de los resultados al desarrollador

#### Resultado C: "SÍ hay movimientos con TipoDocumento = 'Factura' y TipoMovimiento = 'Venta'"
📌 **Causa:** El sistema funciona CORRECTAMENTE - está viendo alertas ANTIGUAS
📌 **Solución:** Complete una NUEVA factura y verifique esa alerta específica

## Paso 2: Según el Resultado

### Si obtuvo Resultado A (No hay movimientos de facturas):

1. **Reinicie completamente el backend**
```bash
# Detener el proceso del backend
# Iniciar nuevamente el backend
```

2. **Verifique que los cambios están presentes**
   - Busque en el log de inicio del backend
   - El código nuevo debería estar activo

3. **Complete UNA NUEVA factura** de un producto que esté en un inventario en progreso

4. **Ejecute nuevamente** `VerificarMovimientosDeFacturas.sql`
   - Ahora debería ver movimientos con TipoDocumento = "Factura"
   - Y TipoMovimiento debería ser "Venta"

### Si obtuvo Resultado C (Sí hay movimientos correctos):

El sistema está funcionando perfectamente. Las alertas que muestran "Ajuste" son antiguas.

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

## Paso 4: Prueba Final

Después de reiniciar el backend (si fue necesario):

1. **Asegúrese de tener un inventario en estado "En Progreso"**
2. **Complete UNA NUEVA FACTURA** de un producto que está en ese inventario
3. **Ejecute este query rápido:**

```sql
-- Ver el movimiento MÁS RECIENTE
SELECT TOP 1
    m.MovimientoPostCorteId,
    m.TipoMovimiento,
    m.TipoDocumento,
    m.DocumentoReferenciaId AS FacturaId,
    m.FechaMovimiento,
    p.NombreProducto
FROM MovimientosPostCorte m
LEFT JOIN Productos p ON p.ProductoId = m.ProductoId
ORDER BY m.FechaMovimiento DESC;
```

4. **Debería ver:**
   - `TipoMovimiento = "Venta"`
   - `TipoDocumento = "Factura"`
   - `FacturaId` = el ID de la factura que acaba de completar

5. **Vaya a "Ejecutar Inventario"** → Panel de Alertas
   - Busque la alerta MÁS RECIENTE
   - Debería mostrar "Venta" como tipo de movimiento

## Resumen de Diagnóstico

### ✅ El Código es Correcto

He revisado TODO el flujo:

1. **FacturacionController.cs:826-833** - Llama al servicio con "Venta" ✅
2. **MovimientosPostCorteService.cs:151** - Asigna TipoMovimiento directamente ✅
3. **SaveChangesAsync:178** - Guarda en la base de datos ✅
4. **No hay triggers** - Verificado ✅
5. **No hay valores por defecto** - Verificado ✅
6. **No hay sobrescrituras** - Verificado ✅

### 🔍 Diagnóstico según Script SQL

Ejecute `VerificarMovimientosDeFacturas.sql` y compare con estos casos:

| Resultado del Script | Causa | Solución |
|---------------------|-------|----------|
| **No hay movimientos con TipoDocumento='Factura'** | Backend no reiniciado | ⚠️ Reiniciar backend completamente |
| **Hay movimientos correctos ('Venta')** | Código funciona bien | ✅ Crear nueva factura y verificar |
| **Hay movimientos incorrectos ('Ajuste')** | Bug inesperado | 🚨 Contactar desarrollador |

### 📋 Scripts Disponibles

1. **`VerificarMovimientosDeFacturas.sql`** - Diagnóstico específico de facturas (USE ESTE PRIMERO)
2. **`DiagnosticoMovimientosYAlertas.sql`** - Diagnóstico general completo
3. **`UpdateAlertasAntiguasConMovimientoPostCorteId.sql`** - Script de migración original

### ⚡ Prueba Rápida

Si después de reiniciar el backend, complete una nueva factura y verifique con:

```sql
SELECT TOP 1 TipoMovimiento, TipoDocumento
FROM MovimientosPostCorte
ORDER BY FechaMovimiento DESC;
```

Debería ver: `TipoMovimiento='Venta'` y `TipoDocumento='Factura'`
