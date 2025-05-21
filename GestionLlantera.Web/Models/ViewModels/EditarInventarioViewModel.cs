// En GestionLlantera.Web/Models/ViewModels/EditarInventarioViewModel.cs

using System.Collections.Generic;
using GestionLlantera.Web.Models.DTOs;
using GestionLlantera.Web.Models.DTOs.Inventario;

namespace GestionLlantera.Web.Models.ViewModels
{
    public class EditarInventarioViewModel
    {
        public InventarioProgramadoDTO InventarioProgramado { get; set; }
        public List<UsuarioDTO> UsuariosDisponibles { get; set; } = new List<UsuarioDTO>();
    }
}