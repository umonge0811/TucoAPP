
/**
 * ========================================
 * MÓDULO DE FILTROS PARA MODAL DE PROFORMAS
 * ========================================
 */

// Variables globales del módulo
let filtroActual = {
    estado: '',
    busqueda: '',
    pagina: 1
};

let timeoutBusqueda;

/**
 * ✅ FUNCIÓN: Inicializar filtros del modal de proformas
 */
function inicializarFiltrosProformas() {
    console.log('🔍 === INICIALIZANDO FILTROS DE PROFORMAS ===');

    // Verificar que los elementos existen
    const $inputBusqueda = $('#busquedaProformas');
    const $filtroEstado = $('#filtroEstadoProforma');
    const $btnLimpiar = $('#btnLimpiarFiltrosProformas');

    console.log('🔧 Verificando elementos DOM:');
    console.log('🔧 - Input búsqueda encontrado:', $inputBusqueda.length > 0);
    console.log('🔧 - Filtro estado encontrado:', $filtroEstado.length > 0);
    console.log('🔧 - Botón limpiar encontrado:', $btnLimpiar.length > 0);

    if ($inputBusqueda.length === 0) {
        console.error('❌ No se encontró el input de búsqueda #busquedaProformas');
        return;
    }

    if ($filtroEstado.length === 0) {
        console.error('❌ No se encontró el select de estado #filtroEstadoProforma');
        return;
    }

    // Configurar eventos
    configurarFiltroEstado();
    configurarBusquedaGeneral();
    configurarLimpiarFiltros();

    console.log('✅ Filtros de proformas inicializados correctamente');
}

/**
 * ✅ FUNCIÓN: Configurar filtro por estado
 */
function configurarFiltroEstado() {
    const $filtroEstado = $('#filtroEstadoProforma');

    // Limpiar eventos previos
    $filtroEstado.off('change.filtrosProforma');

    $filtroEstado.on('change.filtrosProforma', function() {
        const valorSeleccionado = $(this).val();
        console.log('🔍 Estado seleccionado:', valorSeleccionado);
        
        filtroActual.estado = valorSeleccionado;
        filtroActual.pagina = 1;

        // Aplicar filtros inmediatamente
        aplicarFiltros();
    });

    console.log('✅ Filtro por estado configurado');
}

/**
 * ✅ FUNCIÓN: Configurar búsqueda general
 */
function configurarBusquedaGeneral() {
    const $inputBusqueda = $('#busquedaProformas');

    console.log('🔧 Configurando búsqueda general');

    // Limpiar eventos previos
    $inputBusqueda.off('input.filtrosProforma keyup.filtrosProforma');

    // Función de búsqueda
    function realizarBusqueda() {
        clearTimeout(timeoutBusqueda);
        
        const valorBusqueda = $inputBusqueda.val().trim();
        console.log('🔍 Valor de búsqueda:', valorBusqueda);

        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = valorBusqueda;
            filtroActual.pagina = 1;

            console.log('🔍 Ejecutando búsqueda:', filtroActual);
            aplicarFiltros();
        }, 500);
    }

    // Evento principal - usar input para detectar cambios en tiempo real
    $inputBusqueda.on('input.filtrosProforma', function() {
        console.log('🔍 Evento input detectado, valor:', $(this).val());
        realizarBusqueda();
    });

    // Evento adicional para mayor compatibilidad
    $inputBusqueda.on('keyup.filtrosProforma', function() {
        console.log('🔍 Evento keyup detectado, valor:', $(this).val());
        realizarBusqueda();
    });

    console.log('✅ Búsqueda general configurada correctamente');
}

/**
 * ✅ FUNCIÓN: Configurar botón limpiar filtros
 */
function configurarLimpiarFiltros() {
    const $btnLimpiar = $('#btnLimpiarFiltrosProformas');

    if ($btnLimpiar.length === 0) {
        console.error('❌ No se encontró el botón limpiar filtros');
        return;
    }

    // Limpiar eventos previos
    $btnLimpiar.off('click.filtrosProforma');

    $btnLimpiar.on('click.filtrosProforma', function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🧹 Botón limpiar presionado');
        limpiarFiltros();
    });

    console.log('✅ Botón limpiar configurado');
}

/**
 * ✅ FUNCIÓN: Limpiar todos los filtros
 */
function limpiarFiltros() {
    console.log('🧹 === LIMPIANDO FILTROS ===');

    // Limpiar timeout
    clearTimeout(timeoutBusqueda);

    // Resetear filtros
    filtroActual = {
        estado: '',
        busqueda: '',
        pagina: 1
    };

    // Limpiar UI
    $('#filtroEstadoProforma').val('');
    $('#busquedaProformas').val('');

    console.log('🧹 Filtros limpiados, cargando todas las proformas');
    
    // Cargar todas las proformas
    aplicarFiltros();
}

/**
 * ✅ FUNCIÓN: Aplicar filtros y cargar proformas
 */
async function aplicarFiltros() {
    try {
        console.log('🔍 === APLICANDO FILTROS ===');
        console.log('🔍 Estado actual del filtro:', filtroActual);

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir parámetros de consulta
        const params = new URLSearchParams({
            pagina: filtroActual.pagina.toString(),
            tamano: '20'
        });

        // Agregar estado si existe
        if (filtroActual.estado && filtroActual.estado.trim() !== '') {
            params.append('estado', filtroActual.estado.trim());
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
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', response.status, errorText);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📋 Datos recibidos:', resultado);

        // Procesar resultados
        if (resultado.success) {
            if (resultado.proformas && resultado.proformas.length > 0) {
                console.log('✅ Proformas encontradas:', resultado.proformas.length);
                
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
                console.log('ℹ️ No se encontraron proformas');
                $('#proformasEmpty').show();
                $('#proformasContent').hide();
            }
        } else {
            console.error('❌ Error en resultado:', resultado.message);
            $('#proformasEmpty').show();
            $('#proformasContent').hide();
            
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar proformas', 'danger');
            }
        }

    } catch (error) {
        console.error('❌ Error completo:', error);
        $('#proformasEmpty').show();
        $('#proformasContent').hide();

        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
        }
    } finally {
        $('#proformasLoading').hide();
        console.log('🔍 === FIN APLICAR FILTROS ===');
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Mostrar proformas manualmente si no existe la función principal
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
        
        switch(proforma.estado) {
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
                    <strong class="text-success">₡${Number(proforma.total).toLocaleString('es-CR', {minimumFractionDigits: 2})}</strong>
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
 * ✅ FUNCIÓN: Cambiar página
 */
function cambiarPaginaProformas(nuevaPagina) {
    console.log('📄 Cambiando a página:', nuevaPagina);
    filtroActual.pagina = nuevaPagina;
    aplicarFiltros();
}

/**
 * ✅ FUNCIÓN: Obtener filtros actuales
 */
function obtenerFiltrosActuales() {
    return { ...filtroActual };
}

// Exportar funciones globales
window.inicializarFiltrosProformas = inicializarFiltrosProformas;
window.limpiarFiltros = limpiarFiltros;
window.cambiarPaginaProformas = cambiarPaginaProformas;
window.obtenerFiltrosActuales = obtenerFiltrosActuales;
window.aplicarFiltros = aplicarFiltros;

console.log('📋 === MÓDULO DE FILTROS DE PROFORMAS CARGADO ===');
