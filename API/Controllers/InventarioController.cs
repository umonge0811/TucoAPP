using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using tuco.Clases.Models;
using Tuco.Clases.DTOs.Inventario;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly TucoContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILogger<InventarioController> _logger;

        public InventarioController(
            TucoContext context,
            IWebHostEnvironment webHostEnvironment,
            ILogger<InventarioController> logger)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _logger = logger;
        }

        // GET: api/Inventario/productos
        [HttpGet("productos")]
        public async Task<ActionResult<IEnumerable<Producto>>> ObtenerProductos()
        {
            try
            {
                var productos = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .ToListAsync();

                return Ok(productos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener productos");
                return StatusCode(500, new { message = "Error al obtener productos" });
            }
        }

        // GET: api/Inventario/productos/{id}
        [HttpGet("productos/{id}")]
        public async Task<ActionResult<Producto>> ObtenerProductoPorId(int id)
        {
            try
            {
                var producto = await _context.Productos
                    .Include(p => p.ImagenesProductos)
                    .Include(p => p.Llanta)
                    .FirstOrDefaultAsync(p => p.ProductoId == id);

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
        public async Task<ActionResult<Producto>> CrearProducto([FromBody] ProductoDTO productoDto)
        {
            try
            {
                // Registrar los datos recibidos
                _logger.LogInformation("Datos recibidos: {Datos}",
                    JsonConvert.SerializeObject(productoDto, Formatting.Indented));

                // Validar el modelo
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

                // Validar propiedades críticas
                if (string.IsNullOrEmpty(productoDto.NombreProducto))
                {
                    _logger.LogWarning("Nombre de producto requerido");
                    return BadRequest(new { message = "El nombre del producto es requerido" });
                }

                if (productoDto.Precio <= 0)
                {
                    _logger.LogWarning("Precio inválido: {Precio}", productoDto.Precio);
                    return BadRequest(new { message = "El precio debe ser mayor que cero" });
                }

                // Crear producto
                var producto = new Producto
                {
                    NombreProducto = productoDto.NombreProducto,
                    Descripcion = productoDto.Descripcion,
                    Precio = productoDto.Precio,
                    CantidadEnInventario = productoDto.CantidadEnInventario,
                    StockMinimo = productoDto.StockMinimo,
                    FechaUltimaActualizacion = DateTime.Now
                };

                // Agregar producto a la base de datos
                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Producto base creado exitosamente. ID: {Id}", producto.ProductoId);

                // Si es una llanta, agregar la información de la llanta
                if (productoDto.Llanta != null)
                {
                    _logger.LogInformation("Procesando datos de llanta para producto ID: {Id}", producto.ProductoId);

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

                    _logger.LogInformation("Datos de llanta agregados exitosamente para producto ID: {Id}", producto.ProductoId);
                }

                // Retornar el producto creado con su ID
                return CreatedAtAction(nameof(ObtenerProductoPorId), new { id = producto.ProductoId },
                    new { productoId = producto.ProductoId, message = "Producto creado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear producto: {Nombre}", productoDto?.NombreProducto ?? "Desconocido");

                // Si hay una excepción interna, registrarla también
                if (ex.InnerException != null)
                {
                    _logger.LogError("Excepción interna: {Mensaje}", ex.InnerException.Message);
                }

                return StatusCode(500, new { message = $"Error al crear producto: {ex.Message}" });
            }
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

        // PUT: api/Inventario/productos/{id}
        [HttpPut("productos/{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] ProductoDTO productoDto)
        {
            try
            {
                // Obtener el producto existente
                var producto = await _context.Productos
                    .Include(p => p.Llanta)
                    .FirstOrDefaultAsync(p => p.ProductoId == id);

                if (producto == null)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                // Actualizar propiedades
                producto.NombreProducto = productoDto.NombreProducto;
                producto.Descripcion = productoDto.Descripcion;
                producto.Precio = productoDto.Precio;
                producto.CantidadEnInventario = productoDto.CantidadEnInventario;
                producto.StockMinimo = productoDto.StockMinimo;
                producto.FechaUltimaActualizacion = DateTime.Now;

                // Actualizar llanta si existe
                if (productoDto.Llanta != null)
                {
                    if (producto.Llanta.Any())
                    {
                        // Actualizar llanta existente
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
                        // Crear nueva llanta
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

                return Ok(new { message = "Producto actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar producto ID: {Id}", id);
                return StatusCode(500, new { message = "Error al actualizar producto" });
            }
        }

        // POST: api/Inventario/productos/{id}/ajuste-stock
        [HttpPost("productos/{id}/ajuste-stock")]
        public async Task<IActionResult> AjustarStock(int id, [FromBody] AjusteStockDTO ajuste)
        {
            try
            {
                var producto = await _context.Productos.FindAsync(id);
                if (producto == null)
                {
                    return NotFound(new { message = "Producto no encontrado" });
                }

                // Validar entrada
                if (ajuste.Cantidad <= 0)
                {
                    return BadRequest(new { message = "La cantidad debe ser mayor que cero" });
                }

                // Ajustar stock según el tipo de operación
                switch (ajuste.TipoAjuste.ToLower())
                {
                    case "entrada":
                        producto.CantidadEnInventario += ajuste.Cantidad;
                        break;
                    case "salida":
                        if (producto.CantidadEnInventario < ajuste.Cantidad)
                        {
                            return BadRequest(new { message = "No hay suficiente stock para esta salida" });
                        }
                        producto.CantidadEnInventario -= ajuste.Cantidad;
                        break;
                    case "ajuste":
                        producto.CantidadEnInventario = ajuste.Cantidad;
                        break;
                    default:
                        return BadRequest(new { message = "Tipo de ajuste no válido" });
                }

                producto.FechaUltimaActualizacion = DateTime.Now;
                await _context.SaveChangesAsync();

                // Verificar si el stock está bajo el mínimo para crear una alerta
                if (producto.CantidadEnInventario <= producto.StockMinimo)
                {
                    var alerta = new AlertasInventario
                    {
                        ProductoId = id,
                        TipoAlerta = "Inventario Bajo",
                        Descripcion = $"El stock actual ({producto.CantidadEnInventario}) está por debajo o igual al mínimo ({producto.StockMinimo})",
                        FechaAlerta = DateTime.Now
                    };

                    _context.AlertasInventarios.Add(alerta);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    message = "Stock ajustado correctamente",
                    nuevoStock = producto.CantidadEnInventario
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al ajustar stock del producto ID: {Id}", id);
                return StatusCode(500, new { message = "Error al ajustar stock" });
            }
        }
    }
}