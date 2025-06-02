using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GestionLlantera.Web.Extensions;
using GestionLlantera.Web.Services.Interfaces;

namespace GestionLlantera.Web.Controllers
{
    /// <summary>
    /// Controlador para diagnóstico y gestión avanzada de permisos del sistema
    /// Proporciona herramientas para administradores y desarrollo
    /// </summary>
    [Authorize]
    public class PermisosDiagnosticoController : Controller
    {
        private readonly IPermisosGlobalService _permisosService;
        private readonly ILogger<PermisosDiagnosticoController> _logger;
        private readonly IWebHostEnvironment _environment;

        public PermisosDiagnosticoController(
            IPermisosGlobalService permisosService,
            ILogger<PermisosDiagnosticoController> logger,
            IWebHostEnvironment environment)
        {
            _permisosService = permisosService;
            _logger = logger;
            _environment = environment;
        }

        /// <summary>
        /// Panel principal de diagnóstico de permisos
        /// Accesible para administradores o en ambiente de desarrollo
        /// </summary>
        public async Task<IActionResult> Index()
        {
            // ✅ CONTROL DE ACCESO PROFESIONAL
            if (!_environment.IsDevelopment())
            {
                var validacion = await this.ValidarPermisoMvcAsync("Gestión Completa",
                    "Esta herramienta de diagnóstico solo está disponible para administradores del sistema");
                if (validacion != null) return validacion;
            }

            ViewData["Title"] = "Diagnóstico de Permisos del Sistema";
            ViewData["Layout"] = "_AdminLayout";

            try
            {
                // Información del usuario actual
                ViewBag.Usuario = User.Identity?.Name ?? "Usuario desconocido";
                ViewBag.EsAdmin = await this.EsAdministradorAsync();
                ViewBag.EsEntornoDesarrollo = _environment.IsDevelopment();

                // Obtener todos los permisos del usuario
                var misPermisos = await this.ObtenerMisPermisosAsync();
                ViewBag.MisPermisos = misPermisos;

                // ✅ PERMISOS ORGANIZADOS POR CATEGORÍAS
                var permisosInventario = new[]
                {
                    "Modificar Inventario", "Ver Utilidades", "Programar Inventario",
                    "Editar Productos", "Eliminar Productos", "Ajustar Stock"
                };

                var permisosReportes = new[]
                {
                    "Ver Reportes", "Exportar Reportes"
                };

                var permisosAdministracion = new[]
                {
                    "Gestión Completa", "Gestión Usuarios", "Configurar Sistema"
                };

                var permisosVentas = new[]
                {
                    "Facturar", "Ver Ventas", "Modificar Ventas"
                };

                // Verificar permisos por categorías
                ViewBag.PermisosInventario = await VerificarPermisosPorCategoria(permisosInventario);
                ViewBag.PermisosReportes = await VerificarPermisosPorCategoria(permisosReportes);
                ViewBag.PermisosAdministracion = await VerificarPermisosPorCategoria(permisosAdministracion);
                ViewBag.PermisosVentas = await VerificarPermisosPorCategoria(permisosVentas);

                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar el diagnóstico de permisos");
                TempData["Error"] = "Error al cargar el diagnóstico de permisos";
                return RedirectToAction("Index", "Home");
            }
        }

        /// <summary>
        /// Herramienta de verificación de permisos específicos
        /// </summary>
        public async Task<IActionResult> VerificarPermiso()
        {
            if (!_environment.IsDevelopment())
            {
                var validacion = await this.ValidarPermisoMvcAsync("Gestión Completa");
                if (validacion != null) return validacion;
            }

            var validacionPermiso = await this.ValidarPermisoMvcAsync("Ver Utilidades",
                "Esta acción requiere el permiso 'Ver Utilidades' - Herramienta de diagnóstico");
            if (validacionPermiso != null) return validacionPermiso;

            TempData["Success"] = "✅ Verificación exitosa: Tienes el permiso 'Ver Utilidades'";
            return RedirectToAction("Index");
        }

        /// <summary>
        /// Verificación de múltiples permisos simultáneos
        /// </summary>
        public async Task<IActionResult> VerificarMultiplesPermisos()
        {
            if (!await this.TieneTodosLosPermisosAsync("Modificar Inventario", "Ver Utilidades"))
            {
                TempData["Warning"] = "⚠️ Esta función requiere los permisos 'Modificar Inventario' Y 'Ver Utilidades'";
                return RedirectToAction("Index");
            }

            TempData["Success"] = "✅ Verificación exitosa: Tienes todos los permisos requeridos";
            return RedirectToAction("Index");
        }

        /// <summary>
        /// Verificación de permisos alternativos
        /// </summary>
        public async Task<IActionResult> VerificarPermisosAlternativos()
        {
            if (!await this.TieneAlgunPermisoAsync("Editar Productos", "Ajustar Stock", "Gestión Completa"))
            {
                TempData["Warning"] = "⚠️ Esta función requiere al menos uno de estos permisos: Editar Productos, Ajustar Stock o Gestión Completa";
                return RedirectToAction("Index");
            }

            TempData["Success"] = "✅ Verificación exitosa: Tienes al menos uno de los permisos requeridos";
            return RedirectToAction("Index");
        }

        /// <summary>
        /// Función exclusiva para administradores
        /// </summary>
        public async Task<IActionResult> FuncionAdministrador()
        {
            if (!await this.EsAdministradorAsync())
            {
                TempData["Error"] = "🔒 Esta función está reservada exclusivamente para administradores del sistema";
                return RedirectToAction("Index");
            }

            TempData["Success"] = "🛡️ Acceso concedido: Eres administrador del sistema";
            return RedirectToAction("Index");
        }

        /// <summary>
        /// Limpia el cache de permisos del sistema
        /// Solo para administradores
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> LimpiarCache()
        {
            try
            {
                if (!await this.EsAdministradorAsync())
                {
                    return Json(new
                    {
                        success = false,
                        message = "Solo administradores pueden limpiar el cache del sistema"
                    });
                }

                _permisosService.LimpiarCache();
                _logger.LogInformation("Cache de permisos limpiado por el usuario {Usuario}", User.Identity?.Name);

                return Json(new
                {
                    success = true,
                    message = "Cache de permisos limpiado exitosamente",
                    timestamp = DateTime.Now.ToString("HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar cache de permisos");
                return Json(new
                {
                    success = false,
                    message = "Error interno al limpiar cache"
                });
            }
        }

        /// <summary>
        /// Obtiene información detallada del sistema de permisos
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> InformacionSistema()
        {
            try
            {
                if (!await this.EsAdministradorAsync())
                {
                    return Json(new { error = "Acceso denegado" });
                }

                var info = new
                {
                    usuario = User.Identity?.Name,
                    esAdministrador = await this.EsAdministradorAsync(),
                    totalPermisos = (await this.ObtenerMisPermisosAsync()).Count,
                    entorno = _environment.EnvironmentName,
                    timestamp = DateTime.Now,
                    version = "1.0.0"
                };

                return Json(info);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener información del sistema");
                return Json(new { error = "Error interno" });
            }
        }

        #region Métodos Auxiliares
        /// <summary>
        /// Verifica permisos por categoría y retorna resultados organizados
        /// </summary>
        private async Task<Dictionary<string, bool>> VerificarPermisosPorCategoria(string[] permisos)
        {
            var resultados = new Dictionary<string, bool>();

            foreach (var permiso in permisos)
            {
                try
                {
                    resultados[permiso] = await this.TienePermisoAsync(permiso);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error al verificar permiso {Permiso}", permiso);
                    resultados[permiso] = false;
                }
            }

            return resultados;
        }
        #endregion
    }
}