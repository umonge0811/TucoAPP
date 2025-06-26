
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services.Interfaces
{
    public interface IPermisosInfoService
    {
        Task<Dictionary<string, List<PermisoDTO>>> ObtenerPermisosPorCategoriaAsync();
        Task<List<string>> ObtenerPermisosRequeridosParaFuncion(string funcion);
        Task<bool> SolicitarPermisoAlAdministrador(string usuarioId, string permiso, string justificacion);
        Dictionary<string, string> ObtenerDescripcionesFunciones();
    }
}
