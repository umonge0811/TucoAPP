namespace GestionLlantera.Web.Models.DTOs.Inventario
{
    public class InventarioProgramadoDTO
    {
        public int InventarioProgramadoId { get; set; }
        public string Titulo { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public string TipoInventario { get; set; } // "Completo", "Parcial", "Cíclico"
        public string Estado { get; set; } // "Programado", "En Progreso", "Completado", "Cancelado"
        public DateTime FechaCreacion { get; set; }
        public int UsuarioCreadorId { get; set; }
        public string UsuarioCreadorNombre { get; set; }
        public List<AsignacionUsuarioInventarioDTO> AsignacionesUsuarios { get; set; } = new List<AsignacionUsuarioInventarioDTO>();

        // Propiedades para mostrar el progreso si el inventario está en proceso
        public int TotalProductos { get; set; }
        public int ProductosContados { get; set; }
        public int Discrepancias { get; set; }

        // Propiedad calculada para mostrar el porcentaje de progreso
        public int PorcentajeProgreso
        {
            get
            {
                if (TotalProductos == 0) return 0;
                return (int)Math.Round((double)ProductosContados / TotalProductos * 100);
            }
        }
    }
}

