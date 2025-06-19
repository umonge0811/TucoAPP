using API.Data;
using API.Extensions;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Facturacion;

namespace API.Controllers
{
    /// <summary>
    /// Controlador para el módulo de FACTURACIÓN y VENTAS
    /// Incluye creación de facturas, proformas, consulta de productos para venta
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class FacturacionController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly ILogger<FacturacionController> _logger;
        private readonly IPermisosService _permisosService;
        private readonly INotificacionService _notificacionService;

        public FacturacionController(
            TucoContext context,
            ILogger<FacturacionController> logger,
            IPermisosService permisosService,
            INotificacionService notificacionService)
        {
            _context = context;
            _logger = logger;
            _permisosService = permisosService;
            _notificacionService = notificacionService;
        }

        // =====================================
        // PRODUCTOS PARA VENTA
        // =====================================

        [HttpGet("productos-venta")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ProductoVentaDTO>>> ObtenerProductosParaVenta(
            [FromQuery] string? busqueda = null,
            [FromQuery] bool soloConStock = true,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 50)
        {
            try
            {
                var puedeVerCostos = await this.TienePermisoAsync(_permisosService, "VerCostos");

                _logger.LogInformation("🛒 Obteniendo productos para venta - Página: {Pagina}, Tamaño: {Tamano}", pagina, tamano);

                var query = _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .AsQueryable();

                // Filtrar solo productos con stock si se solicita
                if (soloConStock)
                {
                    query = query.Where(p => p.CantidadEnInventario > 0);
                }

                // Aplicar búsqueda si se proporciona
                if (!string.IsNullOrWhiteSpace(busqueda))
                {
                    query = query.Where(p => 
                        p.NombreProducto.Contains(busqueda) ||
                        p.Descripcion.Contains(busqueda) ||
                        p.Llanta.Any(l => 
                            l.Marca.Contains(busqueda) ||
                            l.Modelo.Contains(busqueda) ||
                            (l.Ancho + "/" + l.Perfil + "R" + l.Diametro).Contains(busqueda)
                        )
                    );
                }

                var totalRegistros = await query.CountAsync();
                var productos = await query
                    .Skip((pagina - 1) * tamano)
                    .Take(tamano)
                    .Select(p => new ProductoVentaDTO
                    {
                        ProductoId = p.ProductoId,
                        NombreProducto = p.NombreProducto,
                        Descripcion = p.Descripcion,
                        Precio = p.Precio ?? 0,
                        Costo = puedeVerCostos ? p.Costo : null,
                        PorcentajeUtilidad = puedeVerCostos ? p.PorcentajeUtilidad : null,
                        CantidadEnInventario = (int)(p.CantidadEnInventario ?? 0),
                        StockMinimo = (int)(p.StockMinimo ?? 0),
                        FechaUltimaActualizacion = p.FechaUltimaActualizacion,
                        EsLlanta = p.Llanta.Any(),
                        MedidaCompleta = p.Llanta.Any() ? 
                            p.Llanta.First().Ancho + "/" + p.Llanta.First().Perfil + "R" + p.Llanta.First().Diametro : null,
                        Marca = p.Llanta.Any() ? p.Llanta.First().Marca : null,
                        Modelo = p.Llanta.Any() ? p.Llanta.First().Modelo : null,
                        IndiceVelocidad = p.Llanta.Any() ? p.Llanta.First().IndiceVelocidad : null,
                        TipoTerreno = p.Llanta.Any() ? p.Llanta.First().TipoTerreno : null,
                        ImagenesUrls = p.ImagenesProductos.Select(img => img.Urlimagen).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    productos,
                    totalRegistros,
                    pagina,
                    tamano,
                    totalPaginas = (int)Math.Ceiling((double)totalRegistros / tamano)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener productos para venta");
                return StatusCode(500, new { message = "Error al obtener productos", timestamp = DateTime.Now });
            }
        }

        [HttpGet("producto-venta/{id}")]
        [Authorize]
        public async Task<ActionResult<ProductoVentaDTO>> ObtenerProductoParaVenta(int id)
        {
            try
            {
                var puedeVerCostos = await this.TienePermisoAsync(_permisosService, "VerCostos");

                var producto = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .Where(p => p.ProductoId == id)
                    .Select(p => new ProductoVentaDTO
                    {
                        ProductoId = p.ProductoId,
                        NombreProducto = p.NombreProducto,
                        Descripcion = p.Descripcion,
                        Precio = p.Precio ?? 0,
                        Costo = puedeVerCostos ? p.Costo : null,
                        PorcentajeUtilidad = puedeVerCostos ? p.PorcentajeUtilidad : null,
                        CantidadEnInventario = (int)(p.CantidadEnInventario ?? 0),
                        StockMinimo = (int)(p.StockMinimo ?? 0),
                        FechaUltimaActualizacion = p.FechaUltimaActualizacion,
                        EsLlanta = p.Llanta.Any(),
                        MedidaCompleta = p.Llanta.Any() ? 
                            p.Llanta.First().Ancho + "/" + p.Llanta.First().Perfil + "R" + p.Llanta.First().Diametro : null,
                        Marca = p.Llanta.Any() ? p.Llanta.First().Marca : null,
                        Modelo = p.Llanta.Any() ? p.Llanta.First().Modelo : null,
                        IndiceVelocidad = p.Llanta.Any() ? p.Llanta.First().IndiceVelocidad : null,
                        TipoTerreno = p.Llanta.Any() ? p.Llanta.First().TipoTerreno : null,
                        ImagenesUrls = p.ImagenesProductos.Select(img => img.Urlimagen).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (producto == null)
                    return NotFound(new { message = "Producto no encontrado" });

                return Ok(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener producto para venta: {Id}", id);
                return StatusCode(500, new { message = "Error al obtener producto" });
            }
        }

        // =====================================
        // GESTIÓN DE FACTURAS
        // =====================================

        [HttpPost("facturas")]
        [Authorize]
        public async Task<IActionResult> CrearFactura([FromBody] FacturaDTO facturaDto)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "CrearFacturas",
                "Solo usuarios con permiso 'CrearFacturas' pueden crear facturas");
            if (validacionPermiso != null) return validacionPermiso;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("💰 Usuario {Usuario} creando factura para cliente: {Cliente}",
                    User.Identity?.Name, facturaDto.NombreCliente);

                // Validar modelo
                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());
                    return BadRequest(new { message = "Error de validación", errores });
                }

                if (!facturaDto.DetallesFactura.Any())
                    return BadRequest(new { message = "La factura debe tener al menos un producto" });

                // Generar número de factura automáticamente
                var numeroFactura = await GenerarNumeroFactura(facturaDto.TipoDocumento);

                // Verificar stock de productos
                var erroresStock = await ValidarStockProductos(facturaDto.DetallesFactura, facturaDto.TipoDocumento);
                if (erroresStock.Any())
                {
                    return BadRequest(new { message = "Error de stock", errores = erroresStock });
                }

                // Crear factura
                var factura = new Factura
                {
                    NumeroFactura = numeroFactura,
                    ClienteId = facturaDto.ClienteId,
                    NombreCliente = facturaDto.NombreCliente,
                    IdentificacionCliente = facturaDto.IdentificacionCliente,
                    TelefonoCliente = facturaDto.TelefonoCliente,
                    EmailCliente = facturaDto.EmailCliente,
                    DireccionCliente = facturaDto.DireccionCliente,
                    FechaFactura = facturaDto.FechaFactura,
                    FechaVencimiento = facturaDto.FechaVencimiento,
                    Subtotal = facturaDto.SubtotalConDescuento,
                    DescuentoGeneral = facturaDto.DescuentoGeneral,
                    PorcentajeImpuesto = facturaDto.PorcentajeImpuesto,
                    MontoImpuesto = facturaDto.ImpuestoCalculado,
                    Total = facturaDto.TotalCalculado,
                    Estado = facturaDto.Estado,
                    TipoDocumento = facturaDto.TipoDocumento,
                    MetodoPago = facturaDto.MetodoPago,
                    Observaciones = facturaDto.Observaciones,
                    UsuarioCreadorId = facturaDto.UsuarioCreadorId,
                    FechaCreacion = DateTime.Now
                };

                _context.Facturas.Add(factura);
                await _context.SaveChangesAsync();

                // Crear detalles de factura
                foreach (var detalle in facturaDto.DetallesFactura)
                {
                    var detalleFactura = new DetalleFactura
                    {
                        FacturaId = factura.FacturaId,
                        ProductoId = detalle.ProductoId,
                        NombreProducto = detalle.NombreProducto,
                        DescripcionProducto = detalle.DescripcionProducto,
                        Cantidad = detalle.Cantidad,
                        PrecioUnitario = detalle.PrecioUnitario,
                        PorcentajeDescuento = detalle.PorcentajeDescuento,
                        MontoDescuento = detalle.DescuentoCalculado,
                        Subtotal = detalle.SubtotalConDescuento
                    };

                    _context.DetallesFactura.Add(detalleFactura);

                    // Actualizar inventario solo si no es proforma
                    if (facturaDto.TipoDocumento == "Factura")
                    {
                        var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                        if (producto != null)
                        {
                            producto.CantidadEnInventario = Math.Max(0, 
                                (producto.CantidadEnInventario ?? 0) - detalle.Cantidad);
                            producto.FechaUltimaActualizacion = DateTime.Now;
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(ObtenerFacturaPorId), new { id = factura.FacturaId },
                    new { 
                        facturaId = factura.FacturaId, 
                        numeroFactura = factura.NumeroFactura,
                        message = $"{facturaDto.TipoDocumento} creada exitosamente"
                    });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ Error al crear factura");
                return StatusCode(500, new { message = $"Error al crear {facturaDto.TipoDocumento?.ToLower()}" });
            }
        }

        [HttpGet("facturas")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<FacturaDTO>>> ObtenerFacturas(
            [FromQuery] string? filtro = null,
            [FromQuery] string? estado = null,
            [FromQuery] string? tipoDocumento = null,
            [FromQuery] DateTime? fechaDesde = null,
            [FromQuery] DateTime? fechaHasta = null,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamano = 20)
        {
            try
            {
                var query = _context.Facturas
                    .Include(f => f.UsuarioCreador)
                    .Include(f => f.DetallesFactura)
                    .AsQueryable();

                // Aplicar filtros
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    query = query.Where(f => 
                        f.NumeroFactura.Contains(filtro) ||
                        f.NombreCliente.Contains(filtro) ||
                        f.IdentificacionCliente.Contains(filtro));
                }

                if (!string.IsNullOrWhiteSpace(estado))
                {
                    query = query.Where(f => f.Estado == estado);
                }

                if (!string.IsNullOrWhiteSpace(tipoDocumento))
                {
                    query = query.Where(f => f.TipoDocumento == tipoDocumento);
                }

                if (fechaDesde.HasValue)
                {
                    query = query.Where(f => f.FechaFactura >= fechaDesde.Value);
                }

                if (fechaHasta.HasValue)
                {
                    query = query.Where(f => f.FechaFactura <= fechaHasta.Value);
                }

                var totalRegistros = await query.CountAsync();
                var facturas = await query
                    .OrderByDescending(f => f.FechaCreacion)
                    .Skip((pagina - 1) * tamano)
                    .Take(tamano)
                    .Select(f => new FacturaDTO
                    {
                        FacturaId = f.FacturaId,
                        NumeroFactura = f.NumeroFactura,
                        ClienteId = f.ClienteId,
                        NombreCliente = f.NombreCliente,
                        IdentificacionCliente = f.IdentificacionCliente,
                        TelefonoCliente = f.TelefonoCliente,
                        EmailCliente = f.EmailCliente,
                        DireccionCliente = f.DireccionCliente,
                        FechaFactura = f.FechaFactura,
                        FechaVencimiento = f.FechaVencimiento,
                        Subtotal = f.Subtotal,
                        DescuentoGeneral = f.DescuentoGeneral,
                        PorcentajeImpuesto = f.PorcentajeImpuesto,
                        MontoImpuesto = f.MontoImpuesto ?? 0,
                        Total = f.Total,
                        Estado = f.Estado,
                        TipoDocumento = f.TipoDocumento,
                        MetodoPago = f.MetodoPago,
                        Observaciones = f.Observaciones,
                        UsuarioCreadorId = f.UsuarioCreadorId,
                        UsuarioCreadorNombre = f.UsuarioCreador.NombreUsuario,
                        FechaCreacion = f.FechaCreacion,
                        FechaActualizacion = f.FechaActualizacion,
                        DetallesFactura = f.DetallesFactura.Select(d => new DetalleFacturaDTO
                        {
                            DetalleFacturaId = d.DetalleFacturaId,
                            ProductoId = d.ProductoId,
                            NombreProducto = d.NombreProducto,
                            DescripcionProducto = d.DescripcionProducto,
                            Cantidad = d.Cantidad,
                            PrecioUnitario = d.PrecioUnitario,
                            PorcentajeDescuento = d.PorcentajeDescuento,
                            MontoDescuento = d.MontoDescuento,
                            Subtotal = d.Subtotal
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    facturas,
                    totalRegistros,
                    pagina,
                    tamano,
                    totalPaginas = (int)Math.Ceiling((double)totalRegistros / tamano)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener facturas");
                return StatusCode(500, new { message = "Error al obtener facturas" });
            }
        }

        [HttpGet("facturas/{id}")]
        [Authorize]
        public async Task<ActionResult<FacturaDTO>> ObtenerFacturaPorId(int id)
        {
            try
            {
                var factura = await _context.Facturas
                    .Include(f => f.UsuarioCreador)
                    .Include(f => f.DetallesFactura)
                        .ThenInclude(d => d.Producto)
                            .ThenInclude(p => p.Llanta)
                    .Where(f => f.FacturaId == id)
                    .Select(f => new FacturaDTO
                    {
                        FacturaId = f.FacturaId,
                        NumeroFactura = f.NumeroFactura,
                        ClienteId = f.ClienteId,
                        NombreCliente = f.NombreCliente,
                        IdentificacionCliente = f.IdentificacionCliente ?? string.Empty,
                        TelefonoCliente = f.TelefonoCliente,
                        EmailCliente = f.EmailCliente,
                        DireccionCliente = f.DireccionCliente,
                        FechaFactura = f.FechaFactura,
                        FechaVencimiento = f.FechaVencimiento,
                        Subtotal = f.Subtotal,
                        DescuentoGeneral = f.DescuentoGeneral,
                        PorcentajeImpuesto = f.PorcentajeImpuesto,
                        MontoImpuesto = f.MontoImpuesto ?? 0,
                        Total = f.Total,
                        Estado = f.Estado,
                        TipoDocumento = f.TipoDocumento,
                        MetodoPago = f.MetodoPago,
                        Observaciones = f.Observaciones,
                        UsuarioCreadorId = f.UsuarioCreadorId,
                        UsuarioCreadorNombre = f.UsuarioCreador.NombreUsuario,
                        FechaCreacion = f.FechaCreacion,
                        FechaActualizacion = f.FechaActualizacion,
                        DetallesFactura = f.DetallesFactura.Select(d => new DetalleFacturaDTO
                        {
                            DetalleFacturaId = d.DetalleFacturaId,
                            ProductoId = d.ProductoId,
                            NombreProducto = d.NombreProducto,
                            DescripcionProducto = d.DescripcionProducto,
                            Cantidad = d.Cantidad,
                            PrecioUnitario = d.PrecioUnitario,
                            PorcentajeDescuento = d.PorcentajeDescuento,
                            MontoDescuento = d.MontoDescuento,
                            Subtotal = d.Subtotal,
                            StockDisponible = (int)(d.Producto.CantidadEnInventario ?? 0),
                            EsLlanta = d.Producto.Llanta.Any(),
                            MedidaLlanta = d.Producto.Llanta.Any() ? 
                                d.Producto.Llanta.First().Ancho + "/" + d.Producto.Llanta.First().Perfil + "R" + d.Producto.Llanta.First().Diametro : null,
                            MarcaLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Marca : null,
                            ModeloLlanta = d.Producto.Llanta.Any() ? d.Producto.Llanta.First().Modelo : null
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (factura == null)
                    return NotFound(new { message = "Factura no encontrada" });

                return Ok(factura);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener factura: {Id}", id);
                return StatusCode(500, new { message = "Error al obtener factura" });
            }
        }

        [HttpPut("facturas/{id}/estado")]
        [Authorize]
        public async Task<IActionResult> ActualizarEstadoFactura(int id, [FromBody] string nuevoEstado)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "EditarFacturas",
                "Solo usuarios con permiso 'EditarFacturas' pueden actualizar facturas");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var factura = await _context.Facturas.FindAsync(id);
                if (factura == null)
                    return NotFound(new { message = "Factura no encontrada" });

                var estadosValidos = new[] { "Pendiente", "Pagada", "Anulada", "Vencida" };
                if (!estadosValidos.Contains(nuevoEstado))
                    return BadRequest(new { message = "Estado no válido" });

                factura.Estado = nuevoEstado;
                factura.FechaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Estado actualizado exitosamente", nuevoEstado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al actualizar estado de factura: {Id}", id);
                return StatusCode(500, new { message = "Error al actualizar estado" });
            }
        }

        // =====================================
        // MÉTODOS AUXILIARES
        // =====================================

        private async Task<string> GenerarNumeroFactura(string tipoDocumento)
        {
            var prefijo = tipoDocumento == "Proforma" ? "PRO" : "FAC";
            var año = DateTime.Now.Year;
            var mes = DateTime.Now.Month;

            var ultimoNumero = await _context.Facturas
                .Where(f => f.TipoDocumento == tipoDocumento && 
                           f.FechaFactura.Year == año && 
                           f.FechaFactura.Month == mes)
                .CountAsync();

            var numeroConsecutivo = (ultimoNumero + 1).ToString("D6");
            return $"{prefijo}-{año:D4}{mes:D2}-{numeroConsecutivo}";
        }

        private async Task<List<string>> ValidarStockProductos(List<DetalleFacturaDTO> detalles, string tipoDocumento)
        {
            var errores = new List<string>();

            // Solo validar stock para facturas, no para proformas
            if (tipoDocumento == "Proforma")
                return errores;

            foreach (var detalle in detalles)
            {
                var producto = await _context.Productos
                    .Where(p => p.ProductoId == detalle.ProductoId)
                    .FirstOrDefaultAsync();

                if (producto == null)
                {
                    errores.Add($"Producto {detalle.NombreProducto} no encontrado");
                    continue;
                }

                if ((producto.CantidadEnInventario ?? 0) < detalle.Cantidad)
                {
                    errores.Add($"Stock insuficiente para {detalle.NombreProducto}. Disponible: {producto.CantidadEnInventario}, Solicitado: {detalle.Cantidad}");
                }
            }

            return errores;
        }
    }
}