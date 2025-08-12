// ===== GESTIÓN DE CLIENTES - JAVASCRIPT =====

let modalCliente = null;
let clientes = []; // Aunque se comenta que no se recrea la tabla, esta variable podría ser útil para otras lógicas.
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

    // Validación en tiempo real para todos los campos del modal de Nuevo Cliente
    $('#modalNuevoCliente input, #modalNuevoCliente textarea').on('input blur', function() {
        validarCampoEnTiempoReal($(this));
    });

    // Validación en tiempo real para todos los campos del modal de Editar Cliente
    $('#modalEditarCliente input, #modalEditarCliente textarea').on('input blur', function() {
        validarCampoEnTiempoReal($(this));
    });

    // Validación específica para teléfono de Costa Rica (+506)
    $('#telefonoCliente').on('input', function() {
        const codigoPais = $('#codigoPaisCliente').val();
        if (codigoPais === '+506') {
            formatearTelefonoCostaRica($(this));
        }
    });

    // Cambio de código de país
    $('#codigoPaisCliente').on('change', function() {
        const codigoPais = $(this).val();
        const telefonoInput = $('#telefonoCliente');

        if (codigoPais === '+506') {
            // Limpiar y reformatear para Costa Rica
            const numeroLimpio = telefonoInput.val().replace(/\D/g, '');
            telefonoInput.val(numeroLimpio);
            telefonoInput.attr('maxlength', '8');
            telefonoInput.attr('placeholder', '88888888');
            formatearTelefonoCostaRica(telefonoInput);
        } else {
            // Otros países mantienen formato flexible
            telefonoInput.attr('maxlength', '15');
            telefonoInput.attr('placeholder', 'Número de teléfono');
            telefonoInput.removeClass('is-invalid is-valid');
        }
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
    $('#clienteId').val(''); // Limpiar el ID para nuevo cliente

    // Asegurarse de que el modal de nuevo cliente está configurado correctamente
    // Si el ID 'modalCliente' se usa para ambos, hay que gestionar el contenido dinámicamente
    // Asumiendo que hay un modal específico 'modalNuevoCliente' o se limpia el contenido

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
    // Limpiar validaciones previas antes de llenar
    $('#modalCliente .form-control, #modalCliente .form-select').removeClass('is-invalid is-valid');
    $('#modalCliente .invalid-feedback').text('');

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

    $('#clienteId').val(clienteEditando.clienteId); // Campo oculto para el ID
    $('#nombreCliente').val(clienteEditando.nombre);
    $('#contactoCliente').val(clienteEditando.contacto); // Asumiendo que este campo se usa para identificación
    $('#emailCliente').val(clienteEditando.email);
    $('#telefonoCliente').val(clienteEditando.telefono);
    $('#direccionCliente').val(clienteEditando.direccion);

    // Configurar el código de país si está disponible
    const telefonoCompleto = cliente.telefono || cliente.Telefono || '';
    if (telefonoCompleto.startsWith('+506')) {
        $('#codigoPaisCliente').val('+506');
        const numeroCostaRica = telefonoCompleto.replace('+506', '').trim().replace(/\D/g, '');
        $('#telefonoCliente').val(numeroCostaRica);
        $('#telefonoCliente').attr('maxlength', '8');
        $('#telefonoCliente').attr('placeholder', '88888888');
        formatearTelefonoCostaRica($('#telefonoCliente'));
    } else {
        $('#codigoPaisCliente').val(''); // O un valor por defecto si aplica
        $('#telefonoCliente').val(telefonoCompleto.replace(/\D/g, '')); // Limpiar no dígitos
        $('#telefonoCliente').attr('maxlength', '15');
        $('#telefonoCliente').attr('placeholder', 'Número de teléfono');
    }

    // Validar campos después de llenar para mostrar estado inicial
    $('.form-control').each(function() {
        validarCampoEnTiempoReal($(this));
    });
}

async function guardarCliente() {
    try {
        // Validar el formulario completo antes de proceder
        const esFormularioValido = clienteEditando ? validarFormularioEditarCliente() : validarFormularioNuevoCliente();

        if (!esFormularioValido) {
            mostrarToast('Formulario inválido', 'Por favor corrige los errores en el formulario', 'warning');
            return;
        }

        // Formatear teléfono con código de país
        const codigoPais = $('#codigoPaisCliente').val();
        const numeroTelefono = $('#telefonoCliente').val().trim();
        const telefonoCompleto = `${codigoPais} ${numeroTelefono}`;

        const clienteData = {
            ClienteId: parseInt($('#clienteId').val()) || 0, // Usa el ID del form, podría ser un campo oculto
            NombreCliente: $('#nombreCliente').val().trim(),
            Contacto: $('#contactoCliente').val().trim(), // Asumiendo que 'Contacto' es la identificación
            Email: $('#emailCliente').val().trim(),
            Telefono: telefonoCompleto,
            Direccion: $('#direccionCliente').val().trim()
        };

        $('#btnGuardarCliente').prop('disabled', true).html('<i class="bi bi-hourglass-split me-1"></i>Guardando...');

        let response;
        let url;
        let method;

        if (clienteEditando || clienteData.ClienteId > 0) {
            // Actualizar cliente existente
            const clienteId = clienteEditando ? clienteEditando.clienteId : clienteData.ClienteId;
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
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
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
        mostrarError(`Error al guardar cliente: ${error.message}`);
    } finally {
        $('#btnGuardarCliente').prop('disabled', false);

        if (clienteEditando || parseInt($('#clienteId').val()) > 0) {
            $('#btnGuardarCliente').html('<i class="bi bi-check-circle me-1"></i>Actualizar Cliente');
        } else {
            $('#btnGuardarCliente').html('<i class="bi bi-check-circle me-1"></i>Crear Cliente');
        }
    }
}

async function eliminarCliente(clienteId) {
    try {
        // Si 'clientes' no está siendo cargado activamente, buscar el nombre puede fallar.
        // Se asume que 'clientes' se poblaría o se obtendría el nombre de otra forma si es necesario.
        const cliente = clientes.find(c => c.id === clienteId); // 'clientes' debería estar actualizado
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
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
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
        mostrarError(`Error al eliminar cliente: ${error.message}`);
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
        case 'nombreClienteEdit': // Asumiendo que se usa nombreClienteEdit en el modal de editar
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
        case 'contactoClienteEdit': // Asumiendo que este campo es para la identificación
            if (valor && !/^[\d\-\s]+$/.test(valor)) {
                esValido = false;
                mensaje = 'La identificación solo puede contener números y guiones';
            }
            break;

        case 'emailCliente':
        case 'emailClienteEdit':
            if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
                esValido = false;
                mensaje = 'Ingrese un email válido (ejemplo: cliente@ejemplo.com)';
            }
            break;

        case 'telefonoCliente':
        case 'telefonoClienteEdit':
            const codigoPais = $('#codigoPaisCliente').val(); // Obtener código de país actual
            if (!valor) {
                esValido = false;
                mensaje = 'El teléfono es obligatorio';
            } else if (codigoPais === '+506') {
                // Validación específica para Costa Rica
                const numeroLimpio = valor.replace(/\D/g, '');
                if (numeroLimpio.length !== 8) {
                    esValido = false;
                    mensaje = 'El teléfono debe tener exactamente 8 dígitos para Costa Rica';
                } else if (!validarTelefonoCostaRica(numeroLimpio)) {
                    esValido = false;
                    mensaje = 'Número inválido para Costa Rica. Debe iniciar con 2, 4, 5, 6, 7, 8 o 9';
                }
            } else {
                // Validación para otros países
                if (!/^[\d\-\s\+\(\)]+$/.test(valor)) {
                    esValido = false;
                    mensaje = 'El teléfono solo puede contener números, espacios y guiones';
                } else if (valor.replace(/[\D]/g, '').length < 8) {
                    esValido = false;
                    mensaje = 'El teléfono debe tener al menos 8 dígitos';
                }
            }
            break;

        case 'direccionCliente':
        case 'direccionClienteEdit':
            if (valor && valor.length > 500) {
                esValido = false;
                mensaje = 'La dirección no puede exceder 500 caracteres';
            }
            break;
    }

    if (!esValido) {
        campo.addClass('is-invalid');
        campo.siblings('.invalid-feedback').text(mensaje);
    } else if (valor) {
        // Solo marcar como válido si hay valor y pasó las validaciones
        campo.addClass('is-valid');
    }

    return esValido;
}

// Función mejorada para validar formulario completo de Nuevo Cliente
function validarFormularioNuevoCliente() {
    let esValido = true;
    const campos = $('#modalNuevoCliente input, #modalNuevoCliente textarea'); // Asumiendo que existe un modal con este ID

    campos.each(function () {
        if (!validarCampoEnTiempoReal($(this))) {
            esValido = false;
        }
    });

    // Validación especial para nombre (obligatorio)
    const nombre = $('#nombreCliente').val().trim();
    if (!nombre) {
        $('#nombreCliente').addClass('is-invalid');
        $('#nombreCliente').siblings('.invalid-feedback').text('El nombre del cliente es obligatorio');
        esValido = false;
    } else {
        // Si el nombre no está vacío, validarlo también
        if (!validarCampoEnTiempoReal($('#nombreCliente'))) {
             esValido = false;
        }
    }

    return esValido;
}

// Función mejorada para validar formulario completo de Editar Cliente
function validarFormularioEditarCliente() {
    let esValido = true;
    const campos = $('#modalEditarCliente input, #modalEditarCliente textarea'); // Asumiendo que existe un modal con este ID

    campos.each(function () {
        if (!validarCampoEnTiempoReal($(this))) {
            esValido = false;
        }
    });

    // Validación especial para nombre (obligatorio)
    const nombre = $('#nombreClienteEdit').val().trim();
    if (!nombre) {
        $('#nombreClienteEdit').addClass('is-invalid');
        $('#nombreClienteEdit').siblings('.invalid-feedback').text('El nombre del cliente es obligatorio');
        esValido = false;
    } else {
        // Si el nombre no está vacío, validarlo también
         if (!validarCampoEnTiempoReal($('#nombreClienteEdit'))) {
             esValido = false;
        }
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

// ===== VALIDACIÓN ESPECÍFICA PARA COSTA RICA =====
function formatearTelefonoCostaRica(input) {
    let valor = input.val();

    // Remover todos los caracteres que no sean dígitos
    let numeroLimpio = valor.replace(/\D/g, '');

    // Limitar a 8 dígitos
    if (numeroLimpio.length > 8) {
        numeroLimpio = numeroLimpio.substring(0, 8);
    }

    // Actualizar el valor del input sin formato
    input.val(numeroLimpio);

    // Validar formato específico de Costa Rica
    const esValido = validarTelefonoCostaRica(numeroLimpio);

    // Aplicar clases de validación
    input.removeClass('is-invalid is-valid');
    input.siblings('.invalid-feedback').text('');

    if (numeroLimpio.length === 0) {
        // Campo vacío, no mostrar validación
        return;
    } else if (esValido) {
        input.addClass('is-valid');
    } else {
        input.addClass('is-invalid');
        if (numeroLimpio.length < 8) {
            input.siblings('.invalid-feedback').text('El teléfono debe tener exactamente 8 dígitos');
        } else {
            input.siblings('.invalid-feedback').text('Formato inválido para Costa Rica. Debe iniciar con 2, 4, 5, 6, 7, 8 o 9');
        }
    }
}

function validarTelefonoCostaRica(numero) {
    // Debe tener exactamente 8 dígitos
    if (numero.length !== 8) {
        return false;
    }

    // Debe iniciar con 2, 4, 5, 6, 7, 8 o 9 (números válidos en Costa Rica)
    const primerDigito = numero.charAt(0);
    const digitosValidos = ['2', '4', '5', '6', '7', '8', '9'];

    return digitosValidos.includes(primerDigito);
}

// ===== UTILIDADES =====
function limpiarFormularioCliente() {
    $('#formCliente')[0].reset(); // Resetea los campos del formulario asociado a 'formCliente'
    $('#clienteId').val(''); // Limpiar el ID para nuevo cliente
    $('#codigoPaisCliente').val('+506'); // Reset a Costa Rica por defecto
    $('#modalCliente .form-control, #modalCliente .form-select').removeClass('is-invalid is-valid');
    $('#modalCliente .invalid-feedback').text('');
    clienteEditando = null; // Resetear la variable de cliente editando
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

// Helper para mostrar toasts si se usan en lugar de Swal.fire para notificaciones menores
function mostrarToast(titulo, mensaje, tipo) {
     const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.வுகளை.mouseenter(() => Swal.stopTimer());
            toast.mouseleave(() => Swal.resumeTimer());
        }
    });
    Toast.fire({
        icon: tipo,
        title: title,
        text: mensaje
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