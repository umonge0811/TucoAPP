/**
 * 🔄 SISTEMA DE MONITOREO AUTOMÁTICO DE PERMISOS
 * Este módulo verifica automáticamente si los permisos del usuario han cambiado
 */

class PermisosMonitor {
    constructor() {
        this.intervalId = null;
        this.ultimaVerificacion = null;
        this.permisosActuales = null;
        this.intervaloVerificacion = 3000; // 3 segundos para detección más rápida
        this.logger = console;
    }

    /**
     * Iniciar el monitoreo automático de permisos
     */
    iniciar() {
        this.logger.log('🔄 Iniciando monitoreo de permisos...');

        // Verificar inmediatamente
        this.verificarPermisos();

        // Configurar verificación periódica
        this.intervalId = setInterval(() => {
            this.verificarPermisos();
        }, this.intervaloVerificacion);

        // Escuchar eventos de visibilidad para verificar cuando se vuelve a la página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.logger.log('🔄 Página visible - Verificando permisos...');
                this.verificarPermisos();
            }
        });

        // Escuchar eventos de foco
        window.addEventListener('focus', () => {
            this.logger.log('🔄 Ventana enfocada - Verificando permisos...');
            this.verificarPermisos();
        });
    }

    /**
     * Detener el monitoreo
     */
    detener() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.logger.log('🛑 Monitoreo de permisos detenido');
        }
    }

    /**
     * Verificar si los permisos han cambiado
     */
    async verificarPermisos() {
        try {
            const response = await fetch('/Permisos/VerificarCambios', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                this.logger.warn('⚠️ Error al verificar permisos:', response.status);
                return;
            }

            const data = await response.json();

            if (data.success) {
                const nuevosPermisos = data.permisos;

                // Comparar con permisos anteriores
                if (this.permisosActuales && this.hanCambiado(this.permisosActuales, nuevosPermisos)) {
                    this.logger.log('🔄 ¡Permisos han cambiado! Recargando página...');
                    this.onPermisosActualizados(nuevosPermisos);
                } else {
                    this.logger.debug('✅ Permisos sin cambios');
                }

                this.permisosActuales = nuevosPermisos;
                this.ultimaVerificacion = new Date();
            }
        } catch (error) {
            this.logger.error('❌ Error verificando permisos:', error);
        }
    }

    /**
     * Comparar si los permisos han cambiado
     */
    hanCambiado(permisosAnteriores, permisosNuevos) {
        const campos = [
            'puedeVerCostos', 'puedeVerUtilidades', 'puedeProgramarInventario',
            'puedeEditarProductos', 'puedeEliminarProductos', 'puedeAjustarStock',
            'esAdministrador'
        ];

        return campos.some(campo => 
            permisosAnteriores[campo] !== permisosNuevos[campo]
        );
    }

    /**
     * Evento cuando los permisos se actualizan
     */
    onPermisosActualizados(nuevosPermisos) {
        // Mostrar notificación
        this.mostrarNotificacionCambios();

        // Recargar la página con parámetro para refresh de permisos
        setTimeout(() => {
            const url = new URL(window.location);
            url.searchParams.set('refresh_permisos', 'true');
            window.location.href = url.toString();
        }, 2000);
    }

    /**
     * Forzar refresh inmediato de permisos
     */
    async forzarRefreshPermisos() {
        try {
            const url = new URL(window.location);
            url.searchParams.set('refresh_permisos', 'true');
            window.location.href = url.toString();
        } catch (error) {
            console.error('Error al forzar refresh de permisos:', error);
            // Fallback: reload normal
            window.location.reload();
        }
    }

    /**
     * Mostrar notificación de cambios
     */
    mostrarNotificacionCambios() {
        // Crear notificación visual
        const notificacion = document.createElement('div');
        notificacion.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notificacion.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        notificacion.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-arrow-clockwise me-2 text-primary fs-5"></i>
                <div>
                    <strong>Permisos Actualizados</strong><br>
                    <small>Recargando página en 2 segundos...</small>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notificacion);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 3000);
    }

    /**
     * Limpiar caché manualmente
     */
    async limpiarCache() {
        try {
            const response = await fetch('/Permisos/LimpiarCache', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.logger.log('🧹 Caché de permisos limpiado');
                this.verificarPermisos(); // Verificar inmediatamente
            }
        } catch (error) {
            this.logger.error('❌ Error limpiando caché:', error);
        }
    }

    /**
     * Verificar cambios en permisos desde el servidor con detección más agresiva
     */
    async verificarCambiosPermisos() {
        try {
            // 1. Verificar si hay invalidaciones forzosas
            const forceRefreshResponse = await fetch('/Permisos/VerificarRefreshForzoso', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (forceRefreshResponse.ok) {
                const forceData = await forceRefreshResponse.json();
                if (forceData.debeRenovar) {
                    console.log('🔄 Refresh forzoso detectado - Recargando inmediatamente...');
                    this.forzarRecargaInmediata();
                    return;
                }
            }

            // 2. Verificar si el token sigue vigente
            const tokenResponse = await fetch('/api/Auth/verificar-token-vigente', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                if (tokenData.debeRenovar) {
                    console.log('🔑 Token debe renovarse, redirigiendo...');
                    this.mostrarNotificacionCambios();
                    setTimeout(() => {
                        window.location.href = '/Account/Login?message=sesion_renovada';
                    }, 2000);
                    return;
                }
            }

            // 3. Verificar cambios normales en permisos
            const response = await fetch('/Permisos/VerificarCambios', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.hanCambiado || data.success === false) {
                console.log('🔄 Cambios detectados en permisos - Actualizando...');
                this.onPermisosActualizados(data.permisos || {});
            }
        } catch (error) {
            console.error('❌ Error verificando cambios de permisos:', error);
            // En caso de error, forzar verificación más agresiva
            this.forzarRecargaInmediata();
        }
    }

    /**
     * Forzar recarga inmediata sin esperar
     */
    forzarRecargaInmediata() {
        console.log('🚀 Forzando recarga inmediata de la página...');
        
        // Limpiar cualquier caché del navegador
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        // Limpiar localStorage relacionado con permisos
        Object.keys(localStorage).forEach(key => {
            if (key.includes('permiso') || key.includes('cache')) {
                localStorage.removeItem(key);
            }
        });

        // Recarga con timestamp para evitar cache
        const url = new URL(window.location);
        url.searchParams.set('refresh_permisos', 'true');
        url.searchParams.set('t', Date.now().toString());
        
        window.location.replace(url.toString());
    }
}

// Crear instancia global
window.permisosMonitor = new PermisosMonitor();

// Iniciar automáticamente cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Solo iniciar en páginas autenticadas
    if (document.body.dataset.authenticated === 'true') {
        window.permisosMonitor.iniciar();
    }
});

// Detener al salir de la página
window.addEventListener('beforeunload', function() {
    if (window.permisosMonitor) {
        window.permisosMonitor.detener();
    }
});