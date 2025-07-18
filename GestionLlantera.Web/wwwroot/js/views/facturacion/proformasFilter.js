// ===== MÓDULO DE FILTROS PARA PROFORMAS =====

let filtroActual = {
    busqueda: '',
    estado: 'todos',
    pagina: 1,
    tamano: 20
};

let timeoutBusqueda = null;

/**
 * Inicializar filtros de proformas
 */
function inicializarFiltrosProformas() {
    console.log('🔍 === INICIALIZANDO FILTROS DE PROFORMAS ===');

    // Configurar evento de búsqueda con debounce
    const $inputBusqueda = $('#busquedaProformas');
    if ($inputBusqueda.length) {
        $inputBusqueda.off('input.proformasFilter').on('input.proformasFilter', function() {
            const termino = $(this).val().trim();
            console.log('🔍 Término de búsqueda:', termino);

            // Limpiar timeout anterior
            if (timeoutBusqueda) {
                clearTimeout(timeoutBusqueda);
            }

            // Aplicar filtro después de 500ms
            timeoutBusqueda = setTimeout(() => {
                filtroActual.busqueda = termino;
                filtroActual.pagina = 1; // Resetear a primera página
                aplicarFiltrosProformas();
            }, 500);
        });
        console.log('✅ Evento de búsqueda configurado');
    }

    // Configurar evento de cambio de estado
    const $selectEstado = $('#estadoProformas');
    if ($selectEstado.length) {
        $selectEstado.off('change.proformasFilter').on('change.proformasFilter', function() {
            const estado = $(this).val();
            console.log('🔍 Estado seleccionado:', estado);

            filtroActual.estado = estado;
            filtroActual.pagina = 1; // Resetear a primera página
            aplicarFiltrosProformas();
        });
        console.log('✅ Evento de estado configurado');
    }

    // Configurar botón limpiar
    const $btnLimpiar = $('#btnLimpiarFiltrosProformas');
    if ($btnLimpiar.length) {
        $btnLimpiar.off('click.proformasFilter').on('click.proformasFilter', function(e) {
            e.preventDefault();
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
    try {
        console.log('🔍 === APLICANDO FILTROS DE PROFORMAS ===');
        console.log('🔍 Filtro actual:', filtroActual);

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir parámetros
        const params = new URLSearchParams({
            pagina: filtroActual.pagina,
            tamano: filtroActual.tamano
        });

        // Agregar estado si no es "todos"
        if (filtroActual.estado && filtroActual.estado !== 'todos') {
            params.append('estado', filtroActual.estado);
            console.log('🔍 Agregando filtro estado:', filtroActual.estado);
        }

        // Agregar búsqueda si existe
        if (filtroActual.busqueda && filtroActual.busqueda.trim() !== '') {
            params.append('busqueda', filtroActual.busqueda.trim());
            console.log('🔍 Agregando filtro búsqueda:', filtroActual.busqueda);
        }

        const urlCompleta = `/Facturacion/ObtenerProformas?${params.toString()}`;
        console.log('📋 URL completa de consulta:', urlCompleta);

        // Realizar petición
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
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📋 Datos recibidos:', resultado);

        if (resultado.success && resultado.proformas && resultado.proformas.length > 0) {
            // Verificar si la función mostrarProformas existe
            if (typeof window.mostrarProformas === 'function') {
                window.mostrarProformas(resultado.proformas);
            } else if (typeof mostrarProformas === 'function') {
                mostrarProformas(resultado.proformas);
            } else {
                console.error('❌ Función mostrarProformas no encontrada');
                mostrarProformasManual(resultado.proformas);
            }

            $('#proformasContent').show();

            // Mostrar paginación si existe la función
            if (typeof window.mostrarPaginacionProformas === 'function') {
                window.mostrarPaginacionProformas(resultado.pagina, resultado.totalPaginas);
            } else if (typeof mostrarPaginacionProformas === 'function') {
                mostrarPaginacionProformas(resultado.pagina, resultado.totalPaginas);
            }
        } else {
            mostrarProformasVacias();
        }

    } catch (error) {
        console.error('❌ Error aplicando filtros:', error);
        mostrarProformasVacias();
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
        }
    } finally {
        $('#proformasLoading').hide();
    }
}

/**
 * Limpiar filtros
 */
function limpiarFiltrosProformas() {
    console.log('🧹 === LIMPIANDO FILTROS DE PROFORMAS ===');

    // Resetear filtros
    filtroActual = {
        busqueda: '',
        estado: 'todos',
        pagina: 1,
        tamano: 20
    };

    // Limpiar campos del formulario
    $('#busquedaProformas').val('');
    $('#estadoProformas').val('todos');

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
        filtroActual.pagina = nuevaPagina;
        aplicarFiltrosProformas();
    }
}

/**
 * Cargar proformas (función alternativa para compatibilidad)
 */
async function cargarProformas(pagina = 1) {
    console.log('📋 === FUNCIÓN COMPATIBILIDAD: cargarProformas ===');
    filtroActual.pagina = pagina;
    await aplicarFiltrosProformas();
}

/**
 * FUNCIÓN AUXILIAR: Mostrar proformas manualmente si no existe la función principal
 */
function mostrarProformasManual(proformas) {
    console.log('📋 Usando función manual para mostrar proformas');

    const tbody = $('#proformasTableBody');
    if (tbody.length === 0) {
        console.error('❌ No se encontró el tbody de proformas');
        return;
    }

    tbody.empty();

    proformas.forEach(proforma => {
        const fecha = new Date(proforma.fechaFactura).toLocaleDateString('es-CR');
        let estadoBadge = '';

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
                estadoBadge = `<span class="badge bg-secondary">${proforma.estado}</span>`;
        }

        const fila = `
            <tr>
                <td>
                    <strong>${proforma.numeroFactura}</strong><br>
                    <small class="text-muted">${proforma.tipoDocumento}</small>
                </td>
                <td>
                    <strong>${proforma.nombreCliente || 'Cliente General'}</strong><br>
                    <small class="text-muted">${proforma.emailCliente || ''}</small>
                </td>
                <td>
                    <strong>${fecha}</strong><br>
                    <small class="text-muted">Por: ${proforma.usuarioCreador || 'Sistema'}</small>
                </td>
                <td>
                    <strong class="text-success">₡${Number(proforma.total).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td>${estadoBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" title="Imprimir">
                            <i class="bi bi-printer"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        tbody.append(fila);
    });
}

/**
 * Mostrar proformas vacias
 */
function mostrarProformasVacias() {
    console.log('ℹ️ No se encontraron proformas');
    $('#proformasEmpty').show();
    $('#proformasContent').hide();
}

// Exportar funciones para uso global
window.inicializarFiltrosProformas = inicializarFiltrosProformas;
window.aplicarFiltrosProformas = aplicarFiltrosProformas;
window.limpiarFiltrosProformas = limpiarFiltrosProformas;
window.cambiarPaginaProformas = cambiarPaginaProformas;
window.cargarProformas = cargarProformas;

console.log('📋 Módulo de filtros de proformas cargado');