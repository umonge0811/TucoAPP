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
        aplicarFiltrosLocalmenteFacturas();
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
 * Cargar todas las facturas pendientes desde el servidor una sola vez
 */
async function cargarTodasLasFacturasPendientes() {
    try {
        console.log('📋 === CARGANDO TODAS LAS FACTURAS PENDIENTES ===');

        // Mostrar loading
        $('#facturasPendientesLoading').show();
        $('#facturasPendientesContent').hide();
        $('#facturasPendientesEmpty').hide();

        // Realizar petición para obtener TODAS las facturas pendientes
        const response = await fetch('/Facturacion/ObtenerFacturas?tamano=1000', {
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
                console.log('✅ Facturas pendientes cargadas:', facturas.length);
                todasLasFacturasPendientes = facturas;

                // Aplicar filtros iniciales (mostrar todas)
                aplicarFiltrosLocalmenteFacturas();
            } else {
                console.log('ℹ️ No se encontraron facturas pendientes');
                todasLasFacturasPendientes = [];
                mostrarFacturasPendientesVacias();
            }
        } else {
            console.log('❌ Error del servidor:', resultado.message);
            mostrarFacturasPendientesVacias();
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar facturas pendientes', 'warning');
            }
        }

    } catch (error) {
        console.error('❌ Error cargando facturas pendientes:', error);
        mostrarFacturasPendientesVacias();
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar facturas pendientes: ' + error.message, 'danger');
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

        // Filtro por estado
        if (filtrosBusquedaFacturas.estado && filtrosBusquedaFacturas.estado !== 'todos') {
            if (factura.estado !== filtrosBusquedaFacturas.estado) {
                cumpleFiltros = false;
            }
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

// ===== FUNCIÓN PARA VER DETALLE COMPLETO DE FACTURA =====
async function verDetalleFactura(facturaId) {
    try {
        console.log('👁️ === MOSTRANDO DETALLE DE FACTURA ===');
        console.log('👁️ Factura ID:', facturaId);

        // Mostrar loading
        const loadingHtml = `
            <div class="modal fade" id="modalDetalleFactura" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-eye me-2"></i>Detalle de Factura
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-5">
                            <div class="spinner-border text-info" role="status">
                                <span class="visually-hidden">Cargando detalle...</span>
                            </div>
                            <p class="mt-3">Obteniendo información de la factura...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        $('#modalDetalleFactura').remove();
        $('body').append(loadingHtml);

        const modal = new bootstrap.Modal(document.getElementById('modalDetalleFactura'));
        modal.show();

        // Obtener detalle de la factura
        const response = await fetch(`/Facturacion/ObtenerDetalleFactura?facturaId=${facturaId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.factura) {
            mostrarDetalleFacturaModal(resultado.factura);
        } else {
            throw new Error(resultado.message || 'Error obteniendo detalle de factura');
        }

    } catch (error) {
        console.error('❌ Error obteniendo detalle de factura:', error);

        // Mostrar error en el modal
        $('#modalDetalleFactura .modal-body').html(`
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle text-danger display-1"></i>
                <h5 class="mt-3 text-danger">Error al cargar detalle</h5>
                <p class="text-muted">${error.message}</p>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        `);
    }
}

function mostrarDetalleFacturaModal(factura) {
    const estadoBadge = factura.estado === 'Pendiente' ? 'bg-warning' : 
                       factura.estado === 'Pagada' ? 'bg-success' : 
                       factura.estado === 'Anulada' ? 'bg-danger' : 'bg-secondary';

    const fechaFactura = new Date(factura.fechaFactura).toLocaleDateString('es-CR');
    const fechaCreacion = new Date(factura.fechaCreacion).toLocaleString('es-CR');

    // Construir tabla de productos
    let productosHtml = '';
    if (factura.detallesFactura && factura.detallesFactura.length > 0) {
        factura.detallesFactura.forEach(detalle => {
            const subtotal = detalle.cantidad * detalle.precioUnitario;
            productosHtml += `
                <tr>
                    <td>
                        <strong>${detalle.nombreProducto}</strong>
                        ${detalle.descripcionProducto ? `<br><small class="text-muted">${detalle.descripcionProducto}</small>` : ''}
                    </td>
                    <td class="text-center">${detalle.cantidad}</td>
                    <td class="text-end">₡${formatearMoneda(detalle.precioUnitario)}</td>
                    <td class="text-end">₡${formatearMoneda(subtotal)}</td>
                </tr>
            `;
        });
    }

    const modalHtml = `
        <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
                <i class="bi bi-receipt me-2"></i>Detalle de Factura ${factura.numeroFactura}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <!-- Información General -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="bi bi-file-earmark me-2"></i>Información de Factura</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm table-borderless">
                                <tr>
                                    <td><strong>Número:</strong></td>
                                    <td>${factura.numeroFactura}</td>
                                </tr>
                                <tr>
                                    <td><strong>Estado:</strong></td>
                                    <td><span class="badge ${estadoBadge}">${factura.estado}</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Fecha Factura:</strong></td>
                                    <td>${fechaFactura}</td>
                                </tr>
                                <tr>
                                    <td><strong>Fecha Creación:</strong></td>
                                    <td>${fechaCreacion}</td>
                                </tr>
                                <tr>
                                    <td><strong>Método Pago:</strong></td>
                                    <td>${factura.metodoPago || 'No especificado'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Creado por:</strong></td>
                                    <td>${factura.usuarioCreadorNombre || 'Sistema'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="bi bi-person me-2"></i>Información del Cliente</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm table-borderless">
                                <tr>
                                    <td><strong>Nombre:</strong></td>
                                    <td>${factura.nombreCliente}</td>
                                </tr>
                                <tr>
                                    <td><strong>Identificación:</strong></td>
                                    <td>${factura.identificacionCliente || 'No especificada'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Teléfono:</strong></td>
                                    <td>${factura.telefonoCliente || 'No especificado'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Email:</strong></td>
                                    <td>${factura.emailCliente || 'No especificado'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Dirección:</strong></td>
                                    <td>${factura.direccionCliente || 'No especificada'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Productos -->
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-cart me-2"></i>Productos</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center">Cantidad</th>
                                    <th class="text-end">Precio Unit.</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productosHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Totales -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-calculator me-2"></i>Resumen de Totales</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 offset-md-6">
                            <table class="table table-sm">
                                <tr>
                                    <td><strong>Subtotal:</strong></td>
                                    <td class="text-end">₡${formatearMoneda(factura.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td><strong>IVA (${factura.porcentajeImpuesto || 13}%):</strong></td>
                                    <td class="text-end">₡${formatearMoneda(factura.montoImpuesto)}</td>
                                </tr>
                                <tr class="table-success">
                                    <td><strong>TOTAL:</strong></td>
                                    <td class="text-end"><strong>₡${formatearMoneda(factura.total)}</strong></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Observaciones -->
            ${factura.observaciones ? `
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="bi bi-chat-text me-2"></i>Observaciones</h6>
                    </div>
                    <div class="card-body">
                        <p class="mb-0">${factura.observaciones}</p>
                    </div>
                </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i>Cerrar
            </button>
            ${factura.estado === 'Pendiente' ? `
                <button type="button" class="btn btn-success" onclick="procesarFacturaPendiente(${factura.facturaId || factura.id})">
                    <i class="bi bi-check-circle me-1"></i>Procesar Factura
                </button>
            ` : ''}
            <button type="button" class="btn btn-primary" onclick="imprimirFacturaPendiente(${factura.facturaId || factura.id})">
                <i class="bi bi-printer me-1"></i>Imprimir
            </button>
        </div>
    `;

    $('#modalDetalleFactura .modal-content').html(modalHtml);
}

// Helper function to format currency (assuming it's defined elsewhere or needs to be added)
function formatearMoneda(valor) {
    if (typeof valor === 'undefined' || valor === null) return '0.00';
    return Number(valor).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== FUNCIÓN PARA IMPRIMIR FACTURA PENDIENTE =====
function imprimirFacturaPendiente(facturaId) {
    try {
        console.log('🖨️ === IMPRIMIENDO FACTURA PENDIENTE ===');
        console.log('🖨️ Factura ID:', facturaId);

        // Verificar si el módulo de impresión térmica está disponible
        if (typeof imprimirFacturaTermica === 'function') {
            // Usar la función de impresión térmica existente
            imprimirFacturaTermica(facturaId);
        } else if (typeof window.print === 'function') {
            // Fallback: usar impresión del navegador
            console.log('🖨️ Usando impresión del navegador como fallback');
            
            // Abrir ventana con los detalles de la factura para imprimir
            const ventanaImpresion = window.open(`/Facturacion/ObtenerDetalleFactura?facturaId=${facturaId}`, '_blank');
            
            if (ventanaImpresion) {
                ventanaImpresion.onload = function() {
                    ventanaImpresion.print();
                    ventanaImpresion.close();
                };
            } else {
                throw new Error('No se pudo abrir la ventana de impresión');
            }
        } else {
            throw new Error('Funciones de impresión no disponibles');
        }

        if (typeof mostrarToast === 'function') {
            mostrarToast('Impresión', 'Iniciando impresión de factura...', 'info');
        }

    } catch (error) {
        console.error('❌ Error imprimiendo factura pendiente:', error);
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al imprimir factura: ' + error.message, 'danger');
        } else {
            alert('Error al imprimir factura: ' + error.message);
        }
    }
}


// ===== EXPORTAR FUNCIONES GLOBALMENTE =====
if (typeof window !== 'undefined') {
    window.abrirFacturasPendientes = abrirFacturasPendientes;
    window.procesarFacturaPendiente = procesarFacturaPendiente;
    window.imprimirFacturaPendiente = imprimirFacturaPendiente;
    window.verDetalleFactura = verDetalleFactura;
    window.cambiarPaginaFacturas = cambiarPaginaFacturas;
    window.recargarFacturasPendientes = recargarFacturasPendientes;

    console.log('📋 Módulo de filtros de facturas pendientes (Frontend) cargado correctamente');
} else {
    console.error('❌ Window no está disponible para exportar funciones');
}