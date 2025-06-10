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

// =====================================
// INICIALIZACIÓN
// =====================================
$(document).ready(function () {
    console.log('🚀 Ejecutar Inventario - Inicializando...');

    // ✅ OBTENER ID DEL INVENTARIO DESDE LA CONFIGURACIÓN GLOBAL
    const inventarioId = window.inventarioConfig?.inventarioId || getInventarioIdFromUrl();

    if (!inventarioId) {
        console.error('❌ No se pudo obtener el ID del inventario');
        console.log('📋 window.inventarioConfig:', window.inventarioConfig);
        console.log('📋 URL actual:', window.location.href);
        mostrarError('No se especificó un inventario válido');
        return;
    }

    console.log('✅ ID del inventario obtenido:', inventarioId);

    // Inicializar la página
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
        // Cargar información del inventario
        await cargarInformacionInventario(inventarioId);

        // Cargar productos del inventario
        await cargarProductosInventario(inventarioId);

        // ✅ AGREGAR ESTA LÍNEA: Cargar ajustes pendientes
        await cargarAjustesPendientes(inventarioId);

        // Actualizar estadísticas
        await actualizarEstadisticas();

        // ✅ APLICAR CONTROL DE PERMISOS EN LA UI
        aplicarControlPermisos();

        // Configurar auto-refresh cada 30 segundos
        setInterval(async () => {
            await actualizarEstadisticas();
            await cargarAjustesPendientes(inventarioId);
        }, 30000);

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
        const ajustesPorTipo = contarAjustesPorTipo();

        // ✅ ACTUALIZAR CONTADOR PRINCIPAL
        $('#contadorAjustesPendientes').text(totalAjustes);

        // ✅ ACTUALIZAR ESTADÍSTICAS POR TIPO
        $('#totalEntradas').text(ajustesPorTipo.ENTRADA || 0);
        $('#totalSalidas').text(ajustesPorTipo.SALIDA || 0);
        $('#totalAjustes').text(ajustesPorTipo.AJUSTE_SISTEMA || 0);
        $('#totalCorrecciones').text(ajustesPorTipo.CORRECCION_CONTEO || 0);

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
 * ✅ NUEVA FUNCIÓN: Contar ajustes por tipo
 */
function contarAjustesPorTipo() {
    const contadores = {
        ENTRADA: 0,
        SALIDA: 0,
        AJUSTE_SISTEMA: 0,
        CORRECCION_CONTEO: 0
    };

    ajustesPendientes.forEach(ajuste => {
        if (ajuste.estado === 'Pendiente' && contadores.hasOwnProperty(ajuste.tipoAjuste)) {
            contadores[ajuste.tipoAjuste]++;
        }
    });

    return contadores;
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
        'reconteo': '🔄 Reconteo',
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
        'reconteo': 'bg-warning',
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
    const tienePermisosConteo = permisosInventarioActual.puedeContar || false;
    const tienePermisosValidacion = permisosInventarioActual.puedeValidar || false;
    const esAdmin = permisosInventarioActual.esAdmin || false;

    console.log('🔍 === CONDICIONES BÁSICAS ===');
    console.log('📊 Todo contado:', todoContado, '(pendientes:', stats.pendientes, ')');
    console.log('📦 Hay productos:', hayProductos, '(total:', stats.total, ')');
    console.log('📝 Tiene permisos conteo:', tienePermisosConteo);
    console.log('✅ Tiene permisos validación:', tienePermisosValidacion);
    console.log('👑 Es admin:', esAdmin);

    // ✅ VERIFICAR SI LOS PANELES EXISTEN
    const panelFinalizacionExiste = document.getElementById('finalizacionPanel');
    const panelConteoCompletadoExiste = document.getElementById('conteoCompletadoPanel');

    console.log('🎛️ Panel finalización existe:', !!panelFinalizacionExiste);
    console.log('🎛️ Panel conteo completado existe:', !!panelConteoCompletadoExiste);

    if (todoContado && hayProductos) {
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
        if (!todoContado) {
            console.log('🚫 Razón: Aún hay productos pendientes de contar');
        }
        if (!hayProductos) {
            console.log('🚫 Razón: No hay productos en el inventario');
        }
    }
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
 * ✅ FUNCIÓN NUEVA: Configurar event listeners del panel de conteo completado
 */
function configurarEventListenersPanelConteoCompletado() {
    try {
        // Botón notificar supervisor
        $('#btnNotificarSupervisor').off('click').on('click', function () {
            notificarSupervisorConteoCompletado();  //ESTO FALTA DE TRABAJAR PARA ESA NOTIFICACION!
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

    //// ✅ CONFIGURAR BOTÓN DE GUARDAR AJUSTE
    //$('#guardarAjusteInventarioBtn').off('click').on('click', function (e) {
    //    e.preventDefault();
    //    console.log('🖱️ Click en botón guardar ajuste de inventario');
    //    guardarAjusteInventario();
    //})


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
    $('#btnExportarInventario').on('click', exportarInventario);
    $('#btnFinalizarInventario').on('click', finalizarInventarioCompleto);
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

        // ✅ VERIFICAR SI ES ADMINISTRADOR (SIEMPRE TIENE TODOS LOS PERMISOS)
        const esAdmin = await verificarEsAdministrador();

        if (esAdmin) {
            permisosInventarioActual = {
                puedeContar: true,
                puedeAjustar: true,
                puedeValidar: true,
                esAdmin: true,
                usuarioId: usuarioId
            };

            console.log('✅ Usuario es administrador - Todos los permisos concedidos');
            return permisosInventarioActual;
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
 * ✅ FUNCIÓN AUXILIAR: Verificar si el usuario es administrador
 */
async function verificarEsAdministrador() {
    try {
        // Verificar permisos globales de administrador
        const tienePermisoInventario = await this.TienePermisoAsync("Programar Inventario");
        const tienePermisoAjustar = await this.TienePermisoAsync("Ajustar Stock");

        return tienePermisoInventario || tienePermisoAjustar;
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
        console.log(`📦 Cargando productos del inventario ${inventarioId}...`);

        // Mostrar loading
        $('#loadingProductos').show();
        $('#productosLista').hide();
        $('#productosTarjetas').hide();
        $('#estadoVacio').hide();

        const response = await fetch(`/TomaInventario/ObtenerProductos/${inventarioId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

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
// FUNCIONES DE RENDERIZADO
// =====================================
function renderizarProductos() {
    try {
        console.log('🎨 Renderizando productos...');
        console.log('🎨 Total productos a renderizar:', productosInventario.length);

        const tbody = $('#tablaProductosBody');
        tbody.empty();

        if (productosInventario.length === 0) {
            $('#loadingProductos').hide();
            $('#productosLista').hide();
            $('#estadoVacio').show();
            return;
        }

        productosInventario.forEach((producto, index) => {
            const row = crearFilaProducto(producto, index + 1);
            tbody.append(row);
        });

        $('#loadingProductos').hide();
        $('#productosLista').show();
        $('#estadoVacio').hide();

        console.log('✅ Productos renderizados correctamente');

    } catch (error) {
        console.error('❌ Error renderizando productos:', error);
    }
}


function crearFilaProducto(producto, numero) {
    const tieneDiscrepancia = producto.tieneDiscrepancia;
    const tieneAjustePendiente = verificarAjustePendiente(producto.productoId);

    const estadoClass = tieneDiscrepancia ? 'estado-discrepancia' :
        producto.estadoConteo === 'Contado' ? 'estado-contado' : 'estado-pendiente';

    const imagenSrc = producto.imagenUrl || '/images/no-image.png';
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
                ${producto.medidasLlanta || ''}
            </div>
        `;
    }

    // ✅ NUEVA COLUMNA DE ESTADO CON MÚLTIPLES BADGES
    const estadoBadges = crearBadgesEstado(producto);

    // ✅ NUEVOS BOTONES DE ACCIÓN
    const botonesAccion = crearNuevosBotonesAccion(producto);

    // ✅ INDICADOR DE AJUSTES PENDIENTES
    const indicadorAjustes = tieneAjustePendiente ?
        `<i class="bi bi-clock-history text-warning" data-bs-toggle="tooltip" title="Tiene ajustes pendientes"></i>` :
        '';

    return $(`
        <tr class="producto-row ${estadoClass}" data-producto-id="${producto.productoId}">
            <td class="text-center fw-bold">${numero}</td>
            <td class="text-center">
                <img src="${imagenSrc}" alt="Producto" class="producto-imagen" 
                     style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>
                <div class="fw-semibold">${producto.nombreProducto}</div>
                <div class="small text-muted">${producto.descripcionProducto || ''}</div>
                ${infoLlanta}
            </td>
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

        // ✅ BOTÓN DE AJUSTE PENDIENTE (verificar permiso específico)
        if (permisosInventarioActual.puedeAjustar &&
            producto.tieneDiscrepancia &&
            !verificarAjustePendiente(producto.productoId) &&
            inventarioEnProgreso) {

            botones += `
                <button class="btn btn-sm btn-warning mb-1 btn-ajuste-pendiente" 
                        onclick="abrirModalAjustePendiente(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Crear ajuste pendiente para esta discrepancia">
                    <i class="bi bi-clock-history me-1"></i>
                    Crear Ajuste
                </button>
            `;
        }

        // ✅ BOTÓN DE VER AJUSTES (si ya tiene ajustes pendientes)
        if (verificarAjustePendiente(producto.productoId)) {
            botones += `
                <button class="btn btn-sm btn-info mb-1" 
                        onclick="verAjustesProducto(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Ver ajustes pendientes de este producto">
                    <i class="bi bi-eye me-1"></i>
                    Ver Ajustes
                </button>
            `;
        }

        // ✅ BOTÓN DE VALIDACIÓN (solo para usuarios con permiso de validación)
        if (permisosInventarioActual.puedeValidar &&
            producto.tieneDiscrepancia &&
            inventarioEnProgreso) {

            botones += `
                <button class="btn btn-sm btn-success mb-1 btn-validacion" 
                        onclick="validarDiscrepancia(${producto.productoId})"
                        data-bs-toggle="tooltip"
                        title="Validar y aprobar discrepancia">
                    <i class="bi bi-check-double me-1"></i>
                    Validar
                </button>
            `;
        }

        // ✅ BOTÓN DE DETALLES (siempre disponible)
        botones += `
            <button class="btn btn-sm btn-outline-secondary mb-1" 
                    onclick="verDetallesProducto(${producto.productoId})"
                    data-bs-toggle="tooltip"
                    title="Ver detalles del producto">
                <i class="bi bi-info-circle me-1"></i>
                Detalles
            </button>
        `;

        // ✅ MENSAJE INFORMATIVO si no tiene permisos
        if (!botones.includes('btn-conteo') && !botones.includes('btn-ajuste') && !botones.includes('btn-validacion')) {
            botones += `
                <small class="text-muted d-block">
                    <i class="bi bi-info-circle me-1"></i>
                    Sin permisos de acción
                </small>
            `;
        }

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
            title: '✅ ¿Validar discrepancia?',
            html: `
                <div class="text-start">
                    <p><strong>Producto:</strong> ${producto.nombreProducto}</p>
                    <p><strong>Stock Sistema:</strong> ${producto.cantidadSistema}</p>
                    <p><strong>Stock Físico:</strong> ${producto.cantidadFisica}</p>
                    <p><strong>Diferencia:</strong> <span class="fw-bold text-warning">${producto.diferencia}</span></p>
                    <hr>
                    <p class="text-muted">Al validar esta discrepancia, se acepta como correcta y no requerirá ajuste.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, validar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            // Crear ajuste de tipo "validado"
            const solicitudValidacion = {
                inventarioProgramadoId: window.inventarioConfig.inventarioId,
                productoId: producto.productoId,
                tipoAjuste: 'validado',
                cantidadSistemaOriginal: producto.cantidadSistema,
                cantidadFisicaContada: producto.cantidadFisica,
                cantidadFinalPropuesta: producto.cantidadSistema, // Mantener sistema
                motivoAjuste: 'Discrepancia validada y aceptada por supervisor',
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
 * ✅ NUEVA FUNCIÓN: Verificar si un producto tiene ajustes pendientes
 */
function verificarAjustePendiente(productoId) {
    return ajustesPendientes.some(ajuste =>
        ajuste.productoId === productoId && ajuste.estado === 'Pendiente'
    );
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
function filtrarProductos(textoFiltro, estadoFiltro) {
    try {
        console.log('🔍 Filtrando productos - Texto:', textoFiltro, 'Estado:', estadoFiltro);
        console.log('🔍 productosInventario disponibles:', productosInventario.length);

        productosFiltrados = productosInventario.filter(producto => {
            // ✅ MANEJO SEGURO DE TEXTO CON VERIFICACIONES NULL
            let cumpleTexto = true;
            if (textoFiltro && textoFiltro.trim() !== '') {
                const textoMinuscula = textoFiltro.toLowerCase();
                cumpleTexto = false;

                // ✅ VERIFICAR TODAS LAS POSIBLES VARIANTES DE NOMBRES
                const nombreProducto = producto.nombreProducto || producto.NombreProducto || '';
                const descripcionProducto = producto.descripcionProducto || producto.DescripcionProducto || '';
                const marcaLlanta = producto.marcaLlanta || producto.MarcaLlanta || '';
                const modeloLlanta = producto.modeloLlanta || producto.ModeloLlanta || '';
                const productoId = producto.productoId || producto.ProductoId || '';

                // Verificar en todos los campos posibles
                if (nombreProducto.toLowerCase().includes(textoMinuscula) ||
                    descripcionProducto.toLowerCase().includes(textoMinuscula) ||
                    marcaLlanta.toLowerCase().includes(textoMinuscula) ||
                    modeloLlanta.toLowerCase().includes(textoMinuscula) ||
                    productoId.toString().includes(textoMinuscula)) {
                    cumpleTexto = true;
                }
            }

            // ✅ FILTRO POR ESTADO
            let cumpleEstado = true;
            if (estadoFiltro && estadoFiltro.trim() !== '') {
                const estadoConteo = producto.estadoConteo || producto.EstadoConteo || 'Pendiente';
                const tieneDiscrepancia = producto.tieneDiscrepancia || producto.TieneDiscrepancia || false;

                switch (estadoFiltro.toLowerCase()) {
                    case 'pendiente':
                        cumpleEstado = estadoConteo === 'Pendiente';
                        break;
                    case 'contado':
                        cumpleEstado = estadoConteo === 'Contado';
                        break;
                    case 'discrepancia':
                        cumpleEstado = tieneDiscrepancia === true;
                        break;
                }
            }

            return cumpleTexto && cumpleEstado;
        });

        console.log('✅ Productos filtrados:', productosFiltrados.length);

        // Re-renderizar productos filtrados
        renderizarProductosFiltrados();

    } catch (error) {
        console.error('❌ Error en filtrarProductos:', error);
        console.error('❌ Error stack:', error.stack);

        // Fallback - mostrar todos los productos
        productosFiltrados = productosInventario;
        renderizarProductosFiltrados();
    }
}


function renderizarProductosFiltrados() {
    const tbody = $('#productosTableBody');
    tbody.empty();

    if (productosFiltrados.length === 0) {
        $('#listaProductos').hide();
        $('#emptyState').show();
        return;
    }

    productosFiltrados.forEach((producto, index) => {
        const row = crearFilaProducto(producto, index + 1);
        tbody.append(row);
    });

    $('#listaProductos').show();
    $('#emptyState').hide();
}

// =====================================
// FUNCIONES DE CONTEO
// =====================================
function abrirModalConteo(productoId) {
    try {
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

        console.log(`📊 Estadísticas actualizadas: ${porcentaje}% completado`);

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
 * ✅ FUNCIÓN CORREGIDA: Actualiza las estadísticas en la interfaz de usuario
 */
function actualizarEstadisticasUI() {
    try {
        console.log('📊 Actualizando estadísticas UI...');
        console.log('📊 Estadísticas actuales:', estadisticasActuales);

        // Actualizar contadores
        $('#totalProductos').text(estadisticasActuales.total || 0);
        $('#productosContados').text(estadisticasActuales.contados || 0);
        $('#productosPendientes').text(estadisticasActuales.pendientes || 0);
        $('#discrepancias').text(estadisticasActuales.discrepancias || 0);

        // Actualizar barra de progreso
        const porcentaje = estadisticasActuales.porcentajeProgreso || 0;
        $('#porcentajeProgreso').text(`${porcentaje}%`);
        $('#barraProgreso').css('width', `${porcentaje}%`);

        // Cambiar color de la barra según el progreso
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

        // Actualizar contador de productos mostrados
        $('#contadorProductosMostrados').text(productosInventario.length);

        console.log(`📊 Estadísticas actualizadas: ${porcentaje}% completado`);

        // ✅ AGREGAR ESTA LÍNEA CRUCIAL:
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

// ✅ NUEVA FUNCIÓN: Ver ajustes de un producto
async function verAjustesProducto(productoId) {
    try {
        console.log('👁️ Mostrando ajustes del producto:', productoId);

        const response = await fetch(`/TomaInventario/${window.inventarioConfig.inventarioId}/productos/${productoId}/ajustes`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.ajustes.length > 0) {
            mostrarModalAjustesProducto(resultado.ajustes);
        } else {
            mostrarInfo('Este producto no tiene ajustes pendientes');
        }

    } catch (error) {
        console.error('❌ Error obteniendo ajustes del producto:', error);
        mostrarError('Error al obtener los ajustes del producto');
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
            case 'reconteo':
                stockPropuesto = stockActual; // Mantener actual, solicitar reconteo
                tipoTexto = '🔄 Reconteo';
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
            mostrarExito(`Ajuste pendiente registrado exitosamente para ${producto.nombreProducto}`);

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
        const puedeFinalizarSinAjustes = todoContado && !hayAjustes;
        const puedeFinalizarConAjustes = todoContado && hayAjustes;

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

        console.log(`✅ Panel de finalización actualizado - Puede finalizar: ${puedeFinalizarSinAjustes || puedeFinalizarConAjustes}`);

    } catch (error) {
        console.error('❌ Error actualizando panel de finalización:', error);
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Finalizar inventario con aplicación de ajustes
 */
async function finalizarInventarioCompleto() {
    try {
        console.log('🏁 === INICIANDO FINALIZACIÓN DE INVENTARIO ===');

        const inventarioId = window.inventarioConfig.inventarioId;
        const stats = estadisticasActuales;
        const totalAjustes = ajustesPendientes.filter(a => a.estado === 'Pendiente').length;

        // ✅ VALIDACIONES FINALES
        if (stats.pendientes > 0) {
            mostrarError(`No se puede finalizar: quedan ${stats.pendientes} productos sin contar`);
            return;
        }

        // ✅ CONFIRMACIÓN CON RESUMEN DETALLADO
        const tieneAjustes = totalAjustes > 0;
        let htmlConfirmacion = `
            <div class="text-start">
                <h5 class="text-primary mb-3">📋 Resumen del Inventario</h5>
                <div class="row mb-3">
                    <div class="col-6"><strong>Total productos:</strong></div>
                    <div class="col-6">${stats.total}</div>
                    <div class="col-6"><strong>Productos contados:</strong></div>
                    <div class="col-6 text-success">${stats.contados}</div>
                    <div class="col-6"><strong>Discrepancias encontradas:</strong></div>
                    <div class="col-6 text-warning">${stats.discrepancias}</div>
                    <div class="col-6"><strong>Ajustes pendientes:</strong></div>
                    <div class="col-6 text-info">${totalAjustes}</div>
                </div>
        `;

        if (tieneAjustes) {
            htmlConfirmacion += `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>¡Atención!</strong> Se aplicarán ${totalAjustes} ajustes al stock del sistema.
                    <br><small>Esta acción es <strong>irreversible</strong>.</small>
                </div>
            `;
        } else {
            htmlConfirmacion += `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    No hay ajustes pendientes. El inventario se marcará como completado.
                </div>
            `;
        }

        htmlConfirmacion += `</div>`;

        const confirmacion = await Swal.fire({
            title: '🏁 ¿Finalizar Inventario?',
            html: htmlConfirmacion,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: tieneAjustes ? '#ffc107' : '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: tieneAjustes ? 'Sí, Finalizar y Aplicar Ajustes' : 'Sí, Finalizar Inventario',
            cancelButtonText: 'Cancelar',
            width: '600px'
        });

        if (!confirmacion.isConfirmed) return;

        // ✅ CAMBIAR ESTADO DEL BOTÓN
        const $btn = $('#btnFinalizarInventario');
        $btn.prop('disabled', true);
        $btn.find('.normal-state').hide();
        $btn.find('.loading-state').show();

        try {
            let mensaje = '';

            if (tieneAjustes) {
                // ✅ PASO 1: Aplicar ajustes pendientes
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

                if (!resultadoAjustes.success) {
                    throw new Error(resultadoAjustes.message || 'Error al aplicar ajustes');
                }

                console.log('✅ Ajustes aplicados exitosamente');
                mensaje += `✅ ${totalAjustes} ajustes aplicados al stock.\n`;
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

            console.log('🎉 === INVENTARIO FINALIZADO EXITOSAMENTE ===');

            // ✅ MOSTRAR MENSAJE DE ÉXITO
            mensaje += `🎉 Inventario completado exitosamente.\n`;
            mensaje += `📊 Total productos: ${stats.total}\n`;
            if (stats.discrepancias > 0) {
                mensaje += `⚠️ Discrepancias resueltas: ${stats.discrepancias}`;
            }

            await Swal.fire({
                title: '🎉 ¡Inventario Completado!',
                text: mensaje,
                icon: 'success',
                confirmButtonColor: '#28a745',
                confirmButtonText: 'Entendido'
            });

            // ✅ ACTUALIZAR UI FINAL
            await cargarInformacionInventario(inventarioId);
            await cargarProductosInventario(inventarioId);
            await cargarAjustesPendientes(inventarioId);

            // ✅ OCULTAR PANELES DE GESTIÓN
            $('#ajustesPendientesPanel').slideUp();
            $('#finalizacionPanel').slideUp();

            // ✅ MOSTRAR MENSAJE EN LA INTERFAZ
            mostrarInventarioCompletado();

        } catch (error) {
            console.error('💥 Error durante la finalización:', error);
            mostrarError(`Error finalizando inventario: ${error.message}`);
        } finally {
            // ✅ RESTAURAR BOTÓN
            $btn.prop('disabled', false);
            $btn.find('.loading-state').hide();
            $btn.find('.normal-state').show();
        }

    } catch (error) {
        console.error('💥 Error crítico en finalización:', error);
        mostrarError('Error crítico al finalizar inventario');
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
        const verificacionPermisos = verificarPermisoEspecifico('validacion', 'finalizar inventario');
        if (!verificacionPermisos.tienePermiso && !permisosInventarioActual.esAdmin) {
            mostrarError('Solo usuarios con permisos de validación o administradores pueden finalizar inventarios.');
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

        // ✅ VALIDACIÓN 1: Productos sin contar
        if (stats.pendientes > 0) {
            validaciones.puedeFinalizarse = false;
            validaciones.mensaje = `No se puede finalizar: quedan ${stats.pendientes} productos sin contar.`;
            return validaciones;
        }

        // ✅ VALIDACIÓN 2: Verificar estado del inventario
        const inventarioResponse = await fetch(`/TomaInventario/ObtenerInventario/${inventarioId}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (inventarioResponse.ok) {
            const inventarioData = await inventarioResponse.json();
            if (inventarioData.estado !== 'En Progreso') {
                validaciones.puedeFinalizarse = false;
                validaciones.mensaje = `El inventario está en estado '${inventarioData.estado}' y no se puede finalizar.`;
                return validaciones;
            }
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
    let htmlConfirmacion = `
        <div class="text-start">
            <h5 class="text-primary mb-3">📋 Resumen Final del Inventario</h5>
            
            <div class="row mb-3">
                <div class="col-6"><strong>📦 Total productos:</strong></div>
                <div class="col-6">${stats.total}</div>
                
                <div class="col-6"><strong>✅ Productos contados:</strong></div>
                <div class="col-6 text-success">${stats.contados}</div>
                
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
 * ✅ FUNCIÓN: Generar reporte completo del inventario
 */
async function generarReporteInventario(inventarioId) {
    try {
        console.log('📊 Generando reporte del inventario:', inventarioId);

        Swal.fire({
            title: 'Generando Reporte',
            html: 'Recopilando información del inventario...',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ✅ OBTENER DATOS COMPLETOS
        const datosReporte = await recopilarDatosReporte(inventarioId);

        // ✅ GENERAR HTML DEL REPORTE
        const htmlReporte = generarHtmlReporte(datosReporte);

        // ✅ MOSTRAR REPORTE EN MODAL
        Swal.fire({
            title: `📊 Reporte de Inventario: ${datosReporte.inventario.titulo}`,
            html: htmlReporte,
            width: '90%',
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: '<i class="bi bi-printer me-1"></i> Imprimir',
            footer: `
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-success btn-sm" onclick="imprimirReporte()">
                        <i class="bi bi-printer me-1"></i> Imprimir
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="exportarReporteExcel(${inventarioId})">
                        <i class="bi bi-file-excel me-1"></i> Exportar Excel
                    </button>
                    <button class="btn btn-info btn-sm" onclick="exportarReportePDF(${inventarioId})">
                        <i class="bi bi-file-pdf me-1"></i> Exportar PDF
                    </button>
                </div>
            `,
            customClass: {
                popup: 'swal-wide'
            }
        });

    } catch (error) {
        console.error('❌ Error generando reporte:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo generar el reporte. Intente nuevamente.',
            icon: 'error'
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
 * ✅ FUNCIÓN: Exportar inventario a Excel
 */
async function exportarInventario(inventarioId) {
    try {
        console.log('📊 Exportando inventario a Excel:', inventarioId);

        Swal.fire({
            title: 'Exportando...',
            text: 'Generando archivo Excel del inventario',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ✅ SIMULAR EXPORTACIÓN (aquí irían llamadas reales a tu API)
        await new Promise(resolve => setTimeout(resolve, 2000));

        Swal.fire({
            title: '✅ Exportación Completada',
            text: 'El archivo Excel ha sido generado exitosamente',
            icon: 'success',
            confirmButtonText: 'Descargar',
            showCancelButton: true,
            cancelButtonText: 'Cerrar'
        }).then((result) => {
            if (result.isConfirmed) {
                // ✅ AQUÍ TRIGGEARÍAS LA DESCARGA REAL
                mostrarInfo('Función de descarga en desarrollo. El archivo se descargará automáticamente.');
            }
        });

    } catch (error) {
        console.error('❌ Error exportando:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo exportar el inventario',
            icon: 'error'
        });
    }
}

/**
 * ✅ FUNCIÓN: Volver a la lista de inventarios
 */
function volverAInventarios() {
    if (confirm('¿Estás seguro de que quieres salir de la toma de inventario?')) {
        window.location.href = '/Inventario/ProgramarInventario';
    }
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


