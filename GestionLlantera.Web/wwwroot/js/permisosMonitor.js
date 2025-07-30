
/**
 * 🔄 SISTEMA DE MONITOREO AUTOMÁTICO DE PERMISOS
 * Este módulo verifica automáticamente si los permisos del usuario han cambiado
 */

class PermisosMonitor {
    constructor() {
        this.intervalId = null;
        this.ultimaVerificacion = null;
        this.permisosActuales = null;
        this.intervaloVerificacion = 10000; // 10 segundos
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
