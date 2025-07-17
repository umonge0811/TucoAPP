
/**
 * ========================================
 * MÓDULO DE FILTROS PARA MODAL DE PROFORMAS
 * ========================================
 * Archivo dedicado para manejar los filtros del modal de proformas
 * Incluye filtro por estado y búsqueda general
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
    
    // Configurar filtro por estado
    configurarFiltroEstado();
    
    // Configurar búsqueda general
    configurarBusquedaGeneral();
    
    // Configurar botón de limpiar filtros
    configurarLimpiarFiltros();
}

/**
 * ✅ FUNCIÓN: Configurar filtro por estado
 */
function configurarFiltroEstado() {
    const $filtroEstado = $('#filtroEstadoProforma');
    
    // Limpiar eventos anteriores
    $filtroEstado.off('change.filtros');
    
    // Configurar evento
    $filtroEstado.on('change.filtros', function() {
        filtroActual.estado = $(this).val();
        filtroActual.pagina = 1; // Resetear paginación
        
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
    
    // Limpiar eventos anteriores
    $inputBusqueda.off('keyup.filtros input.filtros');
    $btnBuscar.off('click.filtros');
    
    // Búsqueda en tiempo real (con debounce)
    let timeoutBusqueda;
    $inputBusqueda.on('keyup.filtros input.filtros', function() {
        clearTimeout(timeoutBusqueda);
        
        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1; // Resetear paginación
            
            console.log('🔍 Búsqueda cambiada:', filtroActual.busqueda);
            aplicarFiltros();
        }, 500); // Esperar 500ms después de que el usuario deje de escribir
    });
    
    // Botón de búsqueda manual
    $btnBuscar.on('click.filtros', function() {
        filtroActual.busqueda = $inputBusqueda.val().trim();
        filtroActual.pagina = 1;
        
        console.log('🔍 Búsqueda manual:', filtroActual.busqueda);
        aplicarFiltros();
    });
    
    // Enter en el input
    $inputBusqueda.on('keypress.filtros', function(e) {
        if (e.which === 13) { // Enter
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
    
    // Limpiar eventos anteriores
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
    
    // Resetear valores del filtro
    filtroActual = {
        estado: '',
        busqueda: '',
        pagina: 1
    };
    
    // Limpiar inputs en la UI
    $('#filtroEstadoProforma').val('');
    $('#busquedaProformas').val('');
    
    // Aplicar filtros (que será sin filtros)
    aplicarFiltros();
}

/**
 * ✅ FUNCIÓN: Aplicar filtros y cargar proformas
 */
async function aplicarFiltros() {
    try {
        console.log('🔍 === APLICANDO FILTROS ===');
        console.log('🔍 Filtros actuales:', filtroActual);
        
        // Llamar a la función de carga de proformas con filtros
        await cargarProformasConFiltros(filtroActual);
        
    } catch (error) {
        console.error('❌ Error aplicando filtros:', error);
        mostrarToast('Error', 'Error al aplicar filtros: ' + error.message, 'danger');
    }
}

/**
 * ✅ FUNCIÓN: Cargar proformas con filtros aplicados
 */
async function cargarProformasConFiltros(filtros) {
    try {
        console.log('📋 === CARGANDO PROFORMAS CON FILTROS ===');
        console.log('📋 Filtros:', filtros);

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir parámetros
        const params = new URLSearchParams({
            pagina: filtros.pagina || 1,
            tamano: 20
        });

        // Agregar filtros solo si tienen valor
        if (filtros.estado) {
            params.append('estado', filtros.estado);
        }
        
        if (filtros.busqueda) {
            params.append('busqueda', filtros.busqueda);
        }

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
            // Usar las funciones existentes de facturacion.js
            if (typeof mostrarProformas === 'function') {
                mostrarProformas(resultado.proformas);
            }
            if (typeof mostrarPaginacionProformas === 'function') {
                mostrarPaginacionProformas(resultado.pagina, resultado.totalPaginas);
            }
        } else {
            // Usar función existente de facturacion.js
            if (typeof mostrarProformasVacias === 'function') {
                mostrarProformasVacias();
            }
        }

    } catch (error) {
        console.error('❌ Error cargando proformas con filtros:', error);
        if (typeof mostrarProformasVacias === 'function') {
            mostrarProformasVacias();
        }
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
 * ✅ FUNCIÓN: Obtener filtros actuales (para uso externo)
 */
function obtenerFiltrosActuales() {
    return { ...filtroActual };
}

// Exportar funciones para uso global
window.inicializarFiltrosProformas = inicializarFiltrosProformas;
window.limpiarFiltros = limpiarFiltros;
window.cambiarPaginaProformas = cambiarPaginaProformas;
window.obtenerFiltrosActuales = obtenerFiltrosActuales;
