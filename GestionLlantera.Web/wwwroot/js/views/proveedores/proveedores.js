
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
        mostrarError('Error al inicializar la página');
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

    // Validación del formulario
    $('#formProveedor').on('submit', function(e) {
        e.preventDefault();
        guardarProveedor();
    });

    // Limpiar formulario al cerrar modal
    $('#modalProveedor').on('hidden.bs.modal', function() {
        limpiarFormularioProveedor();
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
            }
        });

        const data = await response.json();

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
        mostrarError('Error cargando proveedores: ' + error.message);
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
        
        return `
            <tr>
                <td>${proveedor.proveedorId}</td>
                <td>
                    <strong>${proveedor.nombreProveedor}</strong>
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
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="editarProveedor(${proveedor.proveedorId})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-info" onclick="verPedidosProveedor(${proveedor.proveedorId})" title="Ver Pedidos">
                            <i class="bi bi-box-seam"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarProveedor(${proveedor.proveedorId}, '${proveedor.nombreProveedor.replace(/'/g, "\\'")}')" title="Eliminar">
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
            proveedor.nombreProveedor.toLowerCase().includes(termino) ||
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

// =====================================
// FUNCIONES DEL MODAL
// =====================================

/**
 * Abrir modal para nuevo proveedor
 */
function abrirModalProveedor() {
    proveedorEditando = null;
    $('#tituloModalProveedor').html('<i class="bi bi-truck me-2"></i>Nuevo Proveedor');
    limpiarFormularioProveedor();
    $('#modalProveedor').modal('show');
}

/**
 * Editar proveedor
 */
function editarProveedor(id) {
    const proveedor = proveedoresData.find(p => p.proveedorId === id);
    if (!proveedor) {
        mostrarError('Proveedor no encontrado');
        return;
    }

    proveedorEditando = proveedor;
    $('#tituloModalProveedor').html('<i class="bi bi-pencil me-2"></i>Editar Proveedor');
    
    // Llenar formulario
    $('#proveedorId').val(proveedor.proveedorId);
    $('#nombreProveedor').val(proveedor.nombreProveedor);
    $('#contacto').val(proveedor.contacto || '');
    $('#telefono').val(proveedor.telefono || '');
    $('#direccion').val(proveedor.direccion || '');

    $('#modalProveedor').modal('show');
}

/**
 * Guardar proveedor (crear o actualizar)
 */
async function guardarProveedor() {
    try {
        if (!validarFormularioProveedor()) {
            return;
        }

        const btnGuardar = $('#btnGuardarProveedor');
        const textoOriginal = btnGuardar.html();
        btnGuardar.html('<i class="bi bi-hourglass-split me-1"></i>Guardando...').prop('disabled', true);

        const datosProveedor = {
            proveedorId: $('#proveedorId').val() || 0,
            nombreProveedor: $('#nombreProveedor').val().trim(),
            contacto: $('#contacto').val().trim() || null,
            telefono: $('#telefono').val().trim() || null,
            direccion: $('#direccion').val().trim() || null
        };

        const esEdicion = proveedorEditando !== null;
        const url = esEdicion ? '/Proveedores/ActualizarProveedor' : '/Proveedores/CrearProveedor';
        const metodo = esEdicion ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosProveedor)
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito(resultado.message);
            $('#modalProveedor').modal('hide');
            await cargarProveedores(); // Recargar lista
        } else {
            mostrarError(resultado.message);
        }
    } catch (error) {
        console.error('❌ Error guardando proveedor:', error);
        mostrarError('Error guardando proveedor: ' + error.message);
    } finally {
        const btnGuardar = $('#btnGuardarProveedor');
        btnGuardar.html('<i class="bi bi-save me-1"></i>Guardar').prop('disabled', false);
    }
}

/**
 * Validar formulario de proveedor
 */
function validarFormularioProveedor() {
    const nombre = $('#nombreProveedor').val().trim();

    if (!nombre) {
        mostrarError('El nombre del proveedor es requerido');
        $('#nombreProveedor').focus();
        return false;
    }

    if (nombre.length < 2) {
        mostrarError('El nombre del proveedor debe tener al menos 2 caracteres');
        $('#nombreProveedor').focus();
        return false;
    }

    return true;
}

/**
 * Limpiar formulario de proveedor
 */
function limpiarFormularioProveedor() {
    $('#formProveedor')[0].reset();
    $('#proveedorId').val('');
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').remove();
}

// =====================================
// FUNCIONES DE ELIMINACIÓN
// =====================================

/**
 * Mostrar modal de confirmación para eliminar
 */
function eliminarProveedor(id, nombre) {
    $('#nombreProveedorEliminar').text(nombre);
    $('#btnConfirmarEliminar').data('proveedor-id', id);
    $('#modalEliminarProveedor').modal('show');
}

/**
 * Confirmar eliminación de proveedor
 */
async function confirmarEliminarProveedor() {
    try {
        const id = $('#btnConfirmarEliminar').data('proveedor-id');
        const btnEliminar = $('#btnConfirmarEliminar');
        const textoOriginal = btnEliminar.html();
        
        btnEliminar.html('<i class="bi bi-hourglass-split me-1"></i>Eliminando...').prop('disabled', true);

        const response = await fetch(`/Proveedores/EliminarProveedor?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito(resultado.message);
            $('#modalEliminarProveedor').modal('hide');
            await cargarProveedores(); // Recargar lista
        } else {
            mostrarError(resultado.message);
        }
    } catch (error) {
        console.error('❌ Error eliminando proveedor:', error);
        mostrarError('Error eliminando proveedor: ' + error.message);
    } finally {
        const btnEliminar = $('#btnConfirmarEliminar');
        btnEliminar.html('<i class="bi bi-trash me-1"></i>Eliminar').prop('disabled', false);
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
 * Mostrar mensaje de éxito
 */
function mostrarExito(mensaje) {
    // Implementar toast de éxito
    console.log('✅ Éxito:', mensaje);
    if (typeof mostrarToast === 'function') {
        mostrarToast('Éxito', mensaje, 'success');
    } else {
        alert('Éxito: ' + mensaje);
    }
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
    // Implementar toast de error
    console.error('❌ Error:', mensaje);
    if (typeof mostrarToast === 'function') {
        mostrarToast('Error', mensaje, 'danger');
    } else {
        alert('Error: ' + mensaje);
    }
}

// =====================================
// EXPORTAR FUNCIONES GLOBALMENTE
// =====================================

window.abrirModalProveedor = abrirModalProveedor;
window.editarProveedor = editarProveedor;
window.guardarProveedor = guardarProveedor;
window.eliminarProveedor = eliminarProveedor;
window.confirmarEliminarProveedor = confirmarEliminarProveedor;
window.verPedidosProveedor = verPedidosProveedor;
window.limpiarFiltros = limpiarFiltros;

console.log('✅ Módulo de gestión de proveedores cargado completamente');
