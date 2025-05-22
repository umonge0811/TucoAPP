using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using GestionLlantera.Web.Models.DTOs;
using Tuco.Clases.DTOs.Inventario;
namespace GestionLlantera.Web.Models.ViewModels
{
    public class ProgramarInventarioViewModel
    {
        public List<UsuarioDTO> UsuariosDisponibles { get; set; } = new List<UsuarioDTO>();
        public List<InventarioProgramadoDTO> InventariosProgramados { get; set; } = new List<InventarioProgramadoDTO>();
        public NuevoInventarioViewModel NuevoInventario { get; set; } = new NuevoInventarioViewModel();
    }

    public class NuevoInventarioViewModel
    {
        [Required(ErrorMessage = "El título es obligatorio")]
        [StringLength(100, ErrorMessage = "El título no debe exceder los 100 caracteres")]
        public string Titulo { get; set; }

        [StringLength(500, ErrorMessage = "La descripción no debe exceder los 500 caracteres")]
        public string Descripcion { get; set; }

        [Required(ErrorMessage = "La fecha de inicio es obligatoria")]
        [DataType(DataType.Date)]
        [Display(Name = "Fecha de Inicio")]
        public DateTime FechaInicio { get; set; } = DateTime.Today;

        [Required(ErrorMessage = "La fecha de fin es obligatoria")]
        [DataType(DataType.Date)]
        [Display(Name = "Fecha de Fin")]
        public DateTime FechaFin { get; set; } = DateTime.Today.AddDays(7);

        [Required(ErrorMessage = "Debe seleccionar un tipo de inventario")]
        [Display(Name = "Tipo de Inventario")]
        public string TipoInventario { get; set; } = "Completo";

        [Display(Name = "Ubicación Específica")]
        public string UbicacionEspecifica { get; set; }

        [Display(Name = "Incluir Productos con Stock Bajo")]
        public bool IncluirStockBajo { get; set; } = true;

        [Display(Name = "Usuarios Asignados")]
        public List<AsignacionUsuarioViewModel> UsuariosAsignados { get; set; } = new List<AsignacionUsuarioViewModel>();
    }

    public class AsignacionUsuarioViewModel
    {
        [Required]
        public int UsuarioId { get; set; }

        public string NombreUsuario { get; set; }

        [Display(Name = "Permiso de Conteo")]
        public bool PermisoConteo { get; set; } = true;

        [Display(Name = "Permiso de Ajuste")]
        public bool PermisoAjuste { get; set; } = false;

        [Display(Name = "Permiso de Validación")]
        public bool PermisoValidacion { get; set; } = false;
    }
}