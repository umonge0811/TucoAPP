using API.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using tuco.Clases.Models;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistorialController : ControllerBase
    {
        private readonly TucoContext _context;

        public HistorialController(TucoContext context)
        {
            _context = context;
        }

        [HttpPost("registrar-historial")]
        public async Task<IActionResult> RegistrarHistorial([FromBody] HistorialAccionDTO request)
        {
            try
            {
                var historial = new HistorialAcciones
                {
                    UsuarioId = (int)request.UsuarioID,
                    FechaAccion = DateTime.Now,
                    TipoAccion = request.TipoAccion,
                    Modulo = request.Modulo,
                    Detalle = request.Detalle,
                    Token = request.Token,
                    PropositoToken = request.PropositoToken,
                    EstadoAccion = request.EstadoAccion,
                    ErrorDetalle = request.ErrorDetalle
                };

                _context.HistorialAcciones.Add(historial);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Historial registrado exitosamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error al registrar historial: {ex.Message}" });
            }
        }
    }

}
