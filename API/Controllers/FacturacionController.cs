
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.Data;
using tuco.Clases.Models;
using tuco.Clases.DTOs.Facturacion;
using tuco.Clases.DTOs.Inventario;
using Microsoft.AspNetCore.Authorization;
using iTextSharp.text;
using iTextSharp.text.pdf;
using System.Text;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FacturacionController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<FacturacionController> _logger;

        public FacturacionController(TucoContext context, ILogger<FacturacionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ===== OBTENER PRODUCTOS PARA FACTURACIÓN =====
        [HttpGet("productos")]
        public async Task<ActionResult<List<ProductoVentaDTO>>> ObtenerProductosParaFacturacion(
            [FromQuery] string? busqueda = null,
            [FromQuery] int pagina = 1,
            [FromQuery] int productosPorPagina = 50)
        {
            try
            {
                _logger.LogInformation("🔍 Obteniendo productos para facturación - Búsqueda: {Busqueda}, Página: {Pagina}", 
                    busqueda ?? "Sin filtro", pagina);

                var query = _context.Productos
                    .Include(p => p.Llanta)
                    .Include(p => p.ImagenesProductos)
                    .Where(p => p.Activo && p.CantidadEnInventario > 0)
                    .AsQueryable();

                // Aplicar filtro de búsqueda si se proporciona
                if (!string.IsNullOrWhiteSpace(busqueda))
                {
                    var terminoBusqueda = busqueda.ToLower().Trim();
                    query = query.Where(p => 
                        p.NombreProducto.ToLower().Contains(terminoBusqueda) ||
                        p.CodigoProducto.ToLower().Contains(terminoBusqueda) ||
                        (p.Llanta != null && (
                            p.Llanta.Marca.ToLower().Contains(terminoBusqueda) ||
                            p.Llanta.Modelo.ToLower().Contains(terminoBusqueda) ||
                            p.Llanta.Medida.ToLower().Contains(terminoBusqueda)
                        ))
                    );
                }

                // Ordenar por nombre y aplicar paginación
                var productos = await query
                    .OrderBy(p => p.NombreProducto)
                    .Skip((pagina - 1) * productosPorPagina)
                    .Take(productosPorPagina)
                    .Select(p => new ProductoVentaDTO
                    {
                        ProductoId = p.ProductoId,
                        Codigo = p.CodigoProducto,
                        Nombre = p.NombreProducto,
                        Descripcion = p.Descripcion ?? "",
                        PrecioUnitario = p.PrecioVenta,
                        Stock = p.CantidadEnInventario,
                        StockMinimo = p.StockMinimo,
                        EsLlanta = p.EsLlanta,
                        
                        // Información de llanta si aplica
                        Marca = p.Llanta != null ? p.Llanta.Marca : null,
                        Modelo = p.Llanta != null ? p.Llanta.Modelo : null,
                        Medida = p.Llanta != null ? p.Llanta.Medida : null,
                        TipoVehiculo = p.Llanta != null ? p.Llanta.TipoVehiculo : null,
                        
                        // Imagen principal
                        ImagenUrl = p.ImagenesProductos
                            .Where(img => img.EsPrincipal)
                            .Select(img => "/uploads/productos/" + img.RutaArchivo)
                            .FirstOrDefault() ?? "/images/no-image.png",
                        
                        // Datos para la venta
                        Cantidad = 0,
                        Descuento = 0,
                        Subtotal = 0
                    })
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Cantidad} productos", productos.Count);
                return Ok(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo productos para facturación");
                return StatusCode(500, new { message = "Error interno del servidor al obtener productos" });
            }
        }

        // ===== OBTENER CLIENTES =====
        [HttpGet("clientes")]
        public async Task<ActionResult<List<Cliente>>> ObtenerClientes([FromQuery] string? busqueda = null)
        {
            try
            {
                _logger.LogInformation("👥 Obteniendo clientes - Búsqueda: {Busqueda}", busqueda ?? "Todos");

                var query = _context.Clientes.Where(c => c.Activo).AsQueryable();

                if (!string.IsNullOrWhiteSpace(busqueda))
                {
                    var termino = busqueda.ToLower().Trim();
                    query = query.Where(c => 
                        c.Nombre.ToLower().Contains(termino) ||
                        c.Email.ToLower().Contains(termino) ||
                        c.Telefono.Contains(termino)
                    );
                }

                var clientes = await query
                    .OrderBy(c => c.Nombre)
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Cantidad} clientes", clientes.Count);
                return Ok(clientes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo clientes");
                return StatusCode(500, new { message = "Error interno del servidor al obtener clientes" });
            }
        }

        // ===== CREAR CLIENTE =====
        [HttpPost("clientes")]
        public async Task<ActionResult<Cliente>> CrearCliente([FromBody] Cliente cliente)
        {
            try
            {
                _logger.LogInformation("👤 Creando nuevo cliente: {Nombre}", cliente.Nombre);

                // Validaciones básicas
                if (string.IsNullOrWhiteSpace(cliente.Nombre))
                {
                    return BadRequest(new { message = "El nombre del cliente es requerido" });
                }

                // Verificar si ya existe un cliente con el mismo email (si se proporciona)
                if (!string.IsNullOrWhiteSpace(cliente.Email))
                {
                    var clienteExistente = await _context.Clientes
                        .FirstOrDefaultAsync(c => c.Email.ToLower() == cliente.Email.ToLower() && c.Activo);
                    
                    if (clienteExistente != null)
                    {
                        return Conflict(new { message = "Ya existe un cliente con este email" });
                    }
                }

                // Configurar valores por defecto
                cliente.FechaCreacion = DateTime.Now;
                cliente.Activo = true;

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Cliente creado exitosamente con ID: {ClienteId}", cliente.ClienteId);
                return CreatedAtAction(nameof(ObtenerClientes), new { id = cliente.ClienteId }, cliente);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando cliente");
                return StatusCode(500, new { message = "Error interno del servidor al crear cliente" });
            }
        }

        // ===== PROCESAR VENTA COMPLETA =====
        [HttpPost("procesar-venta")]
        public async Task<ActionResult<VentaCompletaDTO>> ProcesarVentaCompleta([FromBody] VentaCompletaDTO ventaCompleta)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                _logger.LogInformation("💰 Procesando venta completa - Cliente: {ClienteId}, Productos: {CantidadProductos}", 
                    ventaCompleta.ClienteId, ventaCompleta.ProductosVenta?.Count ?? 0);

                // ===== VALIDACIONES INICIALES =====
                if (ventaCompleta.ProductosVenta == null || !ventaCompleta.ProductosVenta.Any())
                {
                    return BadRequest(new { message = "No se han seleccionado productos para la venta" });
                }

                // Verificar que el cliente existe
                var cliente = await _context.Clientes.FindAsync(ventaCompleta.ClienteId);
                if (cliente == null || !cliente.Activo)
                {
                    return BadRequest(new { message = "Cliente no válido" });
                }

                // ===== VALIDAR STOCK Y PREPARAR DATOS =====
                var productosValidados = new List<ProductoVentaDTO>();
                var ajustesStock = new List<object>();
                
                foreach (var productoVenta in ventaCompleta.ProductosVenta)
                {
                    var producto = await _context.Productos.FindAsync(productoVenta.ProductoId);
                    if (producto == null || !producto.Activo)
                    {
                        return BadRequest(new { message = $"Producto con ID {productoVenta.ProductoId} no válido" });
                    }

                    if (producto.CantidadEnInventario < productoVenta.Cantidad)
                    {
                        return BadRequest(new { 
                            message = $"Stock insuficiente para {producto.NombreProducto}. Stock disponible: {producto.CantidadEnInventario}" 
                        });
                    }

                    // Calcular subtotal con descuentos
                    var subtotalSinDescuento = productoVenta.PrecioUnitario * productoVenta.Cantidad;
                    var descuentoCalculado = subtotalSinDescuento * (productoVenta.Descuento / 100m);
                    var subtotalConDescuento = subtotalSinDescuento - descuentoCalculado;

                    // Actualizar el DTO con los cálculos
                    productoVenta.Subtotal = subtotalConDescuento;

                    productosValidados.Add(productoVenta);

                    // Preparar ajuste de stock
                    ajustesStock.Add(new
                    {
                        ProductoId = producto.ProductoId,
                        StockAnterior = producto.CantidadEnInventario,
                        CantidadVendida = productoVenta.Cantidad,
                        StockNuevo = producto.CantidadEnInventario - productoVenta.Cantidad
                    });
                }

                // ===== CREAR FACTURA =====
                var factura = new Factura
                {
                    ClienteId = ventaCompleta.ClienteId,
                    FechaFactura = DateTime.Now,
                    MetodoPago = ventaCompleta.MetodoPago,
                    Observaciones = ventaCompleta.Observaciones,
                    Activo = true
                };

                _context.Facturas.Add(factura);
                await _context.SaveChangesAsync(); // Para obtener el ID

                // ===== CREAR DETALLES DE FACTURA =====
                decimal subtotalFactura = 0;
                foreach (var productoVenta in productosValidados)
                {
                    var detalle = new DetalleFactura
                    {
                        FacturaId = factura.FacturaId,
                        ProductoId = productoVenta.ProductoId,
                        Cantidad = productoVenta.Cantidad,
                        PrecioUnitario = productoVenta.PrecioUnitario,
                        Descuento = productoVenta.Descuento,
                        Subtotal = productoVenta.Subtotal
                    };

                    _context.DetalleFacturas.Add(detalle);
                    subtotalFactura += productoVenta.Subtotal;
                }

                // ===== CALCULAR TOTALES DE FACTURA =====
                var impuestoCalculado = subtotalFactura * 0.13m; // IVA 13%
                var totalFactura = subtotalFactura + impuestoCalculado;

                // Actualizar totales en la factura
                factura.Subtotal = subtotalFactura;
                factura.Impuesto = impuestoCalculado;
                factura.Total = totalFactura;

                // ===== ACTUALIZAR STOCK DE PRODUCTOS =====
                foreach (var ajuste in ajustesStock)
                {
                    var producto = await _context.Productos.FindAsync(ajuste.GetType().GetProperty("ProductoId")?.GetValue(ajuste));
                    if (producto != null)
                    {
                        var cantidadVendida = (int)(ajuste.GetType().GetProperty("CantidadVendida")?.GetValue(ajuste) ?? 0);
                        producto.CantidadEnInventario -= cantidadVendida;
                    }
                }

                // ===== GUARDAR TODOS LOS CAMBIOS =====
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ===== PREPARAR RESPUESTA =====
                var respuesta = new VentaCompletaDTO
                {
                    FacturaId = factura.FacturaId,
                    ClienteId = factura.ClienteId,
                    MetodoPago = factura.MetodoPago,
                    Observaciones = factura.Observaciones,
                    FechaVenta = factura.FechaFactura,
                    Subtotal = factura.Subtotal,
                    Impuesto = factura.Impuesto,
                    Total = factura.Total,
                    ProductosVenta = productosValidados,
                    AjustesStock = ajustesStock.Select(a => new
                    {
                        ProductoId = a.GetType().GetProperty("ProductoId")?.GetValue(a),
                        StockAnterior = a.GetType().GetProperty("StockAnterior")?.GetValue(a),
                        CantidadVendida = a.GetType().GetProperty("CantidadVendida")?.GetValue(a),
                        StockNuevo = a.GetType().GetProperty("StockNuevo")?.GetValue(a)
                    }).ToList()
                };

                _logger.LogInformation("✅ Venta procesada exitosamente - Factura ID: {FacturaId}, Total: {Total}", 
                    factura.FacturaId, factura.Total);

                return Ok(respuesta);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ Error procesando venta completa");
                return StatusCode(500, new { message = "Error interno del servidor al procesar la venta" });
            }
        }

        // ===== GENERAR RECIBO EN PDF =====
        [HttpGet("recibo/{facturaId}")]
        public async Task<ActionResult> GenerarRecibo(int facturaId)
        {
            try
            {
                _logger.LogInformation("🖨️ Generando recibo para factura: {FacturaId}", facturaId);

                // Obtener los datos de la factura
                var factura = await _context.Facturas
                    .Include(f => f.Cliente)
                    .Include(f => f.DetalleFacturas)
                        .ThenInclude(df => df.Producto)
                    .FirstOrDefaultAsync(f => f.FacturaId == facturaId);

                if (factura == null)
                {
                    return NotFound(new { message = "Factura no encontrada" });
                }

                // Crear el PDF
                using var memoryStream = new MemoryStream();
                var document = new Document(PageSize.A4, 50, 50, 25, 25);
                var writer = PdfWriter.GetInstance(document, memoryStream);

                document.Open();

                // ===== ENCABEZADO =====
                var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
                var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
                var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
                var smallFont = FontFactory.GetFont(FontFactory.HELVETICA, 8, BaseColor.GRAY);

                // Título principal
                var title = new Paragraph("RECIBO DE VENTA", titleFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 20
                };
                document.Add(title);

                // Información de la empresa
                var empresaInfo = new Paragraph("Gestión Llantera S.A.\nTeléfono: (506) 2222-3333\nEmail: info@gestionllantera.com", normalFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 20
                };
                document.Add(empresaInfo);

                // Línea separadora
                var line = new Paragraph("_".PadRight(80, '_'), smallFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 15
                };
                document.Add(line);

                // ===== INFORMACIÓN DE LA FACTURA =====
                var facturaInfo = new Paragraph($"Factura #: {factura.FacturaId}\n" +
                                              $"Fecha: {factura.FechaFactura:dd/MM/yyyy HH:mm}\n" +
                                              $"Método de Pago: {factura.MetodoPago}", normalFont)
                {
                    SpacingAfter = 15
                };
                document.Add(facturaInfo);

                // ===== INFORMACIÓN DEL CLIENTE =====
                var clienteHeader = new Paragraph("DATOS DEL CLIENTE", headerFont)
                {
                    SpacingAfter = 5
                };
                document.Add(clienteHeader);

                var clienteInfo = new Paragraph($"Nombre: {factura.Cliente.Nombre}\n" +
                                              $"Teléfono: {factura.Cliente.Telefono ?? "N/A"}\n" +
                                              $"Email: {factura.Cliente.Email ?? "N/A"}", normalFont)
                {
                    SpacingAfter = 20
                };
                document.Add(clienteInfo);

                // ===== TABLA DE PRODUCTOS =====
                var productosHeader = new Paragraph("PRODUCTOS VENDIDOS", headerFont)
                {
                    SpacingAfter = 10
                };
                document.Add(productosHeader);

                // Crear tabla
                var table = new PdfPTable(5)
                {
                    WidthPercentage = 100
                };
                table.SetWidths(new float[] { 3f, 1f, 1.5f, 1f, 1.5f });

                // Encabezados de tabla
                var headerCellFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
                var headerColor = new BaseColor(52, 58, 64);

                string[] headers = { "Producto", "Cant.", "Precio Unit.", "Desc.", "Subtotal" };
                foreach (var header in headers)
                {
                    var cell = new PdfPCell(new Phrase(header, headerCellFont))
                    {
                        BackgroundColor = headerColor,
                        Padding = 8,
                        HorizontalAlignment = Element.ALIGN_CENTER
                    };
                    table.AddCell(cell);
                }

                // Datos de productos
                var cellFont = FontFactory.GetFont(FontFactory.HELVETICA, 8, BaseColor.BLACK);
                foreach (var detalle in factura.DetalleFacturas)
                {
                    table.AddCell(new PdfPCell(new Phrase(detalle.Producto.NombreProducto, cellFont)) { Padding = 5 });
                    table.AddCell(new PdfPCell(new Phrase(detalle.Cantidad.ToString(), cellFont)) { Padding = 5, HorizontalAlignment = Element.ALIGN_CENTER });
                    table.AddCell(new PdfPCell(new Phrase($"₡{detalle.PrecioUnitario:N2}", cellFont)) { Padding = 5, HorizontalAlignment = Element.ALIGN_RIGHT });
                    table.AddCell(new PdfPCell(new Phrase($"{detalle.Descuento:N1}%", cellFont)) { Padding = 5, HorizontalAlignment = Element.ALIGN_CENTER });
                    table.AddCell(new PdfPCell(new Phrase($"₡{detalle.Subtotal:N2}", cellFont)) { Padding = 5, HorizontalAlignment = Element.ALIGN_RIGHT });
                }

                document.Add(table);

                // ===== TOTALES =====
                var totalesTable = new PdfPTable(2)
                {
                    WidthPercentage = 50,
                    HorizontalAlignment = Element.ALIGN_RIGHT,
                    SpacingBefore = 20
                };
                totalesTable.SetWidths(new float[] { 1f, 1f });

                // Subtotal
                totalesTable.AddCell(new PdfPCell(new Phrase("Subtotal:", normalFont)) { Border = 0, Padding = 5, HorizontalAlignment = Element.ALIGN_RIGHT });
                totalesTable.AddCell(new PdfPCell(new Phrase($"₡{factura.Subtotal:N2}", normalFont)) { Border = 0, Padding = 5, HorizontalAlignment = Element.ALIGN_RIGHT });

                // IVA
                totalesTable.AddCell(new PdfPCell(new Phrase("IVA (13%):", normalFont)) { Border = 0, Padding = 5, HorizontalAlignment = Element.ALIGN_RIGHT });
                totalesTable.AddCell(new PdfPCell(new Phrase($"₡{factura.Impuesto:N2}", normalFont)) { Border = 0, Padding = 5, HorizontalAlignment = Element.ALIGN_RIGHT });

                // Total
                var totalFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
                totalesTable.AddCell(new PdfPCell(new Phrase("TOTAL:", totalFont)) { Border = 1, Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT, BackgroundColor = BaseColor.LIGHT_GRAY });
                totalesTable.AddCell(new PdfPCell(new Phrase($"₡{factura.Total:N2}", totalFont)) { Border = 1, Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT, BackgroundColor = BaseColor.LIGHT_GRAY });

                document.Add(totalesTable);

                // ===== PIE DE PÁGINA =====
                var footer = new Paragraph("\n\n¡Gracias por su compra!\nConserve este recibo para cualquier reclamo.", smallFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingBefore = 30
                };
                document.Add(footer);

                document.Close();

                var pdfBytes = memoryStream.ToArray();

                _logger.LogInformation("✅ Recibo generado exitosamente para factura: {FacturaId}", facturaId);

                return File(pdfBytes, "application/pdf", $"Recibo_Factura_{facturaId}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generando recibo para factura: {FacturaId}", facturaId);
                return StatusCode(500, new { message = "Error interno del servidor al generar el recibo" });
            }
        }
    }
}
