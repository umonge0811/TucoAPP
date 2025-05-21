// Tuco.Clases.DTOs/Inventario/InventarioProgramadoDTO.cs (o donde se encuentre la clase)
using System;
using System.Collections.Generic;

namespace Tuco.Clases.DTOs.Inventario  // Asegúrate de que el namespace coincide con el que estás usando
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

        // Agregar estas propiedades faltantes
        public string UbicacionEspecifica { get; set; }
        public bool IncluirStockBajo { get; set; }

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