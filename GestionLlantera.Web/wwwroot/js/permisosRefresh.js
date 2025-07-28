
/**
 * Utilidad para refrescar permisos del usuario actual
 */

async function refrescarPermisosUsuario() {
    try {
        console.log('🔄 Refrescando permisos del usuario...');
        
        const response = await fetch('/api/Permisos/refrescar-mis-permisos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Permisos refrescados correctamente');
            
            // Mostrar notificación de éxito
            mostrarNotificacion('Permisos actualizados', 'Los permisos han sido refrescados correctamente', 'success');
            
            // Recargar la página después de un breve delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return true;
        } else {
            console.error('❌ Error al refrescar permisos:', response.statusText);
            mostrarNotificacion('Error', 'No se pudieron refrescar los permisos', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al refrescar permisos:', error);
        mostrarNotificacion('Error', 'Ocurrió un error al refrescar los permisos', 'error');
        return false;
    }
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
