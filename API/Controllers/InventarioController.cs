
using API.Data;
using API.Extensions;
using API.ServicesAPI;
using API.ServicesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.IO;
using System.Net;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Inventario;
using Tuco.Clases.Models;

namespace API.Controllers
{
    /// <summary>
    /// Controlador para GESTIÓN DE PRODUCTOS e INVENTARIOS PROGRAMADOS
    /// NO incluye ejecución de inventarios (eso está en TomaInventarioController)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILogger<InventarioController> _logger;
        private readonly INotificacionService _notificacionService;
        private readonly IPermisosService _permisosService;
        private readonly IAjustesInventarioPendientesService _ajustesService;

        public InventarioController(
            TucoContext context,
            IWebHostEnvironment webHostEnvironment,
            ILogger<InventarioController> logger,
            INotificacionService notificacionService,
            IPermisosService permisosService, 
            IAjustesInventarioPendientesService ajustesService)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _logger = logger;
            _notificacionService = notificacionService;
            _permisosService = permisosService;
            _ajustesService = ajustesService;
        }

        // =====================================
        // GESTIÓN DE PRODUCTOS
        // =====================================

        [HttpGet("productos")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> ObtenerProductos()
        {
            try
            {
                var puedeVerCostos = await this.TienePermisoAsync(_permisosService, "VerCostos");
                var puedeVerUtilidades = await this.TienePermisoAsync(_permisosService, "VerUtilidades");

                _logger.LogInformation("🔍 Usuario {Usuario} - VerCostos: {VerCostos}, VerUtilidades: {VerUtilidades}",
                    User.Identity?.Name ?? "Anónimo", puedeVerCostos, puedeVerUtilidades);

                var productos = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .Select(p => new
                    {
                        p.ProductoId,
                        p.NombreProducto,
                        p.Descripcion,
                        Costo = puedeVerCostos ? p.Costo : null,
                        PorcentajeUtilidad = puedeVerUtilidades ? p.PorcentajeUtilidad : null,
                        UtilidadEnDinero = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m)
                            : (decimal?)null,
                        PrecioCalculado = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value + (p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m))
                            : p.Precio,
                        UsarCalculoAutomatico = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue),
                        p.Precio,
                        p.CantidadEnInventario,
                        p.StockMinimo,
                        p.FechaUltimaActualizacion,
                        TienePedidoPendiente = _context.DetallePedidos
                            .Where(dp => dp.ProductoId == p.ProductoId && 
                                        dp.Pedido != null && 
                                        dp.Pedido.Estado == "Pendiente")
                            .Any(),
                        Permisos = new
                        {
                            PuedeVerCostos = puedeVerCostos,
                            PuedeVerUtilidades = puedeVerUtilidades
                        },
                        ImagenesProductos = p.ImagenesProductos.Select(img => new
                        {
                            img.ImagenId,
                            img.Urlimagen,
                            img.Descripcion,
                            img.FechaCreacion
                        }),
                        Llanta = p.Llanta.Select(l => new
                        {
                            l.LlantaId,
                            l.Ancho,
                            l.Perfil,
                            l.Diametro,
                            l.Marca,
                            l.Modelo,
                            l.Capas,
                            l.IndiceVelocidad,
                            l.TipoTerreno
                        }).FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener productos");
                return StatusCode(500, new { message = "Error al obtener productos", timestamp = DateTime.Now });
            }
        }

        [HttpGet("productos/{id}")]
        [Authorize]
        public async Task<ActionResult<object>> ObtenerProductoPorId(int id)
        {
            try
            {
                var puedeVerCostos = await this.TienePermisoAsync(_permisosService, "VerCostos");
                var puedeVerUtilidades = await this.TienePermisoAsync(_permisosService, "VerUtilidades");

                var producto = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .Where(p => p.ProductoId == id)
                    .Select(p => new
                    {
                        p.ProductoId,
                        p.NombreProducto,
                        p.Descripcion,
                        Costo = puedeVerCostos ? p.Costo : null,
                        PorcentajeUtilidad = puedeVerUtilidades ? p.PorcentajeUtilidad : null,
                        UtilidadEnDinero = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m)
                            : (decimal?)null,
                        PrecioCalculado = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value + (p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m))
                            : p.Precio,
                        p.Precio,
                        p.CantidadEnInventario,
                        p.StockMinimo,
                        p.FechaUltimaActualizacion,
                        Permisos = new
                        {
                            PuedeVerCostos = puedeVerCostos,
                            PuedeVerUtilidades = puedeVerUtilidades
                        },
                        ImagenesProductos = p.ImagenesProductos.Select(img => new
                        {
                            img.ImagenId,
                            img.Urlimagen,
                            img.Descripcion,
                            img.FechaCreacion
                        }),
                        Llanta = p.Llanta.Select(l => new
                        {
                            l.LlantaId,
                            l.Ancho,
                            l.Perfil,
                            l.Diametro,
                            l.Marca,
                            l.Modelo,
                            l.Capas,
                            l.IndiceVelocidad,
                            l.TipoTerreno
                        }).FirstOrDefault()
                    })
                    .FirstOrDefaultAsync();

                if (producto == null)
                    return NotFound(new { message = "Producto no encontrado" });

                return Ok(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto por ID: {Id}", id);
                return StatusCode(500, new { message = "Error al obtener producto" });
            }
        }

        [HttpPost("productos")]
        [Authorize]
        public async Task<IActionResult> CrearProducto([FromBody] ProductoDTO productoDto)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "EditarProductos",
                "Solo usuarios con permiso 'EditarProductos' pueden crear productos");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                _logger.LogInformation("Usuario {Usuario} creando producto: {Nombre}",
                    User.Identity?.Name, productoDto.NombreProducto);

                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray());

                    return BadRequest(new { message = "Error de validación", errores });
                }

                if (string.IsNullOrEmpty(productoDto.NombreProducto))
                    return BadRequest(new { message = "El nombre del producto es requerido" });

                if (productoDto.Precio <= 0)
                    return BadRequest(new { message = "El precio debe ser mayor que cero" });

                var precioFinal = CalcularPrecioFinal(productoDto);
                if (precioFinal <= 0)
                    return BadRequest(new { message = "Debe especificar un precio válido o un costo con utilidad" });

                var producto = new Producto
                {
                    NombreProducto = productoDto.NombreProducto,
                    Descripcion = productoDto.Descripcion,
                    Costo = productoDto.Costo,
                    PorcentajeUtilidad = productoDto.PorcentajeUtilidad,
                    Precio = productoDto.Precio,
                    CantidadEnInventario = productoDto.CantidadEnInventario,
                    StockMinimo = productoDto.StockMinimo,
                    FechaUltimaActualizacion = DateTime.Now
                };

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                if (productoDto.Llanta != null)
                {
                    var llanta = new Llanta
                    {
                        ProductoId = producto.ProductoId,
                        Ancho = productoDto.Llanta.Ancho,
                        Perfil = productoDto.Llanta.Perfil,
                        Diametro = productoDto.Llanta.Diametro,
                        Marca = productoDto.Llanta.Marca,
                        Modelo = productoDto.Llanta.Modelo,
                        Capas = productoDto.Llanta.Capas,
                        IndiceVelocidad = productoDto.Llanta.IndiceVelocidad,
                        TipoTerreno = productoDto.Llanta.TipoTerreno
                    };

                    _context.Llantas.Add(llanta);
                    await _context.SaveChangesAsync();
                }

                return CreatedAtAction(nameof(ObtenerProductoPorId), new { id = producto.ProductoId },
                    new { productoId = producto.ProductoId, message = "Producto creado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear producto: {Nombre}", productoDto?.NombreProducto ?? "Desconocido");
                return StatusCode(500, new { message = $"Error al crear producto: {ex.Message}" });
            }
        }

        [HttpPut("productos/{id}")]
        [Authorize]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] ProductoDTO productoDto)
        {
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "EditarProductos",
                "Solo usuarios con permiso 'EditarProductos' pueden actualizar productos");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                var producto = await _context.Productos
                    .Include(p => p.Llanta)
                    .FirstOrDefaultAsync(p => p.ProductoId == id);

                if (producto == null)
                    return NotFound(new { message = "Producto no encontrado" });

                producto.NombreProducto = productoDto.NombreProducto;
                producto.Descripcion = productoDto.Descripcion;
                producto.CantidadEnInventario = productoDto.CantidadEnInventario;
                producto.StockMinimo = productoDto.StockMinimo;
                producto.FechaUltimaActualizacion = DateTime.Now;

                if (productoDto.Costo.HasValue && productoDto.PorcentajeUtilidad.HasValue)
                {
                    producto.Costo = productoDto.Costo;
                    producto.PorcentajeUtilidad = productoDto.PorcentajeUtilidad;
                    producto.Precio = CalcularPrecioFinal(productoDto);
                }
                else
                {
                    producto.Precio = productoDto.Precio ?? 0;
                    producto.Costo = null;
                    producto.PorcentajeUtilidad = null;
                }

                if (productoDto.Llanta != null)
                {
                    if (producto.Llanta.Any())
                    {
                        var llanta = producto.Llanta.First();
                        llanta.Ancho = productoDto.Llanta.Ancho;
                        llanta.Perfil = productoDto.Llanta.Perfil;
                        llanta.Diametro = productoDto.Llanta.Diametro;
                        llanta.Marca = productoDto.Llanta.Marca;
                        llanta.Modelo = productoDto.Llanta.Modelo;
                        llanta.Capas = productoDto.Llanta.Capas;
                        llanta.IndiceVelocidad = productoDto.Llanta.IndiceVelocidad;
                        llanta.TipoTerreno = productoDto.Llanta.TipoTerreno;
                    }
                    else
                    {
                        var llanta = new Llanta
                        {
                            ProductoId = id,
                            Ancho = productoDto.Llanta.Ancho,
                            Perfil = productoDto.Llanta.Perfil,
                            Diametro = productoDto.Llanta.Diametro,
                            Marca = productoDto.Llanta.Marca,
                            Modelo = productoDto.Llanta.Modelo,
                            Capas = productoDto.Llanta.Capas,
                            IndiceVelocidad = productoDto.Llanta.IndiceVelocidad,
                            TipoTerreno = productoDto.Llanta.TipoTerreno
                        };
                        _context.Llantas.Add(llanta);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Producto actualizado exitosamente", productoId = id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar producto ID: {Id}", id);
                return StatusCode(500, new { message = "Error interno al actualizar producto", error = ex.Message });
            }
        }

        [HttpDelete("productos/{id}")]
        [Authorize]
        public async Task<IActionResult> EliminarProducto(int id)
        {
            var validacion = await this.ValidarPermisoAsync(_permisosService, "Eliminar Productos",
                "Solo usuarios con permiso 'EliminarProductos' pueden eliminar productos");
            if (validacion != null) return validacion;

            try
            {
                var producto = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .FirstOrDefaultAsync(p => p.ProductoId == id);

                if (producto == null)
                    return NotFound(new { message = "Producto no encontrado" });

                // Eliminar archivos físicos de imágenes
                if (producto.ImagenesProductos.Any())
                {
                    string webRootPath = _webHostEnvironment.WebRootPath ??
                        Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");

                    foreach (var imagen in producto.ImagenesProductos)
                    {
                        try
                        {
                            if (!string.IsNullOrEmpty(imagen.Urlimagen))
                            {
                                string rutaCompleta = Path.Combine(webRootPath, imagen.Urlimagen.TrimStart('/'));
                                if (System.IO.File.Exists(rutaCompleta))
                                    System.IO.File.Delete(rutaCompleta);
                            }
                        }
                        catch (Exception fileEx)
                        {
                            _logger.LogError(fileEx, "Error al eliminar archivo: {Url}", imagen.Urlimagen);
                        }
                    }
                }

                _context.Productos.Remove(producto);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Producto eliminado exitosamente",
                    productoId = id,
                    nombreProducto = producto.NombreProducto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar producto ID: {Id}", id);
                return StatusCode(500, new { message = "Error interno al eliminar producto" });
            }
        }

        [HttpPost("productos/{id}/imagenes")]
        public async Task<IActionResult> SubirImagenesProducto(int id, [FromForm] List<IFormFile> imagenes)
        {
            try
            {
                var producto = await _context.Productos.FindAsync(id);
                if (producto == null)
                    return NotFound(new { message = "Producto no encontrado" });

                if (imagenes == null || !imagenes.Any())
                    return BadRequest(new { message = "No se proporcionaron imágenes" });

                string webRootPath = _webHostEnvironment.WebRootPath ??
                    Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");

                string uploadsFolder = Path.Combine(webRootPath, "uploads", "productos");

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var imagenesGuardadas = new List<ImagenesProducto>();

                foreach (var imagen in imagenes)
                {
                    if (imagen.Length > 0)
                    {
                        string nombreArchivo = $"{Guid.NewGuid()}_{Path.GetFileName(imagen.FileName)}";
                        string rutaArchivo = Path.Combine(uploadsFolder, nombreArchivo);

                        using (var stream = new FileStream(rutaArchivo, FileMode.Create))
                        {
                            await imagen.CopyToAsync(stream);
                        }

                        var imagenProducto = new ImagenesProducto
                        {
                            ProductoId = id,
                            Urlimagen = $"/uploads/productos/{nombreArchivo}",
                            Descripcion = $"Imagen de {producto.NombreProducto}",
                            FechaCreacion = DateTime.Now
                        };

                        imagenesGuardadas.Add(imagenProducto);
                    }
                }

                _context.ImagenesProductos.AddRange(imagenesGuardadas);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Se subieron {imagenesGuardadas.Count} imágenes exitosamente",
                    imagenes = imagenesGuardadas
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir imágenes para el producto ID: {Id}", id);
                return StatusCode(500, new { message = "Error al subir imágenes" });
            }
        }

        [HttpDelete("productos/{productoId}/imagenes/{imagenId}")]
        [Authorize]
        public async Task<IActionResult> EliminarImagenProducto(int productoId, int imagenId)
        {
            var validacion = await this.ValidarPermisoAsync(_permisosService, "EditarProductos",
                "Solo usuarios con permiso 'EditarProductos' pueden eliminar imágenes");
            if (validacion != null) return validacion;

            try
            {
                var imagen = await _context.ImagenesProductos
                    .FirstOrDefaultAsync(img => img.ImagenId == imagenId && img.ProductoId == productoId);

                if (imagen == null)
                    return NotFound(new { message = "Imagen no encontrada" });

                // Eliminar archivo físico
                try
                {
                    if (!string.IsNullOrEmpty(imagen.Urlimagen))
                    {
                        string webRootPath = _webHostEnvironment.WebRootPath ??
                            Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");
                        string rutaCompleta = Path.Combine(webRootPath, imagen.Urlimagen.TrimStart('/'));

                        if (System.IO.File.Exists(rutaCompleta))
                            System.IO.File.Delete(rutaCompleta);
                    }
                }
                catch (Exception fileEx)
                {
                    _logger.LogError(fileEx, "Error al eliminar archivo físico: {Url}", imagen.Urlimagen);
                }

                _context.ImagenesProductos.Remove(imagen);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Imagen eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar imagen {ImagenId} del producto {ProductoId}", imagenId, productoId);
                return StatusCode(500, new { message = "Error interno al eliminar imagen" });
            }
        }

        [HttpPost("productos/{id}/ajustar-stock")]
        [Authorize]
        public async Task<IActionResult> AjustarStockRapido(int id, [FromBody] AjusteStockRapidoDTO ajusteDto)
        {
            var validacion = await this.ValidarPermisoAsync(_permisosService, "Ajustar Stock",
                "Solo usuarios con permiso 'Ajustar Stock' pueden ajustar el inventario");
            if (validacion != null) return validacion;

            try
            {
                // ✅ CASO 1: FINALIZACIÓN DE INVENTARIO (MÚLTIPLES AJUSTES)
                if (ajusteDto.EsFinalizacionInventario && ajusteDto.InventarioProgramadoId.HasValue)
                {
                    return await ProcesarFinalizacionInventario(ajusteDto.InventarioProgramadoId.Value);
                }

                // ✅ CASO 2: AJUSTE INDIVIDUAL (LÓGICA ORIGINAL)
                return await ProcesarAjusteIndividual(id, ajusteDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ajustar stock del producto {Id}", id);
                return StatusCode(500, new { message = "Error interno al ajustar stock" });
            }
        }

        /// <summary>
        /// Procesa la finalización de inventario aplicando todos los ajustes pendientes
        /// </summary>
        private async Task<IActionResult> ProcesarFinalizacionInventario(int inventarioProgramadoId)
        {
            try
            {
                _logger.LogInformation("🏁 === INICIANDO FINALIZACIÓN DE INVENTARIO ===");
                _logger.LogInformation("📋 Inventario ID: {InventarioId}", inventarioProgramadoId);

                // ✅ OBTENER TODOS LOS AJUSTES PENDIENTES
                var ajustesPendientes = await _ajustesService.ObtenerAjustesPorInventarioAsync(inventarioProgramadoId);

                if (!ajustesPendientes.Any())
                {
                    return BadRequest(new { message = "No hay ajustes pendientes para aplicar" });
                }

                var ajustesAplicados = 0;
                var errores = new List<string>();

                // ✅ APLICAR CADA AJUSTE PENDIENTE
                foreach (var ajuste in ajustesPendientes.Where(a => a.Estado == "Pendiente"))
                {
                    try
                    {
                        var producto = await _context.Productos.FindAsync(ajuste.ProductoId);
                        if (producto != null)
                        {
                            var stockAnterior = (int)producto.CantidadEnInventario;
                            producto.CantidadEnInventario = ajuste.CantidadFinalPropuesta != null ? ajuste.CantidadFinalPropuesta : ajuste.CantidadFisicaContada;
                            producto.FechaUltimaActualizacion = DateTime.Now;

                            _logger.LogInformation("📦 Producto {ProductoId}: {StockAnterior} → {StockNuevo}",
                                ajuste.ProductoId, stockAnterior, producto.CantidadEnInventario);

                            ajustesAplicados++;
                        }
                    }
                    catch (Exception ex)
                    {
                        errores.Add($"Error en producto {ajuste.ProductoId}: {ex.Message}");
                        _logger.LogError(ex, "Error aplicando ajuste para producto {ProductoId}", ajuste.ProductoId);
                    }
                }

                // ✅ GUARDAR CAMBIOS
                await _context.SaveChangesAsync();

                // ✅ MARCAR AJUSTES COMO APLICADOS
                await _ajustesService.AplicarAjustesPendientesAsync(inventarioProgramadoId);

                // ✅ CAMBIAR ESTADO DEL INVENTARIO A COMPLETADO
                var inventario = await _context.InventariosProgramados.FindAsync(inventarioProgramadoId);
                if (inventario != null)
                {
                    inventario.Estado = "Completado";
                    await _context.SaveChangesAsync();
                }

                // ✅ NOTIFICAR AL CREADOR DEL INVENTARIO
                await NotificarCreadorInventario(inventario);

                _logger.LogInformation("✅ === FINALIZACIÓN COMPLETADA ===");
                _logger.LogInformation("📊 Ajustes aplicados: {Aplicados}", ajustesAplicados);

                return Ok(new
                {
                    message = "Inventario finalizado exitosamente",
                    ajustesAplicados = ajustesAplicados,
                    errores = errores,
                    inventarioId = inventarioProgramadoId,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al finalizar inventario {InventarioId}", inventarioProgramadoId);
                return StatusCode(500, new { message = "Error crítico al finalizar inventario" });
            }
        }

        /// <summary>
        /// Notifica al creador del inventario que fue finalizado
        /// </summary>
        private async Task NotificarCreadorInventario(InventarioProgramado inventario)
        {
            try
            {
                if (inventario?.UsuarioCreadorId == null) return;

                await _notificacionService.CrearNotificacionAsync(
                    usuarioId: inventario.UsuarioCreadorId,
                    titulo: "✅ Inventario Completado",
                    mensaje: $"El inventario '{inventario.Titulo}' ha sido finalizado con ajustes de stock aplicados.",
                    tipo: "success",
                    icono: "fas fa-check-circle",
                    urlAccion: $"/Inventario/DetalleInventarioProgramado/{inventario.InventarioProgramadoId}",
                    entidadTipo: "InventarioProgramado",
                    entidadId: inventario.InventarioProgramadoId
                );

                _logger.LogInformation("📧 Notificación enviada al creador del inventario (Usuario ID: {UserId})", inventario.UsuarioCreadorId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error enviando notificación al creador");
            }
        }

        /// <summary>
        /// Procesa un ajuste individual (lógica original)
        /// </summary>
        private async Task<IActionResult> ProcesarAjusteIndividual(int id, AjusteStockRapidoDTO ajusteDto)
        {
            try
            {
                _logger.LogInformation("🔧 === AJUSTE STOCK API ===");
                _logger.LogInformation("🔧 Producto ID: {ProductoId}", id);
                _logger.LogInformation("🔧 Tipo Ajuste: {TipoAjuste}", ajusteDto.TipoAjuste);
                _logger.LogInformation("🔧 Cantidad: {Cantidad}", ajusteDto.Cantidad);
                _logger.LogInformation("🔧 Usuario: {Usuario}", User.Identity?.Name);
                _logger.LogInformation("🔧 Timestamp: {Timestamp}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"));

                var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Ajustar Stock",
                    "Solo usuarios con permiso 'Ajustar Stock' pueden ajustar el inventario");
                if (validacionPermiso != null) return validacionPermiso;

                if (ajusteDto.Cantidad <= 0)
                    return BadRequest(new { message = "La cantidad debe ser mayor a cero" });

                var producto = await _context.Productos.FindAsync(id);
                if (producto == null)
                    return NotFound(new { message = "Producto no encontrado" });

                int stockAnterior = (int)producto.CantidadEnInventario;
                int nuevoStock = stockAnterior;

                switch (ajusteDto.TipoAjuste.ToLower())
                {
                    case "entrada":
                        nuevoStock = stockAnterior + ajusteDto.Cantidad;
                        break;
                    case "salida":
                        nuevoStock = Math.Max(0, stockAnterior - ajusteDto.Cantidad);
                        break;
                    case "ajuste":
                        nuevoStock = ajusteDto.Cantidad;
                        break;
                    default:
                        return BadRequest(new { message = "Tipo de ajuste no válido. Use: entrada, salida, o ajuste" });
                }

                producto.CantidadEnInventario = nuevoStock;
                producto.FechaUltimaActualizacion = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new AjusteStockRapidoResponseDTO
                {
                    Success = true,
                    Message = $"Stock ajustado exitosamente. {stockAnterior} → {nuevoStock} unidades",
                    ProductoId = id,
                    NombreProducto = producto.NombreProducto,
                    StockAnterior = stockAnterior,
                    StockNuevo = nuevoStock,
                    Diferencia = nuevoStock - stockAnterior,
                    TipoAjuste = ajusteDto.TipoAjuste,
                    StockBajo = nuevoStock <= producto.StockMinimo,
                    StockMinimo = (int)producto.StockMinimo,
                    Timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ajustar stock del producto {Id}", id);
                return StatusCode(500, new { message = "Error interno al ajustar stock" });
            }
        }

        // =====================================
        // PROGRAMACIÓN DE INVENTARIOS (CREAR/EDITAR)
        // =====================================

        [HttpPost("inventarios-programados")]
        [Authorize]
        public async Task<IActionResult> CrearInventarioProgramado([FromBody] InventarioProgramadoDTO dto)
        {
            var validacion = await this.ValidarPermisoAsync(_permisosService, "Programar Inventario",
                "Solo usuarios con permiso 'ProgramarInventario' pueden crear inventarios programados");
            if (validacion != null) return validacion;

            try
            {
                if (dto.FechaInicio > dto.FechaFin)
                    return BadRequest(new { message = "La fecha de inicio no puede ser posterior a la fecha de fin" });

                if (string.IsNullOrEmpty(dto.Titulo))
                    return BadRequest(new { message = "El título es obligatorio" });

                var inventario = new InventarioProgramado
                {
                    Titulo = dto.Titulo,
                    Descripcion = dto.Descripcion,
                    FechaInicio = dto.FechaInicio,
                    FechaFin = dto.FechaFin,
                    TipoInventario = dto.TipoInventario,
                    Estado = "Programado",
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = dto.UsuarioCreadorId,
                    UbicacionEspecifica = dto.UbicacionEspecifica,
                    IncluirStockBajo = dto.IncluirStockBajo
                };

                _context.InventariosProgramados.Add(inventario);
                await _context.SaveChangesAsync();

                // ✅ PRIMERO: Asignar automáticamente al creador con TODOS los permisos
                _logger.LogInformation("📋 Asignando automáticamente al creador (Usuario ID: {CreadorId}) con todos los permisos", 
                    inventario.UsuarioCreadorId);

                var asignacionCreador = new AsignacionUsuarioInventario
                {
                    InventarioProgramadoId = inventario.InventarioProgramadoId,
                    UsuarioId = inventario.UsuarioCreadorId,
                    PermisoConteo = true,
                    PermisoAjuste = true,
                    PermisoCompletar = true,
                    PermisoValidacion = true,
                    FechaAsignacion = DateTime.Now
                };
                _context.AsignacionesUsuariosInventario.Add(asignacionCreador);

                // ✅ SEGUNDO: Crear asignaciones de otros usuarios (evitando duplicar al creador)
                if (dto.AsignacionesUsuarios != null && dto.AsignacionesUsuarios.Any())
                {
                    foreach (var asignacion in dto.AsignacionesUsuarios)
                    {
                        // ✅ EVITAR DUPLICAR AL CREADOR
                        if (asignacion.UsuarioId == inventario.UsuarioCreadorId)
                        {
                            _logger.LogInformation("⚠️ Saltando asignación duplicada del creador (Usuario ID: {CreadorId})", 
                                inventario.UsuarioCreadorId);
                            continue;
                        }

                        var nuevaAsignacion = new AsignacionUsuarioInventario
                        {
                            InventarioProgramadoId = inventario.InventarioProgramadoId,
                            UsuarioId = asignacion.UsuarioId,
                            PermisoConteo = asignacion.PermisoConteo,
                            PermisoAjuste = asignacion.PermisoAjuste,
                            PermisoCompletar = asignacion.PermisoCompletar,
                            PermisoValidacion = asignacion.PermisoValidacion,
                            FechaAsignacion = DateTime.Now
                        };
                        _context.AsignacionesUsuariosInventario.Add(nuevaAsignacion);
                    }
                }

                await _context.SaveChangesAsync();

                // ✅ NOTIFICAR AL CREADOR
                await _notificacionService.CrearNotificacionAsync(
                    usuarioId: inventario.UsuarioCreadorId,
                    titulo: "✅ Inventario Creado",
                    mensaje: $"Has creado exitosamente el inventario: {inventario.Titulo}. Tienes permisos completos para gestionarlo.",
                    tipo: "success",
                    icono: "fas fa-clipboard-check",
                    urlAccion: $"/Inventario/DetalleInventarioProgramado/{inventario.InventarioProgramadoId}",
                    entidadTipo: "InventarioProgramado",
                    entidadId: inventario.InventarioProgramadoId
                );

                // ✅ NOTIFICAR A OTROS USUARIOS ASIGNADOS (excluyendo al creador)
                if (dto.AsignacionesUsuarios != null && dto.AsignacionesUsuarios.Any())
                {
                    foreach (var asignacion in dto.AsignacionesUsuarios)
                    {
                        // ✅ NO NOTIFICAR AL CREADOR NUEVAMENTE
                        if (asignacion.UsuarioId == inventario.UsuarioCreadorId)
                            continue;

                        await _notificacionService.CrearNotificacionAsync(
                            usuarioId: asignacion.UsuarioId,
                            titulo: "📋 Inventario Asignado",
                            mensaje: $"Te han asignado al inventario: {inventario.Titulo}",
                            tipo: "info",
                            icono: "fas fa-clipboard-list",
                            urlAccion: $"/Inventario/DetalleInventarioProgramado/{inventario.InventarioProgramadoId}",
                            entidadTipo: "InventarioProgramado",
                            entidadId: inventario.InventarioProgramadoId
                        );
                    }
                }

                return Ok(new
                {
                    message = "Inventario programado creado exitosamente",
                    inventarioId = inventario.InventarioProgramadoId,
                    success = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear inventario programado");
                return StatusCode(500, new { message = "Error al crear inventario programado" });
            }
        }

        [HttpGet("inventarios-programados")]
        public async Task<ActionResult<IEnumerable<InventarioProgramadoDTO>>> ObtenerInventariosProgramados()
        {
            try
            {
                var inventarios = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                        .ThenInclude(a => a.Usuario)
                    .Select(i => new InventarioProgramadoDTO
                    {
                        InventarioProgramadoId = i.InventarioProgramadoId,
                        Titulo = i.Titulo,
                        Descripcion = i.Descripcion,
                        FechaInicio = i.FechaInicio,
                        FechaFin = i.FechaFin,
                        TipoInventario = i.TipoInventario,
                        Estado = i.Estado,
                        FechaCreacion = i.FechaCreacion,
                        UsuarioCreadorId = i.UsuarioCreadorId,
                        UsuarioCreadorNombre = _context.Usuarios
                            .Where(u => u.UsuarioId == i.UsuarioCreadorId)
                            .Select(u => u.NombreUsuario)
                            .FirstOrDefault() ?? "Desconocido",
                        AsignacionesUsuarios = i.AsignacionesUsuarios.Select(a => new AsignacionUsuarioInventarioDTO
                        {
                            AsignacionId = a.AsignacionId,
                            InventarioProgramadoId = a.InventarioProgramadoId,
                            UsuarioId = a.UsuarioId,
                            NombreUsuario = a.Usuario.NombreUsuario,
                            EmailUsuario = a.Usuario.Email,
                            PermisoConteo = a.PermisoConteo,
                            PermisoAjuste = a.PermisoAjuste,
                            PermisoValidacion = a.PermisoValidacion,
                            PermisoCompletar = a.PermisoCompletar,
                            FechaAsignacion = a.FechaAsignacion
                        }).ToList(),
                        TotalProductos = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId) : 0,
                        ProductosContados = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.CantidadFisica != null) : 0,
                        Discrepancias = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.Diferencia != 0 && d.Diferencia != null) : 0
                    })
                    .OrderByDescending(i => i.FechaCreacion)
                    .ToListAsync();

                return Ok(inventarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener inventarios programados");
                return StatusCode(500, new { message = "Error al obtener inventarios programados" });
            }
        }

        [HttpGet("inventarios-programados/{id}")]
        public async Task<ActionResult<InventarioProgramadoDTO>> ObtenerInventarioProgramadoPorId(int id)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                        .ThenInclude(a => a.Usuario)
                    .Where(i => i.InventarioProgramadoId == id)
                    .Select(i => new InventarioProgramadoDTO
                    {
                        InventarioProgramadoId = i.InventarioProgramadoId,
                        Titulo = i.Titulo,
                        Descripcion = i.Descripcion,
                        FechaInicio = i.FechaInicio,
                        FechaFin = i.FechaFin,
                        TipoInventario = i.TipoInventario,
                        Estado = i.Estado,
                        FechaCreacion = i.FechaCreacion,
                        UsuarioCreadorId = i.UsuarioCreadorId,
                        UbicacionEspecifica = i.UbicacionEspecifica,
                        IncluirStockBajo = i.IncluirStockBajo,
                        AsignacionesUsuarios = i.AsignacionesUsuarios.Select(a => new AsignacionUsuarioInventarioDTO
                        {
                            AsignacionId = a.AsignacionId,
                            InventarioProgramadoId = a.InventarioProgramadoId,
                            UsuarioId = a.UsuarioId,
                            NombreUsuario = a.Usuario.NombreUsuario,
                            EmailUsuario = a.Usuario.Email,
                            PermisoConteo = a.PermisoConteo,
                            PermisoAjuste = a.PermisoAjuste,
                            PermisoValidacion = a.PermisoValidacion,
                            PermisoCompletar = a.PermisoCompletar,
                            FechaAsignacion = a.FechaAsignacion
                        }).ToList(),
                        TotalProductos = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId) : 0,
                        ProductosContados = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.CantidadFisica != null) : 0,
                        Discrepancias = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.Diferencia != 0 && d.Diferencia != null) : 0
                    })
                    .FirstOrDefaultAsync();

                if (inventario == null)
                    return NotFound(new { message = "Inventario programado no encontrado" });

                return Ok(inventario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener inventario programado por ID: {Id}", id);
                return StatusCode(500, new { message = "Error al obtener inventario programado" });
            }
        }

        [HttpPut("inventarios-programados/{id}")]
        public async Task<IActionResult> ActualizarInventarioProgramado(int id, [FromBody] InventarioProgramadoDTO dto)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                    return NotFound(new { message = "Inventario programado no encontrado" });

                if (inventario.Estado != "Programado")
                    return BadRequest(new { message = "No se puede editar un inventario que ya está en progreso o completado" });

                inventario.Titulo = dto.Titulo;
                inventario.Descripcion = dto.Descripcion;
                inventario.FechaInicio = dto.FechaInicio;
                inventario.FechaFin = dto.FechaFin;
                inventario.TipoInventario = dto.TipoInventario;
                inventario.UbicacionEspecifica = dto.UbicacionEspecifica;
                inventario.IncluirStockBajo = dto.IncluirStockBajo;

                // Actualizar asignaciones
                _context.AsignacionesUsuariosInventario.RemoveRange(inventario.AsignacionesUsuarios);

                if (dto.AsignacionesUsuarios != null && dto.AsignacionesUsuarios.Any())
                {
                    foreach (var asignacion in dto.AsignacionesUsuarios)
                    {
                        var nuevaAsignacion = new AsignacionUsuarioInventario
                        {
                            InventarioProgramadoId = id,
                            UsuarioId = asignacion.UsuarioId,
                            PermisoConteo = asignacion.PermisoConteo,
                            PermisoAjuste = asignacion.PermisoAjuste,
                            PermisoValidacion = asignacion.PermisoValidacion,
                            PermisoCompletar = asignacion.PermisoCompletar,
                            FechaAsignacion = DateTime.Now
                        };
                        _context.AsignacionesUsuariosInventario.Add(nuevaAsignacion);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Inventario programado actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar inventario programado: {Id}", id);
                return StatusCode(500, new { message = "Error al actualizar inventario programado" });
            }
        }

        [HttpDelete("inventarios-programados/{id}")]
        public async Task<IActionResult> EliminarInventarioProgramado(int id)
        {
            var validacion = await this.ValidarPermisoAsync(_permisosService, "ProgramarInventario",
                "Solo usuarios con permiso 'ProgramarInventario' pueden eliminar inventarios");
            if (validacion != null) return validacion;

            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                    return NotFound(new { message = "Inventario programado no encontrado" });

                if (inventario.Estado == "En Progreso")
                    return BadRequest(new { message = "No se puede eliminar un inventario en progreso" });

                _context.InventariosProgramados.Remove(inventario);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Inventario programado eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar inventario programado: {Id}", id);
                return StatusCode(500, new { message = "Error al eliminar inventario programado" });
            }
        }

        // =====================================
        // MÉTODOS AUXILIARES
        // =====================================

        private decimal CalcularPrecioFinal(ProductoDTO dto)
        {
            if (dto.Costo.HasValue && dto.PorcentajeUtilidad.HasValue)
            {
                var utilidad = dto.Costo.Value * (dto.PorcentajeUtilidad.Value / 100m);
                return dto.Costo.Value + utilidad;
            }
            return dto.Precio.GetValueOrDefault(0m);
        }

        // =====================================
        // ENDPOINTS DE BÚSQUEDA PARA LLANTAS
        // =====================================

        [HttpGet("marcas-llantas")]
        [Authorize]
        public async Task<ActionResult<List<string>>> ObtenerMarcasLlantas()
        {
            try
            {
                var marcas = await _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.Marca))
                    .Select(l => l.Marca)
                    .Distinct()
                    .OrderBy(m => m)
                    .ToListAsync();

                return Ok(marcas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener marcas de llantas");
                return StatusCode(500, new { message = "Error al obtener marcas" });
            }
        }

        [HttpGet("modelos-llantas/{marca}")]
        [Authorize]
        public async Task<ActionResult<List<string>>> ObtenerModelosPorMarca(string marca)
        {
            try
            {
                var modelos = await _context.Llantas
                    .Where(l => l.Marca == marca && !string.IsNullOrEmpty(l.Modelo))
                    .Select(l => l.Modelo)
                    .Distinct()
                    .OrderBy(m => m)
                    .ToListAsync();

                return Ok(modelos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener modelos para marca: {Marca}", marca);
                return StatusCode(500, new { message = "Error al obtener modelos" });
            }
        }

        [HttpGet("marcas-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarMarcasLlantas(string filtro = "")
        {
            try
            {
                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.Marca))
                    .Select(l => l.Marca)
                    .Distinct();

                if (!string.IsNullOrWhiteSpace(filtro))
                    query = query.Where(m => m.Contains(filtro));

                var marcas = await query.OrderBy(m => m).Take(10).ToListAsync();
                return Ok(marcas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar marcas");
                return StatusCode(500, new { message = "Error al buscar marcas" });
            }
        }

        [HttpGet("modelos-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarModelosLlantas(string filtro = "", string marca = "")
        {
            try
            {
                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.Modelo))
                    .Select(l => l.Modelo)
                    .Distinct();

                if (!string.IsNullOrWhiteSpace(marca))
                {
                    query = _context.Llantas
                        .Where(l => !string.IsNullOrEmpty(l.Modelo) && l.Marca == marca)
                        .Select(l => l.Modelo)
                        .Distinct();
                }

                if (!string.IsNullOrWhiteSpace(filtro))
                    query = query.Where(m => m.Contains(filtro));

                var modelos = await query.OrderBy(m => m).Take(10).ToListAsync();
                return Ok(modelos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar modelos");
                return StatusCode(500, new { message = "Error al buscar modelos" });
            }
        }

        [HttpGet("indices-velocidad-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarIndicesVelocidad(string filtro = "")
        {
            try
            {
                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.IndiceVelocidad))
                    .Select(l => l.IndiceVelocidad)
                    .Distinct();

                if (!string.IsNullOrWhiteSpace(filtro))
                    query = query.Where(i => i.Contains(filtro));

                var indices = await query.OrderBy(i => i).Take(10).ToListAsync();
                return Ok(indices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar índices de velocidad");
                return StatusCode(500, new { message = "Error al buscar índices de velocidad" });
            }
        }

        [HttpGet("tipos-terreno-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarTiposTerreno(string filtro = "")
        {
            try
            {
                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.TipoTerreno))
                    .Select(l => l.TipoTerreno)
                    .Distinct();

                if (!string.IsNullOrWhiteSpace(filtro))
                    query = query.Where(t => t.Contains(filtro));

                var tipos = await query.OrderBy(t => t).Take(10).ToListAsync();
                return Ok(tipos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar tipos de terreno");
                return StatusCode(500, new { message = "Error al buscar tipos de terreno" });
            }
        }
    }
}
