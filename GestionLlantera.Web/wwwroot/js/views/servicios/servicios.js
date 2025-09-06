// ================================
// MÓDULO DE SERVICIOS DE MECÁNICA
// ================================

let tablaServicios;
let servicioIdEliminar = 0;

// ================================
// INICIALIZACIÓN
// ================================

$(document).ready(function () {
    console.log('🔧 Inicializando módulo de servicios...');
    
    inicializarTabla();
    cargarTiposServicios();
    configurarEventos();
    
    console.log('✅ Módulo de servicios inicializado correctamente');
});

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

    // Búsqueda en tiempo real
    $('#inputBusqueda').on('keyup', function() {
        if (tablaServicios) {
            tablaServicios.search(this.value).draw();
        }
    });

    // Limpiar formulario al cerrar modal
    $('#modalServicio').on('hidden.bs.modal', function () {
        limpiarFormulario();
    });
}

// ================================
// INICIALIZACIÓN DE TABLA
// ================================

function inicializarTabla() {
    if ($.fn.DataTable.isDataTable('#tablaServicios')) {
        $('#tablaServicios').DataTable().destroy();
    }

    tablaServicios = $('#tablaServicios').DataTable({
        processing: true,
        serverSide: false,
        ajax: {
            url: '/Servicios/ObtenerServicios',
            type: 'GET',
            data: function(d) {
                return {
                    busqueda: $('#inputBusqueda').val(),
                    tipoServicio: $('#selectTipoServicio').val(),
                    soloActivos: $('#selectEstado').val(),
                    pagina: 1,
                    tamano: 1000
                };
            },
            dataSrc: function(json) {
                if (json.success) {
                    return json.data.servicios;
                } else {
                    console.error('Error al cargar servicios:', json.message);
                    mostrarNotificacion('Error al cargar servicios', 'error');
                    return [];
                }
            }
        },
        columns: [
            { 
                data: 'servicioId',
                title: 'ID',
                className: 'text-center',
                width: '60px'
            },
            { 
                data: 'nombreServicio',
                title: 'Nombre del Servicio',
                className: 'fw-medium'
            },
            { 
                data: 'tipoServicio',
                title: 'Tipo'
            },
            { 
                data: 'precioBase',
                title: 'Precio Base',
                className: 'text-end precio-cell',
                render: function(data) {
                    return `₡${parseFloat(data).toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
                }
            },
            { 
                data: 'estaActivo',
                title: 'Estado',
                className: 'text-center',
                render: function(data) {
                    return data 
                        ? '<span class="badge bg-success">Activo</span>'
                        : '<span class="badge bg-danger">Inactivo</span>';
                }
            },
            { 
                data: 'fechaCreacion',
                title: 'Fecha Creación',
                className: 'text-center',
                render: function(data) {
                    if (data) {
                        const fecha = new Date(data);
                        return fecha.toLocaleDateString('es-CR');
                    }
                    return '-';
                }
            },
            {
                data: null,
                title: 'Acciones',
                className: 'text-center',
                orderable: false,
                width: '120px',
                render: function(data, type, row) {
                    return `
                        <button type="button" class="btn btn-outline-primary btn-sm" 
                                onclick="editarServicio(${row.servicioId})" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" 
                                onclick="confirmarEliminar(${row.servicioId}, '${row.nombreServicio}')" 
                                title="Desactivar">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        language: {
            url: '/lib/datatables/es-MX.json'
        },
        responsive: true,
        pageLength: 25,
        order: [[1, 'asc']], // Ordenar por nombre
        dom: '<"d-flex justify-content-between align-items-center mb-3"lf>rtip',
        drawCallback: function() {
            // Aplicar tooltips
            $('[title]').tooltip();
        }
    });
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
                $('#servicioId').val(servicio.servicioId);
                $('#nombreServicio').val(servicio.nombreServicio);
                $('#tipoServicio').val(servicio.tipoServicio);
                $('#precioBase').val(servicio.precioBase);
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

    const url = servicioId === 0 ? '/Servicios/CrearServicio' : `/Servicios/ActualizarServicio`;
    const method = servicioId === 0 ? 'POST' : 'PUT';
    const urlParams = servicioId === 0 ? {} : { id: servicioId };

    $.ajax({
        url: url,
        type: method,
        data: urlParams,
        contentType: 'application/json',
        data: JSON.stringify(datos),
        success: function(response) {
            btn.removeClass('loading');
            
            if (response.success) {
                $('#modalServicio').modal('hide');
                tablaServicios.ajax.reload();
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
                tablaServicios.ajax.reload();
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

function cargarTiposServicios() {
    $.ajax({
        url: '/Servicios/ObtenerTiposServicios',
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const select = $('#selectTipoServicio');
                select.find('option:not(:first)').remove();
                
                response.data.forEach(function(tipo) {
                    select.append(`<option value="${tipo}">${tipo}</option>`);
                });
            }
        },
        error: function() {
            console.warn('No se pudieron cargar los tipos de servicios');
        }
    });
}

function filtrarServicios() {
    if (tablaServicios) {
        tablaServicios.ajax.reload();
    }
}

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
    if (tablaServicios) {
        tablaServicios.ajax.reload();
    }
}