
// ===== MÓDULO DE FILTROS PARA PROFORMAS =====

let filtroProformas = {
    busqueda: '',
    estado: 'todos',
    pagina: 1,
    tamano: 20
};

let timeoutBusquedaProformas = null;
let busquedaProformasEnProceso = false;
let ultimaBusquedaProformas = '';

/**
 * Inicializar filtros de proformas
 */
function inicializarFiltrosProformas() {
    console.log('🔍 === INICIALIZANDO FILTROS DE PROFORMAS ===');

    // Configurar evento de búsqueda con debounce
    const $inputBusqueda = $('#busquedaProformas');
    if ($inputBusqueda.length) {
        $inputBusqueda.off('input.proformasFilter keyup.proformasFilter').on('input.proformasFilter keyup.proformasFilter', function() {
            const termino = $(this).val().trim();
            console.log('🔍 Término de búsqueda proformas:', termino);

            // Limpiar timeout anterior
            if (timeoutBusquedaProformas) {
                clearTimeout(timeoutBusquedaProformas);
            }

            // Aplicar filtro después de 300ms (más rápido que el original)
            timeoutBusquedaProformas = setTimeout(() => {
                filtroProformas.busqueda = termino;
                filtroProformas.pagina = 1;
                aplicarFiltrosProformas();
            }, 300);
        });
        console.log('✅ Evento de búsqueda configurado');
    }

    // Configurar evento de cambio de estado
    const $selectEstado = $('#estadoProformas');
    if ($selectEstado.length) {
        $selectEstado.off('change.proformasFilter').on('change.proformasFilter', function() {
            const estado = $(this).val();
            console.log('🔍 Estado seleccionado:', estado);

            filtroProformas.estado = estado;
            filtroProformas.pagina = 1;
            aplicarFiltrosProformas();
        });
        console.log('✅ Evento de estado configurado');
    }

    // Configurar botón limpiar
    const $btnLimpiar = $('#btnLimpiarFiltrosProformas');
    if ($btnLimpiar.length) {
        $btnLimpiar.off('click.proformasFilter').on('click.proformasFilter', function(e) {
            e.preventDefault();
            e.stopPropagation();
            limpiarFiltrosProformas();
        });
        console.log('✅ Botón limpiar configurado');
    }

    console.log('✅ Filtros de proformas inicializados correctamente');
}

/**
 * Aplicar filtros y cargar proformas
 */
async function aplicarFiltrosProformas() {
    // Prevenir múltiples llamadas simultáneas
    if (busquedaProformasEnProceso) {
        console.log('⏸️ Búsqueda de proformas ya en proceso, omitiendo llamada duplicada');
        return;
    }

    // Prevenir búsquedas duplicadas del mismo término
    const terminoActual = filtroProformas.busqueda + '|' + filtroProformas.estado;
    if (terminoActual === ultimaBusquedaProformas) {
        console.log('⏸️ Búsqueda duplicada del mismo filtro omitida:', terminoActual);
        return;
    }

    try {
        console.log('🔍 === APLICANDO FILTROS DE PROFORMAS ===');
        console.log('🔍 Filtro actual:', filtroProformas);

        busquedaProformasEnProceso = true;
        ultimaBusquedaProformas = terminoActual;

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir URL con parámetros
        const params = new URLSearchParams();
        params.append('pagina', filtroProformas.pagina);
        params.append('tamano', filtroProformas.tamano);

        // Agregar estado si no es "todos"
        if (filtroProformas.estado && filtroProformas.estado !== 'todos') {
            params.append('estado', filtroProformas.estado);
            console.log('🔍 Agregando filtro estado:', filtroProformas.estado);
        }

        // Agregar búsqueda si existe
        if (filtroProformas.busqueda && filtroProformas.busqueda.trim() !== '') {
            params.append('busqueda', filtroProformas.busqueda.trim());
            console.log('🔍 Agregando filtro búsqueda:', filtroProformas.busqueda);
        }

        const urlCompleta = `/Facturacion/ObtenerProformas?${params.toString()}`;
        console.log('📋 URL completa de consulta:', urlCompleta);

        // Realizar petición AJAX usando el mismo patrón que facturación
        const response = await fetch(urlCompleta, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('📋 Respuesta recibida, status:', response.status);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📋 Datos recibidos:', resultado);

        // Procesar resultado
        if (resultado.success) {
            let proformas = null;

            // Buscar proformas en diferentes propiedades del resultado
            if (resultado.proformas && Array.isArray(resultado.proformas)) {
                proformas = resultado.proformas;
            } else if (resultado.data && Array.isArray(resultado.data)) {
                proformas = resultado.data;
            } else if (Array.isArray(resultado)) {
                proformas = resultado;
            }

            if (proformas && proformas.length > 0) {
                console.log('✅ Proformas encontradas:', proformas.length);
                mostrarProformasEnTabla(proformas);
                $('#proformasContent').show();

                // Mostrar paginación si hay datos de paginación
                if (resultado.totalPaginas > 1) {
                    mostrarPaginacionProformas(resultado.pagina || filtroProformas.pagina, resultado.totalPaginas);
                }
            } else {
                console.log('ℹ️ No se encontraron proformas');
                mostrarProformasVacias();
            }
        } else {
            console.log('❌ Respuesta no exitosa:', resultado.message);
            mostrarProformasVacias();
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar proformas', 'warning');
            }
        }

    } catch (error) {
        console.error('❌ Error aplicando filtros de proformas:', error);
        mostrarProformasVacias();
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
        }
    } finally {
        busquedaProformasEnProceso = false;
        $('#proformasLoading').hide();
    }
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
                        <button type="button" class="btn btn-outline-info" title="Ver detalles" onclick="verDetalleProforma(${proforma.facturaId || proforma.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" title="Imprimir" onclick="imprimirProforma(${proforma.facturaId || proforma.id})">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${proforma.estado === 'Vigente' ? `
                        <button type="button" class="btn btn-outline-success" title="Convertir a Factura" onclick="convertirProformaAFactura(${proforma.facturaId || proforma.id})">
                            <i class="bi bi-arrow-up-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        tbody.append(fila);
    });

    console.log('✅ Proformas mostradas en tabla');
}

/**
 * Mostrar paginación
 */
function mostrarPaginacionProformas(paginaActual, totalPaginas) {
    console.log('📄 === MOSTRANDO PAGINACIÓN DE PROFORMAS ===');
    console.log('📄 Página actual:', paginaActual, 'Total páginas:', totalPaginas);

    const paginacion = $('#paginacionProformas');
    if (paginacion.length === 0 || totalPaginas <= 1) {
        return;
    }

    let html = '<ul class="pagination justify-content-center">';

    // Botón anterior
    if (paginaActual > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaProformas(${paginaActual - 1})">Anterior</a>
                </li>`;
    }

    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === paginaActual) {
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
    if (paginaActual < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaProformas(${paginaActual + 1})">Siguiente</a>
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
    filtroProformas = {
        busqueda: '',
        estado: 'todos',
        pagina: 1,
        tamano: 20
    };

    // Limpiar campos del formulario
    $('#busquedaProformas').val('');
    $('#estadoProformas').val('todos');

    // Limpiar variables de control
    ultimaBusquedaProformas = '';
    busquedaProformasEnProceso = false;

    // Recargar proformas
    aplicarFiltrosProformas();

    console.log('✅ Filtros limpiados y proformas recargadas');
}

/**
 * Cambiar página
 */
function cambiarPaginaProformas(nuevaPagina) {
    console.log('📄 === CAMBIANDO PÁGINA DE PROFORMAS ===');
    console.log('📄 Nueva página:', nuevaPagina);

    if (nuevaPagina > 0) {
        filtroProformas.pagina = nuevaPagina;
        aplicarFiltrosProformas();
    }
}

/**
 * Cargar proformas (función de compatibilidad)
 */
async function cargarProformas(pagina = 1) {
    console.log('📋 === FUNCIÓN COMPATIBILIDAD: cargarProformas ===');
    filtroProformas.pagina = pagina;
    await aplicarFiltrosProformas();
}

// Exportar funciones para uso global
window.inicializarFiltrosProformas = inicializarFiltrosProformas;
window.aplicarFiltrosProformas = aplicarFiltrosProformas;
window.limpiarFiltrosProformas = limpiarFiltrosProformas;
window.cambiarPaginaProformas = cambiarPaginaProformas;
window.cargarProformas = cargarProformas;
window.mostrarProformasEnTabla = mostrarProformasEnTabla;

console.log('📋 Módulo de filtros de proformas cargado correctamente');
