/**
 * Utilidad para refrescar permisos del usuario actual
 */

async function refrescarPermisosUsuario() {
    try {
        console.log('🔄 Refrescando permisos del usuario...');

        const response = await fetch('/api/Permisos/refrescar-mis-permisos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            }
        });

        if (response.ok) {
            console.log('✅ Permisos refrescados correctamente');

            // Recargar la página para aplicar los nuevos permisos
            window.location.reload();
        } else if (response.status === 401) {
            // Token invalidado - redirigir al login
            const data = await response.json();
            if (data.code === 'TOKEN_INVALIDATED') {
                console.log('🔒 Sesión invalidada - redirigiendo al login');
                mostrarMensajeSesionInvalidada();
                setTimeout(() => {
                    window.location.href = '/Account/Login';
                }, 2000);
                return;
            }
        } else {
            console.warn('⚠️ No se pudieron refrescar los permisos');
        }
    } catch (error) {
        console.error('❌ Error al refrescar permisos:', error);
    }
}

// Función para mostrar mensaje de sesión invalidada
function mostrarMensajeSesionInvalidada() {
    // Crear modal o toast
    const mensaje = document.createElement('div');
    mensaje.className = 'alert alert-warning alert-dismissible fade show position-fixed';
    mensaje.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    mensaje.innerHTML = `
        <strong>Sesión invalidada</strong><br>
        Sus permisos han sido modificados. Será redirigido al login para renovar su sesión.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(mensaje);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (mensaje.parentNode) {
            mensaje.parentNode.removeChild(mensaje);
        }
    }, 5000);
}

/**
 * Función para mostrar notificaciones (reutilizar la que ya tienes o crear una simple)
 */
function mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    // Si ya tienes un sistema de notificaciones, úsalo
    // Sino, aquí tienes una implementación simple con alert
    console.log(`${tipo.toUpperCase()}: ${titulo} - ${mensaje}`);

    // Implementación simple con toast o alert
    if (typeof toastr !== 'undefined') {
        toastr[tipo](mensaje, titulo);
    } else {
        alert(`${titulo}: ${mensaje}`);
    }
}

/**
 * Agregar botón de refrescar permisos al layout
 */
function agregarBotonRefrescarPermisos() {
    // Solo para usuarios autenticados
    if (document.querySelector('[data-user-authenticated="true"]')) {
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const btnRefresh = document.createElement('li');
            btnRefresh.className = 'nav-item';
            btnRefresh.innerHTML = `
                <button class="btn btn-link nav-link" onclick="refrescarPermisosUsuario()" title="Refrescar Permisos">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            `;
            navbar.appendChild(btnRefresh);
        }
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    agregarBotonRefrescarPermisos();
});