/**
 * 🔄 SISTEMA DE MONITOREO AUTOMÁTICO DE PERMISOS
 * Este módulo verifica automáticamente si los permisos del usuario han cambiado
 */

class PermisosMonitor {
    constructor() {
        this.permisosActuales = null;
        this.usuarioActual = null;
        this.intervalId = null;
        this.isChecking = false;
        this.ultimaVerificacion = Date.now();
        this.contadorCambios = 0;
        this.logger = {
            log: (message) => console.log(`[PermisosMonitor] ${message}`),
            error: (message) => console.error(`[PermisosMonitor] ${message}`)
        };
    }

    /**
     * Iniciar el monitoreo automático de permisos
     */
    iniciar() {
        this.logger.log('🚀 Iniciando monitoreo de permisos...');

        // Verificar inmediatamente al iniciar
        this.verificarPermisos();

        // ✅ REDUCIR INTERVALO A 15 SEGUNDOS PARA MEJOR RESPONSIVIDAD
        this.intervalId = setInterval(() => {
            this.verificarPermisos();
        }, 15000);

        this.logger.log('✅ Monitoreo de permisos iniciado (verificación cada 15 segundos)');

        // ✅ AGREGAR LISTENER PARA EVENTOS DE FOCUS/VISIBILIDAD
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.logger.log('🔄 Página visible - Verificando permisos...');
                this.verificarPermisos();
            }
        });

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
     * Verificar permisos del usuario actual
     */
    async verificarPermisos() {
        if (this.isChecking) return;

        this.isChecking = true;
        try {
            const response = await fetch('/Permisos/VerificarPermisosActuales', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                this.logger.error(`Error HTTP: ${response.status}`);
                return;
            }

            const data = await response.json();

            if (data.success && data.usuario) {
                // ✅ DETECTAR CAMBIO DE USUARIO
                if (this.usuarioActual && this.usuarioActual !== data.usuario.nombreUsuario) {
                    this.logger.log(`🔄 CAMBIO DE USUARIO DETECTADO: ${this.usuarioActual} → ${data.usuario.nombreUsuario}`);
                    this.contadorCambios++;

                    // Limpiar estado anterior
                    this.permisosActuales = null;

                    // Forzar recarga inmediata de la página
                    this.mostrarNotificacionCambioUsuario(this.usuarioActual, data.usuario.nombreUsuario);
                    setTimeout(() => {
                        this.logger.log('🔄 Recargando página por cambio de usuario...');
                        window.location.reload();
                    }, 1500);
                    return;
                }

                this.usuarioActual = data.usuario.nombreUsuario;

                // ✅ VERIFICAR CAMBIOS EN PERMISOS PARA EL MISMO USUARIO
                if (this.permisosActuales && this.hanCambiadoPermisos(this.permisosActuales, data.permisos)) {
                    this.logger.log('🔄 Cambios detectados en permisos del usuario');
                    this.contadorCambios++;
                    this.onPermisosActualizados(data.permisos);
                }

                this.permisosActuales = data.permisos;
                this.ultimaVerificacion = Date.now();
            }
        } catch (error) {
            this.logger.error('Error verificando permisos:', error);
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * Comparar si los permisos han cambiado
     */
    hanCambiadoPermisos(permisosAnteriores, permisosNuevos) {
        if (!permisosAnteriores || !permisosNuevos) {
            return true;
        }

        const campos = [
            'puedeVerCostos', 'puedeVerUtilidades', 'puedeProgramarInventario',
            'puedeEditarProductos', 'puedeEliminarProductos', 'puedeAjustarStock',
            'esAdministrador'
        ];

        return campos.some(campo => permisosAnteriores[campo] !== permisosNuevos[campo]);
    }

    /**
     * Evento cuando los permisos se actualizan
     */
    onPermisosActualizados(nuevosPermisos) {
        this.logger.log('✅ Permisos actualizados');

        // Mostrar notificación
        this.mostrarNotificacionCambios();

        // Recargar la página después de un breve delay
        setTimeout(() => {
            window.location.reload();
        }, 2000);
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
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 3000);
    }

    /**
     * ✅ NUEVO: Mostrar notificación específica para cambio de usuario
     */
    mostrarNotificacionCambioUsuario(usuarioAnterior, usuarioNuevo) {
        const notificacion = document.createElement('div');
        notificacion.className = 'alert alert-warning alert-dismissible fade show position-fixed';
        notificacion.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid #ff9800;
        `;

        notificacion.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-person-fill-check me-2 text-warning fs-5"></i>
                <div>
                    <strong>Cambio de Usuario Detectado</strong><br>
                    <small>${usuarioAnterior} → ${usuarioNuevo}</small><br>
                    <small class="text-muted">Actualizando interfaz...</small>
                </div>
            </div>
        `;

        document.body.appendChild(notificacion);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
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
     * ✅ NUEVO: Forzar verificación inmediata de permisos
     */
    async forzarVerificacionInmediata() {
        this.logger.log('🔄 FORZANDO verificación inmediata de permisos...');

        try {
            // 1. Limpiar permisos actuales para forzar comparación
            this.permisosActuales = null;

            // 2. Limpiar caché del servidor
            await this.limpiarCache();

            // 3. Verificar inmediatamente con datos frescos
            await this.verificarPermisos();

            // 4. Si estamos en páginas administrativas, mostrar notificación
            if (window.location.pathname.includes('/Configuracion/') || 
                window.location.pathname.includes('/Admin/')) {

                this.mostrarNotificacionCambios();

                // 5. Recargar la página después de 3 segundos para asegurar cambios
                setTimeout(() => {
                    this.logger.log('🔄 Recargando página para aplicar cambios de permisos...');
                    window.location.reload();
                }, 3000);
            }

            this.logger.log('✅ Verificación forzada completada');
        } catch (error) {
            this.logger.error('❌ Error en verificación forzada:', error);
        }
    }

    /**
     * ✅ NUEVO: Método que pueden llamar otras páginas cuando cambien roles
     */
    async notificarCambioRoles() {
        this.logger.log('🔄 Notificación de cambio de roles recibida');

        try {
            // Notificar al servidor sobre los cambios
            const response = await fetch('/Permisos/NotificarCambiosRoles', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                this.logger.log('✅ Servidor notificado sobre cambios en roles');
            }
        } catch (error) {
            this.logger.error('❌ Error notificando cambios al servidor:', error);
        }

        // Forzar verificación inmediata
        await this.forzarVerificacionInmediata();
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