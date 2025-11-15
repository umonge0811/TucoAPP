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
            }
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

    console.log(`Renderizando notificaciones. Total: ${notificacionesCache.length}, No leídas: ${conteoNoLeidas}`);

    // Botones de acción superior
    html += `
        <div class="d-flex justify-content-between align-items-center mb-3 gap-2">
            <small class="text-muted">
                ${conteoNoLeidas > 0 ? `${conteoNoLeidas} no leída${conteoNoLeidas > 1 ? 's' : ''}` : 'Todas leídas'}
            </small>
            <div class="d-flex gap-2">
                ${conteoNoLeidas > 0 ? `
                    <button type="button" class="btn btn-sm btn-outline-primary" data-action="marcar-todas">
                        <i class="bi bi-check-all me-1"></i>Marcar todas
                    </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-outline-danger" data-action="eliminar-todas">
                    <i class="bi bi-trash3 me-1"></i>Eliminar todas
                </button>
            </div>
        </div>
    `;

    html += '<div class="notifications-list">';

    notificacionesCache.slice(0, 20).forEach(notificacion => {
        const tipoClass = obtenerClaseTipo(notificacion.tipo);
        const icono = notificacion.icono || obtenerIconoPorDefecto(notificacion.tipo);
        const isUnread = !notificacion.leida;

        html += `
            <div class="notification-item ${isUnread ? 'unread' : ''}" style="position: relative;">
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
        const response = await fetch('/Notificaciones/marcar-leida', {
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

// Función para ocultar notificación individual
async function ocultarNotificacion(notificacionId) {
    try {
        const response = await fetch('/Notificaciones/OcultarNotificacion', {
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
                // Eliminar de la caché local
                notificacionesCache = notificacionesCache.filter(n => n.notificacionId !== notificacionId);

                // Actualizar conteo si estaba no leída
                const notificacionOriginal = Array.from(arguments[0]).find(n => n.notificacionId === notificacionId);
                if (notificacionOriginal && !notificacionOriginal.leida) {
                    conteoNoLeidas = Math.max(0, conteoNoLeidas - 1);
                    actualizarBadges();
                }
                renderizarNotificaciones();
            }
        }
    } catch (error) {
        console.error('Error al ocultar notificación:', error);
    }
}


// Función para marcar todas como leídas
async function marcarTodasComoLeidas() {
    console.log('Marcando todas las notificaciones como leídas...');
    try {
        const response = await fetch('/Notificaciones/marcar-todas-leidas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            }
        });

        console.log('Respuesta recibida:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Resultado:', result);
            if (result.success) {
                // Actualizar cache local
                notificacionesCache.forEach(n => n.leida = true);
                conteoNoLeidas = 0;
                actualizarBadges();
                renderizarNotificaciones();

                // Mostrar mensaje de éxito
                if (typeof toastr !== 'undefined') {
                    toastr.success('Todas las notificaciones marcadas como leídas');
                }
            } else {
                console.error('La operación no fue exitosa:', result);
                if (typeof toastr !== 'undefined') {
                    toastr.error('Error al marcar las notificaciones');
                }
            }
        } else {
            console.error('Error en la respuesta:', response.status);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error al marcar las notificaciones');
            }
        }
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
        if (typeof toastr !== 'undefined') {
            toastr.error('Error al marcar las notificaciones');
        }
    }
}

// Función para eliminar todas las notificaciones
async function eliminarTodasLasNotificaciones() {
    console.log('Intentando eliminar todas las notificaciones...');

    // Mostrar confirmación
    if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({
            title: '¿Eliminar todas las notificaciones?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar todas',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            console.log('Usuario canceló la eliminación');
            return;
        }
    } else {
        if (!confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) {
            console.log('Usuario canceló la eliminación');
            return;
        }
    }

    console.log('Enviando petición para eliminar todas...');

    try {
        const response = await fetch('/Notificaciones/OcultarTodasNotificaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getCSRFToken()
            }
        });

        console.log('Respuesta recibida:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Resultado:', result);

            if (result.success) {
                // Limpiar cache local
                notificacionesCache = [];
                conteoNoLeidas = 0;
                actualizarBadges();
                renderizarNotificaciones();

                // Mostrar mensaje de éxito
                if (typeof toastr !== 'undefined') {
                    toastr.success('Todas las notificaciones han sido eliminadas');
                } else {
                    alert('Todas las notificaciones han sido eliminadas');
                }
            } else {
                console.error('La operación no fue exitosa:', result);
                if (typeof toastr !== 'undefined') {
                    toastr.error('Error al eliminar las notificaciones');
                } else {
                    alert('Error al eliminar las notificaciones');
                }
            }
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error al eliminar las notificaciones');
            } else {
                alert('Error al eliminar las notificaciones');
            }
        }
    } catch (error) {
        console.error('Error al eliminar todas las notificaciones:', error);
        if (typeof toastr !== 'undefined') {
            toastr.error('Error al eliminar las notificaciones');
        } else {
            alert('Error al eliminar las notificaciones');
        }
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

    // Event delegation para botones de acción en el panel de notificaciones
    const contenedorNotificaciones = document.getElementById('notificaciones-contenido');
    if (contenedorNotificaciones) {
        contenedorNotificaciones.addEventListener('click', function(event) {
            const button = event.target.closest('[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');
            console.log('Botón clickeado:', action);

            if (action === 'marcar-todas') {
                event.preventDefault();
                marcarTodasComoLeidas();
            } else if (action === 'eliminar-todas') {
                event.preventDefault();
                eliminarTodasLasNotificaciones();
            }
        });
    }

    // Actualizar conteo cada 30 segundos
    setInterval(cargarConteoNotificaciones, 30000);
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarNotificaciones);