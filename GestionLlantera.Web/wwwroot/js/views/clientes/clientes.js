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

        // Los clientes ya están cargados desde el servidor
        console.log('✅ Clientes cargados desde el servidor');

        console.log('✅ Gestión de clientes inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando gestión de clientes:', error);
    }
}

function configurarEventos() {
    // Búsqueda de clientes
    $('#buscarClientes').on('input', debounce(function() {
        try {
            const elemento = $(this);
            const termino = elemento.val() || '';
            const terminoLimpio = String(termino).trim();
            
            if (terminoLimpio.length >= 2 || terminoLimpio.length === 0) {
                buscarClientes(terminoLimpio);
            }
        } catch (error) {
            console.error('❌ Error en configurarEventos búsqueda:', error);
        }
    }, 300));

    // Limpiar filtros
    $('#btnLimpiarFiltros').on('click', function() {
        $('#buscarClientes').val('');
        mostrarTodosLosClientes();
        console.log('🧹 Filtros limpiados - Mostrando todos los clientes');
    });

    // Nuevo cliente
    $('#btnNuevoCliente').on('click', function() {
        abrirModalNuevoCliente();
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
    // Recargar la página para obtener los datos actualizados del servidor
    window.location.reload();
}

async function buscarClientes(termino) {
    try {
        console.log(`🔍 Buscando clientes: "${termino}"`);
        
        // Si el término está vacío, mostrar todos los clientes
        if (!termino || termino.trim() === '') {
            mostrarTodosLosClientes();
            return;
        }

        // Filtrar clientes localmente (más rápido y responsivo)
        filtrarClientesEnTabla(termino.trim().toLowerCase());

    } catch (error) {
        console.error('❌ Error buscando clientes:', error);
        mostrarError('Error al buscar clientes');
    }
}

// Nueva función para filtrar clientes directamente en la tabla
function filtrarClientesEnTabla(termino) {
    let clientesVisibles = 0;
    
    // Obtener todas las filas de la tabla
    $("tbody tr").each(function() {
        const $fila = $(this);
        let coincide = false;
        
        if (!termino) {
            // Si no hay término, mostrar todas las filas
            coincide = true;
        } else {
            // Buscar en el nombre del cliente (columna 2)
            const nombre = $fila.find("td:eq(1)").text().toLowerCase();
            
            // Buscar en la identificación (columna 3)  
            const identificacion = $fila.find("td:eq(2)").text().toLowerCase();
            
            // Buscar en el email (columna 4)
            const email = $fila.find("td:eq(3)").text().toLowerCase();
            
            // Buscar en el teléfono (columna 5)
            const telefono = $fila.find("td:eq(4)").text().toLowerCase();
            
            // Verificar si el término coincide con algún campo
            coincide = nombre.includes(termino) || 
                      identificacion.includes(termino) || 
                      email.includes(termino) || 
                      telefono.includes(termino);
        }
        
        // Mostrar u ocultar la fila según si coincide
        if (coincide) {
            $fila.show();
            clientesVisibles++;
        } else {
            $fila.hide();
        }
    });
    
    // Actualizar el estado de la tabla
    if (clientesVisibles === 0) {
        mostrarSinResultados();
    } else {
        ocultarEstadosEspeciales();
        console.log(`✅ Mostrando ${clientesVisibles} clientes que coinciden con "${termino}"`);
    }
}

// Nueva función para mostrar todos los clientes
function mostrarTodosLosClientes() {
    $("tbody tr").show();
    ocultarEstadosEspeciales();
    console.log('✅ Mostrando todos los clientes');
}

// ===== MOSTRAR DATOS =====
function mostrarClientes(clientesData) {
    // La tabla ya está renderizada desde el servidor, no necesitamos recrearla
    console.log('✅ Clientes cargados desde el servidor - No se requiere recrear tabla');
    ocultarEstadosEspeciales();
}

// Función para contar clientes visibles
function contarClientesVisibles() {
    const clientesVisibles = $("tbody tr:visible").length;
    console.log(`📊 Clientes visibles: ${clientesVisibles}`);
    return clientesVisibles;
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
            // Asegurar que el cliente tiene el ID correcto
            resultado.data.clienteId = resultado.data.id || resultado.data.clienteId || clienteId;
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
        mostrarError('Error al cargar cliente para editar');
    }
}

function llenarFormularioCliente(cliente) {
    // Asegurar que tenemos el ID correcto
    clienteEditando = {
        id: cliente.id || cliente.clienteId || cliente.ClienteId,
        clienteId: cliente.id || cliente.clienteId || cliente.ClienteId,
        nombre: cliente.nombre || cliente.nombreCliente || cliente.NombreCliente,
        contacto: cliente.contacto || cliente.Contacto || '',
        email: cliente.email || cliente.Email || '',
        telefono: cliente.telefono || cliente.Telefono || '',
        direccion: cliente.direccion || cliente.Direccion || ''
    };

    $('#nombreCliente').val(clienteEditando.nombre);
    $('#contactoCliente').val(clienteEditando.contacto);
    $('#emailCliente').val(clienteEditando.email);
    $('#telefonoCliente').val(clienteEditando.telefono);
    $('#direccionCliente').val(clienteEditando.direccion);

    // Limpiar validaciones previas
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').text('');
}

async function guardarCliente() {
    try {
        if (!validarFormularioCliente()) {
            return;
        }

        // Formatear teléfono con código de país
        const codigoPais = $('#codigoPaisCliente').val();
        const numeroTelefono = $('#telefonoCliente').val().trim();
        const telefonoCompleto = `${codigoPais} ${numeroTelefono}`;

        const clienteData = {
            ClienteId: parseInt($('#clienteId').val()) || 0,
            NombreCliente: $('#nombreCliente').val().trim(),
            Contacto: $('#contactoCliente').val().trim(),
            Email: $('#emailCliente').val().trim(),
            Telefono: telefonoCompleto,
            Direccion: $('#direccionCliente').val().trim()
        };

        $('#btnGuardarCliente').prop('disabled', true).html('<i class="bi bi-hourglass-split me-1"></i>Guardando...');

        let response;
        let url;
        let method;

        if (clienteEditando) {
            // Actualizar cliente existente
            const clienteId = clienteEditando.clienteId || clienteEditando.id;
            clienteData.ClienteId = clienteId;
            url = `/Clientes/ActualizarCliente?id=${clienteId}`;
            method = 'PUT';
        } else {
            // Crear nuevo cliente
            url = '/Clientes/CrearCliente';
            method = 'POST';
        }

        response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clienteData)
        });

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
    $('#clienteId').val(0);
    $('#codigoPaisCliente').val('+506'); // Reset a Costa Rica por defecto
    $('#modalCliente .form-control, #modalCliente .form-select').removeClass('is-invalid is-valid');
    $('#modalCliente .invalid-feedback').text('');
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
            try {
                func.apply(this, args);
            } catch (error) {
                console.error('❌ Error en función debounced:', error);
            }
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== HACER FUNCIONES GLOBALES =====
window.editarCliente = editarCliente;
window.eliminarCliente = eliminarCliente;