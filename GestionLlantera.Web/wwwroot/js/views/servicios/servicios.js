
// ================================
// MÓDULO DE SERVICIOS DE MECÁNICA
// ================================

let servicios = [];
let servicioIdEliminar = 0;

// ================================
// INICIALIZACIÓN
// ================================

$(document).ready(function () {
    console.log('🔧 Inicializando módulo de servicios...');

    // Verificar que jQuery esté cargado
    if (!window.jQuery) {
        console.error('jQuery no está cargado');
        return;
    }

    // Inicializar módulo
    inicializarModulo();
    
    console.log('✅ Módulo de servicios inicializado correctamente');
});

function inicializarModulo() {
    configurarEventos();
    cargarServicios();
}

// ================================
// CONFIGURACIÓN DE EVENTOS
// ================================

function configurarEventos() {
    // Formulario de servicio
    $('#formServicio').on('submit', function(e) {
        e.preventDefault();
        guardarServicio();
    });

    // Botón confirmar eliminar
    $('#btnConfirmarEliminar').on('click', function() {
        eliminarServicio(servicioIdEliminar);
    });

    // Limpiar formulario al cerrar modal
    $('#modalServicio').on('hidden.bs.modal', function () {
        limpiarFormulario();
    });

    // Búsqueda simple
    $('#inputBusqueda').on('keyup', function() {
        filtrarServicios();
    });

    // Filtro por estado
    $('#selectEstado').on('change', function() {
        filtrarServicios();
    });
}

// ================================
// CARGA Y GESTIÓN DE DATOS
// ================================

function cargarServicios() {
    mostrarLoading(true);

    $.ajax({
        url: '/Servicios/ObtenerServicios',
        type: 'GET',
        success: function(response) {
            console.log('📋 Datos recibidos del servidor:', response);

            if (Array.isArray(response)) {
                servicios = response;
                mostrarServicios();
            } else {
                console.error('❌ Respuesta no es un array:', response);
                mostrarNotificacion('Error en el formato de datos de servicios', 'error');
                mostrarEmptyState();
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error al cargar servicios:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            mostrarNotificacion('Error al cargar servicios: ' + error, 'error');
            mostrarEmptyState();
        },
        complete: function() {
            mostrarLoading(false);
        }
    });
}

function mostrarServicios() {
    const tbody = $('#tablaServiciosBody');
    tbody.empty();

    let serviciosFiltrados = [...servicios];

    // Aplicar filtros
    const busqueda = $('#inputBusqueda').val().toLowerCase();
    const estado = $('#selectEstado').val();

    if (busqueda) {
        serviciosFiltrados = serviciosFiltrados.filter(servicio => 
            (servicio.nombreServicio && servicio.nombreServicio.toLowerCase().includes(busqueda)) ||
            (servicio.tipoServicio && servicio.tipoServicio.toLowerCase().includes(busqueda)) ||
            (servicio.descripcion && servicio.descripcion.toLowerCase().includes(busqueda))
        );
    }

    if (estado === 'true' || estado === true) {
        serviciosFiltrados = serviciosFiltrados.filter(servicio => servicio.estaActivo === true);
    } else if (estado === 'false' || estado === false) {
        serviciosFiltrados = serviciosFiltrados.filter(servicio => servicio.estaActivo === false);
    }

    if (serviciosFiltrados.length === 0) {
        mostrarEmptyState();
        return;
    }

    serviciosFiltrados.forEach(servicio => {
        const fila = crearFilaServicio(servicio);
        tbody.append(fila);
    });

    $('#emptyState').hide();
}

function crearFilaServicio(servicio) {
    const estadoBadge = servicio.estaActivo ? 
        '<span class="badge bg-success">Activo</span>' : 
        '<span class="badge bg-danger">Inactivo</span>';

    const fechaCreacion = servicio.fechaCreacion ? 
        new Date(servicio.fechaCreacion).toLocaleDateString('es-CR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) : '-';

    const precioFormateado = servicio.precioBase ? 
        `₡${Number(servicio.precioBase).toLocaleString('es-CR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}` : '₡0';

    return `
        <tr>
            <td>${servicio.servicioId || servicio.id || ''}</td>
            <td><strong>${servicio.nombreServicio || servicio.nombre || ''}</strong></td>
            <td>${servicio.tipoServicio || servicio.tipo || ''}</td>
            <td class="precio-cell">${precioFormateado}</td>
            <td>${estadoBadge}</td>
            <td>${fechaCreacion}</td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm" 
                            onclick="editarServicio(${servicio.servicioId || servicio.id})" 
                            title="Editar servicio">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" 
                            onclick="confirmarEliminar(${servicio.servicioId || servicio.id}, '${(servicio.nombreServicio || servicio.nombre || '').replace(/'/g, '&#39;')}')" 
                            title="Desactivar servicio">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// ================================
// FILTROS Y BÚSQUEDA
// ================================

function filtrarServicios() {
    mostrarServicios();
}

// ================================
// GESTIÓN DE SERVICIOS
// ================================

function abrirModalNuevoServicio() {
    limpiarFormulario();
    $('#modalServicioLabel').text('Nuevo Servicio');
    $('#servicioId').val(0);
    $('#modalServicio').modal('show');
}

function editarServicio(servicioId) {
    console.log(`📝 Editando servicio ID: ${servicioId}`);

    $.ajax({
        url: `/Servicios/ObtenerServicioPorId`,
        type: 'GET',
        data: { id: servicioId },
        success: function(response) {
            if (response.success) {
                const servicio = response.data;

                $('#modalServicioLabel').text('Editar Servicio');
                $('#servicioId').val(servicio.servicioId || servicio.id);
                $('#nombreServicio').val(servicio.nombreServicio || servicio.nombre);
                $('#tipoServicio').val(servicio.tipoServicio || servicio.tipo);
                $('#precioBase').val(servicio.precioBase || servicio.precio);
                $('#descripcion').val(servicio.descripcion);
                $('#observaciones').val(servicio.observaciones);
                $('#estaActivo').prop('checked', servicio.estaActivo);

                $('#modalServicio').modal('show');
            } else {
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function() {
            mostrarNotificacion('Error al obtener los datos del servicio', 'error');
        }
    });
}

function guardarServicio() {
    const btn = $('#btnGuardarServicio');
    btn.addClass('loading');

    limpiarValidaciones();

    const servicioId = parseInt($('#servicioId').val());
    const datos = {
        servicioId: servicioId,
        nombreServicio: $('#nombreServicio').val().trim(),
        tipoServicio: $('#tipoServicio').val().trim(),
        precioBase: parseFloat($('#precioBase').val()),
        descripcion: $('#descripcion').val().trim(),
        observaciones: $('#observaciones').val().trim(),
        estaActivo: $('#estaActivo').is(':checked')
    };

    // Validación básica del lado cliente
    let esValido = true;

    if (!datos.nombreServicio) {
        mostrarErrorCampo('#nombreServicio', 'El nombre del servicio es obligatorio');
        esValido = false;
    }

    if (!datos.tipoServicio) {
        mostrarErrorCampo('#tipoServicio', 'El tipo de servicio es obligatorio');
        esValido = false;
    }

    if (!datos.precioBase || datos.precioBase <= 0) {
        mostrarErrorCampo('#precioBase', 'El precio base debe ser mayor a 0');
        esValido = false;
    }

    if (!esValido) {
        btn.removeClass('loading');
        return;
    }

    const url = servicioId === 0 ? '/Servicios/CrearServicio' : `/Servicios/ActualizarServicio/${servicioId}`;
    const method = servicioId === 0 ? 'POST' : 'PUT';

    $.ajax({
        url: url,
        type: method,
        contentType: 'application/json',
        data: JSON.stringify(datos),
        success: function(response) {
            btn.removeClass('loading');

            if (response.success) {
                $('#modalServicio').modal('hide');
                cargarServicios();
                mostrarNotificacion(response.message, 'success');
            } else {
                if (response.errors) {
                    mostrarErroresValidacion(response.errors);
                } else {
                    mostrarNotificacion(response.message, 'error');
                }
            }
        },
        error: function(xhr) {
            btn.removeClass('loading');

            if (xhr.responseJSON && xhr.responseJSON.message) {
                mostrarNotificacion(xhr.responseJSON.message, 'error');
            } else {
                mostrarNotificacion('Error al guardar el servicio', 'error');
            }
        }
    });
}

function confirmarEliminar(servicioId, nombreServicio) {
    servicioIdEliminar = servicioId;
    $('#nombreServicioEliminar').text(nombreServicio);
    $('#modalConfirmarEliminar').modal('show');
}

function eliminarServicio(servicioId) {
    const btn = $('#btnConfirmarEliminar');
    btn.addClass('loading');

    $.ajax({
        url: `/Servicios/EliminarServicio`,
        type: 'DELETE',
        data: { id: servicioId },
        success: function(response) {
            btn.removeClass('loading');

            if (response.success) {
                $('#modalConfirmarEliminar').modal('hide');
                cargarServicios();
                mostrarNotificacion(response.message, 'success');
            } else {
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function() {
            btn.removeClass('loading');
            mostrarNotificacion('Error al eliminar el servicio', 'error');
        }
    });
}

// ================================
// UTILIDADES
// ================================

function limpiarFormulario() {
    $('#formServicio')[0].reset();
    $('#servicioId').val(0);
    $('#estaActivo').prop('checked', true);
    limpiarValidaciones();
}

function limpiarValidaciones() {
    $('.form-control, .form-select').removeClass('is-invalid');
    $('.invalid-feedback').text('');
}

function mostrarErrorCampo(selector, mensaje) {
    $(selector).addClass('is-invalid');
    $(selector).siblings('.invalid-feedback').text(mensaje);
}

function mostrarErroresValidacion(errores) {
    for (const campo in errores) {
        const selector = `#${campo}`;
        mostrarErrorCampo(selector, errores[campo][0]);
    }
}

function mostrarLoading(mostrar) {
    if (mostrar) {
        $('#loadingSpinner').show();
        $('#emptyState').hide();
    } else {
        $('#loadingSpinner').hide();
    }
}

function mostrarEmptyState() {
    $('#emptyState').show();
    $('#loadingSpinner').hide();
}

function mostrarNotificacion(mensaje, tipo) {
    // Implementar según el sistema de notificaciones que uses
    // Por ejemplo: Toastr, SweetAlert, etc.

    if (typeof toastr !== 'undefined') {
        toastr[tipo](mensaje);
    } else {
        // Fallback a alert nativo
        alert(mensaje);
    }
}

// ================================
// FUNCIONES GLOBALES
// ================================

// Función para recargar la tabla desde el exterior
function recargarTablaServicios() {
    cargarServicios();
}
