
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
    $('#btnGuardarProveedor').html('<i class="bi bi-plus me-1"></i>Crear Proveedor');
    limpiarFormularioProveedor();
    $('#modalProveedor').modal('show');
}

/**
 * Editar proveedor
 */
function editarProveedor(id) {
    const proveedor = proveedoresData.find(p => p.proveedorId === id);
    if (!proveedor) {
        mostrarAlerta('Proveedor no encontrado', 'error');
        return;
    }

    proveedorEditando = proveedor;
    $('#tituloModalProveedor').html('<i class="bi bi-pencil me-2"></i>Editar Proveedor');
    $('#btnGuardarProveedor').html('<i class="bi bi-save me-1"></i>Actualizar Proveedor');
    
    // Llenar formulario
    $('#proveedorId').val(proveedor.proveedorId);
    $('#nombreProveedor').val(proveedor.nombreProveedor);
    $('#contacto').val(proveedor.contacto || '');
    $('#telefono').val(proveedor.telefono || '');
    $('#direccion').val(proveedor.direccion || '');

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
            contacto: $('#contacto').val().trim() || null,
            telefono: $('#telefono').val().trim() || null,
            direccion: $('#direccion').val().trim() || null
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
            proveedorId: proveedorEditando.proveedorId,
            nombreProveedor: $('#nombreProveedor').val().trim(),
            contacto: $('#contacto').val().trim() || null,
            telefono: $('#telefono').val().trim() || null,
            direccion: $('#direccion').val().trim() || null
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

/**
 * Validar formulario de proveedor
 */
function validarFormularioProveedor() {
    const nombre = $('#nombreProveedor').val().trim();

    if (!nombre) {
        mostrarAlerta('El nombre del proveedor es requerido', 'warning');
        $('#nombreProveedor').focus();
        return false;
    }

    if (nombre.length < 2) {
        mostrarAlerta('El nombre del proveedor debe tener al menos 2 caracteres', 'warning');
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
                        <li>Los pedidos asociados podrían verse afectados</li>
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

console.log('✅ Módulo de gestión de proveedores cargado completamente');
