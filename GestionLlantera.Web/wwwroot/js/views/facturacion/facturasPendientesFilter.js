// ===== MÓDULO DE FILTROS PARA FACTURAS PENDIENTES (FRONTEND ONLY) =====

let todasLasFacturasPendientes = []; // Array para almacenar todas las facturas pendientes
let facturasPendientesFiltradas = []; // Array para facturas filtradas
let paginaActualFacturas = 1;
let facturasPorPagina = 20;
let filtrosBusquedaFacturas = {
    texto: '',
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: ''
};

/**
 * Inicializar filtros de facturas pendientes
 */
function inicializarFiltrosFacturasPendientes() {
    console.log('🔍 === INICIALIZANDO FILTROS DE FACTURAS PENDIENTES (FRONTEND) ===');

    // Verificar que jQuery y Bootstrap Modals estén disponibles
    if (typeof $ === 'undefined' || typeof bootstrap === 'undefined') {
        console.error('❌ jQuery o Bootstrap Modals no están disponibles');
        return;
    }

    // Configurar eventos usando delegación de eventos para asegurar que funcionen
    configurarEventosFacturasPendientes();

    // Cargar todas las facturas pendientes inicialmente
    cargarTodasLasFacturasPendientes();

    console.log('✅ Filtros de facturas pendientes inicializados correctamente');
}

/**
 * Configurar eventos para facturas pendientes usando delegación
 */
function configurarEventosFacturasPendientes() {
    console.log('🔍 Configurando eventos de filtrado para facturas pendientes...');

    // Limpiar eventos anteriores para evitar duplicación
    $(document).off('.facturasPendientesFilter');

    // Configurar eventos de búsqueda para ambas versiones (desktop y móvil)
    $(document).on('input.facturasPendientesFilter keyup.facturasPendientesFilter', '#facturasPendientesModal #busquedaFacturasPendientes, #facturasPendientesModal #busquedaFacturasPendientesMobile', function() {
        const termino = $(this).val().trim();
        console.log('🔍 Término de búsqueda facturas:', termino);

        // Sincronizar el valor en ambos campos
        $('#busquedaFacturasPendientes, #busquedaFacturasPendientesMobile').val(termino);

        filtrosBusquedaFacturas.texto = termino;
        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar eventos de cambio de estado para ambas versiones
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesModal #estadoFacturasPendientes, #facturasPendientesModal #estadoFacturasPendientesMobile', function() {
        const estado = $(this).val();
        console.log('🔍 Estado de facturas seleccionado:', estado);

        // Sincronizar el valor en ambos campos
        $('#estadoFacturasPendientes, #estadoFacturasPendientesMobile').val(estado);

        filtrosBusquedaFacturas.estado = estado;
        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar filtros de fecha desde para ambas versiones
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesModal #fechaDesdeFacturas, #facturasPendientesModal #fechaDesdeFacturasMobile', function() {
        const fecha = $(this).val();
        filtrosBusquedaFacturas.fechaDesde = fecha;
        console.log('🔍 Fecha desde:', filtrosBusquedaFacturas.fechaDesde);

        // Sincronizar el valor en ambos campos
        $('#fechaDesdeFacturas, #fechaDesdeFacturasMobile').val(fecha);

        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar filtros de fecha hasta para ambas versiones
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesModal #fechaHastaFacturas, #facturasPendientesModal #fechaHastaFacturasMobile', function() {
        const fecha = $(this).val();
        filtrosBusquedaFacturas.fechaHasta = fecha;
        console.log('🔍 Fecha hasta:', filtrosBusquedaFacturas.fechaHasta);

        // Sincronizar el valor en ambos campos
        $('#fechaHastaFacturas, #fechaHastaFacturasMobile').val(fecha);

        aplicarFiltrosLocalmenteFacturas();
    });

    // Configurar botones limpiar para ambas versiones
    $(document).on('click.facturasPendientesFilter', '#facturasPendientesModal #btnLimpiarFiltrosFacturas, #facturasPendientesModal #btnLimpiarFiltrosFacturasMobile', function(e) {
        e.preventDefault();
        console.log('🔍 Limpiando filtros de facturas...');
        limpiarFiltrosFacturas();
    });

    // Configurar cambio de productos por página
    $(document).on('change.facturasPendientesFilter', '#facturasPendientesPorPagina', function() {
        facturasPorPagina = parseInt($(this).val());
        paginaActualFacturas = 1;
        console.log('📄 Cambiando facturas por página a:', facturasPorPagina);
        mostrarFacturasPendientesPaginadas();
    });

    console.log('✅ Eventos de filtros de facturas configurados con delegación');
}

/**
 * Cargar todas las facturas pendientes desde el servidor una sola vez
 */
async function cargarTodasLasFacturasPendientes() {
    try {
        console.log('📋 === CARGANDO TODAS LAS FACTURAS PENDIENTES ===');

        // Mostrar loading
        $('#facturasPendientesLoading').show();
        $('#facturasPendientesContent').hide();
        $('#facturasPendientesEmpty').hide();

        // Realizar petición para obtener TODAS las facturas pendientes
        // Se usa un número grande (1000) para intentar obtener todas de una vez
        const response = await fetch('/Facturacion/ObtenerFacturas?tamano=1000', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Asegurar que se envíen cookies/credenciales
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📋 Respuesta del servidor facturas:', resultado);

        if (resultado.success) {
            // Extraer facturas del resultado, intentando diferentes estructuras comunes
            let facturas = null;
            if (resultado.facturas && Array.isArray(resultado.facturas)) {
                facturas = resultado.facturas;
            } else if (resultado.data && Array.isArray(resultado.data)) {
                facturas = resultado.data;
            } else if (Array.isArray(resultado)) { // Si la respuesta es directamente un array
                facturas = resultado;
            }

            if (facturas && facturas.length > 0) {
                console.log('✅ Facturas pendientes cargadas:', facturas.length);
                todasLasFacturasPendientes = facturas;

                // Aplicar filtros iniciales (mostrar todas)
                aplicarFiltrosLocalmenteFacturas();
            } else {
                console.log('ℹ️ No se encontraron facturas pendientes en la respuesta');
                todasLasFacturasPendientes = [];
                mostrarFacturasPendientesVacias();
            }
        } else {
            console.log('❌ Error del servidor:', resultado.message);
            todasLasFacturasPendientes = []; // Asegurar que el array esté vacío en caso de error
            mostrarFacturasPendientesVacias();
            // Mostrar toast si la función está disponible
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', resultado.message || 'Error al cargar facturas pendientes', 'danger');
            }
        }

    } catch (error) {
        console.error('❌ Error cargando facturas pendientes:', error);
        todasLasFacturasPendientes = []; // Asegurar que el array esté vacío en caso de error
        mostrarFacturasPendientesVacias();
        // Mostrar toast si la función está disponible
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al cargar facturas pendientes: ' + error.message, 'danger');
        }
    } finally {
        // Ocultar loading una vez que la carga ha finalizado (con éxito o error)
        $('#facturasPendientesLoading').hide();
    }
}

/**
 * Aplicar filtros localmente (en el frontend) a las facturas pendientes
 */
function aplicarFiltrosLocalmenteFacturas() {
    console.log('🔍 === APLICANDO FILTROS LOCALMENTE A FACTURAS ===');
    console.log('🔍 Total facturas disponibles:', todasLasFacturasPendientes.length);
    console.log('🔍 Filtros aplicados:', filtrosBusquedaFacturas);

    // Si no hay facturas cargadas, mostrar mensaje vacío
    if (todasLasFacturasPendientes.length === 0) {
        mostrarFacturasPendientesVacias();
        return;
    }

    // Filtrar facturas según los criterios definidos en filtrosBusquedaFacturas
    facturasPendientesFiltradas = todasLasFacturasPendientes.filter(factura => {
        let cumpleFiltros = true;

        // Filtro por texto (buscar en número, cliente, usuario, email)
        if (filtrosBusquedaFacturas.texto && filtrosBusquedaFacturas.texto.length > 0) {
            const textoBusqueda = filtrosBusquedaFacturas.texto.toLowerCase();
            const textoFactura = [
                factura.numeroFactura || '',
                factura.nombreCliente || factura.clienteNombre || '',
                factura.emailCliente || factura.email || '',
                factura.usuarioCreador || factura.nombreUsuario || ''
            ].join(' ').toLowerCase(); // Unir todos los campos de texto relevantes

            if (!textoFactura.includes(textoBusqueda)) {
                cumpleFiltros = false; // No cumple si el texto de búsqueda no está presente
            }
        }

        // Filtro por estado
        if (cumpleFiltros && filtrosBusquedaFacturas.estado && filtrosBusquedaFacturas.estado !== 'todos') {
            // Comparar el estado de la factura con el filtro seleccionado
            if (factura.estado !== filtrosBusquedaFacturas.estado) {
                cumpleFiltros = false; // No cumple si el estado no coincide
            }
        }

        // Filtro por fecha desde
        if (cumpleFiltros && filtrosBusquedaFacturas.fechaDesde) {
            // Comparar la fecha de la factura con la fecha de inicio del filtro
            const fechaFactura = new Date(factura.fechaFactura || factura.fechaCreacion);
            const fechaDesde = new Date(filtrosBusquedaFacturas.fechaDesde);
            if (fechaFactura < fechaDesde) {
                cumpleFiltros = false; // No cumple si la factura es anterior a la fecha desde
            }
        }

        // Filtro por fecha hasta
        if (cumpleFiltros && filtrosBusquedaFacturas.fechaHasta) {
            // Comparar la fecha de la factura con la fecha de fin del filtro
            const fechaFactura = new Date(factura.fechaFactura || factura.fechaCreacion);
            const fechaHasta = new Date(filtrosBusquedaFacturas.fechaHasta);
            fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día hasta el final
            if (fechaFactura > fechaHasta) {
                cumpleFiltros = false; // No cumple si la factura es posterior a la fecha hasta
            }
        }

        return cumpleFiltros; // Devuelve true si la factura cumple todos los filtros
    });

    console.log('🔍 Facturas filtradas:', facturasPendientesFiltradas.length);

    // Resetear paginación a la primera página después de aplicar filtros
    paginaActualFacturas = 1;

    // Mostrar los resultados paginados
    mostrarFacturasPendientesPaginadas();
}

/**
 * Mostrar facturas pendientes paginadas en la tabla
 */
function mostrarFacturasPendientesPaginadas() {
    console.log('📋 === MOSTRANDO FACTURAS PENDIENTES PAGINADAS ===');

    // Determinar qué lista de facturas mostrar: las filtradas o todas si no hay filtros aplicados
    const facturasAMostrar = facturasPendientesFiltradas.length > 0 ? facturasPendientesFiltradas : todasLasFacturasPendientes;

    // Si no hay facturas para mostrar, mostrar el mensaje de vacío
    if (!facturasAMostrar || facturasAMostrar.length === 0) {
        mostrarFacturasPendientesVacias();
        $('#contadorResultadosFacturas').remove(); // Limpiar el contador si no hay resultados
        return;
    }

    console.log('📋 Total facturas a paginar:', facturasAMostrar.length);
    console.log('📋 Facturas por página:', facturasPorPagina);
    console.log('📋 Página actual:', paginaActualFacturas);

    // Calcular datos de paginación
    const totalPaginas = Math.ceil(facturasAMostrar.length / facturasPorPagina);
    const inicio = (paginaActualFacturas - 1) * facturasPorPagina;
    const fin = inicio + facturasPorPagina;
    const facturasPagina = facturasAMostrar.slice(inicio, fin); // Obtener las facturas para la página actual

    console.log('📋 Facturas en esta página:', facturasPagina.length);

    // Mostrar facturas de la página actual en la tabla
    const tbody = $('#facturasPendientesTableBody');
    tbody.empty(); // Limpiar el cuerpo de la tabla antes de agregar nuevas filas

    facturasPagina.forEach(factura => {
        const fila = crearFilaFacturaPendiente(factura); // Crear la fila HTML para cada factura
        tbody.append(fila); // Agregar la fila al cuerpo de la tabla
    });

    // Volver a configurar eventos para los botones recién creados
    configurarEventosBotonesFacturas();

    // Mostrar el contenido de la tabla y ocultar el mensaje de vacío
    $('#facturasPendientesContent').show();
    $('#facturasPendientesEmpty').hide();

    // Actualizar el contador de resultados (e.g., "Mostrando 1-20 de 150 facturas")
    actualizarContadorResultadosFacturas(facturasAMostrar.length, todasLasFacturasPendientes.length);

    // Mostrar la paginación si hay más de una página
    if (totalPaginas > 1) {
        mostrarPaginacionFacturas(paginaActualFacturas, totalPaginas);
    } else {
        $('#paginacionFacturas').hide(); // Ocultar paginación si solo hay una página
    }

    console.log('✅ Facturas pendientes mostradas en tabla');
}

/**
 * Mostrar facturas pendientes en la tabla (función de utilidad, puede ser reemplazada por crearFilaFacturaPendiente)
 * Esta función parece ser redundante si crearFilaFacturaPendiente ya se encarga de generar el HTML.
 * Sin embargo, se mantiene por si hay un uso específico no cubierto.
 */
function mostrarFacturasPendientesEnTabla(facturas) {
    console.log('📋 === MOSTRANDO FACTURAS PENDIENTES EN TABLA (función auxiliar) ===');
    console.log('📋 Facturas a mostrar:', facturas.length);

    const tbody = $('#facturasPendientesTableBody');
    if (tbody.length === 0) {
        console.error('❌ No se encontró el tbody de facturas pendientes');
        return;
    }

    tbody.empty(); // Limpiar el cuerpo de la tabla

    facturas.forEach(factura => {
        const fecha = new Date(factura.fechaFactura || factura.fechaCreacion).toLocaleDateString('es-CR');
        let estadoBadge = '';

        // Asignar badge según el estado de la factura
        switch (factura.estado) {
            case 'Pendiente':
                estadoBadge = '<span class="badge bg-warning text-dark">Pendiente</span>';
                break;
            case 'Pagada':
                estadoBadge = '<span class="badge bg-success">Pagada</span>';
                break;
            case 'Anulada':
                estadoBadge = '<span class="badge bg-danger">Anulada</span>';
                break;
            default:
                estadoBadge = `<span class="badge bg-secondary">${factura.estado || 'Sin Estado'}</span>`;
        }

        // ✅ ESCAPAR DATOS DE LA FACTURA PENDIENTE (igual que proformas)
        // Se usa JSON.stringify para obtener una representación segura del objeto factura
        // y luego se escapan las comillas dobles para poder usarla como atributo data-
        const facturaEscapada = JSON.stringify(factura).replace(/"/g, '&quot;');

        const fila = `
            <tr data-factura-id="${factura.facturaId || factura.id}">
                <td>
                    <strong>${factura.numeroFactura || 'N/A'}</strong><br>
                    <small class="text-muted small">${factura.tipoDocumento || 'Factura'}</small>
                </td>
                <td>
                    <strong>${factura.nombreCliente || factura.clienteNombre || 'Cliente General'}</strong><br>
                    <small class="text-muted small">${factura.emailCliente || factura.email || ''}</small>
                </td>
                <td>
                    <strong>${fecha}</strong><br>
                    <small class="text-muted small">Por: ${factura.usuarioCreador || factura.nombreUsuario || 'Sistema'}</small>
                </td>
                <td>
                    <strong class="text-success">₡${Number(factura.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td>${estadoBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info" title="Ver detalles" data-factura-id="${factura.facturaId || factura.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" title="Imprimir" data-factura-id="${factura.facturaId || factura.id}">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${factura.estado === 'Pendiente' ? `
                        <button type="button" class="btn btn-outline-success" title="Procesar Factura" data-factura-escapada="${facturaEscapada}">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        tbody.append(fila);
    });

    // Configurar eventos para los botones de las filas recién añadidas
    configurarEventosBotonesFacturas();

    console.log('✅ Facturas pendientes mostradas en tabla');
}

/**
 * Mostrar paginación de la tabla de facturas pendientes
 * @param {number} paginaActualParam - La página actual.
 * @param {number} totalPaginas - El número total de páginas.
 */
function mostrarPaginacionFacturas(paginaActualParam, totalPaginas) {
    console.log('📄 === MOSTRANDO PAGINACIÓN DE FACTURAS ===');
    console.log('📄 Página actual:', paginaActualParam, 'Total páginas:', totalPaginas);

    const paginacion = $('#paginacionFacturas');
    if (paginacion.length === 0) {
        console.error('❌ No se encontró el contenedor de paginación');
        return;
    }

    // Ocultar la paginación si solo hay una página o menos
    if (totalPaginas <= 1) {
        paginacion.hide();
        return;
    }

    let html = '<nav aria-label="Paginación de facturas pendientes"><ul class="pagination justify-content-center mb-0">';

    // Botón anterior
    if (paginaActualParam > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${paginaActualParam - 1})" aria-label="Anterior">
                        <i class="bi bi-chevron-left"></i> Anterior
                    </a>
                </li>`;
    } else {
        // Si es la primera página, el botón anterior está deshabilitado
        html += `<li class="page-item disabled">
                    <span class="page-link">
                        <i class="bi bi-chevron-left"></i> Anterior
                    </span>
                </li>`;
    }

    // Páginas (mostrar máximo 5 páginas alrededor de la actual)
    const iniciarPagina = Math.max(1, paginaActualParam - 2);
    const finalizarPagina = Math.min(totalPaginas, iniciarPagina + 4);

    // Mostrar primera página si no está en el rango visible
    if (iniciarPagina > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(1)">1</a>
                </li>`;
        // Si hay un salto grande, mostrar puntos suspensivos
        if (iniciarPagina > 2) {
            html += `<li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>`;
        }
    }

    // Mostrar las páginas dentro del rango calculado
    for (let i = iniciarPagina; i <= finalizarPagina; i++) {
        if (i === paginaActualParam) {
            // Página actual destacada
            html += `<li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>`;
        } else {
            // Páginas no activas con enlace
            html += `<li class="page-item">
                        <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${i})">${i}</a>
                    </li>`;
        }
    }

    // Mostrar última página si no está en el rango visible
    if (finalizarPagina < totalPaginas) {
        // Si hay un salto grande, mostrar puntos suspensivos
        if (finalizarPagina < totalPaginas - 1) {
            html += `<li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>`;
        }
        // Enlace a la última página
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${totalPaginas})">${totalPaginas}</a>
                </li>`;
    }

    // Botón siguiente
    if (paginaActualParam < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaFacturas(${paginaActualParam + 1})" aria-label="Siguiente">
                        Siguiente <i class="bi bi-chevron-right"></i>
                    </a>
                </li>`;
    } else {
        // Si es la última página, el botón siguiente está deshabilitado
        html += `<li class="page-item disabled">
                    <span class="page-link">
                        Siguiente <i class="bi bi-chevron-right"></i>
                    </span>
                </li>`;
    }

    html += '</ul></nav>';

    paginacion.html(html).show(); // Insertar el HTML de paginación y mostrarlo
}

/**
 * Mostrar mensaje cuando no hay facturas pendientes ni resultados de búsqueda
 */
function mostrarFacturasPendientesVacias() {
    console.log('ℹ️ Mostrando mensaje de facturas pendientes vacías o sin resultados');
    $('#facturasPendientesEmpty').show(); // Mostrar el contenedor con el mensaje
    $('#facturasPendientesContent').hide(); // Ocultar el contenido de la tabla
    $('#paginacionFacturas').hide(); // Ocultar la paginación
}

/**
 * Limpiar todos los filtros aplicados y resetear la vista
 */
function limpiarFiltrosFacturas() {
    console.log('🧹 === LIMPIANDO FILTROS DE FACTURAS ===');

    // Resetear el objeto de filtros a sus valores por defecto
    filtrosBusquedaFacturas = {
        texto: '',
        estado: 'todos',
        fechaDesde: '',
        fechaHasta: ''
    };

    // Limpiar los campos del formulario en la interfaz de usuario (ambas versiones)
    $('#facturasPendientesModal #busquedaFacturasPendientes, #facturasPendientesModal #busquedaFacturasPendientesMobile').val('');
    $('#facturasPendientesModal #estadoFacturasPendientes, #facturasPendientesModal #estadoFacturasPendientesMobile').val('todos');
    $('#facturasPendientesModal #fechaDesdeFacturas, #facturasPendientesModal #fechaDesdeFacturasMobile').val('');
    $('#facturasPendientesModal #fechaHastaFacturas, #facturasPendientesModal #fechaHastaFacturasMobile').val('');

    // Resetear la página actual a la primera
    paginaActualFacturas = 1;

    // Volver a aplicar los filtros (que ahora estarán vacíos, mostrando todas las facturas)
    aplicarFiltrosLocalmenteFacturas();

    console.log('✅ Filtros de facturas limpiados y vista reseteada');
}

/**
 * Cambiar la página actual de la tabla de facturas y actualizar la vista
 * @param {number} nuevaPagina - El número de la nueva página a mostrar.
 */
function cambiarPaginaFacturas(nuevaPagina) {
    console.log('📄 === CAMBIANDO PÁGINA DE FACTURAS ===');
    console.log('📄 Nueva página:', nuevaPagina);

    // Validar que la nueva página sea un número positivo
    if (nuevaPagina > 0) {
        paginaActualFacturas = nuevaPagina; // Actualizar la página actual
        mostrarFacturasPendientesPaginadas(); // Mostrar las facturas de la nueva página
    }
}

/**
 * Recargar todas las facturas pendientes desde el servidor.
 * Útil después de realizar una acción que modifica el estado de las facturas (ej. procesar una).
 */
function recargarFacturasPendientes() {
    console.log('🔄 Recargando facturas pendientes...');
    // Vuelve a llamar a la función que carga los datos del servidor
    cargarTodasLasFacturasPendientes();
}

/**
 * Configurar eventos para los botones de acción en cada fila de la tabla de facturas pendientes
 */
function configurarEventosBotonesFacturas() {
    console.log('🔧 Configurando eventos de botones de facturas...');

    // Limpiar eventos anteriores para evitar duplicación (importante al redibujar la tabla)
    $('.btn-outline-info[data-factura-id]').off('click.facturaVer'); // Evento para ver detalles
    $('.btn-outline-secondary[data-factura-id]').off('click.facturaImprimir'); // Evento para imprimir
    $('.btn-outline-success[data-factura-escapada]').off('click.facturaProcesar'); // Evento para procesar

    // Ver detalles de factura
    $('.btn-outline-info[data-factura-id]').on('click.facturaVer', function() {
        const facturaId = $(this).data('factura-id'); // Obtener el ID de la factura desde el atributo data-
        console.log('👁️ Ver detalles de factura:', facturaId);

        // Llamar a la función de detalle si está disponible
        if (typeof verDetalleFactura === 'function') {
            verDetalleFactura(facturaId);
        } else {
            console.error('❌ Función verDetalleFactura no está disponible');
            // Opcionalmente, mostrar un toast de error si la función no existe
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'La función para ver detalles no está disponible', 'danger');
            }
        }
    });

    // Imprimir factura
    $('.btn-outline-secondary[data-factura-id]').on('click.facturaImprimir', function() {
        const facturaId = $(this).data('factura-id'); // Obtener el ID de la factura
        console.log('🖨️ Imprimir factura:', facturaId);

        // Llamar a la función de impresión si está disponible
        if (typeof imprimirFactura === 'function') {
            imprimirFactura(facturaId);
        } else {
            console.error('❌ Función imprimirFactura no está disponible');
            // Opcionalmente, mostrar un toast informativo
            if (typeof mostrarToast === 'function') {
                mostrarToast('Info', 'La función de impresión está en desarrollo o no está disponible', 'info');
            }
        }
    });

    // Procesar factura pendiente
    $('.btn-outline-success[data-factura-escapada]').on('click.facturaProcesar', function() {
        try {
            // Obtener los datos de la factura escapados del atributo data-
            const facturaEscapada = $(this).data('factura-escapada');
            // Parsear la cadena JSON escapada de vuelta a un objeto JavaScript
            const factura = JSON.parse(facturaEscapada.replace(/&quot;/g, '"'));
            console.log('⚙️ Procesar factura pendiente:', factura);

            // Llamar a la función de procesamiento si está disponible
            if (typeof procesarFacturaPendiente === 'function') {
                procesarFacturaPendiente(factura); // Pasar el objeto factura completo
            } else {
                console.error('❌ Función procesarFacturaPendiente no está disponible');
                if (typeof mostrarToast === 'function') {
                    mostrarToast('Error', 'La función para procesar facturas no está disponible', 'danger');
                }
            }
        } catch (error) {
            console.error('❌ Error parseando datos de factura para procesamiento:', error);
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'Error al procesar la factura, datos inválidos', 'danger');
            }
        }
    });

    console.log('✅ Eventos de botones de facturas configurados correctamente');
}

/**
 * Actualizar el contador de resultados que muestra cuántas facturas se están viendo
 * @param {number} conteoActual - El número de facturas en la página actual o resultados filtrados.
 * @param {number} conteoTotal - El número total de facturas disponibles (antes de filtrar).
 */
function actualizarContadorResultadosFacturas(conteoActual, conteoTotal) {
    // Calcular el rango de facturas que se muestran (ej. "Mostrando 1-20 de 150")
    const inicio = ((paginaActualFacturas - 1) * facturasPorPagina) + 1;
    // Asegurarse de que el fin no exceda el número total de facturas mostradas
    const fin = Math.min(paginaActualFacturas * facturasPorPagina, conteoActual);

    // Actualizar el texto en el elemento del contador
    $('#contadorResultadosFacturas').text(`Mostrando ${inicio}-${fin} de ${conteoActual} facturas`);
}

/**
 * Crear una fila HTML para la tabla de facturas pendientes
 * @param {object} factura - El objeto de datos de la factura.
 * @returns {string} - El HTML de la fila de la tabla.
 */
function crearFilaFacturaPendiente(factura) {
    // Formatear fecha y hora para visualización
    const fecha = new Date(factura.fechaFactura || factura.fechaCreacion).toLocaleDateString('es-CR');
    const hora = new Date(factura.fechaFactura || factura.fechaCreacion).toLocaleTimeString('es-CR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let estadoBadge = ''; // Variable para el badge de estado

    // Asignar el badge de estado según el valor de factura.estado
    switch (factura.estado) {
        case 'Pendiente':
            estadoBadge = '<span class="badge bg-warning text-dark">Pendiente</span>';
            break;
        case 'Pagada':
            estadoBadge = '<span class="badge bg-success">Pagada</span>';
            break;
        case 'Anulada':
            estadoBadge = '<span class="badge bg-danger">Anulada</span>';
            break;
        default: // Estado por defecto si no coincide con los casos anteriores
            estadoBadge = `<span class="badge bg-secondary">${factura.estado || 'Sin Estado'}</span>`;
    }

    // ✅ ESCAPAR DATOS DE LA FACTURA PENDIENTE para usar en atributos data- (igual que proformas)
    const facturaEscapada = JSON.stringify(factura).replace(/"/g, '&quot;');

    // Construir la fila HTML para la tabla
    const fila = `
        <tr data-factura-id="${factura.facturaId || factura.id}">
            <td>
                <div class="fw-bold text-primary">${factura.numeroFactura || 'N/A'}</div>
                <small class="text-muted d-block">${factura.tipoDocumento || 'Factura'}</small>
                <!-- Estado en móvil (oculto en desktop) -->
                <div class="d-inline d-md-none mt-1">
                    ${estadoBadge}
                </div>
            </td>
            <td>
                <div class="fw-bold">${factura.nombreCliente || factura.clienteNombre || 'Cliente General'}</div>
                ${factura.emailCliente || factura.email ? `<small class="text-muted d-block">${factura.emailCliente || factura.email}</small>` : ''}
                <!-- Información adicional en móvil -->
                <div class="d-block d-lg-none">
                    <small class="text-muted">${fecha} ${hora}</small><br>
                    <small class="badge bg-info">${factura.usuarioCreador || factura.nombreUsuario || 'Sistema'}</small>
                </div>
            </td>
            <!-- Información (solo desktop) -->
            <td class="d-none d-lg-table-cell">
                <div class="fw-bold">${fecha}</div>
                <small class="text-muted d-block">${hora}</small>
                <small class="badge bg-info">${factura.usuarioCreador || factura.nombreUsuario || 'Sistema'}</small>
            </td>
            <td>
                <div class="fw-bold text-success">₡${Number(factura.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</div>
                <small class="text-muted d-none d-md-block">${factura.metodoPago || 'Efectivo'}</small>
            </td>
            <!-- Estado (solo desktop) -->
            <td class="d-none d-md-table-cell">
                ${estadoBadge}
            </td>
            <td class="text-center">
                <!-- Botones verticales en móvil -->
                <div class="btn-group-vertical btn-group-sm d-inline-block d-sm-none">
                    <button type="button" class="btn btn-outline-info btn-sm" title="Ver detalles" data-factura-id="${factura.facturaId || factura.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" title="Imprimir" data-factura-id="${factura.facturaId || factura.id}">
                        <i class="bi bi-printer"></i>
                    </button>
                    ${factura.estado === 'Pendiente' ? `
                    <button type="button" class="btn btn-outline-success btn-sm" title="Procesar" data-factura-escapada="${facturaEscapada}">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                </div>
                <!-- Botones horizontales en tablet/desktop -->
                <div class="btn-group btn-group-sm d-none d-sm-inline-block">
                    <button type="button" class="btn btn-outline-info" title="Ver detalles" data-factura-id="${factura.facturaId || factura.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" title="Imprimir" data-factura-id="${factura.facturaId || factura.id}">
                        <i class="bi bi-printer"></i>
                    </button>
                    ${factura.estado === 'Pendiente' ? `
                    <button type="button" class="btn btn-outline-success" title="Procesar Factura" data-factura-escapada="${facturaEscapada}">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;

    return fila; // Devolver el HTML de la fila completa
}


/**
 * ✅ FUNCIÓN: Ver detalle de factura (siguiendo patrón de proformas)
 */
async function verDetalleFactura(facturaId) {
    try {
        console.log('👁️ === MOSTRANDO DETALLE DE FACTURA ===');
        console.log('👁️ Factura ID:', facturaId);

        if (!facturaId) {
            console.error('❌ ID de factura no válido:', facturaId);
            // Asumiendo que existe una función mostrarToast para feedback al usuario
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'ID de factura no válido', 'danger');
            }
            return;
        }

        // HTML para el estado de carga mientras se obtienen los datos
        const loadingHtml = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando factura...</span>
                </div>
                <p class="text-muted">Obteniendo detalles de la factura...</p>
            </div>
        `;

        // HTML base del modal, incluyendo el estado de carga
        const modalHtml = `
            <div class="modal fade" id="modalDetalleFactura" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-receipt me-2"></i>Detalles de Factura
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="detalleFacturaContent">
                                ${loadingHtml}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cerrar
                            </button>
                            <button type="button" class="btn btn-info" id="btnImprimirFacturaDetalle">
                                <i class="bi bi-printer me-1"></i>Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si ya existe para evitar duplicados
        $('#modalDetalleFactura').remove();
        // Añadir el nuevo modal al DOM
        $('body').append(modalHtml);

        // Crear y mostrar la instancia del modal de Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleFactura'));
        modal.show();

        // Configurar el evento click para el botón de imprimir dentro del modal
        $('#btnImprimirFacturaDetalle').on('click', function() {
            imprimirFactura(facturaId); // Llama a la función de impresión de factura
        });

        // Realizar la petición fetch para obtener los detalles de la factura
        const response = await fetch(`/Facturacion/ObtenerDetalleFactura?facturaId=${facturaId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest' // Indicador para el backend
            }
        });

        // Verificar si la respuesta fue exitosa (código 2xx)
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Parsear la respuesta JSON
        const result = await response.json();

        // Si la respuesta indica éxito y contiene la factura
        if (result.success && result.factura) {
            const factura = result.factura;
            console.log('📋 Factura obtenida:', factura);
            // Llama a la función para mostrar los detalles en el modal
            mostrarDetalleFacturaModal(factura);
        } else {
            // Si hubo un error en la respuesta del servidor
            throw new Error(result.message || 'No se pudieron obtener los detalles de la factura');
        }

    } catch (error) {
        console.error('❌ Error obteniendo detalle de factura:', error);

        // Mostrar un mensaje de error dentro del modal si falla la carga
        $('#detalleFacturaContent').html(`
            <div class="alert alert-danger">
                <h6><i class="bi bi-exclamation-triangle me-2"></i>Error</h6>
                <p class="mb-0">No se pudieron cargar los detalles de la factura: ${error.message}</p>
            </div>
        `);

        // Mostrar un toast de error si la función existe
        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'No se pudo cargar el detalle de la factura', 'danger');
        }
    }
}

/**
 * ✅ FUNCIÓN: Mostrar detalle de factura en modal (siguiendo patrón de proformas)
 */
function mostrarDetalleFacturaModal(factura) {
    try {
        console.log('📋 === MOSTRANDO DETALLES DE FACTURA EN MODAL ===');
        console.log('📋 Factura:', factura);

        // Calcular totales a partir de los detalles de la factura
        const subtotalCalculado = factura.detallesFactura ?
            factura.detallesFactura.reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0) : 0;
        const ivaCalculado = factura.montoImpuesto || 0;
        const totalCalculado = factura.total || 0;

        // Determinar la clase CSS para el badge de estado
        let estadoClass = 'badge bg-secondary'; // Estado por defecto
        switch (factura.estado?.toLowerCase()) { // Convertir a minúsculas para comparación segura
            case 'pagada': estadoClass = 'badge bg-success'; break;
            case 'pendiente': estadoClass = 'badge bg-warning'; break; // Usar text-dark para mejor contraste en amarillo
            case 'anulada': estadoClass = 'badge bg-danger'; break;
            case 'vencida': estadoClass = 'badge bg-dark'; break; // Oscuro para vencida
        }

        // Construir el HTML para la lista de productos de la factura
        let detallesHtml = '';
        if (factura.detallesFactura && factura.detallesFactura.length > 0) {
            detallesHtml = factura.detallesFactura.map(detalle => `
                <tr>
                    <td>
                        <strong>${detalle.nombreProducto || 'Producto sin nombre'}</strong>
                        ${detalle.descripcionProducto ? `<br><small class="text-muted">${detalle.descripcionProducto}</small>` : ''}
                    </td>
                    <td class="text-center">${detalle.cantidad || 0}</td>
                    <td class="text-end">₡${formatearMoneda(detalle.precioUnitario || 0)}</td>
                    <td class="text-end">₡${formatearMoneda(detalle.subtotal || 0)}</td>
                </tr>
            `).join(''); // Unir todas las filas de productos en una sola cadena
        } else {
            // Mensaje si no hay productos en la factura
            detallesHtml = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-inbox display-6"></i><br>
                        No hay productos en esta factura
                    </td>
                </tr>
            `;
        }

        // Construir el HTML completo del contenido del modal
        const contenidoHtml = `
            <div class="row">
                <!-- Información de la Factura -->
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Información General</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-5"><strong>Número:</strong></div>
                                <div class="col-sm-7 text-primary fw-bold">${factura.numeroFactura || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-5"><strong>Estado:</strong></div>
                                <div class="col-sm-7"><span class="${estadoClass}">${factura.estado || 'N/A'}</span></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-5"><strong>Fecha:</strong></div>
                                <div class="col-sm-7">${factura.fechaFactura ? new Date(factura.fechaFactura).toLocaleDateString('es-ES') : 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-5"><strong>Método de Pago:</strong></div>
                                <div class="col-sm-7">${factura.metodoPago || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-5"><strong>Creada por:</strong></div>
                                <div class="col-sm-7">${factura.usuarioCreadorNombre || 'N/A'}</div>
                            </div>
                            ${factura.observaciones ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Observaciones:</strong></div>
                                    <div class="col-sm-7"><small class="text-muted">${factura.observaciones}</small></div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Información del Cliente -->
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h6 class="mb-0"><i class="bi bi-person me-2"></i>Información del Cliente</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Nombre:</strong></div>
                                <div class="col-sm-8">${factura.nombreCliente || 'N/A'}</div>
                            </div>
                            ${factura.identificacionCliente ? `
                                <div class="row mb-2">
                                    <div class="col-sm-4"><strong>Cédula:</strong></div>
                                    <div class="col-sm-8">${factura.identificacionCliente}</div>
                                </div>
                            ` : ''}
                            ${factura.telefonoCliente ? `
                                <div class="row mb-2">
                                    <div class="col-sm-4"><strong>Teléfono:</strong></div>
                                    <div class="col-sm-8">${factura.telefonoCliente}</div>
                                </div>
                            ` : ''}
                            ${factura.emailCliente ? `
                                <div class="row mb-2">
                                    <div class="col-sm-4"><strong>Email:</strong></div>
                                    <div class="col-sm-8">${factura.emailCliente}</div>
                                </div>
                            ` : ''}
                            ${factura.direccionCliente ? `
                                <div class="row mb-2">
                                    <div class="col-sm-4"><strong>Dirección:</strong></div>
                                    <div class="col-sm-8">${factura.direccionCliente}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Productos de la Factura -->
            <div class="card">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-list-ul me-2"></i>Productos</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center">Cantidad</th>
                                    <th class="text-end">Precio Unit.</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detallesHtml}
                            </tbody>
                            <tfoot class="table-light">
                                <tr>
                                    <th colspan="3" class="text-end">Subtotal:</th>
                                    <th class="text-end">₡${formatearMoneda(subtotalCalculado)}</th>
                                </tr>
                                <tr>
                                    <th colspan="3" class="text-end">IVA (13%):</th>
                                    <th class="text-end">₡${formatearMoneda(ivaCalculado)}</th>
                                </tr>
                                <tr class="table-success">
                                    <th colspan="3" class="text-end">TOTAL:</th>
                                    <th class="text-end">₡${formatearMoneda(totalCalculado)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Insertar el contenido generado en el modal
        $('#detalleFacturaContent').html(contenidoHtml);
        console.log('✅ Detalles de factura mostrados correctamente en modal');

    } catch (error) {
        console.error('❌ Error mostrando detalles de factura:', error);
        // Mostrar un mensaje de error si algo falla al construir el HTML
        $('#detalleFacturaContent').html(`
            <div class="alert alert-danger">
                <h6><i class="bi bi-exclamation-triangle me-2"></i>Error</h6>
                <p class="mb-0">Error mostrando los detalles: ${error.message}</p>
            </div>
        `);
    }
}

// Helper function to format currency (assuming it's defined elsewhere or needs to be added)
function formatearMoneda(valor) {
    if (typeof valor === 'undefined' || valor === null) return '0.00';
    return Number(valor).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== FUNCIÓN PARA IMPRIMIR FACTURA PENDIENTE =====
function imprimirFacturaPendiente(facturaId) {
    try {
        console.log('🖨️ === IMPRIMIENDO FACTURA PENDIENTE ===');
        console.log('🖨️ Factura ID:', facturaId);

        // Verificar si el módulo de impresión térmica está disponible
        if (typeof imprimirFacturaTermica === 'function') {
            // Usar la función de impresión térmica existente
            imprimirFacturaTermica(facturaId);
        } else if (typeof window.print === 'function') {
            // Fallback: usar impresión del navegador
            console.log('🖨️ Usando impresión del navegador como fallback');

            // Abrir ventana con los detalles de la factura para imprimir
            const ventanaImpresion = window.open(`/Facturacion/ObtenerDetalleFactura?facturaId=${facturaId}`, '_blank');

            if (ventanaImpresion) {
                ventanaImpresion.onload = function() {
                    ventanaImpresion.print();
                    ventanaImpresion.close();
                };
            } else {
                throw new Error('No se pudo abrir la ventana de impresión');
            }
        } else {
            throw new Error('Funciones de impresión no disponibles');
        }

        if (typeof mostrarToast === 'function') {
            mostrarToast('Impresión', 'Iniciando impresión de factura...', 'info');
        }

    } catch (error) {
        console.error('❌ Error imprimiendo factura pendiente:', error);

        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'Error al imprimir factura: ' + error.message, 'danger');
        } else {
            alert('Error al imprimir factura: ' + error.message);
        }
    }
}

// ===== FUNCIÓN PARA IMPRIMIR FACTURA (Reemplaza imprimirFacturaPendiente y unifica la lógica) =====
async function imprimirFactura(facturaId) {
    try {
        console.log('🖨️ === IMPRIMIENDO FACTURA ===');
        console.log('🖨️ Factura ID:', facturaId);

        if (!facturaId) {
            console.error('❌ ID de factura no válido para impresión:', facturaId);
            if (typeof mostrarToast === 'function') {
                mostrarToast('Error', 'ID de factura no válido', 'danger');
            }
            return;
        }

        if (typeof mostrarToast === 'function') {
            mostrarToast('Imprimiendo', 'Generando recibo de factura...', 'info');
        }

        const response = await fetch(`/Facturacion/ObtenerDetalleFactura?facturaId=${facturaId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.factura) {
            const factura = result.factura;
            console.log('📋 Datos de factura obtenidos para impresión:', factura);

            // Usar la función de re-impresión existente en facturacion.js
            if (typeof window.reimprimirFacturaDesdeModal === 'function') {
                console.log('🖨️ Usando función de re-impresión existente');
                await window.reimprimirFacturaDesdeModal(facturaId, factura.numeroFactura);
            } else if (typeof reimprimirFacturaDesdeModal === 'function') {
                console.log('🖨️ Usando función de re-impresión global');
                await reimprimirFacturaDesdeModal(facturaId, factura.numeroFactura);
            } else if (typeof generarReciboTermico === 'function') {
                console.log('🖨️ Usando función de impresión térmica');

                const datosFactura = {
                    numeroFactura: factura.numeroFactura,
                    nombreCliente: factura.nombreCliente,
                    usuarioCreadorNombre: factura.usuarioCreadorNombre
                };

                const productos = factura.detallesFactura || [];
                const totales = {
                    subtotal: factura.subtotal || 0,
                    iva: factura.montoImpuesto || 0,
                    total: factura.total || 0,
                    metodoPago: factura.metodoPago || 'Efectivo',
                    cliente: { nombre: factura.nombreCliente },
                    usuario: { nombre: factura.usuarioCreadorNombre }
                };

                generarReciboTermico(datosFactura, productos, totales);

                if (typeof mostrarToast === 'function') {
                    mostrarToast('Éxito', 'Recibo de factura enviado a impresora', 'success');
                }
            } else {
                console.error('❌ Sistema de impresión no disponible');
                if (typeof mostrarToast === 'function') {
                    mostrarToast('Error', 'Sistema de impresión no disponible', 'danger');
                }
            }

        } else {
            throw new Error(result.message || 'No se pudieron obtener los datos de la factura');
        }

    } catch (error) {
        console.error('❌ Error imprimiendo factura:', error);

        if (typeof mostrarToast === 'function') {
            mostrarToast('Error', 'No se pudo imprimir la factura: ' + error.message, 'danger');
        } else {
            alert('Error imprimiendo factura: ' + error.message);
        }
    }
}

// ===== EXPORTAR FUNCIONES GLOBALMENTE =====
if (typeof window !== 'undefined') {
    // Funciones principales
    window.inicializarFiltrosFacturasPendientes = inicializarFiltrosFacturasPendientes;
    window.cargarTodasLasFacturasPendientes = cargarTodasLasFacturasPendientes;
    window.recargarFacturasPendientes = recargarFacturasPendientes;
    window.cambiarPaginaFacturas = cambiarPaginaFacturas;
    window.limpiarFiltrosFacturas = limpiarFiltrosFacturas;

    // Funciones de acciones de facturas
    window.verDetalleFactura = verDetalleFactura;
    window.imprimirFactura = imprimirFactura;
    window.mostrarDetalleFacturaModal = mostrarDetalleFacturaModal;

    console.log('📋 Funciones de facturas pendientes exportadas globalmente');
} else {
    console.error('❌ Window no está disponible para exportar funciones globales.');
}