// ===== GESTIÓN DE CLIENTES - JAVASCRIPT =====

let modalCliente = null;
let clientes = [];
let clienteEditando = null;

// ===== INICIALIZACIÓN =====
$(document).ready(function() {
    console.log('🚀 Inicializando gestión de clientes');
    inicializarClientes();
});

function inicializarClientes() {
    try {
        // Inicializar modal
        const modalElement = document.getElementById('modalCliente');
        if (modalElement) {
            modalCliente = new bootstrap.Modal(modalElement);
        }

        // Configurar eventos
        configurarEventos();

        // Cargar clientes iniciales
        cargarClientes();

        console.log('✅ Gestión de clientes inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando gestión de clientes:', error);
    }
}

function configurarEventos() {
    // Búsqueda de clientes
    $('#buscarClientes').on('input', debounce(function() {
        const termino = $(this).val().trim();
        if (termino.length >= 2 || termino.length === 0) {
            buscarClientes(termino);
        }
    }, 300));

    // Limpiar filtros
    $('#btnLimpiarFiltros').on('click', function() {
        $('#buscarClientes').val('');
        cargarClientes();
    });

    // ✅ EVENTOS DELEGADOS COMO EN INVENTARIO (funcionan con contenido dinámico)

    // Nuevo cliente - evento delegado
    $(document).on('click', '#btnNuevoCliente', function() {
        if (window.permisosUsuario && (window.permisosUsuario.puedeCrearClientes || window.permisosUsuario.esAdmin)) {
            abrirModalNuevoCliente();
        } else {
            mostrarError('No tienes permisos para crear clientes');
        }
    });

    // Editar cliente - evento delegado (como en inventario)
    $(document).on('click', '.btn-editar-cliente', function() {
        if (window.permisosUsuario && (window.permisosUsuario.puedeEditarClientes || window.permisosUsuario.esAdmin)) {
            const clienteId = $(this).data('cliente-id');
            editarCliente(clienteId);
        } else {
            mostrarError('No tienes permisos para editar clientes');
        }
    });

    // Eliminar cliente - evento delegado (como en inventario)
    $(document).on('click', '.btn-eliminar-cliente', function() {
        if (window.permisosUsuario && (window.permisosUsuario.puedeEliminarClientes || window.permisosUsuario.esAdmin)) {
            const clienteId = $(this).data('cliente-id');
            eliminarCliente(clienteId);
        } else {
            mostrarError('No tienes permisos para eliminar clientes');
        }
    });

    // Guardar cliente
    $('#btnGuardarCliente').on('click', function() {
        guardarCliente();
    });

    // Limpiar formulario al cerrar modal
    $('#modalCliente').on('hidden.bs.modal', function() {
        limpiarFormularioCliente();
    });

    // Validación en tiempo real mejorada
    $('#nombreCliente, #emailCliente, #telefonoCliente, #contactoCliente, #direccionCliente').on('input blur', function() {
        validarCampoEnTiempoReal($(this));
    });
}

// ===== CARGA DE DATOS =====
async function cargarClientes() {
    try {
        console.log('🔄 Cargando lista de clientes...');

        // ✅ CARGAR PERMISOS PRIMERO (como en inventario)
        await cargarPermisosUsuario();

        const response = await fetch('/Clientes/ObtenerClientes');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📦 Respuesta del servidor:', resultado);

        if (resultado.success && Array.isArray(resultado.data)) {
            clientes = resultado.data;
            console.log(`✅ ${clientes.length} clientes cargados exitosamente`);
            mostrarClientes(clientes);
        } else {
            console.warn('⚠️ No se obtuvieron datos válidos:', resultado);
            mostrarError(resultado.message || 'No se pudieron cargar los clientes');
        }

    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        mostrarError('Error al cargar los clientes');
    }
}

// ✅ NUEVA FUNCIÓN: Cargar permisos del usuario (replicando inventario)
async function cargarPermisosUsuario() {
    try {
        console.log('🔒 Cargando permisos del usuario...');

        const response = await fetch('/api/permisos/usuario-actual');
        if (response.ok) {
            const resultado = await response.json();
            if (resultado.success) {
                window.permisosUsuario = {
                    puedeCrearClientes: resultado.permisos.puedeCrearClientes || false,
                    puedeEditarClientes: resultado.permisos.puedeEditarClientes || false,
                    puedeEliminarClientes: resultado.permisos.puedeEliminarClientes || false,
                    esAdmin: resultado.permisos.esAdmin || false
                };
                console.log('✅ Permisos cargados:', window.permisosUsuario);
            }
        } else {
            console.warn('⚠️ No se pudieron cargar permisos, usando valores por defecto');
            window.permisosUsuario = {
                puedeCrearClientes: false,
                puedeEditarClientes: false,
                puedeEliminarClientes: false,
                esAdmin: false
            };
        }
    } catch (error) {
        console.error('❌ Error cargando permisos:', error);
        window.permisosUsuario = {
            puedeCrearClientes: false,
            puedeEditarClientes: false,
            puedeEliminarClientes: false,
            esAdmin: false
        };
    }
}

async function buscarClientes(termino) {
    try {
        mostrarEstadoCarga(true);
        console.log(`🔍 Buscando clientes: "${termino}"`);

        const response = await fetch(`/Clientes/BuscarClientes?termino=${encodeURIComponent(termino)}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            clientes = resultado.data;
            mostrarClientes(clientes);
        } else {
            mostrarSinResultados();
        }

    } catch (error) {
        console.error('❌ Error buscando clientes:', error);
        mostrarError('Error al buscar clientes');
    } finally {
        mostrarEstadoCarga(false);
    }
}

// ===== MOSTRAR DATOS =====
function mostrarClientes(clientesData) {
    const tbody = $('#tablaClientes tbody');
    tbody.empty();

    if (!clientesData || clientesData.length === 0) {
        mostrarSinResultados();
        return;
    }

    clientesData.forEach(cliente => {
        // ✅ GENERAR BOTONES SIEMPRE (como en inventario), la validación se hace en los eventos
        const fila = `
            <tr>
                <td><strong>${cliente.nombre}</strong></td>
                <td>${cliente.contacto}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.direccion}</td>
                <td class="text-center">
                    <button type="button" 
                            class="btn btn-sm btn-editar btn-accion btn-editar-cliente"
                            data-cliente-id="${cliente.id}"
                            title="Editar cliente">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" 
                            class="btn btn-sm btn-eliminar btn-accion btn-eliminar-cliente"
                            data-cliente-id="${cliente.id}"
                            title="Eliminar cliente">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.append(fila);
    });

    ocultarEstadosEspeciales();
}

// ===== MODAL DE CLIENTE =====
function abrirModalNuevoCliente() {
    clienteEditando = null;
    $('#modalClienteLabel').text('Nuevo Cliente');
    $('#btnGuardarCliente').html('<i class="bi bi-check-circle me-1"></i>Crear Cliente');

    if (modalCliente) {
        modalCliente.show();
    }
}

async function editarCliente(clienteId) {
    try {
        console.log(`✏️ Editando cliente: ${clienteId}`);

        const response = await fetch(`/Clientes/ObtenerClientePorId?id=${clienteId}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            clienteEditando = resultado.data;
            llenarFormularioCliente(resultado.data);

            $('#modalClienteLabel').text('Editar Cliente');
            $('#btnGuardarCliente').html('<i class="bi bi-check-circle me-1"></i>Actualizar Cliente');

            if (modalCliente) {
                modalCliente.show();
            }
        } else {
            mostrarError('No se pudo cargar la información del cliente');
        }

    } catch (error) {
        console.error('❌ Error cargando cliente para editar:', error);
        mostrarError('Error al cargar cliente');
    }
}

function llenarFormularioCliente(cliente) {
    $('#clienteId').val(cliente.id);
    $('#nombreCliente').val(cliente.nombre);
    $('#contactoCliente').val(cliente.contacto);
    $('#emailCliente').val(cliente.email);
    $('#telefonoCliente').val(cliente.telefono);
    $('#direccionCliente').val(cliente.direccion);
}

async function guardarCliente() {
    try {
        if (!validarFormularioCliente()) {
            return;
        }

        const clienteData = {
            ClienteId: clienteEditando ? clienteEditando.id : 0,
            NombreCliente: $('#nombreCliente').val().trim(),
            Contacto: $('#contactoCliente').val().trim() || null,
            Email: $('#emailCliente').val().trim() || null,
            Telefono: $('#telefonoCliente').val().trim() || null,
            Direccion: $('#direccionCliente').val().trim() || null
        };

        $('#btnGuardarCliente').prop('disabled', true).html('<i class="bi bi-hourglass-split me-1"></i>Guardando...');

        let response;
        if (clienteEditando) {
            // Actualizar cliente existente
            response = await fetch(`/Clientes/ActualizarCliente?id=${clienteEditando.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clienteData)
            });
        } else {
            // Crear nuevo cliente
            response = await fetch('/Clientes/CrearCliente', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clienteData)
            });
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito(resultado.message);

            if (modalCliente) {
                modalCliente.hide();
            }

            // Recargar lista de clientes
            cargarClientes();
        } else {
            mostrarError(resultado.message || 'Error al guardar cliente');
        }

    } catch (error) {
        console.error('❌ Error guardando cliente:', error);
        mostrarError('Error al guardar cliente');
    } finally {
        $('#btnGuardarCliente').prop('disabled', false);

        if (clienteEditando) {
            $('#btnGuardarCliente').html('<i class="bi bi-check-circle me-1"></i>Actualizar Cliente');
        } else {
            $('#btnGuardarCliente').html('<i class="bi bi-check-circle me-1"></i>Crear Cliente');
        }
    }
}

async function eliminarCliente(clienteId) {
    try {
        const cliente = clientes.find(c => c.id === clienteId);
        const nombreCliente = cliente ? cliente.nombre : `Cliente ${clienteId}`;

        const confirmacion = await Swal.fire({
            title: '¿Eliminar cliente?',
            text: `¿Estás seguro de que quieres eliminar a "${nombreCliente}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        console.log(`🗑️ Eliminando cliente: ${clienteId}`);

        const response = await fetch(`/Clientes/EliminarCliente?id=${clienteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito(resultado.message);
            cargarClientes(); // Recargar lista
        } else {
            mostrarError(resultado.message || 'Error al eliminar cliente');
        }

    } catch (error) {
        console.error('❌ Error eliminando cliente:', error);
        mostrarError('Error al eliminar cliente');
    }
}

// ===== VALIDACIÓN =====
// Función para validar campos en tiempo real
function validarCampoEnTiempoReal(campo) {
    const valor = campo.val().trim();
    const id = campo.attr('id');
    let esValido = true;
    let mensaje = '';

    // Limpiar validación previa
    campo.removeClass('is-invalid is-valid');
    campo.siblings('.invalid-feedback').text('');

    switch (id) {
        case 'nombreCliente':
            if (!valor) {
                esValido = false;
                mensaje = 'El nombre del cliente es obligatorio';
            } else if (valor.length < 2) {
                esValido = false;
                mensaje = 'El nombre debe tener al menos 2 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El nombre solo puede contener letras y espacios';
            }
            break;

        case 'contactoCliente':
            if (!valor) {
                esValido = false;
                mensaje = 'La identificación es obligatoria';
            } else if (!/^[\d\-\s]+$/.test(valor)) {
                esValido = false;
                mensaje = 'La identificación solo puede contener números y guiones';
            }
            break;

        case 'emailCliente':
            if (!valor) {
                esValido = false;
                mensaje = 'El email es obligatorio';
            } else if (!validarEmail(valor)) {
                esValido = false;
                mensaje = 'Ingrese un email válido (ejemplo: cliente@ejemplo.com)';
            }
            break;

        case 'telefonoCliente':
            if (!valor) {
                esValido = false;
                mensaje = 'El teléfono es obligatorio';
            } else if (!/^[\d\-\s\+\(\)]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El teléfono solo puede contener números, espacios y guiones';
            } else if (valor.replace(/[\D]/g, '').length < 8) {
                esValido = false;
                mensaje = 'El teléfono debe tener al menos 8 dígitos';
            }
            break;

        case 'direccionCliente':
            if (!valor) {
                esValido = false;
                mensaje = 'La dirección es obligatoria';
            } else if (valor.length > 500) {
                esValido = false;
                mensaje = 'La dirección no puede exceder 500 caracteres';
            }
            break;
    }

    if (!esValido) {
        campo.addClass('is-invalid');
        campo.siblings('.invalid-feedback').text(mensaje);
    } else if (valor) {
        campo.addClass('is-valid');
    }

    return esValido;
}

function validarFormularioCliente() {
    let esValido = true;

    // Limpiar validaciones previas
    $('#modalCliente .form-control').removeClass('is-invalid');
    $('#modalCliente .invalid-feedback').text('');

    // Validar nombre (obligatorio)
    const nombre = $('#nombreCliente').val().trim();
    if (!nombre) {
        mostrarErrorCampo('#nombreCliente', 'El nombre del cliente es obligatorio');
        esValido = false;
    }

    // Validar identificación (obligatoria)
    const contacto = $('#contactoCliente').val().trim();
    if (!contacto) {
        mostrarErrorCampo('#contactoCliente', 'La identificación es obligatoria');
        esValido = false;
    }

    // Validar email (obligatorio y formato)
    const email = $('#emailCliente').val().trim();
    if (!email) {
        mostrarErrorCampo('#emailCliente', 'El email es obligatorio');
        esValido = false;
    } else if (!validarEmail(email)) {
        mostrarErrorCampo('#emailCliente', 'El formato del email no es válido');
        esValido = false;
    }

    // Validar teléfono (obligatorio)
    const telefono = $('#telefonoCliente').val().trim();
    if (!telefono) {
        mostrarErrorCampo('#telefonoCliente', 'El teléfono es obligatorio');
        esValido = false;
    }

    // Validar dirección (obligatoria)
    const direccion = $('#direccionCliente').val().trim();
    if (!direccion) {
        mostrarErrorCampo('#direccionCliente', 'La dirección es obligatoria');
        esValido = false;
    }

    return esValido;
}

function mostrarErrorCampo(selector, mensaje) {
    $(selector).addClass('is-invalid');
    $(selector).siblings('.invalid-feedback').text(mensaje);
}

function limpiarValidacion(elemento) {
    elemento.removeClass('is-invalid');
    elemento.siblings('.invalid-feedback').text('');
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ===== UTILIDADES =====
function limpiarFormularioCliente() {
    $('#formCliente')[0].reset();
    $('#clienteId').val('0');
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').text('');
    clienteEditando = null;
}

function mostrarEstadoCarga(mostrar) {
    if (mostrar) {
        $('#estadoCarga').removeClass('d-none');
        $('#tablaClientes, #sinResultados').addClass('d-none');
    } else {
        $('#estadoCarga').addClass('d-none');
    }
}

function mostrarSinResultados() {
    $('#sinResultados').removeClass('d-none');
    $('#tablaClientes, #estadoCarga').addClass('d-none');
}

function ocultarEstadosEspeciales() {
    $('#estadoCarga, #sinResultados').addClass('d-none');
    $('#tablaClientes').removeClass('d-none');
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje
    });
}

function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        timer: 2000,
        showConfirmButton: false
    });
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

// ===== HACER FUNCIONES GLOBALES =====
window.editarCliente = editarCliente;
window.eliminarCliente = eliminarCliente;