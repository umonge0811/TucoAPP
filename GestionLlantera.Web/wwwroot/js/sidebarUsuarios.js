
/**
 * ========================================
 * SIDEBAR USUARIOS - MÓDULO GLOBAL
 * ========================================
 * Gestión de usuarios conectados en el sidebar para todas las vistas
 * Autor: Sistema Gestión Llantera
 * Fecha: 2025
 */

// ========================================
// VARIABLES GLOBALES
// ========================================
let usuariosConectadosInterval = null;
let sidebarInicializado = false;

// ========================================
// INICIALIZACIÓN DEL MÓDULO
// ========================================

/**
 * Inicializar el módulo de usuarios conectados del sidebar
 */
function inicializarSidebarUsuarios() {
    if (sidebarInicializado) {
        console.log('👥 Sidebar usuarios ya inicializado, omitiendo...');
        return;
    }

    console.log('👥 Inicializando módulo de usuarios conectados del sidebar');

    try {
        // Marcar como inicializado
        sidebarInicializado = true;

        // Cargar usuarios conectados inicial
        cargarUsuariosConectadosSidebar();

        // Configurar actualización automática cada 2 minutos
        usuariosConectadosInterval = setInterval(() => {
            cargarUsuariosConectadosSidebar();
        }, 2 * 60 * 1000); // 2 minutos

        console.log('✅ Módulo de usuarios conectados del sidebar inicializado');
    } catch (error) {
        console.error('❌ Error inicializando sidebar usuarios:', error);
        sidebarInicializado = false;
    }
}

// ========================================
// GESTIÓN DE USUARIOS CONECTADOS
// ========================================

/**
 * Cargar usuarios conectados desde el backend
 */
async function cargarUsuariosConectadosSidebar() {
    try {
        const response = await fetch('/Dashboard/ObtenerUsuariosConectados', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('⚠️ Error obteniendo usuarios conectados para sidebar:', response.status);
            return;
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            actualizarContadorSidebar(resultado.data.totalUsuarios || 0);
            actualizarPanelUsuariosConectadosSidebar(resultado.data.usuarios || []);
        } else {
            console.warn('⚠️ No se pudieron obtener usuarios conectados para sidebar');
            actualizarContadorSidebar(0);
        }

    } catch (error) {
        console.error('❌ Error cargando usuarios conectados para sidebar:', error);
        actualizarContadorSidebar(0);
    }
}

/**
 * Actualizar el contador de usuarios conectados en el sidebar
 */
function actualizarContadorSidebar(totalUsuarios) {
    try {
        // Buscar el botón del sidebar que muestra usuarios conectados
        const sidebarButton = document.querySelector('.online-users-toggle');
        if (sidebarButton) {
            // Actualizar el texto del botón con el número dinámico
            const iconHtml = '<i class="bi bi-circle-fill text-success me-2"></i>';
            const chevronHtml = '<i class="bi bi-chevron-up"></i>';
            
            sidebarButton.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    ${iconHtml}
                    <span>Usuarios Conectados (${totalUsuarios})</span>
                </div>
                ${chevronHtml}
            `;

            // Asegurar que el botón apunte al panel correcto
            sidebarButton.setAttribute('data-bs-target', '#usersPanelBottom');
            sidebarButton.setAttribute('aria-controls', 'usersPanelBottom');

            console.log(`✅ Contador del sidebar actualizado: ${totalUsuarios} usuarios`);
        } else {
            console.warn('⚠️ Botón de usuarios conectados del sidebar no encontrado');
        }
    } catch (error) {
        console.error('❌ Error actualizando contador del sidebar:', error);
    }
}

/**
 * Actualizar el panel de usuarios conectados desde el sidebar
 */
function actualizarPanelUsuariosConectadosSidebar(usuarios) {
    try {
        const panelUsuarios = document.querySelector('#usersPanelBottom .connected-users-list');
        if (!panelUsuarios) {
            console.warn('⚠️ Panel de usuarios conectados (bottom) no encontrado');
            return;
        }

        // Limpiar contenido actual
        panelUsuarios.innerHTML = '';

        if (usuarios.length === 0) {
            panelUsuarios.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-person-x fs-1 mb-2 d-block"></i>
                    <p>No hay usuarios conectados</p>
                </div>
            `;
            return;
        }

        // Generar elementos de usuarios
        usuarios.forEach(usuario => {
            const estadoClase = {
                'Activo': 'success',
                'Inactivo': 'warning',
                'Desconectado': 'secondary'
            }[usuario.estado] || 'secondary';

            const iniciales = usuario.nombreUsuario
                ? usuario.nombreUsuario.substring(0, 2).toUpperCase()
                : 'US';

            const tiempoTexto = usuario.tiempoConectadoMinutos <= 30
                ? `Activo hace ${Math.round(usuario.tiempoConectadoMinutos)} min`
                : `${usuario.estado} hace ${Math.round(usuario.tiempoConectadoMinutos)} min`;

            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-avatar bg-${estadoClase}">${iniciales}</div>
                <div class="user-info">
                    <div class="user-name">${usuario.nombreUsuario || 'Usuario'}</div>
                    <div class="user-role">
                        <span class="badge bg-${estadoClase}">${usuario.estado}</span>
                        ${usuario.sesionesActivas > 1 ? `<span class="badge bg-info ms-1">${usuario.sesionesActivas} sesiones</span>` : ''}
                    </div>
                    <div class="user-status">${tiempoTexto}</div>
                </div>
            `;

            panelUsuarios.appendChild(userElement);
        });

        console.log('✅ Panel de usuarios conectados (sidebar) actualizado');
    } catch (error) {
        console.error('❌ Error actualizando panel de usuarios (sidebar):', error);
    }
}

// ========================================
// LIMPIEZA DE RECURSOS
// ========================================

/**
 * Limpiar recursos al cambiar de página
 */
function limpiarSidebarUsuarios() {
    if (usuariosConectadosInterval) {
        clearInterval(usuariosConectadosInterval);
        usuariosConectadosInterval = null;
    }
    sidebarInicializado = false;
    console.log('🧹 Recursos de sidebar usuarios limpiados');
}

// ========================================
// EVENTOS DE INICIALIZACIÓN
// ========================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 DOM cargado, inicializando sidebar usuarios...');
    
    // Pequeño delay para asegurar que otros scripts se carguen primero
    setTimeout(() => {
        inicializarSidebarUsuarios();
    }, 1000);
});

// Limpiar recursos cuando se abandona la página
window.addEventListener('beforeunload', function() {
    limpiarSidebarUsuarios();
});

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

// Hacer disponibles las funciones principales globalmente
window.sidebarUsuarios = {
    inicializar: inicializarSidebarUsuarios,
    cargar: cargarUsuariosConectadosSidebar,
    actualizar: actualizarContadorSidebar,
    limpiar: limpiarSidebarUsuarios
};

console.log('👥 Módulo SidebarUsuarios cargado correctamente');
