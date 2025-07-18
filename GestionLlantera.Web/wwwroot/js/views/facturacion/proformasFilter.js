/**
 * ========================================
 * MÓDULO DE FILTROS PARA MODAL DE PROFORMAS
 * ========================================
 */
```

```javascript
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
 * ✅ FUNCIÓN: Configurar búsqueda general simplificada
 */
function configurarBusquedaGeneral() {
    const $inputBusqueda = $('#busquedaProformas');
    const $btnBuscar = $('#btnBuscarProformas');

    // Limpiar eventos previos
    $inputBusqueda.off();
    $btnBuscar.off();

    // Función de búsqueda unificada
    function realizarBusqueda() {
        clearTimeout(timeoutBusqueda);

        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = $inputBusqueda.val().trim();
            filtroActual.pagina = 1;

            console.log('🔍 Búsqueda:', filtroActual.busqueda);
            aplicarFiltros();
        }, 500); // Aumentado a 500ms para evitar llamadas excesivas
    }

    // Evento de escritura (input)
    $inputBusqueda.on('input', realizarBusqueda);

    // Evento de Enter
    $inputBusqueda.on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            clearTimeout(timeoutBusqueda);
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1;
            aplicarFiltros();
        }
    });

    // Botón de búsqueda
    $btnBuscar.on('click', function(e) {
        e.preventDefault();
        clearTimeout(timeoutBusqueda);
        filtroActual.busqueda = $inputBusqueda.val().trim();
        filtroActual.pagina = 1;
        aplicarFiltros();
    });
}

/**
 * ✅ FUNCIÓN: Configurar botón limpiar filtros
 */
function configurarLimpiarFiltros() {
    const $btnLimpiar = $('#btnLimpiarFiltrosProformas');

    // Limpiar eventos previos
    $btnLimpiar.off();

    $btnLimpiar.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🧹 Limpiando filtros');
        limpiarFiltros();
    });
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

    // Aplicar filtros vacíos
    aplicarFiltros();
}

/**
 * ✅ FUNCIÓN: Aplicar filtros y cargar proformas
 */
async function aplicarFiltros() {
    try {
        console.log('🔍 === APLICANDO FILTROS ===');
        console.log('🔍 Filtros actuales:', filtroActual);

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        // Construir parámetros
        const params = new URLSearchParams({
            pagina: filtroActual.pagina || 1,
            tamano: 20
        });

        // Agregar estado si existe
        if (filtroActual.estado && filtroActual.estado.trim() !== '') {
            params.append('estado', filtroActual.estado);
        }

        // Agregar búsqueda si existe
        if (filtroActual.busqueda && filtroActual.busqueda.trim() !== '') {
            params.append('busqueda', filtroActual.busqueda);
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
        console.error('❌ Error aplicando filtros:', error);
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