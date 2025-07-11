// =========================================
// GESTIÓN DE ENTREGAS PENDIENTES
// =========================================

let pendientesData = [];
let modalMarcarEntregado;
let modalDetallesPendiente;

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
    $('#btnFiltrar').on('click', cargarPendientes);
    $('#btnLimpiar').on('click', limpiarFiltros);
    $('#btnRefrescar').on('click', cargarPendientes);

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

        mostrarPendientes(pendientesData);

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
    const tbody = $('#bodyPendientes');
    tbody.empty();

    if (!pendientes || pendientes.length === 0) {
        $('#sinResultados').show();
        $('#tablaPendientes').hide();
        return;
    }

    $('#sinResultados').hide();
    $('#tablaPendientes').show();

    pendientes.forEach(pendiente => {
        const fila = crearFilaPendiente(pendiente);
        tbody.append(fila);
    });
}

function crearFilaPendiente(pendiente) {
    const estadoClass = pendiente.estado === 'Entregado' ? 'success' : 'warning';
    const fechaCreacion = new Date(pendiente.fechaCreacion).toLocaleDateString('es-ES');

    // Usar directamente el código de seguimiento de la base de datos
    const codigoSeguimiento = pendiente.codigoSeguimiento || 'Sin código';

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
                <span class="badge bg-warning">${pendiente.cantidadPendiente || 0}</span>
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
                    <button type="button" class="btn btn-outline-success btn-sm" 
                            onclick="abrirModalEntrega(${pendiente.id})" 
                            title="Marcar como entregado">
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

    // Llenar datos del modal
    $('#pendienteId').val(pendiente.id);
    $('#nombreProducto').val(pendiente.nombreProducto || 'Producto sin nombre');
    $('#cantidadPendiente').val(pendiente.cantidadPendiente || 0);
    $('#maxCantidad').text(pendiente.cantidadPendiente || 0);
    $('#cantidadAEntregar').val(pendiente.cantidadPendiente || 0);
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

        const response = await fetch('/Facturacion/MarcarComoEntregado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosEntrega),
            credentials: 'include'
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito('Entrega confirmada exitosamente - Código: ' + codigoSeguimiento);
            modalMarcarEntregado.hide();
            cargarPendientes(); // Recargar la lista
        } else {
            mostrarError('Error confirmando entrega: ' + (resultado.message || 'Error desconocido'));
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

function limpiarFiltros() {
    $('#filtroEstado').val('');
    $('#filtroCodigo').val('');
    $('#filtroFechaDesde').val('');
    $('#filtroFechaHasta').val('');

    cargarPendientes();
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
/**
 * Módulo de entregas pendientes
 * Maneja la carga y gestión de entregas pendientes
 */

console.log('🚚 Módulo de entregas pendientes cargado');

// Variables globales
let entregasPendientes = [];
let configEntregas = {
    urlBase: '/Facturacion/',
    cargando: false
};

// Configuración de filtros
let filtrosConfig = {
    activos: {
        texto: '',
        estado: '',
        cliente: '',
        factura: '',
        fechaDesde: '',
        fechaHasta: '',
        cantidad: '',
        ordenamiento: 'codigo'
    },
    contadores: {
        total: 0,
        pendientes: 0,
        entregadas: 0
    }
};
// Función para cargar entregas pendientes
async function cargarEntregasPendientes() {
    try {
        console.log('📋 Cargando entregas pendientes...');

        configEntregas.cargando = true;
        mostrarLoading(true);

        const response = await fetch(`${configEntregas.urlBase}ObtenerEntregasPendientes`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Respuesta recibida:', data);

        if (data.success) {
            entregasPendientes = data.data || [];
            console.log(`✅ Cargadas ${entregasPendientes.length} entregas pendientes`);

            // Actualizar contadores
            actualizarContadores();

            // Mostrar en tabla
            mostrarEntregasPendientes();

            // Aplicar filtros si existen
            aplicarFiltros();
        } else {
            console.error('❌ Error en la respuesta:', data.message);
            mostrarError(data.message || 'Error al cargar entregas pendientes');
        }

    } catch (error) {
        console.error('❌ Error cargando entregas pendientes:', error);
        mostrarError('Error al cargar entregas pendientes: ' + error.message);
    } finally {
        configEntregas.cargando = false;
        mostrarLoading(false);
    }
}

// Función para actualizar contadores
function actualizarContadores() {
    const totalEntregas = entregasPendientes.length;
    const pendientes = entregasPendientes.filter(e => e.estado && e.estado.toLowerCase() === 'pendiente').length;
    const entregadas = entregasPendientes.filter(e => e.estado && e.estado.toLowerCase() === 'entregado').length;

    filtrosConfig.contadores.total = totalEntregas;
    filtrosConfig.contadores.pendientes = pendientes;
    filtrosConfig.contadores.entregadas = entregadas;

    // Actualizar UI
    $('#contadorEntregas').text(totalEntregas);
    $('#contadorPendientes').text(pendientes);
    $('#contadorEntregadas').text(entregadas);
}
// Función para mostrar entregas pendientes en la tabla
function mostrarEntregasPendientes() {
    const tbody = document.querySelector('#tablaEntregasPendientes tbody');
    if (!tbody) {
        console.error('❌ No se encontró el tbody de la tabla');
        return;
    }

    // Limpiar tabla
    tbody.innerHTML = '';

    if (!entregasPendientes || entregasPendientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox display-4 d-block mb-2"></i>
                    No hay entregas pendientes
                </td>
            </tr>
        `;
        return;
    }

    // Generar filas
    entregasPendientes.forEach(entrega => {
        const fila = document.createElement('tr');
        fila.setAttribute('data-entrega-id', entrega.id);
        fila.innerHTML = `
            <td>${entrega.codigoSeguimiento || 'N/A'}</td>
            <td>${entrega.numeroFactura || 'N/A'}</td>
            <td>${entrega.clienteNombre || 'N/A'}</td>
            <td>${entrega.producto || 'N/A'}</td>
            <td class="text-center">${entrega.cantidad || 0}</td>
            <td class="text-center">
                <span class="badge ${obtenerClaseEstado(entrega.estado)}">
                    ${entrega.estado || 'Pendiente'}
                </span>
            </td>
            <td class="text-center">
                ${entrega.fechaCreacion ? new Date(entrega.fechaCreacion).toLocaleDateString() : 'N/A'}
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary" onclick="verDetalleEntrega(${entrega.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-success" onclick="marcarComoEntregado('${entrega.codigoSeguimiento}')">
                        <i class="bi bi-check-circle"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(fila);
    });

    console.log(`✅ Se mostraron ${entregasPendientes.length} entregas en la tabla`);
}

// ========================================
// FUNCIONES DE FILTRADO
// ========================================

// Función principal para aplicar filtros
function aplicarFiltros() {
    console.log('🔍 Aplicando filtros:', filtrosConfig.activos);

    let entregasFiltradas = [...entregasPendientes];

    // Aplicar filtros
    if (filtrosConfig.activos.texto) {
        entregasFiltradas = filtrarPorTexto(entregasFiltradas, filtrosConfig.activos.texto);
    }

    if (filtrosConfig.activos.estado) {
        entregasFiltradas = filtrarPorEstado(entregasFiltradas, filtrosConfig.activos.estado);
    }

    if (filtrosConfig.activos.cliente) {
        entregasFiltradas = filtrarPorCliente(entregasFiltradas, filtrosConfig.activos.cliente);
    }

    if (filtrosConfig.activos.factura) {
        entregasFiltradas = filtrarPorFactura(entregasFiltradas, filtrosConfig.activos.factura);
    }

    if (filtrosConfig.activos.fechaDesde || filtrosConfig.activos.fechaHasta) {
        entregasFiltradas = filtrarPorFechas(entregasFiltradas, filtrosConfig.activos.fechaDesde, filtrosConfig.activos.fechaHasta);
    }

    if (filtrosConfig.activos.cantidad) {
        entregasFiltradas = filtrarPorCantidad(entregasFiltradas, filtrosConfig.activos.cantidad);
    }

    // Ordenar
    entregasFiltradas = ordenarEntregas(entregasFiltradas, filtrosConfig.activos.ordenamiento);

    // Mostrar/ocultar filas
    mostrarEntregasFiltradas(entregasFiltradas);

    // Actualizar contadores
    actualizarContadoresFiltrados(entregasFiltradas);

    // Actualizar indicadores de filtros
    actualizarIndicadoresFiltros();
}

// Filtrar por texto
function filtrarPorTexto(entregas, texto) {
    const textoLower = texto.toLowerCase();
    return entregas.filter(entrega => {
        return (entrega.codigoSeguimiento && entrega.codigoSeguimiento.toLowerCase().includes(textoLower)) ||
               (entrega.numeroFactura && entrega.numeroFactura.toLowerCase().includes(textoLower)) ||
               (entrega.clienteNombre && entrega.clienteNombre.toLowerCase().includes(textoLower)) ||
               (entrega.producto && entrega.producto.toLowerCase().includes(textoLower));
    });
}

// Filtrar por estado
function filtrarPorEstado(entregas, estado) {
    return entregas.filter(entrega => {
        const estadoEntrega = entrega.estado ? entrega.estado.toLowerCase() : 'pendiente';
        return estadoEntrega === estado;
    });
}

// Filtrar por cliente
function filtrarPorCliente(entregas, cliente) {
    const clienteLower = cliente.toLowerCase();
    return entregas.filter(entrega => {
        return entrega.clienteNombre && entrega.clienteNombre.toLowerCase().includes(clienteLower);
    });
}

// Filtrar por factura
function filtrarPorFactura(entregas, factura) {
    const facturaLower = factura.toLowerCase();
    return entregas.filter(entrega => {
        return entrega.numeroFactura && entrega.numeroFactura.toLowerCase().includes(facturaLower);
    });
}

// Filtrar por rango de fechas
function filtrarPorFechas(entregas, fechaDesde, fechaHasta) {
    return entregas.filter(entrega => {
        if (!entrega.fechaCreacion) return false;

        const fechaEntrega = new Date(entrega.fechaCreacion);
        let cumpleFecha = true;

        if (fechaDesde) {
            const fechaDesdeObj = new Date(fechaDesde);
            if (fechaEntrega < fechaDesdeObj) cumpleFecha = false;
        }

        if (fechaHasta && cumpleFecha) {
            const fechaHastaObj = new Date(fechaHasta);
            fechaHastaObj.setHours(23, 59, 59, 999);
            if (fechaEntrega > fechaHastaObj) cumpleFecha = false;
        }

        return cumpleFecha;
    });
}

// Filtrar por cantidad
function filtrarPorCantidad(entregas, tipoCantidad) {
    return entregas.filter(entrega => {
        const cantidad = parseInt(entrega.cantidad) || 0;

        switch (tipoCantidad) {
            case 'baja':
                return cantidad >= 1 && cantidad <= 5;
            case 'media':
                return cantidad >= 6 && cantidad <= 15;
            case 'alta':
                return cantidad >= 16;
            default:
                return true;
        }
    });
}

// Ordenar entregas
function ordenarEntregas(entregas, criterio) {
    return entregas.sort((a, b) => {
        switch (criterio) {
            case 'codigo':
                return (a.codigoSeguimiento || '').localeCompare(b.codigoSeguimiento || '');
            case 'factura':
                return (a.numeroFactura || '').localeCompare(b.numeroFactura || '');
            case 'cliente':
                return (a.clienteNombre || '').localeCompare(b.clienteNombre || '');
            case 'fecha':
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            default:
                return 0;
        }
    });
}

// Mostrar entregas filtradas
function mostrarEntregasFiltradas(entregasFiltradas) {
    const tbody = document.querySelector('#tablaEntregasPendientes tbody');
    const todasLasFilas = tbody.querySelectorAll('tr');

    // Ocultar todas las filas
    todasLasFilas.forEach(fila => {
        fila.style.display = 'none';
    });

    // Mostrar filas filtradas
    entregasFiltradas.forEach(entrega => {
        const fila = tbody.querySelector(`tr[data-entrega-id="${entrega.id}"]`);
        if (fila) {
            fila.style.display = '';
        }
    });

    // Mostrar mensaje si no hay resultados
    if (entregasFiltradas.length === 0) {
        const filaMensaje = document.createElement('tr');
        filaMensaje.innerHTML = `
            <td colspan="8" class="text-center text-muted py-4">
                <i class="bi bi-search display-4 d-block mb-2"></i>
                No se encontraron entregas con los filtros aplicados
            </td>
        `;
        tbody.appendChild(filaMensaje);
    }
}

// Actualizar contadores filtrados
function actualizarContadoresFiltrados(entregasFiltradas) {
    const totalFiltradas = entregasFiltradas.length;
    const pendientesFiltradas = entregasFiltradas.filter(e => e.estado && e.estado.toLowerCase() === 'pendiente').length;
    const entregadasFiltradas = entregasFiltradas.filter(e => e.estado && e.estado.toLowerCase() === 'entregado').length;

    $('#contadorEntregas').text(totalFiltradas);
    $('#contadorPendientes').text(pendientesFiltradas);
    $('#contadorEntregadas').text(entregadasFiltradas);
}

// Actualizar indicadores de filtros
function actualizarIndicadoresFiltros() {
    const filtrosActivos = Object.values(filtrosConfig.activos).filter(valor => valor && valor !== '').length;

    if (filtrosActivos > 0) {
        $('#contadorFiltrosActivos').text(filtrosActivos + ' activos').show();
        $('#indicadoresFiltros').show();

        // Generar tags de filtros activos
        const tagsContainer = $('#tagsFiltrosActivos');
        tagsContainer.empty();

        Object.keys(filtrosConfig.activos).forEach(key => {
            const valor = filtrosConfig.activos[key];
            if (valor && valor !== '') {
                const tag = $(`
                    <span class="badge bg-secondary me-1">
                        ${key}: ${valor}
                        <button type="button" class="btn-close btn-close-white ms-1" onclick="limpiarFiltro('${key}')"></button>
                    </span>
                `);
                tagsContainer.append(tag);
            }
        });
    } else {
        $('#contadorFiltrosActivos').hide();
        $('#indicadoresFiltros').hide();
    }
}

// Limpiar filtro específico
function limpiarFiltro(filtro) {
    filtrosConfig.activos[filtro] = '';

    // Limpiar el input correspondiente
    switch (filtro) {
        case 'texto':
            $('#searchText').val('');
            break;
        case 'estado':
            $('#filterEstado').val('');
            break;
        case 'cliente':
            $('#filterCliente').val('');
            break;
        case 'factura':
            $('#filterFactura').val('');
            break;
        case 'fechaDesde':
            $('#filterFechaDesde').val('');
            break;
        case 'fechaHasta':
            $('#filterFechaHasta').val('');
            break;
        case 'cantidad':
            $('#filterCantidad').val('');
            break;
        case 'ordenamiento':
            $('#sortBy').val('codigo');
            break;
    }

    aplicarFiltros();
}

// Limpiar todos los filtros
function limpiarTodosLosFiltros() {
    // Resetear configuración
    filtrosConfig.activos = {
        texto: '',
        estado: '',
        cliente: '',
        factura: '',
        fechaDesde: '',
        fechaHasta: '',
        cantidad: '',
        ordenamiento: 'codigo'
    };

    // Limpiar inputs
    $('#searchText').val('');
    $('#filterEstado').val('');
    $('#filterCliente').val('');
    $('#filterFactura').val('');
    $('#filterFechaDesde').val('');
    $('#filterFechaHasta').val('');
    $('#filterCantidad').val('');
    $('#sortBy').val('codigo');

    // Aplicar filtros (mostrará todos)
    aplicarFiltros();
}
// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚚 Inicializando módulo de entregas pendientes');

    // Configurar event listeners
    configurarEventListeners();

    // Cargar entregas pendientes al iniciar
    cargarEntregasPendientes();
});

// Configurar event listeners
function configurarEventListeners() {
    // Botón refrescar
    const btnRefrescar = document.getElementById('btnRefrescar');
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', function() {
            console.log('🔄 Refrescando entregas pendientes...');
            cargarEntregasPendientes();
        });
    }

    // ========================================
    // EVENT LISTENERS PARA FILTROS
    // ========================================

    // Filtro de texto con debounce
    let timeoutBusqueda;
    $('#searchText').on('input', function() {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            filtrosConfig.activos.texto = $(this).val();
            aplicarFiltros();
        }, 300);
    });

    // Filtro por estado
    $('#filterEstado').on('change', function() {
        filtrosConfig.activos.estado = $(this).val();
        aplicarFiltros();
    });

    // Filtro por cliente con debounce
    let timeoutCliente;
    $('#filterCliente').on('input', function() {
        clearTimeout(timeoutCliente);
        timeoutCliente = setTimeout(() => {
            filtrosConfig.activos.cliente = $(this).val();
            aplicarFiltros();
        }, 300);
    });

    // Filtro por factura con debounce
    let timeoutFactura;
    $('#filterFactura').on('input', function() {
        clearTimeout(timeoutFactura);
        timeoutFactura = setTimeout(() => {
            filtrosConfig.activos.factura = $(this).val();
            aplicarFiltros();
        }, 300);
    });

    // Filtros de fecha
    $('#filterFechaDesde').on('change', function() {
        filtrosConfig.activos.fechaDesde = $(this).val();
        aplicarFiltros();
    });

    $('#filterFechaHasta').on('change', function() {
        filtrosConfig.activos.fechaHasta = $(this).val();
        aplicarFiltros();
    });

    // Filtro por cantidad
    $('#filterCantidad').on('change', function() {
        filtrosConfig.activos.cantidad = $(this).val();
        aplicarFiltros();
    });

    // Ordenamiento
    $('#sortBy').on('change', function() {
        filtrosConfig.activos.ordenamiento = $(this).val();
        aplicarFiltros();
    });

    // ========================================
    // CONTROLES DE FILTROS
    // ========================================

    // Limpiar búsqueda
    $('#btnLimpiarBusqueda').on('click', function() {
        $('#searchText').val('');
        filtrosConfig.activos.texto = '';
        aplicarFiltros();
    });

    // Limpiar todos los filtros
    $('#btnLimpiarFiltros').on('click', function() {
        limpiarTodosLosFiltros();
    });

    // Toggle para filtros avanzados
    const filtrosAvanzados = document.getElementById('filtrosEntregasPendientes');
    const iconoColapsar = document.getElementById('iconoColapsarFiltros');

    if (filtrosAvanzados && iconoColapsar) {
        filtrosAvanzados.addEventListener('show.bs.collapse', function() {
            iconoColapsar.className = 'bi bi-chevron-up';
        });

        filtrosAvanzados.addEventListener('hide.bs.collapse', function() {
            iconoColapsar.className = 'bi bi-chevron-down';
        });
    }
}