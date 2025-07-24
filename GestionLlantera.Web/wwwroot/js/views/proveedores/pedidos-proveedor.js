// ========================================
// MÓDULO DE PEDIDOS A PROVEEDORES
// Ubicación: /js/views/proveedores/pedidos-proveedor.js
// ========================================

console.log('🚀 Inicializando módulo de pedidos a proveedores...');

// =====================================
// VARIABLES GLOBALES
// =====================================

let pedidosData = [];
let pedidosFiltrados = [];
let proveedoresDisponibles = [];
let productosInventario = [];
let productosSeleccionados = [];
let proveedorSeleccionado = null;

// =====================================
// INICIALIZACIÓN
// =====================================

$(document).ready(function () {
    console.log('📚 DOM cargado, inicializando pedidos a proveedores...');

    try {
        configurarEventListeners();
        cargarDatosIniciales();

        console.log('✅ Módulo de pedidos a proveedores inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de pedidos:', error);
        mostrarError('Error al inicializar la página');
    }
});

// =====================================
// EVENT LISTENERS
// =====================================

function configurarEventListeners() {
    console.log('🔧 Configurando event listeners...');

    // Filtros
    $('#filtroProveedor, #filtroEstado').on('change', aplicarFiltros);
    $('#buscarPedido').on('input', aplicarFiltros);

    // Modal de nuevo pedido
    $('#modalNuevoPedido').on('hidden.bs.modal', function() {
        resetearFormularioPedido();
    });
}

// =====================================
// FUNCIONES PRINCIPALES
// =====================================

/**
 * Cargar datos iniciales
 */
async function cargarDatosIniciales() {
    await Promise.all([
        cargarProveedores(),
        cargarPedidos(),
        cargarProductosInventario()
    ]);
}

/**
 * Cargar todos los proveedores
 */
async function cargarProveedores() {
    try {
        console.log('👥 Cargando proveedores...');

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
            proveedoresDisponibles = Array.isArray(data.data) ? data.data : [];
            llenarSelectProveedores();
            console.log(`✅ ${proveedoresDisponibles.length} proveedores cargados`);
        } else {
            throw new Error(data.message || 'Error obteniendo proveedores');
        }
    } catch (error) {
        console.error('❌ Error cargando proveedores:', error);
        proveedoresDisponibles = [];
        llenarSelectProveedores(); // Llenar con array vacío para limpiar los selects
        if (typeof mostrarError === 'function') {
            mostrarError('Error cargando proveedores: ' + error.message);
        }
    }
}

/**
 * Cargar todos los pedidos
 */
async function cargarPedidos() {
    try {
        console.log('📦 Cargando pedidos...');
        mostrarLoadingPedidos(true);

        // Obtener parámetro de proveedor de la URL si existe
        const urlParams = new URLSearchParams(window.location.search);
        const proveedorId = urlParams.get('proveedorId');

        let url = '/Proveedores/ObtenerPedidosProveedor';
        if (proveedorId) {
            url += `?proveedorId=${proveedorId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            pedidosData = data.data;
            pedidosFiltrados = [...pedidosData];
            mostrarPedidos();
            actualizarContadorPedidos();
            console.log(`✅ ${pedidosData.length} pedidos cargados`);
        } else {
            throw new Error(data.message || 'Error obteniendo pedidos');
        }
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        mostrarError('Error cargando pedidos: ' + error.message);
        mostrarSinDatosPedidos(true);
    } finally {
        mostrarLoadingPedidos(false);
    }
}

/**
 * Cargar productos del inventario
 */
async function cargarProductosInventario() {
    try {
        console.log('📦 Cargando productos del inventario...');

        const response = await fetch('/Facturacion/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success && data.productos) {
            productosInventario = data.productos;
            console.log(`✅ ${productosInventario.length} productos del inventario cargados`);
        }
    } catch (error) {
        console.error('❌ Error cargando productos del inventario:', error);
    }
}

/**
 * Llenar select de proveedores
 */
function llenarSelectProveedores() {
    console.log('🔄 Iniciando llenarSelectProveedores...');
    console.log('📋 proveedoresDisponibles:', proveedoresDisponibles);

    const select = $('#selectProveedor');
    const filtro = $('#filtroProveedor');

    // Limpiar opciones existentes
    select.html('<option value="">Seleccione un proveedor...</option>');
    filtro.html('<option value="">Todos los proveedores</option>');

    if (!proveedoresDisponibles || proveedoresDisponibles.length === 0) {
        console.warn('⚠️ No hay proveedores disponibles para llenar los selects');
        return;
    }

    console.log(`🔢 Total proveedores a procesar: ${proveedoresDisponibles.length}`);

    let proveedoresAgregados = 0;

    // Usar for loop clásico en lugar de forEach para mejor control
    for (let i = 0; i < proveedoresDisponibles.length; i++) {
        const proveedor = proveedoresDisponibles[i];
        console.log(`🔍 Procesando proveedor ${i + 1}:`, proveedor);
        
        // Log detallado de las propiedades del proveedor
        console.log('📊 Propiedades del proveedor:', {
            id: proveedor?.id,
            nombre: proveedor?.nombre,
            proveedorId: proveedor?.proveedorId,
            nombreProveedor: proveedor?.nombreProveedor,
            contacto: proveedor?.contacto,
            telefono: proveedor?.telefono,
            direccion: proveedor?.direccion
        });

        // Verificar si tiene los datos mínimos necesarios
        const tieneId = proveedor && (proveedor.id || proveedor.proveedorId);
        const tieneNombre = proveedor && (proveedor.nombre || proveedor.nombreProveedor);
        
        if (tieneId && tieneNombre) {
            // Usar la propiedad correcta según lo que esté disponible
            const proveedorId = proveedor.id || proveedor.proveedorId;
            const nombreProveedor = proveedor.nombre || proveedor.nombreProveedor || 'Sin nombre';
            
            const option = `<option value="${proveedorId}">${nombreProveedor}</option>`;

            console.log(`➕ Agregando opción: ${option}`);
            select.append(option);
            filtro.append(option);
            proveedoresAgregados++;
        } else {
            console.warn('⚠️ Proveedor con datos incompletos:', proveedor);
            console.warn('📋 Validación fallida:', {
                tieneId: tieneId,
                tieneNombre: tieneNombre,
                valorId: proveedor?.id || proveedor?.proveedorId,
                valorNombre: proveedor?.nombre || proveedor?.nombreProveedor
            });
        }
    }

    console.log(`✅ ${proveedoresAgregados} de ${proveedoresDisponibles.length} proveedores agregados a los selects`);

    // Verificar que las opciones se agregaron correctamente
    console.log(`📊 Opciones en select: ${select.find('option').length}`);
    console.log(`📊 Opciones en filtro: ${filtro.find('option').length}`);
}

/**
 * Mostrar pedidos en la tabla
 */
function mostrarPedidos() {
    const tbody = $('#cuerpoTablaPedidos');

    if (pedidosFiltrados.length === 0) {
        mostrarSinDatosPedidos(true);
        return;
    }

    mostrarSinDatosPedidos(false);

    const html = pedidosFiltrados.map(pedido => {
        const fecha = new Date(pedido.fechaPedido).toLocaleDateString('es-ES');
        const estadoBadge = obtenerBadgeEstado(pedido.estado);

        return `
            <tr>
                <td>${pedido.pedidoId}</td>
                <td>
                    <strong>${pedido.proveedorNombre}</strong>
                </td>
                <td>${fecha}</td>
                <td>${estadoBadge}</td>
                <td>
                    <span class="badge bg-info">${pedido.totalProductos}</span>
                </td>
                <td>
                    <strong>$${pedido.montoTotal.toFixed(2)}</strong>
                </td>
                <td>${pedido.usuarioNombre}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-info" onclick="verDetallePedido(${pedido.pedidoId})" title="Ver Detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-warning" onclick="cambiarEstadoPedido(${pedido.pedidoId}, '${pedido.estado}')" title="Cambiar Estado">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.html(html);
}

/**
 * Obtener badge según el estado
 */
function obtenerBadgeEstado(estado) {
    const badges = {
        'Pendiente': 'bg-warning',
        'Enviado': 'bg-info',
        'Recibido': 'bg-success',
        'Cancelado': 'bg-danger'
    };

    const clase = badges[estado] || 'bg-secondary';
    return `<span class="badge ${clase}">${estado}</span>`;
}

/**
 * Aplicar filtros a la tabla
 */
function aplicarFiltros() {
    const proveedorId = $('#filtroProveedor').val();
    const estado = $('#filtroEstado').val();
    const busqueda = $('#buscarPedido').val().toLowerCase().trim();

    pedidosFiltrados = pedidosData.filter(pedido => {
        const cumpleProveedor = !proveedorId || pedido.proveedorId.toString() === proveedorId;
        const cumpleEstado = !estado || pedido.estado === estado;
        const cumpleBusqueda = !busqueda || 
            pedido.pedidoId.toString().includes(busqueda) ||
            pedido.proveedorNombre.toLowerCase().includes(busqueda);

        return cumpleProveedor && cumpleEstado && cumpleBusqueda;
    });

    mostrarPedidos();
    actualizarContadorPedidos();
}

// =====================================
// FUNCIONES DEL MODAL NUEVO PEDIDO
// =====================================

/**
 * Abrir modal para nuevo pedido
 */
function abrirModalNuevoPedido() {
    if (proveedoresDisponibles.length === 0) {
        mostrarError('Debe crear al menos un proveedor antes de hacer un pedido');
        return;
    }

    resetearFormularioPedido();
    $('#modalNuevoPedido').modal('show');
}

/**
 * Seleccionar proveedor
 */
function seleccionarProveedor() {
    const proveedorId = $('#selectProveedor').val();

    if (!proveedorId) {
        proveedorSeleccionado = null;
        $('#infoProveedorSeleccionado').hide();
        $('#btnSiguientePaso').prop('disabled', true);
        return;
    }

    proveedorSeleccionado = proveedoresDisponibles.find(p => p.proveedorId.toString() === proveedorId);

    if (proveedorSeleccionado) {
        mostrarInfoProveedor(proveedorSeleccionado);
        $('#btnSiguientePaso').prop('disabled', false);
    }
}

/**
 * Mostrar información del proveedor seleccionado
 */
function mostrarInfoProveedor(proveedor) {
    if (!proveedor) {
        console.error('❌ Proveedor no válido para mostrar información');
        return;
    }

    $('#infoNombreProveedor').text(proveedor.nombreProveedor || 'Sin nombre');
    $('#infoContactoProveedor').text(proveedor.contacto || 'No especificado');
    $('#infoTelefonoProveedor').text(proveedor.telefono || 'No especificado');
    $('#infoDireccionProveedor').text(proveedor.direccion || 'No especificada');
    $('#infoProveedorSeleccionado').show();
}

/**
 * Ir al siguiente paso
 */
function siguientePaso() {
    $('#pasoSeleccionarProveedor').hide();
    $('#pasoSeleccionarProductos').show();
    cargarProductosEnTabla();
}

/**
 * Volver al paso anterior
 */
function anteriorPaso() {
    $('#pasoSeleccionarProductos').hide();
    $('#pasoSeleccionarProveedor').show();
}

/**
 * Cargar productos en la tabla de selección
 */
function cargarProductosEnTabla() {
    const tbody = $('#cuerpoTablaProductosPedido');

    if (productosInventario.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    <p class="mt-2">No hay productos disponibles en el inventario</p>
                </td>
            </tr>
        `);
        return;
    }

    const html = productosInventario.map(producto => `
        <tr data-producto-id="${producto.productoId}">
            <td>
                <input type="checkbox" class="form-check-input producto-checkbox" 
                       value="${producto.productoId}" 
                       onchange="toggleProductoSeleccionado(${producto.productoId})">
            </td>
            <td>
                <strong>${producto.nombreProducto}</strong>
                <br>
                <small class="text-muted">${producto.modelo || ''}</small>
            </td>
            <td>${producto.marca || '-'}</td>
            <td>
                <span class="badge ${producto.stock > 0 ? 'bg-success' : 'bg-danger'}">${producto.stock}</span>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm cantidad-producto" 
                       value="1" min="1" style="width: 80px;" 
                       onchange="actualizarCantidadProducto(${producto.productoId}, this.value)"
                       disabled>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm precio-producto" 
                       value="0.00" min="0" step="0.01" style="width: 100px;"
                       onchange="actualizarPrecioProducto(${producto.productoId}, this.value)"
                       disabled>
            </td>
        </tr>
    `).join('');

    tbody.html(html);
}

/**
 * Toggle producto seleccionado
 */
function toggleProductoSeleccionado(productoId) {
    const checkbox = $(`.producto-checkbox[value="${productoId}"]`);
    const fila = $(`tr[data-producto-id="${productoId}"]`);
    const cantidadInput = fila.find('.cantidad-producto');
    const precioInput = fila.find('.precio-producto');

    if (checkbox.is(':checked')) {
        // Agregar producto
        const producto = productosInventario.find(p => p.productoId === productoId);
        productosSeleccionados.push({
            ...producto,
            cantidad: 1,
            precioUnitario: 0.00
        });

        cantidadInput.prop('disabled', false);
        precioInput.prop('disabled', false);
        fila.addClass('table-success');
    } else {
        // Remover producto
        productosSeleccionados = productosSeleccionados.filter(p => p.productoId !== productoId);

        cantidadInput.prop('disabled', true).val(1);
        precioInput.prop('disabled', true).val('0.00');
        fila.removeClass('table-success');
    }

    actualizarResumenPedido();
}

/**
 * Actualizar cantidad de producto
 */
function actualizarCantidadProducto(productoId, cantidad) {
    const producto = productosSeleccionados.find(p => p.productoId === productoId);
    if (producto) {
        producto.cantidad = parseInt(cantidad) || 1;
        actualizarResumenPedido();
    }
}

/**
 * Actualizar precio de producto
 */
function actualizarPrecioProducto(productoId, precio) {
    const producto = productosSeleccionados.find(p => p.productoId === productoId);
    if (producto) {
        producto.precioUnitario = parseFloat(precio) || 0.00;
        actualizarResumenPedido();
    }
}

/**
 * Actualizar resumen del pedido
 */
function actualizarResumenPedido() {
    const totalProductos = productosSeleccionados.length;
    const cantidadTotal = productosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0);
    const montoTotal = productosSeleccionados.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);

    $('#contadorSeleccionados').text(totalProductos);
    $('#totalProductosSeleccionados').text(totalProductos);
    $('#cantidadTotalSeleccionada').text(cantidadTotal);
    $('#montoTotalEstimado').text(montoTotal.toFixed(2));
}

/**
 * Filtrar productos en la tabla
 */
function filtrarProductosPedido() {
    const busqueda = $('#buscarProductoPedido').val().toLowerCase();
    const categoria = $('#filtroCategoriaPedido').val();

    $('tr[data-producto-id]').each(function() {
        const fila = $(this);
        const productoId = parseInt(fila.data('producto-id'));
        const producto = productosInventario.find(p => p.productoId === productoId);

        if (!producto) return;

        const cumpleBusqueda = !busqueda || 
            producto.nombreProducto.toLowerCase().includes(busqueda) ||
            (producto.marca && producto.marca.toLowerCase().includes(busqueda));

        const cumpleCategoria = !categoria || producto.categoria === categoria;

        fila.toggle(cumpleBusqueda && cumpleCategoria);
    });
}

/**
 * Seleccionar todos los productos visibles
 */
function seleccionarTodosProductos() {
    const seleccionarTodos = $('#seleccionarTodosProductos').is(':checked');

    $('tr[data-producto-id]:visible .producto-checkbox').each(function() {
        const checkbox = $(this);
        const productoId = parseInt(checkbox.val());

        if (seleccionarTodos && !checkbox.is(':checked')) {
            checkbox.prop('checked', true);
            toggleProductoSeleccionado(productoId);
        } else if (!seleccionarTodos && checkbox.is(':checked')) {
            checkbox.prop('checked', false);
            toggleProductoSeleccionado(productoId);
        }
    });
}

/**
 * Finalizar pedido
 */
async function finalizarPedido() {
    if (productosSeleccionados.length === 0) {
        mostrarError('Debe seleccionar al menos un producto');
        return;
    }

    if (!proveedorSeleccionado) {
        mostrarError('Debe seleccionar un proveedor');
        return;
    }

    try {
        const btnFinalizar = $('button[onclick="finalizarPedido()"]');
        const textoOriginal = btnFinalizar.html();
        btnFinalizar.html('<i class="bi bi-hourglass-split me-1"></i>Creando Pedido...').prop('disabled', true);

        const datosPedido = {
            proveedorId: proveedorSeleccionado.proveedorId,
            productos: productosSeleccionados.map(p => ({
                productoId: p.productoId,
                cantidad: p.cantidad,
                precioUnitario: p.precioUnitario
            }))
        };

        const response = await fetch('/Proveedores/CrearPedidoProveedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosPedido)
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito('Pedido creado exitosamente');
            $('#modalNuevoPedido').modal('hide');
            await cargarPedidos(); // Recargar lista
        } else {
            mostrarError(resultado.message);
        }
    } catch (error) {
        console.error('❌ Error creando pedido:', error);
        mostrarError('Error creando pedido: ' + error.message);
    } finally {
        const btnFinalizar = $('button[onclick="finalizarPedido()"]');
        btnFinalizar.html('<i class="bi bi-check-circle me-1"></i>Finalizar Pedido <span id="contadorSeleccionados" class="badge bg-white text-success ms-1">' + productosSeleccionados.length + '</span>').prop('disabled', false);
    }
}

/**
 * Resetear formulario de pedido
 */
function resetearFormularioPedido() {
    proveedorSeleccionado = null;
    productosSeleccionados = [];

    $('#selectProveedor').val('');
    $('#infoProveedorSeleccionado').hide();
    $('#btnSiguientePaso').prop('disabled', true);

    $('#pasoSeleccionarProveedor').show();
    $('#pasoSeleccionarProductos').hide();

    $('#buscarProductoPedido').val('');
    $('#filtroCategoriaPedido').val('');
    $('#seleccionarTodosProductos').prop('checked', false);

    actualizarResumenPedido();
}

// =====================================
// MODAL PROVEEDOR RÁPIDO
// =====================================

/**
 * Abrir modal para crear proveedor rápido
 */
function abrirModalProveedorRapido() {
    $('#formProveedorRapido')[0].reset();
    $('#modalProveedorRapido').modal('show');
}

/**
 * Guardar proveedor rápido
 */
async function guardarProveedorRapido() {
    try {
        const nombre = $('#nombreProveedorRapido').val().trim();

        if (!nombre) {
            mostrarError('El nombre del proveedor es requerido');
            return;
        }

        const datosProveedor = {
            nombreProveedor: nombre,
            contacto: $('#contactoRapido').val().trim() || null,
            telefono: $('#telefonoRapido').val().trim() || null,
            direccion: null
        };

        const response = await fetch('/Proveedores/CrearProveedor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosProveedor)
        });

        const resultado = await response.json();

        if (resultado.success) {
            mostrarExito('Proveedor creado exitosamente');
            $('#modalProveedorRapido').modal('hide');

            // Recargar proveedores y seleccionar el nuevo
            await cargarProveedores();
            $('#selectProveedor').val(resultado.data.proveedorId);
            seleccionarProveedor();
        } else {
            mostrarError(resultado.message);
        }
    } catch (error) {
        console.error('❌ Error creando proveedor rápido:', error);
        mostrarError('Error creando proveedor: ' + error.message);
    }
}

// =====================================
// FUNCIONES DE ACCIONES
// =====================================

/**
 * Ver detalle de un pedido
 */
async function verDetallePedido(pedidoId) {
    try {
        console.log('👁️ Viendo detalle del pedido:', pedidoId);

        // Buscar pedido en los datos locales
        const pedido = pedidosData.find(p => p.pedidoId === pedidoId);

        if (!pedido) {
            mostrarError('Pedido no encontrado');
            return;
        }

        const fecha = new Date(pedido.fechaPedido).toLocaleDateString('es-ES');
        const estadoBadge = obtenerBadgeEstado(pedido.estado);

        const html = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información del Pedido</h6>
                    <p><strong>ID:</strong> ${pedido.pedidoId}</p>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    <p><strong>Estado:</strong> ${estadoBadge}</p>
                    <p><strong>Usuario:</strong> ${pedido.usuarioNombre}</p>
                </div>
                <div class="col-md-6">
                    <h6>Información del Proveedor</h6>
                    <p><strong>Nombre:</strong> ${pedido.proveedorNombre}</p>
                </div>
            </div>

            <h6 class="mt-3">Productos del Pedido</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead class="table-light">
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedido.detallePedidos.map(detalle => `
                            <tr>
                                <td>${detalle.productoNombre}</td>
                                <td>${detalle.cantidad}</td>
                                <td>$${(detalle.precioUnitario || 0).toFixed(2)}</td>
                                <td><strong>$${detalle.subtotal.toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <th colspan="3">Total:</th>
                            <th>$${pedido.montoTotal.toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        $('#contenidoDetallePedido').html(html);
        $('#modalDetallePedido').modal('show');
    } catch (error) {
        console.error('❌ Error viendo detalle del pedido:', error);
        mostrarError('Error cargando detalle del pedido');
    }
}

/**
 * Cambiar estado de un pedido
 */
function cambiarEstadoPedido(pedidoId, estadoActual) {
    // Implementar cambio de estado
    console.log('🔄 Cambiando estado del pedido:', pedidoId, estadoActual);
    // Por ahora solo log, se puede implementar un modal para cambiar estado
}

// =====================================
// FUNCIONES DE UI
// =====================================

/**
 * Mostrar/ocultar loading de pedidos
 */
function mostrarLoadingPedidos(mostrar) {
    $('#loadingPedidos').toggle(mostrar);
    $('#tablaPedidos').toggle(!mostrar);
}

/**
 * Mostrar/ocultar mensaje sin datos de pedidos
 */
function mostrarSinDatosPedidos(mostrar) {
    $('#sinDatosPedidos').toggle(mostrar);
    $('#tablaPedidos').toggle(!mostrar);
}

/**
 * Actualizar contador de pedidos
 */
function actualizarContadorPedidos() {
    $('#contadorPedidos').text(pedidosFiltrados.length);
}

// =====================================
// FUNCIONES DE MENSAJES
// =====================================

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito(mensaje) {
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

window.abrirModalNuevoPedido = abrirModalNuevoPedido;
window.seleccionarProveedor = seleccionarProveedor;
window.siguientePaso = siguientePaso;
window.anteriorPaso = anteriorPaso;
window.toggleProductoSeleccionado = toggleProductoSeleccionado;
window.actualizarCantidadProducto = actualizarCantidadProducto;
window.actualizarPrecioProducto = actualizarPrecioProducto;
window.filtrarProductosPedido = filtrarProductosPedido;
window.seleccionarTodosProductos = seleccionarTodosProductos;
window.finalizarPedido = finalizarPedido;
window.abrirModalProveedorRapido = abrirModalProveedorRapido;
window.guardarProveedorRapido = guardarProveedorRapido;
window.verDetallePedido = verDetallePedido;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.aplicarFiltros = aplicarFiltros;

console.log('✅ Módulo de pedidos a proveedores cargado completamente');