// ===== MÓDULO DE FILTROS PARA FACTURAS PENDIENTES (FRONTEND ONLY) =====

let todasLasFacturasPendientes = []; // Array para almacenar todas las facturas pendientes
let facturasPendientesFiltradas = []; // Array para facturas filtradas
let paginaActualFacturas = 1;
let facturasPorPagina = 20;
let filtrosBusquedaFacturas = {
    texto: '',
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: ''
};

/**
 * Inicializar filtros de facturas pendientes
 */
function inicializarFiltrosFacturasPendientes() {
    console.log('🔍 === INICIALIZANDO FILTROS DE FACTURAS PENDIENTES (FRONTEND) ===');

    // Verificar que jQuery esté disponible
    if (typeof $ === 'undefined') {
        console.error('❌ jQuery no está disponible');
        return;
    }

    // Configurar eventos usando delegación de eventos para asegurar que funcionen
    configurarEventosFacturasPendientes();

    // Cargar todas las facturas pendientes inicialmente
    cargarTodasLasFacturasPendientes();

    console.log('✅ Filtros de facturas pendientes inicializados correctamente');
}

/**
 * Configurar eventos para facturas pendientes usando delegación
 */
function configurarEventosFacturasPendientes() {
    console.log('🔍 Configurando eventos de filtrado para facturas pendientes...');

    // Limpiar eventos anteriores
    $(document).off('.facturasPendientesFilter');

    // Configurar eventos de búsqueda para ambas versiones (desktop y móvil)
    $(document).on('input.facturasPendientesFilter keyup.facturasPendientesFilter', '#facturasPendientesModal #busquedaFacturasPendientes, #facturasPendientesModal #busquedaFacturasPendientesMobile', function() {
        const termino = $(this).val().trim();
        console.log('🔍 Término de búsqueda facturas:', termino);

        // Sincronizar el valor en ambos campos
        $('#busquedaFacturasPendientes, #busquedaFacturasPendientesMobile').val(termino);

        filtrosBusquedaFacturas.texto = termino;
        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar eventos de cambio de estado para ambas versiones
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesModal #estadoFacturasPendientes, #facturasPendientesModal #estadoFacturasPendientesMobile', function() {
        const estado = $(this).val();
        console.log('🔍 Estado de facturas seleccionado:', estado);

        // Sincronizar el valor en ambos campos
        $('#estadoFacturasPendientes, #estadoFacturasPendientesMobile').val(estado);

        filtrosBusquedaFacturas.estado = estado;
        
        // Recargar facturas desde el servidor con el nuevo estado
        cargarTodasLasFacturasPendientes();
    });

    // Configurar filtros de fecha desde para ambas versiones
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesModal #fechaDesdeFacturas, #facturasPendientesModal #fechaDesdeFacturasMobile', function() {
        const fecha = $(this).val();
        filtrosBusquedaFacturas.fechaDesde = fecha;
        console.log('🔍 Fecha desde:', filtrosBusquedaFacturas.fechaDesde);

        // Sincronizar el valor en ambos campos
        $('#fechaDesdeFacturas, #fechaDesdeFacturasMobile').val(fecha);

        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar filtros de fecha hasta para ambas versiones
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesModal #fechaHastaFacturas, #facturasPendientesModal #fechaHastaFacturasMobile', function() {
        const fecha = $(this).val();
        filtrosBusquedaFacturas.fechaHasta = fecha;
        console.log('🔍 Fecha hasta:', filtrosBusquedaFacturas.fechaHasta);

        // Sincronizar el valor en ambos campos
        $('#fechaHastaFacturas, #fechaHastaFacturasMobile').val(fecha);

        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar botones limpiar para ambas versiones
    $(document).on('click.facturasPendientesFilter', '#facturasPendientesModal #btnLimpiarFiltrosFacturas, #facturasPendientesModal #btnLimpiarFiltrosFacturasMobile', function(e) {
        e.preventDefault();
        console.log('🔍 Limpiando filtros de facturas...');
        limpiarFiltrosFacturas();
    });

    // Configurar cambio de productos por página
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesPorPagina', function() {
        facturasPorPagina = parseInt($(this).val());
        paginaActualFacturas = 1;
        console.log('📄 Cambiando facturas por página a:', facturasPorPagina);
        mostrarFacturasPendientesPaginadas();
    });

    console.log('✅ Eventos de filtros de facturas configurados con delegación');
}

/**
 * Cargar todas las facturas según el estado seleccionado
 */
async function cargarTodasLasFacturasPendientes() {
    try {
        console.log('📋 === CARGANDO TODAS LAS FACTURAS ===');
        
        // Obtener el estado seleccionado
        const estadoSeleccionado = $('#estadoFacturasPendientes').val() || $('#estadoFacturasPendientesMobile').val() || 'Pendiente';
        console.log('📋 Estado seleccionado:', estadoSeleccionado);

        // Mostrar loading
        $('#facturasPendientesLoading').show();
        $('#facturasPendientesContent').hide();
        $('#facturasPendientesEmpty').hide();

        // Construir URL con parámetros
        let url = '/Facturacion/ObtenerFacturas?tamano=1000';
        if (estadoSeleccionado && estadoSeleccionado !== 'todos') {
            url += `&estado=${encodeURIComponent(estadoSeleccionado)}`;
        }

        console.log('📋 URL de consulta:', url);

        // Realizar petición para obtener facturas
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📋 Respuesta del servidor facturas:', resultado);

        if (resultado.success) {
            // Extraer facturas del resultado
            let facturas = null;
            if (resultado.facturas && Array.isArray(resultado.facturas)) {
                facturas = resultado.facturas;
            } else if (resultado.data && Array.isArray(resultado.data)) {
                facturas = resultado.data;
            } else if (Array.isArray(resultado)) {
                facturas = resultado;
            }

            if (facturas && facturas.length > 0) {
                console.log('✅ Facturas cargadas:', facturas.length);
                todasLasFacturasPendientes = facturas;

                // Aplicar filtros iniciales (mostrar todas)
                aplicarFiltrosLocalmenteFacturas();
            } else {
                console.log('ℹ️ No se encontraron facturas con el estado:', estadoSeleccionado);
                todasLasFacturasPendientes = [];
                mostrarFacturasPendientesVacias();
            }
        } else {
            console.log('❌ Error del servidor:', resultado.message);
            mostrarFacturasPendientesVacias();
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar facturas', 'warning');
            }
        }

    } catch (error) {
        console.error('❌ Error cargando facturas:', error);
        mostrarFacturasPendientesVacias();
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar facturas: ' + error.message, 'danger');
        }
    } finally {
        $('#facturasPendientesLoading').hide();
    }
}

/**
 * Aplicar filtros localmente (en el frontend)
 */
function aplicarFiltrosLocalmenteFacturas() {
    console.log('🔍 === APLICANDO FILTROS LOCALMENTE A FACTURAS ===');
    console.log('🔍 Total facturas:', todasLasFacturasPendientes.length);
    console.log('🔍 Filtros:', filtrosBusquedaFacturas);

    if (todasLasFacturasPendientes.length === 0) {
        mostrarFacturasPendientesVacias();
        return;
    }

    // Filtrar facturas
    facturasPendientesFiltradas = todasLasFacturasPendientes.filter(factura => {
        let cumpleFiltros = true;

        // Filtro por texto (buscar en número, cliente, usuario)
        if (filtrosBusquedaFacturas.texto && filtrosBusquedaFacturas.texto.length > 0) {
            const textoBusqueda = filtrosBusquedaFacturas.texto.toLowerCase();
            const textoFactura = [
                factura.numeroFactura || '',
                factura.nombreCliente || factura.clienteNombre || '',
                factura.emailCliente || factura.email || '',
                factura.usuarioCreador || factura.nombreUsuario || ''
            ].join(' ').toLowerCase();

            if (!textoFactura.includes(textoBusqueda)) {
                cumpleFiltros = false;
            }
        }

        // El filtro por estado se aplica en el servidor, no localmente
        // Solo aplicar filtro de estado local si es 'todos' y hay múltiples estados
        if (filtrosBusquedaFacturas.estado && filtrosBusquedaFacturas.estado !== 'todos') {
            // No filtrar localmente por estado, ya se filtró en servidor
        }

        // Filtro por fecha desde
        if (filtrosBusquedaFacturas.fechaDesde) {
            const fechaFactura = new Date(factura.fechaFactura || factura.fechaCreacion);
            const fechaDesde = new Date(filtrosBusquedaFacturas.fechaDesde);
            if (fechaFactura < fechaDesde) {
                cumpleFiltros = false;
            }
        }

        // Filtro por fecha hasta
        if (filtrosBusquedaFacturas.fechaHasta) {
            const fechaFactura = new Date(factura.fechaFactura || factura.fechaCreacion);
            const fechaHasta = new Date(filtrosBusquedaFacturas.fechaHasta);
            fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
            if (fechaFactura > fechaHasta) {
                cumpleFiltros = false;
            }
        }

        return cumpleFiltros;
    });

    console.log('🔍 Facturas filtradas:', facturasPendientesFiltradas.length);

    // Resetear paginación
    paginaActualFacturas = 1;

    // Mostrar resultados
    mostrarFacturasPendientesPaginadas();
}

/**
 * Mostrar facturas pendientes con paginación
 */
function mostrarFacturasPendientesPaginadas() {
    console.log('📋 === MOSTRANDO FACTURAS PENDIENTES PAGINADAS ===');

    const facturasAMostrar = facturasPendientesFiltradas.length > 0 ? facturasPendientesFiltradas : todasLasFacturasPendientes;

    if (!facturasAMostrar || facturasAMostrar.length === 0) {
        mostrarFacturasPendientesVacias();
        $('#contadorResultadosFacturas').remove();
        return;
    }

    console.log('📋 Total facturas a paginar:', facturasAMostrar.length);
    console.log('📋 Facturas por página:', facturasPorPagina);
    console.log('📋 Página actual:', paginaActualFacturas);

    // Calcular paginación
    const totalPaginas = Math.ceil(facturasAMostrar.length / facturasPorPagina);
    const inicio = (paginaActualFacturas - 1) * facturasPorPagina;
    const fin = inicio + facturasPorPagina;
    const facturasPagina = facturasAMostrar.slice(inicio, fin);

    console.log('📋 Facturas en esta página:', facturasPagina.length);

    // Mostrar facturas de la página actual
    const tbody = $('#facturasPendientesTableBody');
    tbody.empty();

    facturasPagina.forEach(factura => {
        const fila = crearFilaFacturaPendiente(factura);
        tbody.append(fila);
    });

    // Configurar eventos para los botones
    configurarEventosBotonesFacturas();

    $('#facturasPendientesContent').show();
    $('#facturasPendientesEmpty').hide();

    // Actualizar contador de resultados
    actualizarContadorResultadosFacturas(facturasAMostrar.length, todasLasFacturasPendientes.length);

    // Mostrar paginación si hay más de una página
    if (totalPaginas > 1) {
        mostrarPaginacionFacturas(paginaActualFacturas, totalPaginas);
    } else {
        $('#paginacionFacturas').hide();
    }

    console.log('✅ Facturas pendientes mostradas en tabla');
}

/**
 * Mostrar facturas pendientes en la tabla
 */
function mostrarFacturasPendientesEnTabla(facturas) {
    console.log('📋 === MOSTRANDO FACTURAS PENDIENTES EN TABLA ===');
    console.log('📋 Facturas a mostrar:', facturas.length);

    const tbody = $('#facturasPendientesTableBody');
    if (tbody.length === 0) {
        console.error('❌ No se encontró el tbody de facturas pendientes');
        return;
    }

    tbody.empty();

    facturas.forEach(factura => {
        const fecha = new Date(factura.fechaFactura || factura.fechaCreacion).toLocaleDateString('es-CR');
        let estadoBadge = '';

        // Asignar badge según el estado
        switch (factura.estado) {
            case 'Pendiente':
                estadoBadge = '<span class="badge bg-warning">Pendiente</span>';
                break;
            case 'Pagada':
                estadoBadge = '<span class="badge bg-success">Pagada</span>';
                break;
            case 'Anulada':
                estadoBadge = '<span class="badge bg-danger">Anulada</span>';
                break;
            default:
                estadoBadge = `<span class="badge bg-secondary">${factura.estado || 'Sin Estado'}</span>`;
        }

        // ✅ ESCAPAR DATOS DE LA FACTURA PENDIENTE (igual que proformas)
        const facturaEscapada = JSON.stringify(factura).replace(/"/g, '&quot;');

        const fila = `
            <tr data-factura-id="${factura.facturaId || factura.id}">
                <td>
                    <strong>${factura.numeroFactura || 'N/A'}</strong><br>
                    <small class="text-muted">${factura.tipoDocumento || 'Factura'}</small>
                </td>
                <td>
                    <strong>${factura.nombreCliente || factura.clienteNombre || 'Cliente General'}</strong><br>
                    <small class="text-muted">${factura.emailCliente || factura.email || ''}</small>
                </td>
                <td>
                    <strong>${fecha}</strong><br>
                    <small class="text-muted">Por: ${factura.usuarioCreador || factura.nombreUsuario || 'Sistema'}</small>
                </td>
                <td>
                    <strong class="text-success">₡${Number(factura.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td>${estadoBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" title="Ver detalles" data-factura-id="${factura.facturaId || factura.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" title="Imprimir" data-factura-id="${factura.facturaId || factura.id}">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${factura.estado === 'Pendiente' ? `
                        <button type="button" class="btn btn-outline-success" title="Procesar Factura" data-factura-escapada="${facturaEscapada}">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        tbody.append(fila);
    });

    // Configurar eventos para los botones
    configurarEventosBotonesFacturas();

    console.log('✅ Facturas pendientes mostradas en tabla');
}

/**
 * Mostrar paginación
 */
function mostrarPaginacionFacturas(paginaActualParam, totalPaginas) {
    console.log('📄 === MOSTRANDO PAGINACIÓN DE FACTURAS ===');
    console.log('📄 Página actual:', paginaActualParam, 'Total páginas:', totalPaginas);

    const paginacion = $('#paginacionFacturas');
    if (paginacion.length === 0) {
        console.error('❌ No se encontró el contenedor de paginación');
        return;
    }

    // Ocultar si solo hay una página o menos
    if (totalPaginas <= 1) {
        paginacion.hide();
        return;
    }

    let html = '<nav aria-label="Paginación de facturas pendientes"><ul class="pagination justify-content-center mb-0">';

    // Botón anterior
    if (paginaActualParam > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${paginaActualParam - 1})">
                        <i class="bi bi-chevron-left"></i> Anterior
                    </a>
                </li>`;
    } else {
        html += `<li class="page-item disabled">
                    <span class="page-link">
                        <i class="bi bi-chevron-left"></i> Anterior
                    </span>
                </li>`;
    }

    // Páginas (mostrar máximo 5 páginas)
    const iniciarPagina = Math.max(1, paginaActualParam - 2);
    const finalizarPagina = Math.min(totalPaginas, iniciarPagina + 4);

    // Primera página si no está en el rango
    if (iniciarPagina > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(1)">1</a>
                </li>`;
        if (iniciarPagina > 2) {
            html += `<li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>`;
        }
    }

    // Páginas del rango
    for (let i = iniciarPagina; i <= finalizarPagina; i++) {
        if (i === paginaActualParam) {
            html += `<li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>`;
        } else {
            html += `<li class="page-item">
                        <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${i})">${i}</a>
                    </li>`;
        }
    }

    // Última página si no está en el rango
    if (finalizarPagina < totalPaginas) {
        if (finalizarPagina < totalPaginas - 1) {
            html += `<li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>`;
        }
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${totalPaginas})">${totalPaginas}</a>
                </li>`;
    }

    // Botón siguiente
    if (paginaActualParam < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${paginaActualParam + 1})">
                        Siguiente <i class="bi bi-chevron-right"></i>
                    </a>
                </li>`;
    } else {
        html += `<li class="page-item disabled">
                    <span class="page-link">
                        Siguiente <i class="bi bi-chevron-right"></i>
                    </span>
                </li>`;
    }

    html += '</ul></nav>';

    paginacion.html(html).show();
}

/**
 * Mostrar mensaje cuando no hay facturas pendientes
 */
function mostrarFacturasPendientesVacias() {
    console.log('ℹ️ Mostrando mensaje de facturas pendientes vacías');
    $('#facturasPendientesEmpty').show();
    $('#facturasPendientesContent').hide();
    $('#paginacionFacturas').hide();
}

/**
 * Limpiar filtros
 */
function limpiarFiltrosFacturas() {
    console.log('🧹 === LIMPIANDO FILTROS DE FACTURAS ===');

    // Resetear filtros
    filtrosBusquedaFacturas = {
        texto: '',
        estado: 'todos',
        fechaDesde: '',
        fechaHasta: ''
    };

    // Limpiar campos del formulario para ambas versiones (desktop y móvil)
    $('#facturasPendientesModal #busquedaFacturasPendientes, #facturasPendientesModal #busquedaFacturasPendientesMobile').val('');
    $('#facturasPendientesModal #estadoFacturasPendientes, #facturasPendientesModal #estadoFacturasPendientesMobile').val('todos');
    $('#facturasPendientesModal #fechaDesdeFacturas, #facturasPendientesModal #fechaDesdeFacturasMobile').val('');
    $('#facturasPendientesModal #fechaHastaFacturas, #facturasPendientesModal #fechaHastaFacturasMobile').val('');

    // Resetear paginación
    paginaActualFacturas = 1;

    // Aplicar filtros (mostrar todas)
    aplicarFiltrosLocalmenteFacturas();

    console.log('✅ Filtros de facturas limpiados');
}

/**
 * Cambiar página
 */
function cambiarPaginaFacturas(nuevaPagina) {
    console.log('📄 === CAMBIANDO PÁGINA DE FACTURAS ===');
    console.log('📄 Nueva página:', nuevaPagina);

    if (nuevaPagina > 0) {
        paginaActualFacturas = nuevaPagina;
        mostrarFacturasPendientesPaginadas();
    }
}

/**
 * Recargar facturas pendientes (útil después de procesar una factura)
 */
function recargarFacturasPendientes() {
    console.log('🔄 Recargando facturas pendientes...');
    cargarTodasLasFacturasPendientes();
}

/**
 * Configurar eventos para los botones de la tabla de facturas pendientes
 */
function configurarEventosBotonesFacturas() {
    console.log('🔧 Configurando eventos de botones de facturas...');

    // Limpiar eventos anteriores
    $('.btn-outline-info[data-factura-id]').off('click.facturaVer');
    $('.btn-outline-secondary[data-factura-id]').off('click.facturaImprimir');
    $('.btn-outline-success[data-factura-escapada]').off('click.facturaProcesar');

    // Ver detalles de factura
    $('.btn-outline-info[data-factura-id]').on('click.facturaVer', function () {
        const facturaId = $(this).data('factura-id');
        console.log('👁️ Ver detalles de factura:', facturaId);

        if (typeof verDetalleFactura === 'function') {
            verDetalleFactura(facturaId);
        } else {
            console.error('❌ Función verDetalleFactura no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'Función de visualización no disponible', 'danger');
            }
        }
    });

    // Imprimir factura
    $('.btn-outline-secondary[data-factura-id]').on('click.facturaImprimir', function () {
        const facturaId = $(this).data('factura-id');
        console.log('🖨️ Imprimir factura:', facturaId);

        if (typeof imprimirFactura === 'function') {
            imprimirFactura(facturaId);
        } else {
            console.error('❌ Función imprimirFactura no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Info', 'Función de impresión en desarrollo', 'info');
            }
        }
    });

    // Procesar factura pendiente
    $('.btn-outline-success[data-factura-escapada]').on('click.facturaProcesar', function () {
        const facturaEscapada = $(this).data('factura-escapada');
        console.log('✅ Procesar factura pendiente:', facturaEscapada);

        if (typeof procesarFacturaPendiente === 'function') {
            // Pasar el objeto directamente ya que viene como objeto desde data()
            procesarFacturaPendiente(facturaEscapada);
        } else {
            console.error('❌ Función procesarFacturaPendiente no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'Función de procesamiento no disponible', 'danger');
            }
        }
    });

    console.log('✅ Eventos de botones de facturas configurados');
}

/**
 * Actualizar el contador de resultados de facturas
 */
function actualizarContadorResultadosFacturas(conteoActual, conteoTotal) {
    const inicio = ((paginaActualFacturas - 1) * facturasPorPagina) + 1;
    const fin = Math.min(paginaActualFacturas * facturasPorPagina, conteoActual);

    $('#facturasPendientesInfo').text(`Mostrando ${inicio}-${fin} de ${conteoActual} facturas`);
}

/**
 * Crear una fila de factura pendiente para la tabla
 */
function crearFilaFacturaPendiente(factura) {
    const fecha = new Date(factura.fechaFactura || factura.fechaCreacion).toLocaleDateString('es-CR');
    const hora = new Date(factura.fechaFactura || factura.fechaCreacion).toLocaleTimeString('es-CR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let estadoBadge = '';

    // Asignar badge según el estado
    switch (factura.estado) {
        case 'Pendiente':
            estadoBadge = '<span class="badge bg-warning text-dark">Pendiente</span>';
            break;
        case 'Pagada':
            estadoBadge = '<span class="badge bg-success">Pagada</span>';
            break;
        case 'Anulada':
            estadoBadge = '<span class="badge bg-danger">Anulada</span>';
            break;
        default:
            estadoBadge = `<span class="badge bg-secondary">${factura.estado || 'Sin Estado'}</span>`;
    }

    // ✅ ESCAPAR DATOS DE LA FACTURA PENDIENTE
    const facturaEscapada = JSON.stringify(factura).replace(/"/g, '&quot;');

    const fila = `
        <tr data-factura-id="${factura.facturaId || factura.id}">
            <td>
                <div class="fw-bold text-primary">${factura.numeroFactura || 'N/A'}</div>
                <small class="text-muted d-block">${factura.tipoDocumento || 'Factura'}</small>
                <!-- Estado en móvil (oculto en desktop) -->
                <div class="d-inline d-md-none mt-1">
                    ${estadoBadge}
                </div>
            </td>
            <td>
                <div class="fw-bold">${factura.nombreCliente || factura.clienteNombre || 'Cliente General'}</div>
                ${factura.emailCliente || factura.email ? `<small class="text-muted d-block">${factura.emailCliente || factura.email}</small>` : ''}
                <!-- Información adicional en móvil -->
                <div class="d-block d-lg-none">
                    <small class="text-muted">${fecha} ${hora}</small><br>
                    <small class="badge bg-info">${factura.usuarioCreador || factura.nombreUsuario || 'Sistema'}</small>
                </div>
            </td>
            <!-- Información (solo desktop) -->
            <td class="d-none d-lg-table-cell">
                <div class="fw-bold">${fecha}</div>
                <small class="text-muted d-block">${hora}</small>
                <small class="badge bg-info">${factura.usuarioCreador || factura.nombreUsuario || 'Sistema'}</small>
            </td>
            <td>
                <div class="fw-bold text-success">₡${Number(factura.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
                <small class="text-muted d-none d-md-block">${factura.metodoPago || 'Efectivo'}</small>
            </td>
            <!-- Estado (solo desktop) -->
            <td class="d-none d-md-table-cell">
                ${estadoBadge}
            </td>
            <td class="text-center">
                <div class="btn-group-vertical btn-group-sm d-inline-block d-sm-none">
                    <!-- Botones verticales en móvil -->
                    ${factura.estado === 'Pendiente' ? `
                    <button type="button" class="btn btn-outline-success btn-sm" title="Procesar" data-factura-escapada="${facturaEscapada}">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                </div>
                <div class="btn-group btn-group-sm d-none d-sm-inline-block">
                    <!-- Botones horizontales en tablet/desktop -->
                    
                    ${factura.estado === 'Pendiente' ? `
                    <button type="button" class="btn btn-outline-success" title="Procesar Factura" data-factura-escapada="${facturaEscapada}">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;

    return fila;
}


// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.inicializarFiltrosFacturasPendientes = inicializarFiltrosFacturasPendientes;
    window.configurarEventosFacturasPendientes = configurarEventosFacturasPendientes;
    window.aplicarFiltrosLocalmenteFacturas = aplicarFiltrosLocalmenteFacturas;
    window.limpiarFiltrosFacturas = limpiarFiltrosFacturas;
    window.cambiarPaginaFacturas = cambiarPaginaFacturas;
    window.mostrarFacturasPendientesEnTabla = mostrarFacturasPendientesEnTabla;
    window.recargarFacturasPendientes = recargarFacturasPendientes;
    window.configurarEventosBotonesFacturas = configurarEventosBotonesFacturas;

    console.log('📋 Módulo de filtros de facturas pendientes (Frontend) cargado correctamente');
} else {
    console.error('❌ Window no está disponible para exportar funciones');
}