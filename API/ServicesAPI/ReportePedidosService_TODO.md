# Migración Pendiente: ReportePedidosService.cs

## Estado
- ✅ Actualizado: GenerarPedidoPdfAsync - método principal
- ✅ Migrado: AgregarEncabezadoMinimalista
- ✅ Migrado: AgregarSeparadorElegante
- ✅ Migrado: AgregarTituloPrincipal
- ✅ Migrado: AgregarInformacionPedido

## Pendientes de Migración a iText7
- ⏸️ AgregarInformacionProveedor
- ⏸️ AgregarDetallesProductos (IMPORTANTE: contiene formato de medidas de neumáticos en líneas 279-287)
- ⏸️ AgregarResumenTotales
- ⏸️ AgregarPieProfesional
- ⏸️ AgregarEncabezadoModerno (legacy)
- ⏸️ GenerarHtmlPedido (no usa PDF)

## Notas
La migración completa requiere actualizar aproximadamente 500 líneas de código.
El archivo actual tiene código mixto (iText7 parcialmente migrado).

Para continuar la migración, actualizar cada método siguiendo el patrón:
- `Document` → `iText.Layout.Document`
- `PdfPTable` → `Table`
- `PdfPCell` → `Cell`
- `BaseColor` → `DeviceRgb`
- `FontFactory.GetFont()` → `PdfFontFactory.CreateFont()`
