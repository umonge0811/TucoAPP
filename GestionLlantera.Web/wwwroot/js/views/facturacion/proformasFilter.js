

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
    
    // Limpiar eventos previos
    $filtroEstado.off('change.filtros');
    
    $filtroEstado.on('change.filtros', function() {
        filtroActual.estado = $(this).val();
        filtroActual.pagina = 1;
        
        console.log('🔍 Filtro por estado cambiado:', filtroActual.estado);
        aplicarFiltros();
    });
}

/**
 * ✅ FUNCIÓN: Configurar búsqueda general con debounce
 */
function configurarBusquedaGeneral() {
    const $inputBusqueda = $('#busquedaProformas');
    const $btnBuscar = $('#btnBuscarProformas');
    
    // Limpiar eventos previos
    $inputBusqueda.off('keyup.filtros input.filtros keypress.filtros');
    $btnBuscar.off('click.filtros');
    
    // Búsqueda en tiempo real con debounce (como en inventario)
    $inputBusqueda.on('input.filtros', function() {
        clearTimeout(timeoutBusqueda);
        
        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1;
            
            console.log('🔍 Búsqueda cambiada:', filtroActual.busqueda);
            aplicarFiltros();
        }, 300); // 300ms como en inventario
    });
    
    // También escuchar keyup para retrocompatibilidad
    $inputBusqueda.on('keyup.filtros', function() {
        clearTimeout(timeoutBusqueda);
        
        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1;
            aplicarFiltros();
        }, 300);
    });
    
    // Botón de búsqueda
    $btnBuscar.on('click.filtros', function() {
        clearTimeout(timeoutBusqueda);
        filtroActual.busqueda = $inputBusqueda.val().trim();
        filtroActual.pagina = 1;
        aplicarFiltros();
    });
    
    // Enter en el input
    $inputBusqueda.on('keypress.filtros', function(e) {
        if (e.which === 13) {
            clearTimeout(timeoutBusqueda);
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
    
    // Limpiar eventos previos
    $btnLimpiar.off('click.filtros');
    
    $btnLimpiar.on('click.filtros', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🧹 Botón limpiar presionado');
        limpiarFiltros();
    });
}

/**
 * ✅ FUNCIÓN: Limpiar todos los filtros
 */
function limpiarFiltros() {
    console.log('🧹 === LIMPIANDO FILTROS ===');
    
    // Limpiar timeout de búsqueda
    clearTimeout(timeoutBusqueda);
    
    // Resetear filtros
    filtroActual = {
        estado: '',
        busqueda: '',
        pagina: 1
    };
    
    // Limpiar UI sin disparar eventos
    $('#filtroEstadoProforma').off('change.filtros').val('').on('change.filtros', function() {
        filtroActual.estado = $(this).val();
        filtroActual.pagina = 1;
        aplicarFiltros();
    });
    
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

        // Mapear estados correctos
        if (filtros.estado && filtros.estado.trim() !== '') {
            let estadoMapeado = filtros.estado;
            
            // Mapear estados según los disponibles en el sistema
            switch (filtros.estado.toLowerCase()) {
                case 'facturada':
                    estadoMapeado = 'Facturada';
                    break;
                case 'vigente':
                    estadoMapeado = 'Vigente';
                    break;
                case 'expirada':
                case 'vencida':
                    estadoMapeado = 'Expirada';
                    break;
                default:
                    estadoMapeado = filtros.estado;
            }
            
            params.append('estado', estadoMapeado);
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

