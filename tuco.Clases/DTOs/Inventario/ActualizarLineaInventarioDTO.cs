using System.Collections.Generic;

namespace tuco.Clases.DTOs.Inventario
{
    /// <summary>
    /// DTO para solicitud de actualización de línea(s) de inventario con movimientos post-corte
    /// </summary>
    public class ActualizarLineaInventarioDTO
    {
        public int InventarioProgramadoId { get; set; }
        public int ProductoId { get; set; }
        public int UsuarioId { get; set; }
    }

    /// <summary>
    /// DTO para solicitud de actualización masiva de líneas
    /// </summary>
    public class ActualizarLineasMasivaDTO
    {
        public int InventarioProgramadoId { get; set; }
        public int UsuarioId { get; set; }
        public List<int> ProductoIds { get; set; } // Si está vacío, actualiza todas las líneas con movimientos

        public ActualizarLineasMasivaDTO()
        {
            ProductoIds = new List<int>();
        }
    }

    /// <summary>
    /// DTO para respuesta de actualización
    /// </summary>
    public class ResultadoActualizacionDTO
    {
        public bool Exito { get; set; }
        public string Mensaje { get; set; }
        public int LineasActualizadas { get; set; }
        public int MovimientosProcesados { get; set; }
        public List<string> Errores { get; set; }

        public ResultadoActualizacionDTO()
        {
            Errores = new List<string>();
        }
    }
}
