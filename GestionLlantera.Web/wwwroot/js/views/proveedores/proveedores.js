// ========================================
// MÓDULO DE GESTIÓN DE PROVEEDORES
// Ubicación: /js/views/proveedores/proveedores.js
// ========================================

console.log('🚀 Inicializando módulo de gestión de proveedores...');

// =====================================
// VARIABLES GLOBALES
// =====================================

let proveedoresData = [];
let proveedoresFiltrados = [];
let proveedorEditando = null;

// =====================================
// INICIALIZACIÓN
// =====================================

$(document).ready(function () {
    console.log('📚 DOM cargado, inicializando gestión de proveedores...');

    try {
        configurarEventListeners();
        cargarProveedores();

        console.log('✅ Módulo de gestión de proveedores inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de proveedores:', error);
        mostrarAlerta('Error al inicializar la página', 'error');
    }
});

// =====================================
// EVENT LISTENERS
// =====================================

function configurarEventListeners() {
    console.log('🔧 Configurando event listeners...');

    // Búsqueda en tiempo real
    $('#buscarProveedor').on('input', function() {
        filtrarProveedores();
    });

    // Validación del formulario - separar crear de editar
    $('#formProveedor').on('submit', function(e) {
        e.preventDefault();

        if (proveedorEditando) {
            actualizarProveedor();
        } else {
            crearProveedor();
        }
    });

    // Limpiar formulario al cerrar modal
    $('#modalProveedor').on('hidden.bs.modal', function() {
        limpiarFormulario();
    });

    // Validación en tiempo real
    $('#nombreProveedor, #contactoProveedor, #emailProveedor, #telefonoProveedor, #direccionProveedor').on('input blur', function() {
        validarCampoEnTiempoReal($(this));
    });
}

// =====================================
// FUNCIONES PRINCIPALES
// =====================================

/**
 * Cargar todos los proveedores
 */
async function cargarProveedores() {
    try {
        console.log('📋 Cargando proveedores...');
        mostrarLoading(true);

        const response = await fetch('/Proveedores/ObtenerProveedores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📋 Respuesta del servidor:', data);

        if (data.success && data.data) {
            proveedoresData = data.data;
            proveedoresFiltrados = [...proveedoresData];
            mostrarProveedores();
            actualizarContador();
            console.log(`✅ ${proveedoresData.length} proveedores cargados`);
        } else {
            throw new Error(data.message || 'Error obteniendo proveedores');
        }
    } catch (error) {
        console.error('❌ Error cargando proveedores:', error);
        mostrarToast('Error', 'Error cargando proveedores: ' + error.message, 'danger');
        mostrarSinDatos(true);
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Mostrar proveedores en la tabla
 */
function mostrarProveedores() {
    const tbody = $('#cuerpoTablaProveedores');

    if (proveedoresFiltrados.length === 0) {
        mostrarSinDatos(true);
        return;
    }

    mostrarSinDatos(false);

    const html = proveedoresFiltrados.map(proveedor => {
        const cantidadPedidos = proveedor.pedidosProveedors ? proveedor.pedidosProveedors.length : 0;
        const tieneRegistros = cantidadPedidos > 0;

        return `
            <tr>
                <td>${proveedor.id}</td>
                <td>
                    <strong>${proveedor.nombre || 'Sin nombre'}</strong>
                </td>
                <td>${proveedor.contacto || '-'}</td>
                <td>${proveedor.telefono || '-'}</td>
                <td>
                    <span title="${proveedor.direccion || '-'}">
                        ${proveedor.direccion ? (proveedor.direccion.length > 50 ? proveedor.direccion.substring(0, 50) + '...' : proveedor.direccion) : '-'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-info">${cantidadPedidos}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${proveedor.activo ? 'bg-success' : 'bg-secondary'}">
                        ${proveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="editarProveedor(${proveedor.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-info" onclick="verPedidosProveedor(${proveedor.id})" title="Ver Pedidos">
                            <i class="bi bi-box-seam"></i>
                        </button>
                        <button type="button" class="btn btn-sm ${proveedor.activo ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="cambiarEstadoProveedor(${proveedor.id}, ${!proveedor.activo}, '${(proveedor.nombre || '').replace(/'/g, "\\'")}')" title="${proveedor.activo ? 'Desactivar' : 'Activar'}">
                            <i class="bi ${proveedor.activo ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                        </button>
                        <button type="button" 
                                class="btn btn-sm btn-outline-danger ${tieneRegistros ? 'disabled' : ''}" 
                                onclick="${tieneRegistros ? '' : `eliminarProveedor(${proveedor.id}, '${(proveedor.nombre || '').replace(/'/g, "\\'")}')`}" 
                                title="${tieneRegistros ? 'No se puede eliminar: tiene pedidos asociados' : 'Eliminar'}"
                                ${tieneRegistros ? 'disabled' : ''}>
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.html(html);
}

/**
 * Filtrar proveedores por búsqueda
 */
function filtrarProveedores() {
    const termino = $('#buscarProveedor').val().toLowerCase().trim();

    if (!termino) {
        proveedoresFiltrados = [...proveedoresData];
    } else {
        proveedoresFiltrados = proveedoresData.filter(proveedor => 
            proveedor.nombre.toLowerCase().includes(termino) ||
            (proveedor.contacto && proveedor.contacto.toLowerCase().includes(termino)) ||
            (proveedor.telefono && proveedor.telefono.toLowerCase().includes(termino))
        );
    }

    mostrarProveedores();
    actualizarContador();
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
    $('#buscarProveedor').val('');
    filtrarProveedores();
}

/**
 * Cargar todos los proveedores (incluyendo inactivos)
 */
async function cargarTodosProveedores() {
    try {
        console.log('📋 Cargando TODOS los proveedores (incluyendo inactivos)...');
        mostrarLoading(true);

        const response = await fetch('/Proveedores/ObtenerTodosProveedores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📋 Respuesta del servidor (todos):', data);

        if (data.success && data.data) {
            proveedoresData = data.data;
            proveedoresFiltrados = [...proveedoresData];
            mostrarProveedores();
            actualizarContador();
            console.log(`✅ ${proveedoresData.length} proveedores cargados (incluyendo inactivos)`);
        } else {
            throw new Error(data.message || 'Error obteniendo todos los proveedores');
        }
    } catch (error) {
        console.error('❌ Error cargando todos los proveedores:', error);
        mostrarToast('Error', 'Error cargando todos los proveedores: ' + error.message, 'danger');
        mostrarSinDatos(true);
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Alternar entre mostrar solo activos o todos los proveedores
 */
function alternarVistaProveedores() {
    const btn = $('#btnToggleProveedores');
    const mostrandoTodos = btn.data('mostrandoTodos') || false;

    if (mostrandoTodos) {
        // Cambiar a mostrar solo activos
        cargarProveedores();
        btn.html('<i class="bi bi-eye me-1"></i>Ver Todos');
        btn.removeClass('btn-secondary').addClass('btn-outline-secondary');
        btn.data('mostrandoTodos', false);
    } else {
        // Cambiar a mostrar todos
        cargarTodosProveedores();
        btn.html('<i class="bi bi-eye-slash me-1"></i>Solo Activos');
        btn.removeClass('btn-outline-secondary').addClass('btn-secondary');
        btn.data('mostrandoTodos', true);
    }
}

// =====================================
// FUNCIONES DEL MODAL
// =====================================

/**
 * Abrir modal para nuevo proveedor
 */
function abrirModalProveedor() {
    proveedorEditando = null;
    $('#tituloModalProveedor').html('<i class="bi bi-truck me-2"></i>Nuevo Proveedor');
    $('#btnGuardarProveedor').html('<i class="bi bi-plus me-1"></i>Crear Proveedor');
    limpiarFormularioProveedor();
    $('#modalProveedor').modal('show');
}

/**
 * Editar proveedor
 */
function editarProveedor(id) {
    const proveedor = proveedoresData.find(p => p.id === id);
    if (!proveedor) {
        mostrarAlerta('Proveedor no encontrado', 'error');
        return;
    }

    proveedorEditando = proveedor;
    $('#tituloModalProveedor').html('<i class="bi bi-pencil me-2"></i>Editar Proveedor');
    $('#btnGuardarProveedor').html('<i class="bi bi-save me-1"></i>Actualizar Proveedor');

    // Llenar formulario
    $('#proveedorId').val(proveedor.id);
    $('#nombreProveedor').val(proveedor.nombre);
    $('#contactoProveedor').val(proveedor.contacto || '');
    $('#telefonoProveedor').val(proveedor.telefono || '');
    $('#direccionProveedor').val(proveedor.direccion || '');

    $('#modalProveedor').modal('show');
}

// =====================================
// FUNCIONES DE CREACIÓN
// =====================================

/**
 * Crear nuevo proveedor
 */
async function crearProveedor() {
    try {
        if (!validarFormularioProveedor()) {
            return;
        }

        const btnGuardar = $('#btnGuardarProveedor');
        const textoOriginal = btnGuardar.html();
        btnGuardar.html('<i class="bi bi-hourglass-split me-1"></i>Creando...').prop('disabled', true);

        const datosProveedor = {
            nombreProveedor: $('#nombreProveedor').val().trim(),
            contacto: $('#contactoProveedor').val().trim() || null,
            telefono: $('#telefonoProveedor').val().trim() || null,
            direccion: $('#direccionProveedor').val().trim() || null
        };

        console.log('📋 Datos a crear:', datosProveedor);

        const response = await fetch('/Proveedores/CrearProveedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosProveedor),
            credentials: 'include'
        });

        console.log('📋 Respuesta HTTP:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado crear:', resultado);

        if (resultado.success) {
            mostrarToast('Éxito', resultado.message || 'Proveedor creado exitosamente', 'success');
            $('#modalProveedor').modal('hide');
            await cargarProveedores(); // Recargar lista
        } else {
            mostrarToast('Error', resultado.message || 'Error creando proveedor', 'danger');
        }
    } catch (error) {
        console.error('❌ Error creando proveedor:', error);
        mostrarToast('Error', 'Error creando proveedor: ' + error.message, 'danger');
    } finally {
        const btnGuardar = $('#btnGuardarProveedor');
        btnGuardar.html('<i class="bi bi-plus me-1"></i>Crear Proveedor').prop('disabled', false);
    }
}

// =====================================
// FUNCIONES DE ACTUALIZACIÓN
// =====================================

/**
 * Actualizar proveedor existente
 */
async function actualizarProveedor() {
    try {
        if (!validarFormularioProveedor()) {
            return;
        }

        if (!proveedorEditando) {
            mostrarAlerta('Error: No hay proveedor seleccionado para editar', 'error');
            return;
        }

        const btnGuardar = $('#btnGuardarProveedor');
        const textoOriginal = btnGuardar.html();
        btnGuardar.html('<i class="bi bi-hourglass-split me-1"></i>Actualizando...').prop('disabled', true);

        const datosProveedor = {
            proveedorId: proveedorEditando.id,
            nombreProveedor: $('#nombreProveedor').val().trim(),
            contacto: $('#contactoProveedor').val().trim() || null,
            telefono: $('#telefonoProveedor').val().trim() || null,
            direccion: $('#direccionProveedor').val().trim() || null
        };

        console.log('📋 Datos a actualizar:', datosProveedor);

        const response = await fetch('/Proveedores/ActualizarProveedor', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosProveedor),
            credentials: 'include'
        });

        console.log('📋 Respuesta HTTP:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado actualizar:', resultado);

        if (resultado.success) {
            mostrarToast('Éxito', resultado.message || 'Proveedor actualizado exitosamente', 'success');
            $('#modalProveedor').modal('hide');
            await cargarProveedores(); // Recargar lista
        } else {
            mostrarToast('Error', resultado.message || 'Error actualizando proveedor', 'danger');
        }
    } catch (error) {
        console.error('❌ Error actualizando proveedor:', error);
        mostrarToast('Error', 'Error actualizando proveedor: ' + error.message, 'danger');
    } finally {
        const btnGuardar = $('#btnGuardarProveedor');
        btnGuardar.html('<i class="bi bi-save me-1"></i>Actualizar Proveedor').prop('disabled', false);
    }
}

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
        case 'nombreProveedor':
            if (!valor) {
                esValido = false;
                mensaje = 'El nombre del proveedor es obligatorio';
            } else if (valor.length < 2) {
                esValido = false;
                mensaje = 'El nombre debe tener al menos 2 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.\-&]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El nombre solo puede contener letras, números, espacios, puntos, guiones y &';
            }
            break;

        case 'contactoProveedor':
            if (!valor) {
                esValido = false;
                mensaje = 'El contacto es obligatorio';
            } else if (valor.length < 2) {
                esValido = false;
                mensaje = 'El contacto debe tener al menos 2 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El contacto solo puede contener letras y espacios';
            }
            break;

        case 'emailProveedor':
            if (valor && !validarEmail(valor)) {
                esValido = false;
                mensaje = 'Ingrese un email válido (ejemplo: proveedor@ejemplo.com)';
            }
            break;

        case 'telefonoProveedor':
            if (valor && !/^[\d\-\s\+\(\)]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El teléfono solo puede contener números, espacios y guiones';
            } else if (valor && valor.replace(/[\D]/g, '').length < 8) {
                esValido = false;
                mensaje = 'El teléfono debe tener al menos 8 dígitos';
            }
            break;

        case 'direccionProveedor':
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
        campo.addClass('is-valid');
    }

    return esValido;
}

function validarFormularioProveedor() {
    let esValido = true;

    // Limpiar validaciones previas
    $('#modalProveedor .form-control').removeClass('is-invalid');
    $('#modalProveedor .invalid-feedback').text('');

    // Validar nombre (obligatorio)
    const nombre = $('#nombreProveedor').val().trim();
    if (!nombre) {
        mostrarErrorCampo('#nombreProveedor', 'El nombre del proveedor es obligatorio');
        esValido = false;
    }

    // Validar contacto (obligatorio)
    const contacto = $('#contactoProveedor').val().trim();
    if (!contacto) {
        mostrarErrorCampo('#contactoProveedor', 'El contacto es obligatorio');
        esValido = false;
    }

    // Validar email (opcional pero formato válido)
    const email = $('#emailProveedor').val().trim();
    if (email && !validarEmail(email)) {
        mostrarErrorCampo('#emailProveedor', 'El formato del email no es válido');
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

function limpiarFormularioProveedor() {
    $('#formProveedor')[0].reset();
    $('#proveedorId').val('0');
    $('.form-control').removeClass('is-invalid is-valid');
    $('.invalid-feedback').text('');
    proveedorEditando = null;
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
    $('#formProveedor')[0].reset();
    $('#proveedorId').val(0);
    $('.form-control').removeClass('is-invalid is-valid');
    $('.invalid-feedback').text('');
    proveedorEditando = null;
}

// =====================================
// FUNCIONES DE ELIMINACIÓN
// =====================================

/**
 * Mostrar confirmación para eliminar proveedor
 */
async function eliminarProveedor(id, nombre) {
    try {
        // Buscar el proveedor para verificar si tiene registros
        const proveedor = proveedoresData.find(p => p.id === id);
        if (!proveedor) {
            mostrarToast('Error', 'Proveedor no encontrado', 'danger');
            return;
        }

        const cantidadPedidos = proveedor.pedidosProveedors ? proveedor.pedidosProveedors.length : 0;
        
        // Si tiene registros, mostrar mensaje informativo y sugerir desactivar
        if (cantidadPedidos > 0) {
            Swal.fire({
                title: 'No se puede eliminar',
                html: `
                    <div class="text-start">
                        <p><strong>Proveedor:</strong> ${nombre}</p>
                        <p><strong>Pedidos asociados:</strong> ${cantidadPedidos}</p>
                        <hr>
                        <p class="text-info"><strong>ℹ️ Información:</strong></p>
                        <ul class="text-muted">
                            <li>Este proveedor tiene pedidos registrados</li>
                            <li>No se puede eliminar para mantener la integridad de los datos</li>
                            <li>Puedes desactivarlo si ya no lo necesitas</li>
                        </ul>
                        <hr>
                        <p class="text-success"><strong>💡 Sugerencia:</strong> Usa el botón <i class="bi bi-pause-circle"></i> para desactivar el proveedor</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#007bff'
            });
            return;
        }

        // Si no tiene registros, proceder con la confirmación normal
        const confirmacion = await Swal.fire({
            title: '¿Eliminar proveedor?',
            html: `
                <div class="text-start">
                    <p><strong>Proveedor:</strong> ${nombre}</p>
                    <hr>
                    <p class="text-warning"><strong>⚠️ Advertencia:</strong></p>
                    <ul class="text-muted">
                        <li>Esta acción no se puede deshacer</li>
                        <li>Se eliminará toda la información del proveedor</li>
                        <li>Este proveedor no tiene pedidos asociados</li>
                    </ul>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (confirmacion.isConfirmed) {
            await confirmarEliminarProveedor(id, nombre);
        }
    } catch (error) {
        console.error('❌ Error en confirmación de eliminación:', error);
        mostrarToast('Error', 'Error en la confirmación', 'danger');
    }
}

/**
 * Confirmar eliminación de proveedor
 */
async function confirmarEliminarProveedor(id, nombre) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Eliminando...',
            text: `Eliminando proveedor ${nombre}`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/Proveedores/EliminarProveedor?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: resultado.message || 'Proveedor eliminado exitosamente',
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#28a745',
                timer: 3000,
                timerProgressBar: true
            });

            await cargarProveedores(); // Recargar lista
        } else {
            throw new Error(resultado.message || 'Error eliminando proveedor');
        }
    } catch (error) {
        console.error('❌ Error eliminando proveedor:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: error.message,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc3545'
        });
    }
}

// =====================================
// FUNCIONES DE NAVEGACIÓN
// =====================================

/**
 * Ver pedidos de un proveedor específico
 */
function verPedidosProveedor(proveedorId) {
    window.location.href = `/Proveedores/PedidosProveedor?proveedorId=${proveedorId}`;
}

/**
 * Cambiar estado de un proveedor (activar/desactivar)
 */
async function cambiarEstadoProveedor(id, nuevoEstado, nombre) {
    try {
        const accion = nuevoEstado ? 'activar' : 'desactivar';
        const confirmacion = await Swal.fire({
            title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} proveedor?`,
            html: `
                <div class="text-start">
                    <p><strong>Proveedor:</strong> ${nombre}</p>
                    <hr>
                    <p class="text-info"><strong>ℹ️ Información:</strong></p>
                    <ul class="text-muted">
                        <li>El proveedor será ${nuevoEstado ? 'activado' : 'desactivado'}</li>
                        <li>${nuevoEstado ? 'Podrá ser utilizado en nuevos pedidos' : 'No aparecerá en la lista de proveedores activos'}</li>
                        <li>Los pedidos existentes no se verán afectados</li>
                    </ul>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: nuevoEstado ? '#28a745' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Sí, ${accion}`,
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (confirmacion.isConfirmed) {
            await confirmarCambiarEstadoProveedor(id, nuevoEstado, nombre);
        }
    } catch (error) {
        console.error('❌ Error en confirmación de cambio de estado:', error);
        mostrarToast('Error', 'Error en la confirmación', 'danger');
    }
}

/**
 * Confirmar cambio de estado del proveedor
 */
async function confirmarCambiarEstadoProveedor(id, nuevoEstado, nombre) {
    try {
        const accion = nuevoEstado ? 'Activando' : 'Desactivando';

        // Mostrar loading
        Swal.fire({
            title: `${accion}...`,
            text: `${accion} proveedor ${nombre}`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/api/Proveedores/${id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ activo: nuevoEstado })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado cambio estado:', resultado);

        if (resultado.success) {
            // Actualizar datos locales inmediatamente
            const proveedor = proveedoresData.find(p => p.id === id);
            if (proveedor) {
                proveedor.activo = nuevoEstado;
            }
            
            // Actualizar datos filtrados también
            const proveedorFiltrado = proveedoresFiltrados.find(p => p.id === id);
            if (proveedorFiltrado) {
                proveedorFiltrado.activo = nuevoEstado;
            }

            // Mostrar mensaje de éxito
            mostrarToast('Éxito', resultado.message || `Proveedor ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
            
            // Cerrar cualquier modal de SweetAlert abierto
            Swal.close();

            // Actualizar vista inmediatamente
            mostrarProveedores();
        } else {
            throw new Error(resultado.message || 'Error cambiando estado del proveedor');
        }
    } catch (error) {
        console.error('❌ Error cambiando estado del proveedor:', error);

        // Cerrar loading si está abierto
        Swal.close();

        // Mostrar error con toast
        mostrarToast('Error', 'Error al cambiar estado: ' + error.message, 'danger');
    }
}

// =====================================
// FUNCIONES DE UI
// =====================================

/**
 * Mostrar/ocultar loading
 */
function mostrarLoading(mostrar) {
    $('#loadingProveedores').toggle(mostrar);
    $('#tablaProveedores').toggle(!mostrar);
}

/**
 * Mostrar/ocultar mensaje sin datos
 */
function mostrarSinDatos(mostrar) {
    $('#sinDatosProveedores').toggle(mostrar);
    $('#tablaProveedores').toggle(!mostrar);
}

/**
 * Actualizar contador de proveedores
 */
function actualizarContador() {
    $('#contadorProveedores').text(proveedoresFiltrados.length);
}

// =====================================
// FUNCIONES DE MENSAJES
// =====================================

/**
 * Mostrar toast usando toastr (consistente con facturación)
 */
function mostrarToast(titulo, mensaje, tipo = 'info') {
    console.log(`🔔 Toast: [${tipo}] ${titulo} - ${mensaje}`);

    // Verificar si toastr está disponible
    if (typeof toastr !== 'undefined') {
        console.log('✅ Usando toastr para mostrar notificación');

        // Configuración moderna de toastr
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": true,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": tipo === 'success' ? "4000" : "3000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut",
            "tapToDismiss": true,
            "escapeHtml": false
        };

        // Iconos para diferentes tipos
        const iconos = {
            'success': '✅ ',
            'danger': '❌ ',
            'warning': '⚠️ ',
            'info': 'ℹ️ '
        };

        const tipoToastr = tipo === 'danger' ? 'error' : tipo;
        const icono = iconos[tipo] || iconos[tipoToastr] || '';
        const mensajeConIcono = icono + mensaje;

        // Mostrar toastr
        if (titulo) {
            toastr[tipoToastr](mensajeConIcono, titulo);
        } else {
            toastr[tipoToastr](mensajeConIcono);
        }

        return;
    }

    // Fallback con SweetAlert
    if (typeof Swal !== 'undefined') {
        console.log('✅ Usando SweetAlert como fallback');
        const iconoSwal = tipo === 'danger' ? 'error' : tipo === 'warning' ? 'warning' : tipo === 'success' ? 'success' : 'info';

        Swal.fire({
            icon: iconoSwal,
            title: titulo,
            text: mensaje,
            confirmButtonText: 'Entendido',
            timer: tipo === 'success' ? 4000 : 3000,
            timerProgressBar: true
        });
        return;
    }

    // Último recurso: alert nativo
    console.warn('⚠️ Ni toastr ni SweetAlert disponibles, usando alert nativo');
    alert((titulo ? titulo + ': ' : '') + mensaje);
}

/**
 * Mostrar alerta con SweetAlert
 */
function mostrarAlerta(mensaje, tipo = 'info', titulo = null) {
    console.log(`🚨 Alerta: [${tipo}] ${titulo || 'Alerta'} - ${mensaje}`);

    if (typeof Swal !== 'undefined') {
        const iconoSwal = tipo === 'danger' || tipo === 'error' ? 'error' : 
                         tipo === 'warning' ? 'warning' : 
                         tipo === 'success' ? 'success' : 'info';

        const tituloFinal = titulo || (tipo === 'error' ? 'Error' : tipo === 'success' ? 'Éxito' : tipo === 'warning' ? 'Advertencia' : 'Información');

        Swal.fire({
            icon: iconoSwal,
            title: tituloFinal,
            text: mensaje,
            confirmButtonText: 'Entendido',
            confirmButtonColor: tipo === 'error' ? '#dc3545' : tipo === 'success' ? '#28a745' : '#007bff'
        });
    } else {
        // Fallback
        alert((titulo ? titulo + ': ' : '') + mensaje);
    }
}

// =====================================
// EXPORTAR FUNCIONES GLOBALMENTE
// =====================================

window.abrirModalProveedor = abrirModalProveedor;
window.editarProveedor = editarProveedor;
window.crearProveedor = crearProveedor;
window.actualizarProveedor = actualizarProveedor;
window.eliminarProveedor = eliminarProveedor;
window.confirmarEliminarProveedor = confirmarEliminarProveedor;
window.verPedidosProveedor = verPedidosProveedor;
window.limpiarFiltros = limpiarFiltros;
window.cambiarEstadoProveedor = cambiarEstadoProveedor;
window.confirmarCambiarEstadoProveedor = confirmarCambiarEstadoProveedor;
window.cargarTodosProveedores = cargarTodosProveedores;
window.alternarVistaProveedores = alternarVistaProveedores;

console.log('✅ Módulo de gestión de proveedores cargado completamente');