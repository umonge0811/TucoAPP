
// ===== MÓDULO DE FILTROS PARA PROFORMAS (FRONTEND ONLY) =====

let todasLasProformas = []; // Array para almacenar todas las proformas
let proformasFiltradas = []; // Array para proformas filtradas
let paginaActual = 1;
let proformasPorPagina = 20;
let filtrosBusqueda = {
    texto: '',
    estado: 'todos'
};

/**
 * Inicializar filtros de proformas
 */
function inicializarFiltrosProformas() {
    console.log('🔍 === INICIALIZANDO FILTROS DE PROFORMAS (FRONTEND) ===');

    // Verificar que jQuery esté disponible
    if (typeof $ === 'undefined') {
        console.error('❌ jQuery no está disponible');
        return;
    }

    // Esperar un poco para asegurar que el DOM del modal esté completamente cargado
    setTimeout(() => {
        console.log('🔍 Configurando eventos de filtrado...');
        
        // Configurar evento de búsqueda con debounce
        const $inputBusqueda = $('#busquedaProformas');
        if ($inputBusqueda.length) {
            $inputBusqueda.off('input.proformasFilter keyup.proformasFilter').on('input.proformasFilter keyup.proformasFilter', function() {
                const termino = $(this).val().trim();
                console.log('🔍 Término de búsqueda:', termino);
                
                filtrosBusqueda.texto = termino;
                aplicarFiltrosLocalmenteProformas();
            });
            console.log('✅ Evento de búsqueda configurado');
        } else {
            console.error('❌ No se encontró el input de búsqueda');
        }

        // Configurar evento de cambio de estado
        const $selectEstado = $('#estadoProformas');
        if ($selectEstado.length) {
            $selectEstado.off('change.proformasFilter').on('change.proformasFilter', function() {
                const estado = $(this).val();
                console.log('🔍 Estado seleccionado:', estado);
                
                filtrosBusqueda.estado = estado;
                aplicarFiltrosLocalmenteProformas();
            });
            console.log('✅ Evento de estado configurado');
        } else {
            console.error('❌ No se encontró el select de estado');
        }

        // Configurar botón limpiar
        const $btnLimpiar = $('#btnLimpiarFiltrosProformas');
        if ($btnLimpiar.length) {
            $btnLimpiar.off('click.proformasFilter').on('click.proformasFilter', function(e) {
                e.preventDefault();
                console.log('🔍 Limpiando filtros...');
                limpiarFiltrosProformas();
            });
            console.log('✅ Botón limpiar configurado');
        } else {
            console.error('❌ No se encontró el botón limpiar');
        }

        // Cargar todas las proformas inicialmente
        cargarTodasLasProformas();

        console.log('✅ Filtros de proformas inicializados correctamente');
        
    }, 100);
}

/**
 * Cargar todas las proformas desde el servidor una sola vez
 */
async function cargarTodasLasProformas() {
    try {
        console.log('📋 === CARGANDO TODAS LAS PROFORMAS ===');

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Realizar petición para obtener TODAS las proformas
        const response = await fetch('/Facturacion/ObtenerProformas?tamano=1000', {
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
        console.log('📋 Respuesta del servidor:', resultado);

        if (resultado.success) {
            // Extraer proformas del resultado
            let proformas = null;
            if (resultado.proformas && Array.isArray(resultado.proformas)) {
                proformas = resultado.proformas;
            } else if (resultado.data && Array.isArray(resultado.data)) {
                proformas = resultado.data;
            } else if (Array.isArray(resultado)) {
                proformas = resultado;
            }

            if (proformas && proformas.length > 0) {
                console.log('✅ Proformas cargadas:', proformas.length);
                todasLasProformas = proformas;
                
                // Aplicar filtros iniciales (mostrar todas)
                aplicarFiltrosLocalmenteProformas();
            } else {
                console.log('ℹ️ No se encontraron proformas');
                todasLasProformas = [];
                mostrarProformasVacias();
            }
        } else {
            console.log('❌ Error del servidor:', resultado.message);
            mostrarProformasVacias();
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar proformas', 'warning');
            }
        }

    } catch (error) {
        console.error('❌ Error cargando proformas:', error);
        mostrarProformasVacias();
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
        }
    } finally {
        $('#proformasLoading').hide();
    }
}

/**
 * Aplicar filtros localmente (en el frontend)
 */
function aplicarFiltrosLocalmenteProformas() {
    console.log('🔍 === APLICANDO FILTROS LOCALMENTE ===');
    console.log('🔍 Total proformas:', todasLasProformas.length);
    console.log('🔍 Filtros:', filtrosBusqueda);

    if (todasLasProformas.length === 0) {
        mostrarProformasVacias();
        return;
    }

    // Filtrar proformas
    proformasFiltradas = todasLasProformas.filter(proforma => {
        let cumpleFiltros = true;

        // Filtro por texto (buscar en número, cliente, usuario)
        if (filtrosBusqueda.texto && filtrosBusqueda.texto.length > 0) {
            const textoBusqueda = filtrosBusqueda.texto.toLowerCase();
            const textoProforma = [
                proforma.numeroFactura || '',
                proforma.nombreCliente || proforma.clienteNombre || '',
                proforma.emailCliente || proforma.email || '',
                proforma.usuarioCreador || proforma.nombreUsuario || ''
            ].join(' ').toLowerCase();

            if (!textoProforma.includes(textoBusqueda)) {
                cumpleFiltros = false;
            }
        }

        // Filtro por estado
        if (filtrosBusqueda.estado && filtrosBusqueda.estado !== 'todos') {
            if (proforma.estado !== filtrosBusqueda.estado) {
                cumpleFiltros = false;
            }
        }

        return cumpleFiltros;
    });

    console.log('🔍 Proformas filtradas:', proformasFiltradas.length);

    // Resetear paginación
    paginaActual = 1;

    // Mostrar resultados
    mostrarProformasPaginadas();
}

/**
 * Mostrar proformas con paginación
 */
function mostrarProformasPaginadas() {
    console.log('📋 === MOSTRANDO PROFORMAS PAGINADAS ===');
    console.log('📋 Página actual:', paginaActual);
    console.log('📋 Proformas por página:', proformasPorPagina);

    if (proformasFiltradas.length === 0) {
        mostrarProformasVacias();
        return;
    }

    // Calcular paginación
    const totalPaginas = Math.ceil(proformasFiltradas.length / proformasPorPagina);
    const inicio = (paginaActual - 1) * proformasPorPagina;
    const fin = inicio + proformasPorPagina;
    const proformasParaMostrar = proformasFiltradas.slice(inicio, fin);

    console.log('📋 Total páginas:', totalPaginas);
    console.log('📋 Mostrando proformas:', inicio, 'a', fin);
    console.log('📋 Proformas en esta página:', proformasParaMostrar.length);

    // Mostrar proformas en la tabla
    mostrarProformasEnTabla(proformasParaMostrar);

    // Mostrar controles de paginación si es necesario
    if (totalPaginas > 1) {
        mostrarPaginacionProformas(paginaActual, totalPaginas);
    } else {
        $('#paginacionProformas').hide();
    }

    // Mostrar contenido
    $('#proformasContent').show();
}

/**
 * Mostrar proformas en la tabla
 */
function mostrarProformasEnTabla(proformas) {
    console.log('📋 === MOSTRANDO PROFORMAS EN TABLA ===');
    console.log('📋 Proformas a mostrar:', proformas.length);

    const tbody = $('#proformasTableBody');
    if (tbody.length === 0) {
        console.error('❌ No se encontró el tbody de proformas');
        return;
    }

    tbody.empty();

    proformas.forEach(proforma => {
        const fecha = new Date(proforma.fechaFactura || proforma.fechaCreacion).toLocaleDateString('es-CR');
        let estadoBadge = '';

        // Asignar badge según el estado
        switch (proforma.estado) {
            case 'Vigente':
                estadoBadge = '<span class="badge bg-success">Vigente</span>';
                break;
            case 'Facturada':
                estadoBadge = '<span class="badge bg-primary">Facturada</span>';
                break;
            case 'Expirada':
                estadoBadge = '<span class="badge bg-danger">Expirada</span>';
                break;
            default:
                estadoBadge = `<span class="badge bg-secondary">${proforma.estado || 'Sin Estado'}</span>`;
        }

        const fila = `
            <tr data-proforma-id="${proforma.facturaId || proforma.id}">
                <td>
                    <strong>${proforma.numeroFactura || 'N/A'}</strong><br>
                    <small class="text-muted">${proforma.tipoDocumento || 'Proforma'}</small>
                </td>
                <td>
                    <strong>${proforma.nombreCliente || proforma.clienteNombre || 'Cliente General'}</strong><br>
                    <small class="text-muted">${proforma.emailCliente || proforma.email || ''}</small>
                </td>
                <td>
                    <strong>${fecha}</strong><br>
                    <small class="text-muted">Por: ${proforma.usuarioCreador || proforma.nombreUsuario || 'Sistema'}</small>
                </td>
                <td>
                    <strong class="text-success">₡${Number(proforma.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td>${estadoBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" title="Ver detalles" data-proforma-id="${proforma.facturaId || proforma.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" title="Imprimir" data-proforma-id="${proforma.facturaId || proforma.id}">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${proforma.estado === 'Vigente' ? `
                        <button type="button" class="btn btn-outline-success" title="Convertir a Factura" data-proforma-data='${JSON.stringify(proforma).replace(/'/g, "&#39;")}'>
                            <i class="bi bi-arrow-up-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        tbody.append(fila);
    });

    // Configurar eventos para los botones
    configurarEventosBotonesProformas();

    console.log('✅ Proformas mostradas en tabla');
}

/**
 * Mostrar paginación
 */
function mostrarPaginacionProformas(paginaActualParam, totalPaginas) {
    console.log('📄 === MOSTRANDO PAGINACIÓN DE PROFORMAS ===');
    console.log('📄 Página actual:', paginaActualParam, 'Total páginas:', totalPaginas);

    const paginacion = $('#paginacionProformas');
    if (paginacion.length === 0 || totalPaginas <= 1) {
        paginacion.hide();
        return;
    }

    let html = '<ul class="pagination justify-content-center">';

    // Botón anterior
    if (paginaActualParam > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaProformas(${paginaActualParam - 1})">Anterior</a>
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
                        <a class="page-link" href="#" onclick="cambiarPaginaProformas(${i})">${i}</a>
                    </li>`;
        }
    }

    // Botón siguiente
    if (paginaActualParam < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaProformas(${paginaActualParam + 1})">Siguiente</a>
                </li>`;
    }

    html += '</ul>';
    paginacion.html(html).show();
}

/**
 * Mostrar mensaje cuando no hay proformas
 */
function mostrarProformasVacias() {
    console.log('ℹ️ Mostrando mensaje de proformas vacías');
    $('#proformasEmpty').show();
    $('#proformasContent').hide();
    $('#paginacionProformas').hide();
}

/**
 * Limpiar filtros
 */
function limpiarFiltrosProformas() {
    console.log('🧹 === LIMPIANDO FILTROS DE PROFORMAS ===');

    // Resetear filtros
    filtrosBusqueda = {
        texto: '',
        estado: 'todos'
    };

    // Limpiar campos del formulario
    $('#busquedaProformas').val('');
    $('#estadoProformas').val('todos');

    // Resetear paginación
    paginaActual = 1;

    // Aplicar filtros (mostrar todas)
    aplicarFiltrosLocalmenteProformas();

    console.log('✅ Filtros limpiados');
}

/**
 * Cambiar página
 */
function cambiarPaginaProformas(nuevaPagina) {
    console.log('📄 === CAMBIANDO PÁGINA DE PROFORMAS ===');
    console.log('📄 Nueva página:', nuevaPagina);

    if (nuevaPagina > 0) {
        paginaActual = nuevaPagina;
        mostrarProformasPaginadas();
    }
}

/**
 * Recargar proformas (útil después de crear/editar una proforma)
 */
function recargarProformas() {
    console.log('🔄 Recargando proformas...');
    cargarTodasLasProformas();
}

/**
 * Configurar eventos para los botones de la tabla de proformas
 */
function configurarEventosBotonesProformas() {
    console.log('🔧 Configurando eventos de botones de proformas...');

    // Limpiar eventos anteriores
    $('.btn-outline-info[data-proforma-id]').off('click.proformaVer');
    $('.btn-outline-secondary[data-proforma-id]').off('click.proformaImprimir');
    $('.btn-outline-success[data-proforma-data]').off('click.proformaConvertir');

    // Ver detalles de proforma
    $('.btn-outline-info[data-proforma-id]').on('click.proformaVer', function() {
        const proformaId = $(this).data('proforma-id');
        console.log('👁️ Ver detalles de proforma:', proformaId);
        
        if (typeof verDetalleProforma === 'function') {
            verDetalleProforma(proformaId);
        } else {
            console.error('❌ Función verDetalleProforma no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'Función de visualización no disponible', 'danger');
            }
        }
    });

    // Imprimir proforma
    $('.btn-outline-secondary[data-proforma-id]').on('click.proformaImprimir', function() {
        const proformaId = $(this).data('proforma-id');
        console.log('🖨️ Imprimir proforma:', proformaId);
        
        if (typeof imprimirProforma === 'function') {
            imprimirProforma(proformaId);
        } else {
            console.error('❌ Función imprimirProforma no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Info', 'Función de impresión en desarrollo', 'info');
            }
        }
    });

    // Convertir proforma
    $('.btn-outline-success[data-proforma-data]').on('click.proformaConvertir', function() {
        const proformaData = $(this).data('proforma-data');
        console.log('🔄 Convertir proforma:', proformaData);
        
        if (typeof convertirProformaAFactura === 'function') {
            convertirProformaAFactura(proformaData);
        } else {
            console.error('❌ Función convertirProformaAFactura no está disponible');
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'Función de conversión no disponible', 'danger');
            }
        }
    });

    console.log('✅ Eventos de botones configurados');
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.inicializarFiltrosProformas = inicializarFiltrosProformas;
    window.aplicarFiltrosLocalmenteProformas = aplicarFiltrosLocalmenteProformas;
    window.limpiarFiltrosProformas = limpiarFiltrosProformas;
    window.cambiarPaginaProformas = cambiarPaginaProformas;
    window.mostrarProformasEnTabla = mostrarProformasEnTabla;
    window.recargarProformas = recargarProformas;
    window.configurarEventosBotonesProformas = configurarEventosBotonesProformas;
    
    console.log('📋 Módulo de filtros de proformas (Frontend) cargado correctamente');
} else {
    console.error('❌ Window no está disponible para exportar funciones');
}
