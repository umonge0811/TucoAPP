# Guía de Depuración: Por qué el código NO se ejecuta

## Problema Reportado

Ha puesto un breakpoint en el código de movimientos post-corte (línea 811-851 de `FacturacionController.cs`) y **NUNCA se alcanza**.

## Flujo del Código

El código de movimientos post-corte está anidado dentro de varias condiciones:

```
CompletarFactura (línea 682)
  └─ foreach (var detalle in factura.DetallesFactura)  ← LÍNEA 785
      ├─ if (detalle.ServicioId.HasValue && detalle.ServicioId.Value > 0)  ← LÍNEA 788
      │    └─ continue;  ← SALTA la lógica
      │
      └─ if (detalle.ProductoId.HasValue && detalle.ProductoId.Value > 0)  ← LÍNEA 795
          └─ var producto = await _context.Productos.FindAsync(...)  ← LÍNEA 797
              └─ if (producto != null)  ← LÍNEA 798
                  └─ try  ← LÍNEA 812
                      └─ var inventariosEnProgreso = await ...  ← LÍNEA 814
                          └─ if (inventariosEnProgreso != null && inventariosEnProgreso.Any())  ← LÍNEA 817
                              └─ foreach (var inventarioId in inventariosEnProgreso)  ← LÍNEA 822
                                  └─ 🎯 AQUÍ ESTÁ SU BREAKPOINT (línea 826)
```

## Paso 1: Depuración con Múltiples Breakpoints

Ponga breakpoints en **cada nivel** para identificar dónde se detiene el flujo:

### Breakpoint 1: Inicio del loop (línea 785)
```csharp
foreach (var detalle in factura.DetallesFactura)
```
**¿Se alcanza?**
- ✅ **SÍ** → Continúe al Breakpoint 2
- ❌ **NO** → La factura no tiene detalles o el método sale antes

### Breakpoint 2: Después del check de servicios (línea 795)
```csharp
if (detalle.ProductoId.HasValue && detalle.ProductoId.Value > 0)
```
**Inspeccione las variables:**
- `detalle.ServicioId` → ¿Es NULL?
- `detalle.ProductoId` → ¿Tiene valor? ¿Es > 0?

**¿Se alcanza?**
- ✅ **SÍ** → El detalle es un producto, continúe al Breakpoint 3
- ❌ **NO** → Todos los detalles son servicios o tienen ProductoId nulo/0

### Breakpoint 3: Después de buscar producto (línea 798)
```csharp
if (producto != null)
```
**Inspeccione la variable:**
- `producto` → ¿Es NULL?

**¿Se alcanza?**
- ✅ **SÍ** → El producto existe, continúe al Breakpoint 4
- ❌ **NO** → El producto no existe en la tabla Productos

### Breakpoint 4: Después de buscar inventarios (línea 817)
```csharp
if (inventariosEnProgreso != null && inventariosEnProgreso.Any())
```
**Inspeccione la variable:**
- `inventariosEnProgreso` → ¿Es NULL? ¿Count = 0?

**¿Se alcanza?**
- ✅ **SÍ** → Hay inventarios en progreso con este producto, continúe al Breakpoint 5
- ❌ **NO** → **ESTE ES EL PROBLEMA MÁS COMÚN**

### Breakpoint 5: Su breakpoint original (línea 826)
```csharp
var movimientoId = await _movimientosPostCorteService.RegistrarMovimientoAsync(
```
**¿Se alcanza?**
- ✅ **SÍ** → El código se está ejecutando correctamente
- ❌ **NO** → Revise los breakpoints anteriores

## Paso 2: Ejecutar Script SQL de Diagnóstico

Ejecute `DiagnosticarPorQueNoSeEjecuta.sql` para verificar:

1. **¿La última factura completada tiene detalles?**
2. **¿Los detalles son productos o servicios?**
3. **¿Los productos existen en la tabla Productos?**
4. **¿Hay inventarios en estado "En Progreso"?**
5. **¿Los productos de la factura están en esos inventarios?**

## Causas Más Probables (según mi experiencia)

### 🔴 Causa #1: No hay inventarios en progreso (80% probable)
El método `ObtenerInventariosEnProgresoConProductoAsync` devuelve una lista vacía porque:
- No hay ningún inventario en estado "En Progreso"
- O el producto facturado NO está en ningún inventario en progreso

**Solución:** Asegúrese de tener un inventario activo (Estado = "En Progreso") que incluya el producto que está facturando.

### 🟡 Causa #2: Todos los detalles son servicios (15% probable)
La factura solo tiene servicios, no productos físicos.

**Solución:** Facture un producto físico que tenga inventario.

### 🟠 Causa #3: ProductoId es NULL (4% probable)
Los detalles de la factura no tienen ProductoId válido.

**Solución:** Verifique que la factura incluya productos con ID válido.

### ⚪ Causa #4: Producto no existe (1% probable)
El ProductoId está en DetallesFactura pero no existe en tabla Productos.

**Solución:** Problema de integridad de datos, contactar a soporte.

## Paso 3: Verificación Rápida en Base de Datos

Ejecute este query para verificar la causa más probable:

```sql
-- Verificar la última factura completada
DECLARE @UltimaFacturaId INT = (
    SELECT TOP 1 FacturaId
    FROM Facturas
    WHERE Estado = 'Pagada'
    ORDER BY FechaActualizacion DESC
);

-- Ver los productos de esa factura
SELECT
    df.ProductoId,
    df.NombreProducto,
    df.Cantidad,
    -- ¿Es producto o servicio?
    CASE
        WHEN df.ServicioId IS NOT NULL AND df.ServicioId > 0 THEN 'SERVICIO'
        WHEN df.ProductoId IS NOT NULL AND df.ProductoId > 0 THEN 'PRODUCTO'
        ELSE 'INDEFINIDO'
    END AS Tipo,
    -- ¿Producto existe?
    CASE WHEN p.ProductoId IS NOT NULL THEN 'SÍ' ELSE 'NO' END AS ProductoExiste,
    -- ¿Está en inventario en progreso?
    (SELECT COUNT(DISTINCT dip.InventarioProgramadoId)
     FROM DetallesInventarioProgramado dip
     INNER JOIN InventariosProgramados ip ON ip.InventarioProgramadoId = dip.InventarioProgramadoId
     WHERE dip.ProductoId = df.ProductoId
       AND ip.Estado = 'En Progreso'
    ) AS InventariosEnProgreso
FROM DetallesFactura df
LEFT JOIN Productos p ON p.ProductoId = df.ProductoId
WHERE df.FacturaId = @UltimaFacturaId;
```

## Paso 4: Solución según Resultado

### Si `InventariosEnProgreso = 0`:

**ESTE ES EL PROBLEMA.** El código está funcionando correctamente, pero no se ejecuta porque no hay inventarios en progreso que incluyan ese producto.

#### Para que el código se ejecute:

1. **Cree un nuevo inventario programado** (o use uno existente)
2. **Asegúrese de que esté en estado "En Progreso"**
3. **Agregue el producto que va a facturar a ese inventario**
4. **Complete una nueva factura** de ese producto
5. **Ahora sí debería alcanzar el breakpoint**

### Si `Tipo = 'SERVICIO'`:

El código hace `continue` y salta la lógica porque es un servicio, no un producto físico.

**Solución:** Facture un producto físico, no un servicio.

### Si `ProductoExiste = 'NO'`:

Problema de integridad de datos.

**Solución:** Verificar por qué hay un ProductoId que no existe en la tabla Productos.

## Resumen

**La razón MÁS PROBABLE** por la que el breakpoint no se alcanza es:

> **El producto que está facturando NO está en ningún inventario con estado "En Progreso"**

**Para verificar:** Ejecute el query del Paso 3 y vea la columna `InventariosEnProgreso`. Si es 0, ahí está su problema.

**Para solucionarlo:** Cree/active un inventario que incluya ese producto antes de completar la factura.
