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
 * ✅ FUNCIÓN: Inicializar filtros del modal de proformas con verificación
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
    }

    configurarFiltroEstado();
    configurarBusquedaGeneral();
    configurarLimpiarFiltros();

    // Cargar proformas iniciales
    console.log('🔍 Cargando proformas iniciales...');
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
 * ✅ FUNCIÓN: Configurar búsqueda general mejorada
 */
function configurarBusquedaGeneral() {
    const $inputBusqueda = $('#busquedaProformas');
    const $btnBuscar = $('#btnBuscarProformas');

    console.log('🔧 Configurando búsqueda general');

    // Limpiar eventos previos
    $inputBusqueda.off('input.filtros keyup.filtros keypress.filtros');
    $btnBuscar.off('click.filtros');

    // Función de búsqueda mejorada
    function realizarBusqueda() {
        clearTimeout(timeoutBusqueda);
        
        const valorBusqueda = $inputBusqueda.val().trim();
        console.log('🔍 Valor de búsqueda detectado:', valorBusqueda);

        timeoutBusqueda = setTimeout(() => {
            filtroActual.busqueda = valorBusqueda;
            filtroActual.pagina = 1;

            console.log('🔍 Ejecutando búsqueda con:', filtroActual.busqueda);
            aplicarFiltros();
        }, 300); // Reducido para mayor responsividad
    }

    // Evento principal de escritura
    $inputBusqueda.on('input.filtros', function() {
        console.log('🔍 Evento input detectado:', $(this).val());
        realizarBusqueda();
    });

    // Evento adicional para compatibilidad
    $inputBusqueda.on('keyup.filtros', function() {
        console.log('🔍 Evento keyup detectado:', $(this).val());
        realizarBusqueda();
    });

    // Evento de Enter
    $inputBusqueda.on('keypress.filtros', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            clearTimeout(timeoutBusqueda);
            filtroActual.busqueda = $(this).val().trim();
            filtroActual.pagina = 1;
            console.log('🔍 Enter presionado, búsqueda inmediata:', filtroActual.busqueda);
            aplicarFiltros();
        }
    });

    // Botón de búsqueda
    $btnBuscar.on('click.filtros', function(e) {
        e.preventDefault();
        clearTimeout(timeoutBusqueda);
        filtroActual.busqueda = $inputBusqueda.val().trim();
        filtroActual.pagina = 1;
        console.log('🔍 Botón búsqueda presionado:', filtroActual.busqueda);
        aplicarFiltros();
    });

    console.log('✅ Búsqueda general configurada correctamente');
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
 * ✅ FUNCIÓN: Aplicar filtros y cargar proformas con mejor debugging
 */
async function aplicarFiltros() {
    try {
        console.log('🔍 === APLICANDO FILTROS ===');
        console.log('🔍 Filtros actuales:', JSON.stringify(filtroActual, null, 2));

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
            console.log('🔍 Filtro estado agregado:', filtroActual.estado);
        }

        // Agregar búsqueda si existe
        if (filtroActual.busqueda && filtroActual.busqueda.trim() !== '') {
            params.append('busqueda', filtroActual.busqueda);
            console.log('🔍 Filtro búsqueda agregado:', filtroActual.busqueda);
        }

        const urlCompleta = `/Facturacion/ObtenerProformas?${params.toString()}`;
        console.log('📋 URL de consulta completa:', urlCompleta);

        const response = await fetch(urlCompleta, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('📋 Status de respuesta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Respuesta de error:', errorText);
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado completo obtenido:', resultado);

        if (resultado.success && resultado.proformas && resultado.proformas.length > 0) {
            console.log('✅ Proformas encontradas:', resultado.proformas.length);
            
            // Usar funciones existentes de facturacion.js
            if (typeof mostrarProformas === 'function') {
                mostrarProformas(resultado.proformas);
                $('#proformasContent').show();
                console.log('✅ Proformas mostradas correctamente');
            } else {
                console.error('❌ Función mostrarProformas no encontrada');
            }
            
            if (typeof mostrarPaginacionProformas === 'function') {
                mostrarPaginacionProformas(resultado.pagina, resultado.totalPaginas);
            }
        } else {
            console.log('ℹ️ No se encontraron proformas con los filtros aplicados');
            // Mostrar mensaje de vacío
            $('#proformasEmpty').show();
            $('#proformasContent').hide();
        }

    } catch (error) {
        console.error('❌ Error completo aplicando filtros:', error);
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