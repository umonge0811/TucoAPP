
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
    
    // Configurar evento de búsqueda con delegación
    $(document).on('input.facturasPendientesFilter keyup.facturasPendientesFilter', '#busquedaFacturasPendientes', function() {
        const termino = $(this).val().trim();
        console.log('🔍 Término de búsqueda facturas:', termino);
        
        filtrosBusquedaFacturas.texto = termino;
        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar evento de cambio de estado con delegación
    $(document).on('change.facturasPendientesFilter', '#estadoFacturasPendientes', function() {
        const estado = $(this).val();
        console.log('🔍 Estado de facturas seleccionado:', estado);
        
        filtrosBusquedaFacturas.estado = estado;
        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar filtros de fecha con delegación
    $(document).on('change.facturasPendientesFilter', '#fechaDesdeFacturas', function() {
        filtrosBusquedaFacturas.fechaDesde = $(this).val();
        console.log('🔍 Fecha desde:', filtrosBusquedaFacturas.fechaDesde);
        aplicarFiltrosLocalmenteFacturas();
    });
    
    $(document).on('change.facturasPendientesFilter', '#fechaHastaFacturas', function() {
        filtrosBusquedaFacturas.fechaHasta = $(this).val();
        console.log('🔍 Fecha hasta:', filtrosBusquedaFacturas.fechaHasta);
        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar botón limpiar con delegación
    $(document).on('click.facturasPendientesFilter', '#btnLimpiarFiltrosFacturas', function(e) {
        e.preventDefault();
        console.log('🔍 Limpiando filtros de facturas...');
        limpiarFiltrosFacturas();
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
        const response = await fetch('/Facturacion/ObtenerFacturasPendientes?tamano=1000', {
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
    console.log('📋 Página actual:', paginaActualFacturas);
    console.log('📋 Facturas por página:', facturasPorPagina);

    if (facturasPendientesFiltradas.length === 0) {
        mostrarFacturasPendientesVacias();
        return;
    }

    // Calcular paginación
    const totalPaginas = Math.ceil(facturasPendientesFiltradas.length / facturasPorPagina);
    const inicio = (paginaActualFacturas - 1) * facturasPorPagina;
    const fin = inicio + facturasPorPagina;
    const facturasParaMostrar = facturasPendientesFiltradas.slice(inicio, fin);

    console.log('📋 Total páginas:', totalPaginas);
    console.log('📋 Mostrando facturas:', inicio, 'a', fin);
    console.log('📋 Facturas en esta página:', facturasParaMostrar.length);

    // Mostrar facturas en la tabla
    mostrarFacturasPendientesEnTabla(facturasParaMostrar);

    // Mostrar controles de paginación si es necesario
    if (totalPaginas > 1) {
        mostrarPaginacionFacturas(paginaActualFacturas, totalPaginas);
    } else {
        $('#paginacionFacturas').hide();
    }

    // Mostrar contenido
    $('#facturasPendientesContent').show();
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
    if (paginacion.length === 0 || totalPaginas <= 1) {
        paginacion.hide();
        return;
    }

    let html = '<ul class="pagination justify-content-center">';

    // Botón anterior
    if (paginaActualParam > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${paginaActualParam - 1})">Anterior</a>
                </li>`;
    }

    // Páginas (mostrar máximo 5 páginas)
    const iniciarPagina = Math.max(1, paginaActualParam - 2);
    const finalizarPagina = Math.min(totalPaginas, iniciarPagina + 4);

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

    // Botón siguiente
    if (paginaActualParam < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${paginaActualParam + 1})">Siguiente</a>
                </li>`;
    }

    html += '</ul>';
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

    // Limpiar campos del formulario
    $('#busquedaFacturasPendientes').val('');
    $('#estadoFacturasPendientes').val('todos');
    $('#fechaDesdeFacturas').val('');
    $('#fechaHastaFacturas').val('');

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
    $('.btn-outline-info[data-factura-id]').on('click.facturaVer', function() {
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
    $('.btn-outline-secondary[data-factura-id]').on('click.facturaImprimir', function() {
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
    $('.btn-outline-success[data-factura-escapada]').on('click.facturaProcesar', function() {
        const facturaData = $(this).data('factura-escapada');
        console.log('✅ Procesar factura pendiente:', facturaData);
        
        if (typeof procesarFacturaPendiente === 'function') {
            procesarFacturaPendiente(facturaData);
        } else {
            console.error('❌ Función procesarFacturaPendiente no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'Función de procesamiento no disponible', 'danger');
            }
        }
    });

    console.log('✅ Eventos de botones de facturas configurados');
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
