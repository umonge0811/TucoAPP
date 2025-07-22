// =========================================
// GESTIÓN DE ENTREGAS PENDIENTES
// =========================================

let pendientesData = [];
let modalMarcarEntregado;
let modalDetallesPendiente;

// Variables de paginación
let paginaActualEntregas = 1;
let entregasPorPagina = 10;
let pendientesFiltrados = [];

// =========================================
// INICIALIZACIÓN
// =========================================

$(document).ready(function() {
    console.log('🚚 === INICIALIZANDO MÓDULO DE ENTREGAS PENDIENTES ===');

    // Inicializar modales
    modalMarcarEntregado = new bootstrap.Modal(document.getElementById('modalMarcarEntregado'));
    modalDetallesPendiente = new bootstrap.Modal(document.getElementById('modalDetallesPendiente'));

    // Configurar eventos
    configurarEventos();

    // Cargar pendientes iniciales
    cargarPendientes();
});

// =========================================
// CONFIGURACIÓN DE EVENTOS
// =========================================

function configurarEventos() {
    // Filtros
    $('#btnFiltrar').on('click', aplicarFiltros);
    $('#btnLimpiar').on('click', limpiarFiltros);
    $('#btnRefrescar').on('click', cargarPendientes);

    // Filtro en tiempo real por código de seguimiento
    $('#filtroCodigo').on('input', function() {
        clearTimeout(window.filtroTimeout);
        window.filtroTimeout = setTimeout(aplicarFiltros, 300);
    });

    // Cambio de elementos por página
    $('#entregasPorPagina').on('change', function () {
        entregasPorPagina = parseInt($(this).val());
        paginaActualEntregas = 1; // Resetear a la primera página
        console.log('📄 Elementos por página cambiado a:', entregasPorPagina);

        // Volver a mostrar con la nueva paginación
        mostrarPendientes(pendientesFiltrados.length > 0 ? pendientesFiltrados : pendientesData);
    });

    // Filtro por estado
    $('#filtroEstado').on('change', aplicarFiltros);

    // Eventos del modal de entrega
    $('#btnConfirmarEntrega').on('click', confirmarEntrega);

    // Validación de cantidad a entregar
    $('#cantidadAEntregar').on('input', function() {
        const cantidad = parseInt($(this).val()) || 0;
        const max = parseInt($('#maxCantidad').text()) || 0;

        if (cantidad > max) {
            $(this).val(max);
        }
        if (cantidad < 1) {
            $(this).val(1);
        }
        
        // ✅ ACTUALIZAR ESTADO DEL BOTÓN SEGÚN DISPONIBILIDAD
        const btnConfirmar = $('#btnConfirmarEntrega');
        if (cantidad > 0 && cantidad <= max) {
            btnConfirmar.prop('disabled', false);
        } else {
            btnConfirmar.prop('disabled', true);
        }
    });
}

// =========================================
// CARGA DE DATOS
// =========================================

async function cargarPendientes() {
    try {
        console.log('🚚 Cargando pendientes de entrega...');

        mostrarIndicadorCarga(true);

        const response = await fetch('/Facturacion/ObtenerPendientesEntrega', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const resultado = await response.json();

        console.log('🚚 Respuesta completa del servidor:', resultado);

        // Manejar diferentes estructuras de respuesta (igual que facturas pendientes)
        let pendientes = null;

        // CASO 1: Respuesta directa como array
        if (Array.isArray(resultado)) {
            pendientes = resultado;
            console.log('✅ Pendientes encontrados como array directo:', pendientes.length);
        }
        // CASO 2: Respuesta con propiedad success
        else if (resultado.success && resultado.data) {
            if (Array.isArray(resultado.data)) {
                pendientes = resultado.data;
                console.log('✅ Pendientes encontrados en resultado.data:', pendientes.length);
            }
        }
        // CASO 3: Buscar en propiedades del resultado
        else {
            // Buscar arrays en las propiedades principales
            for (const [key, value] of Object.entries(resultado)) {
                if (Array.isArray(value) && value.length > 0 && value[0].id && value[0].nombreProducto) {
                    pendientes = value;
                    console.log(`✅ Pendientes encontrados en resultado.${key}:`, pendientes.length);
                    break;
                }
            }
        }

        // CASO 4: Respuesta de error explícita
        if (resultado.success === false) {
            console.log('❌ Respuesta de error del servidor:', resultado.message);
            pendientes = [];
        }

        // Debug detallado si no encontramos pendientes
        if (!pendientes) {
            console.log('⚠️ No se encontraron pendientes. Análisis detallado:');
            console.log('📋 Es array directo?:', Array.isArray(resultado));
            console.log('📋 Tiene propiedad pendientes?:', 'pendientes' in resultado);
            console.log('📋 Tiene propiedad data?:', 'data' in resultado);
            console.log('📋 Tiene propiedad success?:', 'success' in resultado);
            console.log('📋 Todas las propiedades:', Object.keys(resultado));

            // Intentar encontrar cualquier array en la respuesta
            const arrayProperties = Object.entries(resultado)
                .filter(([key, value]) => Array.isArray(value))
                .map(([key, value]) => ({ key, length: value.length }));
            console.log('📋 Propiedades tipo array encontradas:', arrayProperties);

            // Establecer array vacío como fallback
            pendientes = [];
        }

        pendientesData = pendientes;
        console.log('🚚 Pendientes cargados:', pendientesData.length);

        // Aplicar filtros si hay alguno activo, sino mostrar todos
        const hayFiltrosActivos = $('#filtroEstado').val() || $('#filtroCodigo').val() || 
                                 $('#filtroFechaDesde').val() || $('#filtroFechaHasta').val();
        
        if (hayFiltrosActivos) {
            aplicarFiltros();
        } else {
            mostrarPendientes(pendientesData);
            actualizarContadorResultados(pendientesData.length, pendientesData.length);
        }

    } catch (error) {
        console.error('❌ Error en cargarPendientes:', error);
        mostrarError('Error de conexión al cargar pendientes');
    } finally {
        mostrarIndicadorCarga(false);
    }
}

// =========================================
// VISUALIZACIÓN DE DATOS
// =========================================

function mostrarPendientes(pendientes) {
    console.log('📋 === MOSTRANDO PENDIENTES CON PAGINACIÓN ===');
    console.log('📋 Total pendientes:', pendientes.length);

    // Guardar pendientes filtrados
    pendientesFiltrados = pendientes;

    if (!pendientes || pendientes.length === 0) {
        $('#sinResultados').show();
        $('#tablaPendientes').hide();
        $('#contadorResultados').hide();
        $('#paginacionEntregas').hide();
        return;
    }

    $('#sinResultados').hide();
    $('#tablaPendientes').show();
    $('#contadorResultados').show();

    // Calcular paginación
    const totalPaginas = Math.ceil(pendientes.length / entregasPorPagina);
    const inicio = (paginaActualEntregas - 1) * entregasPorPagina;
    const fin = inicio + entregasPorPagina;
    const pendientesPagina = pendientes.slice(inicio, fin);

    console.log('📋 Mostrando página:', paginaActualEntregas, 'de', totalPaginas);
    console.log('📋 Pendientes en esta página:', pendientesPagina.length);

    // Mostrar pendientes de la página actual
    const tbody = $('#bodyPendientes');
    tbody.empty();

    pendientesPagina.forEach(pendiente => {
        const fila = crearFilaPendiente(pendiente);
        tbody.append(fila);
    });

    // Actualizar contador
    actualizarContadorResultados(pendientes.length, pendientesData.length);

    // Mostrar paginación si hay más de una página
    if (totalPaginas > 1) {
        mostrarPaginacionEntregas(paginaActualEntregas, totalPaginas);
    } else {
        $('#paginacionEntregas').hide();
    }

    // Resaltar términos de búsqueda si hay filtro de código
    const filtroCodigo = $('#filtroCodigo').val().trim();
    if (filtroCodigo) {
        resaltarTerminoBusqueda(filtroCodigo);
    }
}

/**
 * Mostrar controles de paginación
 */
function mostrarPaginacionEntregas(paginaActual, totalPaginas) {
    console.log('📄 === MOSTRANDO PAGINACIÓN DE ENTREGAS ===');
    console.log('📄 Página actual:', paginaActual, 'Total páginas:', totalPaginas);

    const paginacion = $('#paginacionEntregas');
    if (paginacion.length === 0) {
        console.error('❌ No se encontró el contenedor de paginación');
        return;
    }

    let html = '<nav aria-label="Paginación de entregas pendientes"><ul class="pagination justify-content-center mb-0">';

    // Botón anterior
    if (paginaActual > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaEntregas(${paginaActual - 1})">
                        <i class="bi bi-chevron-left"></i> Anterior
                    </a>
                </li>`;
    } else {
        html += `<li class="page-item disabled">
                    <span class="page-link">
                        <i class="bi bi-chevron-left"></i> Anterior
                    </span>
                </li>`;
    }

    // Páginas (mostrar máximo 5 páginas)
    const iniciarPagina = Math.max(1, paginaActual - 2);
    const finalizarPagina = Math.min(totalPaginas, iniciarPagina + 4);

    if (iniciarPagina > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaEntregas(1)">1</a>
                </li>`;
        if (iniciarPagina > 2) {
            html += `<li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>`;
        }
    }

    for (let i = iniciarPagina; i <= finalizarPagina; i++) {
        if (i === paginaActual) {
            html += `<li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>`;
        } else {
            html += `<li class="page-item">
                        <a class="page-link" href="#" onclick="cambiarPaginaEntregas(${i})">${i}</a>
                    </li>`;
        }
    }

    if (finalizarPagina < totalPaginas) {
        if (finalizarPagina < totalPaginas - 1) {
            html += `<li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>`;
        }
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaEntregas(${totalPaginas})">${totalPaginas}</a>
                </li>`;
    }

    // Botón siguiente
    if (paginaActual < totalPaginas) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cambiarPaginaEntregas(${paginaActual + 1})">
                        Siguiente <i class="bi bi-chevron-right"></i>
                    </a>
                </li>`;
    } else {
        html += `<li class="page-item disabled">
                    <span class="page-link">
                        Siguiente <i class="bi bi-chevron-right"></i>
                    </span>
                </li>`;
    }

    html += '</ul></nav>';

    paginacion.html(html).show();
}

/**
 * Cambiar página de entregas pendientes
 */
function cambiarPaginaEntregas(nuevaPagina) {
    console.log('📄 Cambiando a página:', nuevaPagina);

    paginaActualEntregas = nuevaPagina;

    // Mostrar pendientes filtrados con la nueva página
    mostrarPendientes(pendientesFiltrados);

    // Scroll suave hacia la tabla
    document.getElementById('tablaPendientes').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function crearFilaPendiente(pendiente) {
    const estadoClass = pendiente.estado === 'Entregado' ? 'success' : 'warning';
    const fechaCreacion = new Date(pendiente.fechaCreacion).toLocaleDateString('es-ES');

    // Usar directamente el código de seguimiento de la base de datos
    const codigoSeguimiento = pendiente.codigoSeguimiento || 'Sin código';
    
    // ✅ VALIDAR STOCK DISPONIBLE
    const stockActual = pendiente.stockActual || 0;
    const cantidadPendiente = pendiente.cantidadPendiente || 0;
    const stockSuficiente = stockActual >= cantidadPendiente;
    
    // Determinar clase CSS para el stock
    const stockClass = stockSuficiente ? 'bg-success' : 'bg-danger';
    const stockTitle = stockSuficiente ? 'Stock suficiente' : 'Stock insuficiente para completar la entrega';

    return `
        <tr>
            <td>
                <code>${codigoSeguimiento}</code>
            </td>
            <td>
                <strong>${pendiente.numeroFactura || 'FAC-' + pendiente.facturaId}</strong>
            </td>
            <td>
                ${pendiente.nombreProducto || 'Producto sin nombre'}
                ${pendiente.esLlanta && pendiente.medidaLlanta ? `<br><small class="text-muted">${pendiente.medidaLlanta}</small>` : ''}
            </td>
            <td class="text-center">
                <span class="badge bg-info">${pendiente.cantidadSolicitada || 0}</span>
            </td>
            <td class="text-center">
                <span class="badge bg-warning">${cantidadPendiente}</span>
            </td>
            <td class="text-center">
                <span class="badge ${stockClass}" title="${stockTitle}">${stockActual}</span>
            </td>
            <td>${fechaCreacion}</td>
            <td>
                <span class="badge bg-${estadoClass}">${pendiente.estado}</span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-info btn-sm" 
                            onclick="verDetalles(${pendiente.id})" 
                            title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${pendiente.estado === 'Pendiente' ? `
                    <button type="button" class="btn btn-outline-success btn-sm ${!stockSuficiente ? 'disabled' : ''}" 
                            onclick="abrirModalEntrega(${pendiente.id})" 
                            title="${stockSuficiente ? 'Marcar como entregado' : 'Stock insuficiente - No se puede entregar'}"
                            ${!stockSuficiente ? 'disabled' : ''}>
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

// =========================================
// GESTIÓN DE ENTREGAS
// =========================================

function abrirModalEntrega(pendienteId) {
    const pendiente = pendientesData.find(p => p.id === pendienteId);

    if (!pendiente) {
        mostrarError('No se encontró el pendiente seleccionado');
        return;
    }

    // ✅ VALIDAR STOCK ANTES DE ABRIR MODAL
    const stockActual = pendiente.stockActual || 0;
    const cantidadPendiente = pendiente.cantidadPendiente || 0;
    
    if (stockActual < cantidadPendiente) {
        mostrarError(`❌ STOCK INSUFICIENTE: El producto "${pendiente.nombreProducto}" tiene ${stockActual} unidades disponibles, pero se requieren ${cantidadPendiente} unidades para completar la entrega.`);
        return;
    }

    // Llenar datos del modal
    $('#pendienteId').val(pendiente.id);
    $('#nombreProducto').val(pendiente.nombreProducto || 'Producto sin nombre');
    $('#cantidadPendiente').val(cantidadPendiente);
    $('#maxCantidad').text(Math.min(cantidadPendiente, stockActual)); // ✅ LIMITAR POR STOCK DISPONIBLE
    $('#cantidadAEntregar').val(Math.min(cantidadPendiente, stockActual));
    $('#observacionesEntrega').val('');

    modalMarcarEntregado.show();
}

async function confirmarEntrega() {
    try {
        const pendienteId = parseInt($('#pendienteId').val());
        const cantidadAEntregar = parseInt($('#cantidadAEntregar').val());
        const observaciones = $('#observacionesEntrega').val().trim();

        if (!pendienteId || !cantidadAEntregar || cantidadAEntregar < 1) {
            mostrarError('Datos de entrega inválidos');
            return;
        }

        // Obtener el código de seguimiento del pendiente seleccionado
        const pendienteSeleccionado = pendientesData.find(p => p.id === pendienteId);
        const codigoSeguimiento = pendienteSeleccionado?.codigoSeguimiento;

        if (!codigoSeguimiento) {
            mostrarError('No se encontró código de seguimiento para este pendiente');
            return;
        }

       

        // Obtener información del usuario actual
        const usuarioActual = obtenerUsuarioActual();
        const usuarioId = usuarioActual?.usuarioId || usuarioActual?.id || 1;

        const datosEntrega = {
            codigoSeguimiento: codigoSeguimiento,
            pendienteId: pendienteId,
            cantidadAEntregar: cantidadAEntregar,
            usuarioEntrega: usuarioId,
            observacionesEntrega: observaciones
        };

        console.log('🚚 Confirmando entrega con código:', datosEntrega);

        // Deshabilitar botón mientras se procesa
        $('#btnConfirmarEntrega').prop('disabled', true).html('<i class="bi bi-hourglass-split me-2"></i>Procesando...');

        const response = await fetch('/Facturacion/MarcarComoEntregadoPorCodigo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosEntrega),
            credentials: 'include'
        });

        console.log('🌐 Respuesta HTTP status:', response.status);
        console.log('🌐 Respuesta HTTP headers:', response.headers);
        
        const textoRespuesta = await response.text();
        console.log('🌐 Respuesta como texto:', textoRespuesta);
        
        let resultado;
        try {
            resultado = JSON.parse(textoRespuesta);
            console.log('📋 Resultado parseado:', resultado);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            console.error('❌ Texto recibido:', textoRespuesta);
            mostrarError('Error de comunicación con el servidor');
            return;
        }

        if (resultado.success) {
            mostrarExito('Entrega confirmada exitosamente - Código: ' + codigoSeguimiento);
            modalMarcarEntregado.hide();
            cargarPendientes(); // Recargar la lista
        } else {
            // Mostrar el mensaje específico del error, especialmente útil para errores de stock
            const mensajeError = resultado.message || 'Error desconocido al confirmar entrega';
            mostrarError(mensajeError);
            console.error('❌ Error detallado completo:', {
                success: resultado.success,
                message: resultado.message,
                statusCode: response.status,
                url: response.url,
                respuestaCompleta: resultado
            });
        }

    } catch (error) {
        console.error('❌ Error confirmando entrega:', error);
        mostrarError('Error de conexión al confirmar entrega');
    } finally {
        // Restaurar botón
        $('#btnConfirmarEntrega').prop('disabled', false).html('<i class="bi bi-check-circle me-2"></i>Confirmar Entrega');
    }
}

// =========================================
// DETALLES DE PENDIENTES
// =========================================

function verDetalles(pendienteId) {
    const pendiente = pendientesData.find(p => p.id === pendienteId);

    if (!pendiente) {
        mostrarError('No se encontró el pendiente seleccionado');
        return;
    }

    const contenido = generarContenidoDetalles(pendiente);
    $('#detallesPendienteContent').html(contenido);

    modalDetallesPendiente.show();
}

function generarContenidoDetalles(pendiente) {
    const fechaCreacion = new Date(pendiente.fechaCreacion).toLocaleString('es-ES');
    const fechaEntrega = pendiente.fechaEntrega ? 
        new Date(pendiente.fechaEntrega).toLocaleString('es-ES') : 'No entregado';

    return `
        <div class="row">
            <div class="col-md-6">
                <h6>Información General</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Código:</strong></td>
                        <td><code>${pendiente.codigoSeguimiento || 'Sin código'}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Factura:</strong></td>
                        <td>${pendiente.numeroFactura || 'FAC-' + pendiente.facturaId}</td>
                    </tr>
                    <tr>
                        <td><strong>Estado:</strong></td>
                        <td>
                            <span class="badge bg-${pendiente.estado === 'Entregado' ? 'success' : 'warning'}">
                                ${pendiente.estado}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Producto</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Nombre:</strong></td>
                        <td>${pendiente.nombreProducto || 'Sin nombre'}</td>
                    </tr>
                    <tr>
                        <td><strong>Solicitado:</strong></td>
                        <td><span class="badge bg-info">${pendiente.cantidadSolicitada || 0}</span></td>
                    </tr>
                    <tr>
                        <td><strong>Pendiente:</strong></td>
                        <td><span class="badge bg-warning">${pendiente.cantidadPendiente || 0}</span></td>
                    </tr>
                    <tr>
                        <td><strong>Stock Actual:</strong></td>
                        <td><span class="badge ${(pendiente.stockActual || 0) >= (pendiente.cantidadPendiente || 0) ? 'bg-success' : 'bg-danger'}">${pendiente.stockActual || 0}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Fechas</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Fecha Creación:</strong></td>
                        <td>${fechaCreacion}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha Entrega:</strong></td>
                        <td>${fechaEntrega}</td>
                    </tr>
                </table>
            </div>
        </div>
        ${pendiente.observaciones ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6>Observaciones</h6>
                <div class="border p-2 bg-light rounded">
                    ${pendiente.observaciones}
                </div>
            </div>
        </div>
        ` : ''}
    `;
}

// =========================================
// FILTROS
// =========================================

function aplicarFiltros() {
    console.log('🔍 Aplicando filtros a entregas pendientes...');

    // Resetear paginación al aplicar filtros
    paginaActualEntregas = 1;

    // Obtener valores de filtros
    const filtroEstado = $('#filtroEstado').val().toLowerCase().trim();
    const filtroCodigo = $('#filtroCodigo').val().toLowerCase().trim();
    const filtroFechaDesde = $('#filtroFechaDesde').val();
    const filtroFechaHasta = $('#filtroFechaHasta').val();

    // Filtrar datos
    let pendientesFiltrados = pendientesData.filter(pendiente => {
        // Filtro por estado
        if (filtroEstado && !pendiente.estado.toLowerCase().includes(filtroEstado)) {
            return false;
        }

        // Filtro por código de seguimiento
        if (filtroCodigo) {
            const codigo = (pendiente.codigoSeguimiento || '').toLowerCase();
            const numeroFactura = (pendiente.numeroFactura || '').toLowerCase();
            
            // Buscar en código de seguimiento o número de factura
            if (!codigo.includes(filtroCodigo) && !numeroFactura.includes(filtroCodigo)) {
                return false;
            }
        }

        // Filtro por fecha desde
        if (filtroFechaDesde) {
            const fechaPendiente = new Date(pendiente.fechaCreacion);
            const fechaDesde = new Date(filtroFechaDesde);
            if (fechaPendiente < fechaDesde) {
                return false;
            }
        }

        // Filtro por fecha hasta
        if (filtroFechaHasta) {
            const fechaPendiente = new Date(pendiente.fechaCreacion);
            const fechaHasta = new Date(filtroFechaHasta);
            fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
            if (fechaPendiente > fechaHasta) {
                return false;
            }
        }

        return true;
    });

    console.log(`🔍 Filtros aplicados: ${pendientesFiltrados.length} de ${pendientesData.length} pendientes mostrados`);
    
    // Mostrar resultados filtrados
    mostrarPendientes(pendientesFiltrados);
    
    // Actualizar contador de resultados
    actualizarContadorResultados(pendientesFiltrados.length, pendientesData.length);
}

function limpiarFiltros() {
    console.log('🧹 Limpiando filtros...');

    // Resetear paginación al limpiar filtros
    paginaActualEntregas = 1;

    $('#filtroEstado').val('');
    $('#filtroCodigo').val('');
    $('#filtroFechaDesde').val('');
    $('#filtroFechaHasta').val('');

    // Mostrar todos los pendientes
    mostrarPendientes(pendientesData);
}
function actualizarContadorResultados(mostrados, total) {
    const inicioRango = (paginaActualEntregas - 1) * entregasPorPagina + 1;
    const finRango = Math.min(paginaActualEntregas * entregasPorPagina, mostrados);

    let texto = '';
    if (mostrados === total) {
        if (mostrados <= entregasPorPagina) {
            texto = `Mostrando ${mostrados} entregas pendientes`;
        } else {
            texto = `Mostrando ${inicioRango}-${finRango} de ${total} entregas pendientes`;
        }
    } else {
        texto = `Mostrando ${inicioRango}-${finRango} de ${mostrados} entregas filtradas (${total} total)`;
    }

    // Actualizar texto si existe el elemento
    if ($('#contadorResultados').length) {
        $('#contadorResultados').text(texto);
    } else {
        // Crear elemento si no existe
        const contador = `<div id="contadorResultados" class="text-muted small mb-2">${texto}</div>`;
        $('#tablaPendientes').before(contador);
    }
}
// =========================================
// UTILIDADES
// =========================================

function mostrarIndicadorCarga(mostrar) {
    if (mostrar) {
        $('#loadingIndicator').show();
        $('#tablaPendientes').hide();
        $('#sinResultados').hide();
    } else {
        $('#loadingIndicator').hide();
    }
}

function obtenerUsuarioActual() {
    // Intentar obtener del localStorage o sessionStorage
    try {
        const usuario = localStorage.getItem('usuarioActual') || sessionStorage.getItem('usuarioActual');
        return usuario ? JSON.parse(usuario) : { id: 1, usuarioId: 1 };
    } catch {
        return { id: 1, usuarioId: 1 };
    }
}

function resaltarTerminoBusqueda(termino) {
    if (!termino) return;
    
    const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    $('#bodyPendientes tr').each(function() {
        const $fila = $(this);
        
        // Resaltar en código de seguimiento y número de factura
        $fila.find('td:first-child code, td:nth-child(2) strong').each(function() {
            const $elemento = $(this);
            const texto = $elemento.text();
            const textoResaltado = texto.replace(regex, '<mark>$1</mark>');
            if (texto !== textoResaltado) {
                $elemento.html(textoResaltado);
            }
        });
    });
}

function mostrarExito(mensaje) {
    if (typeof toastr !== 'undefined') {
        toastr.success(mensaje);
    } else {
        alert('✅ ' + mensaje);
    }
}

function mostrarError(mensaje) {
    if (typeof toastr !== 'undefined') {
        toastr.error(mensaje);
    } else {
        alert('❌ ' + mensaje);
    }
}

// Función para mostrar/ocultar indicador de carga
function mostrarLoading(mostrar) {
    if (mostrar) {
        $('#loadingIndicator').show();
        $('#tablaPendientes').hide();
        $('#sinResultados').hide();
    } else {
        $('#loadingIndicator').hide();
        $('#tablaPendientes').show();
    }
}

// Función para obtener clase CSS del estado
function obtenerClaseEstado(estado) {
    switch (estado?.toLowerCase()) {
        case 'pendiente':
            return 'bg-warning text-dark';
        case 'entregado':
            return 'bg-success';
        case 'cancelado':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Función para ver detalles de entrega
function verDetalleEntrega(entregaId) {
    const entrega = entregasPendientes.find(e => e.id === entregaId);
    if (!entrega) {
        mostrarError('No se encontró la entrega seleccionada');
        return;
    }

    // Mostrar modal con detalles
    const detallesHtml = `
        <div class="row">
            <div class="col-md-6">
                <h6>Información General</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Código:</strong></td>
                        <td><code>${entrega.codigoSeguimiento || 'N/A'}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Factura:</strong></td>
                        <td>${entrega.numeroFactura || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Cliente:</strong></td>
                        <td>${entrega.clienteNombre || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Estado:</strong></td>
                        <td>
                            <span class="badge ${obtenerClaseEstado(entrega.estado)}">
                                ${entrega.estado || 'Pendiente'}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Producto</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Producto:</strong></td>
                        <td>${entrega.producto || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Cantidad:</strong></td>
                        <td><span class="badge bg-info">${entrega.cantidad || 0}</span></td>
                    </tr>
                    <tr>
                        <td><strong>Fecha:</strong></td>
                        <td>${entrega.fechaCreacion ? new Date(entrega.fechaCreacion).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;

    $('#detallesPendienteContent').html(detallesHtml);
    modalDetallesPendiente.show();
}

// Función para marcar como entregado
async function marcarComoEntregado(codigoSeguimiento) {
    if (!codigoSeguimiento) {
        mostrarError('Código de seguimiento no válido');
        return;
    }

    // Confirmar acción
    if (!confirm(`¿Confirmar entrega del producto con código: ${codigoSeguimiento}?`)) {
        return;
    }

    try {
        console.log('🚚 Marcando como entregado:', codigoSeguimiento);

        const response = await fetch('/Facturacion/MarcarComoEntregado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                codigoSeguimiento: codigoSeguimiento,
                usuarioEntrega: 1, // Obtener del usuario actual
                observacionesEntrega: 'Entrega confirmada desde lista de pendientes'
            })
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito('Entrega confirmada exitosamente');
            cargarEntregasPendientes(); // Recargar lista
        } else {
            mostrarError('Error al confirmar entrega: ' + (resultado.message || 'Error desconocido'));
        }

    } catch (error) {
        console.error('❌ Error marcando como entregado:', error);
        mostrarError('Error de conexión al confirmar entrega');
    }
}

console.log('🚚 Módulo de entregas pendientes cargado exitosamente');