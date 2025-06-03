namespace GestionLlantera.Web.Configuration
{
    /// <summary>
    /// Configuración centralizada para el sistema de permisos
    /// Permite ajustar comportamientos sin recompilar
    /// </summary>
    public class PermisosConfiguration
    {
        /// <summary>
        /// Tiempo de expiración del cache de permisos en minutos
        /// </summary>
        public int CacheExpirationMinutes { get; set; } = 5;

        /// <summary>
        /// Habilitar logging detallado de verificaciones de permisos
        /// </summary>
        public bool EnableDetailedLogging { get; set; } = false;

        /// <summary>
        /// Habilitar auditoría de accesos denegados
        /// </summary>
        public bool EnableAccessAudit { get; set; } = true;

        /// <summary>
        /// Permitir acceso completo en ambiente de desarrollo
        /// </summary>
        public bool AllowFullAccessInDevelopment { get; set; } = false;

        /// <summary>
        /// Lista de permisos que se consideran críticos
        /// </summary>
        public string[] PermisosCriticos { get; set; } =
        {
            "Gestión Completa",
            "Gestión Usuarios",
            "Eliminar Productos"
        };

        /// <summary>
        /// Lista de roles que se consideran administrativos
        /// </summary>
        public string[] RolesAdministrativos { get; set; } =
        {
            "Administrador",
            "SuperAdmin",
            "Admin"
        };
    }
}