using API.Data;
using API.Extensions; // ✅ AGREGAR ESTA LÍNEA
using API.Services;
using API.Services.Interfaces;
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
    [ApiController]
    [Route("api/[controller]")]

    public class InventarioController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILogger<InventarioController> _logger;
        private readonly INotificacionService _notificacionService; // ← Agregar esta línea
        private readonly IPermisosService _permisosService; // ← Agregar este parámetro para permisos



        public InventarioController(
        TucoContext context,
        IWebHostEnvironment webHostEnvironment,
        ILogger<InventarioController> logger,
        INotificacionService notificacionService,
        IPermisosService permisosService) // ✅ AGREGAR ESTE PARÁMETRO
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _logger = logger;
            _notificacionService = notificacionService;
            _permisosService = permisosService; // ✅ AGREGAR ESTA ASIGNACIÓN
        }

        // GET: api/Inventario/productos
        [HttpGet("productos")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> ObtenerProductos()
        {
            try
            {
                // ✅ VERIFICACIÓN DINÁMICA DE PERMISOS
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

                        // ✅ INFORMACIÓN SENSIBLE - SOLO SI TIENE PERMISOS (CORREGIDO)
                        Costo = puedeVerCostos ? p.Costo : null,                         // ← CORREGIDO
                        PorcentajeUtilidad = puedeVerUtilidades ? p.PorcentajeUtilidad : null, // ← CORREGIDO

                        // ✅ CÁLCULOS SENSIBLES - SOLO SI TIENE AMBOS PERMISOS (CORREGIDO)
                        UtilidadEnDinero = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m)
                            : (decimal?)null,

                        PrecioCalculado = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value + (p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m))
                            : p.Precio,

                        UsarCalculoAutomatico = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue),

                        // ✅ INFORMACIÓN SIEMPRE VISIBLE
                        p.Precio, // Precio de venta siempre visible
                        p.CantidadEnInventario,
                        p.StockMinimo,
                        p.FechaUltimaActualizacion,

                        // ✅ METADATOS DE PERMISOS (útil para el frontend - opcional)
                        Permisos = new
                        {
                            PuedeVerCostos = puedeVerCostos,
                            PuedeVerUtilidades = puedeVerUtilidades
                        },

                        // ✅ PROPIEDADES EXISTENTES
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

                _logger.LogInformation("✅ Se obtuvieron {Cantidad} productos. Usuario: {Usuario}",
                    productos.Count, User.Identity?.Name ?? "Anónimo");

                return Ok(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al obtener productos");
                return StatusCode(500, new
                {
                    message = "Error al obtener productos",
                    timestamp = DateTime.Now
                });
            }
        }

        // GET: api/Inventario/productos/{id}
        [HttpGet("productos/{id}")]
        [Authorize] // Solo requiere autenticación
        public async Task<ActionResult<object>> ObtenerProductoPorId(int id)
        {
            try
            {
                // ✅ VERIFICACIÓN DINÁMICA DE PERMISOS
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

                        // ✅ INFORMACIÓN SENSIBLE - SOLO PARA USUARIOS CON PERMISOS
                        Costo = puedeVerCostos ? p.Costo : null,
                        PorcentajeUtilidad = puedeVerUtilidades ? p.PorcentajeUtilidad : null,

                        UtilidadEnDinero = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m)
                            : (decimal?)null,

                        PrecioCalculado = (puedeVerCostos && puedeVerUtilidades && p.Costo.HasValue && p.PorcentajeUtilidad.HasValue)
                            ? p.Costo.Value + (p.Costo.Value * (p.PorcentajeUtilidad.Value / 100m))
                            : p.Precio,

                        // ✅ INFORMACIÓN SIEMPRE VISIBLE
                        p.Precio,
                        p.CantidadEnInventario,
                        p.StockMinimo,
                        p.FechaUltimaActualizacion,

                        // ✅ METADATOS DE PERMISOS
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
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                return Ok(producto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener producto por ID: {Id}", id);
                return StatusCode(500, new { message = "Error al obtener producto" });
            }
        }

        // POST: api/Inventario/productos
        [HttpPost("productos")]
        [Authorize] // Solo requiere autenticación
        public async Task<IActionResult> CrearProducto([FromBody] ProductoDTO productoDto)
        {
            // ✅ VERIFICACIÓN DINÁMICA DEL PERMISO PARA EDITAR PRODUCTOS
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "EditarProductos",
                "Solo usuarios con permiso 'EditarProductos' pueden crear productos");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                // Registrar los datos recibidos
                _logger.LogInformation("Usuario {Usuario} creando producto: {Nombre}",
                    User.Identity?.Name, productoDto.NombreProducto);

                // ✅ EL RESTO DE TU CÓDIGO EXISTENTE SE MANTIENE IGUAL
                if (!ModelState.IsValid)
                {
                    var errores = ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        );

                    _logger.LogWarning("Error de validación del modelo: {Errores}",
                        JsonConvert.SerializeObject(errores));

                    return BadRequest(new { message = "Error de validación", errores });
                }

                if (string.IsNullOrEmpty(productoDto.NombreProducto))
                {
                    return BadRequest(new { message = "El nombre del producto es requerido" });
                }

                if (productoDto.Precio <= 0)
                {
                    return BadRequest(new { message = "El precio debe ser mayor que cero" });
                }

                var precioFinal = CalcularPrecioFinal(productoDto);
                if (precioFinal <= 0)
                {
                    return BadRequest(new { message = "Debe especificar un precio válido o un costo con utilidad" });
                }

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

                _logger.LogInformation("Producto creado exitosamente. ID: {Id}, Usuario: {Usuario}",
                    producto.ProductoId, User.Identity?.Name);

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
        
        // ✅ NUEVO: Método auxiliar para calcular el precio final
        private decimal CalcularPrecioFinal(ProductoDTO dto)
        {
            // Si tiene costo y utilidad, calcular automáticamente
            if (dto.Costo.HasValue && dto.PorcentajeUtilidad.HasValue)
            {
                var utilidad = dto.Costo.Value * (dto.PorcentajeUtilidad.Value / 100m);
                return dto.Costo.Value + utilidad;
            }

            // Si no, usar el precio manual o 0 si es null
            return dto.Precio.GetValueOrDefault(0m);
        }

        // POST: api/Inventario/productos/{id}/imagenes
        [HttpPost("productos/{id}/imagenes")]
        public async Task<IActionResult> SubirImagenesProducto(int id, [FromForm] List<IFormFile> imagenes)
        {
            try
            {
                // Verificar que el producto existe
                var producto = await _context.Productos.FindAsync(id);
                if (producto == null)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                // Verificar que hay imágenes
                if (imagenes == null || !imagenes.Any())
                {
                    return BadRequest(new { message = "No se proporcionaron imágenes" });
                }

                _logger.LogInformation($"Recibidas {imagenes.Count} imágenes para el producto ID {id}");

                // Asegurar que existe la carpeta wwwroot
                string webRootPath = _webHostEnvironment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    // Si WebRootPath es nulo, usamos ContentRootPath y creamos la carpeta wwwroot
                    webRootPath = Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");
                    Directory.CreateDirectory(webRootPath);
                    _logger.LogWarning($"WebRootPath era nulo. Se creó la carpeta wwwroot en: {webRootPath}");
                }

                // Ruta para guardar las imágenes en el servidor
                string uploadsFolder = Path.Combine(webRootPath, "uploads", "productos");

                // Crear las carpetas si no existen
                if (!Directory.Exists(Path.Combine(webRootPath, "uploads")))
                {
                    Directory.CreateDirectory(Path.Combine(webRootPath, "uploads"));
                }

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                    _logger.LogInformation($"Creando directorio para imágenes: {uploadsFolder}");
                }

                // Lista para las imágenes a guardar en la base de datos
                var imagenesGuardadas = new List<ImagenesProducto>();

                // Procesar cada imagen
                foreach (var imagen in imagenes)
                {
                    if (imagen.Length > 0)
                    {
                        // Generar un nombre único para la imagen
                        string nombreArchivo = $"{Guid.NewGuid()}_{Path.GetFileName(imagen.FileName)}";
                        string rutaArchivo = Path.Combine(uploadsFolder, nombreArchivo);

                        _logger.LogInformation($"Guardando imagen: {nombreArchivo} en {rutaArchivo}");

                        // Guardar el archivo físicamente
                        using (var stream = new FileStream(rutaArchivo, FileMode.Create))
                        {
                            await imagen.CopyToAsync(stream);
                        }

                        // Crear la entidad de imagen
                        var imagenProducto = new ImagenesProducto
                        {
                            ProductoId = id,
                            Urlimagen = $"/uploads/productos/{nombreArchivo}",
                            Descripcion = $"Imagen de {producto.NombreProducto}",
                            FechaCreacion = DateTime.Now
                        };

                        // Agregar a la lista
                        imagenesGuardadas.Add(imagenProducto);
                    }
                }

                // Guardar todas las imágenes en la base de datos
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
                return StatusCode(500, new { message = "Error al subir imágenes", error = ex.Message });
            }
        }

        // DELETE: api/Inventario/productos/{productoId}/imagenes/{imagenId}
        [HttpDelete("productos/{productoId}/imagenes/{imagenId}")]
        [Authorize]
        public async Task<IActionResult> EliminarImagenProducto(int productoId, int imagenId)
        {
            try
            {
                // ✅ VERIFICACIÓN DE PERMISOS
                var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "EditarProductos",
                    "Solo usuarios con permiso 'EditarProductos' pueden eliminar imágenes");
                if (validacionPermiso != null) return validacionPermiso;

                _logger.LogInformation("🗑️ === ELIMINANDO IMAGEN EN API ===");
                _logger.LogInformation("🗑️ Usuario: {Usuario}, ProductoId: {ProductoId}, ImagenId: {ImagenId}",
                    User.Identity?.Name, productoId, imagenId);

                // Verificar que el producto existe
                var producto = await _context.Productos.FindAsync(productoId);
                if (producto == null)
                {
                    _logger.LogWarning("❌ Producto no encontrado: {ProductoId}", productoId);
                    return NotFound(new { message = "Producto no encontrado" });
                }

                // Buscar la imagen específica
                var imagen = await _context.ImagenesProductos
                    .FirstOrDefaultAsync(img => img.ImagenId == imagenId && img.ProductoId == productoId);

                if (imagen == null)
                {
                    _logger.LogWarning("❌ Imagen no encontrada: ImagenId={ImagenId}, ProductoId={ProductoId}",
                        imagenId, productoId);
                    return NotFound(new { message = "Imagen no encontrada" });
                }

                _logger.LogInformation("✅ Imagen encontrada: {UrlImagen}", imagen.Urlimagen);

                // Eliminar el archivo físico si existe
                try
                {
                    if (!string.IsNullOrEmpty(imagen.Urlimagen))
                    {
                        // Construir la ruta completa del archivo
                        string webRootPath = _webHostEnvironment.WebRootPath;
                        if (string.IsNullOrEmpty(webRootPath))
                        {
                            webRootPath = Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");
                        }

                        // Limpiar la URL (remover el "/" inicial si existe)
                        string rutaRelativa = imagen.Urlimagen.TrimStart('/');
                        string rutaCompleta = Path.Combine(webRootPath, rutaRelativa);

                        _logger.LogInformation("🗑️ Intentando eliminar archivo: {RutaCompleta}", rutaCompleta);

                        if (System.IO.File.Exists(rutaCompleta))
                        {
                            System.IO.File.Delete(rutaCompleta);
                            _logger.LogInformation("✅ Archivo físico eliminado: {RutaCompleta}", rutaCompleta);
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Archivo físico no encontrado: {RutaCompleta}", rutaCompleta);
                        }
                    }
                }
                catch (Exception fileEx)
                {
                    _logger.LogError(fileEx, "❌ Error al eliminar archivo físico: {UrlImagen}", imagen.Urlimagen);
                    // Continuar con la eliminación de la base de datos aunque falle el archivo
                }

                // Eliminar el registro de la base de datos
                _context.ImagenesProductos.Remove(imagen);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Imagen eliminada exitosamente de la base de datos");
                _logger.LogInformation("🎉 Usuario {Usuario} eliminó imagen {ImagenId} del producto {ProductoId}",
                    User.Identity?.Name, imagenId, productoId);

                return Ok(new
                {
                    message = "Imagen eliminada exitosamente",
                    imagenId = imagenId,
                    productoId = productoId,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al eliminar imagen {ImagenId} del producto {ProductoId}",
                    imagenId, productoId);
                return StatusCode(500, new
                {
                    message = "Error interno al eliminar imagen",
                    error = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }

        // PUT: api/Inventario/productos/{id}
        [HttpPut("productos/{id}")]
        [Authorize] // Solo requiere autenticación
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] ProductoDTO productoDto)
        {
            // ✅ VERIFICACIÓN DINÁMICA DEL PERMISO PARA EDITAR PRODUCTOS
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "EditarProductos",
                "Solo usuarios con permiso 'EditarProductos' pueden actualizar productos");
            if (validacionPermiso != null) return validacionPermiso;

            try
            {
                _logger.LogInformation("💾 === INICIANDO ACTUALIZACIÓN EN API ===");
                _logger.LogInformation("👤 Usuario: {Usuario} actualizando producto ID: {Id}", User.Identity?.Name, id);
                _logger.LogInformation("📝 Nombre: '{Nombre}'", productoDto.NombreProducto);

                var producto = await _context.Productos
                    .Include(p => p.Llanta)
                    .FirstOrDefaultAsync(p => p.ProductoId == id);

                if (producto == null)
                {
                    _logger.LogWarning("❌ Producto no encontrado: ID {Id}", id);
                    return NotFound(new { message = "Producto no encontrado" });
                }

                _logger.LogInformation("✅ Producto encontrado: '{Nombre}'", producto.NombreProducto);

                // ✅ ACTUALIZAR DATOS BÁSICOS DEL PRODUCTO
                producto.NombreProducto = productoDto.NombreProducto;
                producto.Descripcion = productoDto.Descripcion;
                producto.CantidadEnInventario = productoDto.CantidadEnInventario;
                producto.StockMinimo = productoDto.StockMinimo;
                producto.FechaUltimaActualizacion = DateTime.Now;

                // ✅ MANEJAR PRECIO Y CÁLCULOS
                _logger.LogInformation("💰 === PROCESANDO PRECIO EN ACTUALIZACIÓN ===");
                _logger.LogInformation("💳 Costo recibido: {Costo}", productoDto.Costo);
                _logger.LogInformation("📊 Utilidad recibida: {Utilidad}%", productoDto.PorcentajeUtilidad);
                _logger.LogInformation("💵 Precio recibido: {Precio}", productoDto.Precio);

                // Si tiene costo y utilidad, usar cálculo automático
                if (productoDto.Costo.HasValue && productoDto.PorcentajeUtilidad.HasValue)
                {
                    _logger.LogInformation("🧮 Aplicando cálculo automático de precio");
                    producto.Costo = productoDto.Costo;
                    producto.PorcentajeUtilidad = productoDto.PorcentajeUtilidad;

                    // Calcular el precio automáticamente
                    var precioCalculado = CalcularPrecioFinal(productoDto);
                    producto.Precio = precioCalculado;

                    _logger.LogInformation("✅ Precio calculado automáticamente: ₡{Precio:N2}", precioCalculado);
                }
                else
                {
                    _logger.LogInformation("📝 Aplicando precio manual");
                    producto.Precio = productoDto.Precio ?? 0;
                    producto.Costo = null;
                    producto.PorcentajeUtilidad = null;

                    _logger.LogInformation("✅ Precio manual establecido: ₡{Precio:N2}", producto.Precio);
                }

                // ✅ MANEJAR DATOS DE LLANTA
                if (productoDto.Llanta != null)
                {
                    _logger.LogInformation("🛞 Procesando datos de llanta...");

                    if (producto.Llanta.Any())
                    {
                        _logger.LogInformation("🔄 Actualizando llanta existente");
                        var llanta = producto.Llanta.First();
                        llanta.Ancho = productoDto.Llanta.Ancho;
                        llanta.Perfil = productoDto.Llanta.Perfil;
                        llanta.Diametro = productoDto.Llanta.Diametro;
                        llanta.Marca = productoDto.Llanta.Marca;
                        llanta.Modelo = productoDto.Llanta.Modelo;
                        llanta.Capas = productoDto.Llanta.Capas;
                        llanta.IndiceVelocidad = productoDto.Llanta.IndiceVelocidad;
                        llanta.TipoTerreno = productoDto.Llanta.TipoTerreno;

                        _logger.LogInformation("✅ Llanta actualizada: {Marca} {Modelo}", llanta.Marca, llanta.Modelo);
                    }
                    else
                    {
                        _logger.LogInformation("➕ Creando nueva llanta para el producto");
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

                        _logger.LogInformation("✅ Nueva llanta creada: {Marca} {Modelo}", llanta.Marca, llanta.Modelo);
                    }
                }
                else
                {
                    _logger.LogInformation("ℹ️ No hay datos de llanta para procesar");
                }

                // ✅ GUARDAR CAMBIOS
                _logger.LogInformation("💾 Guardando cambios en la base de datos...");
                await _context.SaveChangesAsync();

                _logger.LogInformation("🎉 === ACTUALIZACIÓN COMPLETADA EXITOSAMENTE ===");
                _logger.LogInformation("✅ Producto ID {Id} actualizado por usuario {Usuario}", id, User.Identity?.Name);
                _logger.LogInformation("📝 Nuevo nombre: '{Nombre}'", producto.NombreProducto);
                _logger.LogInformation("💰 Nuevo precio: ₡{Precio:N2}", producto.Precio);
                _logger.LogInformation("📦 Nuevo stock: {Stock} (Mín: {StockMin})", producto.CantidadEnInventario, producto.StockMinimo);

                return Ok(new
                {
                    message = "Producto actualizado exitosamente",
                    productoId = id,
                    timestamp = DateTime.Now,
                    usuario = User.Identity?.Name
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al actualizar producto ID: {Id}", id);
                return StatusCode(500, new
                {
                    message = "Error interno al actualizar producto",
                    error = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }

        // DELETE: api/Inventario/productos/{id}
        [HttpDelete("productos/{id}")]
        [Authorize]
        public async Task<IActionResult> EliminarProducto(int id)
        {
            try
            {
                // ✅ VERIFICACIÓN DE PERMISOS
                var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "Eliminar Productos",
                    "Solo usuarios con permiso 'EliminarProductos' pueden eliminar productos");
                if (validacionPermiso != null) return validacionPermiso;

                _logger.LogInformation("🗑️ === ELIMINANDO PRODUCTO COMPLETO ===");
                _logger.LogInformation("🗑️ Usuario: {Usuario} eliminando producto ID: {Id}",
                    User.Identity?.Name, id);

                // Verificar que el producto existe
                var producto = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .FirstOrDefaultAsync(p => p.ProductoId == id);

                if (producto == null)
                {
                    _logger.LogWarning("❌ Producto no encontrado: {Id}", id);
                    return NotFound(new { message = "Producto no encontrado" });
                }

                _logger.LogInformation("✅ Producto encontrado: '{Nombre}' con {ImageCount} imágenes",
                    producto.NombreProducto, producto.ImagenesProductos.Count);

                // ✅ ELIMINAR ARCHIVOS FÍSICOS DE IMÁGENES
                if (producto.ImagenesProductos.Any())
                {
                    _logger.LogInformation("🖼️ Eliminando {Count} archivos de imagen...",
                        producto.ImagenesProductos.Count);

                    string webRootPath = _webHostEnvironment.WebRootPath;
                    if (string.IsNullOrEmpty(webRootPath))
                    {
                        webRootPath = Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");
                    }

                    foreach (var imagen in producto.ImagenesProductos)
                    {
                        try
                        {
                            if (!string.IsNullOrEmpty(imagen.Urlimagen))
                            {
                                string rutaRelativa = imagen.Urlimagen.TrimStart('/');
                                string rutaCompleta = Path.Combine(webRootPath, rutaRelativa);

                                if (System.IO.File.Exists(rutaCompleta))
                                {
                                    System.IO.File.Delete(rutaCompleta);
                                    _logger.LogInformation("✅ Archivo eliminado: {Archivo}", rutaCompleta);
                                }
                                else
                                {
                                    _logger.LogWarning("⚠️ Archivo no encontrado: {Archivo}", rutaCompleta);
                                }
                            }
                        }
                        catch (Exception fileEx)
                        {
                            _logger.LogError(fileEx, "❌ Error al eliminar archivo: {Url}", imagen.Urlimagen);
                            // Continuar con la eliminación aunque falle un archivo
                        }
                    }
                }

                // ✅ ELIMINAR REGISTROS DE LA BASE DE DATOS
                _logger.LogInformation("🗑️ Eliminando registros de la base de datos...");

                // Las imágenes se eliminarán automáticamente por CASCADE
                // Las llantas se eliminarán automáticamente por CASCADE

                _context.Productos.Remove(producto);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🎉 === ELIMINACIÓN COMPLETADA EXITOSAMENTE ===");
                _logger.LogInformation("✅ Producto '{Nombre}' (ID: {Id}) eliminado por usuario {Usuario}",
                    producto.NombreProducto, id, User.Identity?.Name);

                return Ok(new
                {
                    message = "Producto eliminado exitosamente",
                    productoId = id,
                    nombreProducto = producto.NombreProducto,
                    imagenesEliminadas = producto.ImagenesProductos.Count,
                    timestamp = DateTime.Now,
                    usuario = User.Identity?.Name
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al eliminar producto ID: {Id}", id);
                return StatusCode(500, new
                {
                    message = "Error interno al eliminar producto",
                    error = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }


        // POST: api/Inventario/inventarios-programados
        [HttpPost("inventarios-programados")]
        [Authorize] // ✅ Solo requiere autenticación
        public async Task<IActionResult> CrearInventarioProgramado([FromBody] InventarioProgramadoDTO dto)
        {
            // ✅ VERIFICACIÓN DINÁMICA DEL PERMISO
            var validacionPermiso = await this.ValidarPermisoAsync(_permisosService, "ProgramarInventario",
                "Solo usuarios con permiso 'ProgramarInventario' pueden crear inventarios programados");
            if (validacionPermiso != null) return validacionPermiso;

            _logger.LogInformation("Usuario {Usuario} iniciando creación de inventario programado: {Titulo}",
                User.Identity?.Name, dto.Titulo);

            string puntoFallo = "Iniciando proceso";
            try
            {
                puntoFallo = "Validando datos de entrada";

                // Validar los datos
                if (dto.FechaInicio > dto.FechaFin)
                {
                    return BadRequest(new { message = "La fecha de inicio no puede ser posterior a la fecha de fin" });
                }

                if (string.IsNullOrEmpty(dto.Titulo))
                {
                    return BadRequest(new { message = "El título es obligatorio" });
                }

                // ✅ EL RESTO DE TU CÓDIGO EXISTENTE SE MANTIENE IGUAL
                puntoFallo = "Creando entidad InventarioProgramado";

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

                puntoFallo = "Agregando InventarioProgramado al contexto";
                _context.InventariosProgramados.Add(inventario);

                puntoFallo = "Guardando InventarioProgramado en base de datos";
                await _context.SaveChangesAsync();

                puntoFallo = "Procesando asignaciones de usuarios";

                // Crear asignaciones de usuarios
                if (dto.AsignacionesUsuarios != null && dto.AsignacionesUsuarios.Any())
                {
                    puntoFallo = "Iterando asignaciones de usuarios";

                    foreach (var asignacion in dto.AsignacionesUsuarios)
                    {
                        puntoFallo = $"Creando asignación para usuario ID: {asignacion.UsuarioId}";

                        var nuevaAsignacion = new AsignacionUsuarioInventario
                        {
                            InventarioProgramadoId = inventario.InventarioProgramadoId,
                            UsuarioId = asignacion.UsuarioId,
                            PermisoConteo = asignacion.PermisoConteo,
                            PermisoAjuste = asignacion.PermisoAjuste,
                            PermisoValidacion = asignacion.PermisoValidacion,
                            FechaAsignacion = DateTime.Now
                        };

                        puntoFallo = $"Agregando asignación de usuario {asignacion.UsuarioId} al contexto";
                        _context.AsignacionesUsuariosInventario.Add(nuevaAsignacion);
                    }

                    puntoFallo = "Guardando asignaciones de usuarios en base de datos";
                    await _context.SaveChangesAsync();

                    // ✅ ENVIAR NOTIFICACIONES
                    puntoFallo = "Enviando notificaciones de asignación";
                    foreach (var asignacion in dto.AsignacionesUsuarios)
                    {
                        var titulo = "📋 Inventario Asignado";
                        var mensaje = $"Te han asignado al inventario: {inventario.Titulo}";
                        var urlAccion = $"/Inventario/DetalleInventarioProgramado/{inventario.InventarioProgramadoId}";

                        await _notificacionService.CrearNotificacionAsync(
                            usuarioId: asignacion.UsuarioId,
                            titulo: titulo,
                            mensaje: mensaje,
                            tipo: "info",
                            icono: "fas fa-clipboard-list",
                            urlAccion: urlAccion,
                            entidadTipo: "InventarioProgramado",
                            entidadId: inventario.InventarioProgramadoId
                        );
                    }

                    await _context.SaveChangesAsync();
                }

                puntoFallo = "Proceso completado exitosamente";

                _logger.LogInformation("Inventario programado creado exitosamente. ID: {Id}, Usuario: {Usuario}",
                    inventario.InventarioProgramadoId, User.Identity?.Name);

                return Ok(new
                {
                    message = "Inventario programado creado exitosamente",
                    inventarioId = inventario.InventarioProgramadoId,
                    success = true,
                    usuario = User.Identity?.Name
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear inventario programado en: {Punto}", puntoFallo);
                return StatusCode(500, new
                {
                    message = $"Error en: {puntoFallo}",
                    errorDetallado = ex.Message,
                    success = false
                });
            }
        }

        // GET: api/InventarioProgramado
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
                        // Agregar información de asignaciones
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
                            FechaAsignacion = a.FechaAsignacion
                        }).ToList(),
                        // Agregar estadísticas si está en progreso o completado
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

        // GET: api/InventarioProgramado/5
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
                            FechaAsignacion = a.FechaAsignacion
                        }).ToList(),
                        // Agregar estadísticas
                        TotalProductos = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId) : 0,
                        ProductosContados = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.CantidadFisica != null) : 0,
                        Discrepancias = i.Estado != "Programado" ?
                            _context.DetallesInventarioProgramado.Count(d => d.InventarioProgramadoId == i.InventarioProgramadoId && d.Diferencia != 0 && d.Diferencia != null) : 0
                    })
                    .FirstOrDefaultAsync();

                if (inventario == null)
                {
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                return Ok(inventario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener inventario programado por ID: {Id}", id);
                return StatusCode(500, new { message = "Error al obtener inventario programado" });
            }
        }

        // PUT: api/InventarioProgramado/5
        [HttpPut("inventarios-programados/{id}")]
        public async Task<IActionResult> ActualizarInventarioProgramado(int id, [FromBody] InventarioProgramadoDTO dto)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                {
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                // Verificar que el inventario esté en estado "Programado"
                if (inventario.Estado != "Programado")
                {
                    return BadRequest(new { message = "No se puede editar un inventario que ya está en progreso o completado" });
                }

                // Actualizar propiedades
                inventario.Titulo = dto.Titulo;
                inventario.Descripcion = dto.Descripcion;
                inventario.FechaInicio = dto.FechaInicio;
                inventario.FechaFin = dto.FechaFin;
                inventario.TipoInventario = dto.TipoInventario;
                inventario.UbicacionEspecifica = dto.UbicacionEspecifica;
                inventario.IncluirStockBajo = dto.IncluirStockBajo;

                // Actualizar asignaciones de usuarios
                // Primero eliminar asignaciones existentes
                _context.AsignacionesUsuariosInventario.RemoveRange(inventario.AsignacionesUsuarios);

                // Luego agregar las nuevas asignaciones
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

        // POST: api/InventarioProgramado/5/iniciar
        [HttpPost("inventarios-programados/{id}/iniciar")]
        public async Task<IActionResult> IniciarInventario(int id)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                {
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                // Verificar que el inventario esté en estado "Programado"
                if (inventario.Estado != "Programado")
                {
                    return BadRequest(new { message = "Este inventario ya está en progreso o completado" });
                }

                // Cambiar estado a "En Progreso"
                inventario.Estado = "En Progreso";

                // Generar los registros de detalle para todos los productos
                var productosQuery = _context.Productos.AsQueryable();

                // Filtrar por ubicación si se especificó
                if (!string.IsNullOrEmpty(inventario.UbicacionEspecifica))
                {
                    // Aquí habría que implementar la lógica para filtrar por ubicación
                    // Este es un ejemplo simplificado
                    // productosQuery = productosQuery.Where(p => p.Ubicacion == inventario.UbicacionEspecifica);
                }

                // Filtrar por stock bajo si se especificó
                if (!inventario.IncluirStockBajo)
                {
                    productosQuery = productosQuery.Where(p => p.CantidadEnInventario > p.StockMinimo);
                }

                var productos = await productosQuery.ToListAsync();

                // Crear registros de detalle para cada producto
                foreach (var producto in productos)
                {
                    var detalle = new DetalleInventarioProgramado
                    {
                        InventarioProgramadoId = id,
                        ProductoId = producto.ProductoId,
                        CantidadSistema = (int)producto.CantidadEnInventario,
                        // Los campos CantidadFisica, Diferencia, UsuarioConteoId y FechaConteo se llenarán durante el conteo
                    };

                    _context.DetallesInventarioProgramado.Add(detalle);
                }
                // ✅ NUEVO: Enviar notificaciones de inicio
                var usuariosAsignados = inventario.AsignacionesUsuarios.Select(a => a.UsuarioId).ToList();

                var titulo = "🚀 Inventario Iniciado";
                var mensaje = $"El inventario '{inventario.Titulo}' ha comenzado. ¡Puedes empezar a contar!";
                var urlAccion = $"/Inventario/DetalleInventarioProgramado/{id}";

                await _notificacionService.CrearNotificacionesAsync(
                    usuariosIds: usuariosAsignados,
                    titulo: titulo,
                    mensaje: mensaje,
                    tipo: "success",
                    icono: "fas fa-play-circle",
                    urlAccion: urlAccion,
                    entidadTipo: "InventarioProgramado",
                    entidadId: id
                );


                await _context.SaveChangesAsync();

                return Ok(new { message = "Inventario iniciado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al iniciar inventario: {Id}", id);
                return StatusCode(500, new { message = "Error al iniciar inventario" });
            }
        }

        // POST: api/InventarioProgramado/5/cancelar
        [HttpPost("inventarios-programados/{id}/cancelar")]
        public async Task<IActionResult> CancelarInventario(int id)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                {
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                // Verificar que el inventario no esté completado
                if (inventario.Estado == "Completado")
                {
                    return BadRequest(new { message = "No se puede cancelar un inventario ya completado" });
                }

                // Cambiar estado a "Cancelado"
                inventario.Estado = "Cancelado";

                // ✅ NUEVO: Enviar notificaciones de cancelación
                var usuariosAsignados = inventario.AsignacionesUsuarios.Select(a => a.UsuarioId).ToList();

                var titulo = "❌ Inventario Cancelado";
                var mensaje = $"El inventario '{inventario.Titulo}' ha sido cancelado.";
                var urlAccion = $"/Inventario/DetalleInventarioProgramado/{id}";

                await _notificacionService.CrearNotificacionesAsync(
                    usuariosIds: usuariosAsignados,
                    titulo: titulo,
                    mensaje: mensaje,
                    tipo: "warning",
                    icono: "fas fa-times-circle",
                    urlAccion: urlAccion,
                    entidadTipo: "InventarioProgramado",
                    entidadId: id
                );

                await _context.SaveChangesAsync();

                return Ok(new { message = "Inventario cancelado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cancelar inventario: {Id}", id);
                return StatusCode(500, new { message = "Error al cancelar inventario" });
            }
        }

        // POST: api/InventarioProgramado/5/completar
        [HttpPost("inventarios-programados/{id}/completar")]
        public async Task<IActionResult> CompletarInventario(int id)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .Include(i => i.AsignacionesUsuarios)
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                {
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                // Verificar que el inventario esté en progreso
                if (inventario.Estado != "En Progreso")
                {
                    return BadRequest(new { message = "Solo se puede completar un inventario que esté en progreso" });
                }

                // Cambiar estado a "Completado"
                inventario.Estado = "Completado";

                // Calcular diferencias para cualquier producto que no tenga cantidad física registrada
                var detallesSinContar = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == id && d.CantidadFisica == null)
                    .ToListAsync();

                foreach (var detalle in detallesSinContar)
                {
                    // Asumir que la cantidad física es igual a la del sistema
                    detalle.CantidadFisica = detalle.CantidadSistema;
                    detalle.Diferencia = 0;
                }

                // ✅ NUEVO: Calcular estadísticas para la notificación
                var detalles = await _context.DetallesInventarioProgramado
                    .Where(d => d.InventarioProgramadoId == id)
                    .ToListAsync();

                var totalProductos = detalles.Count;
                var discrepancias = detalles.Count(d => d.Diferencia != 0 && d.Diferencia != null);

                // Enviar notificaciones de finalización
                var usuariosAsignados = inventario.AsignacionesUsuarios.Select(a => a.UsuarioId).ToList();

                var titulo = "✅ Inventario Completado";
                var mensaje = $"El inventario '{inventario.Titulo}' ha sido completado. " +
                             $"Total: {totalProductos} productos, Discrepancias: {discrepancias}";
                var urlAccion = $"/Inventario/DetalleInventarioProgramado/{id}";

                await _notificacionService.CrearNotificacionesAsync(
                    usuariosIds: usuariosAsignados,
                    titulo: titulo,
                    mensaje: mensaje,
                    tipo: discrepancias > 0 ? "warning" : "success",
                    icono: "fas fa-check-circle",
                    urlAccion: urlAccion,
                    entidadTipo: "InventarioProgramado",
                    entidadId: id
                );

                await _context.SaveChangesAsync();

                return Ok(new { message = "Inventario completado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al completar inventario: {Id}", id);
                return StatusCode(500, new { message = "Error al completar inventario" });
            }
        }

        // Método para exportar a Excel (simplificado)
        [HttpGet("inventarios-programados/{id}/exportar-excel")]
        public async Task<IActionResult> ExportarResultadosExcel(int id)
        {
            try
            {
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

                if (inventario == null)
                {
                    return NotFound(new { message = "Inventario programado no encontrado" });
                }

                // Obtener los detalles del inventario
                var detalles = await _context.DetallesInventarioProgramado
                    .Include(d => d.Producto)
                    .Where(d => d.InventarioProgramadoId == id)
                    .ToListAsync();

                // Aquí iría el código para generar el archivo Excel
                // Devolvemos un archivo vacío para este ejemplo simplificado
                var stream = new MemoryStream();
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Resultados_Inventario_{id}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar inventario a Excel: {Id}", id);
                return StatusCode(500, new { message = "Error al exportar resultados a Excel" });
           }
       }

       // Método para exportar a PDF (simplificado)
       [HttpGet("inventarios-programados/{id}/exportar-pdf")]
       public async Task<IActionResult> ExportarResultadosPDF(int id)
       {
           try
           {
               var inventario = await _context.InventariosProgramados
                   .FirstOrDefaultAsync(i => i.InventarioProgramadoId == id);

               if (inventario == null)
               {
                   return NotFound(new { message = "Inventario programado no encontrado" });
               }

               // Obtener los detalles del inventario
               var detalles = await _context.DetallesInventarioProgramado
                   .Include(d => d.Producto)
                   .Where(d => d.InventarioProgramadoId == id)
                   .ToListAsync();

               // Aquí iría el código para generar el archivo PDF
               // Devolvemos un archivo vacío para este ejemplo simplificado
               var stream = new MemoryStream();
               return File(stream.ToArray(), "application/pdf", $"Resultados_Inventario_{id}.pdf");
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Error al exportar inventario a PDF: {Id}", id);
               return StatusCode(500, new { message = "Error al exportar resultados a PDF" });
           }
       }

        // POST: api/InventarioProgramado/detalles/guardar-conteo
        [HttpPost("detalles/guardar-conteo")]
        public async Task<IActionResult> GuardarConteo([FromBody] ConteoProductoDTO dto)
        {
            try
            {
                var detalle = await _context.DetallesInventarioProgramado
                    .FirstOrDefaultAsync(d => d.InventarioProgramadoId == dto.InventarioProgramadoId && d.ProductoId == dto.ProductoId);

                if (detalle == null)
                {
                    return NotFound(new { message = "Detalle de inventario no encontrado" });
                }

                // Verificar permisos del usuario
                var asignacion = await _context.AsignacionesUsuariosInventario
                    .FirstOrDefaultAsync(a => a.InventarioProgramadoId == dto.InventarioProgramadoId && a.UsuarioId == dto.UsuarioId);

                if (asignacion == null || !asignacion.PermisoConteo)
                {
                    return BadRequest(new { message = "El usuario no tiene permisos para realizar conteos en este inventario" });
                }

                // Verificar que el inventario esté en progreso
                var inventario = await _context.InventariosProgramados
                    .FirstOrDefaultAsync(i => i.InventarioProgramadoId == dto.InventarioProgramadoId);

                if (inventario == null || inventario.Estado != "En Progreso")
                {
                    return BadRequest(new { message = "El inventario no está en progreso" });
                }

                // Actualizar el detalle
                detalle.CantidadFisica = dto.CantidadFisica;
                detalle.Diferencia = dto.CantidadFisica - detalle.CantidadSistema;
                detalle.Observaciones = dto.Observaciones;
                detalle.UsuarioConteoId = dto.UsuarioId;
                detalle.FechaConteo = DateTime.Now;

                await _context.SaveChangesAsync();

                // Si hay una diferencia significativa, crear una alerta
                if (detalle.Diferencia.HasValue && Math.Abs(detalle.Diferencia.Value) > 0)
                {
                    // Obtener el nombre del producto
                    var producto = await _context.Productos
                        .FirstOrDefaultAsync(p => p.ProductoId == dto.ProductoId);

                    string nombreProducto = producto?.NombreProducto ?? $"Producto ID: {dto.ProductoId}";

                    // ✅ NUEVO: Crear notificación para usuarios con permiso de validación
                    var usuariosValidacion = await _context.AsignacionesUsuariosInventario
                        .Where(a => a.InventarioProgramadoId == dto.InventarioProgramadoId && a.PermisoValidacion)
                        .Select(a => a.UsuarioId)
                        .ToListAsync();

                    if (usuariosValidacion.Any())
                    {
                        var titulo = "⚠️ Discrepancia Detectada";
                        var mensaje = $"Discrepancia en '{nombreProducto}': Sistema={detalle.CantidadSistema}, " +
                                     $"Físico={detalle.CantidadFisica}, Diferencia={detalle.Diferencia}";
                        var urlAccion = $"/Inventario/DetalleInventarioProgramado/{dto.InventarioProgramadoId}";

                        await _notificacionService.CrearNotificacionesAsync(
                            usuariosIds: usuariosValidacion,
                            titulo: titulo,
                            mensaje: mensaje,
                            tipo: "warning",
                            icono: "fas fa-exclamation-triangle",
                            urlAccion: urlAccion,
                            entidadTipo: "InventarioProgramado",
                            entidadId: dto.InventarioProgramadoId
                        );
                    }

                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Conteo guardado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar conteo");
                return StatusCode(500, new { message = "Error al guardar conteo" });
            }
        }

        // ========================================
        // ENDPOINT ACTUALIZADO PARA AJUSTE RÁPIDO DE STOCK - API CONTROLLER
        // Reemplazar el método anterior en API/Controllers/InventarioController.cs
        // ========================================

        /// <summary>
        /// Ajusta el stock de un producto específico (ajuste rápido)
        /// </summary>
        /// <param name="id">ID del producto</param>
        /// <param name="ajusteDto">Datos del ajuste rápido</param>
        /// <returns>Resultado del ajuste</returns>
        [HttpPost("productos/{id}/ajustar-stock")]
        [Authorize]
        public async Task<IActionResult> AjustarStockRapido(int id, [FromBody] AjusteStockRapidoDTO ajusteDto)
        {
            try
            {
                // ✅ VERIFICACIÓN DE PERMISOS
                var validacion = await this.ValidarPermisoAsync(_permisosService, "Ajustar Stock",
                    "Solo usuarios con permiso 'Ajustar Stock' pueden ajustar el inventario");
                if (validacion != null) return validacion;

                _logger.LogInformation("📦 === AJUSTE RÁPIDO DE STOCK INICIADO ===");
                _logger.LogInformation("👤 Usuario: {Usuario}, Producto ID: {Id}", User.Identity?.Name, id);
                _logger.LogInformation("📊 Tipo: {Tipo}, Cantidad: {Cantidad}, Comentario: {Comentario}",
                    ajusteDto.TipoAjuste, ajusteDto.Cantidad, ajusteDto.Comentario ?? "Sin comentario");

                // Validar datos de entrada
                if (ajusteDto.Cantidad <= 0)
                {
                    return BadRequest(new { message = "La cantidad debe ser mayor a cero" });
                }

                if (string.IsNullOrEmpty(ajusteDto.TipoAjuste))
                {
                    return BadRequest(new { message = "Debe especificar el tipo de ajuste" });
                }

                // Buscar el producto con información adicional
                var producto = await _context.Productos
                    .Where(p => p.ProductoId == id)
                    .Select(p => new {
                        p.ProductoId,
                        p.NombreProducto,
                        p.CantidadEnInventario,
                        p.StockMinimo
                    })
                    .FirstOrDefaultAsync();

                if (producto == null)
                {
                    _logger.LogWarning("❌ Producto no encontrado: {Id}", id);
                    return NotFound(new { message = "Producto no encontrado" });
                }

                _logger.LogInformation("✅ Producto encontrado: '{Nombre}', Stock actual: {Stock}, Stock mínimo: {StockMin}",
                    producto.NombreProducto, producto.CantidadEnInventario, producto.StockMinimo);

                // Calcular nuevo stock según el tipo de ajuste
                int stockAnterior = (int)producto.CantidadEnInventario;
                int nuevoStock = stockAnterior;

                switch (ajusteDto.TipoAjuste.ToLower())
                {
                    case "entrada":
                        nuevoStock = stockAnterior + ajusteDto.Cantidad;
                        _logger.LogInformation("📈 Entrada de {Cantidad} unidades: {Anterior} + {Cantidad} = {Nuevo}",
                            ajusteDto.Cantidad, stockAnterior, ajusteDto.Cantidad, nuevoStock);
                        break;

                    case "salida":
                        nuevoStock = Math.Max(0, stockAnterior - ajusteDto.Cantidad);
                        if (stockAnterior < ajusteDto.Cantidad)
                        {
                            _logger.LogWarning("⚠️ Salida excede stock disponible. Stock: {Stock}, Salida solicitada: {Salida}, Nuevo stock: {Nuevo}",
                                stockAnterior, ajusteDto.Cantidad, nuevoStock);
                        }
                        _logger.LogInformation("📉 Salida de {Cantidad} unidades: {Anterior} - {Cantidad} = {Nuevo}",
                            ajusteDto.Cantidad, stockAnterior, ajusteDto.Cantidad, nuevoStock);
                        break;

                    case "ajuste":
                        nuevoStock = ajusteDto.Cantidad;
                        _logger.LogInformation("🔧 Ajuste directo: {Anterior} → {Nuevo}", stockAnterior, nuevoStock);
                        break;

                    default:
                        return BadRequest(new { message = "Tipo de ajuste no válido. Use: entrada, salida, o ajuste" });
                }

                // Actualizar el producto en la base de datos
                var productoEntity = await _context.Productos.FindAsync(id);
                if (productoEntity == null)
                {
                    return NotFound(new { message = "Error al actualizar: producto no encontrado" });
                }

                productoEntity.CantidadEnInventario = nuevoStock;
                productoEntity.FechaUltimaActualizacion = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ === AJUSTE COMPLETADO ===");
                _logger.LogInformation("📊 Stock anterior: {Anterior} → Stock nuevo: {Nuevo}", stockAnterior, nuevoStock);
                _logger.LogInformation("🔄 Diferencia: {Diferencia}", nuevoStock - stockAnterior);

                // Verificar si queda en stock bajo
                bool stockBajo = nuevoStock <= producto.StockMinimo;
                if (stockBajo && nuevoStock > 0)
                {
                    _logger.LogWarning("📉 ALERTA: Producto '{Nombre}' (ID: {Id}) quedó con stock bajo: {Stock} <= {Minimo}",
                        producto.NombreProducto, id, nuevoStock, producto.StockMinimo);
                }
                else if (nuevoStock == 0)
                {
                    _logger.LogWarning("🚨 CRÍTICO: Producto '{Nombre}' (ID: {Id}) quedó SIN STOCK",
                        producto.NombreProducto, id);
                }

                // Preparar respuesta detallada
                var response = new AjusteStockRapidoResponseDTO
                {
                    Success = true,
                    Message = $"Stock ajustado exitosamente. {stockAnterior} → {nuevoStock} unidades",
                    ProductoId = id,
                    NombreProducto = producto.NombreProducto,
                    StockAnterior = stockAnterior,
                    StockNuevo = nuevoStock,
                    Diferencia = nuevoStock - stockAnterior,
                    TipoAjuste = ajusteDto.TipoAjuste,
                    StockBajo = stockBajo,
                    StockMinimo = (int)producto.StockMinimo,
                    Timestamp = DateTime.Now
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error crítico al ajustar stock del producto {Id}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error interno al ajustar stock",
                    error = ex.Message
                });
            }
        }
        /// <summary>
        /// Registra un movimiento de inventario en el historial
        /// </summary>
        private async Task RegistrarMovimientoInventario(int productoId, string tipoMovimiento,
            int stockAnterior, int stockNuevo, int cantidad, string comentario)
        {
            // ✅ OPCIONAL: Si tienes una tabla de historial de movimientos, agregar aquí
            // Por ahora solo loggeamos el movimiento

            var movimiento = new
            {
                ProductoId = productoId,
                TipoMovimiento = tipoMovimiento,
                StockAnterior = stockAnterior,
                StockNuevo = stockNuevo,
                Cantidad = cantidad,
                Comentario = comentario,
                UsuarioId = User.FindFirst("UserId")?.Value ?? "0",
                FechaMovimiento = DateTime.Now
            };

            _logger.LogInformation("📝 Movimiento registrado: {@Movimiento}", movimiento);

            // TODO: Si implementas tabla de historial, agregar aquí:
            // _context.HistorialMovimientos.Add(movimiento);
            // await _context.SaveChangesAsync();
        }

        // GET: api/Inventario/marcas-llantas
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

                _logger.LogInformation("✅ Se obtuvieron {Count} marcas únicas", marcas.Count);
                return Ok(marcas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener marcas de llantas");
                return StatusCode(500, new { message = "Error al obtener marcas" });
            }
        }

        // GET: api/Inventario/modelos-llantas/{marca}
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

                _logger.LogInformation("✅ Se obtuvieron {Count} modelos para marca {Marca}", modelos.Count, marca);
                return Ok(modelos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener modelos para marca: {Marca}", marca);
                return StatusCode(500, new { message = "Error al obtener modelos" });
            }
        }

        // GET: api/Inventario/marcas-busqueda?filtro=text
        [HttpGet("marcas-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarMarcasLlantas(string filtro = "")
        {
            try
            {
                _logger.LogInformation("🔍 Buscando marcas con filtro: '{Filtro}'", filtro);

                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.Marca))
                    .Select(l => l.Marca)
                    .Distinct();

                // Aplicar filtro si se proporciona
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    query = query.Where(m => m.Contains(filtro));
                }

                var marcas = await query
                    .OrderBy(m => m)
                    .Take(10) // Limitar a 10 resultados para mejor rendimiento
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} marcas", marcas.Count);
                return Ok(marcas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar marcas");
                return StatusCode(500, new { message = "Error al buscar marcas" });
            }
        }

        // GET: api/Inventario/modelos-busqueda?filtro=text&marca=brand
        [HttpGet("modelos-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarModelosLlantas(string filtro = "", string marca = "")
        {
            try
            {
                _logger.LogInformation("🔍 Buscando modelos con filtro: '{Filtro}', marca: '{Marca}'", filtro, marca);

                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.Modelo))
                    .Select(l => l.Modelo)
                    .Distinct();

                // Filtrar por marca si se especifica
                if (!string.IsNullOrWhiteSpace(marca))
                {
                    query = _context.Llantas
                        .Where(l => !string.IsNullOrEmpty(l.Modelo) && l.Marca == marca)
                        .Select(l => l.Modelo)
                        .Distinct();
                }

                // Aplicar filtro de texto si se proporciona
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    query = query.Where(m => m.Contains(filtro));
                }

                var modelos = await query
                    .OrderBy(m => m)
                    .Take(10) // Limitar a 10 resultados
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} modelos", modelos.Count);
                return Ok(modelos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar modelos");
                return StatusCode(500, new { message = "Error al buscar modelos" });
            }
        }

        // GET: api/Inventario/indices-velocidad-busqueda?filtro=text
        [HttpGet("indices-velocidad-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarIndicesVelocidad(string filtro = "")
        {
            try
            {
                _logger.LogInformation("🔍 Buscando índices de velocidad con filtro: '{Filtro}'", filtro);

                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.IndiceVelocidad))
                    .Select(l => l.IndiceVelocidad)
                    .Distinct();

                // Aplicar filtro si se proporciona
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    query = query.Where(i => i.Contains(filtro));
                }

                var indices = await query
                    .OrderBy(i => i)
                    .Take(10)
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} índices de velocidad", indices.Count);
                return Ok(indices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar índices de velocidad");
                return StatusCode(500, new { message = "Error al buscar índices de velocidad" });
            }
        }

        // GET: api/Inventario/tipos-terreno-busqueda?filtro=text
        [HttpGet("tipos-terreno-busqueda")]
        [Authorize]
        public async Task<ActionResult<List<string>>> BuscarTiposTerreno(string filtro = "")
        {
            try
            {
                _logger.LogInformation("🔍 Buscando tipos de terreno con filtro: '{Filtro}'", filtro);

                IQueryable<string> query = _context.Llantas
                    .Where(l => !string.IsNullOrEmpty(l.TipoTerreno))
                    .Select(l => l.TipoTerreno)
                    .Distinct();

                // Aplicar filtro si se proporciona
                if (!string.IsNullOrWhiteSpace(filtro))
                {
                    query = query.Where(t => t.Contains(filtro));
                }

                var tipos = await query
                    .OrderBy(t => t)
                    .Take(10)
                    .ToListAsync();

                _logger.LogInformation("✅ Se encontraron {Count} tipos de terreno", tipos.Count);
                return Ok(tipos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al buscar tipos de terreno");
                return StatusCode(500, new { message = "Error al buscar tipos de terreno" });
            }
        }
    }
}
            
        