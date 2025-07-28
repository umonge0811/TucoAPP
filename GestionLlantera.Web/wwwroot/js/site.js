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
        const response = await fetch('/api/notificaciones/mis-notificaciones');
        if (response.ok) {
            notificacionesCache = await response.json();
            renderizarNotificaciones();
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarErrorNotificaciones();
    }
}

// Función para cargar conteo
async function cargarConteoNotificaciones() {
    try {
        const response = await fetch('/api/notificaciones/conteo-no-leidas');
        if (response.ok) {
            conteoNoLeidas = await response.json();
            actualizarBadges();
        }
    } catch (error) {
        console.error('Error al cargar conteo:', error);
    }
}

// Función para renderizar notificaciones
function renderizarNotificaciones() {
    const contenedor = document.getElementById('notificaciones-contenido');

    if (!notificacionesCache || notificacionesCache.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-bell-slash" style="font-size: 3rem; color: #dee2e6;"></i>
                <h6 class="mt-3 text-muted">No tienes notificaciones</h6>
                <p class="text-muted small">Cuando recibas notificaciones aparecerán aquí.</p>
            </div>
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

        html += `
            <div class="notification-item ${!notificacion.leida ? 'unread' : ''}"
                 data-notification-id="${notificacion.notificacionId}"
                 onclick="manejarClickNotificacion(${notificacion.notificacionId}, '${notificacion.urlAccion || ''}')"
                 style="cursor: pointer;">

                <div class="notification-icon ${tipoClass}">
                    <i class="${icono}"></i>
                </div>

                <div class="notification-content">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="notification-title">${notificacion.titulo}</div>
                        ${!notificacion.leida ? '<span class="unread-indicator bg-primary rounded-circle" style="width: 8px; height: 8px;"></span>' : ''}
                    </div>
                    <p class="notification-text">${notificacion.mensaje}</p>
                    <div class="notification-time">${notificacion.tiempoTranscurrido}</div>
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

// Función para obtener token CSRF
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Función para marcar como leída
async function marcarNotificacionComoLeida(notificacionId) {
    try {
        const response = await fetch(`/api/notificaciones/${notificacionId}/marcar-leida`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            }
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

// Función para marcar todas como leídas
async function marcarTodasComoLeidas() {
    try {
        const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
            method: 'PUT',
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
document.addEventListener('DOMContentLoaded', inicializarNotificaciones);

// Configuración global para peticiones HTTP
$(document).ajaxSetup({
    beforeSend: function(xhr) {
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
    },
    // ✅ MANEJO GLOBAL DE SESIÓN INVÁLIDA
    error: function(xhr, status, error) {
        if (xhr.status === 401) {
            console.log('⚠️ Sesión inválida detectada - redirigiendo al login');

            // Limpiar datos de sesión
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Mostrar mensaje al usuario
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '🔒 Sesión Invalidada',
                    text: 'Tu sesión ha sido invalidada debido a cambios en tus permisos. Por favor, inicia sesión nuevamente para obtener tus permisos actualizados.',
                    icon: 'info',
                    showConfirmButton: true,
                    confirmButtonText: 'Ir al Login',
                    confirmButtonColor: '#3085d6'
                }).then(() => {
                    window.location.href = '/Account/Login';
                });
            } else {
                alert('Tu sesión ha sido invalidada. Por favor, inicia sesión nuevamente.');
                window.location.href = '/Account/Login';
            }
        }
    }
});