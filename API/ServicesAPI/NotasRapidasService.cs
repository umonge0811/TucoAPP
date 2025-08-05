
using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Tuco.Clases.DTOs;
using Tuco.Clases.Models;

namespace API.ServicesAPI
{
    public class NotasRapidasService : INotasRapidasService
    {
        private readonly TucoContext _context;
        private readonly ILogger<NotasRapidasService> _logger;

        public NotasRapidasService(TucoContext context, ILogger<NotasRapidasService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool success, IEnumerable<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasUsuarioAsync(int usuarioId)
        {
            try
            {
                _logger.LogInformation("📝 Obteniendo notas del usuario {UsuarioId}", usuarioId);

                var notas = await _context.NotasRapidas
                    .Where(n => n.UsuarioId == usuarioId)
                    .Include(n => n.Usuario)
                    .OrderByDescending(n => n.FechaModificacion ?? n.FechaCreacion)
                    .Select(n => new NotaRapidaDTO
                    {
                        NotaId = n.NotaId,
                        UsuarioId = n.UsuarioId,
                        Titulo = n.Titulo,
                        Contenido = n.Contenido,
                        FechaCreacion = n.FechaCreacion,
                        FechaModificacion = n.FechaModificacion,
                        Color = n.Color,
                        EsFavorita = n.EsFavorita,
                        NombreUsuario = n.Usuario.NombreUsuario
                    })
                    .ToListAsync();

                return (true, notas, "Notas obtenidas correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo notas del usuario {UsuarioId}", usuarioId);
                return (false, new List<NotaRapidaDTO>(), "Error interno del servidor");
            }
        }

        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> ObtenerNotaPorIdAsync(int notaId, int usuarioId)
        {
            try
            {
                var nota = await _context.NotasRapidas
                    .Where(n => n.NotaId == notaId && n.UsuarioId == usuarioId)
                    .Include(n => n.Usuario)
                    .Select(n => new NotaRapidaDTO
                    {
                        NotaId = n.NotaId,
                        UsuarioId = n.UsuarioId,
                        Titulo = n.Titulo,
                        Contenido = n.Contenido,
                        FechaCreacion = n.FechaCreacion,
                        FechaModificacion = n.FechaModificacion,
                        Color = n.Color,
                        EsFavorita = n.EsFavorita,
                        NombreUsuario = n.Usuario.NombreUsuario
                    })
                    .FirstOrDefaultAsync();

                if (nota == null)
                {
                    return (false, null, "Nota no encontrada");
                }

                return (true, nota, "Nota obtenida correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo nota {NotaId}", notaId);
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> CrearNotaAsync(CrearNotaRapidaDTO notaDto, int usuarioId)
        {
            try
            {
                _logger.LogInformation("📝 Creando nueva nota para usuario {UsuarioId}", usuarioId);

                var nuevaNota = new NotaRapida
                {
                    UsuarioId = usuarioId,
                    Titulo = notaDto.Titulo.Trim(),
                    Contenido = notaDto.Contenido.Trim(),
                    Color = notaDto.Color ?? "#ffd700",
                    EsFavorita = notaDto.EsFavorita,
                    FechaCreacion = DateTime.Now
                };

                _context.NotasRapidas.Add(nuevaNota);
                await _context.SaveChangesAsync();

                var notaCreada = await ObtenerNotaPorIdAsync(nuevaNota.NotaId, usuarioId);
                
                return (true, notaCreada.nota, "Nota creada correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creando nota para usuario {UsuarioId}", usuarioId);
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, NotaRapidaDTO nota, string mensaje)> ActualizarNotaAsync(ActualizarNotaRapidaDTO notaDto, int usuarioId)
        {
            try
            {
                _logger.LogInformation("📝 Actualizando nota {NotaId} del usuario {UsuarioId}", notaDto.NotaId, usuarioId);

                var nota = await _context.NotasRapidas
                    .FirstOrDefaultAsync(n => n.NotaId == notaDto.NotaId && n.UsuarioId == usuarioId);

                if (nota == null)
                {
                    return (false, null, "Nota no encontrada");
                }

                nota.Titulo = notaDto.Titulo.Trim();
                nota.Contenido = notaDto.Contenido.Trim();
                nota.Color = notaDto.Color;
                nota.EsFavorita = notaDto.EsFavorita;
                nota.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();

                var notaActualizada = await ObtenerNotaPorIdAsync(nota.NotaId, usuarioId);
                
                return (true, notaActualizada.nota, "Nota actualizada correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error actualizando nota {NotaId}", notaDto.NotaId);
                return (false, null, "Error interno del servidor");
            }
        }

        public async Task<(bool success, string mensaje)> EliminarNotaAsync(int notaId, int usuarioId)
        {
            try
            {
                _logger.LogInformation("📝 Eliminando nota {NotaId} del usuario {UsuarioId}", notaId, usuarioId);

                var nota = await _context.NotasRapidas
                    .FirstOrDefaultAsync(n => n.NotaId == notaId && n.UsuarioId == usuarioId);

                if (nota == null)
                {
                    return (false, "Nota no encontrada");
                }

                _context.NotasRapidas.Remove(nota);
                await _context.SaveChangesAsync();

                return (true, "Nota eliminada correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error eliminando nota {NotaId}", notaId);
                return (false, "Error interno del servidor");
            }
        }

        public async Task<(bool success, IEnumerable<NotaRapidaDTO> notas, string mensaje)> BuscarNotasAsync(string termino, int usuarioId)
        {
            try
            {
                _logger.LogInformation("📝 Buscando notas con término '{Termino}' para usuario {UsuarioId}", termino, usuarioId);

                var terminoLimpio = termino.Trim().ToLower();

                var notas = await _context.NotasRapidas
                    .Where(n => n.UsuarioId == usuarioId && 
                               (n.Titulo.ToLower().Contains(terminoLimpio) || 
                                n.Contenido.ToLower().Contains(terminoLimpio)))
                    .Include(n => n.Usuario)
                    .OrderByDescending(n => n.FechaModificacion ?? n.FechaCreacion)
                    .Select(n => new NotaRapidaDTO
                    {
                        NotaId = n.NotaId,
                        UsuarioId = n.UsuarioId,
                        Titulo = n.Titulo,
                        Contenido = n.Contenido,
                        FechaCreacion = n.FechaCreacion,
                        FechaModificacion = n.FechaModificacion,
                        Color = n.Color,
                        EsFavorita = n.EsFavorita,
                        NombreUsuario = n.Usuario.NombreUsuario
                    })
                    .ToListAsync();

                return (true, notas, $"Se encontraron {notas.Count} notas");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error buscando notas");
                return (false, new List<NotaRapidaDTO>(), "Error interno del servidor");
            }
        }

        public async Task<(bool success, IEnumerable<NotaRapidaDTO> notas, string mensaje)> ObtenerNotasFavoritasAsync(int usuarioId)
        {
            try
            {
                var notas = await _context.NotasRapidas
                    .Where(n => n.UsuarioId == usuarioId && n.EsFavorita)
                    .Include(n => n.Usuario)
                    .OrderByDescending(n => n.FechaModificacion ?? n.FechaCreacion)
                    .Select(n => new NotaRapidaDTO
                    {
                        NotaId = n.NotaId,
                        UsuarioId = n.UsuarioId,
                        Titulo = n.Titulo,
                        Contenido = n.Contenido,
                        FechaCreacion = n.FechaCreacion,
                        FechaModificacion = n.FechaModificacion,
                        Color = n.Color,
                        EsFavorita = n.EsFavorita,
                        NombreUsuario = n.Usuario.NombreUsuario
                    })
                    .ToListAsync();

                return (true, notas, "Notas favoritas obtenidas correctamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error obteniendo notas favoritas del usuario {UsuarioId}", usuarioId);
                return (false, new List<NotaRapidaDTO>(), "Error interno del servidor");
            }
        }
    }
}
