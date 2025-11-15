/**
 * JavaScript específico para EJECUTAR INVENTARIOS
 * Separado de programar-inventario.js para evitar conflictos
 */

// =====================================
// VARIABLES GLOBALES
// =====================================
let inventarioActual = null;
let productosInventario = [];
let productosFiltrados = [];
let estadisticasActuales = {};
let ajustesPendientes = []; // Nueva variable para ajustes pendientes
let filtrosActivos = {
    texto: '',
    estado: '',
    tipo: ''
};

// ✅ CONFIGURACIÓN DEL PIN (más adelante será desde BD)
const PIN_ADMIN = "1234";
let inventarioBloqueado = false;
let pinValidado = false;
let tiempoSesionAdmin = null;
const DURACION_SESION_ADMIN = 30 * 60 * 1000; // 30 minutos en millisegundos

/**
 * ✅ FUNCIÓN: Verificar si el inventario debe estar bloqueado
 */
function verificarEstadoBloqueo() {
    try {
        // ✅ VERIFICAR SI EL INVENTARIO ESTÁ COMPLETADO
        const estadoInventario = inventarioActual?.estado;
        const estaCompletado = estadoInventario === 'Completado' || estadoInventario === 'Finalizado';

        if (estaCompletado && !inventarioBloqueado) {
            console.log('🔒 Inventario completado - Activando bloqueo');
            activarBloqueoInventario();
        }

        return inventarioBloqueado;

    } catch (error) {
        console.error('❌ Error verificando estado de bloqueo:', error);
        return false;
    }
}

/**
 * ✅ FUNCIÓN: Activar bloqueo del inventario
 */
function activarBloqueoInventario() {
    try {
        inventarioBloqueado = true;
        pinValidado = false;
        tiempoSesionAdmin = null;

        console.log('🔒 Bloqueo de inventario activado');

        // Aplicar bloqueo visual inmediatamente
        aplicarBloqueoVisual();

        // Mostrar notificación de bloqueo
        mostrarNotificacionBloqueo();

    } catch (error) {
        console.error('❌ Error activando bloqueo:', error);
    }
}

/**
 * ✅ FUNCIÓN: Aplicar bloqueo visual a la interfaz
 */
function aplicarBloqueoVisual() {
    try {
        console.log('🔒 Aplicando bloqueo visual completo...');

        // ✅ BLOQUEAR TODOS LOS BOTONES DE ACCIÓN (INCLUYE LOS NUEVOS)
        const selectoresBotones = [
            '.btn-conteo',           // Contar/Recontar
            '.btn-ajuste-pendiente', // Crear Ajuste
            '.btn-validacion',       // Validar
            'button[onclick*="verAjustesProducto"]',     // Ver Ajuste
            'button[onclick*="editarAjustePendiente"]',  // Editar Ajuste
            'button[onclick*="abrirModalConteo"]',       // Contar (por onclick)
            'button[onclick*="abrirModalAjustePendiente"]', // Crear Ajuste (por onclick)
            'button[onclick*="validarDiscrepancia"]'     // Validar (por onclick)
        ];

        selectoresBotones.forEach(selector => {
            $(selector).each(function () {
                const $btn = $(this);

                // ✅ GUARDAR ESTADO ORIGINAL (solo si no existe)
                if (!$btn.data('estado-original-bloqueo')) {
                    $btn.data('estado-original-bloqueo', {
                        disabled: $btn.prop('disabled'),
                        html: $btn.html(),
                        classes: $btn.attr('class'),
                        onclick: $btn.attr('onclick')
                    });
                }

                // ✅ APLICAR BLOQUEO VISUAL
                $btn.prop('disabled', true)
                    .removeClass('btn-primary btn-warning btn-success btn-info btn-outline-warning')
                    .addClass('btn-secondary')
                    .attr('onclick', 'solicitarPinAdmin(); return false;')
                    .html('<i class="bi bi-lock me-1"></i>Bloqueado');
            });
        });

        // ✅ BLOQUEAR PANEL DE AJUSTES PENDIENTES COMPLETO
        $('#ajustesPendientesPanel .btn').each(function () {
            const $btn = $(this);
            if (!$btn.hasClass('btn-unlock-admin')) {

                // Guardar estado original
                if (!$btn.data('estado-original-panel')) {
                    $btn.data('estado-original-panel', {
                        disabled: $btn.prop('disabled'),
                        html: $btn.html(),
                        classes: $btn.attr('class')
                    });
                }

                $btn.prop('disabled', true).addClass('disabled');
            }
        });

        // ✅ BLOQUEAR BOTONES EN LA TABLA DE AJUSTES PENDIENTES
        $('#tablaAjustesBody button').each(function () {
            const $btn = $(this);

            if (!$btn.data('estado-original-tabla')) {
                $btn.data('estado-original-tabla', {
                    disabled: $btn.prop('disabled'),
                    html: $btn.html(),
                    classes: $btn.attr('class'),
                    onclick: $btn.attr('onclick')
                });
            }

            $btn.prop('disabled', true)
                .removeClass('btn-danger btn-info btn-outline-danger btn-outline-info')
                .addClass('btn-secondary')
                .attr('onclick', 'solicitarPinAdmin(); return false;')
                .html('<i class="bi bi-lock"></i>');
        });

        // ✅ BLOQUEAR FILAS DE PRODUCTOS VISUALMENTE
        $('.producto-row').addClass('producto-bloqueado').css({
            'opacity': '0.7',
            'pointer-events': 'none'
        });

        // ✅ MOSTRAR OVERLAY DE BLOQUEO EN SECCIONES CRÍTICAS
        mostrarOverlayBloqueo();

        console.log('✅ Bloqueo visual completo aplicado a TODOS los botones');

    } catch (error) {
        console.error('❌ Error aplicando bloqueo visual completo:', error);
    }
}


/**
 * ✅ FUNCIÓN: Mostrar overlay de bloqueo
 */
function mostrarOverlayBloqueo() {
    try {
        // Crear overlay para panel de ajustes pendientes
        const overlayAjustes = `
            <div class="bloqueo-overlay" id="overlayAjustes">
                <div class="bloqueo-content">
                    <div class="text-center">
                        <i class="bi bi-shield-lock display-4 text-warning mb-3"></i>
                        <h5 class="text-dark">Inventario Completado</h5>
                        <p class="text-muted mb-3">Los ajustes están bloqueados para preservar la integridad</p>
                        <button class="btn btn-warning btn-sm" onclick="solicitarPinAdmin()">
                            <i class="bi bi-unlock me-1"></i>
                            Desbloquear (Admin)
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Aplicar overlay al panel de ajustes
        const $panelAjustes = $('#ajustesPendientesPanel');
        if ($panelAjustes.length && !$panelAjustes.find('.bloqueo-overlay').length) {
            $panelAjustes.css('position', 'relative').append(overlayAjustes);
        }

        // Agregar estilos CSS si no existen
        if (!$('#estilosBloqueo').length) {
            $('head').append(`
                <style id="estilosBloqueo">
                    .bloqueo-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(255, 255, 255, 0.95);
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 0.375rem;
                    }
                    
                    .bloqueo-content {
                        text-align: center;
                        padding: 2rem;
                        background: white;
                        border-radius: 0.5rem;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        border: 2px solid #ffc107;
                    }
                    
                    .producto-row.bloqueado {
                        opacity: 0.6;
                        pointer-events: none;
                    }
                    
                    .sesion-admin-activa {
                        border-left: 4px solid #28a745 !important;
                        background-color: rgba(40, 167, 69, 0.05) !important;
                    }
                </style>
            `);
        }

    } catch (error) {
        console.error('❌ Error mostrando overlay de bloqueo:', error);
    }
}

/**
 * ✅ FUNCIÓN: Mostrar notificación de bloqueo
 */
function mostrarNotificacionBloqueo() {
    try {
        // Mostrar notificación en la parte superior
        const notificacion = `
            <div class="alert alert-warning border-warning shadow-sm mb-3" id="notificacionBloqueo">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="bi bi-shield-lock display-6 text-warning"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">🔒 Inventario Completado y Bloqueado</h5>
                        <p class="mb-2">
                            El inventario ha sido completado exitosamente. Todas las acciones de modificación están bloqueadas 
                            para preservar la integridad de los datos.
                        </p>
                        <hr>
                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm" onclick="solicitarPinAdmin()">
                                <i class="bi bi-unlock me-1"></i>
                                Acceso Administrativo
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="$('#notificacionBloqueo').slideUp()">
                                <i class="bi bi-x me-1"></i>
                                Ocultar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar después del header
        $('.toma-header').after(notificacion);

    } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
    }
}

/**
 * ✅ FUNCIÓN: Solicitar PIN de administrador
 */
async function solicitarPinAdmin() {
    try {
        console.log('🔑 Solicitando PIN de administrador...');

        const resultado = await Swal.fire({
            title: '🔑 Acceso Administrativo',
            html: `
                <div class="text-start">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Acceso Restringido:</strong> Se requiere PIN de administrador para desbloquear 
                        las funciones de modificación en un inventario completado.
                    </div>
                    
                    <div class="mb-3">
                        <label for="pinAdmin" class="form-label fw-bold">PIN de Administrador:</label>
                        <input type="password" 
                               class="form-control form-control-lg text-center" 
                               id="pinAdmin" 
                               placeholder="••••" 
                               maxlength="10"
                               autocomplete="off">
                    </div>
                    
                    <div class="small text-muted">
                        <i class="bi bi-shield-check me-1"></i>
                        El acceso administrativo será válido por 30 minutos.
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-unlock me-1"></i> Validar PIN',
            cancelButtonText: '<i class="bi bi-x-lg me-1"></i> Cancelar',
            focusConfirm: false,
            didOpen: () => {
                // Focus en el input del PIN
                document.getElementById('pinAdmin').focus();
            },
            preConfirm: () => {
                const pin = document.getElementById('pinAdmin').value;
                if (!pin) {
                    Swal.showValidationMessage('Debes ingresar el PIN');
                    return false;
                }
                return pin;
            }
        });

        if (resultado.isConfirmed) {
            validarPinAdmin(resultado.value);
        }

    } catch (error) {
        console.error('❌ Error solicitando PIN:', error);
        mostrarError('Error al solicitar PIN de administrador');
    }
}

/**
 * ✅ FUNCIÓN: Validar PIN de administrador
 */
function validarPinAdmin(pinIngresado) {
    try {
        console.log('🔍 Validando PIN de administrador...');

        if (pinIngresado === PIN_ADMIN) {
            // PIN correcto
            console.log('✅ PIN válido - Concediendo acceso administrativo');

            pinValidado = true;
            tiempoSesionAdmin = Date.now() + DURACION_SESION_ADMIN;

            // Desbloquear interfaz
            desbloquearInventario();

            // Mostrar éxito con información de sesión
            Swal.fire({
                title: '✅ Acceso Concedido',
                html: `
                    <div class="text-center">
                        <div class="mb-3">
                            <i class="bi bi-shield-check display-4 text-success"></i>
                        </div>
                        <p class="text-success mb-3">
                            <strong>Acceso administrativo activado</strong>
                        </p>
                        <div class="alert alert-success">
                            <small>
                                <i class="bi bi-clock me-1"></i>
                                Sesión válida por 30 minutos
                            </small>
                        </div>
                    </div>
                `,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });

            // Iniciar contador de sesión
            iniciarContadorSesionAdmin();

        } else {
            // PIN incorrecto
            console.log('❌ PIN inválido');

            Swal.fire({
                title: '❌ PIN Incorrecto',
                text: 'El PIN ingresado no es válido. Contacta con un administrador si necesitas acceso.',
                icon: 'error',
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Entendido'
            });
        }

    } catch (error) {
        console.error('❌ Error validando PIN:', error);
        mostrarError('Error validando PIN de administrador');
    }
}

/**
 * ✅ FUNCIÓN: Desbloquear inventario con acceso admin
 */
function desbloquearInventario() {
    try {
        console.log('🔓 Desbloqueando inventario con acceso admin...');

        // ✅ RESTAURAR TODOS LOS BOTONES DE ACCIÓN
        const selectoresBotones = [
            '.btn-conteo',
            '.btn-ajuste-pendiente',
            '.btn-validacion',
            'button[onclick*="verAjustesProducto"]',
            'button[onclick*="editarAjustePendiente"]',
            'button[onclick*="abrirModalConteo"]',
            'button[onclick*="abrirModalAjustePendiente"]',
            'button[onclick*="validarDiscrepancia"]'
        ];

        selectoresBotones.forEach(selector => {
            $(selector).each(function () {
                const $btn = $(this);
                const estadoOriginal = $btn.data('estado-original-bloqueo');

                if (estadoOriginal) {
                    // Restaurar estado original completo
                    $btn.prop('disabled', estadoOriginal.disabled)
                        .attr('class', estadoOriginal.classes)
                        .html(estadoOriginal.html);

                    // Restaurar onclick si existía
                    if (estadoOriginal.onclick) {
                        $btn.attr('onclick', estadoOriginal.onclick);
                    } else {
                        $btn.removeAttr('onclick');
                    }
                }
            });
        });

        // ✅ DESBLOQUEAR PANEL DE AJUSTES
        $('#ajustesPendientesPanel .btn').each(function () {
            const $btn = $(this);
            const estadoOriginal = $btn.data('estado-original-panel');

            if (estadoOriginal) {
                $btn.prop('disabled', estadoOriginal.disabled)
                    .removeClass('disabled')
                    .attr('class', estadoOriginal.classes)
                    .html(estadoOriginal.html);
            }
        });

        // ✅ DESBLOQUEAR TABLA DE AJUSTES PENDIENTES
        $('#tablaAjustesBody button').each(function () {
            const $btn = $(this);
            const estadoOriginal = $btn.data('estado-original-tabla');

            if (estadoOriginal) {
                $btn.prop('disabled', estadoOriginal.disabled)
                    .attr('class', estadoOriginal.classes)
                    .html(estadoOriginal.html);

                if (estadoOriginal.onclick) {
                    $btn.attr('onclick', estadoOriginal.onclick);
                } else {
                    $btn.removeAttr('onclick');
                }
            }
        });

        // ✅ DESBLOQUEAR FILAS DE PRODUCTOS
        $('.producto-row').removeClass('producto-bloqueado').css({
            'opacity': '',
            'pointer-events': ''
        });

        // ✅ REMOVER OVERLAYS DE BLOQUEO
        $('.bloqueo-overlay').remove();

        // ✅ AGREGAR INDICADOR VISUAL DE SESIÓN ADMIN
        $('.dashboard-card').addClass('sesion-admin-activa');

        // ✅ MOSTRAR INDICADOR DE SESIÓN EN EL HEADER
        mostrarIndicadorSesionAdmin();

        console.log('✅ TODOS los botones desbloqueados - Sesión admin activa');

    } catch (error) {
        console.error('❌ Error desbloqueando inventario:', error);
    }
}


/**
 * ✅ FUNCIÓN: Mostrar indicador de sesión admin activa
 */
function mostrarIndicadorSesionAdmin() {
    try {
        // Remover indicador anterior si existe
        $('#indicadorSesionAdmin').remove();

        const indicador = `
            <div class="alert alert-success border-success shadow-sm mb-3" id="indicadorSesionAdmin">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="bi bi-shield-check display-6 text-success"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="alert-heading mb-1">🔓 Sesión Administrativa Activa</h6>
                        <p class="mb-2">
                            Tienes acceso completo para modificar el inventario. 
                            <span class="fw-bold">Tiempo restante: <span id="tiempoRestante">30:00</span></span>
                        </p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-success btn-sm" onclick="extenderSesionAdmin()">
                                <i class="bi bi-clock-history me-1"></i>
                                Extender Sesión
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="cerrarSesionAdmin()">
                                <i class="bi bi-box-arrow-right me-1"></i>
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar después de la notificación de bloqueo o header
        if ($('#notificacionBloqueo').length) {
            $('#notificacionBloqueo').after(indicador);
        } else {
            $('.toma-header').after(indicador);
        }

    } catch (error) {
        console.error('❌ Error mostrando indicador de sesión:', error);
    }
}

/**
 * ✅ FUNCIÓN: Iniciar contador de sesión admin
 */
function iniciarContadorSesionAdmin() {
    // Limpiar contador anterior si existe
    if (window.contadorSesionAdmin) {
        clearInterval(window.contadorSesionAdmin);
    }

    window.contadorSesionAdmin = setInterval(() => {
        if (!pinValidado || !tiempoSesionAdmin) {
            clearInterval(window.contadorSesionAdmin);
            return;
        }

        const tiempoRestante = tiempoSesionAdmin - Date.now();

        if (tiempoRestante <= 0) {
            // Sesión expirada
            expirarSesionAdmin();
            clearInterval(window.contadorSesionAdmin);
        } else {
            // Actualizar contador visual
            const minutos = Math.floor(tiempoRestante / 60000);
            const segundos = Math.floor((tiempoRestante % 60000) / 1000);
            $('#tiempoRestante').text(`${minutos}:${segundos.toString().padStart(2, '0')}`);
        }
    }, 1000);
}

/**
 * ✅ FUNCIÓN: Expirar sesión admin
 */
function expirarSesionAdmin() {
    try {
        console.log('⏰ Sesión administrativa expirada');

        pinValidado = false;
        tiempoSesionAdmin = null;

        // Volver a bloquear
        aplicarBloqueoVisual();

        // Remover indicador de sesión
        $('#indicadorSesionAdmin').remove();

        // Mostrar notificación de expiración
        Swal.fire({
            title: '⏰ Sesión Expirada',
            text: 'Tu sesión administrativa ha expirado. Las funciones de modificación han sido bloqueadas nuevamente.',
            icon: 'warning',
            confirmButtonColor: '#ffc107',
            confirmButtonText: 'Entendido'
        });

    } catch (error) {
        console.error('❌ Error expirando sesión admin:', error);
    }
}

/**
 * ✅ FUNCIÓN: Extender sesión admin
 */
function extenderSesionAdmin() {
    if (pinValidado) {
        tiempoSesionAdmin = Date.now() + DURACION_SESION_ADMIN;
        mostrarExito('Sesión extendida por 30 minutos más');
        console.log('🔄 Sesión administrativa extendida');
    }
}

/**
 * ✅ FUNCIÓN: Cerrar sesión admin manualmente
 */
function cerrarSesionAdmin() {
    pinValidado = false;
    tiempoSesionAdmin = null;

    if (window.contadorSesionAdmin) {
        clearInterval(window.contadorSesionAdmin);
    }

    aplicarBloqueoVisual();
    $('#indicadorSesionAdmin').remove();

    mostrarInfo('Sesión administrativa cerrada. Inventario bloqueado nuevamente.');
    console.log('🔒 Sesión administrativa cerrada manualmente');
}

// ✅ HACER FUNCIONES GLOBALES
window.solicitarPinAdmin = solicitarPinAdmin;
window.extenderSesionAdmin = extenderSesionAdmin;
window.cerrarSesionAdmin = cerrarSesionAdmin;



/**
 * ✅ MONITOR DEL BADGE DE ESTADO PARA ACTIVAR BLOQUEO
 */
function iniciarMonitorBadgeEstado() {
    try {
        console.log('👁️ Iniciando monitor del badge de estado...');

        // ✅ BUSCAR EL BADGE DE ESTADO
        const selectorBadge = '.estado-inventario .badge, .badge.bg-success, .badge.bg-primary, span[class*="badge"]';

        // ✅ CREAR OBSERVER PARA DETECTAR CAMBIOS EN EL BADGE
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    verificarEstadoBadge();
                }
            });
        });

        // ✅ OBSERVAR CAMBIOS EN TODA LA SECCIÓN DEL HEADER
        const headerInventario = document.querySelector('.toma-header');
        if (headerInventario) {
            observer.observe(headerInventario, {
                childList: true,
                subtree: true,
                characterData: true
            });
            console.log('✅ Observer del badge configurado');
        }

        // ✅ VERIFICACIÓN INICIAL
        verificarEstadoBadge();

        // ✅ VERIFICACIÓN PERIÓDICA COMO RESPALDO
        setInterval(verificarEstadoBadge, 5000);

    } catch (error) {
        console.error('❌ Error iniciando monitor del badge:', error);
    }
}

/**
 * ✅ FUNCIÓN: Verificar estado del badge
 */
function verificarEstadoBadge() {
    try {
        // ✅ BUSCAR TODOS LOS BADGES POSIBLES
        const badges = document.querySelectorAll(`
            .estado-inventario .badge,
            .badge.bg-success,
            .badge.bg-primary,
            .toma-header .badge,
            span[class*="badge"]
        `);

        let estadoEncontrado = null;

        badges.forEach(badge => {
            const texto = badge.textContent.trim().toLowerCase();

            // ✅ DETECTAR DIFERENTES VARIACIONES DE "COMPLETADO"
            if (texto.includes('completado') ||
                texto.includes('finalizado') ||
                texto.includes('terminado') ||
                texto.includes('completo')) {

                estadoEncontrado = texto;
                console.log(`🎯 Badge de estado detectado: "${texto}"`);

                // ✅ SI NO ESTÁ BLOQUEADO AÚN, ACTIVAR BLOQUEO
                if (!inventarioBloqueado) {
                    console.log('🔒 Activando bloqueo por badge "Completado"');
                    setTimeout(() => {
                        activarBloqueoInventario();
                    }, 1000); // Pequeño delay para que se complete la UI
                }
            }
        });

        // ✅ DEBUG: Mostrar todos los badges encontrados
        if (badges.length > 0) {
            console.log('🔍 Badges encontrados:', Array.from(badges).map(b => b.textContent.trim()));
        }

        return estadoEncontrado;

    } catch (error) {
        console.error('❌ Error verificando estado del badge:', error);
        return null;
    }
}

/**
 * ✅ FUNCIÓN: Buscar badge en todo el documento (respaldo)
 */
function buscarBadgeCompletadoEnTodoElDocumento() {
    try {
        const todosLosElementos = document.querySelectorAll('*');
        let elementosConCompletado = [];

        todosLosElementos.forEach(elemento => {
            const texto = elemento.textContent.trim().toLowerCase();
            if ((elemento.classList.contains('badge') ||
                elemento.tagName === 'SPAN' ||
                elemento.classList.contains('estado')) &&
                (texto.includes('completado') ||
                    texto.includes('finalizado'))) {

                elementosConCompletado.push({
                    elemento: elemento,
                    texto: texto,
                    clases: elemento.className
                });
            }
        });

        console.log('🔍 Elementos con "completado" encontrados:', elementosConCompletado);
        return elementosConCompletado;

    } catch (error) {
        console.error('❌ Error buscando badge en documento:', error);
        return [];
    }
}

/**
 * ✅ FUNCIÓN DE DEBUG: Encontrar el badge exacto
 */
window.debugBuscarBadge = function () {
    console.log('🔍 === DEBUG: BUSCANDO BADGE DE ESTADO ===');

    // Buscar por diferentes selectores
    const selectores = [
        '.estado-inventario .badge',
        '.badge.bg-success',
        '.badge.bg-primary',
        '.toma-header .badge',
        'span[class*="badge"]',
        '.badge',
        '[class*="estado"]'
    ];

    selectores.forEach(selector => {
        const elementos = document.querySelectorAll(selector);
        if (elementos.length > 0) {
            console.log(`✅ Selector "${selector}":`, Array.from(elementos).map(el => ({
                texto: el.textContent.trim(),
                clases: el.className
            })));
        }
    });

    // Búsqueda exhaustiva
    buscarBadgeCompletadoEnTodoElDocumento();

    return verificarEstadoBadge();
};
// =====================================
// INICIALIZACIÓN
// =====================================
$(document).ready(function () {
    console.log('🚀 === DEPURACIÓN: INICIALIZANDO EJECUTAR INVENTARIO ===');
    console.log('🚀 Document ready ejecutado');
    console.log('🚀 window.inventarioConfig:', window.inventarioConfig);
    console.log('🚀 URL actual:', window.location.href);

    // ✅ OBTENER ID DEL INVENTARIO DESDE LA CONFIGURACIÓN GLOBAL
    const inventarioId = window.inventarioConfig?.inventarioId || getInventarioIdFromUrl();

// ✅ FUNCIÓN PARA OBTENER ID DE LA URL
function getInventarioIdFromUrl() {
    try {
        console.log('🔍 Obteniendo ID del inventario desde URL...');
        const path = window.location.pathname;
        console.log('🔍 Path actual:', path);
        
        // Esperamos una URL como /TomaInventario/Ejecutar/123
        const pathParts = path.split('/');
        console.log('🔍 Partes del path:', pathParts);
        
        if (pathParts.length >= 4 && pathParts[1] === 'TomaInventario' && pathParts[2] === 'Ejecutar') {
            const id = parseInt(pathParts[3]);
            console.log('🔍 ID extraído:', id);
            return isNaN(id) ? null : id;
        }
        
        console.log('🔍 No se pudo extraer ID de la URL');
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo ID de URL:', error);
        return null;
    }
}

    console.log('🚀 ID obtenido de config:', window.inventarioConfig?.inventarioId);
    console.log('🚀 ID obtenido de URL:', getInventarioIdFromUrl());
    console.log('🚀 ID final seleccionado:', inventarioId);

    if (!inventarioId) {
        console.error('❌ No se pudo obtener el ID del inventario');
        console.log('📋 window.inventarioConfig:', window.inventarioConfig);
        console.log('📋 URL actual:', window.location.href);
        mostrarError('No se especificó un inventario válido');
        return;
    }

    console.log('✅ ID del inventario obtenido:', inventarioId);
    console.log('✅ Tipo del ID:', typeof inventarioId);

    // Inicializar la página
    console.log('🚀 Llamando a inicializarEjecutorInventario...');
    inicializarEjecutorInventario(inventarioId);

    // Configurar event listeners
    configurarEventListeners();
});

// =====================================
// FUNCIONES DE INICIALIZACIÓN
// =====================================

async function inicializarEjecutorInventario(inventarioId) {
    try {
        console.log(`📋 Inicializando ejecutor para inventario ID: ${inventarioId}`);

        // ✅ CARGAR PERMISOS ESPECÍFICOS PRIMERO
        await cargarPermisosInventarioActual(inventarioId);

        // ✅ CARGAR INFORMACIÓN DEL INVENTARIO
        await cargarInformacionInventario(inventarioId);

        // ✅ CAMBIO CRÍTICO: CARGAR AJUSTES PENDIENTES ANTES QUE PRODUCTOS
        console.log('🔄 Cargando ajustes pendientes ANTES que productos...');
        await cargarAjustesPendientes(inventarioId);

        // ✅ CARGAR ALERTAS DE MOVIMIENTOS POST-CORTE
        console.log('🔔 Cargando alertas de movimientos post-corte...');
        await cargarAlertasPostCorte();

        // ✅ AHORA SÍ CARGAR PRODUCTOS (ya con ajustes en memoria)
        console.log('📦 Cargando productos CON ajustes ya cargados...');
        await cargarProductosInventario(inventarioId);

        // ✅ ACTUALIZAR ESTADÍSTICAS
        await actualizarEstadisticas();

        // ✅ APLICAR CONTROL DE PERMISOS
        aplicarControlPermisos();

        // ✅ AUTO-REFRESH CADA 30 SEGUNDOS
        // ✅ CAMBIAR línea 71 por esto:
        setInterval(async () => {
            await actualizarEstadisticas();
            await cargarAjustesPendientes(inventarioId);
            await cargarAlertasPostCorte();
        }, 30000);
        console.log('✅ Ejecutor de inventario inicializado correctamente');
        // ✅ AGREGAR AL FINAL:
        // Iniciar monitor del badge de estado
        setTimeout(() => {
            iniciarMonitorBadgeEstado();
        }, 2000);

    } catch (error) {
        console.error('❌ Error inicializando ejecutor:', error);
        mostrarError('Error al cargar el inventario');
    }
}
/**
 * ✅ NUEVA FUNCIÓN: Actualizar panel de ajustes pendientes
 */
function actualizarPanelAjustesPendientes() {
    try {
        console.log('🔄 Actualizando panel de ajustes pendientes...');

        const totalAjustes = ajustesPendientes.length;
        // ✅ POR ESTAS LÍNEAS CORREGIDAS:
        const ajustesPorTipo = contarAjustesPorTipo();

        console.log('📊 Actualizando estadísticas del panel con:', ajustesPorTipo);

        // ✅ ACTUALIZAR ESTADÍSTICAS POR TIPO (IDs CORRECTOS)
        $('#totalEntradas').text(ajustesPorTipo.entradas || 0);
        $('#totalSalidas').text(ajustesPorTipo.salidas || 0);
        $('#totalAjustes').text(ajustesPorTipo.ajustes_sistema || 0);
        $('#totalCorrecciones').text(ajustesPorTipo.correcciones || 0);

        // ✅ MOSTRAR/OCULTAR PANEL
        if (totalAjustes > 0) {
            $('#ajustesPendientesPanel').show();
            llenarTablaAjustesPendientes();
        } else {
            $('#ajustesPendientesPanel').hide();
        }

        console.log(`✅ Panel actualizado: ${totalAjustes} ajustes pendientes`);

    } catch (error) {
        console.error('❌ Error actualizando panel de ajustes:', error);
    }
}

/**
 * ✅ FUNCIÓN CORREGIDA: Contar ajustes por tipo
 * REEMPLAZAR la función existente si la hay, o AGREGAR si no existe
 */
function contarAjustesPorTipo() {
    try {
        console.log('📊 Contando ajustes por tipo...');
        console.log('🔍 Ajustes pendientes:', ajustesPendientes);

        const contadores = {
            entradas: 0,           // Cuando aumenta el stock
            salidas: 0,            // Cuando disminuye el stock  
            ajustes_sistema: 0,    // Ajustes del tipo sistema_a_fisico
            correcciones: 0,       // Validaciones y reconteos
            total: ajustesPendientes.length
        };

        if (!ajustesPendientes || ajustesPendientes.length === 0) {
            console.log('⚠️ No hay ajustes pendientes para contar');
            return contadores;
        }

        ajustesPendientes.forEach(ajuste => {
            if (ajuste.estado !== 'Pendiente' && ajuste.estado !== 'pendiente') {
                return; // Solo contar ajustes pendientes
            }

            const diferencia = ajuste.cantidadFinalPropuesta - ajuste.cantidadSistemaOriginal;

            // ✅ CLASIFICAR POR TIPO DE AJUSTE
            switch (ajuste.tipoAjuste) {
                case 'sistema_a_fisico':
                    contadores.ajustes_sistema++;
                    // También clasificar si es entrada o salida
                    if (diferencia > 0) {
                        contadores.entradas++;
                    } else if (diferencia < 0) {
                        contadores.salidas++;
                    }
                    break;

                case 'validado':
                case 'reconteo':
                    contadores.correcciones++;
                    break;

                default:
                    // Para tipos no reconocidos, clasificar por diferencia
                    if (diferencia > 0) {
                        contadores.entradas++;
                    } else if (diferencia < 0) {
                        contadores.salidas++;
                    } else {
                        contadores.correcciones++;
                    }
                    break;
            }
        });

        console.log('✅ Contadores calculados:', contadores);
        return contadores;

    } catch (error) {
        console.error('❌ Error contando ajustes por tipo:', error);
        return {
            entradas: 0,
            salidas: 0,
            ajustes_sistema: 0,
            correcciones: 0,
            total: 0
        };
    }
}
/**
 * ✅ NUEVA FUNCIÓN: Llenar tabla de ajustes pendientes
 */
function llenarTablaAjustesPendientes() {
    try {
        const tbody = $('#tablaAjustesBody');
        tbody.empty();

        if (ajustesPendientes.length === 0) {
            $('#ajustesVacio').show();
            $('#tablaAjustes').hide();
            return;
        }

        $('#ajustesVacio').hide();
        $('#tablaAjustes').show();

        ajustesPendientes.forEach(ajuste => {
            const fila = crearFilaAjustePendiente(ajuste);
            tbody.append(fila);
        });

    } catch (error) {
        console.error('❌ Error llenando tabla de ajustes:', error);
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Crear fila de ajuste pendiente
 */
function crearFilaAjustePendiente(ajuste) {
    const diferencia = ajuste.cantidadFisicaContada - ajuste.cantidadSistemaOriginal;
    const diferenciaClass = diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : 'text-muted';
    const tipoTexto = obtenerTextoTipoAjuste(ajuste.tipoAjuste);
    const tipoBadgeClass = obtenerClaseBadgeTipo(ajuste.tipoAjuste);

    return $(`
        <tr data-ajuste-id="${ajuste.ajusteId}">
            <td>
                <div class="fw-semibold">${ajuste.nombreProducto || `Producto ${ajuste.productoId}`}</div>
                <small class="text-muted">ID: ${ajuste.productoId}</small>
            </td>
            <td class="text-center">
                <span class="badge bg-secondary">${ajuste.cantidadSistemaOriginal}</span>
            </td>
            <td class="text-center">
                <span class="badge bg-info">${ajuste.cantidadFisicaContada}</span>
            </td>
            <td class="text-center">
                <span class="fw-bold ${diferenciaClass}">
                    ${diferencia > 0 ? '+' : ''}${diferencia}
                </span>
            </td>
            <td class="text-center">
                <span class="badge ${tipoBadgeClass}">${tipoTexto}</span>
            </td>
            <td>
                <div class="small" style="max-width: 200px;">
                    ${ajuste.motivoAjuste}
                </div>
            </td>
            <td class="text-center">
                <span class="badge bg-primary">${ajuste.cantidadFinalPropuesta}</span>
            </td>
            <td class="text-center">
                <div class="btn-group-vertical btn-group-sm">
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="eliminarAjustePendiente(${ajuste.ajusteId})"
                            data-bs-toggle="tooltip"
                            title="Eliminar este ajuste">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-outline-info btn-sm" 
                            onclick="editarAjustePendiente(${ajuste.ajusteId})"
                            data-bs-toggle="tooltip"
                            title="Editar este ajuste">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </td>
        </tr>
    `);
}

/**
 * ✅ NUEVA FUNCIÓN: Obtener texto del tipo de ajuste
 */
function obtenerTextoTipoAjuste(tipo) {
    const tipos = {
        'sistema_a_fisico': '📦 Sistema→Físico',
        'validado': '✅ Validado'
    };
    return tipos[tipo] || tipo;
}
/**
 * ✅ NUEVA FUNCIÓN: Obtener clase de badge según tipo
 */
function obtenerClaseBadgeTipo(tipo) {
    const clases = {
        'sistema_a_fisico': 'bg-success',
        'validado': 'bg-info'
    };
    return clases[tipo] || 'bg-secondary';
}


/**
 * ✅ FUNCIÓN CORREGIDA: Editar ajuste pendiente
 */
async function editarAjustePendiente(ajusteId) {
    try {
        console.log('✏️ === ABRIENDO MODAL PARA EDITAR AJUSTE ===');
        console.log('✏️ Ajuste ID:', ajusteId);

        // ✅ BUSCAR EL AJUSTE EN LOS DATOS LOCALES
        const ajuste = ajustesPendientes.find(a => a.ajusteId === ajusteId);
        if (!ajuste) {
            mostrarError('Ajuste no encontrado en los datos locales');
            return;
        }

        // ✅ BUSCAR EL PRODUCTO RELACIONADO
        const producto = productosInventario.find(p => p.productoId === ajuste.productoId);
        if (!producto) {
            mostrarError('Producto relacionado no encontrado');
            return;
        }

        console.log('✏️ Configurando modal para EDITAR ajuste:', ajuste);

        // ✅ CONFIGURAR MODAL PARA MODO EDITAR
        configurarModalParaEditar(ajuste, producto);

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('ajustePendienteModal'));
        modal.show();

        console.log('✅ Modal de edición abierto exitosamente');

    } catch (error) {
        console.error('❌ Error abriendo modal de edición:', error);
        mostrarError('Error al abrir el modal de edición');
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Configurar modal para modo EDITAR
 */
function configurarModalParaEditar(ajuste, producto) {
    try {
        console.log('🔧 Configurando modal para modo EDITAR');

        // ✅ LIMPIAR TODOS LOS EVENT LISTENERS ANTERIORES
        $('#guardarAjustePendienteBtn').off('click');
        $('#ajustePendienteModal').off('hidden.bs.modal.modo');

        // ✅ CONFIGURAR TÍTULO PARA EDITAR
        $('#ajustePendienteModalLabel').html(`
            <i class="bi bi-pencil-square me-2"></i>
            Editar Ajuste Pendiente
        `);

        // ✅ CONFIGURAR TEXTO DEL BOTÓN PARA EDITAR
        $('#guardarAjustePendienteBtn').find('.normal-state').html(`
            <i class="bi bi-check-lg me-2"></i>Actualizar Ajuste Pendiente
        `);

        // ✅ LLENAR INFORMACIÓN DEL PRODUCTO
        $('#productoIdAjustePendiente').val(ajuste.productoId);
        $('#inventarioIdAjustePendiente').val(ajuste.inventarioProgramadoId);
        $('#nombreProductoAjustePendiente').text(ajuste.nombreProducto || producto.nombreProducto || 'Sin nombre');
        $('#stockSistemaAjustePendiente').text(ajuste.cantidadSistemaOriginal);
        $('#stockFisicoAjustePendiente').text(ajuste.cantidadFisicaContada);

        // ✅ MOSTRAR DISCREPANCIA
        const diferencia = ajuste.cantidadFisicaContada - ajuste.cantidadSistemaOriginal;
        const $discrepancia = $('#discrepanciaAjustePendiente');
        $discrepancia.text(diferencia > 0 ? `+${diferencia}` : diferencia);

        if (diferencia > 0) {
            $discrepancia.removeClass('text-danger').addClass('text-success');
        } else if (diferencia < 0) {
            $discrepancia.removeClass('text-success').addClass('text-danger');
        } else {
            $discrepancia.removeClass('text-success text-danger').addClass('text-muted');
        }

        // ✅ PRE-LLENAR FORMULARIO CON DATOS EXISTENTES
        $('#tipoAjustePendiente').val(ajuste.tipoAjuste);
        $('#cantidadFinalPropuesta').val(ajuste.cantidadFinalPropuesta);
        $('#motivoAjustePendiente').val(ajuste.motivoAjuste);

        // ✅ ACTUALIZAR VISTA PREVIA
        actualizarVistaPreviaAjustePendiente(producto);

        // ✅ CONFIGURAR EVENT LISTENER ESPECÍFICO PARA EDITAR
        $('#guardarAjustePendienteBtn').on('click.editar', function (e) {
            e.preventDefault();
            console.log('🖱️ Click en botón ACTUALIZAR ajuste pendiente');
            actualizarAjustePendiente(ajuste.ajusteId);
        });

        // ✅ CONFIGURAR LIMPIEZA AL CERRAR
        $('#ajustePendienteModal').on('hidden.bs.modal.modo', function () {
            limpiarModalAjustePendiente();
        });

        // ✅ CONFIGURAR VISTA PREVIA
        configurarEventListenersModalAjustePendiente(producto);

        console.log('✅ Modal configurado correctamente para modo EDITAR');

    } catch (error) {
        console.error('❌ Error configurando modal para editar:', error);
    }
}


/**
 * ✅ FUNCIÓN ACTUALIZADA: Eliminar ajuste pendiente (ya existe, pero mejorada)
 */
async function eliminarAjustePendiente(ajusteId) {
    try {
        const ajuste = ajustesPendientes.find(a => a.ajusteId === ajusteId);
        if (!ajuste) {
            mostrarError('Ajuste no encontrado');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '¿Eliminar ajuste pendiente?',
            html: `
                <div class="text-start">
                    <strong>Producto:</strong> ${ajuste.nombreProducto}<br>
                    <strong>Tipo:</strong> ${obtenerTextoTipoAjuste(ajuste.tipoAjuste)}<br>
                    <strong>Cantidad Final:</strong> ${ajuste.cantidadFinalPropuesta}<br><br>
                    <small class="text-muted">Esta acción no se puede deshacer</small>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        // Llamar a la API para eliminar
        const response = await fetch(`/TomaInventario/EliminarAjustePendiente/${ajusteId}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito('Ajuste eliminado exitosamente');

            // ✅ ACTUALIZAR DATOS LOCALES
            const index = ajustesPendientes.findIndex(a => a.ajusteId === ajusteId);
            if (index > -1) {
                ajustesPendientes.splice(index, 1);
            }

            // ✅ ACTUALIZAR UI
            actualizarPanelAjustesPendientes();
            await cargarProductosInventario(window.inventarioConfig.inventarioId);

        } else {
            mostrarError(resultado.message || 'Error al eliminar ajuste');
        }

    } catch (error) {
        console.error('❌ Error eliminando ajuste:', error);
        mostrarError('Error al eliminar ajuste pendiente');
    }
}


/**
 * ✅ FUNCIÓN CORREGIDA: Mostrar paneles según permisos específicos
 */
function mostrarPanelesSegunProgreso() {
    console.log('🔍 === DEBUG: VERIFICANDO PANELES ===');

    const stats = estadisticasActuales;
    console.log('📊 Estadísticas actuales:', stats);
    console.log('🔄 Ajustes pendientes:', ajustesPendientes.length);
    console.log('🔒 Permisos inventario actual:', permisosInventarioActual);

    // ✅ MOSTRAR PANEL DE AJUSTES SI HAY DISCREPANCIAS O AJUSTES PENDIENTES
    if ((stats.discrepancias && stats.discrepancias > 0) || ajustesPendientes.length > 0) {
        console.log('✅ Mostrando panel de ajustes pendientes');
        $('#ajustesPendientesPanel').show();
        actualizarPanelAjustesPendientes();
    } else {
        console.log('❌ Ocultando panel de ajustes pendientes');
        $('#ajustesPendientesPanel').hide();
    }

    // ✅ VERIFICAR CONDICIONES BÁSICAS
    const todoContado = stats.pendientes === 0;
    const hayProductos = stats.total > 0;
    const hayProductosContados = stats.contados > 0;
    const tienePermisosConteo = permisosInventarioActual.puedeContar || false;
    const tienePermisosValidacion = permisosInventarioActual.puedeValidar || false;
    const esAdmin = permisosInventarioActual.esAdmin || false;

    // ✅ DETERMINAR SI PUEDE MOSTRAR PANEL SEGÚN TIPO DE INVENTARIO
    const tipoInventario = inventarioActual?.tipoInventario || 'Completo';
    const esInventarioCompleto = tipoInventario === 'Completo';

    let puedeFinalizarPanel;
    if (esInventarioCompleto) {
        // Inventario Completo: requiere que TODO esté contado
        puedeFinalizarPanel = todoContado && hayProductos;
    } else {
        // Inventario Parcial/Cíclico: solo requiere al menos algo contado
        puedeFinalizarPanel = hayProductosContados && hayProductos;
    }

    console.log('🔍 === CONDICIONES BÁSICAS ===');
    console.log('📊 Todo contado:', todoContado, '(pendientes:', stats.pendientes, ')');
    console.log('📦 Hay productos:', hayProductos, '(total:', stats.total, ')');
    console.log('🔢 Productos contados:', stats.contados);
    console.log('📋 Tipo inventario:', tipoInventario);
    console.log('✅ Puede finalizar panel:', puedeFinalizarPanel);
    console.log('📝 Tiene permisos conteo:', tienePermisosConteo);
    console.log('✅ Tiene permisos validación:', tienePermisosValidacion);
    console.log('👑 Es admin:', esAdmin);

    // ✅ VERIFICAR SI LOS PANELES EXISTEN
    const panelFinalizacionExiste = document.getElementById('finalizacionPanel');
    const panelConteoCompletadoExiste = document.getElementById('conteoCompletadoPanel');

    console.log('🎛️ Panel finalización existe:', !!panelFinalizacionExiste);
    console.log('🎛️ Panel conteo completado existe:', !!panelConteoCompletadoExiste);

    if (puedeFinalizarPanel) {
        console.log('✅ === INVENTARIO LISTO PARA PROCESAR ===');

        // ✅ DECIDIR QUÉ PANEL MOSTRAR SEGÚN PERMISOS
        if (tienePermisosValidacion || esAdmin) {
            // 👑 USUARIOS CON PERMISOS DE VALIDACIÓN/ADMIN
            console.log('👑 Usuario puede finalizar inventario completo');

            if (panelFinalizacionExiste) {
                $('#finalizacionPanel').show();
                actualizarPanelFinalizacion();
                console.log('✅ Panel de finalización mostrado');
            }

            // Ocultar panel de conteo completado si existe
            if (panelConteoCompletadoExiste) {
                $('#conteoCompletadoPanel').hide();
            }

        } else if (tienePermisosConteo) {
            // 📝 USUARIOS SOLO CON PERMISOS DE CONTEO
            console.log('📝 Usuario solo puede notificar conteo completado');

            if (panelConteoCompletadoExiste) {
                $('#conteoCompletadoPanel').show();
                actualizarPanelConteoCompletado();
                console.log('✅ Panel de conteo completado mostrado');
            } else {
                console.warn('⚠️ Panel conteoCompletadoPanel no existe, creando dinámicamente...');
                crearPanelConteoCompletado();
            }

            // Ocultar panel de finalización
            if (panelFinalizacionExiste) {
                $('#finalizacionPanel').hide();
            }

        } else {
            // ❌ USUARIOS SIN PERMISOS
            console.log('❌ Usuario sin permisos suficientes');
            if (panelFinalizacionExiste) $('#finalizacionPanel').hide();
            if (panelConteoCompletadoExiste) $('#conteoCompletadoPanel').hide();
        }

    } else {
        console.log('❌ === INVENTARIO NO LISTO ===');

        // Ocultar ambos paneles
        if (panelFinalizacionExiste) $('#finalizacionPanel').hide();
        if (panelConteoCompletadoExiste) $('#conteoCompletadoPanel').hide();

        // ✅ MOSTRAR RAZÓN ESPECÍFICA
        if (esInventarioCompleto && !todoContado) {
            console.log('🚫 Razón: Inventario COMPLETO - Aún hay productos pendientes de contar');
        } else if (!esInventarioCompleto && !hayProductosContados) {
            console.log('🚫 Razón: Inventario PARCIAL/CÍCLICO - No has contado ningún producto aún');
        }
        if (!hayProductos) {
            console.log('🚫 Razón: No hay productos en el inventario');
        }
    }
    verificarEstadoBloqueo();
}

/**
 * ✅ FUNCIÓN NUEVA: Crear panel de conteo completado dinámicamente
 */
function crearPanelConteoCompletado() {
    try {
        console.log('🔨 Creando panel de conteo completado dinámicamente...');

        const panelHtml = `
            <div class="conteo-completado-panel mt-4" id="conteoCompletadoPanel">
                <div class="dashboard-card border-primary">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h3 class="mb-0">
                                <i class="bi bi-check-circle me-2"></i>
                                Conteo Completado
                            </h3>
                            <span class="badge bg-light text-primary">
                                <i class="bi bi-clipboard-check me-1"></i>
                                Listo para revisión
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-4 mb-4">
                            <div class="col-md-8">
                                <h5 class="text-primary mb-3">
                                    <i class="bi bi-clipboard-check me-2"></i>
                                    Has completado el conteo de productos
                                </h5>
                                <div class="row g-3">
                                    <div class="col-sm-6">
                                        <div class="d-flex justify-content-between">
                                            <span>📦 Total de productos:</span>
                                            <strong id="resumenTotalConteo">-</strong>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="d-flex justify-content-between">
                                            <span>✅ Productos contados:</span>
                                            <strong class="text-success" id="resumenProductosContadosConteo">-</strong>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="d-flex justify-content-between">
                                            <span>⚠️ Con discrepancias:</span>
                                            <strong class="text-warning" id="resumenDiscrepanciasConteo">-</strong>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <div class="d-flex justify-content-between">
                                            <span>📝 Tu progreso:</span>
                                            <strong class="text-primary" id="resumenProgresoConteo">100%</strong>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info mt-3">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <strong>¿Qué sigue?</strong> Un supervisor con permisos de validación 
                                    revisará las discrepancias y completará el inventario.
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="display-1 text-success mb-2">✅</div>
                                <h6 class="text-success">Conteo Completado</h6>
                                <p class="text-muted small">
                                    Completado el<br>
                                    <span id="fechaConteoCompletado">${new Date().toLocaleString()}</span>
                                </p>
                            </div>
                        </div>

                        <!-- Acciones disponibles -->
                        <div class="acciones-conteo-completado">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <button class="btn btn-outline-primary w-100" id="btnNotificarSupervisor">
                                        <i class="bi bi-bell me-2"></i>
                                        Notificar Supervisor
                                    </button>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-outline-info w-100" id="btnVerResumenConteo">
                                        <i class="bi bi-file-text me-2"></i>
                                        Ver Mi Resumen
                                    </button>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-outline-secondary w-100" id="btnVolverInventarios">
                                        <i class="bi bi-arrow-left me-2"></i>
                                        Salir del Inventario
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mt-3 text-center">
                                <small class="text-muted">
                                    <i class="bi bi-shield-check me-1"></i>
                                    No tienes permisos para finalizar el inventario completo
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar después del panel de productos
        $('.productos-panel').after(panelHtml);

        // Configurar event listeners
        configurarEventListenersPanelConteoCompletado();

        console.log('✅ Panel de conteo completado creado y configurado');

    } catch (error) {
        console.error('❌ Error creando panel de conteo completado:', error);
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Actualizar panel de conteo completado
 */
function actualizarPanelConteoCompletado() {
    try {
        const stats = estadisticasActuales;

        // Actualizar datos en el panel
        $('#resumenTotalConteo').text(stats.total || 0);
        $('#resumenProductosContadosConteo').text(stats.contados || 0);
        $('#resumenDiscrepanciasConteo').text(stats.discrepancias || 0);
        $('#resumenProgresoConteo').text(`${stats.porcentajeProgreso || 0}%`);

        console.log('✅ Panel de conteo completado actualizado');

    } catch (error) {
        console.error('❌ Error actualizando panel de conteo completado:', error);
    }
}

/**
 * ✅ FUNCIÓN: Notificar al supervisor que el conteo está completado
 */
async function notificarSupervisorConteoCompletado() {
    try {
        const inventarioId = window.inventarioConfig.inventarioId;
        
        console.log('📧 Notificando supervisor - conteo completado');

        // Mostrar confirmación
        const confirmacion = await Swal.fire({
            title: '📧 ¿Notificar Supervisor?',
            html: `
                <div class="text-center">
                    <i class="bi bi-envelope-check display-1 text-primary mb-3"></i>
                    <p>Se enviará una notificación al supervisor informando que has completado tu parte del conteo.</p>
                    <p class="text-muted">El supervisor será notificado para que pueda revisar y finalizar el inventario.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Notificar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        // Llamar al endpoint para notificar
        const response = await fetch(`/TomaInventario/NotificarConteoCompletado/${inventarioId}`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            // Mostrar éxito
            await Swal.fire({
                title: '✅ Notificación Enviada',
                text: 'El supervisor ha sido notificado de que completaste tu parte del conteo.',
                icon: 'success',
                confirmButtonColor: '#28a745',
                timer: 3000,
                timerProgressBar: true
            });

            // Deshabilitar el botón para evitar spam
            $('#btnNotificarSupervisor').prop('disabled', true)
                .removeClass('btn-primary')
                .addClass('btn-success')
                .html('<i class="bi bi-check-circle me-2"></i>Supervisor Notificado');

            console.log('✅ Supervisor notificado exitosamente');
        } else {
            throw new Error(resultado.message || 'Error al enviar notificación');
        }

    } catch (error) {
        console.error('❌ Error notificando supervisor:', error);
        
        Swal.fire({
            title: 'Error al Notificar',
            text: error.message || 'No se pudo enviar la notificación al supervisor',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Configurar event listeners del panel de conteo completado
 */
function configurarEventListenersPanelConteoCompletado() {
    try {
        // Botón notificar supervisor
        $('#btnNotificarSupervisor').off('click').on('click', function () {
            notificarSupervisorConteoCompletado();  //ESTO FALTA DE TRABAJAR PARA ESA NOTIFICACION!.
        });

        // Botón ver resumen
        $('#btnVerResumenConteo').off('click').on('click', function () {
            verResumenConteoUsuario();
        });

        // Botón volver
        $('#btnVolverInventarios').off('click').on('click', function () {
            volverAInventarios();
        });

        console.log('✅ Event listeners configurados para panel de conteo completado');

    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}


/**
 * ✅ FUNCIÓN NUEVA: Ver resumen del conteo del usuario
 */
async function verResumenConteoUsuario() {
    try {
        const stats = estadisticasActuales;
        const productosConDiscrepancia = productosInventario.filter(p => p.tieneDiscrepancia);

        let htmlResumen = `
            <div class="text-start">
                <h5 class="text-primary mb-3">📊 Tu Resumen de Conteo</h5>
                
                <div class="row mb-3">
                    <div class="col-6"><strong>📦 Productos asignados:</strong></div>
                    <div class="col-6">${stats.total}</div>
                    
                    <div class="col-6"><strong>✅ Productos contados:</strong></div>
                    <div class="col-6 text-success">${stats.contados}</div>
                    
                    <div class="col-6"><strong>📈 Progreso completado:</strong></div>
                    <div class="col-6"><span class="badge bg-success">${stats.porcentajeProgreso}%</span></div>
                    
                    <div class="col-6"><strong>⚠️ Discrepancias encontradas:</strong></div>
                    <div class="col-6 text-warning">${stats.discrepancias}</div>
                </div>
        `;

        if (productosConDiscrepancia.length > 0) {
            htmlResumen += `
                <hr>
                <h6 class="text-warning">⚠️ Productos con Discrepancias:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Sistema</th>
                                <th class="text-center">Tu Conteo</th>
                                <th class="text-center">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosConDiscrepancia.map(p => `
                                <tr>
                                    <td>${p.nombreProducto}</td>
                                    <td class="text-center">${p.cantidadSistema}</td>
                                    <td class="text-center">${p.cantidadFisica}</td>
                                    <td class="text-center ${p.diferencia > 0 ? 'text-success' : 'text-danger'}">
                                        ${p.diferencia > 0 ? '+' : ''}${p.diferencia}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        htmlResumen += `
                <div class="alert alert-success mt-3">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>¡Excelente trabajo!</strong> Has completado exitosamente el conteo de todos los productos asignados.
                </div>
            </div>
        `;

        await Swal.fire({
            title: '📊 Tu Resumen de Conteo',
            html: htmlResumen,
            icon: 'info',
            confirmButtonColor: '#0dcaf0',
            confirmButtonText: 'Cerrar',
            width: '600px'
        });

    } catch (error) {
        console.error('❌ Error mostrando resumen:', error);
        mostrarError('Error al generar resumen');
    }
}

function configurarEventListeners() {
    // Filtro de búsqueda
    $('#filtroProductos').on('input', function () {
        const filtro = $(this).val().toLowerCase();
        filtrarProductos(filtro, $('#filtroEstado').val());
    });

    // Filtro por estado
    $('#filtroEstado').on('change', function () {
        const estadoFiltro = $(this).val();
        filtrarProductos($('#filtroProductos').val().toLowerCase(), estadoFiltro);
    });

    // Botón refrescar
    $('#btnRefrescar').on('click', function () {
        const inventarioId = inventarioActual?.inventarioProgramadoId;
        if (inventarioId) {
            cargarProductosInventario(inventarioId);
            actualizarEstadisticas();
        }
    });

    // Botón completar inventario
    $('#btnCompletarInventario').on('click', function () {
        mostrarModalCompletarInventario();
    });

    // Formulario de conteo
    $('#cantidadFisica').on('input', function () {
        calcularDiferencia();
    });

    // Guardar conteo
    $('#btnGuardarConteo').on('click', function () {
        guardarConteoProducto();
    });

    // Confirmar completar inventario
    $('#btnConfirmarCompletar').on('click', function () {
        completarInventario();
    });

    // Limpiar modal al cerrarse
    $('#modalConteo').on('hidden.bs.modal', function () {
        limpiarModalConteo();
    });
    // ✅ CONFIGURAR MODAL DE CONTEO
    $('#cantidadFisicaConteo').on('input', function () {
        calcularDiferencia();
    });

    // ✅ CONFIGURAR BOTÓN DE GUARDAR CONTEO
    $('#btnGuardarConteo').off('click').on('click', function (e) {
        e.preventDefault();
        console.log('🖱️ Click en botón guardar conteo');
        guardarConteoProducto();
    });

    // ✅ LIMPIAR MODAL AL CERRARSE
    $('#conteoModal').on('hidden.bs.modal', function () {
        limpiarModalConteo();
    });

    // ✅ CONFIGURAR MODAL DE AJUSTE DE STOCK
    $('#tipoAjusteInventario').on('change', function () {
        const tipoAjuste = $(this).val();
        const producto = productosInventario.find(p => p.productoId == $('#productoIdAjuste').val());

        if (tipoAjuste === 'ajustar-sistema') {
            $('#containerCantidadAjuste').show();
            $('#cantidadAjusteInventario').val(producto?.cantidadFisica || 0);
        } else {
            $('#containerCantidadAjuste').hide();
        }

        actualizarVistaPreviaAjuste();
    });

    $('#cantidadAjusteInventario, #tipoAjusteInventario').on('input change', function () {
        actualizarVistaPreviaAjuste();
    });

    // ✅ CONFIGURAR BOTÓN DE GUARDAR AJUSTE
    $('#guardarAjusteInventarioBtn').off('click').on('click', function (e) {
        e.preventDefault();
        console.log('🖱️ Click en botón guardar ajuste de inventario');
        // ✅ CAMBIO: Detectar si es finalización de inventario
        const esFinalización = $(this).data('es-finalizacion') === true;
        if (esFinalización) {
            finalizarInventarioConAjustes();
        } else {
            guardarAjusteInventario();
        }
    })





    /**
 * ✅ NUEVA FUNCIÓN: Finalizar inventario aplicando ajustes de stock
 */
    async function finalizarInventarioConAjustes() {
        try {
            console.log('🔥 EJECUTANDO: finalizarInventarioConAjustes');
            console.log('🏁 === FINALIZANDO INVENTARIO CON AJUSTES ===');

            const inventarioId = window.inventarioConfig.inventarioId;
            const totalAjustes = ajustesPendientes.filter(a => a.estado === 'Pendiente').length;

            // ✅ CONFIRMACIÓN ESPECÍFICA PARA FINALIZACIÓN CON AJUSTES
            const confirmacion = await Swal.fire({
                title: '🏁 ¿Finalizar inventario y aplicar ajustes?',
                html: `
                <div class="text-start">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>¡Atención!</strong> Esta acción aplicará TODOS los ajustes pendientes al stock del sistema.
                    </div>
                    <p><strong>Ajustes pendientes:</strong> ${totalAjustes}</p>
                    <p><strong>Inventario:</strong> Se marcará como completado</p>
                    <hr>
                    <small class="text-muted">Esta acción es <strong>irreversible</strong>.</small>
                </div>
            `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ffc107',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, finalizar y aplicar',
                cancelButtonText: 'Cancelar'
            });

            if (!confirmacion.isConfirmed) return;

            // ✅ LLAMAR AL ENDPOINT MODIFICADO DE AJUSTAR STOCK
            const ajusteData = {
                cantidad: 0, // No importa para finalización
                tipoAjuste: "ajuste",
                esFinalizacionInventario: true,
                inventarioProgramadoId: inventarioId
            };

            const response = await fetch(`/api/Inventario/productos/0/ajustar-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(ajusteData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();

            if (resultado.success) {
                mostrarExito(`¡Inventario finalizado! ${resultado.ajustesAplicados} ajustes aplicados al stock.`);

                // ✅ RECARGAR PÁGINA O REDIRIGIR
                setTimeout(() => {
                    window.location.href = '/Inventario/ProgramarInventario';
                }, 2000);
            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('❌ Error finalizando inventario:', error);
            mostrarError(`Error al finalizar inventario: ${error.message}`);
        }
    }


    // ✅ NUEVOS EVENT LISTENERS PARA AJUSTES PENDIENTES
    $('#tipoAjusteInventario').on('change', function () {
        const tipoAjuste = $(this).val();
        const producto = productosInventario.find(p => p.productoId == $('#productoIdAjuste').val());

        if (tipoAjuste === 'sistema_a_fisico') {
            $('#containerCantidadAjuste').show();
            $('#cantidadAjusteInventario').val(producto?.cantidadFisica || 0);
        } else {
            $('#containerCantidadAjuste').hide();
        }

        actualizarVistaPreviaAjuste();
    });

    $('#cantidadAjusteInventario, #tipoAjusteInventario').on('input change', function () {
        actualizarVistaPreviaAjuste();
    });

    $('#guardarAjusteInventarioBtn').off('click').on('click', function (e) {
        e.preventDefault();
        guardarAjustePendiente(); // ✅ NUEVO MÉTODO
    });

    // ✅ BOTÓN PARA VER AJUSTES PENDIENTES
    $('#btnVerAjustesPendientes').on('click', function () {
        mostrarModalAjustesPendientes();
    });

    // ✅ AGREGAR AL FINAL DE LA FUNCIÓN:

    // Event listeners para panel de ajustes pendientes
    $('#btnActualizarAjustes').on('click', async function () {
        const inventarioId = window.inventarioConfig.inventarioId;
        await cargarAjustesPendientes(inventarioId);
        actualizarPanelAjustesPendientes();
        mostrarExito('Ajustes pendientes actualizados');
    });

    $('#btnToggleAjustes').on('click', function () {
        const $contenido = $('#contenidoAjustesPendientes');
        const $icono = $(this).find('i');

        if ($contenido.is(':visible')) {
            $contenido.slideUp();
            $icono.removeClass('bi-chevron-up').addClass('bi-chevron-down');
            $(this).find('span').text('Mostrar');
        } else {
            $contenido.slideDown();
            $icono.removeClass('bi-chevron-down').addClass('bi-chevron-up');
            $(this).find('span').text('Ocultar');
        }
    });

    // Event listeners para panel de finalización
    $('#btnVerResumenCompleto').on('click', verResumenCompleto);
    $('#btnExportarInventario').on('click', () => exportarInventario(window.inventarioConfig.inventarioId));
    $('#btnFinalizarInventario').on('click', finalizarInventarioCompleto);

    configurarEventListenersFiltrado();
}

// =====================================
// FUNCIONES DE AJUSTES PENDIENTES
// =====================================

/**
 * ✅ NUEVA FUNCIÓN: Cargar ajustes pendientes del inventario
 */
async function cargarAjustesPendientes(inventarioId) {
    try {
        console.log('📋 Cargando ajustes pendientes...');

        const response = await fetch(`/TomaInventario/ObtenerAjustesPendientes/${inventarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('⚠️ No se pudieron cargar los ajustes pendientes');
            ajustesPendientes = [];
            return;
        }

        const data = await response.json();

        if (data.success && data.ajustes) {
            ajustesPendientes = data.ajustes;
            console.log(`✅ Cargados ${ajustesPendientes.length} ajustes pendientes`);

            // Actualizar indicador visual
            actualizarIndicadorAjustesPendientes();

            // ✅ AGREGAR ESTA LÍNEA:
            actualizarPanelAjustesPendientes();
        } else {
            ajustesPendientes = [];
        }

    } catch (error) {
        console.error('❌ Error cargando ajustes pendientes:', error);
        ajustesPendientes = [];
    }
}


/**
 * ✅ NUEVA FUNCIÓN: Actualizar indicador de ajustes pendientes
 */
function actualizarIndicadorAjustesPendientes() {
    const totalAjustes = ajustesPendientes.length;
    const ajustesPorAplicar = ajustesPendientes.filter(a => a.estado === 'Pendiente').length;

    // Actualizar badge en la UI
    if (totalAjustes > 0) {
        $('#indicadorAjustesPendientes').show().text(ajustesPorAplicar);
        $('#btnVerAjustesPendientes').removeClass('btn-outline-secondary').addClass('btn-warning');
    } else {
        $('#indicadorAjustesPendientes').hide();
        $('#btnVerAjustesPendientes').removeClass('btn-warning').addClass('btn-outline-secondary');
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Guardar ajuste pendiente (reemplaza el ajuste directo)
 */
async function guardarAjustePendiente() {
    try {
        console.log('💾 === GUARDANDO AJUSTE PENDIENTE ===');

        const productoId = $('#productoIdAjuste').val();
        const tipoAjuste = $('#tipoAjusteInventario').val();
        const motivo = $('#motivoAjusteInventario').val()?.trim();

        // ✅ VALIDACIONES
        if (!productoId || !tipoAjuste || !motivo) {
            mostrarError('Todos los campos son obligatorios');
            return;
        }

        if (motivo.length < 10) {
            mostrarError('El motivo debe tener al menos 10 caracteres');
            $('#motivoAjusteInventario').focus();
            return;
        }

        // ✅ OBTENER PRODUCTO
        const producto = productosInventario.find(p => p.productoId == productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        // ✅ MANEJAR ESTADO DEL BOTÓN
        const $btn = $('#guardarAjusteInventarioBtn');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        // ✅ CREAR SOLICITUD DE AJUSTE
        const solicitudAjuste = {
            inventarioProgramadoId: window.inventarioConfig.inventarioId,
            productoId: parseInt(productoId),
            tipoAjuste: tipoAjuste,
            cantidadSistemaOriginal: producto.cantidadSistema || 0,
            cantidadFisicaContada: producto.cantidadFisica || 0,
            cantidadFinalPropuesta: tipoAjuste === 'sistema_a_fisico' ?
                parseInt($('#cantidadAjusteInventario').val()) : null,
            motivoAjuste: motivo,
            usuarioId: window.inventarioConfig.usuarioId || 1
        };

        console.log('📤 Enviando solicitud de ajuste pendiente:', solicitudAjuste);

        // ✅ ENVIAR A LA API
        const response = await fetch('/TomaInventario/CrearAjustePendiente', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(solicitudAjuste)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito(`Ajuste pendiente registrado exitosamente. Tipo: ${resultado.tipoAjuste}`);

            // ✅ CERRAR MODAL
            const modal = bootstrap.Modal.getInstance(document.getElementById('ajusteStockInventarioModal'));
            if (modal) {
                modal.hide();
            }

            // ✅ RECARGAR DATOS
            await cargarAjustesPendientes(window.inventarioConfig.inventarioId);
            await cargarProductosInventario(window.inventarioConfig.inventarioId);
            await actualizarEstadisticasUI();

        } else {
            throw new Error(resultado.message || 'Error al registrar ajuste pendiente');
        }

    } catch (error) {
        console.error('❌ Error guardando ajuste pendiente:', error);
        mostrarError(`Error al guardar ajuste pendiente: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN
        const $btn = $('#guardarAjusteInventarioBtn');
        $btn.prop('disabled', false);
        $btn.find('.loading-state').hide();
        $btn.find('.normal-state').show();
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Mostrar modal con ajustes pendientes
 */
async function mostrarModalAjustesPendientes() {
    try {
        // Crear modal dinámicamente si no existe
        if (!document.getElementById('modalAjustesPendientes')) {
            crearModalAjustesPendientes();
        }

        // Llenar con datos
        const tbody = $('#tablaAjustesPendientes tbody');
        tbody.empty();

        if (ajustesPendientes.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-info-circle me-2"></i>
                        No hay ajustes pendientes para este inventario
                    </td>
                </tr>
            `);
        } else {
            ajustesPendientes.forEach(ajuste => {
                const fechaCreacion = new Date(ajuste.fechaCreacion).toLocaleString();
                const diferencia = ajuste.cantidadFisicaContada - ajuste.cantidadSistemaOriginal;

                tbody.append(`
                    <tr>
                        <td>${ajuste.nombreProducto}</td>
                        <td class="text-center">${ajuste.cantidadSistemaOriginal}</td>
                        <td class="text-center">${ajuste.cantidadFisicaContada}</td>
                        <td class="text-center ${diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : 'text-muted'}">
                            ${diferencia > 0 ? '+' : ''}${diferencia}
                        </td>
                        <td class="text-center">${ajuste.cantidadFinalPropuesta}</td>
                        <td>
                            <span class="badge ${ajuste.estado === 'Pendiente' ? 'bg-warning' : 'bg-success'}">
                                ${ajuste.estado}
                            </span>
                        </td>
                        <td class="text-center">
                            ${ajuste.estado === 'Pendiente' ?
                        `<button class="btn btn-sm btn-danger" onclick="eliminarAjustePendiente(${ajuste.ajusteId})">
                                    <i class="bi bi-trash"></i>
                                </button>` :
                        '<span class="text-muted">Aplicado</span>'
                    }
                        </td>
                    </tr>
                `);
            });
        }

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalAjustesPendientes'));
        modal.show();

    } catch (error) {
        console.error('❌ Error mostrando ajustes pendientes:', error);
        mostrarError('Error al cargar ajustes pendientes');
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Editar ajuste pendiente
 */
async function editarAjustePendiente(ajusteId) {
    try {
        console.log('✏️ === EDITANDO AJUSTE PENDIENTE ===');
        console.log('✏️ Ajuste ID:', ajusteId);

        // ✅ BUSCAR EL AJUSTE EN LOS DATOS LOCALES
        const ajuste = ajustesPendientes.find(a => a.ajusteId === ajusteId);
        if (!ajuste) {
            mostrarError('Ajuste no encontrado en los datos locales');
            return;
        }

        // ✅ BUSCAR EL PRODUCTO RELACIONADO
        const producto = productosInventario.find(p => p.productoId === ajuste.productoId);
        if (!producto) {
            mostrarError('Producto relacionado no encontrado');
            return;
        }

        console.log('✏️ Ajuste encontrado:', ajuste);
        console.log('✏️ Producto relacionado:', producto);

        // ✅ LLENAR EL MODAL CON DATOS DEL AJUSTE EXISTENTE
        $('#productoIdAjustePendiente').val(ajuste.productoId);
        $('#inventarioIdAjustePendiente').val(ajuste.inventarioProgramadoId);

        // ✅ INFORMACIÓN DEL PRODUCTO
        $('#nombreProductoAjustePendiente').text(ajuste.nombreProducto || producto.nombreProducto || 'Sin nombre');
        $('#stockSistemaAjustePendiente').text(ajuste.cantidadSistemaOriginal);
        $('#stockFisicoAjustePendiente').text(ajuste.cantidadFisicaContada);

        // ✅ MOSTRAR DISCREPANCIA
        const diferencia = ajuste.cantidadFisicaContada - ajuste.cantidadSistemaOriginal;
        const $discrepancia = $('#discrepanciaAjustePendiente');
        $discrepancia.text(diferencia > 0 ? `+${diferencia}` : diferencia);

        if (diferencia > 0) {
            $discrepancia.removeClass('text-danger').addClass('text-success');
        } else if (diferencia < 0) {
            $discrepancia.removeClass('text-success').addClass('text-danger');
        } else {
            $discrepancia.removeClass('text-success text-danger').addClass('text-muted');
        }

        // ✅ PRE-LLENAR FORMULARIO CON DATOS EXISTENTES
        $('#tipoAjustePendiente').val(ajuste.tipoAjuste);
        $('#cantidadFinalPropuesta').val(ajuste.cantidadFinalPropuesta);
        $('#motivoAjustePendiente').val(ajuste.motivoAjuste);

        // ✅ ACTUALIZAR VISTA PREVIA
        actualizarVistaPreviaAjustePendiente(producto);

        // ✅ CAMBIAR TÍTULO DEL MODAL PARA INDICAR EDICIÓN
        $('#ajustePendienteModalLabel').html(`
            <i class="bi bi-pencil-square me-2"></i>
            Editar Ajuste Pendiente
        `);

        // ✅ CAMBIAR TEXTO DEL BOTÓN
        $('#guardarAjustePendienteBtn').find('.normal-state').html(`
            <i class="bi bi-check-lg me-2"></i>Actualizar Ajuste Pendiente
        `);

        // ✅ CONFIGURAR EVENTO ESPECIAL PARA EDICIÓN
        $('#guardarAjustePendienteBtn').off('click.editar').on('click.editar', function (e) {
            e.preventDefault();
            actualizarAjustePendiente(ajusteId);
        });

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('ajustePendienteModal'));
        modal.show();

        // ✅ LIMPIAR AL CERRAR MODAL
        $('#ajustePendienteModal').one('hidden.bs.modal', function () {
            restaurarModalAjusteParaCreacion();
        });

        console.log('✅ Modal de edición abierto exitosamente');

    } catch (error) {
        console.error('❌ Error abriendo modal de edición:', error);
        mostrarError('Error al abrir el modal de edición');
    }
}

/**
 * ✅ FUNCIÓN ACTUALIZADA: Actualizar ajuste pendiente usando endpoint real
 */
async function actualizarAjustePendiente(ajusteId) {
    try {
        console.log('💾 === ACTUALIZANDO AJUSTE PENDIENTE (ENDPOINT REAL) ===');
        console.log('💾 Ajuste ID:', ajusteId);

        const productoId = $('#productoIdAjustePendiente').val();
        const inventarioId = $('#inventarioIdAjustePendiente').val();
        const tipoAjuste = $('#tipoAjustePendiente').val();
        const cantidadFinalPropuesta = parseInt($('#cantidadFinalPropuesta').val());
        const motivo = $('#motivoAjustePendiente').val()?.trim();

        // ✅ VALIDACIONES
        if (!productoId || !inventarioId || !tipoAjuste || !motivo) {
            mostrarError('Todos los campos son obligatorios');
            return;
        }

        if (motivo.length < 10) {
            mostrarError('El motivo debe tener al menos 10 caracteres');
            $('#motivoAjustePendiente').focus();
            return;
        }

        if (isNaN(cantidadFinalPropuesta) || cantidadFinalPropuesta < 0) {
            mostrarError('La cantidad final propuesta debe ser un número válido mayor o igual a 0');
            return;
        }

        // ✅ BUSCAR AJUSTE Y PRODUCTO
        const ajusteOriginal = ajustesPendientes.find(a => a.ajusteId === ajusteId);
        const producto = productosInventario.find(p => p.productoId == productoId);

        if (!ajusteOriginal || !producto) {
            mostrarError('No se encontraron los datos necesarios para la actualización');
            return;
        }

        // ✅ VERIFICAR SI HAY CAMBIOS
        const hayTipoCambio = ajusteOriginal.tipoAjuste !== tipoAjuste;
        const hayCantidadCambio = ajusteOriginal.cantidadFinalPropuesta !== cantidadFinalPropuesta;
        const hayMotivoCambio = ajusteOriginal.motivoAjuste !== motivo;

        if (!hayTipoCambio && !hayCantidadCambio && !hayMotivoCambio) {
            mostrarInfo('No se detectaron cambios en el ajuste. No es necesario actualizar.');
            return;
        }

        // ✅ MOSTRAR RESUMEN DE CAMBIOS
        let cambiosHtml = '<div class="text-start"><h6 class="text-primary mb-3">📝 Cambios detectados:</h6>';

        if (hayTipoCambio) {
            cambiosHtml += `
                <div class="row mb-2">
                    <div class="col-4"><strong>Tipo:</strong></div>
                    <div class="col-8">
                        <span class="badge bg-secondary">${obtenerTextoTipoAjuste(ajusteOriginal.tipoAjuste)}</span>
                        <i class="bi bi-arrow-right mx-2"></i>
                        <span class="badge ${obtenerClaseBadgeTipo(tipoAjuste)}">${obtenerTextoTipoAjuste(tipoAjuste)}</span>
                    </div>
                </div>
            `;
        }

        if (hayCantidadCambio) {
            cambiosHtml += `
                <div class="row mb-2">
                    <div class="col-4"><strong>Cantidad Final:</strong></div>
                    <div class="col-8">
                        <span class="badge bg-secondary">${ajusteOriginal.cantidadFinalPropuesta}</span>
                        <i class="bi bi-arrow-right mx-2"></i>
                        <span class="badge bg-primary">${cantidadFinalPropuesta}</span>
                    </div>
                </div>
            `;
        }

        if (hayMotivoCambio) {
            cambiosHtml += `
                <div class="row mb-3">
                    <div class="col-4"><strong>Motivo:</strong></div>
                    <div class="col-8">
                        <small class="text-muted d-block">Anterior: "${ajusteOriginal.motivoAjuste}"</small>
                        <small class="text-primary d-block">Nuevo: "${motivo}"</small>
                    </div>
                </div>
            `;
        }

        cambiosHtml += '</div>';

        // ✅ CONFIRMACIÓN DE ACTUALIZACIÓN
        const confirmacion = await Swal.fire({
            title: '📝 ¿Actualizar ajuste pendiente?',
            html: cambiosHtml,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0dcaf0',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Sí, actualizar',
            cancelButtonText: '<i class="bi bi-x-lg me-1"></i> Cancelar',
            width: '600px'
        });

        if (!confirmacion.isConfirmed) return;

        // ✅ MANEJAR ESTADO DEL BOTÓN
        const $btn = $('#guardarAjustePendienteBtn');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        // ✅ CREAR SOLICITUD DE ACTUALIZACIÓN
        const solicitudActualizacion = {
            inventarioProgramadoId: parseInt(inventarioId),
            productoId: parseInt(productoId),
            tipoAjuste: tipoAjuste,
            cantidadSistemaOriginal: producto.cantidadSistema || 0,
            cantidadFisicaContada: producto.cantidadFisica || 0,
            cantidadFinalPropuesta: cantidadFinalPropuesta,
            motivoAjuste: motivo,
            usuarioId: window.inventarioConfig.usuarioId || 1
        };

        console.log('📤 Enviando actualización real:', solicitudActualizacion);

        // ✅ USAR ENDPOINT REAL DE ACTUALIZACIÓN
        const response = await fetch(`/TomaInventario/ActualizarAjustePendiente/${ajusteId}`, {
            method: 'PUT',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(solicitudActualizacion)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            // ✅ ACTUALIZAR DATOS LOCALES
            const index = ajustesPendientes.findIndex(a => a.ajusteId === ajusteId);
            if (index > -1) {
                ajustesPendientes[index] = {
                    ...ajusteOriginal,
                    tipoAjuste: tipoAjuste,
                    cantidadFinalPropuesta: cantidadFinalPropuesta,
                    motivoAjuste: motivo
                };
                console.log('✅ Datos locales actualizados');
            }

            // ✅ ÉXITO
            mostrarExito(`Ajuste pendiente actualizado exitosamente para ${producto.nombreProducto}`);

            // ✅ CERRAR MODAL
            const modal = bootstrap.Modal.getInstance(document.getElementById('ajustePendienteModal'));
            if (modal) {
                modal.hide();
            }

            // ✅ RECARGAR DATOS
            await cargarAjustesPendientes(inventarioId);
            await cargarProductosInventario(inventarioId);
            await actualizarEstadisticasUI();

            console.log('🎉 Ajuste actualizado exitosamente usando endpoint real');

        } else {
            throw new Error(resultado.message || 'Error al actualizar ajuste pendiente');
        }

    } catch (error) {
        console.error('❌ Error actualizando ajuste:', error);
        mostrarError(`Error al actualizar ajuste: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN
        const $btn = $('#guardarAjustePendienteBtn');
        $btn.prop('disabled', false);
        $btn.find('.loading-state').hide();
        $btn.find('.normal-state').show();
    }
}

/**
 * ✅ SISTEMA DE PERMISOS GRANULAR PARA INVENTARIOS
 */

/**
 * ✅ FUNCIÓN DE DEPURACIÓN: Mostrar estado actual de permisos
 */
function mostrarEstadoPermisos() {
    console.log('🔍 === ESTADO ACTUAL DE PERMISOS ===');
    console.log('🔍 Configuración global:', window.inventarioConfig?.permisos);
    console.log('🔍 Permisos inventario actual:', permisosInventarioActual);
    console.log('🔍 Usuario ID:', window.inventarioConfig?.usuarioId);
    console.log('🔍 Inventario ID:', window.inventarioConfig?.inventarioId);
    
    // ✅ MOSTRAR EN CONSOLA Y TAMBIÉN EN UI PARA DEPURACIÓN
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '🔍 Estado de Permisos',
            html: `
                <div class="text-start">
                    <p><strong>Usuario ID:</strong> ${window.inventarioConfig?.usuarioId || 'No definido'}</p>
                    <p><strong>Es Admin (Global):</strong> ${window.inventarioConfig?.permisos?.esAdmin ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Es Admin (Actual):</strong> ${permisosInventarioActual.esAdmin ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Puede Contar:</strong> ${permisosInventarioActual.puedeContar ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Puede Ajustar:</strong> ${permisosInventarioActual.puedeAjustar ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Puede Validar:</strong> ${permisosInventarioActual.puedeValidar ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Puede Completar:</strong> ${permisosInventarioActual.puedeCompletar ? '✅ Sí' : '❌ No'}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar'
        });
    }
}

// Variable global para almacenar los permisos específicos del usuario en este inventario
let permisosInventarioActual = {
    puedeContar: false,
    puedeAjustar: false,
    puedeValidar: false,
    esAdmin: false,
    usuarioId: null
};

/**
 * ✅ FUNCIÓN NUEVA: Obtener y verificar permisos específicos del inventario
 */
async function cargarPermisosInventarioActual(inventarioId) {
    try {
        console.log('🔒 === CARGANDO PERMISOS ESPECÍFICOS DEL INVENTARIO ===');
        console.log('🔒 Inventario ID:', inventarioId);

        const usuarioId = window.inventarioConfig?.usuarioId || ObtenerIdUsuarioActual();
        console.log('🔒 Usuario ID:', usuarioId);

        // ✅ VERIFICAR SI ES ADMINISTRADOR (VERIFICACIÓN ESTRICTA)
        const esAdmin = await verificarEsAdministrador();
        console.log('🔐 Resultado verificación admin:', esAdmin);

        if (esAdmin) {
            // ✅ ADMIN TIENE TODOS LOS PERMISOS PERO VERIFICAMOS TAMBIÉN ASIGNACIÓN AL INVENTARIO
            console.log('👑 Usuario detectado como administrador');
            
            // ✅ VERIFICAR TAMBIÉN QUE TENGA ACCESO AL INVENTARIO ESPECÍFICO
            try {
                const responseAcceso = await fetch(`/TomaInventario/VerificarAccesoInventario/${inventarioId}`, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (responseAcceso.ok) {
                    const resultadoAcceso = await responseAcceso.json();
                    if (resultadoAcceso.tieneAcceso) {
                        permisosInventarioActual = {
                            puedeContar: true,
                            puedeAjustar: true,
                            puedeValidar: true,
                            puedeCompletar: true,
                            esAdmin: true,
                            usuarioId: usuarioId
                        };
                        console.log('✅ Admin con acceso al inventario - Todos los permisos concedidos');
                        return permisosInventarioActual;
                    } else {
                        console.warn('⚠️ Admin sin acceso específico al inventario');
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error verificando acceso de admin al inventario:', error);
            }
        }

        // ✅ OBTENER PERMISOS ESPECÍFICOS DEL INVENTARIO
        const response = await fetch(`/TomaInventario/ObtenerPermisosUsuario/${inventarioId}/${usuarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            const resultado = await response.json();

            if (resultado.success) {
                permisosInventarioActual = {
                    puedeContar: resultado.permisos.permisoConteo || false,
                    puedeAjustar: resultado.permisos.permisoAjuste || false,
                    puedeValidar: resultado.permisos.permisoValidacion || false,
                    puedeCompletar: resultado.permisos.permisoCompletar || false, // ← AGREGAR ESTA LÍNEA
                    esAdmin: false,
                    usuarioId: usuarioId
                };
                console.log('✅ Permisos específicos cargados:', permisosInventarioActual);
            } else {
                // Sin permisos específicos
                permisosInventarioActual = {
                    puedeContar: false,
                    puedeAjustar: false,
                    puedeValidar: false,
                    esAdmin: false,
                    usuarioId: usuarioId
                };

                console.log('⚠️ Usuario sin permisos específicos en este inventario');
            }
        } else {
            console.warn('⚠️ No se pudieron obtener permisos específicos, usando configuración global');

            // Fallback a configuración global
            const configGlobal = window.inventarioConfig?.permisos || {};
            permisosInventarioActual = {
                puedeContar: configGlobal.puedeContar || false,
                puedeAjustar: configGlobal.puedeAjustar || false,
                puedeValidar: configGlobal.puedeValidar || false,
                puedeCompletar: configGlobal.puedeCompletar || false,
                esAdmin: configGlobal.esAdmin || false,
                usuarioId: usuarioId
            };
        }

        return permisosInventarioActual;

    } catch (error) {
        console.error('❌ Error cargando permisos del inventario:', error);

        // Permisos por defecto (sin acceso)
        permisosInventarioActual = {
            puedeContar: false,
            puedeAjustar: false,
            puedeValidar: false,
            esAdmin: false,
            usuarioId: ObtenerIdUsuarioActual()
        };

        return permisosInventarioActual;
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Verificar si el usuario es administrador (MEJORADA)
 */
async function verificarEsAdministrador() {
    try {
        console.log('🔐 === VERIFICANDO PERMISOS DE ADMINISTRADOR ===');
        
        // ✅ PASO 1: Verificar configuración local primero
        const configLocal = window.inventarioConfig?.permisos?.esAdmin || false;
        console.log('🔐 Configuración local esAdmin:', configLocal);
        
        // ✅ PASO 2: Verificar contra el servidor para confirmar
        try {
            const response = await fetch('/api/permisos/verificar-admin', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const resultado = await response.json();
                const esAdminServidor = resultado.esAdmin || false;
                
                console.log('🔐 Verificación servidor esAdmin:', esAdminServidor);
                
                // ✅ DEBE COINCIDIR TANTO LOCAL COMO SERVIDOR
                const esAdminFinal = configLocal && esAdminServidor;
                console.log('🔐 Resultado final esAdmin:', esAdminFinal);
                
                return esAdminFinal;
            } else {
                console.warn('⚠️ No se pudo verificar con servidor, usando configuración local');
                return configLocal;
            }
        } catch (serverError) {
            console.warn('⚠️ Error consultando servidor, usando configuración local:', serverError);
            return configLocal;
        }
        
    } catch (error) {
        console.error('❌ Error verificando permisos de administrador:', error);
        return false;
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Verificar permiso específico con mensaje de error
 */
function verificarPermisoEspecifico(tipoPermiso, accion = '') {
    let tienePermiso = false;
    let mensajeError = '';

    switch (tipoPermiso) {
        case 'conteo':
            tienePermiso = permisosInventarioActual.puedeContar || permisosInventarioActual.esAdmin;
            mensajeError = 'No tienes permisos para realizar conteos en este inventario.';
            break;

        case 'ajuste':
            tienePermiso = permisosInventarioActual.puedeAjustar || permisosInventarioActual.esAdmin;
            mensajeError = 'No tienes permisos para crear ajustes en este inventario.';
            break;

        case 'validacion':
            tienePermiso = permisosInventarioActual.puedeValidar || permisosInventarioActual.esAdmin;
            mensajeError = 'No tienes permisos para validar discrepancias en este inventario.';
            break;

        // ✅ AGREGAR ESTE NUEVO CASO:
        case 'completar':
            tienePermiso = permisosInventarioActual.puedeCompletar || permisosInventarioActual.esAdmin;
            mensajeError = 'No tienes permisos para completar inventarios.';
            break;

        case 'admin':
            tienePermiso = permisosInventarioActual.esAdmin;
            mensajeError = 'Solo los administradores pueden realizar esta acción.';
            break;

        default:
            mensajeError = 'Permiso no reconocido.';
    }

    if (!tienePermiso && accion) {
        console.warn(`🚫 Permiso denegado para ${tipoPermiso}: ${accion}`);
    }

    return {
        tienePermiso: tienePermiso,
        mensaje: mensajeError
    };
}

/**
 * ✅ FUNCIÓN NUEVA: Mostrar/ocultar elementos según permisos
 */
function aplicarControlPermisos() {
    try {
        console.log('🔒 Aplicando control de permisos en la interfaz...');

        // ✅ BOTONES DE CONTEO
        const botonesConteo = document.querySelectorAll('.btn-contar, .btn-conteo');
        botonesConteo.forEach(btn => {
            if (permisosInventarioActual.puedeContar || permisosInventarioActual.esAdmin) {
                btn.style.display = 'inline-block';
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
            }
        });

        // ✅ BOTONES DE AJUSTE
        const botonesAjuste = document.querySelectorAll('.btn-ajustar, .btn-ajuste, .btn-ajuste-pendiente');
        botonesAjuste.forEach(btn => {
            if (permisosInventarioActual.puedeAjustar || permisosInventarioActual.esAdmin) {
                btn.style.display = 'inline-block';
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
            }
        });

        // ✅ BOTONES DE VALIDACIÓN
        const botonesValidacion = document.querySelectorAll('.btn-validar, .btn-validacion');
        botonesValidacion.forEach(btn => {
            if (permisosInventarioActual.puedeValidar || permisosInventarioActual.esAdmin) {
                btn.style.display = 'inline-block';
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
            }
        });

     

        // ✅ PANEL DE FINALIZACIÓN (SOLO ADMINS O VALIDADORES)
        const panelFinalizacion = document.getElementById('finalizacionPanel');
        if (panelFinalizacion) {
            if (permisosInventarioActual.esAdmin || permisosInventarioActual.puedeValidar) {
                // Se mostrará cuando esté listo
            } else {
                panelFinalizacion.style.display = 'none';
            }
        }

        // ✅ MOSTRAR INFORMACIÓN DE PERMISOS EN LA UI
        mostrarInfoPermisos();

        console.log('✅ Control de permisos aplicado correctamente');

    } catch (error) {
        console.error('❌ Error aplicando control de permisos:', error);
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Mostrar información de permisos en la UI
 */
function mostrarInfoPermisos() {
    try {
        const permisosInfo = [];

        if (permisosInventarioActual.esAdmin) {
            permisosInfo.push('👑 Administrador');
        } else {
            if (permisosInventarioActual.puedeContar) permisosInfo.push('📝 Conteo');
            if (permisosInventarioActual.puedeAjustar) permisosInfo.push('🔧 Ajustes');
            if (permisosInventarioActual.puedeValidar) permisosInfo.push('✅ Validación');
            if (permisosInventarioActual.puedeCompletar) permisosInfo.push('🏁 Completar');
        }

        if (permisosInfo.length === 0) {
            permisosInfo.push('👁️ Solo lectura');
        }

        // Crear o actualizar badge de permisos
        let badgePermisos = document.getElementById('badgePermisosUsuario');
        if (!badgePermisos) {
            badgePermisos = document.createElement('div');
            badgePermisos.id = 'badgePermisosUsuario';
            badgePermisos.className = 'badge bg-info ms-2';

            // Insertarlo en el header
            const header = document.querySelector('.toma-header h1');
            if (header) {
                header.appendChild(badgePermisos);
            }
        }

        badgePermisos.innerHTML = `
            <i class="bi bi-person-badge me-1"></i>
            ${permisosInfo.join(' • ')}
        `;

        console.log('✅ Info de permisos mostrada:', permisosInfo.join(', '));

    } catch (error) {
        console.error('❌ Error mostrando info de permisos:', error);
    }
}


/**
 * ✅ FUNCIÓN AUXILIAR: Restaurar modal para creación
 */
function restaurarModalAjusteParaCreacion() {
    try {
        // ✅ RESTAURAR TÍTULO ORIGINAL
        $('#ajustePendienteModalLabel').html(`
            <i class="bi bi-clock-history me-2"></i>
            Registrar Ajuste Pendiente
        `);

        // ✅ RESTAURAR TEXTO DEL BOTÓN
        $('#guardarAjustePendienteBtn').find('.normal-state').html(`
            <i class="bi bi-clock-history me-2"></i>Registrar Ajuste Pendiente
        `);

        // ✅ REMOVER EVENTOS DE EDICIÓN
        $('#guardarAjustePendienteBtn').off('click.editar');

        // ✅ RESTAURAR EVENTO ORIGINAL
        $('#guardarAjustePendienteBtn').off('click.ajustePendiente').on('click.ajustePendiente', function (e) {
            e.preventDefault();
            guardarNuevoAjustePendiente();
        });

        console.log('✅ Modal restaurado para creación');

    } catch (error) {
        console.error('❌ Error restaurando modal:', error);
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Eliminar ajuste sin mostrar confirmación
 */
async function eliminarAjusteSilencioso(ajusteId) {
    try {
        const response = await fetch(`/TomaInventario/EliminarAjustePendiente/${ajusteId}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return false;

        const resultado = await response.json();
        return resultado.success;

    } catch (error) {
        console.error('❌ Error en eliminación silenciosa:', error);
        return false;
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Crear ajuste sin mostrar confirmación
 */
async function crearAjusteSilencioso(solicitud) {
    try {
        const response = await fetch('/TomaInventario/CrearAjustePendiente', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(solicitud)
        });

        if (!response.ok) return false;

        const resultado = await response.json();
        return resultado.success;

    } catch (error) {
        console.error('❌ Error en creación silenciosa:', error);
        return false;
    }
}

/**
 * ✅ FUNCIÓN MEJORADA: Eliminar ajuste pendiente
 */
async function eliminarAjustePendiente(ajusteId) {
    try {
        console.log('🗑️ === ELIMINANDO AJUSTE PENDIENTE ===');
        console.log('🗑️ Ajuste ID:', ajusteId);

        // ✅ BUSCAR EL AJUSTE EN LOS DATOS LOCALES
        const ajuste = ajustesPendientes.find(a => a.ajusteId === ajusteId);
        if (!ajuste) {
            mostrarError('Ajuste no encontrado en los datos locales');
            return;
        }

        // ✅ CONFIRMACIÓN DETALLADA CON SWAL
        const confirmacion = await Swal.fire({
            title: '🗑️ ¿Eliminar ajuste pendiente?',
            html: `
                <div class="text-start">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>¡Atención!</strong> Esta acción no se puede deshacer.
                    </div>
                    
                    <h6 class="text-primary mb-3">📋 Detalles del ajuste:</h6>
                    
                    <div class="row mb-2">
                        <div class="col-5"><strong>Producto:</strong></div>
                        <div class="col-7">${ajuste.nombreProducto || `Producto ${ajuste.productoId}`}</div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-5"><strong>Tipo de ajuste:</strong></div>
                        <div class="col-7">
                            <span class="badge ${obtenerClaseBadgeTipo(ajuste.tipoAjuste)}">
                                ${obtenerTextoTipoAjuste(ajuste.tipoAjuste)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-5"><strong>Stock Sistema:</strong></div>
                        <div class="col-7">${ajuste.cantidadSistemaOriginal}</div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-5"><strong>Conteo Físico:</strong></div>
                        <div class="col-7">${ajuste.cantidadFisicaContada}</div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-5"><strong>Cantidad Final:</strong></div>
                        <div class="col-7"><strong class="text-primary">${ajuste.cantidadFinalPropuesta}</strong></div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-5"><strong>Motivo:</strong></div>
                        <div class="col-7"><small class="text-muted">"${ajuste.motivoAjuste}"</small></div>
                    </div>
                    
                    <div class="alert alert-info">
                        <small>
                            <i class="bi bi-info-circle me-1"></i>
                            Al eliminar este ajuste, el producto mantendrá su discrepancia original y podrás crear un nuevo ajuste si es necesario.
                        </small>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash me-1"></i> Sí, eliminar ajuste',
            cancelButtonText: '<i class="bi bi-x-lg me-1"></i> Cancelar',
            width: '600px',
            customClass: {
                popup: 'swal-wide'
            }
        });

        if (!confirmacion.isConfirmed) {
            console.log('❌ Eliminación cancelada por el usuario');
            return;
        }

        // ✅ MOSTRAR LOADING
        Swal.fire({
            title: 'Eliminando ajuste...',
            html: 'Por favor espera mientras se elimina el ajuste pendiente.',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ✅ LLAMAR A LA API A TRAVÉS DEL CONTROLADOR WEB
        const response = await fetch(`/TomaInventario/EliminarAjustePendiente/${ajusteId}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Respuesta del servidor:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();
        console.log('✅ Resultado de eliminación:', resultado);

        if (resultado.success) {
            // ✅ ACTUALIZAR DATOS LOCALES
            const index = ajustesPendientes.findIndex(a => a.ajusteId === ajusteId);
            if (index > -1) {
                ajustesPendientes.splice(index, 1);
                console.log(`✅ Ajuste eliminado de datos locales. Quedan ${ajustesPendientes.length} ajustes`);
            }

            // ✅ ACTUALIZAR UI INMEDIATAMENTE
            $(`tr[data-ajuste-id="${ajusteId}"]`).fadeOut(300, function () {
                $(this).remove();

                // ✅ VERIFICAR SI NO QUEDAN AJUSTES
                if (ajustesPendientes.length === 0) {
                    $('#ajustesPendientesPanel').slideUp();
                    $('#tablaAjustes').hide();
                    $('#ajustesVacio').show();
                }
            });

            // ✅ ACTUALIZAR PANEL COMPLETO
            actualizarPanelAjustesPendientes();

            // ✅ RECARGAR PRODUCTOS PARA ACTUALIZAR ESTADOS
            await cargarProductosInventario(window.inventarioConfig.inventarioId);

            // ✅ MOSTRAR MENSAJE DE ÉXITO
            Swal.fire({
                title: '✅ ¡Ajuste eliminado!',
                text: `El ajuste pendiente para "${ajuste.nombreProducto}" ha sido eliminado exitosamente.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            console.log('🎉 Ajuste eliminado exitosamente y UI actualizada');

        } else {
            throw new Error(resultado.message || 'Error desconocido al eliminar ajuste');
        }

    } catch (error) {
        console.error('💥 Error eliminando ajuste pendiente:', error);

        // ✅ MOSTRAR ERROR DETALLADO
        Swal.fire({
            title: '❌ Error al eliminar',
            html: `
                <div class="text-start">
                    <p>No se pudo eliminar el ajuste pendiente.</p>
                    <div class="alert alert-danger">
                        <strong>Error:</strong> ${error.message}
                    </div>
                    <small class="text-muted">
                        Si el problema persiste, contacta al administrador del sistema.
                    </small>
                </div>
            `,
            icon: 'error',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Entendido'
        });
    }
}


/**
 * ✅ NUEVA FUNCIÓN: Crear modal de ajustes pendientes
 */
function crearModalAjustesPendientes() {
    const modalHTML = `
        <div class="modal fade" id="modalAjustesPendientes" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-clipboard-check me-2"></i>
                            Ajustes Pendientes del Inventario
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Nota:</strong> Estos ajustes se aplicarán automáticamente al stock del sistema cuando se complete el inventario.
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover" id="tablaAjustesPendientes">
                                <thead class="table-warning">
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-center">Stock Sistema</th>
                                        <th class="text-center">Conteo Físico</th>
                                        <th class="text-center">Diferencia</th>
                                        <th class="text-center">Stock Final</th>
                                        <th class="text-center">Estado</th>
                                        <th class="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Se llena dinámicamente -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('body').append(modalHTML);
}

function abrirModalAjuste(productoId) {
    try {
        console.log(`🔧 === ABRIENDO MODAL DE AJUSTE ===`);
        console.log(`🔧 Producto ID: ${productoId}`);

        // ✅ VERIFICAR PERMISOS ANTES DE ABRIR
        const permisos = window.inventarioConfig?.permisos || {};
        if (!permisos.puedeAjustar && !permisos.esAdmin) {
            mostrarError('No tienes permisos para ajustar stock en este inventario');
            return;
        }

        // ✅ BUSCAR EL PRODUCTO EN LOS DATOS CARGADOS
        const producto = productosInventario.find(p => p.productoId === productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        // ✅ VERIFICAR QUE HAYA DISCREPANCIA
        if (!producto.tieneDiscrepancia) {
            mostrarError('Este producto no tiene discrepancias que ajustar');
            return;
        }

        console.log(`🔧 Producto encontrado: ${producto.nombreProducto}`);
        console.log(`🔧 Discrepancia: ${producto.diferencia}`);

        // ✅ LLENAR INFORMACIÓN DEL PRODUCTO EN EL MODAL
        $('#productoIdAjuste').val(producto.productoId);
        $('#nombreProductoAjuste').text(producto.nombreProducto || 'Sin nombre');
        $('#stockSistemaAjuste').text(producto.cantidadSistema || 0);
        $('#stockFisicoAjuste').text(producto.cantidadFisica || 0);

        // ✅ MOSTRAR DISCREPANCIA CON COLOR
        const diferencia = producto.diferencia || 0;
        const $discrepancia = $('#discrepanciaAjuste');
        $discrepancia.text(diferencia > 0 ? `+${diferencia}` : diferencia);

        if (diferencia > 0) {
            $discrepancia.removeClass('text-danger').addClass('text-success');
        } else {
            $discrepancia.removeClass('text-success').addClass('text-danger');
        }

        // ✅ RESETEAR FORMULARIO
        $('#tipoAjusteInventario').val('');
        $('#cantidadAjusteInventario').val(producto.cantidadFisica || 0);
        $('#motivoAjusteInventario').val('');
        $('#containerCantidadAjuste').hide();
        $('#vistaPreviaAjuste').hide();

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('ajusteStockInventarioModal'));
        modal.show();

        console.log(`✅ Modal de ajuste abierto exitosamente`);

    } catch (error) {
        console.error('❌ Error abriendo modal de ajuste:', error);
        mostrarError('Error al abrir el modal de ajuste');
    }
}


function limpiarModalConteo() {
    try {
        console.log('🧹 Limpiando modal de conteo...');

        $('#productoIdConteo').val('');
        $('#inventarioIdConteo').val('');
        $('#cantidadFisicaConteo').val('');
        $('#observacionesConteo').val('');
        $('#alertaDiferencia').hide();
        $('#medidasLlantaConteo').hide();

        // Limpiar imagen
        $('#imagenProductoConteo').attr('src', '/images/no-image.png');

        console.log('✅ Modal de conteo limpiado');
    } catch (error) {
        console.error('❌ Error limpiando modal:', error);
    }
}

// =====================================
// FUNCIONES DE CARGA DE DATOS
// =====================================
async function cargarInformacionInventario(inventarioId) {
    try {
        console.log(`📋 Cargando información del inventario ${inventarioId}...`);

        // ✅ USAR LA INFORMACIÓN QUE YA TENEMOS DESDE EL SERVIDOR
        if (window.inventarioConfig) {
            console.log('✅ Usando información del inventario desde configuración global');

            inventarioActual = {
                inventarioProgramadoId: window.inventarioConfig.inventarioId,
                titulo: document.querySelector('h1')?.textContent?.replace('🔲', '').trim() || 'Inventario',
                estado: 'En Progreso', // Ya sabemos que está en progreso porque llegamos aquí
                tipoInventario: window.inventarioConfig.tipoInventario || 'Completo', // Default a Completo si no está definido
                permisos: window.inventarioConfig.permisos
            };

            // Actualizar UI con información del inventario
            $('#inventarioTitulo').text(inventarioActual.titulo || 'Sin título');
            $('#inventarioEstado').text('En Progreso')
                .removeClass('bg-light bg-warning bg-success bg-danger')
                .addClass('bg-success');

            console.log('✅ Información del inventario cargada desde configuración');
            return;
        }

        console.log('⚠️ No se encontró configuración global, intentando cargar desde servidor...');
        // Si no hay configuración global, continuar con la carga original (fallback)
        // Este código se puede quitar después, es solo por seguridad

    } catch (error) {
        console.error('❌ Error cargando información del inventario:', error);
        throw error;
    }
}


async function cargarProductosInventario(inventarioId) {
    try {
        console.log('📦 === DEPURACIÓN: CARGANDO PRODUCTOS ===');
        console.log('📦 Inventario ID:', inventarioId);
        console.log('📦 Tipo de inventarioId:', typeof inventarioId);
        console.log('📦 URL que se va a llamar:', `/TomaInventario/ObtenerProductos/${inventarioId}`);

        // Mostrar loading
        $('#loadingProductos').show();
        $('#productosLista').hide();
        $('#productosTarjetas').hide();
        $('#estadoVacio').hide();

        console.log('📦 Realizando fetch...');
        const response = await fetch(`/TomaInventario/ObtenerProductos/${inventarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        console.log('📦 Respuesta recibida:');
        console.log('📦 Status:', response.status);
        console.log('📦 StatusText:', response.statusText);
        console.log('📦 OK:', response.ok);

        if (!response.ok) {
            console.error('❌ Error en la respuesta:', response.status, response.statusText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        console.log('📦 Parseando JSON...');
        const data = await response.json();
        console.log('📦 Datos recibidos:', data);
        console.log('📦 Tipo de data:', typeof data);
        console.log('📦 Data.success:', data.success);
        console.log('📦 Data.productos:', data.productos);
        console.log('📦 Cantidad de productos:', data.productos ? data.productos.length : 'N/A');

        console.log('🔍 === DEBUGGING PRODUCTOS CARGADOS ===');
        console.log('🔍 Respuesta completa:', data);
        console.log('🔍 Productos array:', data.productos);
        console.log('🔍 Estadísticas:', data.estadisticas);

        productosInventario = data.productos || [];
        estadisticasActuales = data.estadisticas || {};

        if (productosInventario.length > 0) {
            const primerProducto = productosInventario[0];
            console.log('🔍 Primer producto:', primerProducto);
            console.log('🔍 Propiedades del primer producto:', Object.keys(primerProducto));
        }

        console.log(`✅ Cargados ${productosInventario.length} productos`);

        // Renderizar productos
        renderizarProductos();

        // Actualizar estadísticas
        actualizarEstadisticasUI();

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        $('#loadingProductos').hide();
        $('#estadoVacio').show();
        mostrarError('Error al cargar productos del inventario');
    }
}

// =====================================
// FUNCIONES DE ALERTAS DE MOVIMIENTOS POST-CORTE
// =====================================

/**
 * Cargar alertas de movimientos post-corte
 */
async function cargarAlertasPostCorte() {
    try {
        console.log('🔔 Cargando alertas de movimientos post-corte...');

        const inventarioId = window.inventarioConfig?.inventarioId;
        if (!inventarioId) {
            console.warn('⚠️ No se encontró ID de inventario');
            return;
        }

        const response = await fetch(`/TomaInventario/ObtenerAlertasPostCorte/${inventarioId}?soloNoLeidas=false`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('⚠️ No se pudieron cargar las alertas. Status:', response.status);
            return;
        }

        const data = await response.json();
        console.log('📦 Datos recibidos de alertas:', data);
        console.log('📦 data.success:', data.success);
        console.log('📦 data.alertas:', data.alertas);

        if (data.success && data.alertas) {
            console.log(`✅ Cargadas ${data.alertas.length} alertas (${data.noLeidas} no leídas)`);
            console.log('📋 Detalle primera alerta:', data.alertas[0]);

            // Actualizar UI
            actualizarPanelAlertas(data.alertas);

            // Actualizar contador
            $('#contadorAlertasPostCorte').text(data.noLeidas);

            // Mostrar/ocultar panel según si hay alertas
            if (data.alertas.length > 0) {
                $('#alertasPostCortePanel').show();
            } else {
                $('#alertasPostCortePanel').hide();
            }
        } else {
            console.error('❌ Respuesta inválida de la API:', {
                success: data.success,
                alertas: data.alertas,
                mensaje: data.message
            });
            $('#alertasPostCortePanel').hide();
        }

    } catch (error) {
        console.error('❌ Error cargando alertas:', error);
        console.error('❌ Stack trace:', error.stack);
    }
}

/**
 * Actualizar el panel de alertas con los datos
 */
function actualizarPanelAlertas(alertas) {
    console.log('🎨 === ACTUALIZANDO PANEL DE ALERTAS ===');
    console.log('🎨 Total de alertas a renderizar:', alertas?.length || 0);

    const $tablaBody = $('#tablaAlertasBody');
    const $alertasVacio = $('#alertasVacio');
    const $tablaAlertas = $('#tablaAlertas');

    $tablaBody.empty();

    if (!alertas || alertas.length === 0) {
        console.log('📭 No hay alertas para mostrar');
        $alertasVacio.show();
        $tablaAlertas.hide();
        return;
    }

    $alertasVacio.hide();
    $tablaAlertas.show();

    alertas.forEach((alerta, index) => {
        console.log(`🔔 Renderizando alerta ${index + 1}:`, alerta);
        console.log('📋 Propiedades de la alerta:', {
            nombreProducto: alerta.nombreProducto,
            tipoMovimiento: alerta.tipoMovimiento,
            cantidadMovimiento: alerta.cantidadMovimiento,
            fechaMovimiento: alerta.fechaMovimiento,
            procesado: alerta.procesado,
            fechaProcesado: alerta.fechaProcesado,
            nombreUsuarioProcesado: alerta.nombreUsuarioProcesado,
            leida: alerta.leida
        });

        // ✅ USAR camelCase - la API devuelve en camelCase por defecto en ASP.NET Core

        // Formatear fecha del movimiento
        const fechaMovimiento = alerta.fechaMovimiento
            ? new Date(alerta.fechaMovimiento).toLocaleString('es-CR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : '<span class="text-muted">N/A</span>';

        // Formatear fecha de procesado
        const fechaProcesado = alerta.fechaProcesado
            ? new Date(alerta.fechaProcesado).toLocaleString('es-CR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : '<span class="text-muted">-</span>';

        // Icono de estado de alerta (leída/no leída)
        const iconoEstadoAlerta = alerta.leida
            ? '<i class="bi bi-check-circle text-success" title="Alerta leída"></i>'
            : '<i class="bi bi-exclamation-circle text-warning" title="Alerta nueva"></i>';

        // Badge de estado de alerta
        const badgeEstadoAlerta = alerta.leida
            ? '<span class="badge bg-success">Leída</span>'
            : '<span class="badge bg-warning">Nueva</span>';

        // Badge de estado de procesado
        const badgeEstadoProcesado = alerta.procesado
            ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Procesado</span>'
            : '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Pendiente</span>';

        // Tipo de movimiento con icono
        const tipoMovimiento = alerta.tipoMovimiento || 'N/A';
        let iconoMovimiento = '';
        let colorMovimiento = 'secondary';

        switch(tipoMovimiento.toLowerCase()) {
            case 'venta':
                iconoMovimiento = '<i class="bi bi-cart me-1"></i>';
                colorMovimiento = 'danger';
                break;
            case 'ajuste':
                iconoMovimiento = '<i class="bi bi-pencil-square me-1"></i>';
                colorMovimiento = 'warning';
                break;
            case 'traspaso':
                iconoMovimiento = '<i class="bi bi-arrow-left-right me-1"></i>';
                colorMovimiento = 'info';
                break;
            case 'devolucion':
                iconoMovimiento = '<i class="bi bi-arrow-return-left me-1"></i>';
                colorMovimiento = 'success';
                break;
            default:
                iconoMovimiento = '<i class="bi bi-question-circle me-1"></i>';
        }

        const badgeTipoMovimiento = `<span class="badge bg-${colorMovimiento}">${iconoMovimiento}${tipoMovimiento}</span>`;

        // Cantidad con signo y color
        const cantidad = alerta.cantidadMovimiento || 0;
        const cantidadFormateada = cantidad > 0
            ? `<span class="text-success fw-bold">+${cantidad}</span>`
            : `<span class="text-danger fw-bold">${cantidad}</span>`;

        // Nombre del producto
        const nombreProducto = alerta.nombreProducto || `Producto #${alerta.productoId}`;

        // Usuario que procesó
        const usuarioProcesado = alerta.nombreUsuarioProcesado || '<span class="text-muted">-</span>';

        const row = `
            <tr class="${alerta.leida ? '' : 'table-warning'}">
                <td class="text-center">${iconoEstadoAlerta}</td>
                <td>${nombreProducto}</td>
                <td class="text-center">${badgeTipoMovimiento}</td>
                <td class="text-center">${cantidadFormateada}</td>
                <td>${fechaMovimiento}</td>
                <td class="text-center">${badgeEstadoProcesado}</td>
                <td>${fechaProcesado}</td>
                <td>${usuarioProcesado}</td>
                <td class="text-center">${badgeEstadoAlerta}</td>
                <td class="text-center">
                    ${!alerta.leida ? `
                        <button class="btn btn-sm btn-outline-success"
                                onclick="marcarAlertaLeida(${alerta.alertaId})"
                                title="Marcar como leída">
                            <i class="bi bi-check"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;

        $tablaBody.append(row);
    });
}

/**
 * Marcar una alerta como leída
 */
async function marcarAlertaLeida(alertaId) {
    try {
        console.log(`✅ === MARCANDO ALERTA ${alertaId} COMO LEÍDA ===`);

        const response = await fetch(`/TomaInventario/MarcarAlertaLeida/${alertaId}`, {
            method: 'PUT',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Respuesta marcar alerta:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Alerta marcada exitosamente:', data);

            mostrarExito('Alerta marcada como leída');

            console.log('🔄 Recargando alertas...');
            await cargarAlertasPostCorte();
            console.log('✅ Alertas recargadas');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error del servidor:', response.status, errorData);
            mostrarError('Error al marcar alerta como leída');
        }

    } catch (error) {
        console.error('❌ Error marcando alerta como leída:', error);
        mostrarError('Error al marcar alerta como leída');
    }
}

/**
 * Marcar todas las alertas como leídas
 */
async function marcarTodasAlertasLeidas() {
    try {
        const inventarioId = window.inventarioConfig?.inventarioId;
        if (!inventarioId) {
            return;
        }

        const response = await fetch(`/TomaInventario/MarcarTodasAlertasLeidas/${inventarioId}`, {
            method: 'PUT',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            mostrarExito(data.message || 'Todas las alertas han sido marcadas como leídas');
            await cargarAlertasPostCorte();
        } else {
            mostrarError('Error al marcar alertas como leídas');
        }

    } catch (error) {
        console.error('❌ Error marcando todas las alertas:', error);
        mostrarError('Error al marcar alertas como leídas');
    }
}


// =====================================
// FUNCIONES DE RENDERIZADO
// =====================================
function renderizarProductos() {
    try {
        console.log('🎨 Renderizando productos...');
        console.log('🎨 Total productos a renderizar:', productosInventario.length);
        console.log('🎨 Filtros activos:', filtrosActivos);

        if (productosInventario.length === 0) {
            $('#loadingProductos').hide();
            $('#productosLista').hide();
            $('#estadoVacio').show();
            return;
        }

        // ✅ VERIFICAR SI HAY FILTROS ACTIVOS
        const hayFiltrosActivos = filtrosActivos.texto || filtrosActivos.estado || filtrosActivos.tipo;

        if (hayFiltrosActivos) {
            // ✅ SI HAY FILTROS ACTIVOS: Reaplicar filtros con datos actualizados
            console.log('🔍 Reaplicando filtros activos después de actualización...');
            filtrarProductos(filtrosActivos.texto, filtrosActivos.estado, filtrosActivos.tipo);
        } else {
            // ✅ SI NO HAY FILTROS: Mostrar todos los productos normalmente
            const tbody = $('#tablaProductosBody');
            tbody.empty();

            productosInventario.forEach((producto, index) => {
                const row = crearFilaProducto(producto, index + 1);
                tbody.append(row);
            });

            productosFiltrados = productosInventario;

            // ✅ ORDENAR POR MEDIDAS AL CARGAR
            ordenarProductosPorMedidas();
        }

        $('#loadingProductos').hide();
        $('#productosLista').show();
        $('#estadoVacio').hide();

        // ✅ POBLAR FILTROS DE LLANTAS AL CARGAR
        setTimeout(() => {
            poblarFiltrosLlantas();
            verificarMovimientosPostCorte(); // Verificar movimientos post-corte
        }, 500);

        console.log('✅ Productos renderizados correctamente con filtros preservados');

    } catch (error) {
        console.error('❌ Error renderizando productos:', error);
    }
}

function crearFilaProducto(producto, numero) {
    const tieneDiscrepancia = producto.tieneDiscrepancia;
    const tieneAjustePendiente = verificarAjustePendiente(producto.productoId);

    // ✅ AGREGAR ESTAS LÍNEAS DE DEBUG:
    console.log(`🔧 DEBUG crearFilaProducto - Producto ${producto.productoId}:`, {
        nombreProducto: producto.nombreProducto,
        tieneDiscrepancia: tieneDiscrepancia,
        tieneAjustePendiente: tieneAjustePendiente,
        ajustesPendientesTotal: ajustesPendientes ? ajustesPendientes.length : 0,
        ajustesParaEsteProducto: ajustesPendientes ? ajustesPendientes.filter(a => a.productoId === producto.productoId) : []
    });

    const estadoClass = tieneDiscrepancia ? 'estado-discrepancia' :
        producto.estadoConteo === 'Contado' ? 'estado-contado' : 'estado-pendiente';

   /* const imagenSrc = producto.imagenUrl || '/images/no-image.png';*/
    const diferencia = producto.diferencia || 0;
    const diferenciaClass = diferencia > 0 ? 'diferencia-positiva' :
        diferencia < 0 ? 'diferencia-negativa' : 'diferencia-cero';

    // Información adicional para llantas
    let infoLlanta = '';
    if (producto.esLlanta) {
        infoLlanta = `
            <div class="small text-muted">
                <i class="bi bi-car-front me-1"></i>
                ${producto.marcaLlanta || ''} ${producto.modeloLlanta || ''}
            </div>
        `;
    }

    // Obtener los datos de la llanta para las nuevas columnas
    const medidas = producto.esLlanta && producto.medidasLlanta ? producto.medidasLlanta : '-';
    const tipoTerreno = producto.esLlanta && producto.tipoTerrenoLlanta ? producto.tipoTerrenoLlanta : '-';
    const capas = producto.esLlanta && producto.capasLlanta ? producto.capasLlanta : '-';

    // ✅ NUEVA COLUMNA DE ESTADO CON MÚLTIPLES BADGES
    const estadoBadges = crearBadgesEstado(producto);

    // ✅ NUEVOS BOTONES DE ACCIÓN
    const botonesAccion = crearNuevosBotonesAccion(producto);

    // ✅ INDICADOR DE AJUSTES PENDIENTES
    const indicadorAjustes = tieneAjustePendiente ?
        `<i class="bi bi-clock-history text-warning" data-bs-toggle="tooltip" title="Tiene ajustes pendientes"></i>` :
        '';

    // ✅ CELDA DE MOVIMIENTOS POST-CORTE
    const movimientosPostCorte = producto.movimientosPostCorte || 0;
    const tieneMovimientos = movimientosPostCorte !== 0;
    let celdaMovimientos = '';

    if (tieneMovimientos) {
        const colorBadge = movimientosPostCorte < 0 ? 'bg-danger' : 'bg-success';
        const iconoMovimiento = movimientosPostCorte < 0 ? 'bi-arrow-down' : 'bi-arrow-up';
        celdaMovimientos = `
            <div class="d-flex flex-column align-items-center gap-1">
                <span class="badge ${colorBadge}">
                    <i class="bi ${iconoMovimiento}"></i> ${movimientosPostCorte > 0 ? '+' : ''}${movimientosPostCorte}
                </span>
                <button class="btn btn-warning btn-sm"
                        onclick="actualizarLineaIndividual(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Actualizar con movimientos post-corte">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>
        `;
    } else {
        celdaMovimientos = '<span class="text-muted">-</span>';
    }

    return $(`
        <tr class="producto-row ${estadoClass}"
            data-producto-id="${producto.productoId}"
            data-movimientos="${movimientosPostCorte}"
            ${producto.esLlanta && producto.capasLlanta ? `data-capas="${producto.capasLlanta}"` : ''}>
            <td class="text-center fw-bold">${numero}</td>
            <td>
                <div class="fw-semibold">${producto.nombreProducto}</div>
                <div class="small text-muted">${producto.descripcionProducto || ''}</div>
                ${infoLlanta}
            </td>
            <td>${medidas}</td>
            <td>${tipoTerreno}</td>
            <td class="text-center">${capas}</td>
            <td class="text-center">${celdaMovimientos}</td>
            <td class="text-center">
                <span class="badge bg-primary fs-6">${producto.cantidadSistema}</span>
            </td>
            <td class="text-center">
                ${producto.cantidadFisica !== null ?
            `<span class="badge bg-info fs-6">${producto.cantidadFisica}</span>` :
            '<span class="text-muted small">Sin contar</span>'
        }
            </td>
            <td class="text-center">
                <span class="fw-bold ${diferenciaClass}">
                    ${diferencia > 0 ? '+' : ''}${diferencia}
                </span>
            </td>
            <td class="text-center">
                ${estadoBadges}
            </td>
            <td class="text-center">
                ${botonesAccion}
            </td>
            <td class="text-center">
                ${indicadorAjustes}
            </td>
        </tr>
    `);
}

/**
 * ✅ NUEVA FUNCIÓN: Crear badges de estado múltiples
 */
function crearBadgesEstado(producto) {
    let badges = '';

    // Badge principal de estado
    if (producto.estadoConteo === 'Contado') {
        badges += '<span class="badge bg-success mb-1"><i class="bi bi-check-circle me-1"></i>Contado</span>';
    } else {
        badges += '<span class="badge bg-warning mb-1"><i class="bi bi-clock me-1"></i>Pendiente</span>';
    }

    // Badge de discrepancia
    if (producto.tieneDiscrepancia) {
        const diferencia = producto.diferencia || 0;
        const colorBadge = diferencia > 0 ? 'bg-danger' : 'bg-warning';
        badges += `<br><span class="badge ${colorBadge} small">⚠️ Dif: ${diferencia > 0 ? '+' : ''}${diferencia}</span>`;
    }

    // Badge de ajuste pendiente
    if (verificarAjustePendiente(producto.productoId)) {
        badges += '<br><span class="badge bg-info small"><i class="bi bi-clock-history me-1"></i>Ajuste Pendiente</span>';
    }

    return `<div class="d-flex flex-column align-items-center gap-1">${badges}</div>`;
}

/**
 * ✅ FUNCIÓN ACTUALIZADA: Crear botones de acción con permisos granulares
 */
function crearNuevosBotonesAccion(producto) {
    try {
        // ✅ DEBUG AL INICIO
        const tieneAjustePendiente = verificarAjustePendiente(producto.productoId);
        const ajusteDetalle = tieneAjustePendiente ? obtenerDetallesAjustePendiente(producto.productoId) : null;

        console.log(`🔧 crearNuevosBotonesAccion - Producto ${producto.productoId}:`, {
            tieneDiscrepancia: producto.tieneDiscrepancia,
            tieneAjustePendiente: tieneAjustePendiente,
            detalleAjuste: ajusteDetalle
        });

        const inventarioEnProgreso = inventarioActual?.estado === 'En Progreso';
        let botones = '';

        // ✅ BOTÓN DE CONTAR (verificar permiso específico)
        if (permisosInventarioActual.puedeContar && inventarioEnProgreso) {
            const textoBoton = producto.estadoConteo === 'Contado' ? 'Recontar' : 'Contar';
            const iconoBoton = producto.estadoConteo === 'Contado' ? 'bi-arrow-clockwise' : 'bi-calculator';
            const colorBoton = producto.estadoConteo === 'Contado' ? 'btn-outline-primary' : 'btn-primary';

            botones += `
                <button class="btn btn-sm ${colorBoton} mb-1 btn-conteo" 
                        onclick="abrirModalConteo(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="${textoBoton} este producto">
                    <i class="bi ${iconoBoton} me-1"></i>
                    ${textoBoton}
                </button>
            `;
        }

        // ✅ LÓGICA CORREGIDA PARA BOTONES DE AJUSTE
        if (permisosInventarioActual.puedeAjustar && producto.tieneDiscrepancia && inventarioEnProgreso) {

            if (tieneAjustePendiente) {
                // ✅ SI YA TIENE AJUSTE: Mostrar botón Ver Ajustes
                console.log(`🟢 Producto ${producto.productoId}: Mostrando botón VER AJUSTE`);

                botones += `
                    <button class="btn btn-sm btn-info mb-1" 
                            onclick="verAjustesProducto(${producto.productoId})"
                            data-bs-toggle="tooltip"
                            title="Ver ajuste pendiente: ${ajusteDetalle ? obtenerTextoTipoAjuste(ajusteDetalle.tipoAjuste) : 'Pendiente'}">
                        <i class="bi bi-eye me-1"></i>
                        Ver Ajuste
                    </button>
                `;

                // ✅ Botón secundario para editar (si existe la función)
                if (ajusteDetalle && typeof editarAjustePendiente === 'function') {
                    botones += `
                        <button class="btn btn-sm btn-outline-warning mb-1" 
                                onclick="editarAjustePendiente(${ajusteDetalle.ajusteId})"
                                data-bs-toggle="tooltip"
                                title="Editar ajuste pendiente">
                            <i class="bi bi-pencil me-1"></i>
                            Editar
                        </button>
                    `;
                }

            } else {
                // ✅ SI NO TIENE AJUSTE: Mostrar botón Crear
                console.log(`🟡 Producto ${producto.productoId}: Mostrando botón CREAR AJUSTE`);

                botones += `
                    <button class="btn btn-sm btn-warning mb-1 btn-ajuste-pendiente"
                            onclick="abrirModalAjustePendiente(${producto.productoId})"
                            data-bs-toggle="tooltip"
                            title="📦 Crear ajuste personalizado: Te permite escribir un motivo detallado y seleccionar el tipo de ajuste">
                        <i class="bi bi-clock-history me-1"></i>
                        Crear Ajuste
                    </button>
                `;
            }
        }

        // ✅ BOTÓN DE VALIDACIÓN (solo si no tiene ajuste pendiente)
        if (permisosInventarioActual.puedeValidar &&
            producto.tieneDiscrepancia &&
            !tieneAjustePendiente &&
            inventarioEnProgreso) {

            botones += `
                <button class="btn btn-sm btn-success mb-1 btn-validacion"
                        onclick="validarDiscrepancia(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="✅ Validar conteo: Ajusta automáticamente el stock del sistema (${producto.cantidadSistema}) al físico contado (${producto.cantidadFisica})">
                    <i class="bi bi-check-double me-1"></i>
                    Validar
                </button>
            `;
        }


        // ✅ MENSAJE INFORMATIVO si no tiene permisos de acción
        if (!botones.includes('btn-conteo') && !botones.includes('btn-ajuste') && !botones.includes('btn-validacion')) {
            botones += `
                <small class="text-muted d-block">
                    <i class="bi bi-info-circle me-1"></i>
                    Sin permisos de acción
                </small>
            `;
        }

        console.log(`✅ Botones generados para producto ${producto.productoId}:`, botones.includes('Ver Ajuste') ? 'Ver Ajuste' : 'Crear Ajuste');

        return `<div class="d-flex flex-column gap-1">${botones}</div>`;

    } catch (error) {
        console.error('❌ Error creando botones de acción:', error);
        return `
            <button class="btn btn-sm btn-secondary" disabled>
                <i class="bi bi-exclamation-triangle me-1"></i>
                Error
            </button>
        `;
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Validar discrepancia (para usuarios con permiso de validación)
 */
async function validarDiscrepancia(productoId) {
    try {
        const verificacion = verificarPermisoEspecifico('validacion', 'validar discrepancia');
        if (!verificacion.tienePermiso) {
            mostrarError(verificacion.mensaje);
            return;
        }

        const producto = productosInventario.find(p => p.productoId === productoId);
        if (!producto || !producto.tieneDiscrepancia) {
            mostrarError('Este producto no tiene discrepancias para validar');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '✅ ¿Validar y ajustar al conteo físico?',
            html: `
                <div class="text-start">
                    <p><strong>Producto:</strong> ${producto.nombreProducto}</p>
                    <p><strong>Stock Sistema Actual:</strong> <span class="badge bg-secondary">${producto.cantidadSistema}</span></p>
                    <p><strong>Stock Físico Contado:</strong> <span class="badge bg-info">${producto.cantidadFisica}</span></p>
                    <p><strong>Diferencia:</strong> <span class="fw-bold text-warning">${producto.diferencia > 0 ? '+' : ''}${producto.diferencia}</span></p>
                    <hr>
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>¿Qué hace este botón?</strong><br>
                        Al validar, el stock del sistema se actualizará automáticamente a <strong>${producto.cantidadFisica}</strong> unidades (el conteo físico).
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, validar y ajustar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            // ✅ CAMBIO: Ahora "validar" SÍ actualiza el stock al físico contado
            // Crear ajuste de tipo "validado"
            const solicitudValidacion = {
                inventarioProgramadoId: window.inventarioConfig.inventarioId,
                productoId: producto.productoId,
                tipoAjuste: 'validado',
                cantidadSistemaOriginal: producto.cantidadSistema,
                cantidadFisicaContada: producto.cantidadFisica,
                cantidadFinalPropuesta: producto.cantidadFisica, // ✅ Ajustar al físico contado
                motivoAjuste: 'Discrepancia validada - ajuste automático al conteo físico',
                usuarioId: permisosInventarioActual.usuarioId
            };

            const response = await fetch('/TomaInventario/CrearAjustePendiente', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(solicitudValidacion)
            });

            if (response.ok) {
                const resultado = await response.json();
                if (resultado.success) {
                    mostrarExito('Discrepancia validada exitosamente');
                    await cargarAjustesPendientes(window.inventarioConfig.inventarioId);
                    await cargarProductosInventario(window.inventarioConfig.inventarioId);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error validando discrepancia:', error);
        mostrarError('Error al validar la discrepancia');
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Validar TODAS las discrepancias de una vez
 */
async function validarTodasLasDiscrepancias() {
    try {
        const verificacion = verificarPermisoEspecifico('validacion', 'validar todas las discrepancias');
        if (!verificacion.tienePermiso) {
            mostrarError(verificacion.mensaje);
            return;
        }

        // Filtrar productos con discrepancias que NO tienen ajuste pendiente
        const productosSinAjuste = productosInventario.filter(p =>
            p.tieneDiscrepancia && !verificarAjustePendiente(p.productoId)
        );

        if (productosSinAjuste.length === 0) {
            mostrarInfo('No hay discrepancias pendientes para validar');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '✅ ¿Validar TODAS las discrepancias?',
            html: `
                <div class="text-start">
                    <p><strong>Productos a validar:</strong> ${productosSinAjuste.length}</p>
                    <hr>
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>¿Qué hace esta acción?</strong><br>
                        Se validarán <strong>${productosSinAjuste.length} productos</strong> automáticamente.<br>
                        El stock del sistema se ajustará al conteo físico de cada producto.
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">Esta acción creará ${productosSinAjuste.length} ajustes pendientes que se aplicarán al finalizar el inventario.</small>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Sí, validar ${productosSinAjuste.length} productos`,
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            let procesados = 0;
            let errores = 0;

            // Mostrar progreso
            Swal.fire({
                title: 'Procesando...',
                html: `Validando productos: <strong>0</strong> / ${productosSinAjuste.length}`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Procesar cada producto
            for (const producto of productosSinAjuste) {
                try {
                    const solicitudValidacion = {
                        inventarioProgramadoId: window.inventarioConfig.inventarioId,
                        productoId: producto.productoId,
                        tipoAjuste: 'validado',
                        cantidadSistemaOriginal: producto.cantidadSistema,
                        cantidadFisicaContada: producto.cantidadFisica,
                        cantidadFinalPropuesta: producto.cantidadFisica,
                        motivoAjuste: 'Validación masiva - ajuste automático al conteo físico',
                        usuarioId: permisosInventarioActual.usuarioId
                    };

                    const response = await fetch('/TomaInventario/CrearAjustePendiente', {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(solicitudValidacion)
                    });

                    if (response.ok) {
                        const resultado = await response.json();
                        if (resultado.success) {
                            procesados++;
                        } else {
                            errores++;
                        }
                    } else {
                        errores++;
                    }
                } catch (error) {
                    console.error(`❌ Error validando producto ${producto.productoId}:`, error);
                    errores++;
                }

                // Actualizar progreso
                Swal.update({
                    html: `Validando productos: <strong>${procesados + errores}</strong> / ${productosSinAjuste.length}`
                });
            }

            // Recargar datos
            await cargarAjustesPendientes(window.inventarioConfig.inventarioId);
            await cargarProductosInventario(window.inventarioConfig.inventarioId);

            // Mostrar resultado
            Swal.fire({
                icon: errores === 0 ? 'success' : 'warning',
                title: errores === 0 ? '¡Validación completada!' : 'Validación completada con errores',
                html: `
                    <p><strong>Procesados exitosamente:</strong> ${procesados}</p>
                    ${errores > 0 ? `<p class="text-danger"><strong>Errores:</strong> ${errores}</p>` : ''}
                `,
                confirmButtonText: 'Aceptar'
            });
        }

    } catch (error) {
        console.error('❌ Error en validación masiva:', error);
        mostrarError('Error al validar las discrepancias');
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Crear ajuste para TODAS las discrepancias con tipo personalizado
 */
async function crearAjusteParaTodasLasDiscrepancias() {
    try {
        const verificacion = verificarPermisoEspecifico('ajuste', 'crear ajuste masivo');
        if (!verificacion.tienePermiso) {
            mostrarError(verificacion.mensaje);
            return;
        }

        // Filtrar productos con discrepancias que NO tienen ajuste pendiente
        const productosSinAjuste = productosInventario.filter(p =>
            p.tieneDiscrepancia && !verificarAjustePendiente(p.productoId)
        );

        if (productosSinAjuste.length === 0) {
            mostrarInfo('No hay discrepancias pendientes para ajustar');
            return;
        }

        // Mostrar modal de selección de tipo
        const { value: formValues } = await Swal.fire({
            title: '📦 Crear Ajuste Masivo',
            html: `
                <div class="text-start">
                    <p><strong>Productos a ajustar:</strong> ${productosSinAjuste.length}</p>
                    <hr>

                    <div class="mb-3">
                        <label for="swal-tipoAjuste" class="form-label fw-bold">
                            <i class="bi bi-gear me-1"></i>
                            Tipo de Ajuste
                        </label>
                        <select id="swal-tipoAjuste" class="form-select">
                            <option value="sistema_a_fisico">📦 Ajustar Sistema al Físico</option>
                            <option value="validado">✅ Validar (Ajustar al Físico)</option>
                        </select>
                        <div class="form-text">
                            <small>
                                <strong>Ambas opciones actualizan el stock al conteo físico.</strong><br>
                                La diferencia es solo para registro histórico.
                            </small>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="swal-motivo" class="form-label fw-bold">
                            <i class="bi bi-card-text me-1"></i>
                            Motivo del Ajuste
                        </label>
                        <textarea id="swal-motivo" class="form-control" rows="3"
                                  placeholder="Describe el motivo del ajuste masivo (mínimo 10 caracteres)"></textarea>
                    </div>

                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>¿Qué hace esta acción?</strong><br>
                        Se crearán <strong>${productosSinAjuste.length} ajustes pendientes</strong>.<br>
                        El stock de cada producto se ajustará a su conteo físico.
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Crear ajustes',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const tipoAjuste = document.getElementById('swal-tipoAjuste').value;
                const motivo = document.getElementById('swal-motivo').value.trim();

                if (motivo.length < 10) {
                    Swal.showValidationMessage('El motivo debe tener al menos 10 caracteres');
                    return false;
                }

                return { tipoAjuste, motivo };
            }
        });

        if (!formValues) return;

        const { tipoAjuste, motivo } = formValues;

        // Confirmar acción
        const confirmacion = await Swal.fire({
            title: '⚠️ ¿Confirmar ajuste masivo?',
            html: `
                <div class="text-start">
                    <p><strong>Productos:</strong> ${productosSinAjuste.length}</p>
                    <p><strong>Tipo:</strong> ${tipoAjuste === 'sistema_a_fisico' ? '📦 Ajustar al Físico' : '✅ Validado'}</p>
                    <p><strong>Motivo:</strong> ${motivo}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, crear ajustes',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            let procesados = 0;
            let errores = 0;

            // Mostrar progreso
            Swal.fire({
                title: 'Procesando...',
                html: `Creando ajustes: <strong>0</strong> / ${productosSinAjuste.length}`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Procesar cada producto
            for (const producto of productosSinAjuste) {
                try {
                    const solicitudAjuste = {
                        inventarioProgramadoId: window.inventarioConfig.inventarioId,
                        productoId: producto.productoId,
                        tipoAjuste: tipoAjuste,
                        cantidadSistemaOriginal: producto.cantidadSistema,
                        cantidadFisicaContada: producto.cantidadFisica,
                        cantidadFinalPropuesta: producto.cantidadFisica,
                        motivoAjuste: `[Ajuste Masivo] ${motivo}`,
                        usuarioId: permisosInventarioActual.usuarioId
                    };

                    const response = await fetch('/TomaInventario/CrearAjustePendiente', {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(solicitudAjuste)
                    });

                    if (response.ok) {
                        const resultado = await response.json();
                        if (resultado.success) {
                            procesados++;
                        } else {
                            errores++;
                        }
                    } else {
                        errores++;
                    }
                } catch (error) {
                    console.error(`❌ Error creando ajuste para producto ${producto.productoId}:`, error);
                    errores++;
                }

                // Actualizar progreso
                Swal.update({
                    html: `Creando ajustes: <strong>${procesados + errores}</strong> / ${productosSinAjuste.length}`
                });
            }

            // Recargar datos
            await cargarAjustesPendientes(window.inventarioConfig.inventarioId);
            await cargarProductosInventario(window.inventarioConfig.inventarioId);

            // Mostrar resultado
            Swal.fire({
                icon: errores === 0 ? 'success' : 'warning',
                title: errores === 0 ? '¡Ajustes creados!' : 'Ajustes creados con errores',
                html: `
                    <p><strong>Procesados exitosamente:</strong> ${procesados}</p>
                    ${errores > 0 ? `<p class="text-danger"><strong>Errores:</strong> ${errores}</p>` : ''}
                `,
                confirmButtonText: 'Aceptar'
            });
        }

    } catch (error) {
        console.error('❌ Error en ajuste masivo:', error);
        mostrarError('Error al crear los ajustes');
    }
}

/**
 * ✅ FUNCIÓN CORREGIDA: Verificar si un producto tiene ajustes pendientes
 * REEMPLAZAR la función existente completamente
 */
function verificarAjustePendiente(productoId) {
    try {
        // ✅ Verificar en datos locales de ajustesPendientes
        if (!ajustesPendientes || ajustesPendientes.length === 0) {
            console.log(`🔍 Producto ${productoId}: No hay ajustes pendientes cargados`);
            return false;
        }

        // ✅ Buscar ajuste pendiente para este producto
        const ajustePendiente = ajustesPendientes.find(ajuste =>
            ajuste.productoId === productoId &&
            (ajuste.estado === 'Pendiente' || ajuste.estado === 'pendiente' || !ajuste.estado)
        );

        if (ajustePendiente) {
            console.log(`✅ Producto ${productoId} SÍ tiene ajuste pendiente:`, ajustePendiente);
            return true;
        } else {
            console.log(`❌ Producto ${productoId} NO tiene ajuste pendiente`);
            return false;
        }

    } catch (error) {
        console.error('❌ Error verificando ajuste pendiente:', error);
        return false;
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Obtener detalles del ajuste pendiente
 */
function obtenerDetallesAjustePendiente(productoId) {
    try {
        if (!ajustesPendientes || ajustesPendientes.length === 0) {
            return null;
        }

        const ajuste = ajustesPendientes.find(ajuste =>
            ajuste.productoId === productoId &&
            (ajuste.estado === 'Pendiente' || ajuste.estado === 'pendiente' || !ajuste.estado)
        );

        return ajuste || null;

    } catch (error) {
        console.error('❌ Error obteniendo detalles de ajuste:', error);
        return null;
    }
}


/**
 * ✅ NUEVA FUNCIÓN: Ver detalles del producto (placeholder)
 */
function verDetallesProducto(productoId) {
    const producto = productosInventario.find(p => p.productoId === productoId);
    if (!producto) {
        mostrarError('Producto no encontrado');
        return;
    }

    // Por ahora, mostrar información básica
    mostrarInfo(`Detalles de: ${producto.nombreProducto}\nID: ${producto.productoId}\nEstado: ${producto.estadoConteo}`);
}



function getEstadoBadge(estado, tieneDiscrepancia) {
    if (tieneDiscrepancia) {
        return '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i>Discrepancia</span>';
    }

    switch (estado) {
        case 'Contado':
            return '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Contado</span>';
        case 'Pendiente':
            return '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>Pendiente</span>';
        default:
            return '<span class="badge bg-secondary">Desconocido</span>';
    }
}

function getEstadoBadgeClass(estado) {
    switch (estado) {
        case 'Programado':
            return 'bg-warning';
        case 'En Progreso':
            return 'bg-info';
        case 'Completado':
            return 'bg-success';
        case 'Cancelado':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// =====================================
// FUNCIONES DE FILTRADO
// =====================================
function filtrarProductos(textoFiltro = '', estadoFiltro = '', tipoFiltro = '') {
    try {
        console.log('🔍 Aplicando filtros:', { textoFiltro, estadoFiltro, tipoFiltro });

        // ✅ ACTUALIZAR FILTROS ACTIVOS
        filtrosActivos = {
            texto: textoFiltro.toLowerCase().trim(),
            estado: estadoFiltro,
            tipo: tipoFiltro
        };

        // ✅ FILTRAR PRODUCTOS
        productosFiltrados = productosInventario.filter(producto => {
            // Filtro por texto (búsqueda en múltiples campos)
            let cumpleTexto = true;
            if (filtrosActivos.texto) {
                const nombreProducto = (producto.nombreProducto || '').toLowerCase();
                const descripcionProducto = (producto.descripcionProducto || '').toLowerCase();
                const marcaLlanta = (producto.marcaLlanta || '').toLowerCase();
                const modeloLlanta = (producto.modeloLlanta || '').toLowerCase();
                const productoId = producto.productoId.toString();

                cumpleTexto = nombreProducto.includes(filtrosActivos.texto) ||
                    descripcionProducto.includes(filtrosActivos.texto) ||
                    marcaLlanta.includes(filtrosActivos.texto) ||
                    modeloLlanta.includes(filtrosActivos.texto) ||
                    productoId.includes(filtrosActivos.texto);
            }

            // Filtro por estado
            let cumpleEstado = true;
            if (filtrosActivos.estado) {
                switch (filtrosActivos.estado) {
                    case 'pendiente':
                        cumpleEstado = producto.estadoConteo !== 'Contado';
                        break;
                    case 'contado':
                        cumpleEstado = producto.estadoConteo === 'Contado';
                        break;
                    case 'discrepancia':
                        cumpleEstado = producto.tieneDiscrepancia === true;
                        break;
                }
            }

            // Filtro por tipo
            let cumpleTipo = true;
            if (filtrosActivos.tipo) {
                switch (filtrosActivos.tipo) {
                    case 'llanta':
                        cumpleTipo = producto.esLlanta === true;
                        break;
                    case 'accesorio':
                        cumpleTipo = producto.esLlanta !== true;
                        break;
                }
            }

            return cumpleTexto && cumpleEstado && cumpleTipo;
        });

        console.log(`✅ Filtrado: ${productosFiltrados.length} de ${productosInventario.length} productos`);

        // ✅ RENDERIZAR PRODUCTOS FILTRADOS
        renderizarProductosFiltrados();

        // ✅ ACTUALIZAR CONTADOR
        $('#contadorProductosMostrados').text(productosFiltrados.length);

    } catch (error) {
        console.error('❌ Error filtrando productos:', error);
        // En caso de error, mostrar todos los productos
        productosFiltrados = productosInventario;
        renderizarProductosFiltrados();
    }
}

/**
 * ✅ FUNCIÓN: Renderizar productos filtrados
 */
function renderizarProductosFiltrados() {
    try {
        const tbody = $('#tablaProductosBody');
        tbody.empty();

        if (productosFiltrados.length === 0) {
            // Mostrar estado vacío
            $('#productosLista').hide();
            $('#estadoVacio').show();
            return;
        }

        // Renderizar productos filtrados
        productosFiltrados.forEach((producto, index) => {
            const fila = crearFilaProducto(producto, index + 1);
            tbody.append(fila);
        });

        $('#productosLista').show();
        $('#estadoVacio').hide();

        // ✅ ORDENAR POR MEDIDAS AL RENDERIZAR
        ordenarProductosPorMedidas();

        console.log(`✅ Renderizados ${productosFiltrados.length} productos filtrados`);

    } catch (error) {
        console.error('❌ Error renderizando productos filtrados:', error);
    }
}

/**
 * ✅ FUNCIÓN: Ordenar productos por medidas (igual que Index de Inventario)
 */
function ordenarProductosPorMedidas() {
    try {
        const tbody = $('#tablaProductosBody');
        const filas = tbody.find('tr').toArray();

        // Ordenar filas
        filas.sort(function(a, b) {
            const valorA = obtenerValorMedidas($(a));
            const valorB = obtenerValorMedidas($(b));

            return valorA.localeCompare(valorB);
        });

        // Reinsertar filas ordenadas
        tbody.empty();
        filas.forEach((fila, index) => {
            // Actualizar el número de orden
            $(fila).find('td:first').text(index + 1);
            tbody.append(fila);
        });

        console.log('✅ Productos ordenados por medidas');
    } catch (error) {
        console.error('❌ Error ordenando productos:', error);
    }
}

/**
 * ✅ FUNCIÓN: Obtener valor de medidas para ordenamiento
 */
function obtenerValorMedidas(fila) {
    // Obtener el texto de la columna de medidas (columna 3)
    const texto = $(fila).find("td:eq(2)").text().trim();

    if (texto === "N/A" || texto === "-" || !texto) {
        return "ZZZZ"; // Poner al final los productos sin medida
    }

    // Extraer el RIN (R13, R14, R15, etc.)
    const rin = texto.match(/R(\d+)/i);
    const ancho = texto.match(/^(\d+)/);

    if (rin && ancho) {
        const numeroRin = parseInt(rin[1]);
        const numeroAncho = parseInt(ancho[1]);

        // Formato: RIN con 2 dígitos + ANCHO con 3 dígitos
        // Ejemplo: R14 con 185 = "14185"
        return numeroRin.toString().padStart(2, '0') + numeroAncho.toString().padStart(3, '0');
    }

    return texto.toLowerCase();
}

/**
 * ✅ FUNCIÓN: Limpiar todos los filtros
 */
function limpiarFiltros() {
    // Limpiar inputs
    $('#busquedaRapida').val('');
    $('#filtroEstado').val('');
    $('#filtroTipo').val('');

    // Aplicar filtros vacíos
    filtrarProductos('', '', '');

    // ✅ ORDENAR POR MEDIDAS DESPUÉS DE LIMPIAR
    setTimeout(() => {
        ordenarProductosPorMedidas();
    }, 100);

    console.log('🧹 Filtros limpiados');
}

/**
 * ✅ FUNCIÓN: Aplicar filtro rápido
 */
function aplicarFiltroRapido(tipo) {
    switch (tipo) {
        case 'todos':
            limpiarFiltros();
            break;
        case 'pendientes':
            $('#filtroEstado').val('pendiente');
            filtrarProductos($('#busquedaRapida').val(), 'pendiente', $('#filtroTipo').val());
            break;
        case 'discrepancias':
            $('#filtroEstado').val('discrepancia');
            filtrarProductos($('#busquedaRapida').val(), 'discrepancia', $('#filtroTipo').val());
            break;
    }

    console.log(`⚡ Filtro rápido aplicado: ${tipo}`);
}

/**
 * ✅ FUNCIÓN: Configurar event listeners del filtrado
 */
function configurarEventListenersFiltrado() {
    try {
        // ✅ BÚSQUEDA RÁPIDA
        $('#busquedaRapida').off('input').on('input', function () {
            const texto = $(this).val();
            const estado = $('#filtroEstado').val();
            const tipo = $('#filtroTipo').val();
            filtrarProductos(texto, estado, tipo);
        });

        // ✅ BOTÓN BUSCAR
        $('#btnBuscar').off('click').on('click', function () {
            const texto = $('#busquedaRapida').val();
            const estado = $('#filtroEstado').val();
            const tipo = $('#filtroTipo').val();
            filtrarProductos(texto, estado, tipo);
        });

        // ✅ FILTRO POR ESTADO
        $('#filtroEstado').off('change').on('change', function () {
            const texto = $('#busquedaRapida').val();
            const estado = $(this).val();
            const tipo = $('#filtroTipo').val();
            filtrarProductos(texto, estado, tipo);
        });

        // ✅ FILTRO POR TIPO
        $('#filtroTipo').off('change').on('change', function () {
            const texto = $('#busquedaRapida').val();
            const estado = $('#filtroEstado').val();
            const tipo = $(this).val();
            filtrarProductos(texto, estado, tipo);
        });

        // ✅ BOTÓN LIMPIAR BÚSQUEDA
        $('#btnLimpiarBusqueda').off('click').on('click', function () {
            $('#busquedaRapida').val('');
            const estado = $('#filtroEstado').val();
            const tipo = $('#filtroTipo').val();
            filtrarProductos('', estado, tipo);
        });

        // ✅ BOTONES DE FILTRO RÁPIDO
        $('#btnMostrarTodos').addClass('btn-filtro-rapido').off('click').on('click', function () {
            aplicarFiltroRapidoConEstado('todos', this);
        });

        $('#btnSoloPendientes').addClass('btn-filtro-rapido').off('click').on('click', function () {
            aplicarFiltroRapidoConEstado('pendientes', this);
        });

        $('#btnSoloDiscrepancias').addClass('btn-filtro-rapido').off('click').on('click', function () {
            aplicarFiltroRapidoConEstado('discrepancias', this);
        });
        // ✅ AGREGAR TAMBIÉN: Guardar estado en inputs
        $('#busquedaRapida, #filtroEstado, #filtroTipo').on('change input', function () {
            setTimeout(guardarEstadoFiltrosUI, 100);
        });

        // ✅ BOTÓN LIMPIAR FILTROS (del estado vacío)
        $('#btnLimpiarFiltros').off('click').on('click', function () {
            limpiarFiltros();
        });

        // ✅ ENTER EN BÚSQUEDA RÁPIDA
        $('#busquedaRapida').off('keypress').on('keypress', function (e) {
            if (e.which === 13) { // Enter
                $('#btnBuscar').click();
            }
        });

        console.log('✅ Event listeners de filtrado configurados');

    } catch (error) {
        console.error('❌ Error configurando event listeners de filtrado:', error);
    }
}


/**
 * ✅ FUNCIÓN: Guardar estado actual de filtros en la UI
 */
function guardarEstadoFiltrosUI() {
    const estadoUI = {
        busquedaRapida: $('#busquedaRapida').val(),
        filtroEstado: $('#filtroEstado').val(),
        filtroTipo: $('#filtroTipo').val(),
        // Guardar qué botón rápido está activo
        botonActivoClass: $('.btn-filtro-activo').data('filtro') || null
    };

    // Guardar en variable global
    window.estadoFiltrosUI = estadoUI;
    
    console.log('💾 Estado de filtros UI guardado:', estadoUI);
    return estadoUI;
}

/**
 * ✅ FUNCIÓN: Restaurar estado de filtros en la UI
 */
function restaurarEstadoFiltrosUI() {
    try {
        const estado = window.estadoFiltrosUI;
        if (!estado) return;

        console.log('🔄 Restaurando estado de filtros UI:', estado);

        // Restaurar valores en inputs
        $('#busquedaRapida').val(estado.busquedaRapida || '');
        $('#filtroEstado').val(estado.filtroEstado || '');
        $('#filtroTipo').val(estado.filtroTipo || '');

        // ✅ LIMPIAR TODOS LOS EFECTOS PRIMERO
        $('.btn-filtro-rapido').removeClass('btn-filtro-activo').css({
            'border': '',
            'box-shadow': '',
            'font-weight': ''
        });

        // ✅ APLICAR SOLO CONTORNO AL BOTÓN ACTIVO
        if (estado.botonActivoClass) {
            const $botonActivo = $(`.btn-filtro-rapido[data-filtro="${estado.botonActivoClass}"]`);
            if ($botonActivo.length === 0) {
                // Si no encuentra por data-filtro, buscar por ID
                let selectorBoton = '';
                switch (estado.botonActivoClass) {
                    case 'todos':
                        selectorBoton = '#btnMostrarTodos';
                        break;
                    case 'pendientes':
                        selectorBoton = '#btnSoloPendientes';
                        break;
                    case 'discrepancias':
                        selectorBoton = '#btnSoloDiscrepancias';
                        break;
                }

                if (selectorBoton) {
                    $(selectorBoton).addClass('btn-filtro-activo').css({
                        'border': '2px solid #007bff',
                        'box-shadow': '0 0 0 2px rgba(0, 123, 255, 0.25)',
                        'font-weight': 'bold'
                    }).data('filtro', estado.botonActivoClass);
                }
            } else {
                $botonActivo.addClass('btn-filtro-activo').css({
                    'border': '2px solid #007bff',
                    'box-shadow': '0 0 0 2px rgba(0, 123, 255, 0.25)',
                    'font-weight': 'bold'
                });
            }
        }

        console.log('✅ Estado de filtros UI restaurado con contorno');

    } catch (error) {
        console.error('❌ Error restaurando estado de filtros UI:', error);
    }
}


/**
 * ✅ FUNCIÓN MEJORADA: Aplicar filtro rápido con estado visual
 */
function aplicarFiltroRapidoConEstado(tipo, botonElement = null) {
    // Guardar estado antes de cambiar
    guardarEstadoFiltrosUI();

    // ✅ LIMPIAR EFECTOS DE TODOS LOS BOTONES
    $('.btn-filtro-rapido').removeClass('btn-filtro-activo').css({
        'border': '',
        'box-shadow': '',
        'font-weight': ''
    });

    switch (tipo) {
        case 'todos':
            limpiarFiltros();
            break;

        case 'pendientes':
            $('#filtroEstado').val('pendiente');
            filtrarProductos($('#busquedaRapida').val(), 'pendiente', $('#filtroTipo').val());
            break;

        case 'discrepancias':
            $('#filtroEstado').val('discrepancia');
            filtrarProductos($('#busquedaRapida').val(), 'discrepancia', $('#filtroTipo').val());
            break;
    }

    // ✅ APLICAR SOLO EFECTO DE CONTORNO AL BOTÓN ACTIVO
    if (botonElement) {
        $(botonElement).addClass('btn-filtro-activo').css({
            'border': '2px solid #007bff',
            'box-shadow': '0 0 0 2px rgba(0, 123, 255, 0.25)',
            'font-weight': 'bold'
        }).data('filtro', tipo);
    }

    // Guardar nuevo estado
    guardarEstadoFiltrosUI();

    console.log(`⚡ Filtro rápido aplicado con contorno: ${tipo}`);
}

// =====================================
// FUNCIONES DE CONTEO
// =====================================
function abrirModalConteo(productoId) {
    try {
        // ✅ AGREGAR AL INICIO:
        if (inventarioBloqueado && !pinValidado) {
            solicitarPinAdmin();
            return;
        }
        console.log(`📝 === ABRIENDO MODAL DE CONTEO ===`);
        console.log(`📝 Producto ID: ${productoId}`);

        // ✅ VERIFICAR PERMISOS ESPECÍFICOS ANTES DE ABRIR
        const verificacion = verificarPermisoEspecifico('conteo', 'realizar conteo');
        if (!verificacion.tienePermiso) {
            mostrarError(verificacion.mensaje);
            return;
        }

        // ✅ BUSCAR EL PRODUCTO EN LOS DATOS CARGADOS
        const producto = productosInventario.find(p => p.productoId === productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        console.log(`📝 Producto encontrado: ${producto.nombreProducto}`);

        // ✅ LLENAR INFORMACIÓN DEL PRODUCTO EN EL MODAL
        $('#productoIdConteo').val(producto.productoId);
        $('#inventarioIdConteo').val(window.inventarioConfig.inventarioId);
        $('#nombreProductoConteo').text(producto.nombreProducto || 'Sin nombre');
        $('#descripcionProductoConteo').text(producto.descripcionProducto || 'Sin descripción');
        $('#cantidadSistemaConteo').val(producto.cantidadSistema || 0);

        // ✅ IMAGEN DEL PRODUCTO
        const imagenSrc = producto.imagenUrl || '/images/no-image.png';
        $('#imagenProductoConteo').attr('src', imagenSrc).attr('alt', producto.nombreProducto);

        // ✅ INFORMACIÓN DE LLANTA SI APLICA
        if (producto.esLlanta && (producto.marcaLlanta || producto.modeloLlanta)) {
            const especificaciones = [
                producto.marcaLlanta,
                producto.modeloLlanta,
                producto.medidasLlanta
            ].filter(Boolean).join(' - ');

            $('#especificacionesLlanta').text(especificaciones || 'Sin especificaciones');
            $('#medidasLlantaConteo').show();
            $('#tipoProductoConteo').text('Llanta').removeClass('bg-info').addClass('bg-primary');
        } else {
            $('#medidasLlantaConteo').hide();
            $('#tipoProductoConteo').text('Accesorio').removeClass('bg-primary').addClass('bg-info');
        }

        // ✅ MOSTRAR CONTEO ANTERIOR SI EXISTE
        if (producto.cantidadFisica !== null && producto.cantidadFisica !== undefined) {
            $('#cantidadFisicaConteo').val(producto.cantidadFisica);
            console.log(`📝 Cantidad física anterior: ${producto.cantidadFisica}`);
        } else {
            $('#cantidadFisicaConteo').val('');
            console.log(`📝 Sin conteo anterior`);
        }

        // ✅ OBSERVACIONES ANTERIORES
        $('#observacionesConteo').val(producto.observaciones || '');

        // ✅ CALCULAR DIFERENCIA INICIAL
        calcularDiferencia();

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('conteoModal'));
        modal.show();

        // ✅ FOCUS EN EL CAMPO DE CANTIDAD DESPUÉS DE QUE SE ABRA
        $('#conteoModal').on('shown.bs.modal', function () {
            $('#cantidadFisicaConteo').focus().select();
        });

        console.log(`✅ Modal de conteo abierto exitosamente`);

    } catch (error) {
        console.error('❌ Error abriendo modal de conteo:', error);
        mostrarError('Error al abrir el modal de conteo');
    }
}


function calcularDiferencia() {
    try {
        const cantidadSistema = parseInt($('#cantidadSistemaConteo').val()) || 0;
        const cantidadFisica = parseInt($('#cantidadFisicaConteo').val()) || 0;
        const diferencia = cantidadFisica - cantidadSistema;

        console.log(`🧮 Calculando diferencia: Sistema=${cantidadSistema}, Físico=${cantidadFisica}, Diferencia=${diferencia}`);

        // ✅ MOSTRAR/OCULTAR ALERTA DE DISCREPANCIA
        const $alerta = $('#alertaDiferencia');
        const $textoDiferencia = $('#textoDiferencia');

        if (diferencia !== 0 && cantidadFisica > 0) {
            // Hay discrepancia
            let mensaje = '';
            let claseAlerta = '';

            if (diferencia > 0) {
                mensaje = `Exceso de ${diferencia} unidad${diferencia !== 1 ? 'es' : ''}`;
                claseAlerta = 'alert-warning';
                $textoDiferencia.text(`+${diferencia} unidades`).removeClass('text-danger text-muted').addClass('text-warning');
            } else {
                mensaje = `Faltante de ${Math.abs(diferencia)} unidad${Math.abs(diferencia) !== 1 ? 'es' : ''}`;
                claseAlerta = 'alert-danger';
                $textoDiferencia.text(`${diferencia} unidades`).removeClass('text-warning text-muted').addClass('text-danger');
            }

            $alerta.removeClass('alert-info alert-warning alert-danger').addClass(claseAlerta);
            $alerta.find('strong').text('Discrepancia detectada:');
            $alerta.find('span').text(mensaje);
            $alerta.show();

        } else {
            // Sin discrepancia o sin cantidad física
            if (cantidadFisica > 0) {
                $alerta.removeClass('alert-warning alert-danger').addClass('alert-success');
                $alerta.find('strong').text('Conteo correcto:');
                $alerta.find('span').text('Las cantidades coinciden');
                $textoDiferencia.text('0 unidades').removeClass('text-danger text-warning').addClass('text-muted');
                $alerta.show();
            } else {
                $alerta.hide();
                $textoDiferencia.text('0 unidades').removeClass('text-danger text-warning').addClass('text-muted');
            }
        }

    } catch (error) {
        console.error('❌ Error calculando diferencia:', error);
    }
}

async function guardarConteoProducto() {
    try {
        console.log('💾 === INICIANDO GUARDADO DE CONTEO ===');

        // ✅ OBTENER DATOS DEL MODAL
        const inventarioId = $('#inventarioIdConteo').val();
        const productoId = $('#productoIdConteo').val();
        const cantidadFisica = parseInt($('#cantidadFisicaConteo').val());
        const observaciones = $('#observacionesConteo').val()?.trim() || '';

        console.log('📊 Datos del conteo:', {
            inventarioId,
            productoId,
            cantidadFisica,
            observaciones
        });

        // ✅ VALIDACIONES
        if (!inventarioId || !productoId) {
            mostrarError('Faltan datos del inventario o producto');
            return;
        }

        if (isNaN(cantidadFisica) || cantidadFisica < 0) {
            mostrarError('Debes ingresar una cantidad física válida (mayor o igual a 0)');
            $('#cantidadFisicaConteo').focus();
            return;
        }

        // ✅ OBTENER BOTÓN Y MANEJAR ESTADO SEGURO
        const $btn = $('#btnGuardarConteo');
        if (!$btn.length) {
            console.error('❌ No se encontró el botón de guardar');
            mostrarError('Error en la interfaz: botón no encontrado');
            return;
        }

        // ✅ GUARDAR ESTADO ORIGINAL Y CAMBIAR A LOADING
        const estadoOriginal = {
            disabled: $btn.prop('disabled'),
            html: $btn.html()
        };

        console.log('🔄 Cambiando botón a estado de carga...');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        // ✅ OBTENER USUARIO ACTUAL
        const usuarioId = window.inventarioConfig?.usuarioId || 1;

        // ✅ CREAR OBJETO DE CONTEO
        const conteoData = {
            inventarioProgramadoId: parseInt(inventarioId),
            productoId: parseInt(productoId),
            usuarioId: usuarioId,
            cantidadFisica: cantidadFisica,
            observaciones: observaciones || null,
            fechaConteo: new Date().toISOString()
        };

        console.log('📤 Enviando datos de conteo:', conteoData);

        // ✅ ENVIAR A LA API
        const response = await fetch('/TomaInventario/RegistrarConteo', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conteoData)
        });

        console.log('📡 Respuesta recibida:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();
        console.log('✅ Resultado exitoso:', resultado);

        // ✅ MOSTRAR MENSAJE DE ÉXITO
        if (resultado.hayDiscrepancia) {
            mostrarExito(`Conteo guardado. Discrepancia de ${resultado.diferencia} unidades detectada.`);
        } else {
            mostrarExito('Conteo guardado exitosamente');
        }

        // ✅ CERRAR MODAL
        const modal = bootstrap.Modal.getInstance(document.getElementById('conteoModal'));
        if (modal) {
            modal.hide();
        }

        // ✅ RECARGAR PRODUCTOS Y ESTADÍSTICAS
        await cargarProductosInventario(inventarioId);
        await actualizarEstadisticasUI();

        console.log('🎉 Conteo guardado y datos actualizados');

    } catch (error) {
        console.error('❌ Error guardando conteo:', error);
        mostrarError(`Error al guardar conteo: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN SIEMPRE
        try {
            const $btn = $('#btnGuardarConteo');
            if ($btn.length) {
                $btn.prop('disabled', false);
                $btn.find('.loading-state').hide();
                $btn.find('.normal-state').show();
            }
        } catch (btnError) {
            console.error('❌ Error restaurando botón:', btnError);
        }
    }
}


function limpiarModalConteo() {
    $('#modalProductoId').val('');
    $('#modalInventarioId').val('');
    $('#cantidadFisica').val('');
    $('#observaciones').val('');
    $('#alertaDiscrepancia').addClass('d-none');
    $('#modalProductoLlanta').hide();
}

// =====================================
// FUNCIONES DE ESTADÍSTICAS
// =====================================
async function actualizarEstadisticas() {
    try {
        if (!inventarioActual) return;

        const inventarioId = inventarioActual.inventarioProgramadoId;
        const response = await fetch(`/TomaInventario/ObtenerProgreso/${inventarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('⚠️ No se pudieron cargar las estadísticas');
            return;
        }

        const progreso = await response.json();

        // Actualizar estadísticas en la UI
        $('#statTotal').text(progreso.totalProductos || 0);
        $('#statContados').text(progreso.productosContados || 0);
        $('#statPendientes').text(progreso.productosPendientes || 0);
        $('#statDiscrepancias').text(progreso.discrepancias || 0);

        // Actualizar barra de progreso
        const porcentaje = progreso.porcentajeProgreso || 0;
        $('#barraProgreso').css('width', `${porcentaje}%`).attr('aria-valuenow', porcentaje);
        $('#progresoTexto').text(`${progreso.productosContados || 0} / ${progreso.totalProductos || 0} productos`);

        // Cambiar color de la barra según el progreso
        const $barra = $('#barraProgreso');
        $barra.removeClass('bg-danger bg-warning bg-info bg-success');
        if (porcentaje < 25) {
            $barra.addClass('bg-danger');
        } else if (porcentaje < 50) {
            $barra.addClass('bg-warning');
        } else if (porcentaje < 90) {
            $barra.addClass('bg-info');
        } else {
            $barra.addClass('bg-success');
        }


        console.log(`📊 Estadísticas actualizadas correctamente: ${porcentaje}% completado`);

        // ✅ AGREGAR ESTAS LÍNEAS AL FINAL:
        // Preservar filtros después de actualización
        setTimeout(() => {
            restaurarEstadoFiltrosUI();
        }, 200);

    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

// =====================================
// FUNCIONES PARA COMPLETAR INVENTARIO
// =====================================
function mostrarModalCompletarInventario() {
    const stats = estadisticasActuales;
    const inventario = inventarioActual;

    const resumen = `
        <div class="row text-center">
            <div class="col-3">
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold">${stats.total || 0}</div>
                        <small>Total</small>
                    </div>
                </div>
            </div>
            <div class="col-3">
                <div class="card bg-success bg-opacity-10">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold text-success">${stats.contados || 0}</div>
                        <small>Contados</small>
                    </div>
                </div>
            </div>
            <div class="col-3">
                <div class="card bg-warning bg-opacity-10">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold text-warning">${stats.pendientes || 0}</div>
                        <small>Pendientes</small>
                    </div>
                </div>
            </div>
            <div class="col-3">
                <div class="card bg-danger bg-opacity-10">
                    <div class="card-body py-2">
                        <div class="fs-5 fw-bold text-danger">${stats.discrepancias || 0}</div>
                        <small>Discrepancias</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#resumenCompletarInventario').html(resumen);
    $('#modalCompletarInventario').modal('show');
}

async function completarInventario() {
    try {
        const inventarioId = inventarioActual.inventarioProgramadoId;

        // Deshabilitar botón
        const $btn = $('#btnConfirmarCompletar');
        const textoOriginal = $btn.html();
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Completando...');

        console.log(`🏁 Completando inventario ${inventarioId}...`);

        const response = await fetch(`/api/TomaInventario/${inventarioId}/completar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        console.log('✅ Inventario completado exitosamente:', resultado);

        // Cerrar modal
        $('#modalCompletarInventario').modal('hide');

        // Mostrar mensaje de éxito
        mostrarExito(`Inventario completado exitosamente. Total: ${resultado.totalProductos} productos, Discrepancias: ${resultado.discrepancias}`);

        // Recargar información del inventario
        await cargarInformacionInventario(inventarioId);
        await cargarProductosInventario(inventarioId);

        // Ocultar botón de completar
        $('#btnCompletarInventario').hide();

    } catch (error) {
        console.error('❌ Error completando inventario:', error);
        mostrarError(`Error al completar inventario: ${error.message}`);
    } finally {
        // Restaurar botón
        $('#btnConfirmarCompletar').prop('disabled', false).html(textoOriginal);
    }
}

// =====================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// =====================================

/**
 * ✅ FUNCIÓN LIMPIA: Actualizar estadísticas UI con protección de barra
 */
function actualizarEstadisticasUI() {
    try {
        console.log('📊 Actualizando estadísticas UI...');
        console.log('📊 Estadísticas actuales:', estadisticasActuales);

        if (!estadisticasActuales) {
            console.warn('⚠️ No hay estadísticas para actualizar');
            return;
        }

        const porcentaje = estadisticasActuales.porcentajeProgreso || 0;

        // ✅ ACTUALIZAR CONTADORES
        $('#totalProductos').text(estadisticasActuales.total || 0);
        $('#productosContados').text(estadisticasActuales.contados || 0);
        $('#productosPendientes').text(estadisticasActuales.pendientes || 0);
        $('#discrepancias').text(estadisticasActuales.discrepancias || 0);
        $('#contadorProductosMostrados').text(productosInventario.length);

        // ✅ ACTUALIZAR BARRA DE PROGRESO (PROTEGIDA)
        $('#porcentajeProgreso').text(`${porcentaje}%`);
        $('#barraProgreso').css('width', `${porcentaje}%`);
        $('#barraProgreso').attr('aria-valuenow', porcentaje);

        // ✅ ACTUALIZAR COLOR DE LA BARRA
        const $barra = $('#barraProgreso');
        $barra.removeClass('bg-danger bg-warning bg-info bg-success progress-bar-striped progress-bar-animated');

        if (porcentaje < 25) {
            $barra.addClass('bg-danger progress-bar-striped progress-bar-animated');
        } else if (porcentaje < 50) {
            $barra.addClass('bg-warning progress-bar-striped progress-bar-animated');
        } else if (porcentaje < 90) {
            $barra.addClass('bg-info progress-bar-striped progress-bar-animated');
        } else {
            $barra.addClass('bg-success');
        }

        // ✅ PROTECCIÓN MÁS FUERTE
        setTimeout(() => {
            if ($('#barraProgreso').css('width') === '0px' && porcentaje > 0) {
                $('#barraProgreso').css('width', `${porcentaje}%`);
                $('#porcentajeProgreso').text(`${porcentaje}%`);
                console.log(`🛡️ Barra restaurada a: ${porcentaje}%`);
            }
        }, 500);

        // Protección continua contra auto-refresh
        if (!window.barraProteccionInterval) {
            window.barraProteccionInterval = setInterval(() => {
                if (estadisticasActuales && estadisticasActuales.porcentajeProgreso > 0) {
                    const porcentajeActual = estadisticasActuales.porcentajeProgreso;
                    const anchoActual = $('#barraProgreso').css('width');

                    if (anchoActual === '0px') {
                        $('#barraProgreso').css('width', `${porcentajeActual}%`);
                        $('#porcentajeProgreso').text(`${porcentajeActual}%`);
                        console.log(`🔒 Auto-protección: Barra restaurada a ${porcentajeActual}%`);
                    }
                }
            }, 1000);
        }

        console.log(`✅ Estadísticas actualizadas: ${porcentaje}% completado`);

        // ✅ MOSTRAR PANELES SEGÚN PROGRESO
        mostrarPanelesSegunProgreso();

    } catch (error) {
        console.error('❌ Error actualizando estadísticas UI:', error);
    }
}

// =====================================
// FUNCIONES AUXILIARES
// =====================================
function getInventarioIdFromUrl() {
    const path = window.location.pathname;
    console.log('🔍 Analizando path:', path);

    // Buscar patrón: /TomaInventario/Ejecutar/[número]
    const matches = path.match(/\/TomaInventario\/Ejecutar\/(\d+)/);
    const id = matches ? parseInt(matches[1]) : null;

    console.log('🔍 ID extraído de URL:', id);
    return id;
}

function actualizarVistaPreviaAjuste() {
    try {
        const tipoAjuste = $('#tipoAjusteInventario').val();
        const producto = productosInventario.find(p => p.productoId == $('#productoIdAjuste').val());

        if (!tipoAjuste || !producto) {
            $('#vistaPreviaAjuste').hide();
            return;
        }

        const stockActual = producto.cantidadSistema || 0;
        const stockFisico = producto.cantidadFisica || 0;
        let stockFinal = stockActual;
        let accionTexto = '';

        switch (tipoAjuste) {
            case 'ajustar-sistema':
                stockFinal = parseInt($('#cantidadAjusteInventario').val()) || stockFisico;
                accionTexto = 'Ajustar al físico';
                break;
            case 'reconteo':
                stockFinal = stockActual;
                accionTexto = 'Recontar';
                break;
            case 'verificacion':
                stockFinal = stockActual;
                accionTexto = 'Verificar';
                break;
        }

        $('#stockActualPreviewAjuste').text(stockActual);
        $('#stockFisicoPreviewAjuste').text(stockFisico);
        $('#accionPreviewAjuste').text(accionTexto);
        $('#stockFinalPreviewAjuste').text(stockFinal);

        $('#vistaPreviaAjuste').show();

    } catch (error) {
        console.error('❌ Error actualizando vista previa:', error);
    }
}

async function guardarAjusteInventario() {
    try {
        console.log('💾 === GUARDANDO AJUSTE COMO PENDIENTE ===');

        const productoId = $('#productoIdAjuste').val();
        const tipoAjuste = $('#tipoAjusteInventario').val();
        const motivo = $('#motivoAjusteInventario').val()?.trim();

        // ✅ VALIDACIONES
        if (!productoId || !tipoAjuste || !motivo) {
            mostrarError('Todos los campos son obligatorios');
            return;
        }

        if (motivo.length < 10) {
            mostrarError('El motivo debe tener al menos 10 caracteres');
            $('#motivoAjusteInventario').focus();
            return;
        }

        // ✅ OBTENER DATOS DEL PRODUCTO
        const producto = productosInventario.find(p => p.productoId == productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        // ✅ OBTENER BOTÓN Y MANEJAR ESTADO
        const $btn = $('#guardarAjusteInventarioBtn');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        // ✅ PREPARAR DATOS SEGÚN EL TIPO DE AJUSTE
        let ajusteData = {
            inventarioProgramadoId: window.inventarioConfig.inventarioId,
            productoId: parseInt(productoId),
            tipoAjuste: tipoAjuste,
            cantidadSistemaOriginal: producto.cantidadSistema || 0,
            cantidadFisicaContada: producto.cantidadFisica || 0,
            motivoAjuste: motivo,
            usuarioId: window.inventarioConfig.usuarioId
        };

        // ✅ AGREGAR CANTIDAD FINAL SOLO PARA AJUSTE AL SISTEMA
        if (tipoAjuste === 'ajustar-sistema') {
            ajusteData.cantidadFinalPropuesta = parseInt($('#cantidadAjusteInventario').val());
        }

        console.log('📤 Enviando ajuste pendiente:', ajusteData);

        // ✅ LLAMAR AL NUEVO ENDPOINT
        const response = await fetch(`/TomaInventario/${window.inventarioConfig.inventarioId}/ajustar-discrepancia`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ajusteData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();
        console.log('✅ Resultado exitoso:', resultado);

        if (resultado.success) {
            // ✅ MOSTRAR MENSAJE ESPECÍFICO SEGÚN EL TIPO
            let mensaje = '';
            switch (tipoAjuste) {
                case 'ajustar-sistema':
                    mensaje = `Ajuste registrado: Stock se actualizará a ${resultado.data.cantidadFinalPropuesta} al completar el inventario`;
                    break;
                case 'reconteo':
                    mensaje = 'Producto marcado para reconteo. Un supervisor deberá verificarlo';
                    break;
                case 'verificacion':
                    mensaje = 'Discrepancia marcada como verificada y aceptada';
                    break;
                default:
                    mensaje = 'Ajuste registrado exitosamente';
            }

            mostrarExito(mensaje);

            // ✅ CERRAR MODAL
            const modal = bootstrap.Modal.getInstance(document.getElementById('ajusteStockInventarioModal'));
            if (modal) {
                modal.hide();
            }

            // ✅ ACTUALIZAR LA VISTA - MARCAR PRODUCTO COMO AJUSTADO
            actualizarProductoConAjustePendiente(productoId, resultado.data);

            // ✅ RECARGAR ESTADÍSTICAS
            await actualizarEstadisticasUI();

            console.log('🎉 Ajuste pendiente guardado y vista actualizada');
        } else {
            throw new Error(resultado.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error guardando ajuste pendiente:', error);
        mostrarError(`Error al guardar ajuste: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN SIEMPRE
        try {
            const $btn = $('#guardarAjusteInventarioBtn');
            if ($btn.length) {
                $btn.prop('disabled', false);
                $btn.find('.loading-state').hide();
                $btn.find('.normal-state').show();
            }
        } catch (btnError) {
            console.error('❌ Error restaurando botón:', btnError);
        }
    }
}

// ✅ NUEVA FUNCIÓN: Actualizar la vista cuando se crea un ajuste pendiente
function actualizarProductoConAjustePendiente(productoId, ajusteData) {
    try {
        console.log('🔄 Actualizando vista del producto con ajuste pendiente');

        // ✅ ENCONTRAR EL PRODUCTO EN LOS DATOS
        const producto = productosInventario.find(p => p.productoId == productoId);
        if (!producto) {
            console.error('Producto no encontrado para actualizar');
            return;
        }

        // ✅ MARCAR EL PRODUCTO COMO QUE TIENE AJUSTE PENDIENTE
        producto.tieneAjustePendiente = true;
        producto.tipoAjustePendiente = ajusteData.tipoAjuste;
        producto.motivoAjuste = ajusteData.motivo;

        // ✅ ACTUALIZAR LA FILA EN LA TABLA
        const $fila = $(`.producto-row[data-producto-id="${productoId}"]`);
        if ($fila.length) {
            // Agregar clase visual para indicar ajuste pendiente
            $fila.addClass('producto-con-ajuste-pendiente');

            // Actualizar el badge de estado
            const $estadoCell = $fila.find('td:nth-child(7)'); // Columna de estado
            const estadoOriginal = $estadoCell.html();

            let badgeAjuste = '';
            switch (ajusteData.tipoAjuste) {
                case 'ajustar-sistema':
                    badgeAjuste = '<span class="badge bg-warning ms-1">📝 Ajuste Pendiente</span>';
                    break;
                case 'reconteo':
                    badgeAjuste = '<span class="badge bg-info ms-1">🔄 Para Recontar</span>';
                    break;
                case 'verificacion':
                    badgeAjuste = '<span class="badge bg-success ms-1">✅ Verificado</span>';
                    break;
            }

            $estadoCell.html(estadoOriginal + badgeAjuste);

            // ✅ ACTUALIZAR BOTONES DE ACCIÓN
            const $accionesCell = $fila.find('td:last-child');
            const botonesOriginales = $accionesCell.html();

            // Agregar botón para ver ajustes
            const btnVerAjustes = `
                <button class="btn btn-sm btn-outline-secondary ms-1" 
                        onclick="verAjustesProducto(${productoId})"
                        data-bs-toggle="tooltip"
                        title="Ver ajustes pendientes">
                    <i class="bi bi-list-ul"></i>
                </button>
            `;

            $accionesCell.html(botonesOriginales + btnVerAjustes);
        }

        console.log('✅ Vista del producto actualizada correctamente');

    } catch (error) {
        console.error('❌ Error actualizando vista del producto:', error);
    }
}

/**
 * ✅ FUNCIÓN CORREGIDA: Ver ajustes de un producto con popup rápido
 * REEMPLAZAR la función existente o AGREGAR si no existe
 */
async function verAjustesProducto(productoId) {
    try {
        console.log('👁️ Mostrando ajustes del producto:', productoId);

        // ✅ BUSCAR AJUSTES LOCALES DEL PRODUCTO
        const ajustesProducto = ajustesPendientes.filter(ajuste =>
            ajuste.productoId === productoId &&
            (ajuste.estado === 'Pendiente' || ajuste.estado === 'pendiente' || !ajuste.estado)
        );

        if (ajustesProducto.length === 0) {
            mostrarInfo('Este producto no tiene ajustes pendientes');
            return;
        }

        // ✅ OBTENER DATOS DEL PRODUCTO
        const producto = productosInventario.find(p => p.productoId === productoId);
        const nombreProducto = producto ? producto.nombreProducto : `Producto ${productoId}`;

        // ✅ CREAR RESUMEN RÁPIDO Y VISUAL
        let htmlResumen = `
            <div class="text-start">
                <h5 class="text-primary mb-3">
                    <i class="bi bi-clipboard-check me-2"></i>
                    Ajustes Pendientes
                </h5>
                
                <div class="alert alert-info">
                    <strong>📦 Producto:</strong> ${nombreProducto}<br>
                    <strong>🔄 Ajustes encontrados:</strong> ${ajustesProducto.length}
                </div>
        `;

        // ✅ MOSTRAR CADA AJUSTE DE FORMA VISUAL Y SIMPLE
        ajustesProducto.forEach((ajuste, index) => {
            const diferencia = ajuste.cantidadFinalPropuesta - ajuste.cantidadSistemaOriginal;
            const diferenciaTexto = diferencia > 0 ? `+${diferencia}` : `${diferencia}`;
            const diferenciaColor = diferencia > 0 ? 'text-success' : diferencia < 0 ? 'text-danger' : 'text-muted';

            const tipoTexto = obtenerTextoTipoAjuste(ajuste.tipoAjuste);
            const fechaCreacion = ajuste.fechaCreacion ? new Date(ajuste.fechaCreacion).toLocaleDateString() : 'Hoy';

            htmlResumen += `
                <div class="card mb-2 border-left-primary">
                    <div class="card-body py-2">
                        <div class="row align-items-center">
                            <div class="col-3">
                                <div class="text-center">
                                    <div class="h6 mb-0">${ajuste.cantidadSistemaOriginal}</div>
                                    <small class="text-muted">Sistema</small>
                                </div>
                            </div>
                            <div class="col-2 text-center">
                                <i class="bi bi-arrow-right h4 text-primary"></i>
                            </div>
                            <div class="col-3">
                                <div class="text-center">
                                    <div class="h6 mb-0 text-primary">${ajuste.cantidadFinalPropuesta}</div>
                                    <small class="text-muted">Propuesto</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-end">
                                    <span class="badge bg-primary">${tipoTexto}</span><br>
                                    <span class="fw-bold ${diferenciaColor}">${diferenciaTexto} unidades</span>
                                </div>
                            </div>
                        </div>
                        
                        ${ajuste.motivoAjuste ? `
                            <div class="mt-2 pt-2 border-top">
                                <small class="text-muted">
                                    <strong>Motivo:</strong> ${ajuste.motivoAjuste}
                                </small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        htmlResumen += `
                <div class="alert alert-warning mt-3">
                    <small>
                        <i class="bi bi-info-circle me-1"></i>
                        Estos ajustes se aplicarán al stock cuando se complete el inventario.
                    </small>
                </div>
            </div>
        `;

        // ✅ MOSTRAR POPUP CON BOTONES DE ACCIÓN
        const resultado = await Swal.fire({
            title: `📋 Ajustes de ${nombreProducto}`,
            html: htmlResumen,
            icon: 'info',
            showCancelButton: true,
            showDenyButton: ajustesProducto.length === 1, // Solo mostrar editar si hay 1 ajuste
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            denyButtonColor: '#ffc107',
            confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Entendido',
            cancelButtonText: '<i class="bi bi-trash me-1"></i> Eliminar Ajuste',
            denyButtonText: '<i class="bi bi-pencil me-1"></i> Editar Ajuste',
            width: '600px',
            customClass: {
                popup: 'swal-wide'
            }
        });

        // ✅ MANEJAR ACCIONES DEL USUARIO
        if (resultado.isDenied && ajustesProducto.length === 1) {
            // Editar ajuste
            editarAjustePendiente(ajustesProducto[0].ajusteId);
        } else if (resultado.isDismissed && resultado.dismiss === 'cancel') {
            // Eliminar ajuste
            if (ajustesProducto.length === 1) {
                eliminarAjustePendiente(ajustesProducto[0].ajusteId);
            } else {
                // Si hay múltiples, preguntar cuál eliminar
                mostrarSeleccionarAjusteParaEliminar(ajustesProducto);
            }
        }

    } catch (error) {
        console.error('❌ Error mostrando ajustes del producto:', error);
        mostrarError('Error al mostrar los ajustes del producto');
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Seleccionar ajuste para eliminar cuando hay múltiples
 */
async function mostrarSeleccionarAjusteParaEliminar(ajustes) {
    try {
        let opcionesHtml = '<div class="text-start">';

        ajustes.forEach((ajuste, index) => {
            const tipoTexto = obtenerTextoTipoAjuste(ajuste.tipoAjuste);
            const diferencia = ajuste.cantidadFinalPropuesta - ajuste.cantidadSistemaOriginal;

            opcionesHtml += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="ajusteSeleccionado" 
                           id="ajuste${ajuste.ajusteId}" value="${ajuste.ajusteId}">
                    <label class="form-check-label" for="ajuste${ajuste.ajusteId}">
                        ${tipoTexto} - ${diferencia > 0 ? '+' : ''}${diferencia} unidades
                        <br><small class="text-muted">${ajuste.motivoAjuste}</small>
                    </label>
                </div>
            `;
        });

        opcionesHtml += '</div>';

        const resultado = await Swal.fire({
            title: '🗑️ ¿Qué ajuste quieres eliminar?',
            html: opcionesHtml,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Eliminar Seleccionado',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const seleccionado = document.querySelector('input[name="ajusteSeleccionado"]:checked');
                if (!seleccionado) {
                    Swal.showValidationMessage('Debes seleccionar un ajuste');
                    return false;
                }
                return seleccionado.value;
            }
        });

        if (resultado.isConfirmed) {
            eliminarAjustePendiente(parseInt(resultado.value));
        }

    } catch (error) {
        console.error('❌ Error en selección de ajuste:', error);
    }
}


// ✅ NUEVA FUNCIÓN: Mostrar modal con ajustes de un producto
function mostrarModalAjustesProducto(ajustes) {
    let html = `
        <div class="modal fade" id="modalAjustesProducto" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-list-ul me-2"></i>
                            Ajustes Pendientes del Producto
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Sistema</th>
                                        <th>Físico</th>
                                        <th>Propuesta</th>
                                        <th>Estado</th>
                                        <th>Usuario</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;

    ajustes.forEach(ajuste => {
        const fecha = new Date(ajuste.fechaCreacion).toLocaleDateString();
        const diferencia = ajuste.cantidadFisicaContada - ajuste.cantidadSistemaOriginal;

        html += `
            <tr>
                <td>${fecha}</td>
                <td>
                    <span class="badge ${getTipoBadgeClass(ajuste.tipoAjuste)}">
                        ${getTipoAjusteTexto(ajuste.tipoAjuste)}
                    </span>
                </td>
                <td>${ajuste.cantidadSistemaOriginal}</td>
                <td>${ajuste.cantidadFisicaContada}</td>
                <td>${ajuste.cantidadFinalPropuesta}</td>
                <td>
                    <span class="badge ${getEstadoBadgeClass(ajuste.estado)}">
                        ${ajuste.estado}
                    </span>
                </td>
                <td>${ajuste.nombreUsuario || 'Sin usuario'}</td>
            </tr>
        `;
    });

    html += `
                                </tbody>
                            </table>
                        </div>
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-info-circle me-2"></i>
                            Los ajustes se aplicarán al stock del sistema cuando se complete el inventario.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalAjustesProducto').remove();

    // Agregar al DOM y mostrar
    $('body').append(html);
    $('#modalAjustesProducto').modal('show');
}

// ✅ FUNCIONES AUXILIARES PARA LOS BADGES
function getTipoBadgeClass(tipo) {
    switch (tipo) {
        case 'ajustar-sistema': return 'bg-warning';
        case 'reconteo': return 'bg-info';
        case 'verificacion': return 'bg-success';
        default: return 'bg-secondary';
    }
}

function getTipoAjusteTexto(tipo) {
    switch (tipo) {
        case 'ajustar-sistema': return 'Ajustar Stock';
        case 'reconteo': return 'Recontar';
        case 'verificacion': return 'Verificado';
        default: return tipo;
    }
}

function getEstadoBadgeClass(estado) {
    switch (estado.toLowerCase()) {
        case 'pendiente': return 'bg-warning';
        case 'aplicado': return 'bg-success';
        case 'rechazado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}


// ✅ HACER FUNCIONES GLOBALES (agregar al final del archivo)
window.actualizarAjustePendiente = actualizarAjustePendiente;
// ✅ HACER LAS FUNCIONES GLOBALES
window.verAjustesProducto = verAjustesProducto;
window.guardarAjusteInventario = guardarAjusteInventario;
window.verResumenCompleto = verResumenCompleto;
window.exportarInventario = exportarInventario;
window.finalizarInventarioCompleto = finalizarInventarioCompleto;
// ✅ HACER FUNCIÓN GLOBAL
window.abrirModalAjustePendiente = abrirModalAjustePendiente;
window.verDetallesProducto = verDetallesProducto;
// ✅ HACER FUNCIONES GLOBALES
window.editarAjustePendiente = editarAjustePendiente;
window.eliminarAjustePendiente = eliminarAjustePendiente;
window.limpiarModalAjustePendiente = limpiarModalAjustePendiente;



function obtenerUsuarioId() {
    // Esta función debería obtener el ID del usuario actual
    // Puedes implementarla según tu sistema de autenticación
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(payload.userId || payload.nameid || payload.sub);
        }
    } catch (error) {
        console.error('Error obteniendo ID de usuario:', error);
    }
    return 1; // Fallback
}

function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);

    // Usar SweetAlert2 si está disponible, sino usar alert nativo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } else {
        alert(`Error: ${mensaje}`);
    }
}

function mostrarExito(mensaje) {
    console.log('✅ Éxito:', mensaje);

    // Usar SweetAlert2 si está disponible, sino usar alert nativo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Éxito',
            text: mensaje,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert(`Éxito: ${mensaje}`);
    }
}

function mostrarInfo(mensaje) {
    console.log('ℹ️ Info:', mensaje);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Información',
            text: mensaje,
            icon: 'info',
            confirmButtonColor: '#0dcaf0'
        });
    } else {
        alert(`Info: ${mensaje}`);
    }
}

function crearBotonesAccion(producto) {
    try {
        // ✅ OBTENER PERMISOS DESDE CONFIGURACIÓN GLOBAL
        const permisos = window.inventarioConfig?.permisos || {};
        const inventarioEnProgreso = inventarioActual?.estado === 'En Progreso';

        console.log('🔒 Permisos del usuario:', permisos);
        console.log('📊 Estado del inventario en progreso:', inventarioEnProgreso);

        let botones = '';

        // ✅ BOTÓN DE CONTAR (si tiene permiso y el inventario está en progreso)
        if ((permisos.puedeContar || permisos.esAdmin) && inventarioEnProgreso) {
            const textoBoton = producto.estadoConteo === 'Contado' ? 'Recontar' : 'Contar';
            const iconoBoton = producto.estadoConteo === 'Contado' ? 'bi-arrow-clockwise' : 'bi-calculator';

            botones += `
                <button class="btn btn-sm btn-primary btn-contar me-1" 
                        onclick="abrirModalConteo(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="${textoBoton} producto">
                    <i class="bi ${iconoBoton} me-1"></i>
                    ${textoBoton}
                </button>
            `;
        }

        // ✅ BOTÓN DE AJUSTE (solo si tiene permiso, hay discrepancia y el inventario está en progreso)
        if ((permisos.puedeAjustar || permisos.esAdmin) && producto.tieneDiscrepancia && inventarioEnProgreso) {
            botones += `
                <button class="btn btn-sm btn-warning btn-ajustar me-1" 
                        onclick="abrirModalAjuste(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Ajustar discrepancia en el sistema">
                    <i class="bi bi-tools me-1"></i>
                    Ajustar
                </button>
            `;
        }

        // ✅ BOTÓN DE VALIDACIÓN (solo si tiene permiso y hay discrepancia)
        if ((permisos.puedeValidar || permisos.esAdmin) && producto.tieneDiscrepancia) {
            botones += `
                <button class="btn btn-sm btn-info btn-validar me-1" 
                        onclick="abrirModalValidacion(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Validar y aprobar discrepancia">
                    <i class="bi bi-check-double me-1"></i>
                    Validar
                </button>
            `;
        }

        // ✅ BOTÓN INFORMATIVO si no tiene permisos
        if (!botones) {
            let razon = '';
            if (!inventarioEnProgreso) {
                razon = 'Inventario no está en progreso';
            } else if (!permisos.puedeContar && !permisos.esAdmin) {
                razon = 'Sin permisos de conteo';
            } else {
                razon = 'Sin acciones disponibles';
            }

            botones = `
                <button class="btn btn-sm btn-secondary" disabled 
                        data-bs-toggle="tooltip" 
                        title="${razon}">
                    <i class="bi bi-lock me-1"></i>
                    Sin acceso
                </button>
            `;
        }

        return botones;

    } catch (error) {
        console.error('❌ Error creando botones de acción:', error);
        return `
            <button class="btn btn-sm btn-secondary" disabled>
                <i class="bi bi-exclamation-triangle me-1"></i>
                Error
            </button>
        `;
    }
}

function abrirModalValidacion(productoId) {
    mostrarInfo('Función de validación en desarrollo');
}

window.abrirModalConteo = abrirModalConteo;
window.mostrarModalCompletarInventario = mostrarModalCompletarInventario;
window.completarInventario = completarInventario;


/**
 * ✅ FUNCIÓN CORREGIDA: Abrir modal de ajuste pendiente para CREAR
 */
function abrirModalAjustePendiente(productoId) {
    try {
        // ✅ AGREGAR AL INICIO:
        if (inventarioBloqueado && !pinValidado) {
            solicitarPinAdmin();
            return;
        }
        console.log(`🔄 === ABRIENDO MODAL PARA CREAR AJUSTE ===`);
        console.log(`🔄 Producto ID: ${productoId}`);

        // ✅ VERIFICAR PERMISOS ESPECÍFICOS ANTES DE ABRIR
        const verificacion = verificarPermisoEspecifico('ajuste', 'crear ajuste pendiente');
        if (!verificacion.tienePermiso) {
            mostrarError(verificacion.mensaje);
            return;
        }

        // ✅ BUSCAR EL PRODUCTO
        const producto = productosInventario.find(p => p.productoId === productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        // ✅ VERIFICAR QUE HAYA DISCREPANCIA
        if (!producto.tieneDiscrepancia) {
            mostrarError('Este producto no tiene discrepancias para ajustar');
            return;
        }

        // ✅ VERIFICAR QUE NO TENGA AJUSTE PENDIENTE YA
        if (verificarAjustePendiente(producto.productoId)) {
            mostrarError('Este producto ya tiene un ajuste pendiente. Usa "Ver Ajustes" para gestionarlo.');
            return;
        }

        console.log(`🔄 Producto válido para crear ajuste: ${producto.nombreProducto}`);

        // ✅ CONFIGURAR MODAL PARA MODO CREAR
        configurarModalParaCrear(producto);

        // ✅ MOSTRAR EL MODAL
        const modal = new bootstrap.Modal(document.getElementById('ajustePendienteModal'));
        modal.show();

        console.log(`✅ Modal de ajuste pendiente abierto en modo CREAR`);

    } catch (error) {
        console.error('❌ Error abriendo modal para crear:', error);
        mostrarError('Error al abrir el modal de ajuste pendiente');
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Configurar modal para modo CREAR
 */
function configurarModalParaCrear(producto) {
    try {
        console.log('🔧 Configurando modal para modo CREAR');

        // ✅ LIMPIAR TODOS LOS EVENT LISTENERS ANTERIORES
        $('#guardarAjustePendienteBtn').off('click');
        $('#ajustePendienteModal').off('hidden.bs.modal.modo');

        // ✅ CONFIGURAR TÍTULO PARA CREAR
        $('#ajustePendienteModalLabel').html(`
            <i class="bi bi-clock-history me-2"></i>
            Registrar Ajuste Pendiente
        `);

        // ✅ CONFIGURAR TEXTO DEL BOTÓN PARA CREAR
        $('#guardarAjustePendienteBtn').find('.normal-state').html(`
            <i class="bi bi-clock-history me-2"></i>Registrar Ajuste Pendiente
        `);

        // ✅ LLENAR DATOS DEL PRODUCTO
        $('#productoIdAjustePendiente').val(producto.productoId);
        $('#inventarioIdAjustePendiente').val(window.inventarioConfig.inventarioId);
        $('#nombreProductoAjustePendiente').text(producto.nombreProducto || 'Sin nombre');
        $('#stockSistemaAjustePendiente').text(producto.cantidadSistema || 0);
        $('#stockFisicoAjustePendiente').text(producto.cantidadFisica || 0);

        // ✅ MOSTRAR DISCREPANCIA
        const diferencia = producto.diferencia || 0;
        const $discrepancia = $('#discrepanciaAjustePendiente');
        $discrepancia.text(diferencia > 0 ? `+${diferencia}` : diferencia);

        if (diferencia > 0) {
            $discrepancia.removeClass('text-danger').addClass('text-success');
        } else if (diferencia < 0) {
            $discrepancia.removeClass('text-success').addClass('text-danger');
        } else {
            $discrepancia.removeClass('text-success text-danger').addClass('text-muted');
        }

        // ✅ RESETEAR FORMULARIO
        $('#tipoAjustePendiente').val('');
        $('#cantidadFinalPropuesta').val(producto.cantidadFisica || 0);
        $('#motivoAjustePendiente').val('');
        $('#vistaPreviaAjustePendiente').hide();

        // ✅ CONFIGURAR EVENT LISTENER ESPECÍFICO PARA CREAR
        $('#guardarAjustePendienteBtn').on('click.crear', function (e) {
            e.preventDefault();
            console.log('🖱️ Click en botón CREAR ajuste pendiente');
            guardarNuevoAjustePendiente();
        });

        // ✅ CONFIGURAR LIMPIEZA AL CERRAR
        $('#ajustePendienteModal').on('hidden.bs.modal.modo', function () {
            limpiarModalAjustePendiente();
        });

        // ✅ CONFIGURAR VISTA PREVIA
        configurarEventListenersModalAjustePendiente(producto);

        console.log('✅ Modal configurado correctamente para modo CREAR');

    } catch (error) {
        console.error('❌ Error configurando modal para crear:', error);
    }
}
/**
 * ✅ FUNCIÓN ACTUALIZADA: Configurar event listeners específicos del modal
 */
function configurarEventListenersModalAjustePendiente(producto) {
    try {
        // ✅ LIMPIAR LISTENERS ANTERIORES DE VISTA PREVIA
        $('#tipoAjustePendiente').off('change.ajustePendiente');
        $('#motivoAjustePendiente').off('input.ajustePendiente');

        // ✅ CONFIGURAR CAMBIO DE TIPO DE AJUSTE
        $('#tipoAjustePendiente').on('change.ajustePendiente', function () {
            actualizarVistaPreviaAjustePendiente(producto);
        });

        // ✅ ACTUALIZAR VISTA PREVIA AL CAMBIAR MOTIVO
        $('#motivoAjustePendiente').on('input.ajustePendiente', function () {
            actualizarVistaPreviaAjustePendiente(producto);
        });

        console.log('✅ Event listeners de vista previa configurados');

    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

/**
 * ✅ FUNCIÓN NUEVA: Limpiar modal de ajuste pendiente
 */
function limpiarModalAjustePendiente() {
    try {
        console.log('🧹 Limpiando modal de ajuste pendiente...');

        // ✅ LIMPIAR TODOS LOS EVENT LISTENERS
        $('#guardarAjustePendienteBtn').off('click.crear click.editar');
        $('#ajustePendienteModal').off('hidden.bs.modal.modo');
        $('#tipoAjustePendiente').off('change.ajustePendiente');
        $('#motivoAjustePendiente').off('input.ajustePendiente');

        // ✅ RESETEAR FORMULARIO
        $('#productoIdAjustePendiente').val('');
        $('#inventarioIdAjustePendiente').val('');
        $('#tipoAjustePendiente').val('');
        $('#cantidadFinalPropuesta').val('');
        $('#motivoAjustePendiente').val('');

        // ✅ OCULTAR VISTA PREVIA
        $('#vistaPreviaAjustePendiente').hide();

        // ✅ RESTAURAR TÍTULO Y BOTÓN A VALORES POR DEFECTO (CREAR)
        $('#ajustePendienteModalLabel').html(`
            <i class="bi bi-clock-history me-2"></i>
            Registrar Ajuste Pendiente
        `);

        $('#guardarAjustePendienteBtn').find('.normal-state').html(`
            <i class="bi bi-clock-history me-2"></i>Registrar Ajuste Pendiente
        `);

        // ✅ RESTAURAR ESTADO DEL BOTÓN
        const $btn = $('#guardarAjustePendienteBtn');
        $btn.prop('disabled', false);
        $btn.find('.loading-state').hide();
        $btn.find('.normal-state').show();

        console.log('✅ Modal limpiado correctamente');

    } catch (error) {
        console.error('❌ Error limpiando modal:', error);
    }
}



/**
 * ✅ NUEVA FUNCIÓN: Actualizar vista previa del ajuste pendiente
 */
function actualizarVistaPreviaAjustePendiente(producto) {
    try {
        const tipoAjuste = $('#tipoAjustePendiente').val();
        const motivo = $('#motivoAjustePendiente').val()?.trim();

        if (!tipoAjuste) {
            $('#vistaPreviaAjustePendiente').hide();
            return;
        }

        const stockActual = producto.cantidadSistema || 0;
        const conteoFisico = producto.cantidadFisica || 0;
        let stockPropuesto = conteoFisico;
        let tipoTexto = '';

        switch (tipoAjuste) {
            case 'sistema_a_fisico':
                stockPropuesto = conteoFisico;
                tipoTexto = '📦 Sistema→Físico';
                break;
            case 'validado':
                stockPropuesto = stockActual; // Mantener actual, marcar como válido
                tipoTexto = '✅ Validado';
                break;
            default:
                stockPropuesto = conteoFisico;
                tipoTexto = tipoAjuste;
        }

        // ✅ ACTUALIZAR CAMPO DE CANTIDAD FINAL
        $('#cantidadFinalPropuesta').val(stockPropuesto);

        // ✅ LLENAR VISTA PREVIA
        $('#stockActualPreview').text(stockActual);
        $('#conteoFisicoPreview').text(conteoFisico);
        $('#tipoAjustePreview').text(tipoTexto);
        $('#stockFinalPreview').text(stockPropuesto);

        // ✅ MOSTRAR/OCULTAR VISTA PREVIA
        if (tipoAjuste && motivo && motivo.length >= 10) {
            $('#vistaPreviaAjustePendiente').show();
        } else {
            $('#vistaPreviaAjustePendiente').hide();
        }

    } catch (error) {
        console.error('❌ Error actualizando vista previa ajuste pendiente:', error);
    }
}


/**
 * ✅ NUEVA FUNCIÓN: Guardar ajuste pendiente (reemplaza la anterior)
 */
// ✅ CÓDIGO CORREGIDO
async function guardarNuevoAjustePendiente() {
    try {
        console.log('💾 === GUARDANDO NUEVO AJUSTE PENDIENTE ===');

        const productoId = $('#productoIdAjustePendiente').val();
        const inventarioId = $('#inventarioIdAjustePendiente').val();
        const tipoAjuste = $('#tipoAjustePendiente').val();
        const cantidadFinalPropuesta = parseInt($('#cantidadFinalPropuesta').val());
        const motivo = $('#motivoAjustePendiente').val()?.trim();

        // ✅ VALIDACIONES
        if (!productoId || !inventarioId || !tipoAjuste || !motivo) {
            mostrarError('Todos los campos son obligatorios');
            return;
        }

        if (motivo.length < 10) {
            mostrarError('El motivo debe tener al menos 10 caracteres');
            $('#motivoAjustePendiente').focus();
            return;
        }

        if (isNaN(cantidadFinalPropuesta) || cantidadFinalPropuesta < 0) {
            mostrarError('La cantidad final propuesta debe ser un número válido mayor o igual a 0');
            return;
        }

        // ✅ OBTENER PRODUCTO
        const producto = productosInventario.find(p => p.productoId == productoId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        // ✅ MANEJAR ESTADO DEL BOTÓN
        const $btn = $('#guardarAjustePendienteBtn');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        // ✅ CREAR OBJETO DE SOLICITUD
        const solicitudAjuste = {
            inventarioProgramadoId: parseInt(inventarioId),
            productoId: parseInt(productoId),
            tipoAjuste: tipoAjuste,
            cantidadSistemaOriginal: producto.cantidadSistema || 0,
            cantidadFisicaContada: producto.cantidadFisica || 0,
            cantidadFinalPropuesta: cantidadFinalPropuesta,
            motivoAjuste: motivo,
            usuarioId: window.inventarioConfig.usuarioId || 1
        };

        console.log('📤 Enviando solicitud de ajuste pendiente:', solicitudAjuste);

        // ✅ CAMBIO PRINCIPAL: Usar la ruta correcta del controlador Web
        const response = await fetch('/TomaInventario/CrearAjustePendiente', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(solicitudAjuste)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error ${response.status}: ${errorData}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            let mensajeExito = `Ajuste pendiente registrado exitosamente para ${producto.nombreProducto}`;
            
            
            
            mostrarExito(mensajeExito);

            // ✅ CERRAR MODAL
            const modal = bootstrap.Modal.getInstance(document.getElementById('ajustePendienteModal'));
            if (modal) {
                modal.hide();
            }

            // ✅ RECARGAR DATOS
            await cargarAjustesPendientes(inventarioId);
            await cargarProductosInventario(inventarioId);
            await actualizarEstadisticasUI();

            console.log('🎉 Ajuste pendiente guardado y datos actualizados');

        } else {
            throw new Error(resultado.message || 'Error al registrar ajuste pendiente');
        }

    } catch (error) {
        console.error('❌ Error guardando ajuste pendiente:', error);
        mostrarError(`Error al guardar ajuste pendiente: ${error.message}`);
    } finally {
        // ✅ RESTAURAR BOTÓN
        const $btn = $('#guardarAjustePendienteBtn');
        $btn.prop('disabled', false);
        $btn.find('.loading-state').hide();
        $btn.find('.normal-state').show();
    }
}




/**
* ✅ NUEVA FUNCIÓN: Actualizar panel de finalización
*/
function actualizarPanelFinalizacion() {
    try {
        console.log('🏁 Actualizando panel de finalización...');

        const stats = estadisticasActuales;
        const totalAjustes = ajustesPendientes.filter(a => a.estado === 'Pendiente').length;

        // ✅ ACTUALIZAR RESUMEN FINAL
        $('#resumenTotalProductos').text(stats.total || 0);
        $('#resumenProductosContados').text(stats.contados || 0);
        $('#resumenDiscrepancias').text(stats.discrepancias || 0);
        $('#resumenAjustesPendientes').text(totalAjustes);

        // ✅ ACTUALIZAR CÍRCULO DE PROGRESO
        const porcentaje = stats.porcentajeProgreso || 0;
        $('#porcentajeCompletoFinal').text(`${Math.round(porcentaje)}%`);

        // Actualizar círculo visual
        const $circulo = $('.progress-circle');
        const grados = (porcentaje / 100) * 360;
        $circulo.css('background', `conic-gradient(#28a745 ${grados}deg, #e9ecef ${grados}deg)`);

        // ✅ MOSTRAR/OCULTAR ALERTAS
        const todoContado = stats.pendientes === 0;
        const hayDiscrepancias = stats.discrepancias > 0;
        const hayAjustes = totalAjustes > 0;

        // Ocultar todas las alertas primero
        $('#alertaProductosPendientes, #alertaAjustesPendientes, #alertaListoParaFinalizar').hide();

        if (!todoContado) {
            $('#cantidadPendientes').text(stats.pendientes);
            $('#alertaProductosPendientes').show();
        } else if (hayAjustes) {
            $('#cantidadAjustes').text(totalAjustes);
            $('#alertaAjustesPendientes').show();
        } else {
            $('#alertaListoParaFinalizar').show();
        }

        // ✅ HABILITAR/DESHABILITAR BOTÓN DE FINALIZAR
        // Determinar si puede finalizar según el tipo de inventario
        const tipoInventario = inventarioActual?.tipoInventario || 'Completo';
        const esInventarioCompleto = tipoInventario === 'Completo';
        const hayProductosContados = stats.contados > 0; // Al menos un producto contado

        let puedeFinalizarSinAjustes, puedeFinalizarConAjustes;

        if (esInventarioCompleto) {
            // Inventario Completo: Requiere que TODO esté contado
            puedeFinalizarSinAjustes = todoContado && !hayAjustes;
            puedeFinalizarConAjustes = todoContado && hayAjustes;
        } else {
            // Inventario Parcial/Cíclico: Permite finalizar con productos pendientes, pero debe haber al menos algo contado
            puedeFinalizarSinAjustes = hayProductosContados && !hayAjustes;
            puedeFinalizarConAjustes = hayProductosContados && hayAjustes;
        }

        const $btnFinalizar = $('#btnFinalizarInventario');

        if (puedeFinalizarSinAjustes) {
            $btnFinalizar.prop('disabled', false)
                .removeClass('btn-warning')
                .addClass('btn-success');
            $btnFinalizar.find('i').removeClass('bi-clock-history').addClass('bi-check-circle-fill');
            $btnFinalizar.find('span:first').html('<i class="bi bi-check-circle-fill me-2"></i>Finalizar Inventario');
        } else if (puedeFinalizarConAjustes) {
            $btnFinalizar.prop('disabled', false)
                .removeClass('btn-success')
                .addClass('btn-warning');
            $btnFinalizar.find('i').removeClass('bi-check-circle-fill').addClass('bi-clock-history');
            $btnFinalizar.find('span:first').html('<i class="bi bi-clock-history me-2"></i>Finalizar y Aplicar Ajustes');
        } else {
            $btnFinalizar.prop('disabled', true)
                .removeClass('btn-success btn-warning')
                .addClass('btn-secondary');
        }

        console.log(`✅ Panel de finalización actualizado - Tipo: ${tipoInventario}, Puede finalizar: ${puedeFinalizarSinAjustes || puedeFinalizarConAjustes}`);

    } catch (error) {
        console.error('❌ Error actualizando panel de finalización:', error);
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Mostrar interfaz de inventario completado
 */
function mostrarInventarioCompletado() {
    try {
        // ✅ CREAR MENSAJE DE COMPLETADO
        const mensajeCompletado = `
            <div class="alert alert-success border-success shadow-sm">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="bi bi-check-circle-fill display-4 text-success"></i>
                    </div>
                    <div>
                        <h4 class="alert-heading mb-2">🎉 ¡Inventario Completado!</h4>
                        <p class="mb-2">
                            El inventario ha sido finalizado exitosamente. 
                            Todos los ajustes han sido aplicados al stock del sistema.
                        </p>
                        <hr>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            Completado el ${new Date().toLocaleString()}
                        </small>
                    </div>
                </div>
            </div>
        `;

        // ✅ INSERTAR DESPUÉS DEL HEADER
        $('.toma-header').after(mensajeCompletado);

        // ✅ DESHABILITAR BOTONES DE ACCIÓN
        $('.btn-contar, .btn-ajustar, .btn-ajuste-pendiente').prop('disabled', true).addClass('disabled');

        console.log('✅ Interfaz de inventario completado mostrada');

    } catch (error) {
        console.error('❌ Error mostrando inventario completado:', error);
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Ver resumen completo (placeholder)
 */
async function verResumenCompleto() {
    try {
        const stats = estadisticasActuales;
        const totalAjustes = ajustesPendientes.length;

        let htmlResumen = `
            <div class="text-start">
                <h5 class="mb-3">📊 Resumen Completo del Inventario</h5>
                
                <div class="row mb-3">
                    <div class="col-sm-6"><strong>📦 Total de productos:</strong></div>
                    <div class="col-sm-6">${stats.total || 0}</div>
                    
                    <div class="col-sm-6"><strong>✅ Productos contados:</strong></div>
                    <div class="col-sm-6 text-success">${stats.contados || 0}</div>
                    
                    <div class="col-sm-6"><strong>⏳ Productos pendientes:</strong></div>
                    <div class="col-sm-6 text-warning">${stats.pendientes || 0}</div>
                    
                    <div class="col-sm-6"><strong>⚠️ Discrepancias:</strong></div>
                    <div class="col-sm-6 text-danger">${stats.discrepancias || 0}</div>
                    
                    <div class="col-sm-6"><strong>🔄 Ajustes pendientes:</strong></div>
                    <div class="col-sm-6 text-info">${totalAjustes}</div>
                    
                    <div class="col-sm-6"><strong>📈 Progreso:</strong></div>
                    <div class="col-sm-6"><span class="badge bg-primary">${stats.porcentajeProgreso || 0}%</span></div>
                </div>
        `;

        if (totalAjustes > 0) {
            const ajustesPorTipo = contarAjustesPorTipo();
            htmlResumen += `
                <hr>
                <h6>🔧 Detalle de Ajustes por Tipo:</h6>
                <div class="row">
                    <div class="col-sm-6">📦 Entradas:</div>
                    <div class="col-sm-6">${ajustesPorTipo.ENTRADA}</div>
                    
                    <div class="col-sm-6">📤 Salidas:</div>
                    <div class="col-sm-6">${ajustesPorTipo.SALIDA}</div>
                    
                    <div class="col-sm-6">🔧 Ajustes Sistema:</div>
                    <div class="col-sm-6">${ajustesPorTipo.AJUSTE_SISTEMA}</div>
                    
                    <div class="col-sm-6">🔄 Correcciones:</div>
                    <div class="col-sm-6">${ajustesPorTipo.CORRECCION_CONTEO}</div>
                </div>
            `;
        }

        htmlResumen += `</div>`;

        await Swal.fire({
            title: '📊 Resumen Completo',
            html: htmlResumen,
            icon: 'info',
            confirmButtonColor: '#0dcaf0',
            confirmButtonText: 'Cerrar',
            width: '600px'
        });

    } catch (error) {
        console.error('❌ Error mostrando resumen:', error);
        mostrarError('Error al generar resumen');
    }
}

/**
 * ✅ SISTEMA COMPLETO DE FINALIZACIÓN DE INVENTARIO
 */

/**
 * ✅ FUNCIÓN PRINCIPAL: Finalizar inventario completo con todas las validaciones
 */
async function finalizarInventarioCompleto() {
    try {
        console.log('🏁 === INICIANDO FINALIZACIÓN COMPLETA DE INVENTARIO ===');

        const inventarioId = window.inventarioConfig.inventarioId;
        const stats = estadisticasActuales;
        const totalAjustes = ajustesPendientes.filter(a => a.estado === 'Pendiente').length;

        // ✅ VERIFICAR PERMISOS PARA FINALIZAR
        const verificacionPermisos = verificarPermisoEspecifico('completar', 'finalizar inventario');
        if (!verificacionPermisos.tienePermiso) {
            mostrarError(verificacionPermisos.mensaje);
            return;
        }

        // ✅ VALIDACIONES CRÍTICAS PRE-FINALIZACIÓN
        const validaciones = await ejecutarValidacionesPreFinalizacion(inventarioId, stats, totalAjustes);
        if (!validaciones.puedeFinalizarse) {
            mostrarError(validaciones.mensaje);
            return;
        }

        // ✅ MOSTRAR RESUMEN DETALLADO Y CONFIRMACIÓN
        const confirmacion = await mostrarConfirmacionFinalizacion(stats, totalAjustes, validaciones);
        if (!confirmacion.isConfirmed) return;

        // ✅ EJECUTAR PROCESO DE FINALIZACIÓN
        await ejecutarProcesoFinalizacion(inventarioId, totalAjustes);

    } catch (error) {
        console.error('💥 Error crítico en finalización:', error);
        mostrarError('Error crítico al finalizar inventario. Contacte al administrador.');
    }
}

/**
 * ✅ FUNCIÓN: Ejecutar validaciones previas a la finalización
 */
async function ejecutarValidacionesPreFinalizacion(inventarioId, stats, totalAjustes) {
    try {
        console.log('🔍 Ejecutando validaciones pre-finalización...');

        const validaciones = {
            puedeFinalizarse: true,
            mensaje: '',
            advertencias: [],
            informacion: []
        };

        // ✅ VALIDACIÓN 1: Productos sin contar (SEGÚN TIPO DE INVENTARIO)
        const tipoInventario = inventarioActual?.tipoInventario || 'Completo';
        const esInventarioCompleto = tipoInventario === 'Completo';

        console.log(`📋 Tipo de inventario: ${tipoInventario}`);
        console.log(`📊 Productos contados: ${stats.contados}, Pendientes: ${stats.pendientes}`);

        if (esInventarioCompleto) {
            // Inventario Completo: requiere 100% contado
            if (stats.pendientes > 0) {
                validaciones.puedeFinalizarse = false;
                validaciones.mensaje = `No se puede finalizar inventario COMPLETO: quedan ${stats.pendientes} productos sin contar.`;
                return validaciones;
            }
        } else {
            // Inventario Parcial/Cíclico: requiere al menos 1 contado
            if (stats.contados === 0) {
                validaciones.puedeFinalizarse = false;
                validaciones.mensaje = `No se puede finalizar: debes contar al menos 1 producto.`;
                return validaciones;
            }
            // Si hay productos pendientes en inventario Parcial/Cíclico, agregar información
            if (stats.pendientes > 0) {
                validaciones.informacion.push(`Inventario ${tipoInventario}: ${stats.pendientes} productos no contados serán ignorados.`);
            }
        }

        // ✅ VALIDACIÓN 2: Verificar estado del inventario
        if (inventarioActual && inventarioActual.estado !== 'En Progreso') {
            validaciones.puedeFinalizarse = false;
            validaciones.mensaje = `El inventario está en estado '${inventarioActual.estado}' y no se puede finalizar.`;
            return validaciones;
        }

        // ✅ VALIDACIÓN 3: Revisar ajustes pendientes
        if (totalAjustes > 0) {
            validaciones.informacion.push(`Se aplicarán ${totalAjustes} ajustes al stock del sistema.`);

            // Verificar ajustes que podrían causar stock negativo
            const ajustesProblematicos = ajustesPendientes.filter(a =>
                a.estado === 'Pendiente' && a.cantidadFinalPropuesta < 0
            );

            if (ajustesProblematicos.length > 0) {
                validaciones.advertencias.push(`${ajustesProblematicos.length} productos quedarían con stock negativo.`);
            }
        }

        // ✅ VALIDACIÓN 4: Verificar discrepancias sin ajustes
        const discrepanciasSinAjuste = await verificarDiscrepanciasSinAjuste(inventarioId);
        if (discrepanciasSinAjuste.length > 0) {
            validaciones.advertencias.push(`${discrepanciasSinAjuste.length} productos con discrepancias no tienen ajustes pendientes.`);
        }

        // ✅ VALIDACIÓN 5: Verificar productos críticos
        const productosCriticos = await verificarProductosCriticos(inventarioId);
        if (productosCriticos.length > 0) {
            validaciones.advertencias.push(`${productosCriticos.length} productos quedarían por debajo del stock mínimo.`);
        }

        console.log('✅ Validaciones completadas:', validaciones);
        return validaciones;

    } catch (error) {
        console.error('❌ Error en validaciones pre-finalización:', error);
        return {
            puedeFinalizarse: false,
            mensaje: 'Error al validar el inventario. Intente nuevamente.',
            advertencias: [],
            informacion: []
        };
    }
}

/**
 * ✅ FUNCIÓN: Verificar discrepancias sin ajustes
 */
async function verificarDiscrepanciasSinAjuste(inventarioId) {
    const discrepanciasSinAjuste = [];

    productosInventario.forEach(producto => {
        if (producto.tieneDiscrepancia && !verificarAjustePendiente(producto.productoId)) {
            discrepanciasSinAjuste.push(producto);
        }
    });

    return discrepanciasSinAjuste;
}

/**
 * ✅ FUNCIÓN: Verificar productos que quedarían críticos
 */
async function verificarProductosCriticos(inventarioId) {
    const productosCriticos = [];

    for (const producto of productosInventario) {
        // Si tiene ajuste pendiente, usar la cantidad propuesta
        const ajustePendiente = ajustesPendientes.find(a =>
            a.productoId === producto.productoId && a.estado === 'Pendiente'
        );

        let cantidadFinal = producto.cantidadSistema;
        if (ajustePendiente) {
            cantidadFinal = ajustePendiente.cantidadFinalPropuesta;
        }

        // Verificar si quedaría por debajo del mínimo (asumiendo stock mínimo de 5 por ahora)
        if (cantidadFinal < 5) {
            productosCriticos.push({
                ...producto,
                cantidadFinal: cantidadFinal
            });
        }
    }

    return productosCriticos;
}

/**
 * ✅ FUNCIÓN: Mostrar confirmación detallada de finalización
 */
async function mostrarConfirmacionFinalizacion(stats, totalAjustes, validaciones) {
    const tipoInventario = inventarioActual?.tipoInventario || 'Completo';
    const esInventarioCompleto = tipoInventario === 'Completo';

    let htmlConfirmacion = `
        <div class="text-start">
            <h5 class="text-primary mb-3">📋 Resumen Final del Inventario</h5>

            <div class="alert alert-info mb-3">
                <strong>📝 Tipo de Inventario:</strong> ${tipoInventario}
            </div>

            <div class="row mb-3">
                <div class="col-6"><strong>📦 Total productos:</strong></div>
                <div class="col-6">${stats.total}</div>

                <div class="col-6"><strong>✅ Productos contados:</strong></div>
                <div class="col-6 text-success">${stats.contados}</div>

                ${!esInventarioCompleto && stats.pendientes > 0 ? `
                <div class="col-6"><strong>⏸️ Productos NO contados:</strong></div>
                <div class="col-6 text-muted">${stats.pendientes} <small>(se ignorarán)</small></div>
                ` : ''}

                <div class="col-6"><strong>⚠️ Discrepancias encontradas:</strong></div>
                <div class="col-6 text-warning">${stats.discrepancias}</div>

                <div class="col-6"><strong>🔄 Ajustes a aplicar:</strong></div>
                <div class="col-6 text-info">${totalAjustes}</div>
            </div>
    `;

    // ✅ MOSTRAR INFORMACIÓN ADICIONAL
    if (validaciones.informacion.length > 0) {
        htmlConfirmacion += `
            <div class="alert alert-info">
                <h6><i class="bi bi-info-circle me-2"></i>Información:</h6>
                <ul class="mb-0">
                    ${validaciones.informacion.map(info => `<li>${info}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // ✅ MOSTRAR ADVERTENCIAS
    if (validaciones.advertencias.length > 0) {
        htmlConfirmacion += `
            <div class="alert alert-warning">
                <h6><i class="bi bi-exclamation-triangle me-2"></i>Advertencias:</h6>
                <ul class="mb-0">
                    ${validaciones.advertencias.map(adv => `<li>${adv}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // ✅ DETALLES DE AJUSTES SI LOS HAY
    if (totalAjustes > 0) {
        const ajustesPorTipo = contarAjustesPorTipo();
        htmlConfirmacion += `
            <div class="alert alert-primary">
                <h6><i class="bi bi-gear me-2"></i>Detalle de Ajustes a Aplicar:</h6>
                <div class="row">
                    <div class="col-6">📦 Ajustes al sistema: ${ajustesPorTipo.sistema_a_fisico}</div>
                    <div class="col-6">🔄 Reconteos: ${ajustesPorTipo.reconteo}</div>
                    <div class="col-6">✅ Validaciones: ${ajustesPorTipo.validado}</div>
                </div>
            </div>
        `;
    }

    htmlConfirmacion += `
            <div class="alert alert-danger">
                <h6><i class="bi bi-shield-exclamation me-2"></i>¡ATENCIÓN!</h6>
                <p class="mb-0">
                    <strong>Esta acción es irreversible.</strong><br>
                    • Se completará el inventario<br>
                    • Se aplicarán todos los ajustes al stock del sistema<br>
                    • No se podrán realizar más cambios
                </p>
            </div>
        </div>
    `;

    return await Swal.fire({
        title: '🏁 ¿Finalizar Inventario?',
        html: htmlConfirmacion,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: totalAjustes > 0 ? '#ffc107' : '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: totalAjustes > 0 ?
            '<i class="bi bi-check-lg me-1"></i> Finalizar y Aplicar Ajustes' :
            '<i class="bi bi-check-lg me-1"></i> Finalizar Inventario',
        cancelButtonText: '<i class="bi bi-x-lg me-1"></i> Cancelar',
        width: '700px',
        customClass: {
            popup: 'swal-wide'
        }
    });
}

/**
 * ✅ FUNCIÓN: Ejecutar proceso completo de finalización
 */
async function ejecutarProcesoFinalizacion(inventarioId, totalAjustes) {
    console.log('🔥 EJECUTANDO: ejecutarProcesoFinalizacion');
    // ✅ MOSTRAR PROGRESO
    let timerInterval;

    Swal.fire({
        title: '🏁 Finalizando Inventario',
        html: `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Procesando...</span>
                </div>
                <p class="mb-2">Procesando finalización del inventario...</p>
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" style="width: 0%" id="progressBar">
                    </div>
                </div>
                <small class="text-muted mt-2 d-block" id="statusText">Iniciando proceso...</small>
            </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            const progressBar = document.getElementById('progressBar');
            const statusText = document.getElementById('statusText');
            let progress = 0;

            timerInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;

                progressBar.style.width = progress + '%';

                if (progress < 30) {
                    statusText.textContent = 'Validando datos...';
                } else if (progress < 60) {
                    statusText.textContent = 'Aplicando ajustes...';
                } else {
                    statusText.textContent = 'Completando inventario...';
                }
            }, 500);
        },
        willClose: () => {
            clearInterval(timerInterval);
        }
    });

    try {
        // ✅ PASO 1: Aplicar ajustes pendientes si los hay
        if (totalAjustes > 0) {
            console.log('📝 Aplicando ajustes pendientes...');

            const responseAjustes = await fetch(`/TomaInventario/AplicarAjustesPendientes/${inventarioId}`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                }
            });

            if (!responseAjustes.ok) {
                throw new Error(`Error aplicando ajustes: ${responseAjustes.status}`);
            }

            const resultadoAjustes = await responseAjustes.json();
            console.log('🔍 RESPUESTA COMPLETA DE AJUSTES:', resultadoAjustes); // ← AGREGAR ESTA LÍNEA
            if (!resultadoAjustes.success) {
                throw new Error(resultadoAjustes.message || 'Error al aplicar ajustes');
            }

            console.log('✅ Ajustes aplicados exitosamente');
        }

        // ✅ PASO 2: Completar inventario
        console.log('🏁 Completando inventario...');

        const responseCompletar = await fetch(`/TomaInventario/CompletarInventario/${inventarioId}`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!responseCompletar.ok) {
            throw new Error(`Error completando inventario: ${responseCompletar.status}`);
        }

        const resultadoCompletar = await responseCompletar.json();
        if (!resultadoCompletar.success) {
            throw new Error(resultadoCompletar.message || 'Error al completar inventario');
        }

        // ✅ COMPLETAR BARRA DE PROGRESO
        const progressBar = document.getElementById('progressBar');
        const statusText = document.getElementById('statusText');
        if (progressBar) progressBar.style.width = '100%';
        if (statusText) statusText.textContent = 'Inventario completado exitosamente';

        setTimeout(async () => {
            clearInterval(timerInterval);

            // ✅ MOSTRAR RESULTADO FINAL
            await mostrarResultadoFinalizacion(inventarioId, totalAjustes, estadisticasActuales);

            // ✅ ACTUALIZAR INTERFAZ FINAL
            await actualizarInterfazInventarioCompletado();

        }, 1000);

    } catch (error) {
        clearInterval(timerInterval);
        console.error('💥 Error durante finalización:', error);

        Swal.fire({
            title: '❌ Error en Finalización',
            html: `
                <div class="text-start">
                    <p>Ocurrió un error durante la finalización del inventario:</p>
                    <div class="alert alert-danger">
                        <strong>Error:</strong> ${error.message}
                    </div>
                    <p class="text-muted">
                        El inventario no ha sido completado. Puede intentar nuevamente o contactar al administrador.
                    </p>
                </div>
            `,
            icon: 'error',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Entendido'
        });
    }
}



/**
 * ✅ FUNCIÓN: Mostrar resultado final de la finalización
 */
async function mostrarResultadoFinalizacion(inventarioId, totalAjustes, stats) {
    let mensaje = `
        <div class="text-center">
            <div class="display-1 text-success mb-3">🎉</div>
            <h3 class="text-success mb-3">¡Inventario Completado Exitosamente!</h3>
            
            <div class="row text-center mb-4">
                <div class="col-3">
                    <div class="card bg-light">
                        <div class="card-body py-2">
                            <div class="h4 text-primary">${stats.total}</div>
                            <small>Productos Inventariados</small>
                        </div>
                    </div>
                </div>
                <div class="col-3">
                    <div class="card bg-light">
                        <div class="card-body py-2">
                            <div class="h4 text-success">${stats.contados}</div>
                            <small>Conteos Realizados</small>
                        </div>
                    </div>
                </div>
                <div class="col-3">
                    <div class="card bg-light">
                        <div class="card-body py-2">
                            <div class="h4 text-warning">${stats.discrepancias}</div>
                            <small>Discrepancias Resueltas</small>
                        </div>
                    </div>
                </div>
                <div class="col-3">
                    <div class="card bg-light">
                        <div class="card-body py-2">
                            <div class="h4 text-info">${totalAjustes}</div>
                            <small>Ajustes Aplicados</small>
                        </div>
                    </div>
                </div>
            </div>
    `;

    if (totalAjustes > 0) {
        mensaje += `
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle me-2"></i>Ajustes de Stock Aplicados</h6>
                <p class="mb-0">Se han actualizado ${totalAjustes} productos en el sistema de inventario.</p>
            </div>
        `;
    }

    mensaje += `
            <p class="text-muted mb-4">
                El inventario ha sido marcado como completado y todos los cambios han sido aplicados al sistema.
            </p>
            
            <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-primary" onclick="generarReporteInventario(${inventarioId})">
                    <i class="bi bi-file-text me-1"></i> Generar Reporte
                </button>
                <button class="btn btn-outline-primary" onclick="exportarInventario(${inventarioId})">
                    <i class="bi bi-download me-1"></i> Exportar Excel
                </button>
                <button class="btn btn-outline-secondary" onclick="volverAInventarios()">
                    <i class="bi bi-arrow-left me-1"></i> Volver a Inventarios
                </button>
            </div>
        </div>
    `;

    await Swal.fire({
        html: mensaje,
        icon: 'success',
        showConfirmButton: false,
        showCloseButton: true,
        width: '800px',
        customClass: {
            popup: 'swal-wide'
        }
    });
}

/**
 * ✅ FUNCIÓN: Actualizar interfaz para mostrar inventario completado
 */
async function actualizarInterfazInventarioCompletado() {
    try {
        // ✅ DESHABILITAR TODOS LOS CONTROLES DE EDICIÓN
        $('.btn-contar, .btn-ajustar, .btn-ajuste-pendiente, .btn-validar').prop('disabled', true).addClass('disabled');

        // ✅ CAMBIAR ESTADO VISUAL
        $('.estado-inventario .badge').removeClass('bg-success').addClass('bg-primary').html('<i class="bi bi-check-circle me-1"></i>Completado');

        // ✅ OCULTAR PANELES DE GESTIÓN
        $('#ajustesPendientesPanel, #finalizacionPanel').slideUp();

        // ✅ MOSTRAR BANNER DE COMPLETADO
        const bannerCompletado = `
            <div class="alert alert-success border-success shadow-sm mb-4" id="bannerInventarioCompletado">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="bi bi-check-circle-fill display-4 text-success"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h4 class="alert-heading mb-2">🎉 ¡Inventario Completado!</h4>
                        <p class="mb-2">
                            El inventario ha sido finalizado exitosamente. 
                            Todos los ajustes han sido aplicados al stock del sistema.
                        </p>
                        <hr>
                        <div class="d-flex gap-2 align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                Completado el ${new Date().toLocaleString()}
                            </small>
                            <div class="ms-auto">
                                <button class="btn btn-success btn-sm me-2" onclick="generarReporteInventario(${window.inventarioConfig.inventarioId})">
                                    <i class="bi bi-file-text me-1"></i> Reporte
                                </button>
                                <button class="btn btn-outline-success btn-sm" onclick="exportarInventario(${window.inventarioConfig.inventarioId})"> 
                                    <i class="bi bi-download me-1"></i> Exportar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('.toma-header').after(bannerCompletado);

        // ✅ RECARGAR DATOS FINALES
        await cargarProductosInventario(window.inventarioConfig.inventarioId);
        await cargarAjustesPendientes(window.inventarioConfig.inventarioId);

        console.log('✅ Interfaz actualizada para inventario completado');

    } catch (error) {
        console.error('❌ Error actualizando interfaz:', error);
    }
}

/**
 * ✅ FUNCIONES PARA REPORTES Y EXPORTACIÓN
 */

/**
 * ✅ FUNCIÓN: Generar reporte de inventario (usando utilidades globales)
 */
async function generarReporteInventario(inventarioId) {
    try {
        console.log('📊 Generando reporte para inventario:', inventarioId);

        // ✅ OBTENER TÍTULO DEL INVENTARIO
        const tituloInventario = $('#tituloInventario').text().trim() ||
            $('.inventario-titulo').text().trim() ||
            window.inventarioConfig?.titulo ||
            'Inventario';

        // ✅ MOSTRAR MODAL CON RESUMEN DEL REPORTE
        await mostrarReporteModal(inventarioId, tituloInventario);

    } catch (error) {
        console.error('❌ Error al generar reporte:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar el reporte del inventario',
            confirmButtonColor: '#d33'
        });
    }
}


/**
 * ✅ FUNCIÓN: Recopilar datos para el reporte
 */
async function recopilarDatosReporte(inventarioId) {
    try {
        const datos = {
            inventario: null,
            productos: [],
            ajustes: [],
            estadisticas: {},
            resumen: {}
        };

        // ✅ OBTENER INFORMACIÓN DEL INVENTARIO
        const inventarioResponse = await fetch(`/TomaInventario/ObtenerInventario/${inventarioId}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (inventarioResponse.ok) {
            datos.inventario = await inventarioResponse.json();
        }

        // ✅ OBTENER PRODUCTOS CON DETALLES
        datos.productos = productosInventario || [];

        // ✅ OBTENER AJUSTES APLICADOS
        datos.ajustes = ajustesPendientes || [];

        // ✅ CALCULAR ESTADÍSTICAS DETALLADAS
        datos.estadisticas = calcularEstadisticasDetalladas(datos.productos, datos.ajustes);

        // ✅ GENERAR RESUMEN EJECUTIVO
        datos.resumen = generarResumenEjecutivo(datos.estadisticas, datos.ajustes);

        return datos;

    } catch (error) {
        console.error('❌ Error recopilando datos:', error);
        throw error;
    }
}

/**
 * ✅ FUNCIÓN: Calcular estadísticas detalladas
 */
function calcularEstadisticasDetalladas(productos, ajustes) {
    const stats = {
        totalProductos: productos.length,
        productosContados: productos.filter(p => p.estadoConteo === 'Contado').length,
        productosConDiscrepancia: productos.filter(p => p.tieneDiscrepancia).length,
        porcentajeCompletado: 0,

        // Estadísticas de discrepancias
        totalDiscrepancias: 0,
        discrepanciasPositivas: 0,
        discrepanciasNegativas: 0,
        mayorDiscrepancia: 0,

        // Estadísticas de ajustes
        totalAjustes: ajustes.length,
        ajustesPorTipo: {},
        ajustesAplicados: ajustes.filter(a => a.estado === 'Aplicado').length,

        // Impacto en stock
        unidadesAumentadas: 0,
        unidadesDisminuidas: 0,
        impactoNeto: 0,

        // Productos por categoría
        productosPorTipo: {},

        // Tiempo de ejecución
        duracionInventario: null
    };

    // ✅ CALCULAR PORCENTAJE
    if (stats.totalProductos > 0) {
        stats.porcentajeCompletado = Math.round((stats.productosContados / stats.totalProductos) * 100);
    }

    // ✅ ANALIZAR DISCREPANCIAS
    productos.forEach(producto => {
        if (producto.tieneDiscrepancia && producto.diferencia) {
            stats.totalDiscrepancias++;

            if (producto.diferencia > 0) {
                stats.discrepanciasPositivas++;
                stats.unidadesAumentadas += producto.diferencia;
            } else {
                stats.discrepanciasNegativas++;
                stats.unidadesDisminuidas += Math.abs(producto.diferencia);
            }

            if (Math.abs(producto.diferencia) > Math.abs(stats.mayorDiscrepancia)) {
                stats.mayorDiscrepancia = producto.diferencia;
            }
        }

        // ✅ CATEGORIZAR POR TIPO
        const tipo = producto.esLlanta ? 'Llantas' : 'Accesorios';
        stats.productosPorTipo[tipo] = (stats.productosPorTipo[tipo] || 0) + 1;
    });

    // ✅ ANALIZAR AJUSTES
    ajustes.forEach(ajuste => {
        const tipo = ajuste.tipoAjuste || 'Otros';
        stats.ajustesPorTipo[tipo] = (stats.ajustesPorTipo[tipo] || 0) + 1;

        if (ajuste.estado === 'Aplicado') {
            const impacto = ajuste.cantidadFinalPropuesta - ajuste.cantidadSistemaOriginal;
            stats.impactoNeto += impacto;
        }
    });

    return stats;
}

/**
 * ✅ FUNCIÓN: Generar resumen ejecutivo
 */
function generarResumenEjecutivo(estadisticas, ajustes) {
    const resumen = {
        titulo: 'Resumen Ejecutivo',
        puntosClave: [],
        recomendaciones: [],
        alertas: []
    };

    // ✅ PUNTOS CLAVE
    resumen.puntosClave.push(`Inventario completado al ${estadisticas.porcentajeCompletado}%`);
    resumen.puntosClave.push(`${estadisticas.totalDiscrepancias} discrepancias identificadas y resueltas`);
    resumen.puntosClave.push(`${estadisticas.ajustesAplicados} ajustes aplicados al sistema`);

    if (estadisticas.impactoNeto !== 0) {
        const tipoImpacto = estadisticas.impactoNeto > 0 ? 'aumento' : 'disminución';
        resumen.puntosClave.push(`Impacto neto: ${tipoImpacto} de ${Math.abs(estadisticas.impactoNeto)} unidades`);
    }

    // ✅ RECOMENDACIONES
    if (estadisticas.discrepanciasNegativas > estadisticas.discrepanciasPositivas) {
        resumen.recomendaciones.push('Revisar procesos de control de salidas de inventario');
    }

    if (estadisticas.totalDiscrepancias > estadisticas.totalProductos * 0.1) {
        resumen.recomendaciones.push('Considerar inventarios más frecuentes');
    }

    if (estadisticas.impactoNeto < -50) {
        resumen.recomendaciones.push('Investigar causas de faltantes significativos');
    }

    // ✅ ALERTAS
    if (Math.abs(estadisticas.mayorDiscrepancia) > 10) {
        resumen.alertas.push(`Mayor discrepancia detectada: ${estadisticas.mayorDiscrepancia} unidades`);
    }

    return resumen;
}

/**
 * ✅ FUNCIÓN: Generar HTML del reporte
 */
function generarHtmlReporte(datos) {
    const fechaReporte = new Date().toLocaleString();

    return `
        <div class="reporte-inventario text-start">
            <!-- HEADER DEL REPORTE -->
            <div class="reporte-header mb-4">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="text-primary mb-1">Reporte de Inventario</h6>
                        <h4 class="mb-2">${datos.inventario?.titulo || 'Inventario'}</h4>
                        <p class="text-muted mb-0">
                            <strong>Período:</strong> ${new Date(datos.inventario?.fechaInicio).toLocaleDateString()} - 
                            ${new Date(datos.inventario?.fechaFin).toLocaleDateString()}<br>
                            <strong>Generado:</strong> ${fechaReporte}
                        </p>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success fs-6 px-3 py-2">
                            ${datos.inventario?.estado || 'Completado'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- RESUMEN EJECUTIVO -->
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Resumen Ejecutivo</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3 text-center">
                            <div class="display-6 text-primary">${datos.estadisticas.totalProductos}</div>
                            <small class="text-muted">Total Productos</small>
                        </div>
                        <div class="col-md-3 text-center">
                            <div class="display-6 text-success">${datos.estadisticas.porcentajeCompletado}%</div>
                            <small class="text-muted">Completado</small>
                        </div>
                        <div class="col-md-3 text-center">
                            <div class="display-6 text-warning">${datos.estadisticas.totalDiscrepancias}</div>
                            <small class="text-muted">Discrepancias</small>
                        </div>
                        <div class="col-md-3 text-center">
                            <div class="display-6 text-info">${datos.estadisticas.ajustesAplicados}</div>
                            <small class="text-muted">Ajustes Aplicados</small>
                        </div>
                    </div>
                    
                    ${datos.resumen.puntosClave.length > 0 ? `
                        <hr>
                        <h6 class="text-primary">Puntos Clave:</h6>
                        <ul class="mb-0">
                            ${datos.resumen.puntosClave.map(punto => `<li>${punto}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>

            <!-- ESTADÍSTICAS DETALLADAS -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="bi bi-pie-chart me-2"></i>Análisis de Discrepancias</h6>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <div class="h5 text-success">+${datos.estadisticas.discrepanciasPositivas}</div>
                                    <small>Sobrantes</small>
                                </div>
                                <div class="col-6">
                                    <div class="h5 text-danger">-${datos.estadisticas.discrepanciasNegativas}</div>
                                    <small>Faltantes</small>
                                </div>
                            </div>
                            <hr>
                            <p class="mb-0">
                                <strong>Mayor discrepancia:</strong> ${datos.estadisticas.mayorDiscrepancia} unidades<br>
                                <strong>Impacto neto:</strong> ${datos.estadisticas.impactoNeto > 0 ? '+' : ''}${datos.estadisticas.impactoNeto} unidades
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="bi bi-gear me-2"></i>Ajustes Aplicados</h6>
                        </div>
                        <div class="card-body">
                            ${Object.keys(datos.estadisticas.ajustesPorTipo).length > 0 ? `
                                ${Object.entries(datos.estadisticas.ajustesPorTipo).map(([tipo, cantidad]) => `
                                    <div class="d-flex justify-content-between">
                                        <span>${obtenerTextoTipoAjuste(tipo)}:</span>
                                        <strong>${cantidad}</strong>
                                    </div>
                                `).join('')}
                            ` : '<p class="text-muted mb-0">No se aplicaron ajustes</p>'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- PRODUCTOS CON DISCREPANCIAS -->
            ${datos.productos.filter(p => p.tieneDiscrepancia).length > 0 ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Productos con Discrepancias</h6>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-center">Sistema</th>
                                        <th class="text-center">Físico</th>
                                        <th class="text-center">Diferencia</th>
                                        <th class="text-center">Ajuste Aplicado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${datos.productos.filter(p => p.tieneDiscrepancia).map(producto => {
        const ajuste = datos.ajustes.find(a => a.productoId === producto.productoId);
        const diferencia = producto.diferencia || 0;
        return `
                                            <tr>
                                                <td>${producto.nombreProducto}</td>
                                                <td class="text-center">${producto.cantidadSistema}</td>
                                                <td class="text-center">${producto.cantidadFisica}</td>
                                                <td class="text-center ${diferencia > 0 ? 'text-success' : 'text-danger'}">
                                                    ${diferencia > 0 ? '+' : ''}${diferencia}
                                                </td>
                                                <td class="text-center">
                                                    ${ajuste ? `<span class="badge bg-info">${obtenerTextoTipoAjuste(ajuste.tipoAjuste)}</span>` : 'Sin ajuste'}
                                                </td>
                                            </tr>
                                        `;
    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- RECOMENDACIONES Y ALERTAS -->
            ${datos.resumen.recomendaciones.length > 0 || datos.resumen.alertas.length > 0 ? `
                <div class="row">
                    ${datos.resumen.recomendaciones.length > 0 ? `
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header bg-info text-white">
                                    <h6 class="mb-0"><i class="bi bi-lightbulb me-2"></i>Recomendaciones</h6>
                                </div>
                                <div class="card-body">
                                    <ul class="mb-0">
                                        ${datos.resumen.recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${datos.resumen.alertas.length > 0 ? `
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header bg-warning text-dark">
                                    <h6 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Alertas</h6>
                                </div>
                                <div class="card-body">
                                    <ul class="mb-0">
                                        ${datos.resumen.alertas.map(alerta => `<li>${alerta}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * ✅ FUNCIÓN: Exportar inventario (usando utilidades globales)
 */
/**
 * ✅ FUNCIÓN: Mostrar opciones de descarga de reporte
 */
async function mostrarOpcionesDescarga(inventarioId, tituloInventario) {
    try {
        const resultado = await Swal.fire({
            title: '📥 Descargar Reporte de Inventario',
            html: `
                <div class="text-start">
                    <p class="mb-3"><strong>Inventario:</strong> ${tituloInventario || `ID: ${inventarioId}`}</p>
                    <p class="text-muted">Selecciona el formato de descarga:</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="bi bi-file-earmark-excel me-2"></i>Descargar Excel',
            denyButtonText: '<i class="bi bi-file-earmark-pdf me-2"></i>Descargar PDF',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            denyButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d'
        });

        if (resultado.isConfirmed) {
            // Descargar Excel
            await descargarReporteExcel(inventarioId);
        } else if (resultado.isDenied) {
            // Descargar PDF
            await descargarReportePdf(inventarioId);
        }

    } catch (error) {
        console.error('❌ Error mostrando opciones de descarga:', error);
        mostrarError('Error al mostrar opciones de descarga');
    }
}

/**
 * ✅ FUNCIÓN: Descargar reporte en formato Excel
 */
async function descargarReporteExcel(inventarioId) {
    try {
        console.log('📥 Descargando reporte Excel para inventario:', inventarioId);

        // Mostrar loading
        Swal.fire({
            title: 'Generando reporte...',
            text: 'Por favor espera mientras se genera el archivo Excel',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Construir URL del endpoint
        const url = `/api/Reportes/inventario/${inventarioId}/excel`;

        // Realizar petición con autenticación
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Obtener blob del archivo
        const blob = await response.blob();

        // Crear nombre de archivo
        const fileName = `Reporte_Inventario_${inventarioId}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Crear link de descarga y hacer clic automático
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        // Cerrar loading y mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            text: `El archivo ${fileName} se ha descargado correctamente`,
            timer: 3000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('❌ Error descargando Excel:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al descargar',
            text: error.message || 'No se pudo descargar el reporte Excel. Verifica tus permisos.',
            confirmButtonColor: '#d33'
        });
    }
}

/**
 * ✅ FUNCIÓN: Descargar reporte en formato PDF
 */
async function descargarReportePdf(inventarioId) {
    try {
        console.log('📄 Descargando reporte PDF para inventario:', inventarioId);

        // Mostrar loading
        Swal.fire({
            title: 'Generando reporte...',
            text: 'Por favor espera mientras se genera el archivo PDF',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Construir URL del endpoint
        const url = `/api/Reportes/inventario/${inventarioId}/pdf`;

        // Realizar petición con autenticación
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Obtener blob del archivo
        const blob = await response.blob();

        // Crear nombre de archivo
        const fileName = `Reporte_Inventario_${inventarioId}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Crear link de descarga y hacer clic automático
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        // Cerrar loading y mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            text: `El archivo ${fileName} se ha descargado correctamente`,
            timer: 3000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('❌ Error descargando PDF:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al descargar',
            text: error.message || 'No se pudo descargar el reporte PDF. Verifica tus permisos.',
            confirmButtonColor: '#d33'
        });
    }
}

/**
 * ✅ FUNCIÓN: Exportar inventario (wrapper que muestra opciones)
 */
async function exportarInventario(inventarioId) {
    try {
        // ✅ Si no se pasa inventarioId, obtenerlo de la configuración
        if (!inventarioId) {
            inventarioId = window.inventarioConfig?.inventarioId || getInventarioIdFromUrl();
        }

        if (!inventarioId) {
            throw new Error('No se pudo obtener el ID del inventario');
        }

        console.log('📤 Exportando inventario:', inventarioId);

        // ✅ OBTENER TÍTULO DEL INVENTARIO
        const tituloInventario = $('#tituloInventario').text().trim() ||
            $('.inventario-titulo').text().trim() ||
            window.inventarioConfig?.titulo ||
            'Inventario';

        // ✅ LLAMAR A LA FUNCIÓN DE OPCIONES DE DESCARGA
        await mostrarOpcionesDescarga(inventarioId, tituloInventario);

    } catch (error) {
        console.error('❌ Error al exportar inventario:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo abrir las opciones de descarga',
            confirmButtonColor: '#d33'
        });
    }
}

/**
 * ✅ FUNCIÓN: Volver a la lista de inventarios
 */
function volverAInventarios() {
    Swal.fire({
        title: '¿Salir del Inventario?',
        text: '¿Estás seguro de que quieres salir de la toma de inventario?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/Inventario/ProgramarInventario';
        }
    });
}

/**
 * ✅ FUNCIÓN: Imprimir reporte
 */
function imprimirReporte() {
    window.print();
}



/**
 * ✅ FUNCIÓN: Exportar reporte a Excel
 */
async function exportarReporteExcel(inventarioId) {
    mostrarInfo('Función de exportación Excel en desarrollo');
}

/**
 * ✅ FUNCIÓN: Exportar reporte a PDF
 */
async function exportarReportePDF(inventarioId) {
    mostrarInfo('Función de exportación PDF en desarrollo');
}

// ✅ HACER FUNCIONES GLOBALES
window.finalizarInventarioCompleto = finalizarInventarioCompleto;
window.generarReporteInventario = generarReporteInventario;
window.exportarInventario = exportarInventario;
window.volverAInventarios = volverAInventarios;


// ✅ CÓDIGO DETECTIVE - Agregar al final del archivo
$(document).ready(function () {
    // Espiar cuando alguien cambia la barra de progreso
    const barraOriginal = $('#barraProgreso');

    if (barraOriginal.length) {
        // Crear observador para detectar cambios
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const nuevoAncho = $('#barraProgreso').css('width');

                    if (nuevoAncho === '0px') {
                        console.error('🚨 DETECTIVE: ¡Alguien reseteó la barra a 0px!');
                        console.error('🚨 Stack trace del culpable:');
                        console.trace();
                    }
                }
            });
        });

        observer.observe(barraOriginal[0], {
            attributes: true,
            attributeFilter: ['style']
        });

        console.log('🕵️ Detective activado - monitoreando cambios en la barra');
    }
});

// ✅ ESPIAR FUNCIONES SOSPECHOSAS
const funcionesOriginales = {};

// Interceptar cargarProductosInventario
if (typeof cargarProductosInventario === 'function') {
    funcionesOriginales.cargarProductosInventario = cargarProductosInventario;
    window.cargarProductosInventario = function (...args) {
        console.log('🔍 DETECTIVE: cargarProductosInventario ejecutándose...');
        return funcionesOriginales.cargarProductosInventario.apply(this, args);
    };
}

// Interceptar actualizarEstadisticas (si existe)
if (typeof actualizarEstadisticas === 'function') {
    funcionesOriginales.actualizarEstadisticas = actualizarEstadisticas;
    window.actualizarEstadisticas = function (...args) {
        console.log('🔍 DETECTIVE: actualizarEstadisticas ejecutándose...');
        return funcionesOriginales.actualizarEstadisticas.apply(this, args);
    };
}

// ✅ FUNCIONES DE DEBUG - Agregar al final del archivo

/**
 * ✅ FUNCIÓN DE DEBUG: Mostrar todos los ajustes pendientes
 */
function debugAjustesPendientes() {
    console.log('🔍 === DEBUG AJUSTES PENDIENTES ===');
    console.log('📊 Total ajustes cargados:', ajustesPendientes ? ajustesPendientes.length : 0);

    if (ajustesPendientes && ajustesPendientes.length > 0) {
        ajustesPendientes.forEach((ajuste, index) => {
            console.log(`${index + 1}. Producto ${ajuste.productoId} - Estado: ${ajuste.estado} - Tipo: ${ajuste.tipoAjuste}`);
        });
    } else {
        console.log('❌ No hay ajustes pendientes cargados');
    }

    return ajustesPendientes;
}

/**
 * ✅ FUNCIÓN DE DEBUG COMPLETO
 */
window.debugInventarioCompleto = function () {
    console.log('🔍 === DEBUG COMPLETO ===');
    console.log('📦 Productos:', productosInventario ? productosInventario.length : 0);
    console.log('🔄 Ajustes pendientes:', ajustesPendientes ? ajustesPendientes.length : 0);

    if (productosInventario && productosInventario.length > 0) {
        console.log('📋 Detalle por producto:');
        productosInventario.forEach(producto => {
            const tieneAjuste = verificarAjustePendiente(producto.productoId);
            console.log(`  Producto ${producto.productoId} (${producto.nombreProducto}): Discrepancia=${producto.tieneDiscrepancia}, Ajuste=${tieneAjuste}`);
        });
    }

    debugAjustesPendientes();

    return {
        productos: productosInventario ? productosInventario.length : 0,
        ajustes: ajustesPendientes ? ajustesPendientes.length : 0
    };
};

/**
 * ✅ FUNCIÓN PARA VER ESTADO ACTUAL
 */
window.verEstadoActual = function () {
    console.log('📊 Estado actual:');
    console.log('  productosInventario:', productosInventario ? productosInventario.length : 'undefined');
    console.log('  ajustesPendientes:', ajustesPendientes ? ajustesPendientes.length : 'undefined');
    console.log('  estadisticasActuales:', estadisticasActuales);
};
// =====================================
// FILTROS EN CASCADA PARA LLANTAS
// =====================================

// Variables globales para filtros de llantas
let filtrosLlantasActivos = {
    ancho: '',
    perfil: '',
    diametro: '',
    tipoTerreno: '',
    capas: ''
};

/**
 * ✅ FUNCIÓN: Poblar filtros de llantas desde la tabla
 */
function poblarFiltrosLlantas() {
    try {
        console.log('📊 Poblando filtros de llantas...');

        const valores = {
            anchos: new Set(),
            perfiles: new Set(),
            diametros: new Set(),
            tiposTerreno: new Set(),
            capas: new Set()
        };

        // Recorrer todas las filas de la tabla
        $('#tablaProductosBody tr').each(function () {
            const $fila = $(this);

            // Obtener el texto de la columna de medidas (columna 3: #, Producto, Medidas)
            const medidasTexto = $fila.find('td:eq(2)').text().trim();

            if (medidasTexto && medidasTexto !== '-' && medidasTexto !== 'N/A') {
                // Parsear formato CON perfil: 175/70/R12
                let match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);

                if (match) {
                    const [, ancho, perfil, diametro] = match;

                    if (ancho) {
                        const anchoNum = parseFloat(ancho);
                        valores.anchos.add((anchoNum % 1 === 0) ? anchoNum.toString() : ancho);
                    }

                    if (perfil) {
                        const perfilNum = parseFloat(perfil);
                        valores.perfiles.add((perfilNum % 1 === 0) ? perfilNum.toString() : perfil);
                    }

                    if (diametro) {
                        const diametroNum = parseFloat(diametro);
                        valores.diametros.add((diametroNum % 1 === 0) ? diametroNum.toString() : diametro);
                    }
                } else {
                    // Parsear formato SIN perfil: 700/R16
                    match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);

                    if (match) {
                        const [, ancho, diametro] = match;

                        if (ancho) {
                            const anchoNum = parseFloat(ancho);
                            valores.anchos.add((anchoNum % 1 === 0) ? anchoNum.toString() : ancho);
                        }

                        if (diametro) {
                            const diametroNum = parseFloat(diametro);
                            valores.diametros.add((diametroNum % 1 === 0) ? diametroNum.toString() : diametro);
                        }
                    }
                }
            }

            // Extraer Tipo de Terreno (columna 4)
            const tipoTerreno = $fila.find('td:eq(3)').text().trim();
            if (tipoTerreno && tipoTerreno !== '-' && tipoTerreno !== 'N/A') {
                valores.tiposTerreno.add(tipoTerreno);
            }

            // Extraer Capas (desde data attribute)
            const capas = $fila.data('capas') || $fila.attr('data-capas');
            if (capas && capas !== 'N/A' && capas !== '-' && capas !== '' && capas !== null) {
                valores.capas.add(String(capas));
            }
        });

        // Poblar selectores
        const anchos = Array.from(valores.anchos).sort((a, b) => parseFloat(a) - parseFloat(b));
        $('#filterAncho').html('<option value="">Todos</option>' +
            anchos.map(ancho => `<option value="${ancho}">${ancho}</option>`).join(''));

        const perfiles = Array.from(valores.perfiles).sort((a, b) => parseFloat(a) - parseFloat(b));
        $('#filterPerfil').html('<option value="">Todos</option>' +
            perfiles.map(perfil => `<option value="${perfil}">${perfil}</option>`).join(''));

        const diametros = Array.from(valores.diametros).sort((a, b) => parseFloat(a) - parseFloat(b));
        $('#filterDiametro').html('<option value="">Todos</option>' +
            diametros.map(diametro => `<option value="${diametro}">R${diametro}"</option>`).join(''));

        const tiposTerreno = Array.from(valores.tiposTerreno).sort();
        $('#filterTipoTerreno').html('<option value="">Todos</option>' +
            tiposTerreno.map(tipo => `<option value="${tipo}">${tipo}</option>`).join(''));

        const capas = Array.from(valores.capas).sort((a, b) => parseInt(a) - parseInt(b));
        $('#filterCapas').html('<option value="">Todas</option>' +
            capas.map(c => `<option value="${c}">${c} capas</option>`).join(''));

        console.log('✅ Filtros poblados:', {
            anchos: anchos.length,
            perfiles: perfiles.length,
            diametros: diametros.length,
            tiposTerreno: tiposTerreno.length,
            capas: capas.length
        });
    } catch (error) {
        console.error('❌ Error poblando filtros:', error);
    }
}

/**
 * ✅ FUNCIÓN: Actualizar filtros en cascada
 */
function actualizarFiltrosCascada() {
    try {
        console.log('🔄 Actualizando filtros en cascada...');

        const anchoSel = filtrosLlantasActivos.ancho;
        const perfilSel = filtrosLlantasActivos.perfil;
        const diametroSel = filtrosLlantasActivos.diametro;
        const capasSel = filtrosLlantasActivos.capas;

        // Si no hay filtros, restaurar todos
        if (!anchoSel && !perfilSel && !diametroSel) {
            poblarFiltrosLlantas();
            return;
        }

        const valores = {
            anchos: new Set(),
            perfiles: new Set(),
            diametros: new Set(),
            tiposTerreno: new Set(),
            capas: new Set()
        };

        // Recorrer filas visibles
        $('#tablaProductosBody tr:visible').each(function () {
            const $fila = $(this);
            const medidasTexto = $fila.find('td:eq(2)').text().trim();

            if (!medidasTexto || medidasTexto === '-' || medidasTexto === 'N/A') return;

            let match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);
            let ancho, perfil, diametro;

            if (match) {
                [, ancho, perfil, diametro] = match;
            } else {
                match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);
                if (match) {
                    [, ancho, diametro] = match;
                    perfil = null;
                }
            }

            // Verificar si cumple filtros
            let cumple = true;
            if (anchoSel && ancho != anchoSel) cumple = false;
            if (perfilSel && perfil != perfilSel) cumple = false;
            if (diametroSel && diametro != diametroSel) cumple = false;

            if (cumple) {
                if (ancho) {
                    const anchoNum = parseFloat(ancho);
                    valores.anchos.add((anchoNum % 1 === 0) ? anchoNum.toString() : ancho);
                }
                if (perfil) {
                    const perfilNum = parseFloat(perfil);
                    valores.perfiles.add((perfilNum % 1 === 0) ? perfilNum.toString() : perfil);
                }
                if (diametro) {
                    const diametroNum = parseFloat(diametro);
                    valores.diametros.add((diametroNum % 1 === 0) ? diametroNum.toString() : diametro);
                }

                const tipoTerreno = $fila.find('td:eq(3)').text().trim();
                if (tipoTerreno && tipoTerreno !== '-') {
                    valores.tiposTerreno.add(tipoTerreno);
                }

                const capas = $fila.data('capas') || $fila.attr('data-capas');
                if (capas && capas !== 'N/A' && capas !== '-' && capas !== null) {
                    valores.capas.add(String(capas));
                }
            }
        });

        // Actualizar selectores
        if (!anchoSel) {
            const anchos = Array.from(valores.anchos).sort((a, b) => parseFloat(a) - parseFloat(b));
            $('#filterAncho').html('<option value="">Todos</option>' +
                anchos.map(a => `<option value="${a}">${a}</option>`).join(''));
        }

        if (anchoSel || !perfilSel) {
            const perfiles = Array.from(valores.perfiles).sort((a, b) => parseFloat(a) - parseFloat(b));
            $('#filterPerfil').html('<option value="">Todos</option>' +
                perfiles.map(p => `<option value="${p}">${p}</option>`).join(''));
            $('#filterPerfil').val(perfilSel);
        }

        if (anchoSel || perfilSel || !diametroSel) {
            const diametros = Array.from(valores.diametros).sort((a, b) => parseFloat(a) - parseFloat(b));
            $('#filterDiametro').html('<option value="">Todos</option>' +
                diametros.map(d => `<option value="${d}">R${d}"</option>`).join(''));
            $('#filterDiametro').val(diametroSel);
        }

        if (anchoSel || perfilSel || diametroSel) {
            const tiposTerreno = Array.from(valores.tiposTerreno).sort();
            $('#filterTipoTerreno').html('<option value="">Todos</option>' +
                tiposTerreno.map(t => `<option value="${t}">${t}</option>`).join(''));
        }

        if (anchoSel || perfilSel || diametroSel) {
            const capas = Array.from(valores.capas).sort((a, b) => parseInt(a) - parseInt(b));
            if (capas.length > 0) {
                $('#filterCapas').html('<option value="">Todas</option>' +
                    capas.map(c => `<option value="${c}">${c} capas</option>`).join(''));
            } else {
                $('#filterCapas').html('<option value="">Todas</option>');
            }
            $('#filterCapas').val(capasSel);
        }

        console.log('✅ Filtros en cascada actualizados');
    } catch (error) {
        console.error('❌ Error actualizando cascada:', error);
    }
}

/**
 * ✅ FUNCIÓN: Aplicar filtros de llantas
 */
function aplicarFiltrosLlantas() {
    try {
        console.log('🔍 Aplicando filtros de llantas:', filtrosLlantasActivos);

        $('#tablaProductosBody tr').each(function () {
            const $fila = $(this);
            const medidasTexto = $fila.find('td:eq(2)').text().trim();
            const tipoTerreno = $fila.find('td:eq(3)').text().trim();

            let mostrar = true;

            // Filtros de medidas
            if (filtrosLlantasActivos.ancho || filtrosLlantasActivos.perfil || filtrosLlantasActivos.diametro) {
                if (!medidasTexto || medidasTexto === '-' || medidasTexto === 'N/A') {
                    mostrar = false;
                } else {
                    let match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);
                    let ancho, perfil, diametro;

                    if (match) {
                        [, ancho, perfil, diametro] = match;
                    } else {
                        match = medidasTexto.match(/^(\d+(?:\.\d+)?)\/R?(\d+(?:\.\d+)?)$/);
                        if (match) {
                            [, ancho, diametro] = match;
                            perfil = null;
                        }
                    }

                    if (filtrosLlantasActivos.ancho && ancho != filtrosLlantasActivos.ancho) mostrar = false;
                    if (filtrosLlantasActivos.perfil && perfil != filtrosLlantasActivos.perfil) mostrar = false;
                    if (filtrosLlantasActivos.diametro && diametro != filtrosLlantasActivos.diametro) mostrar = false;
                }
            }

            // Filtro de tipo de terreno
            if (filtrosLlantasActivos.tipoTerreno) {
                if (!tipoTerreno || tipoTerreno === '-' || tipoTerreno === 'N/A' ||
                    tipoTerreno !== filtrosLlantasActivos.tipoTerreno) {
                    mostrar = false;
                }
            }

            // Filtro de capas
            if (filtrosLlantasActivos.capas) {
                const capas = $fila.data('capas') || $fila.attr('data-capas');
                if (!capas || capas === '-' || capas === 'N/A' || String(capas) !== filtrosLlantasActivos.capas) {
                    mostrar = false;
                }
            }

            if (mostrar) {
                $fila.show();
            } else {
                $fila.hide();
            }
        });

        // ✅ MANTENER ORDENAMIENTO DESPUÉS DE FILTRAR
        setTimeout(() => {
            ordenarProductosPorMedidas();
        }, 50);

        const visibles = $('#tablaProductosBody tr:visible').length;
        console.log(`✅ Filtros aplicados. Productos visibles: ${visibles}`);
    } catch (error) {
        console.error('❌ Error aplicando filtros:', error);
    }
}

// =====================================
// FUNCIONES DE MOVIMIENTOS POST-CORTE
// =====================================

/**
 * Actualiza una línea individual procesando sus movimientos post-corte
 */
async function actualizarLineaIndividual(productoId) {
    try {
        console.log(`🔄 Actualizando línea individual para producto ${productoId}`);

        const resultado = await Swal.fire({
            title: '¿Actualizar línea?',
            html: `
                <div class="text-start">
                    <p>Esta acción actualizará la cantidad del sistema con los movimientos registrados después del corte.</p>
                    <p class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i>
                    Si el producto ya fue contado, se recalculará la diferencia automáticamente.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, actualizar',
            cancelButtonText: 'Cancelar'
        });

        if (!resultado.isConfirmed) return;

        // Mostrar loading
        Swal.fire({
            title: 'Actualizando...',
            html: 'Procesando movimientos post-corte',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const usuarioId = window.inventarioConfig?.usuarioId || 0;
        const inventarioId = inventarioActual?.inventarioProgramadoId;

        const response = await fetch('/TomaInventario/ActualizarLineaPostCorte', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                inventarioProgramadoId: inventarioId,
                productoId: productoId,
                usuarioId: usuarioId
            })
        });

        const data = await response.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });

            // Recargar productos y alertas
            await cargarProductosInventario(inventarioId);
            await cargarAlertasPostCorte();
            verificarMovimientosPostCorte();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo actualizar la línea'
            });
        }
    } catch (error) {
        console.error('❌ Error actualizando línea:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al actualizar la línea'
        });
    }
}

/**
 * Actualiza todas las líneas con movimientos post-corte pendientes
 */
async function actualizarTodasLineas() {
    try {
        console.log('🔄 Actualizando todas las líneas con movimientos');

        const resultado = await Swal.fire({
            title: '¿Actualizar todas las líneas?',
            html: `
                <div class="text-start">
                    <p>Esta acción actualizará TODAS las líneas que tienen movimientos post-corte pendientes.</p>
                    <p class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i>
                    Las cantidades del sistema se ajustarán y las diferencias se recalcularán automáticamente.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, actualizar todas',
            cancelButtonText: 'Cancelar'
        });

        if (!resultado.isConfirmed) return;

        // Mostrar loading
        Swal.fire({
            title: 'Actualizando líneas...',
            html: 'Procesando movimientos post-corte',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const usuarioId = window.inventarioConfig?.usuarioId || 0;
        const inventarioId = inventarioActual?.inventarioProgramadoId;

        const response = await fetch('/TomaInventario/ActualizarLineasMasivas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                inventarioProgramadoId: inventarioId,
                usuarioId: usuarioId,
                productoIds: [] // Vacío = todas las líneas con movimientos
            })
        });

        const data = await response.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                html: `
                    <p>${data.message}</p>
                    <p class="small text-muted">
                        Líneas actualizadas: ${data.data.lineasActualizadas}<br>
                        Movimientos procesados: ${data.data.movimientosProcesados}
                    </p>
                `,
                timer: 3000
            });

            // Recargar productos y alertas
            await cargarProductosInventario(inventarioId);
            await cargarAlertasPostCorte();
            verificarMovimientosPostCorte();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudieron actualizar las líneas'
            });
        }
    } catch (error) {
        console.error('❌ Error actualizando líneas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al actualizar las líneas'
        });
    }
}

/**
 * Verifica si hay productos con movimientos post-corte y actualiza la UI
 */
function verificarMovimientosPostCorte() {
    try {
        // Contar productos con movimientos
        const productosConMovimientos = productosInventario.filter(p => (p.movimientosPostCorte || 0) !== 0);
        const totalConMovimientos = productosConMovimientos.length;

        console.log(`📊 Productos con movimientos post-corte: ${totalConMovimientos}`);

        // Actualizar contador y mostrar/ocultar botón
        const $btnActualizar = $('#btnActualizarTodasLineas');
        const $contador = $('#contadorLineasConMovimientos');

        if (totalConMovimientos > 0) {
            $contador.text(totalConMovimientos);
            $btnActualizar.show();
        } else {
            $btnActualizar.hide();
        }
    } catch (error) {
        console.error('❌ Error verificando movimientos post-corte:', error);
    }
}

// =====================================
// EVENT LISTENERS PARA FILTROS DE LLANTAS
// =====================================

$(document).ready(function () {
    // ✅ Event listener para botón de actualizar todas las líneas
    $('#btnActualizarTodasLineas').on('click', actualizarTodasLineas);

    // ✅ Event listeners para filtros en cascada (siempre activos)
    $('#filterAncho').on('change', function () {
        filtrosLlantasActivos.ancho = $(this).val();
        actualizarFiltrosCascada();
        aplicarFiltrosLlantas();
    });

    $('#filterPerfil').on('change', function () {
        filtrosLlantasActivos.perfil = $(this).val();
        actualizarFiltrosCascada();
        aplicarFiltrosLlantas();
    });

    $('#filterDiametro').on('change', function () {
        filtrosLlantasActivos.diametro = $(this).val();
        actualizarFiltrosCascada();
        aplicarFiltrosLlantas();
    });

    $('#filterTipoTerreno').on('change', function () {
        filtrosLlantasActivos.tipoTerreno = $(this).val();
        aplicarFiltrosLlantas();
    });

    $('#filterCapas').on('change', function () {
        filtrosLlantasActivos.capas = $(this).val();
        actualizarFiltrosCascada();
        aplicarFiltrosLlantas();
    });

    // Limpiar filtros de llantas
    $('#btnLimpiarFiltrosLlantas').on('click', function () {
        filtrosLlantasActivos = { ancho: '', perfil: '', diametro: '', tipoTerreno: '', capas: '' };
        $('#filterAncho, #filterPerfil, #filterDiametro, #filterTipoTerreno, #filterCapas').val('');
        poblarFiltrosLlantas();
        $('#tablaProductosBody tr').show();

        // ✅ REORDENAR DESPUÉS DE LIMPIAR
        setTimeout(() => {
            ordenarProductosPorMedidas();
        }, 100);

        console.log('🧹 Filtros de llantas limpiados');
    });

    // =====================================
    // EVENTOS DE ALERTAS DE MOVIMIENTOS POST-CORTE
    // =====================================

    // Actualizar alertas
    $('#btnActualizarAlertas').on('click', function () {
        cargarAlertasPostCorte();
    });

    // Marcar todas las alertas como leídas
    $('#btnMarcarAlertasLeidas').on('click', function () {
        marcarTodasAlertasLeidas();
    });

    // Toggle del panel de alertas
    $('#btnToggleAlertas').on('click', function () {
        const $contenido = $('#contenidoAlertasPostCorte');
        const $icon = $(this).find('i');

        if ($contenido.is(':visible')) {
            $contenido.slideUp();
            $icon.removeClass('bi-chevron-up').addClass('bi-chevron-down');
            $(this).html('<i class="bi bi-chevron-down me-1"></i>Mostrar');
        } else {
            $contenido.slideDown();
            $icon.removeClass('bi-chevron-down').addClass('bi-chevron-up');
            $(this).html('<i class="bi bi-chevron-up me-1"></i>Ocultar');
        }
    });
});
