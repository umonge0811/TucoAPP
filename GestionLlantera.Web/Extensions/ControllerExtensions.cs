public static async Task<bool> TienePermisoAsync(this Controller controller, string nombrePermiso)
        {
            try
            {
                var permisosService = controller.HttpContext.RequestServices.GetService<IPermisosService>();
                if (permisosService == null)
                {
                    // Log para debugging
                    var logger = controller.HttpContext.RequestServices.GetService<ILogger<ControllerExtensions>>();
                    logger?.LogWarning("⚠️ PermisosService no encontrado para verificar permiso: {Permiso}", nombrePermiso);
                    return false;
                }

                var usuario = controller.User.Identity?.Name ?? "Usuario desconocido";
                var resultado = await permisosService.TienePermisoAsync(nombrePermiso);

                // Log para debugging
                var logger2 = controller.HttpContext.RequestServices.GetService<ILogger<ControllerExtensions>>();
                logger2?.LogInformation("🔐 Usuario {Usuario} {Resultado} permiso {Permiso}", 
                    usuario, resultado ? "TIENE" : "NO TIENE", nombrePermiso);

                return resultado;
            }
            catch (Exception ex)
            {
                var logger = controller.HttpContext.RequestServices.GetService<ILogger<ControllerExtensions>>();
                logger?.LogError(ex, "❌ Error verificando permiso {Permiso}", nombrePermiso);
                return false;
            }
        }