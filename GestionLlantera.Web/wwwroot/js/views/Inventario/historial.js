// ========================================
// MÓDULO DE HISTORIAL DE INVENTARIOS
// Ubicación: /js/views/Inventario/historial.js
// ========================================

console.log('🚀 Inicializando módulo de historial de inventarios...');

// =====================================
// VARIABLES GLOBALES
// =====================================

let inventariosData = [];
let inventariosFiltrados = [];
let usuarioActual = null;

// =====================================
// INICIALIZACIÓN
// =====================================

$(document).ready(function () {
    console.log('📚 DOM cargado, inicializando historial...');

    try {
        // Obtener información del usuario desde la configuración global
        if (window.userConfig) {
            usuarioActual = {
                id: window.userConfig.userId,
                nombre: window.userConfig.userName,
                roles: window.userConfig.roles || []
            };
            console.log('👤 Usuario actual:', usuarioActual);
        }

        // Inicializar componentes
        configurarEventListeners();
        cargarHistorialInventarios();

        console.log('✅ Módulo de historial inicializado correctamente');

    } catch (error) {
        console.error('❌ Error inicializando módulo de historial:', error);
        mostrarError('Error al inicializar la página');
    }
});

// =====================================
// EVENT LISTENERS
// =====================================

function configurarEventListeners() {
    console.log('🔗 Configurando event listeners para filtros avanzados...');

    // ✅ FILTROS BÁSICOS
    
    // Filtro por estado
    $('#filtroEstado').on('change', function () {
        const estadoSeleccionado = $(this).val();
        console.log('🔍 Filtrando por estado:', estadoSeleccionado);
        filtrarInventarios(estadoSeleccionado);
    });

    // Búsqueda por texto con debounce
    let timeoutBusqueda;
    $('#busquedaTexto').on('input', function () {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            try {
                const texto = String($(this).val() || '');
                console.log('🔍 Evento input - Texto de búsqueda:', texto);
                filtrarInventarios();
            } catch (error) {
                console.error('❌ Error en evento input:', error);
            }
        }, 300);
    });

    // ✅ FILTROS AVANZADOS DE FECHAS
    
    $('#filtroFechaDesde, #filtroFechaHasta').on('change', function () {
        console.log('📅 Filtro de fecha cambiado');
        filtrarInventarios();
    });

    // ✅ FILTRO POR PROGRESO
    
    $('#filtroProgreso').on('change', function () {
        const progreso = $(this).val();
        console.log('📊 Filtrando por progreso:', progreso);
        filtrarInventarios();
    });

    // ✅ FILTROS DE RANGO CON DEBOUNCE
    
    let timeoutRangos;
    $('#filtroProductosMin, #filtroProductosMax').on('input', function () {
        clearTimeout(timeoutRangos);
        timeoutRangos = setTimeout(() => {
            console.log('📦 Filtro de rango productos cambiado');
            filtrarInventarios();
        }, 500);
    });

    // ✅ BOTONES DE CONTROL
    
    // Botón de actualizar
    $('#btnActualizar').on('click', function () {
        console.log('🔄 Recargando historial...');
        cargarHistorialInventarios();
    });

    // Botón limpiar filtros
    $('#btnLimpiarFiltros').on('click', function () {
        console.log('🧹 Limpiando filtros...');
        limpiarTodosLosFiltros();
    });

    // ✅ TOGGLE PARA FILTROS AVANZADOS
    
    $('#btnToggleFiltrosAvanzados').on('click', function () {
        const $filtrosAvanzados = $('#filtrosAvanzadosHistorial');
        const $icono = $(this).find('i');
        
        if ($filtrosAvanzados.is(':visible')) {
            $filtrosAvanzados.slideUp();
            $icono.removeClass('bi-chevron-up').addClass('bi-chevron-down');
            $(this).find('span').text('Mostrar Filtros Avanzados');
        } else {
            $filtrosAvanzados.slideDown();
            $icono.removeClass('bi-chevron-down').addClass('bi-chevron-up');
            $(this).find('span').text('Ocultar Filtros Avanzados');
        }
    });

    // ✅ EVENTOS ADICIONALES
    
    // Paste en búsqueda
    $('#busquedaTexto').on('paste', function () {
        setTimeout(() => {
            try {
                const texto = String($(this).val() || '');
                console.log('🔍 Evento paste - Texto pegado:', texto);
                filtrarInventarios();
            } catch (error) {
                console.error('❌ Error en evento paste:', error);
            }
        }, 100);
    });

    // Keyup como respaldo
    $('#busquedaTexto').on('keyup', debounce(function () {
        try {
            const texto = String($(this).val() || '');
            console.log('🔍 Evento keyup - Texto:', texto);
            filtrarInventarios();
        } catch (error) {
            console.error('❌ Error en evento keyup:', error);
        }
    }, 300));

    console.log('✅ Event listeners de filtros avanzados configurados');
}

// =====================================
// CARGA DE DATOS
// =====================================

async function cargarHistorialInventarios() {
    try {
        console.log('📦 === CARGANDO HISTORIAL DE INVENTARIOS ===');

        if (!usuarioActual?.id) {
            throw new Error('No se pudo obtener la información del usuario');
        }

        // Mostrar indicador de carga
        mostrarCargando(true);

        console.log('📦 Llamando al controlador para obtener inventarios...');
        console.log('📦 Usuario ID:', usuarioActual.id);

        const response = await fetch('/TomaInventario/ObtenerInventariosAsignados', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        console.log('📦 Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en la respuesta:', errorText);
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Datos recibidos:', data);

        if (data.success && data.data) {
            inventariosData = data.data;
            console.log('✅ Inventarios cargados:', inventariosData.length);
            console.log('👤 Usuario ID:', data.usuarioId);
            console.log('🔑 Es Administrador:', data.esAdmin);

            // ✅ DEBUG: Ver la estructura de los inventarios recibidos
            if (inventariosData.length > 0) {
                console.log('🔍 DEBUG - Primer inventario recibido:', inventariosData[0]);
                console.log('🔍 DEBUG - Propiedades disponibles:', Object.keys(inventariosData[0]));
            }

            // Aplicar filtros actuales
            const estadoFiltro = $('#filtroEstado').val();
            filtrarInventarios(estadoFiltro);

            // Actualizar contador inicial
            actualizarContadorInventarios(inventariosData.length);

        } else {
            throw new Error(data.message || 'Error desconocido al cargar inventarios');
        }

    } catch (error) {
        console.error('❌ Error cargando historial:', error);
        mostrarError(`Error al cargar el historial: ${error.message}`);
        mostrarEstadoVacio('Error al cargar inventarios');

    } finally {
        mostrarCargando(false);
    }
}

// =====================================
// SISTEMA DE FILTROS AVANZADOS
// =====================================

// ✅ CONFIGURACIÓN DE FILTROS SIMILAR A INVENTARIO
let filtrosHistorialConfig = {
    activos: {
        texto: '',
        estado: '',
        fechaDesde: '',
        fechaHasta: '',
        progreso: '',
        usuario: '',
        productosMin: null,
        productosMax: null
    },
    estadosDisponibles: ['programado', 'en progreso', 'completado', 'cancelado'],
    usuariosDisponibles: []
};

// ✅ FUNCIÓN PRINCIPAL DE FILTRADO AVANZADO
function filtrarInventarios(estado = '') {
    console.log('🔍 === APLICANDO FILTROS AVANZADOS ===');
    console.log('🔍 Estado seleccionado:', estado);

    let inventariosFiltrados = [...inventariosData];

    // Función segura para obtener valor string
    const obtenerValorSeguro = (obj, propiedades) => {
        for (let prop of propiedades) {
            if (obj && obj.hasOwnProperty(prop) && obj[prop] != null && obj[prop] !== undefined) {
                const valor = String(obj[prop]);
                return valor ? valor.toLowerCase() : '';
            }
        }
        return '';
    };

    // Función segura para obtener valor numérico
    const obtenerValorNumerico = (obj, propiedades) => {
        for (let prop of propiedades) {
            if (obj && obj.hasOwnProperty(prop) && obj[prop] != null && obj[prop] !== undefined) {
                return parseInt(obj[prop]) || 0;
            }
        }
        return 0;
    };

    // ✅ 1. FILTRO POR ESTADO
    const estadoFiltro = estado || $('#filtroEstado').val();
    if (estadoFiltro && estadoFiltro !== 'todos') {
        inventariosFiltrados = inventariosFiltrados.filter(inv => {
            const estadoInventario = obtenerValorSeguro(inv, ['estado', 'Estado', 'estadoInventario', 'EstadoInventario']);
            return estadoInventario === estadoFiltro.toLowerCase();
        });
        console.log('🔍 Después de filtro por estado:', inventariosFiltrados.length);
    }

    // ✅ 2. FILTRO POR TEXTO DE BÚSQUEDA
    const elementoBusqueda = $('#busquedaTexto');
    const textoBusqueda = elementoBusqueda.length > 0 ? elementoBusqueda.val() : '';
    if (textoBusqueda && typeof textoBusqueda === 'string' && textoBusqueda.trim()) {
        const textoBusquedaLower = String(textoBusqueda).toLowerCase().trim();
        console.log('🔍 Aplicando filtro de texto:', textoBusquedaLower);
        
        inventariosFiltrados = inventariosFiltrados.filter(inv => {
            const titulo = obtenerValorSeguro(inv, ['titulo', 'Titulo', 'nombreInventario', 'NombreInventario']);
            const descripcion = obtenerValorSeguro(inv, ['descripcion', 'Descripcion', 'observaciones', 'Observaciones']);
            const estadoInventario = obtenerValorSeguro(inv, ['estado', 'Estado', 'estadoInventario', 'EstadoInventario']);
            const inventarioId = obtenerValorSeguro(inv, ['inventarioProgramadoId', 'InventarioProgramadoId', 'id', 'Id']);

            const cumple = titulo.includes(textoBusquedaLower) || 
                          descripcion.includes(textoBusquedaLower) ||
                          estadoInventario.includes(textoBusquedaLower) ||
                          inventarioId.includes(textoBusquedaLower);

            return cumple;
        });
        console.log('🔍 Después de filtro por texto:', inventariosFiltrados.length);
    }

    // ✅ 3. FILTRO POR RANGO DE FECHAS
    const fechaDesde = $('#filtroFechaDesde').val();
    const fechaHasta = $('#filtroFechaHasta').val();
    
    if (fechaDesde || fechaHasta) {
        inventariosFiltrados = inventariosFiltrados.filter(inv => {
            const fechaInicio = inv.fechaInicio ? new Date(inv.fechaInicio) : null;
            
            if (!fechaInicio) return false;
            
            let cumpleFecha = true;
            
            if (fechaDesde) {
                const fechaDesdeFiltro = new Date(fechaDesde);
                if (fechaInicio < fechaDesdeFiltro) cumpleFecha = false;
            }
            
            if (fechaHasta && cumpleFecha) {
                const fechaHastaFiltro = new Date(fechaHasta);
                fechaHastaFiltro.setHours(23, 59, 59, 999); // Incluir todo el día
                if (fechaInicio > fechaHastaFiltro) cumpleFecha = false;
            }
            
            return cumpleFecha;
        });
        console.log('🔍 Después de filtro por fechas:', inventariosFiltrados.length);
    }

    // ✅ 4. FILTRO POR PROGRESO
    const progresoFiltro = $('#filtroProgreso').val();
    if (progresoFiltro && progresoFiltro !== 'todos') {
        inventariosFiltrados = inventariosFiltrados.filter(inv => {
            const porcentaje = obtenerValorNumerico(inv, ['porcentajeProgreso', 'PorcentajeProgreso']);
            
            switch (progresoFiltro) {
                case 'sin_empezar':
                    return porcentaje === 0;
                case 'en_proceso':
                    return porcentaje > 0 && porcentaje < 100;
                case 'completado':
                    return porcentaje === 100;
                default:
                    return true;
            }
        });
        console.log('🔍 Después de filtro por progreso:', inventariosFiltrados.length);
    }

    // ✅ 5. FILTRO POR RANGO DE PRODUCTOS
    const productosMin = parseInt($('#filtroProductosMin').val()) || null;
    const productosMax = parseInt($('#filtroProductosMax').val()) || null;
    
    if (productosMin !== null || productosMax !== null) {
        inventariosFiltrados = inventariosFiltrados.filter(inv => {
            const totalProductos = obtenerValorNumerico(inv, ['totalProductos', 'TotalProductos']);
            
            let cumpleRango = true;
            
            if (productosMin !== null && totalProductos < productosMin) {
                cumpleRango = false;
            }
            
            if (productosMax !== null && totalProductos > productosMax) {
                cumpleRango = false;
            }
            
            return cumpleRango;
        });
        console.log('🔍 Después de filtro por productos:', inventariosFiltrados.length);
    }

    console.log('🔍 === TOTAL INVENTARIOS FILTRADOS ===:', inventariosFiltrados.length);
    
    // Actualizar indicadores de filtros activos
    actualizarIndicadoresFiltrosActivos();
    
    renderizarInventarios(inventariosFiltrados);
}

// ✅ FUNCIÓN PARA ACTUALIZAR INDICADORES DE FILTROS ACTIVOS
function actualizarIndicadoresFiltrosActivos() {
    const filtrosActivos = [];
    
    // Verificar filtros activos
    const textoBusqueda = $('#busquedaTexto').val();
    if (textoBusqueda && textoBusqueda.trim()) {
        filtrosActivos.push(`🔍 "${textoBusqueda.trim()}"`);
    }
    
    const estadoFiltro = $('#filtroEstado').val();
    if (estadoFiltro && estadoFiltro !== 'todos') {
        const estadosTexto = {
            'programado': '📅 Programado',
            'en progreso': '⚙️ En Progreso', 
            'completado': '✅ Completado',
            'cancelado': '❌ Cancelado'
        };
        filtrosActivos.push(estadosTexto[estadoFiltro] || estadoFiltro);
    }
    
    const fechaDesde = $('#filtroFechaDesde').val();
    const fechaHasta = $('#filtroFechaHasta').val();
    if (fechaDesde || fechaHasta) {
        const desde = fechaDesde ? new Date(fechaDesde).toLocaleDateString() : '∞';
        const hasta = fechaHasta ? new Date(fechaHasta).toLocaleDateString() : '∞';
        filtrosActivos.push(`📅 ${desde} - ${hasta}`);
    }
    
    const progresoFiltro = $('#filtroProgreso').val();
    if (progresoFiltro && progresoFiltro !== 'todos') {
        const progresoTexto = {
            'sin_empezar': '📊 0%',
            'en_proceso': '📊 En proceso',
            'completado': '📊 100%'
        };
        filtrosActivos.push(progresoTexto[progresoFiltro] || progresoFiltro);
    }
    
    const productosMin = $('#filtroProductosMin').val();
    const productosMax = $('#filtroProductosMax').val();
    if (productosMin || productosMax) {
        const min = productosMin || '0';
        const max = productosMax || '∞';
        filtrosActivos.push(`📦 ${min} - ${max} productos`);
    }
    
    // Actualizar UI de filtros activos
    const $contadorFiltros = $('#contadorFiltrosActivos');
    const $btnLimpiar = $('#btnLimpiarFiltros');
    const $contenedorTags = $('#tagsFilttrosActivos');
    
    if (filtrosActivos.length > 0) {
        if ($contadorFiltros.length > 0) {
            $contadorFiltros.text(`${filtrosActivos.length} activos`).show();
        }
        
        if ($btnLimpiar.length > 0) {
            $btnLimpiar.prop('disabled', false).removeClass('btn-outline-secondary').addClass('btn-outline-danger');
        }
        
        if ($contenedorTags.length > 0) {
            $contenedorTags.empty();
            filtrosActivos.forEach((filtro, index) => {
                const $tag = $('<span class="badge bg-primary me-1 mb-1"></span>').text(filtro);
                setTimeout(() => {
                    $contenedorTags.append($tag);
                }, index * 50);
            });
            $contenedorTags.parent().show();
        }
    } else {
        if ($contadorFiltros.length > 0) $contadorFiltros.hide();
        if ($btnLimpiar.length > 0) {
            $btnLimpiar.prop('disabled', true).removeClass('btn-outline-danger').addClass('btn-outline-secondary');
        }
        if ($contenedorTags.length > 0) $contenedorTags.parent().hide();
    }
}

// ✅ FUNCIÓN PARA LIMPIAR TODOS LOS FILTROS
function limpiarTodosLosFiltros() {
    console.log('🧹 Limpiando todos los filtros del historial');
    
    // Limpiar inputs
    $('#busquedaTexto').val('');
    $('#filtroEstado').val('todos');
    $('#filtroFechaDesde').val('');
    $('#filtroFechaHasta').val('');
    $('#filtroProgreso').val('todos');
    $('#filtroProductosMin').val('');
    $('#filtroProductosMax').val('');
    
    // Resetear configuración
    filtrosHistorialConfig.activos = {
        texto: '',
        estado: '',
        fechaDesde: '',
        fechaHasta: '',
        progreso: '',
        usuario: '',
        productosMin: null,
        productosMax: null
    };
    
    // Aplicar filtros (mostrará todos)
    filtrarInventarios();
    
    console.log('✅ Filtros del historial limpiados');
}

// ✅ FUNCIÓN CON DEBOUNCE PARA FILTROS DE TEXTO Y RANGOS
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}





// =====================================
// RENDERIZADO DE INVENTARIOS
// =====================================

function renderizarInventarios(inventarios) {
    console.log('🎨 Renderizando inventarios:', inventarios.length);

    const $contenedor = $('#inventariosContainer');

    if (!inventarios || inventarios.length === 0) {
        mostrarEstadoVacio();
        actualizarContadorInventarios(0);
        return;
    }

    let html = '<div class="inventarios-grid">';

    inventarios.forEach(inventario => {
        html += generarTarjetaInventario(inventario);
    });

    html += '</div>';

    $contenedor.html(html);
    $('#estadoVacio').hide();

    // Actualizar contador con inventarios visibles
    actualizarContadorInventarios(inventarios.length);

    console.log('✅ Inventarios renderizados correctamente');
}

function generarTarjetaInventario(inventario) {
    // Función segura para obtener valor
    const obtenerValor = (obj, propiedades, valorPorDefecto = '') => {
        for (let prop of propiedades) {
            if (obj && obj.hasOwnProperty(prop) && obj[prop] != null) {
                return obj[prop];
            }
        }
        return valorPorDefecto;
    };

    const porcentajeProgreso = obtenerValor(inventario, ['porcentajeProgreso', 'PorcentajeProgreso'], 0);
    const estado = obtenerValor(inventario, ['estado', 'Estado', 'estadoInventario', 'EstadoInventario'], 'Sin estado');
    const titulo = obtenerValor(inventario, ['titulo', 'Titulo', 'nombreInventario', 'NombreInventario'], 'Sin título');
    const fechaInicio = obtenerValor(inventario, ['fechaInicio', 'FechaInicio']);
    const fechaFin = obtenerValor(inventario, ['fechaFin', 'FechaFin']);
    const totalProductos = obtenerValor(inventario, ['totalProductos', 'TotalProductos'], 0);
    const productosContados = obtenerValor(inventario, ['productosContados', 'ProductosContados'], 0);
    const inventarioId = obtenerValor(inventario, ['inventarioProgramadoId', 'InventarioProgramadoId', 'id', 'Id'], '');

    const estadoClass = obtenerClaseEstado(estado);
    const fechaFormato = fechaInicio ? formatearFecha(fechaInicio) : 'Sin fecha';
    const fechaFinFormato = fechaFin ? formatearFecha(fechaFin) : 'En progreso';

    return `
        <div class="inventario-card">
            <div class="inventario-header">
                <div class="inventario-header-info">
                    <h3 class="inventario-titulo">${titulo}</h3>
                    <span class="inventario-id">ID: ${inventarioId}</span>
                </div>
                <span class="estado-badge ${estadoClass}">
                    ${estado}
                </span>
            </div>

            <div class="inventario-body">
                <div class="inventario-fechas">
                    <i class="fas fa-calendar me-2"></i>
                    <span>${fechaFormato}</span>
                    ${fechaFin ? `<i class="fas fa-arrow-right mx-2"></i><span>${fechaFinFormato}</span>` : ''}
                </div>

                <div class="inventario-info">
                    <div class="info-item">
                        <span class="info-label">Total Productos</span>
                        <span class="info-value">${totalProductos}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Contados</span>
                        <span class="info-value">${productosContados}</span>
                    </div>
                </div>

                ${generarBarraProgreso(porcentajeProgreso)}

                <div class="inventario-acciones">
                    ${generarBotonesAccion(inventario)}
                </div>
            </div>
        </div>
    `;
}

function generarBarraProgreso(porcentaje) {
    const porcentajeRedondeado = Math.round(porcentaje);
    const colorBarra = porcentaje < 30 ? 'bg-danger' :
        porcentaje < 70 ? 'bg-warning' : 'bg-success';

    return `
        <div class="progreso-container">
            <div class="progreso-label">
                <span class="progreso-texto">Progreso</span>
                <span class="progreso-porcentaje">${porcentajeRedondeado}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar ${colorBarra}" role="progressbar" 
                     style="width: ${porcentaje}%" 
                     aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100">
                </div>
            </div>
        </div>
    `;
}

function generarBotonesAccion(inventario) {
    // Función segura para obtener valor
    const obtenerValor = (obj, propiedades, valorPorDefecto = '') => {
        for (let prop of propiedades) {
            if (obj && obj.hasOwnProperty(prop) && obj[prop] != null) {
                return obj[prop];
            }
        }
        return valorPorDefecto;
    };

    const estado = String(obtenerValor(inventario, ['estado', 'Estado', 'estadoInventario', 'EstadoInventario'], 'sin estado')).toLowerCase();
    const inventarioId = obtenerValor(inventario, ['inventarioProgramadoId', 'InventarioProgramadoId', 'id', 'Id'], '');
    const titulo = obtenerValor(inventario, ['titulo', 'Titulo', 'nombreInventario', 'NombreInventario'], 'Inventario');

    if (estado === 'en progreso') {
        return `
            <div class="acciones-container">
                <a href="/TomaInventario/Ejecutar/${inventarioId}" 
                   class="btn-accion btn-continuar">
                    <i class="fas fa-play me-1"></i>
                    Continuar
                </a>
            </div>
        `;
    } else if (estado === 'completado') {
        return `
            <div class="acciones-container">
                <div class="acciones-principales">
                    <a href="/TomaInventario/Ejecutar/${inventarioId}" 
                       class="btn-accion btn-ver">
                        <i class="fas fa-eye me-1"></i>
                        Ver Detalle
                    </a>
                </div>
                <div class="acciones-descarga">
                    <button onclick="descargarReporteExcel(${inventarioId}, '${titulo}')" 
                            class="btn-descarga btn-excel" 
                            title="Descargar Excel">
                        <i class="fas fa-file-excel me-1"></i>
                        Excel
                    </button>
                    <button onclick="descargarReportePdf(${inventarioId}, '${titulo}')" 
                            class="btn-descarga btn-pdf" 
                            title="Descargar PDF">
                        <i class="fas fa-file-pdf me-1"></i>
                        PDF
                    </button>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="acciones-container">
                <button class="btn-accion btn-deshabilitado" disabled>
                    <i class="fas fa-lock me-1"></i>
                    ${estado === 'cancelado' ? 'Cancelado' : 'No Disponible'}
                </button>
            </div>
        `;
    }
}

// =====================================
// UTILIDADES
// =====================================

function obtenerClaseEstado(estado) {
    if (!estado || typeof estado !== 'string') {
        return 'estado-programado';
    }

    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
        case 'programado': return 'estado-programado';
        case 'en progreso': return 'estado-progreso';
        case 'completado': return 'estado-completado';
        case 'cancelado': return 'estado-cancelado';
        default: return 'estado-programado';
    }
}

function formatearFecha(fechaString) {
    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function mostrarCargando(mostrar) {
    if (mostrar) {
        $('#loadingHistorial').show();
        $('#inventariosContainer').hide();
        $('#estadoVacio').hide();
    } else {
        $('#loadingHistorial').hide();
        $('#inventariosContainer').show();
    }
}

function mostrarEstadoVacio(mensaje = null) {
    const mensajeDefault = 'No tienes inventarios asignados';
    const mensajeFinal = mensaje || mensajeDefault;

    $('#estadoVacio .mensaje-vacio').text(mensajeFinal);
    $('#estadoVacio').show();
    $('#inventariosContainer').hide();
}

function actualizarContadorInventarios(cantidad) {
    try {
        const $contador = $('#contadorInventarios');
        const $label = $('#labelInventarios');

        if ($contador.length > 0) {
            $contador.text(cantidad);

            // Actualizar el texto del label según la cantidad
            if ($label.length > 0) {
                const textoLabel = cantidad === 1 ? 'Inventario' : 'Inventarios';
                const textoCompleto = cantidad === inventariosData.length ?
                    textoLabel :
                    `${textoLabel} (${inventariosData.length} total)`;
                $label.text(textoCompleto);
            }

            console.log('✅ Contador de inventarios actualizado:', cantidad);
        }
    } catch (error) {
        console.error('❌ Error actualizando contador de inventarios:', error);
    }
}

function mostrarError(mensaje) {
    console.error('❌ Error mostrado al usuario:', mensaje);

    // Si existe Swal (SweetAlert2), usarlo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje,
            confirmButtonText: 'Entendido'
        });
    } else {
        // Fallback a alert nativo
        alert(`Error: ${mensaje}`);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =====================================
// EXPOSICIÓN GLOBAL PARA DEBUGGING
// =====================================

if (window.DEBUG) {
    window.HistorialInventarios = {
        inventariosData,
        cargarHistorialInventarios,
        filtrarInventarios,
        renderizarInventarios
    };
}

// =====================================
// FUNCIONES DE DESCARGA (TEMPORALES)
// =====================================

/**
 * ✅ Descarga el reporte Excel del inventario
 */
async function descargarReporteExcel(inventarioId, titulo) {
    try {
        console.log('📊 Iniciando descarga Excel para inventario:', inventarioId);

        // Mostrar indicador de carga
        Swal.fire({
            title: 'Generando Excel...',
            html: `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
                <p class="mt-3 text-muted">Preparando reporte de "${titulo}"</p>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Realizar la petición
        const response = await fetch(`/Reportes/inventario/${inventarioId}/excel`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Obtener el blob y descargarlo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${inventarioId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            html: `
                <div class="text-center">
                    <i class="bi bi-file-earmark-excel text-success display-1"></i>
                    <p class="mt-3">El reporte Excel de <strong>"${titulo}"</strong> se ha descargado correctamente.</p>
                </div>
            `,
            timer: 3000,
            timerProgressBar: true,
            confirmButtonColor: '#28a745'
        });

        console.log('✅ Descarga Excel completada exitosamente');

    } catch (error) {
        console.error('❌ Error descargando Excel:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al descargar Excel',
            html: `
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle text-danger display-1"></i>
                    <p class="mt-3">${error.message || 'No se pudo descargar el archivo Excel'}</p>
                    <small class="text-muted">Inventario: ${titulo} (ID: ${inventarioId})</small>
                </div>
            `,
            confirmButtonColor: '#d33'
        });
    }
}

/**
 * ✅ Descarga el reporte PDF del inventario
 */
async function descargarReportePdf(inventarioId, titulo) {
    try {
        console.log('📋 Iniciando descarga PDF para inventario:', inventarioId);

        // Mostrar indicador de carga
        Swal.fire({
            title: 'Generando PDF...',
            html: `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
                <p class="mt-3 text-muted">Preparando reporte de "${titulo}"</p>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Realizar la petición
        const response = await fetch(`/Reportes/inventario/${inventarioId}/pdf`, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Obtener el blob y descargarlo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${inventarioId}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            html: `
                <div class="text-center">
                    <i class="bi bi-file-earmark-pdf text-danger display-1"></i>
                    <p class="mt-3">El reporte PDF de <strong>"${titulo}"</strong> se ha descargado correctamente.</p>
                </div>
            `,
            timer: 3000,
            timerProgressBar: true,
            confirmButtonColor: '#d32f2f'
        });

        console.log('✅ Descarga PDF completada exitosamente');

    } catch (error) {
        console.error('❌ Error descargando PDF:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al descargar PDF',
            html: `
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle text-danger display-1"></i>
                    <p class="mt-3">${error.message || 'No se pudo descargar el archivo PDF'}</p>
                    <small class="text-muted">Inventario: ${titulo} (ID: ${inventarioId})</small>
                </div>
            `,
            confirmButtonColor: '#d33'
        });
    }
}

console.log('✅ Módulo de historial de inventarios cargado completamente');