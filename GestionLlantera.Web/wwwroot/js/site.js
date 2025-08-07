// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
// Función para mostrar notificaciones
function showNotification(message, type) {
    // Configuración global de Toastr
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    switch (type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        case 'info':
            toastr.info(message);
            break;
    }
}

// Funciones para la activación de cuenta
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = event.currentTarget;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('bi-eye-fill', 'bi-eye-slash-fill');
    } else {
        input.type = 'password';
        icon.classList.replace('bi-eye-slash-fill', 'bi-eye-fill');
    }
}

// Sistema de Notificaciones
// Variables globales para notificaciones
let notificacionesCache = [];
let conteoNoLeidas = 0;

// Función para cargar notificaciones
async function cargarNotificaciones() {
    try {
        const response = await fetch('/Notificaciones/ObtenerMisNotificaciones');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                notificacionesCache = result.data || [];
                renderizarNotificaciones();
            } else {
                mostrarErrorNotificaciones();
            }
        } else {
            mostrarErrorNotificaciones();
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarErrorNotificaciones();
    }
}

// Función para cargar conteo
async function cargarConteoNotificaciones() {
    try {
        const response = await fetch('/Notificaciones/ObtenerConteoNoLeidas');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                conteoNoLeidas = result.data || 0;
                actualizarBadges();
            }
        }
    } catch (error) {
        console.error('Error al cargar conteo:', error);
    }
}

// Función para renderizar notificaciones
function renderizarNotificaciones() {
    const contenedor = document.getElementById('notificationsList');
    
    if (!contenedor) {
        console.error('No se encontró el contenedor de notificaciones');
        return;
    }

    if (!notificacionesCache || notificacionesCache.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-3">
                <i class="bi bi-bell text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">No tienes notificaciones</p>
            </div>
        `;
        document.getElementById('notificationsHeader').innerHTML = `
            <h5 class="offcanvas-title">Notificaciones</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
        `;
        return;
    }

    let html = '';

    if (conteoNoLeidas > 0) {
        html += `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <small class="text-muted">Tienes ${conteoNoLeidas} notificaciones no leídas</small>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="marcarTodasComoLeidas()">
                    Marcar todas como leídas
                </button>
            </div>
        `;
    }

    html += '<div class="notifications-list">';

    notificacionesCache.slice(0, 20).forEach(notificacion => {
        const tipoClass = obtenerClaseTipo(notificacion.tipo);
        const icono = notificacion.icono || obtenerIconoPorDefecto(notificacion.tipo);
        const isUnread = !notificacion.leida;

        html += `
            <div class="notification-item ${isUnread ? 'unread' : ''}" data-notification-id="${notificacion.notificacionId}" style="position: relative;">
                <div class="notification-icon bg-${obtenerColorTipo(notificacion.tipo)}">
                    <i class="bi ${icono}"></i>
                </div>
                <div class="notification-content" 
                     onclick="manejarClickNotificacion(${notificacion.notificacionId}, '${notificacion.urlAccion || ''}')"
                     style="cursor: pointer; flex: 1;">
                    <div class="notification-title">${notificacion.titulo}</div>
                    <div class="notification-text">${notificacion.mensaje}</div>
                    <div class="notification-time">${notificacion.tiempoTranscurrido}</div>
                </div>
                <div class="notification-actions" style="display: flex; align-items: flex-start; padding-top: 0.5rem;">
                    <button type="button" 
                            class="btn btn-link text-muted p-0" 
                            onclick="event.stopPropagation(); ocultarNotificacion(${notificacion.notificacionId})"
                            title="Ocultar notificación"
                            style="font-size: 0.875rem;">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';

    if (notificacionesCache.length > 20) {
        html += `
            <div class="text-center mt-3">
                <small class="text-muted">Mostrando 20 de ${notificacionesCache.length} notificaciones</small>
            </div>
        `;
    }

    html += `
        </div>
        <div class="text-center mt-3">
            <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-outline-primary btn-sm" onclick="marcarTodasComoLeidas()">
                    <i class="bi bi-check-all me-1"></i>
                    Marcar todas como leídas
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarTodasNotificaciones()">
                    <i class="bi bi-trash3 me-1"></i>
                    Eliminar todas
                </button>
            </div>
        </div>
    `;

    // Actualizar encabezado con contador
    document.getElementById('notificationsHeader').innerHTML = `
        <h5 class="offcanvas-title">Notificaciones (${notificacionesCache.length})</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    `;

    contenedor.innerHTML = html;
}

// Función para mostrar error
function mostrarErrorNotificaciones() {
    const contenedor = document.getElementById('notificaciones-contenido');
    contenedor.innerHTML = `
        <div class="text-center py-3">
            <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
            <p class="mt-2 text-muted">Error al cargar notificaciones</p>
            <button class="btn btn-sm btn-outline-primary" onclick="cargarNotificaciones()">
                Reintentar
            </button>
        </div>
    `;
}

// Función para actualizar badges
function actualizarBadges() {
    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(badge => {
        if (conteoNoLeidas > 0) {
            badge.textContent = conteoNoLeidas > 99 ? '99+' : conteoNoLeidas.toString();
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Función para obtener clase de tipo
function obtenerClaseTipo(tipo) {
    switch (tipo) {
        case 'success': return 'bg-success';
        case 'warning': return 'bg-warning';
        case 'danger': return 'bg-danger';
        case 'info': return 'bg-info';
        default: return 'bg-primary';
    }
}

// Función para obtener ícono por defecto
function obtenerIconoPorDefecto(tipo) {
    switch (tipo) {
        case 'success': return 'bi bi-check-circle';
        case 'warning': return 'bi bi-exclamation-triangle';
        case 'danger': return 'bi bi-x-circle';
        case 'info': return 'bi bi-info-circle';
        default: return 'bi bi-bell';
    }
}

// Función para obtener color de tipo (necesaria para la nueva estructura)
function obtenerColorTipo(tipo) {
    switch (tipo) {
        case 'success': return 'success';
        case 'warning': return 'warning';
        case 'danger': return 'danger';
        case 'info': return 'info';
        default: return 'primary';
    }
}

// Función para obtener token CSRF
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Función para marcar como leída
async function marcarNotificacionComoLeida(notificacionId) {
    try {
        const response = await fetch('/Notificaciones/MarcarComoLeida', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            },
            body: JSON.stringify({ notificacionId: notificacionId })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Actualizar cache local
                const notificacion = notificacionesCache.find(n => n.notificacionId === notificacionId);
                if (notificacion) {
                    notificacion.leida = true;
                }

                // Actualizar conteo
                conteoNoLeidas = Math.max(0, conteoNoLeidas - 1);
                actualizarBadges();
                renderizarNotificaciones();
            }
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
}

// Función para ocultar una notificación específica
async function ocultarNotificacion(notificacionId) {
    try {
        const response = await fetch('/web/api/Notificaciones/OcultarNotificacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            },
            body: JSON.stringify({ NotificacionId: notificacionId })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Remover el elemento de la lista
                const elemento = document.querySelector(`[data-notification-id="${notificacionId}"]`);
                if (elemento) {
                    elemento.remove();
                }

                // Actualizar contador
                cargarConteoNotificaciones();

                // Recargar la lista si no quedan notificaciones
                const remainingNotifications = document.querySelectorAll('.notification-item');
                if (remainingNotifications.length === 0) {
                    cargarNotificaciones();
                }
            } else {
                console.error('Error al ocultar notificación:', result.message);
            }
        }
    } catch (error) {
        console.error('Error al ocultar notificación:', error);
    }
}


// Función para marcar todas como leídas
async function marcarTodasComoLeidas() {
    try {
        const response = await fetch('/Notificaciones/MarcarTodasComoLeidas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Actualizar cache local
                notificacionesCache.forEach(n => n.leida = true);
                conteoNoLeidas = 0;
                actualizarBadges();
                renderizarNotificaciones();
            }
        }
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
    }
}

// Función para eliminar todas las notificaciones
async function eliminarTodasNotificaciones() {
    if (!confirm('¿Estás seguro de que deseas eliminar todas las notificaciones? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch('/web/api/Notificaciones/OcultarTodasNotificaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Recargar la lista de notificaciones
                cargarNotificaciones();
                cargarConteoNotificaciones();
            } else {
                alert('Error al eliminar las notificaciones: ' + (result.message || 'Error desconocido'));
            }
        } else {
            alert('Error al comunicarse con el servidor');
        }
    } catch (error) {
        console.error('Error al eliminar todas las notificaciones:', error);
        alert('Error al eliminar las notificaciones');
    }
}

// Función para manejar click en notificación
function manejarClickNotificacion(notificacionId, urlAccion) {
    // Marcar como leída
    marcarNotificacionComoLeida(notificacionId);

    // Cerrar el panel
    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('notificationsPanel'));
    if (offcanvas) {
        offcanvas.hide();
    }

    // Navegar si tiene URL de acción
    if (urlAccion && urlAccion !== 'null' && urlAccion.trim() !== '') {
        setTimeout(() => {
            window.location.href = urlAccion;
        }, 200);
    }
}

// Inicialización del sistema de notificaciones
function inicializarNotificaciones() {
    // Cargar conteo inicial
    cargarConteoNotificaciones();

    // Cargar notificaciones cuando se abre el panel
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel) {
        notificationsPanel.addEventListener('show.bs.offcanvas', function () {
            cargarNotificaciones();
        });
    }

    // Actualizar conteo cada 30 segundos
    setInterval(cargarConteoNotificaciones, 30000);
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarNotificaciones();
});