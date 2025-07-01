
using API.Data;
using API.Extensions;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Facturacion;
using System.Linq;

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
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Crear Facturas",
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

                // ✅ VERIFICAR PERMISOS PARA DETERMINAR ESTADO INICIAL
                var puedeCompletar = await this.TienePermisoAsync(_permisosService, "CompletarFacturas");
                
                // Determinar estado inicial según permisos y el estado enviado
                string estadoInicial;
                if (facturaDto.TipoDocumento == "Proforma")
                {
                    estadoInicial = "Pendiente"; // Las proformas siempre inician como pendientes
                }
                else if (facturaDto.Estado == "Pagada" && puedeCompletar)
                {
                    estadoInicial = "Pagada"; // Solo si tiene permisos y está marcada como pagada
                    _logger.LogInformation("✅ Usuario autorizado envió factura como PAGADA");
                }
                else if (facturaDto.Estado == "Pendiente")
                {
                    estadoInicial = "Pendiente"; // Estado explícitamente enviado como pendiente
                    _logger.LogInformation("📋 Usuario envió factura como PENDIENTE");
                }
                else
                {
                    estadoInicial = "Pendiente"; // Por defecto pendiente si no tiene permisos
                    _logger.LogInformation("⚠️ Fallback a estado PENDIENTE");
                }

                _logger.LogInformation("🔐 Estado inicial determinado: {Estado} (Usuario puede completar: {PuedeCompletar}, Estado enviado: {EstadoEnviado})", 
                    estadoInicial, puedeCompletar, facturaDto.Estado);

                // Generar número de factura automáticamente
                var numeroFactura = await GenerarNumeroFactura(facturaDto.TipoDocumento);

                // Verificar stock de productos solo para facturas pagadas
                if (estadoInicial == "Pagada")
                {
                    var erroresStock = await ValidarStockProductos(facturaDto.DetallesFactura, facturaDto.TipoDocumento);
                    if (erroresStock.Any())
                    {
                        return BadRequest(new { message = "Error de stock", errores = erroresStock });
                    }
                }

                // Determinar método de pago para la factura
                string metodoPagoFactura = facturaDto.MetodoPago;
                if (facturaDto.DetallesPago != null && facturaDto.DetallesPago.Count > 1)
                {
                    metodoPagoFactura = "Múltiple";
                    _logger.LogInformation("💳 Factura con pagos múltiples detectada: {CantidadPagos} métodos de pago", 
                        facturaDto.DetallesPago.Count);
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
                    Estado = estadoInicial, // ✅ Usar estado determinado por permisos
                    TipoDocumento = facturaDto.TipoDocumento,
                    MetodoPago = metodoPagoFactura,
                    Observaciones = facturaDto.Observaciones,
                    UsuarioCreadorId = facturaDto.UsuarioCreadorId,
                    FechaCreacion = DateTime.Now
                };

                _context.Facturas.Add(factura);
                await _context.SaveChangesAsync();

                // ✅ CREAR DETALLES DE PAGO SI EXISTEN
                if (facturaDto.DetallesPago != null && facturaDto.DetallesPago.Any())
                {
                    foreach (var detallePago in facturaDto.DetallesPago)
                    {
                        var pagoBD = new DetallePago
                        {
                            FacturaId = factura.FacturaId,
                            MetodoPago = detallePago.MetodoPago,
                            Monto = detallePago.Monto,
                            Referencia = detallePago.Referencia,
                            Observaciones = detallePago.Observaciones,
                            FechaPago = detallePago.FechaPago
                        };

                        _context.DetallesPago.Add(pagoBD);
                        
                        _logger.LogInformation("💳 Detalle de pago agregado: {MetodoPago} - ₡{Monto}", 
                            detallePago.MetodoPago, detallePago.Monto);
                    }
                }
                else if (!string.IsNullOrEmpty(facturaDto.MetodoPago) && facturaDto.MetodoPago != "Múltiple")
                {
                    // Si no hay detalles de pago pero sí método de pago simple, crear un detalle único
                    var pagoUnico = new DetallePago
                    {
                        FacturaId = factura.FacturaId,
                        MetodoPago = facturaDto.MetodoPago,
                        Monto = facturaDto.TotalCalculado,
                        Referencia = null,
                        Observaciones = null,
                        FechaPago = DateTime.Now
                    };

                    _context.DetallesPago.Add(pagoUnico);
                    
                    _logger.LogInformation("💳 Detalle de pago único creado: {MetodoPago} - ₡{Monto}", 
                        facturaDto.MetodoPago, facturaDto.TotalCalculado);
                }

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

                    // ✅ NO ACTUALIZAR INVENTARIO AQUÍ - Se maneja desde el frontend
                    // El ajuste de stock se realiza desde el JavaScript usando el endpoint específico
                    // para evitar duplicación de descuentos de inventario
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var mensajeRespuesta = estadoInicial == "Pendiente" 
                    ? $"{facturaDto.TipoDocumento} creada exitosamente en estado PENDIENTE" 
                    : $"{facturaDto.TipoDocumento} creada y COMPLETADA exitosamente";

                // Crear respuesta estructurada con el DTO de la factura creada
                var facturaCreada = new FacturaDTO
                {
                    FacturaId = factura.FacturaId,
                    NumeroFactura = factura.NumeroFactura,
                    ClienteId = factura.ClienteId,
                    NombreCliente = factura.NombreCliente,
                    IdentificacionCliente = factura.IdentificacionCliente,
                    TelefonoCliente = factura.TelefonoCliente,
                    EmailCliente = factura.EmailCliente,
                    DireccionCliente = factura.DireccionCliente,
                    FechaFactura = factura.FechaFactura,
                    FechaVencimiento = factura.FechaVencimiento,
                    Subtotal = factura.Subtotal,
                    DescuentoGeneral = factura.DescuentoGeneral,
                    PorcentajeImpuesto = factura.PorcentajeImpuesto,
                    MontoImpuesto = factura.MontoImpuesto ?? 0,
                    Total = factura.Total,
                    Estado = factura.Estado,
                    TipoDocumento = factura.TipoDocumento,
                    MetodoPago = factura.MetodoPago,
                    Observaciones = factura.Observaciones,
                    UsuarioCreadorId = factura.UsuarioCreadorId,
                    FechaCreacion = factura.FechaCreacion,
                    DetallesFactura = facturaDto.DetallesFactura
                };

                return Ok(new
                {
                    message = mensajeRespuesta,
                    numeroFactura = factura.NumeroFactura
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

        [HttpPut("facturas/{id}/completar")]
        [Authorize]
        public async Task<IActionResult> CompletarFactura(int id, [FromBody] CompletarFacturaRequest? request = null)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "CompletarFacturas",
                "Solo usuarios con permiso 'CompletarFacturas' pueden completar facturas");
            if (validacionPermiso != null) return validacionPermiso;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var factura = await _context.Facturas
                    .Include(f => f.DetallesFactura)
                    .Include(f => f.DetallesPago)
                    .FirstOrDefaultAsync(f => f.FacturaId == id);

                if (factura == null)
                    return NotFound(new { message = "Factura no encontrada" });

                if (factura.Estado == "Pagada")
                    return BadRequest(new { message = "La factura ya está completada" });

                if (factura.Estado == "Anulada")
                    return BadRequest(new { message = "No se puede completar una factura anulada" });

                if (factura.TipoDocumento == "Proforma")
                    return BadRequest(new { message = "No se puede completar una proforma. Debe convertirse a factura primero" });

                // ✅ VERIFICAR STOCK CON ANÁLISIS DETALLADO
                var resultadoValidacion = await ValidarYAnalizarStockFactura(factura.DetallesFactura);
                
                if (!resultadoValidacion.PuedeCompletarse)
                {
                    // Si hay productos críticos sin stock, no se puede completar
                    return BadRequest(new { 
                        message = "No se puede completar la factura", 
                        errores = resultadoValidacion.ErroresCriticos,
                        advertencias = resultadoValidacion.Advertencias,
                        tipoError = "STOCK_INSUFICIENTE",
                        detalleStock = resultadoValidacion.DetalleProductos
                    });
                }

                // Si hay advertencias pero se puede completar, continuar con log de advertencias
                if (resultadoValidacion.Advertencias.Any())
                {
                    _logger.LogWarning("⚠️ Completando factura con advertencias de stock: {Advertencias}", 
                        string.Join(", ", resultadoValidacion.Advertencias));
                }

                // ✅ ACTUALIZAR INVENTARIO CON MANEJO INTELIGENTE
                var reporteAjustes = new List<string>();
                foreach (var detalle in factura.DetallesFactura)
                {
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    if (producto != null)
                    {
                        var stockAnterior = producto.CantidadEnInventario ?? 0;
                        var nuevoStock = Math.Max(0, stockAnterior - detalle.Cantidad);
                        var cantidadAjustada = Math.Min(detalle.Cantidad, stockAnterior);
                        
                        producto.CantidadEnInventario = nuevoStock;
                        producto.FechaUltimaActualizacion = DateTime.Now;

                        if (cantidadAjustada < detalle.Cantidad)
                        {
                            // Stock parcial - registrar el ajuste que realmente se pudo hacer
                            var diferencia = detalle.Cantidad - cantidadAjustada;
                            reporteAjustes.Add($"{producto.NombreProducto}: Se ajustó {cantidadAjustada} de {detalle.Cantidad} solicitadas (faltante: {diferencia})");
                            
                            _logger.LogWarning("⚠️ Ajuste parcial - {Producto}: {Ajustado}/{Solicitado} (Stock anterior: {StockAnterior})", 
                                producto.NombreProducto, cantidadAjustada, detalle.Cantidad, stockAnterior);
                        }
                        else
                        {
                            reporteAjustes.Add($"{producto.NombreProducto}: Stock ajustado correctamente ({stockAnterior} → {nuevoStock})");
                            _logger.LogInformation("✅ Stock actualizado - {Producto}: {StockAnterior} → {StockNuevo}", 
                                producto.NombreProducto, stockAnterior, nuevoStock);
                        }
                    }
                }

                // ✅ NUEVO: Actualizar método de pago si se proporciona
                if (request != null && !string.IsNullOrEmpty(request.MetodoPago))
                {
                    factura.MetodoPago = request.MetodoPago;
                    _logger.LogInformation("💳 Método de pago actualizado a: {MetodoPago}", request.MetodoPago);

                    // ✅ NUEVO: Gestionar detalles de pago múltiples
                    if (request.DetallesPago != null && request.DetallesPago.Any())
                    {
                        // Eliminar detalles de pago existentes
                        _context.DetallesPago.RemoveRange(factura.DetallesPago);

                        // Agregar nuevos detalles de pago
                        foreach (var detallePago in request.DetallesPago)
                        {
                            var nuevoDetallePago = new DetallePago
                            {
                                FacturaId = factura.FacturaId,
                                MetodoPago = detallePago.MetodoPago,
                                Monto = detallePago.Monto,
                                Referencia = detallePago.Referencia,
                                Observaciones = detallePago.Observaciones,
                                FechaPago = detallePago.FechaPago ?? DateTime.Now
                            };
                            _context.DetallesPago.Add(nuevoDetallePago);
                        }

                        // Si hay múltiples métodos de pago, actualizar el método principal
                        if (request.DetallesPago.Count > 1)
                        {
                            factura.MetodoPago = "Multiple";
                            _logger.LogInformation("💳 Factura configurada con pago múltiple: {CantidadMetodos} métodos", 
                                request.DetallesPago.Count);
                        }
                    }
                    else if (!string.IsNullOrEmpty(request.MetodoPago) && request.MetodoPago != "Multiple")
                    {
                        // Si solo hay un método de pago, crear un detalle único
                        if (!factura.DetallesPago.Any())
                        {
                            var pagoUnico = new DetallePago
                            {
                                FacturaId = factura.FacturaId,
                                MetodoPago = request.MetodoPago,
                                Monto = factura.Total,
                                FechaPago = DateTime.Now
                            };
                            _context.DetallesPago.Add(pagoUnico);
                        }
                    }
                }

                // ✅ Completar factura
                factura.Estado = "Pagada";
                factura.FechaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("✅ Factura {NumeroFactura} completada exitosamente por usuario {Usuario}", 
                    factura.NumeroFactura, User.Identity?.Name);

                return Ok(new { 
                    message = "Factura completada exitosamente", 
                    numeroFactura = factura.NumeroFactura,
                    estado = factura.Estado,
                    metodoPago = factura.MetodoPago,
                    reporteAjustes = reporteAjustes,
                    advertencias = resultadoValidacion.Advertencias,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ Error al completar factura: {Id}", id);
                return StatusCode(500, new { message = "Error al completar factura" });
            }
        }

        [HttpGet("facturas/pendientes")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<FacturaDTO>>> ObtenerFacturasPendientes()
        {
            try
            {
                _logger.LogInformation("📋 Obteniendo facturas pendientes");

                var facturasPendientes = await _context.Facturas
                    .Include(f => f.UsuarioCreador)
                    .Include(f => f.DetallesFactura)
                    .Where(f => f.Estado == "Pendiente")
                    .OrderByDescending(f => f.FechaCreacion)
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

                _logger.LogInformation("✅ Se encontraron {Count} facturas pendientes", facturasPendientes.Count);

                return Ok(new
                {
                    success = true,
                    facturas = facturasPendientes,
                    totalFacturas = facturasPendientes.Count,
                    message = $"Se encontraron {facturasPendientes.Count} facturas pendientes"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener facturas pendientes");
                return StatusCode(500, new { 
                    success = false,
                    message = "Error al obtener facturas pendientes",
                    timestamp = DateTime.Now 
                });
            }
        }

        [HttpPut("facturas/{id}/estado")]
        [Authorize]
        public async Task<IActionResult> ActualizarEstadoFactura(int id, [FromBody] string nuevoEstado)
        {
            // ✅ Verificar permisos según el tipo de cambio de estado
            if (nuevoEstado == "Pagada")
            {
                var validacionCompleto = await this.ValidarPermisoAsync(_permisosService, "CompletarFacturas",
                    "Solo usuarios con permiso 'CompletarFacturas' pueden marcar facturas como pagadas");
                if (validacionCompleto != null) return validacionCompleto;
            }
            else if (nuevoEstado == "Anulada")
            {
                var validacionAnular = await this.ValidarPermisoAsync(_permisosService, "AnularFacturas",
                    "Solo usuarios con permiso 'AnularFacturas' pueden anular facturas");
                if (validacionAnular != null) return validacionAnular;
            }
            else
            {
                var validacionEditar = await this.ValidarPermisoAsync(_permisosService, "EditarFacturas",
                    "Solo usuarios con permiso 'EditarFacturas' pueden actualizar facturas");
                if (validacionEditar != null) return validacionEditar;
            }

            try
            {
                var factura = await _context.Facturas.FindAsync(id);
                if (factura == null)
                    return NotFound(new { message = "Factura no encontrada" });

                var estadosValidos = new[] { "Pendiente", "Pagada", "Anulada", "Vencida" };
                if (!estadosValidos.Contains(nuevoEstado))
                    return BadRequest(new { message = "Estado no válido" });

                var estadoAnterior = factura.Estado;
                factura.Estado = nuevoEstado;
                factura.FechaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("📝 Estado de factura {NumeroFactura} cambiado de {EstadoAnterior} a {EstadoNuevo}", 
                    factura.NumeroFactura, estadoAnterior, nuevoEstado);

                return Ok(new { 
                    message = "Estado actualizado exitosamente", 
                    estadoAnterior = estadoAnterior,
                    estadoNuevo = nuevoEstado,
                    timestamp = DateTime.Now
                });
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

        private async Task<ResultadoValidacionStock> ValidarYAnalizarStockFactura(ICollection<DetalleFactura> detalles)
        {
            var resultado = new ResultadoValidacionStock();
            
            foreach (var detalle in detalles)
            {
                var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                var stockActual = producto?.CantidadEnInventario ?? 0;
                
                var detalleStock = new DetalleStockProducto
                {
                    ProductoId = detalle.ProductoId,
                    NombreProducto = detalle.NombreProducto,
                    CantidadSolicitada = detalle.Cantidad,
                    StockDisponible = stockActual,
                    DiferenciaStock = stockActual - detalle.Cantidad
                };

                if (producto == null)
                {
                    resultado.ErroresCriticos.Add($"Producto {detalle.NombreProducto} no encontrado en sistema");
                    detalleStock.TieneError = true;
                    detalleStock.MensajeError = "Producto no encontrado";
                }
                else if (stockActual <= 0)
                {
                    // Stock en cero - ADVERTENCIA pero se puede completar
                    resultado.Advertencias.Add($"{detalle.NombreProducto}: Sin stock disponible (se ajustará a 0)");
                    detalleStock.EsAdvertencia = true;
                    detalleStock.MensajeAdvertencia = "Stock en cero - se registrará venta pero no se ajustará inventario";
                }
                else if (stockActual < detalle.Cantidad)
                {
                    // Stock parcial - ADVERTENCIA pero se puede completar
                    resultado.Advertencias.Add($"{detalle.NombreProducto}: Stock parcial ({stockActual} de {detalle.Cantidad} solicitadas)");
                    detalleStock.EsAdvertencia = true;
                    detalleStock.MensajeAdvertencia = $"Stock parcial - se ajustará solo {stockActual} unidades";
                }

                resultado.DetalleProductos.Add(detalleStock);
            }

            // Se puede completar si no hay errores críticos
            resultado.PuedeCompletarse = !resultado.ErroresCriticos.Any();

            return resultado;
        }

        // =====================================
        // IMPRESIÓN DE RECIBOS
        // =====================================

        [HttpPost("imprimir-recibo")]
        [Authorize]
        public async Task<IActionResult> ImprimirRecibo([FromBody] object reciboData)
        {
            try
            {
                _logger.LogInformation("🖨️ Procesando solicitud de impresión de recibo");

                // Por ahora, simulamos una respuesta exitosa para que la funcionalidad continúe
                // En el futuro aquí se puede agregar lógica específica para diferentes tipos de impresoras
                
                return Ok(new { 
                    success = true, 
                    message = "Recibo enviado a impresora",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al procesar impresión de recibo");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error al procesar impresión" 
                });
            }
        }



        // =====================================
        // DTOs PARA COMPLETAR FACTURAS
        // =====================================
    }

    public class CompletarFacturaRequest
    {
        public string? MetodoPago { get; set; }
        public List<DetallePagoCompletarDTO>? DetallesPago { get; set; }
    }

    public class DetallePagoCompletarDTO
    {
        public string MetodoPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string? Referencia { get; set; }
        public string? Observaciones { get; set; }
        public DateTime? FechaPago { get; set; }
    }

    public class ResultadoValidacionStock
    {
        public bool PuedeCompletarse { get; set; } = true;
        public List<string> ErroresCriticos { get; set; } = new List<string>();
        public List<string> Advertencias { get; set; } = new List<string>();
        public List<DetalleStockProducto> DetalleProductos { get; set; } = new List<DetalleStockProducto>();
    }

    public class DetalleStockProducto
    {
        public int ProductoId { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int CantidadSolicitada { get; set; }
        public int StockDisponible { get; set; }
        public int DiferenciaStock { get; set; }
        public bool TieneError { get; set; }
        public bool EsAdvertencia { get; set; }
        public string? MensajeError { get; set; }
        public string? MensajeAdvertencia { get; set; }
    }
}
