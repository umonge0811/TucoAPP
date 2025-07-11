
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
        
        // Obtener información del usuario actual
        const usuarioActual = obtenerUsuarioActual();
        const usuarioId = usuarioActual?.usuarioId || usuarioActual?.id || 1;
        
        const datosEntrega = {
            pendienteId: pendienteId,
            cantidadAEntregar: cantidadAEntregar,
            usuarioEntrega: usuarioId,
            observacionesEntrega: observaciones
        };
        
        console.log('🚚 Confirmando entrega:', datosEntrega);
        
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
            mostrarExito('Entrega confirmada exitosamente');
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

console.log('🚚 Módulo de entregas pendientes cargado exitosamente');
