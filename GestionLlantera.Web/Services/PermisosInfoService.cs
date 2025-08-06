
using GestionLlantera.Web.Services.Interfaces;
using System.Text.Json;
using Tuco.Clases.DTOs.Tuco.Clases.DTOs;

namespace GestionLlantera.Web.Services
{
    public class PermisosInfoService : IPermisosInfoService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PermisosInfoService> _logger;
        // ✅ SERVICIO CENTRALIZADO PARA CONFIGURACIÓN DE API
        private readonly ApiConfigurationService _apiConfig;

        // Mapeo de funciones y sus permisos requeridos
        private readonly Dictionary<string, List<string>> _funcionesPermisos = new()
        {
            {"Ver Inventario", new List<string> {"Ver Productos"}},
            {"Crear Productos", new List<string> {"Editar Productos"}},
            {"Editar Productos", new List<string> {"Editar Productos"}},
            {"Eliminar Productos", new List<string> {"Eliminar Productos"}},
            {"Ver Costos", new List<string> {"Ver Costos"}},
            {"Ver Utilidades", new List<string> {"Ver Utilidades"}},
            {"Programar Inventario", new List<string> {"Programar Inventario"}},
            {"Iniciar Inventario", new List<string> {"Iniciar Inventario"}},
            {"Completar Inventario", new List<string> {"Completar Inventario"}},
            {"Ajustar Stock", new List<string> {"Ajustar Stock"}},
            {"Ver Facturación", new List<string> {"Ver Facturación"}},
            {"Crear Facturas", new List<string> {"Crear Facturas"}},
            {"Completar Facturas", new List<string> {"CompletarFacturas"}},
            {"Editar Facturas", new List<string> {"EditarFacturas"}},
            {"Anular Facturas", new List<string> {"AnularFacturas"}},
            {"Ver Clientes", new List<string> {"Ver Clientes"}},
            {"Crear Clientes", new List<string> {"Crear Clientes"}},
            {"Editar Clientes", new List<string> {"Editar Clientes"}},
            {"Eliminar Clientes", new List<string> {"Eliminar Clientes"}},
            {"Ver Reportes", new List<string> {"Ver Reportes"}},
            {"Descargar Reportes", new List<string> {"Descargar Reportes"}},
            {"Gestión Usuarios", new List<string> {"Gestion Usuarios"}},
            {"Configuración Sistema", new List<string> {"Configuracion Sistema"}}
        };

        private readonly Dictionary<string, string> _descripcionesFunciones = new()
        {
            {"Ver Inventario", "Permite visualizar el listado de productos en inventario"},
            {"Crear Productos", "Permite agregar nuevos productos al sistema"},
            {"Editar Productos", "Permite modificar información de productos existentes"},
            {"Eliminar Productos", "Permite eliminar productos del sistema"},
            {"Ver Costos", "Permite visualizar los costos de compra de los productos"},
            {"Ver Utilidades", "Permite ver márgenes de ganancia y utilidades"},
            {"Programar Inventario", "Permite crear y programar nuevos inventarios"},
            {"Iniciar Inventario", "Permite dar inicio a inventarios programados"},
            {"Completar Inventario", "Permite finalizar inventarios en proceso"},
            {"Ajustar Stock", "Permite realizar ajustes manuales de inventario"},
            {"Ver Facturación", "Permite acceder al módulo de ventas y facturación"},
            {"Crear Facturas", "Permite crear nuevas facturas de venta"},
            {"Completar Facturas", "Permite finalizar y cobrar facturas"},
            {"Editar Facturas", "Permite modificar facturas existentes"},
            {"Anular Facturas", "Permite anular facturas procesadas"},
            {"Ver Clientes", "Permite visualizar el listado de clientes"},
            {"Crear Clientes", "Permite registrar nuevos clientes"},
            {"Editar Clientes", "Permite modificar información de clientes"},
            {"Eliminar Clientes", "Permite eliminar clientes del sistema"},
            {"Ver Reportes", "Permite acceder a reportes y estadísticas"},
            {"Descargar Reportes", "Permite descargar reportes en Excel y PDF"},
            {"Gestión Usuarios", "Permite gestionar usuarios y sus permisos"},
            {"Configuración Sistema", "Permite acceder a configuraciones avanzadas"}
        };

        public PermisosInfoService(HttpClient httpClient, IConfiguration configuration, ILogger<PermisosInfoService> logger, ApiConfigurationService apiConfig)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _apiConfig = apiConfig;
        }

        public async Task<Dictionary<string, List<PermisoDTO>>> ObtenerPermisosPorCategoriaAsync()
        {
            try
            {
                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("api/Permisos/obtener-todos");
                _logger.LogDebug("🌐 URL construida para obtener permisos por categoría: {url}", url);
                
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var permisos = JsonSerializer.Deserialize<List<PermisoDTO>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var permisosPorCategoria = permisos
                    .GroupBy(p => p.Modulo ?? "General")
                    .ToDictionary(g => g.Key, g => g.ToList());

                return permisosPorCategoria;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permisos por categoría");
                return new Dictionary<string, List<PermisoDTO>>();
            }
        }

        public async Task<List<string>> ObtenerPermisosRequeridosParaFuncion(string funcion)
        {
            return _funcionesPermisos.ContainsKey(funcion) 
                ? _funcionesPermisos[funcion] 
                : new List<string>();
        }

        public async Task<bool> SolicitarPermisoAlAdministrador(string usuarioId, string permiso, string justificacion)
        {
            try
            {
                var solicitud = new
                {
                    UsuarioId = usuarioId,
                    Permiso = permiso,
                    Justificacion = justificacion,
                    FechaSolicitud = DateTime.Now
                };

                // ✅ USAR SERVICIO CENTRALIZADO PARA CONSTRUIR URL
                var url = _apiConfig.GetApiUrl("api/Permisos/solicitar-permiso");
                _logger.LogDebug("🌐 URL construida para solicitar permiso: {url}", url);
                
                var response = await _httpClient.PostAsJsonAsync(url, solicitud);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al solicitar permiso al administrador");
                return false;
            }
        }

        public Dictionary<string, string> ObtenerDescripcionesFunciones()
        {
            return _descripcionesFunciones;
        }
    }
}
