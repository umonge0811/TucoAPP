// ===== EDICIÓN DE FACTURAS =====

let facturaOriginal = null;
let facturaActual = null;
let productosEditar = [];
let clienteEditar = null;
let cambiosRealizados = [];

$(document).ready(function() {
    console.log('📝 === INICIANDO MODO EDICIÓN DE FACTURA ===');
    console.log('📝 Factura ID:', window.facturaIdEditar);

    if (!window.facturaIdEditar) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se especificó la factura a editar',
            confirmButtonColor: '#dc3545'
        }).then(() => {
            window.location.href = '/Facturacion';
        });
        return;
    }

    cargarFacturaParaEditar();
    configurarEventosEdicion();
});

// ===== CARGAR FACTURA =====
async function cargarFacturaParaEditar() {
    try {
        console.log('📋 Cargando factura para editar:', window.facturaIdEditar);

        const response = await fetch(`/Facturacion/ObtenerDetalleFactura?facturaId=${window.facturaIdEditar}`);

        if (!response.ok) {
            throw new Error('Error al cargar la factura');
        }

        const result = await response.json();

        if (result.success && result.factura) {
            facturaOriginal = JSON.parse(JSON.stringify(result.factura)); // Copia profunda
            facturaActual = result.factura;

            console.log('✅ Factura cargada:', facturaActual);

            mostrarInformacionFactura();
            cargarDatosCliente();
            cargarProductosFactura();
            calcularTotales();
        } else {
            throw new Error(result.message || 'No se pudo cargar la factura');
        }

    } catch (error) {
        console.error('❌ Error cargando factura:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al Cargar Factura',
            text: error.message,
            confirmButtonColor: '#dc3545'
        }).then(() => {
            window.location.href = '/Facturacion';
        });
    }
}

// ===== MOSTRAR INFORMACIÓN DE LA FACTURA =====
function mostrarInformacionFactura() {
    $('#infoNumeroFactura').text(facturaActual.numeroFactura);

    const estadoBadge = obtenerBadgeEstado(facturaActual.estado);

    const html = `
        <div class="col-md-3">
            <strong>Número:</strong><br>
            <span class="text-primary">${facturaActual.numeroFactura}</span>
        </div>
        <div class="col-md-3">
            <strong>Estado:</strong><br>
            ${estadoBadge}
        </div>
        <div class="col-md-3">
            <strong>Fecha Factura:</strong><br>
            ${new Date(facturaActual.fechaFactura).toLocaleDateString('es-CR')}
        </div>
        <div class="col-md-3">
            <strong>Creado por:</strong><br>
            ${facturaActual.usuarioCreadorNombre || 'N/A'}
        </div>
    `;

    $('#infoFacturaContent').html(html);
}

function obtenerBadgeEstado(estado) {
    const badges = {
        'Pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
        'Pagada': '<span class="badge bg-success">Pagada</span>',
        'Anulada': '<span class="badge bg-danger">Anulada</span>',
        'Vigente': '<span class="badge bg-info">Vigente</span>'
    };
    return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
}

// ===== CARGAR DATOS DEL CLIENTE =====
function cargarDatosCliente() {
    clienteEditar = {
        clienteId: facturaActual.clienteId,
        nombre: facturaActual.nombreCliente,
        identificacion: facturaActual.identificacionCliente,
        telefono: facturaActual.telefonoCliente,
        email: facturaActual.emailCliente,
        direccion: facturaActual.direccionCliente
    };

    $('#clienteIdEditar').val(clienteEditar.clienteId || '');
    $('#nombreClienteEditar').val(clienteEditar.nombre || '');
    $('#identificacionClienteEditar').val(clienteEditar.identificacion || '');
    $('#telefonoClienteEditar').val(clienteEditar.telefono || '');
    $('#emailClienteEditar').val(clienteEditar.email || '');
    $('#direccionClienteEditar').val(clienteEditar.direccion || '');
}

// ===== CARGAR PRODUCTOS =====
function cargarProductosFactura() {
    productosEditar = facturaActual.detallesFactura.map(detalle => ({
        detalleFacturaId: detalle.detalleFacturaId,
        productoId: detalle.productoId,
        nombreProducto: detalle.nombreProducto,
        descripcion: detalle.descripcionProducto,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        porcentajeDescuento: detalle.porcentajeDescuento || 0,
        montoDescuento: detalle.montoDescuento || 0,
        subtotal: detalle.subtotal,
        esLlanta: detalle.esLlanta || false,
        medidaLlanta: detalle.medidaLlanta,
        marcaLlanta: detalle.marcaLlanta
    }));

    actualizarTablaProductos();
}

function actualizarTablaProductos() {
    const tbody = $('#productosFacturaEditar');
    tbody.empty();

    if (productosEditar.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay productos en esta factura
                </td>
            </tr>
        `);
        return;
    }

    productosEditar.forEach((producto, index) => {
        const fila = `
            <tr data-index="${index}">
                <td>
                    <strong>${producto.nombreProducto}</strong>
                    ${producto.descripcion ? `<br><small class="text-muted">${producto.descripcion}</small>` : ''}
                    ${producto.esLlanta ? `<br><span class="badge bg-secondary">${producto.medidaLlanta} - ${producto.marcaLlanta}</span>` : ''}
                </td>
                <td class="text-center">
                    <input type="number" class="form-control form-control-sm text-center cantidad-producto"
                           value="${producto.cantidad}" min="1" data-index="${index}">
                </td>
                <td class="text-end">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">₡</span>
                        <input type="number" class="form-control text-end precio-producto"
                               value="${producto.precioUnitario}" min="0" step="0.01" data-index="${index}">
                    </div>
                </td>
                <td class="text-center">
                    <input type="number" class="form-control form-control-sm text-center descuento-producto"
                           value="${producto.porcentajeDescuento}" min="0" max="100" step="0.01" data-index="${index}">
                </td>
                <td class="text-end">
                    <strong class="text-success subtotal-producto">₡${Number(producto.subtotal).toLocaleString('es-CR', {minimumFractionDigits: 2})}</strong>
                </td>
                <td class="text-center">
                    <button type="button" class="btn btn-danger btn-sm btn-eliminar-producto" data-index="${index}" title="Eliminar producto">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.append(fila);
    });

    // Eventos de cambio
    $('.cantidad-producto, .precio-producto, .descuento-producto').on('change', function() {
        const index = $(this).data('index');
        actualizarProducto(index);
    });

    $('.btn-eliminar-producto').on('click', function() {
        const index = $(this).data('index');
        eliminarProducto(index);
    });
}

// ===== ACTUALIZAR PRODUCTO =====
function actualizarProducto(index) {
    const producto = productosEditar[index];
    const fila = $(`tr[data-index="${index}"]`);

    // Obtener valores actualizados
    const cantidad = parseInt(fila.find('.cantidad-producto').val()) || 1;
    const precio = parseFloat(fila.find('.precio-producto').val()) || 0;
    const descuento = parseFloat(fila.find('.descuento-producto').val()) || 0;

    // Calcular nuevo subtotal
    const subtotalSinDesc = cantidad * precio;
    const montoDesc = subtotalSinDesc * (descuento / 100);
    const subtotal = subtotalSinDesc - montoDesc;

    // Actualizar producto
    producto.cantidad = cantidad;
    producto.precioUnitario = precio;
    producto.porcentajeDescuento = descuento;
    producto.montoDescuento = montoDesc;
    producto.subtotal = subtotal;

    // Actualizar vista
    fila.find('.subtotal-producto').text('₡' + subtotal.toLocaleString('es-CR', {minimumFractionDigits: 2}));

    // Registrar cambio
    registrarCambio('producto_modificado', `Producto "${producto.nombreProducto}" modificado`, {
        productoId: producto.productoId,
        cantidad: cantidad,
        precioUnitario: precio,
        porcentajeDescuento: descuento
    });

    calcularTotales();
}

// ===== ELIMINAR PRODUCTO =====
function eliminarProducto(index) {
    const producto = productosEditar[index];

    Swal.fire({
        title: '¿Eliminar Producto?',
        html: `¿Estás seguro de eliminar <strong>${producto.nombreProducto}</strong> de la factura?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            registrarCambio('producto_eliminado', `Producto "${producto.nombreProducto}" eliminado`, {
                productoId: producto.productoId,
                cantidad: producto.cantidad,
                subtotal: producto.subtotal
            });

            productosEditar.splice(index, 1);
            actualizarTablaProductos();
            calcularTotales();

            mostrarToast('Producto eliminado', 'El producto ha sido eliminado de la factura', 'warning');
        }
    });
}

// ===== CALCULAR TOTALES =====
function calcularTotales() {
    // Calcular subtotal de productos
    let subtotal = productosEditar.reduce((sum, p) => sum + p.subtotal, 0);

    // Aplicar descuento general
    const descuentoGeneral = parseFloat($('#descuentoGeneralEditar').val()) || 0;
    const montoDescuento = subtotal * (descuentoGeneral / 100);
    const subtotalConDescuento = subtotal - montoDescuento;

    // Calcular IVA
    const iva = subtotalConDescuento * 0.13;

    // Total
    const total = subtotalConDescuento + iva;

    // Actualizar vista
    $('#subtotalEditar').text('₡' + subtotal.toLocaleString('es-CR', {minimumFractionDigits: 2}));
    $('#montoDescuentoEditar').text('-₡' + montoDescuento.toLocaleString('es-CR', {minimumFractionDigits: 2}));
    $('#ivaEditar').text('₡' + iva.toLocaleString('es-CR', {minimumFractionDigits: 2}));
    $('#totalEditar').text('₡' + total.toLocaleString('es-CR', {minimumFractionDigits: 2}));
}

// ===== CONFIGURAR EVENTOS =====
function configurarEventosEdicion() {
    // Cambiar cliente
    $('#btnCambiarCliente').on('click', function() {
        abrirModalBuscarCliente();
    });

    // Agregar producto
    $('#btnAgregarProducto').on('click', function() {
        abrirModalAgregarProducto();
    });

    // Descuento general
    $('#descuentoGeneralEditar').on('change', function() {
        const descuento = parseFloat($(this).val()) || 0;
        registrarCambio('descuento_general_modificado', `Descuento general cambiado a ${descuento}%`, {descuento});
        calcularTotales();
    });

    // Método de pago
    $('#metodoPagoEditar').on('change', function() {
        const metodo = $(this).val();
        registrarCambio('metodo_pago_modificado', `Método de pago cambiado a: ${metodo}`, {metodo});
    });

    // Observaciones
    $('#observacionesEditar').on('blur', function() {
        const obs = $(this).val();
        if (obs !== facturaActual.observaciones) {
            registrarCambio('observaciones_modificadas', 'Observaciones actualizadas', {observaciones: obs});
        }
    });

    // Guardar cambios
    $('#btnGuardarCambios').on('click', function() {
        guardarCambiosFactura();
    });

    // Cancelar edición
    $('#btnCancelarEdicion').on('click', function() {
        cancelarEdicion();
    });

    // Ver historial
    $('#btnVerHistorial').on('click', function() {
        mostrarHistorialCambios();
    });

    // Buscar cliente
    $('#buscarClienteInput').on('input', debounce(function() {
        buscarClientes($(this).val());
    }, 300));

    // Buscar producto
    $('#buscarProductoInput').on('input', debounce(function() {
        buscarProductos($(this).val());
    }, 300));
}

// ===== BUSCAR CLIENTES =====
async function buscarClientes(termino) {
    if (!termino || termino.length < 2) {
        $('#resultadosBusquedaCliente').html('<p class="text-muted text-center py-3">Ingrese al menos 2 caracteres para buscar</p>');
        return;
    }

    try {
        const response = await fetch(`/Clientes/BuscarClientes?termino=${encodeURIComponent(termino)}`);
        const resultado = await response.json();

        if (resultado.success && resultado.data && resultado.data.length > 0) {
            let html = '';
            resultado.data.forEach(cliente => {
                html += `
                    <button type="button" class="list-group-item list-group-item-action seleccionar-cliente" data-cliente='${JSON.stringify(cliente)}'>
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${cliente.nombre}</strong><br>
                                <small class="text-muted">
                                    ${cliente.identificacion || 'Sin cédula'} |
                                    ${cliente.telefono || 'Sin teléfono'}
                                </small>
                            </div>
                            <i class="bi bi-chevron-right"></i>
                        </div>
                    </button>
                `;
            });
            $('#resultadosBusquedaCliente').html(html);

            $('.seleccionar-cliente').on('click', function() {
                const cliente = JSON.parse($(this).attr('data-cliente'));
                seleccionarClienteEditar(cliente);
            });
        } else {
            $('#resultadosBusquedaCliente').html('<p class="text-muted text-center py-3">No se encontraron clientes</p>');
        }
    } catch (error) {
        console.error('❌ Error buscando clientes:', error);
        $('#resultadosBusquedaCliente').html('<p class="text-danger text-center py-3">Error al buscar clientes</p>');
    }
}

function seleccionarClienteEditar(cliente) {
    const clienteAnterior = clienteEditar.nombre;

    clienteEditar = {
        clienteId: cliente.clienteId || cliente.id,
        nombre: cliente.nombre,
        identificacion: cliente.identificacion,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion
    };

    cargarDatosCliente();

    registrarCambio('cliente_modificado', `Cliente cambiado de "${clienteAnterior}" a "${cliente.nombre}"`, {
        clienteAnterior: clienteAnterior,
        clienteNuevo: cliente.nombre,
        clienteId: cliente.clienteId || cliente.id
    });

    bootstrap.Modal.getInstance(document.getElementById('modalBuscarCliente')).hide();
    mostrarToast('Cliente actualizado', `Cliente cambiado a: ${cliente.nombre}`, 'success');
}

function abrirModalBuscarCliente() {
    $('#buscarClienteInput').val('');
    $('#resultadosBusquedaCliente').html('<p class="text-muted text-center py-3">Ingrese un término de búsqueda</p>');
    new bootstrap.Modal(document.getElementById('modalBuscarCliente')).show();
}

// ===== BUSCAR PRODUCTOS =====
async function buscarProductos(termino) {
    if (!termino || termino.length < 2) {
        $('#resultadosBusquedaProducto').html('<p class="text-muted text-center py-3">Ingrese al menos 2 caracteres para buscar</p>');
        return;
    }

    try {
        const response = await fetch(`/api/Facturacion/productos-venta?busqueda=${encodeURIComponent(termino)}&soloConStock=false&tamano=20`);
        const resultado = await response.json();

        if (resultado.productos && resultado.productos.length > 0) {
            let html = '';
            resultado.productos.forEach(producto => {
                html += crearCardProducto(producto);
            });
            $('#resultadosBusquedaProducto').html(html);

            $('.agregar-producto-btn').on('click', function() {
                const producto = JSON.parse($(this).attr('data-producto'));
                agregarProductoAFactura(producto);
            });
        } else {
            $('#resultadosBusquedaProducto').html('<p class="text-muted text-center py-3">No se encontraron productos</p>');
        }
    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        $('#resultadosBusquedaProducto').html('<p class="text-danger text-center py-3">Error al buscar productos</p>');
    }
}

function crearCardProducto(producto) {
    return `
        <div class="col-md-4 mb-3">
            <div class="card h-100">
                <div class="card-body">
                    <h6 class="card-title">${producto.nombreProducto}</h6>
                    <p class="card-text">
                        <strong class="text-success">₡${Number(producto.precio || 0).toLocaleString('es-CR', {minimumFractionDigits: 2})}</strong><br>
                        <small class="text-muted">Stock: ${producto.cantidadEnInventario}</small>
                    </p>
                    <button type="button" class="btn btn-sm btn-primary w-100 agregar-producto-btn" data-producto='${JSON.stringify(producto)}'>
                        <i class="bi bi-plus-circle me-1"></i>Agregar
                    </button>
                </div>
            </div>
        </div>
    `;
}

function agregarProductoAFactura(producto) {
    const nuevoProducto = {
        detalleFacturaId: null, // Nuevo producto
        productoId: producto.productoId,
        nombreProducto: producto.nombreProducto,
        descripcion: producto.descripcion,
        cantidad: 1,
        precioUnitario: producto.precio || 0,
        porcentajeDescuento: 0,
        montoDescuento: 0,
        subtotal: producto.precio || 0,
        esLlanta: producto.esLlanta || false,
        medidaLlanta: producto.medidaCompleta,
        marcaLlanta: producto.marca
    };

    productosEditar.push(nuevoProducto);
    actualizarTablaProductos();
    calcularTotales();

    registrarCambio('producto_agregado', `Producto "${producto.nombreProducto}" agregado a la factura`, {
        productoId: producto.productoId,
        cantidad: 1,
        precioUnitario: producto.precio
    });

    bootstrap.Modal.getInstance(document.getElementById('modalAgregarProducto')).hide();
    mostrarToast('Producto agregado', `${producto.nombreProducto} agregado a la factura`, 'success');
}

function abrirModalAgregarProducto() {
    $('#buscarProductoInput').val('');
    $('#resultadosBusquedaProducto').html('<p class="text-muted text-center py-3">Ingrese un término de búsqueda</p>');
    new bootstrap.Modal(document.getElementById('modalAgregarProducto')).show();
}

// ===== GUARDAR CAMBIOS =====
async function guardarCambiosFactura() {
    try {
        if (cambiosRealizados.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin Cambios',
                text: 'No se han realizado cambios en la factura',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }

        // Confirmar guardado
        const confirmacion = await Swal.fire({
            title: '¿Guardar Cambios?',
            html: `Se guardarán <strong>${cambiosRealizados.length}</strong> cambio(s) en la factura.<br>Esta acción quedará registrada en el historial.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        // Preparar datos
        const datosActualizacion = prepararDatosActualizacion();

        console.log('💾 Guardando cambios:', datosActualizacion);

        const response = await fetch(`/Facturacion/ActualizarFactura`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosActualizacion)
        });

        const resultado = await response.json();

        if (resultado.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Cambios Guardados!',
                text: 'Los cambios han sido guardados exitosamente',
                confirmButtonColor: '#28a745',
                timer: 2000
            });

            window.location.href = '/Facturacion';
        } else {
            throw new Error(resultado.message || 'Error al guardar cambios');
        }

    } catch (error) {
        console.error('❌ Error guardando cambios:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al Guardar',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

function prepararDatosActualizacion() {
    // Calcular totales finales
    const subtotal = productosEditar.reduce((sum, p) => sum + p.subtotal, 0);
    const descuentoGeneral = parseFloat($('#descuentoGeneralEditar').val()) || 0;
    const montoDescuento = subtotal * (descuentoGeneral / 100);
    const subtotalConDescuento = subtotal - montoDescuento;
    const iva = subtotalConDescuento * 0.13;
    const total = subtotalConDescuento + iva;

    return {
        facturaId: window.facturaIdEditar,
        clienteId: clienteEditar.clienteId,
        nombreCliente: $('#nombreClienteEditar').val(),
        identificacionCliente: $('#identificacionClienteEditar').val(),
        telefonoCliente: $('#telefonoClienteEditar').val(),
        emailCliente: $('#emailClienteEditar').val(),
        direccionCliente: $('#direccionClienteEditar').val(),
        detallesFactura: productosEditar.map(p => ({
            detalleFacturaId: p.detalleFacturaId,
            productoId: p.productoId,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
            porcentajeDescuento: p.porcentajeDescuento,
            montoDescuento: p.montoDescuento,
            subtotal: p.subtotal
        })),
        descuentoGeneral: descuentoGeneral,
        subtotal: subtotal,
        montoImpuesto: iva,
        total: total,
        metodoPago: $('#metodoPagoEditar').val(),
        observaciones: $('#observacionesEditar').val(),
        cambiosRealizados: cambiosRealizados
    };
}

// ===== CANCELAR EDICIÓN =====
function cancelarEdicion() {
    if (cambiosRealizados.length > 0) {
        Swal.fire({
            title: '¿Cancelar Edición?',
            html: `Tienes <strong>${cambiosRealizados.length}</strong> cambio(s) sin guardar.<br>¿Estás seguro de salir?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, salir sin guardar',
            cancelButtonText: 'Continuar editando'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/Facturacion';
            }
        });
    } else {
        window.location.href = '/Facturacion';
    }
}

// ===== HISTORIAL DE CAMBIOS =====
function mostrarHistorialCambios() {
    let html = '';

    if (cambiosRealizados.length === 0) {
        html = '<p class="text-muted text-center py-4">No se han realizado cambios aún</p>';
    } else {
        html = '<div class="timeline">';
        cambiosRealizados.forEach((cambio, index) => {
            html += `
                <div class="timeline-item mb-3">
                    <div class="d-flex">
                        <div class="timeline-marker bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                             style="width: 30px; height: 30px; flex-shrink: 0;">
                            ${index + 1}
                        </div>
                        <div class="ms-3 flex-grow-1">
                            <strong>${cambio.descripcion}</strong><br>
                            <small class="text-muted">${new Date(cambio.fecha).toLocaleString('es-CR')}</small>
                            ${cambio.detalles ? `<br><code class="small">${JSON.stringify(cambio.detalles)}</code>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    $('#historialCambiosContent').html(html);
    new bootstrap.Modal(document.getElementById('modalHistorialCambios')).show();
}

function registrarCambio(tipo, descripcion, detalles = null) {
    cambiosRealizados.push({
        tipo: tipo,
        descripcion: descripcion,
        detalles: detalles,
        fecha: new Date().toISOString()
    });

    console.log('📝 Cambio registrado:', tipo, descripcion);
}

// ===== UTILIDADES =====
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

function mostrarToast(titulo, mensaje, tipo = 'info') {
    // Usar la función global si existe
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(titulo, mensaje, tipo);
    } else {
        console.log(`[${tipo.toUpperCase()}] ${titulo}: ${mensaje}`);
    }
}

console.log('✅ Módulo de edición de facturas cargado');
