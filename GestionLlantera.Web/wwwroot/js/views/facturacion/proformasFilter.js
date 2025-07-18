
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

/**
 * ✅ FUNCIÓN: Inicializar filtros del modal de proformas
 */
function inicializarFiltrosProformas() {
    console.log('🔍 === INICIALIZANDO FILTROS DE PROFORMAS ===');
    
    configurarFiltroEstado();
    configurarBusquedaGeneral();
    configurarLimpiarFiltros();
    
    // Cargar proformas iniciales
    aplicarFiltros();
}

/**
 * ✅ FUNCIÓN: Configurar filtro por estado
 */
function configurarFiltroEstado() {
    const $filtroEstado = $('#filtroEstadoProforma');
    
    $filtroEstado.off('change.filtros');
    $filtroEstado.on('change.filtros', function() {
        filtroActual.estado = $(this).val();
        filtroActual.pagina = 1;
        
        console.log('🔍 Filtro por estado cambiado:', filtroActual.estado);
        aplicarFiltros();
    });
}

/**
 * ✅ FUNCIÓN: Configurar búsqueda general
 */
function configurarBusquedaGeneral() {
    const $inputBusqueda = $('#busquedaProformas');
    const $btnBuscar = $('#btnBuscarProformas');
    
    $inputBusqueda.off('keyup.filtros input.filtros');
    $btnBuscar.off('click.filtros');
    
    // Búsqueda en tiempo real con debounce
    let timeoutBusqueda;
    $inputBusqueda.on('keyup.filtros input.filtros', function() {
        clearTimeout(timeoutBusqueda);
        
        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1;
            
            console.log('🔍 Búsqueda cambiada:', filtroActual.busqueda);
            aplicarFiltros();
        }, 500);
    });
    
    // Botón de búsqueda
    $btnBuscar.on('click.filtros', function() {
        filtroActual.busqueda = $inputBusqueda.val().trim();
        filtroActual.pagina = 1;
        aplicarFiltros();
    });
    
    // Enter en el input
    $inputBusqueda.on('keypress.filtros', function(e) {
        if (e.which === 13) {
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1;
            aplicarFiltros();
        }
    });
}

/**
 * ✅ FUNCIÓN: Configurar botón limpiar filtros
 */
function configurarLimpiarFiltros() {
    const $btnLimpiar = $('#btnLimpiarFiltrosProformas');
    
    $btnLimpiar.off('click.filtros');
    $btnLimpiar.on('click.filtros', function() {
        limpiarFiltros();
    });
}

/**
 * ✅ FUNCIÓN: Limpiar todos los filtros
 */
function limpiarFiltros() {
    console.log('🧹 === LIMPIANDO FILTROS ===');
    
    // Resetear filtros
    filtroActual = {
        estado: '',
        busqueda: '',
        pagina: 1
    };
    
    // Limpiar UI
    $('#filtroEstadoProforma').val('').trigger('change');
    $('#busquedaProformas').val('');
    
    // Aplicar filtros vacíos
    aplicarFiltros();
    
    console.log('🧹 Filtros limpiados correctamente');
}

/**
 * ✅ FUNCIÓN: Aplicar filtros y cargar proformas
 */
async function aplicarFiltros() {
    try {
        console.log('🔍 === APLICANDO FILTROS ===');
        console.log('🔍 Filtros actuales:', filtroActual);
        
        await cargarProformasConFiltros(filtroActual);
        
    } catch (error) {
        console.error('❌ Error aplicando filtros:', error);
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al aplicar filtros: ' + error.message, 'danger');
        }
    }
}

/**
 * ✅ FUNCIÓN: Cargar proformas con filtros aplicados
 */
async function cargarProformasConFiltros(filtros) {
    try {
        console.log('📋 === CARGANDO PROFORMAS CON FILTROS ===');

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir parámetros
        const params = new URLSearchParams({
            pagina: filtros.pagina || 1,
            tamano: 20
        });

        if (filtros.estado && filtros.estado.trim() !== '') {
            params.append('estado', filtros.estado);
        }
        
        if (filtros.busqueda && filtros.busqueda.trim() !== '') {
            params.append('busqueda', filtros.busqueda);
        }

        console.log('📋 URL de consulta:', `/Facturacion/ObtenerProformas?${params}`);

        const response = await fetch(`/Facturacion/ObtenerProformas?${params}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado obtenido:', resultado);

        if (resultado.success && resultado.proformas && resultado.proformas.length > 0) {
            // Usar funciones existentes de facturacion.js
            if (typeof mostrarProformas === 'function') {
                mostrarProformas(resultado.proformas);
                $('#proformasContent').show();
            }
            if (typeof mostrarPaginacionProformas === 'function') {
                mostrarPaginacionProformas(resultado.pagina, resultado.totalPaginas);
            }
        } else {
            // Mostrar mensaje de vacío
            $('#proformasEmpty').show();
            $('#proformasContent').hide();
        }

    } catch (error) {
        console.error('❌ Error cargando proformas con filtros:', error);
        $('#proformasEmpty').show();
        $('#proformasContent').hide();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
        }
    } finally {
        $('#proformasLoading').hide();
    }
}

/**
 * ✅ FUNCIÓN: Cambiar página desde paginación
 */
function cambiarPaginaProformas(nuevaPagina) {
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
