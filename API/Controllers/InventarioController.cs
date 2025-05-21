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

        // POST: api/InventarioProgramado
        [HttpPost("inventarios-programados")]
        public async Task<ActionResult<InventarioProgramadoDTO>> CrearInventarioProgramado([FromBody] InventarioProgramadoDTO dto)
        {
            try
            {
                // Validar los datos
                if (dto.FechaInicio > dto.FechaFin)
                {
                    return BadRequest(new { message = "La fecha de inicio no puede ser posterior a la fecha de fin" });
                }

                if (string.IsNullOrEmpty(dto.Titulo))
                {
                    return BadRequest(new { message = "El título es obligatorio" });
                }

                // Crear entidad de inventario programado
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

                // Crear asignaciones de usuarios
                if (dto.AsignacionesUsuarios != null && dto.AsignacionesUsuarios.Any())
                {
                    foreach (var asignacion in dto.AsignacionesUsuarios)
                    {
                        var nuevaAsignacion = new AsignacionUsuarioInventario
                        {
                            InventarioProgramadoId = inventario.InventarioProgramadoId,
                            UsuarioId = asignacion.UsuarioId,
                            PermisoConteo = asignacion.PermisoConteo,
                            PermisoAjuste = asignacion.PermisoAjuste,
                            PermisoValidacion = asignacion.PermisoValidacion,
                            FechaAsignacion = DateTime.Now
                        };

                        _context.AsignacionesUsuariosInventario.Add(nuevaAsignacion);

                        // Crear alerta para el usuario asignado
                        var alerta = new AlertasInventario
                        {
                            InventarioProgramadoId = inventario.InventarioProgramadoId,
                            UsuarioId = asignacion.UsuarioId,
                            TipoAlerta = "Asignación",
                            Mensaje = $"Se te ha asignado al inventario: {inventario.Titulo}",
                            FechaCreacion = DateTime.Now
                        };

                        _context.AlertasInventario.Add(alerta);
                    }

                    await _context.SaveChangesAsync();
                }

                return CreatedAtAction(nameof(ObtenerInventarioProgramadoPorId),
                    new { id = inventario.InventarioProgramadoId },
                    new { message = "Inventario programado creado exitosamente", inventarioId = inventario.InventarioProgramadoId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear inventario programado");
                return StatusCode(500, new { message = "Error al crear inventario programado" });
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

                        // Crear alerta para nuevo usuario asignado
                        if (!inventario.AsignacionesUsuarios.Any(a => a.UsuarioId == asignacion.UsuarioId))
                        {
                            var alerta = new AlertasInventario
                            {
                                InventarioProgramadoId = id,
                                UsuarioId = asignacion.UsuarioId,
                                TipoAlerta = "Asignación",
                                Mensaje = $"Se te ha asignado al inventario: {inventario.Titulo}",
                                FechaCreacion = DateTime.Now
                            };

                            _context.AlertasInventario.Add(alerta);
                        }
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

                // Crear alertas para todos los usuarios asignados
                foreach (var asignacion in inventario.AsignacionesUsuarios)
                {
                    var alerta = new AlertasInventario
                    {
                        InventarioProgramadoId = id,
                        UsuarioId = asignacion.UsuarioId,
                        TipoAlerta = "Inicio",
                        Mensaje = $"El inventario '{inventario.Titulo}' ha sido iniciado y está disponible para conteo.",
                        FechaCreacion = DateTime.Now
                    };

                    _context.AlertasInventario.Add(alerta);
                }

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

                // Crear alertas para todos los usuarios asignados
                foreach (var asignacion in inventario.AsignacionesUsuarios)
                {
                    var alerta = new AlertasInventario
                    {
                        InventarioProgramadoId = id,
                        UsuarioId = asignacion.UsuarioId,
                        TipoAlerta = "Cancelación",
                        Mensaje = $"El inventario '{inventario.Titulo}' ha sido cancelado.",
                        FechaCreacion = DateTime.Now
                    };

                    _context.AlertasInventario.Add(alerta);
                }

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

                // Crear alertas para todos los usuarios asignados
                foreach (var asignacion in inventario.AsignacionesUsuarios)
                {
                    var alerta = new AlertasInventario
                    {
                        InventarioProgramadoId = id,
                        UsuarioId = asignacion.UsuarioId,
                        TipoAlerta = "Finalización",
                        Mensaje = $"El inventario '{inventario.Titulo}' ha sido completado.",
                        FechaCreacion = DateTime.Now
                    };

                    _context.AlertasInventario.Add(alerta);
                }

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

                    // Crear alerta para usuarios con permiso de validación
                    var usuariosValidacion = await _context.AsignacionesUsuariosInventario
                        .Where(a => a.InventarioProgramadoId == dto.InventarioProgramadoId && a.PermisoValidacion)
                        .Select(a => a.UsuarioId)
                        .ToListAsync();

                    foreach (var usuarioId in usuariosValidacion)
                    {
                        var alerta = new AlertasInventario
                        {
                            InventarioProgramadoId = dto.InventarioProgramadoId,
                            UsuarioId = usuarioId,
                            TipoAlerta = "Discrepancia",
                            Mensaje = $"Discrepancia en '{nombreProducto}'. Sistema: {detalle.CantidadSistema}, Físico: {detalle.CantidadFisica}, Diferencia: {detalle.Diferencia}",
                            FechaCreacion = DateTime.Now
                        };

                        _context.AlertasInventario.Add(alerta);
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

        // POST: api/InventarioProgramado/detalles/ajustar-stock
        [HttpPost("detalles/ajustar-stock")]
       public async Task<IActionResult> AjustarStock([FromBody] AjusteStockDTO dto)
       {
           try
           {
               var detalle = await _context.DetallesInventarioProgramado
                   .FirstOrDefaultAsync(d => d.DetalleId == dto.DetalleId);

               if (detalle == null)
               {
                   return NotFound(new { message = "Detalle de inventario no encontrado" });
               }

               // Verificar permisos del usuario
               var asignacion = await _context.AsignacionesUsuariosInventario
                   .FirstOrDefaultAsync(a => a.InventarioProgramadoId == detalle.InventarioProgramadoId && a.UsuarioId == dto.UsuarioId);

               if (asignacion == null || !asignacion.PermisoAjuste)
               {
                   return BadRequest(new { message = "El usuario no tiene permisos para realizar ajustes en este inventario" });
               }

               // Verificar que el inventario esté en progreso
               var inventario = await _context.InventariosProgramados
                   .FirstOrDefaultAsync(i => i.InventarioProgramadoId == detalle.InventarioProgramadoId);

               if (inventario == null || inventario.Estado != "En Progreso")
               {
                   return BadRequest(new { message = "El inventario no está en progreso" });
               }

               // Obtener el producto
               var producto = await _context.Productos
                   .FirstOrDefaultAsync(p => p.ProductoId == detalle.ProductoId);

               if (producto == null)
               {
                   return NotFound(new { message = "Producto no encontrado" });
               }

               // Actualizar el stock del producto
               producto.CantidadEnInventario = dto.NuevoStock;
               producto.FechaUltimaActualizacion = DateTime.Now;

               // Actualizar el detalle
               detalle.CantidadSistema = dto.NuevoStock;
               // Si ya se realizó un conteo físico, recalcular la diferencia
               if (detalle.CantidadFisica.HasValue)
               {
                   detalle.Diferencia = detalle.CantidadFisica.Value - detalle.CantidadSistema;
               }
               detalle.Observaciones += $"\nAjuste realizado por usuario ID {dto.UsuarioId} el {DateTime.Now}. Motivo: {dto.Motivo}";

               await _context.SaveChangesAsync();

               // Registrar el ajuste en el historial (si existe esa funcionalidad)
               // ...

               return Ok(new { message = "Stock ajustado exitosamente" });
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Error al ajustar stock");
               return StatusCode(500, new { message = "Error al ajustar stock" });
           }
       }
   }
}
            
        