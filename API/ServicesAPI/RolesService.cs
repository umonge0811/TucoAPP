
using API.Data;
using API.ServicesAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Tuco.Clases.DTOs;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;
using tuco.Clases.Models;

namespace API.ServicesAPI
{
    public class RolesService : IRolesService
    {
        private readonly TucoContext _context;

        public RolesService(TucoContext context)
        {
            _context = context;
        }

        public async Task<bool> ActualizarPermisosDeRol(int rolId, List<int> permisoIds)
        {
            try
            {
                var rol = await _context.Roles.Include(r => r.RolPermiso).FirstOrDefaultAsync(r => r.RolId == rolId);
                if (rol == null) return false;

                // Eliminar permisos actuales
                _context.RolPermisos.RemoveRange(rol.RolPermiso);

                // Agregar nuevos permisos
                foreach (var permisoId in permisoIds)
                {
                    rol.RolPermiso.Add(new RolPermisoRE { RolID = rolId, PermisoID = permisoId });
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> ActualizarRol(int rolId, RoleDTO rol)
        {
            try
            {
                var rolExistente = await _context.Roles.FindAsync(rolId);
                if (rolExistente == null) return false;

                rolExistente.NombreRol = rol.NombreRol;
                rolExistente.DescripcionRol = rol.DescripcionRol;

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AsignarPermisosARol(int rolId, List<int> permisoIds)
        {
            try
            {
                var rol = await _context.Roles.Include(r => r.RolPermiso).FirstOrDefaultAsync(r => r.RolId == rolId);
                if (rol == null) return false;

                foreach (var permisoId in permisoIds)
                {
                    if (!rol.RolPermiso.Any(rp => rp.PermisoID == permisoId))
                    {
                        rol.RolPermiso.Add(new RolPermisoRE { RolID = rolId, PermisoID = permisoId });
                    }
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> CrearRol(RoleDTO rol)
        {
            try
            {
                var nuevoRol = new Role
                {
                    NombreRol = rol.NombreRol,
                    DescripcionRol = rol.DescripcionRol
                };

                _context.Roles.Add(nuevoRol);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> EliminarRol(int rolId)
        {
            try
            {
                var rol = await _context.Roles.Include(r => r.RolPermiso).FirstOrDefaultAsync(r => r.RolId == rolId);
                if (rol == null) return false;

                _context.RolPermisos.RemoveRange(rol.RolPermiso);
                _context.Roles.Remove(rol);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<PermisoDTO>> ObtenerPermisosDeRol(int rolId)
        {
            var permisos = await _context.RolPermisos
                .Where(rp => rp.RolID == rolId)
                .Include(rp => rp.Permiso)
                .Select(rp => new PermisoDTO
                {
                    PermisoId = rp.Permiso.PermisoId,
                    NombrePermiso = rp.Permiso.NombrePermiso,
                    DescripcionPermiso = rp.Permiso.DescripcionPermiso
                })
                .ToListAsync();

            return permisos;
        }

        public async Task<RoleDTO> ObtenerRolPorId(int rolId)
        {
            var rol = await _context.Roles
                .Include(r => r.RolPermiso)
                .ThenInclude(rp => rp.Permiso)
                .FirstOrDefaultAsync(r => r.RolId == rolId);

            if (rol == null) return null;

            return new RoleDTO
            {
                RolId = rol.RolId,
                NombreRol = rol.NombreRol,
                DescripcionRol = rol.DescripcionRol,
                Permisos = rol.RolPermiso.Select(rp => new PermisoDTO
                {
                    PermisoId = rp.Permiso.PermisoId,
                    NombrePermiso = rp.Permiso.NombrePermiso,
                    DescripcionPermiso = rp.Permiso.DescripcionPermiso
                }).ToList()
            };
        }

        public async Task<List<PermisoDTO>> ObtenerTodosLosPermisos()
        {
            var permisos = await _context.Permisos
                .Select(p => new PermisoDTO
                {
                    PermisoId = p.PermisoId,
                    NombrePermiso = p.NombrePermiso,
                    DescripcionPermiso = p.DescripcionPermiso
                })
                .ToListAsync();

            return permisos;
        }

        public async Task<List<RoleDTO>> ObtenerTodosLosRoles()
        {
            var roles = await _context.Roles
                .Include(r => r.RolPermiso)
                .ThenInclude(rp => rp.Permiso)
                .Select(r => new RoleDTO
                {
                    RolId = r.RolId,
                    NombreRol = r.NombreRol,
                    DescripcionRol = r.DescripcionRol,
                    Permisos = r.RolPermiso.Select(rp => new PermisoDTO
                    {
                        PermisoId = rp.Permiso.PermisoId,
                        NombrePermiso = rp.Permiso.NombrePermiso,
                        DescripcionPermiso = rp.Permiso.DescripcionPermiso
                    }).ToList()
                })
                .ToListAsync();

            return roles;
        }
    }
}
