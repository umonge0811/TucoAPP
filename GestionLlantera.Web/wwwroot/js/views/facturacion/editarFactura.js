// ===== EDICIÓN DE FACTURAS =====

let facturaOriginal = null;
let facturaActual = null;
let productosEditar = [];
let clienteEditar = null;
let cambiosRealizados = [];
let estadoOriginal = null; // Para restaurar el estado si se cancela sin cambios

$(document).ready(function() {
    console.log('📝 === INICIANDO MODO EDICIÓN DE FACTURA ===');
    console.log('📝 Factura ID:', window.facturaIdEditar);

    // Obtener estado anterior de la URL (si viene desde desbloqueo con PIN)
    const urlParams = new URLSearchParams(window.location.search);
    const estadoAnteriorParam = urlParams.get('estadoAnterior');
    if (estadoAnteriorParam) {
        estadoOriginal = estadoAnteriorParam;
        console.log('📌 Estado original guardado:', estadoOriginal);
    }

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

            // Si no tenemos el estado original de la URL, intentar extraerlo de las observaciones
            if (!estadoOriginal && facturaActual.observaciones) {
                const match = facturaActual.observaciones.match(/Estado anterior:\s*([^)]+)\)/);
                if (match && match[1]) {
                    estadoOriginal = match[1].trim();
                    console.log('📌 Estado original extraído de observaciones:', estadoOriginal);
                }
            }

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

// ===== CALCULAR TOTALES (SIN IVA) =====
function calcularTotales() {
    // Calcular subtotal de productos
    let subtotal = productosEditar.reduce((sum, p) => sum + p.subtotal, 0);

    // Aplicar descuento general
    const descuentoGeneral = parseFloat($('#descuentoGeneralEditar').val()) || 0;
    const montoDescuento = subtotal * (descuentoGeneral / 100);
    const subtotalConDescuento = subtotal - montoDescuento;

    // Total SIN IVA (la factura ya tiene IVA incluido en los precios)
    const total = subtotalConDescuento;

    // Actualizar vista
    $('#subtotalEditar').text('₡' + subtotal.toLocaleString('es-CR', {minimumFractionDigits: 2}));
    $('#montoDescuentoEditar').text('-₡' + montoDescuento.toLocaleString('es-CR', {minimumFractionDigits: 2}));
    $('#ivaEditar').text('₡0.00'); // Sin IVA adicional
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

    // Toggle de anulación
    $('#toggleAnularFactura').on('change', function() {
        manejarToggleAnulacion(this.checked);
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

        // Preparar datos primero para verificar si se va a anular
        const datosActualizacion = prepararDatosActualizacion();

        // Confirmar guardado
        const esAnulacion = datosActualizacion.esAnulada;
        const tituloConfirmacion = esAnulacion ? '⚠️ ¿ANULAR FACTURA?' : '¿Guardar Cambios?';
        const mensajeConfirmacion = esAnulacion
            ? `<div class="alert alert-danger">
                <strong>ATENCIÓN:</strong> Está a punto de <strong>ANULAR</strong> esta factura.
                <br>Todos los productos se devolverán al inventario.
                <br><br>¿Está seguro de continuar?
               </div>`
            : `Se guardarán <strong>${cambiosRealizados.length}</strong> cambio(s) en la factura.<br>Esta acción quedará registrada en el historial.`;

        const confirmacion = await Swal.fire({
            title: tituloConfirmacion,
            html: mensajeConfirmacion,
            icon: esAnulacion ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: esAnulacion ? '#dc3545' : '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: esAnulacion ? 'Sí, ANULAR factura' : 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        console.log('💾 Guardando cambios:', datosActualizacion);
        console.log('🔍 EsAnulada:', datosActualizacion.esAnulada, '| Tipo:', typeof datosActualizacion.esAnulada);

        const response = await fetch(`/Facturacion/ActualizarFactura`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosActualizacion)
        });

        console.log('📡 Respuesta del servidor:');
        console.log('  - Status:', response.status);
        console.log('  - StatusText:', response.statusText);
        console.log('  - OK:', response.ok);

        const resultado = await response.json();
        console.log('📄 Resultado parseado:', resultado);

        if (resultado.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Cambios Guardados!',
                text: resultado.message || 'Los cambios han sido guardados exitosamente',
                confirmButtonColor: '#28a745',
                timer: 2000
            });

            window.location.href = '/Facturacion';
        } else {
            console.error('❌ Backend devolvió error:', resultado);
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

// ===== CALCULAR AJUSTES DE STOCK =====
function calcularAjustesStock(esAnulada) {
    const ajustes = [];

    if (esAnulada) {
        // Si la factura se anula, devolver TODOS los productos al inventario
        console.log('📦 Calculando ajustes para ANULACIÓN completa');

        facturaOriginal.detallesFactura.forEach(detalle => {
            ajustes.push({
                productoId: detalle.productoId,
                nombreProducto: detalle.nombreProducto,
                tipoAjuste: 'entrada', // Devolver al stock
                cantidad: detalle.cantidad,
                comentario: `Anulación de factura ${facturaOriginal.numeroFactura}`
            });
            console.log(`  → Devolver ${detalle.cantidad} unidades de "${detalle.nombreProducto}"`);
        });
    } else {
        // Si solo se edita, calcular diferencias
        console.log('📦 Calculando ajustes para EDICIÓN');

        // 1. Productos que se ELIMINARON (estaban en original pero no en editados)
        facturaOriginal.detallesFactura.forEach(original => {
            const productoEditado = productosEditar.find(p => p.productoId === original.productoId);

            if (!productoEditado) {
                // Producto eliminado → devolver al stock
                ajustes.push({
                    productoId: original.productoId,
                    nombreProducto: original.nombreProducto,
                    tipoAjuste: 'entrada',
                    cantidad: original.cantidad,
                    comentario: `Producto eliminado de factura ${facturaOriginal.numeroFactura} durante edición`
                });
                console.log(`  ✖️ Eliminado: "${original.nombreProducto}" - Devolver ${original.cantidad} unidades`);
            }
        });

        // 2. Productos que se AGREGARON (están en editados pero no en original)
        productosEditar.forEach(editado => {
            const productoOriginal = facturaOriginal.detallesFactura.find(p => p.productoId === editado.productoId);

            if (!productoOriginal) {
                // Producto nuevo → restar del stock
                ajustes.push({
                    productoId: editado.productoId,
                    nombreProducto: editado.nombreProducto,
                    tipoAjuste: 'salida',
                    cantidad: editado.cantidad,
                    comentario: `Producto agregado a factura ${facturaOriginal.numeroFactura} durante edición`
                });
                console.log(`  ➕ Agregado: "${editado.nombreProducto}" - Restar ${editado.cantidad} unidades`);
            }
        });

        // 3. Productos que CAMBIARON DE CANTIDAD
        facturaOriginal.detallesFactura.forEach(original => {
            const productoEditado = productosEditar.find(p => p.productoId === original.productoId);

            if (productoEditado && productoEditado.cantidad !== original.cantidad) {
                const diferencia = productoEditado.cantidad - original.cantidad;

                if (diferencia > 0) {
                    // Aumentó la cantidad → restar más del stock
                    ajustes.push({
                        productoId: productoEditado.productoId,
                        nombreProducto: productoEditado.nombreProducto,
                        tipoAjuste: 'salida',
                        cantidad: Math.abs(diferencia),
                        comentario: `Cantidad aumentada en factura ${facturaOriginal.numeroFactura} (de ${original.cantidad} a ${productoEditado.cantidad})`
                    });
                    console.log(`  🔼 Aumentó: "${productoEditado.nombreProducto}" - Restar ${Math.abs(diferencia)} unidades más`);
                } else {
                    // Disminuyó la cantidad → devolver al stock
                    ajustes.push({
                        productoId: productoEditado.productoId,
                        nombreProducto: productoEditado.nombreProducto,
                        tipoAjuste: 'entrada',
                        cantidad: Math.abs(diferencia),
                        comentario: `Cantidad reducida en factura ${facturaOriginal.numeroFactura} (de ${original.cantidad} a ${productoEditado.cantidad})`
                    });
                    console.log(`  🔽 Disminuyó: "${productoEditado.nombreProducto}" - Devolver ${Math.abs(diferencia)} unidades`);
                }
            }
        });
    }

    console.log(`📊 Total ajustes de stock: ${ajustes.length}`);
    return ajustes;
}

function prepararDatosActualizacion() {
    // Calcular totales finales SIN IVA
    const subtotal = productosEditar.reduce((sum, p) => sum + p.subtotal, 0);
    const descuentoGeneral = parseFloat($('#descuentoGeneralEditar').val()) || 0;
    const montoDescuento = subtotal * (descuentoGeneral / 100);
    const subtotalConDescuento = subtotal - montoDescuento;
    const total = subtotalConDescuento; // Sin IVA adicional

    // Verificar si la factura está marcada para anulación
    const facturaAnuladaFlagValue = $('#facturaAnuladaFlag').val();
    const esAnulada = facturaAnuladaFlagValue === 'true';

    console.log('🔍 DEBUG ANULACIÓN:');
    console.log('  - Valor del campo oculto:', facturaAnuladaFlagValue);
    console.log('  - Tipo del campo:', typeof facturaAnuladaFlagValue);
    console.log('  - esAnulada calculado:', esAnulada);
    console.log('  - Tipo de esAnulada:', typeof esAnulada);

    // Calcular ajustes de stock necesarios
    const ajustesStock = calcularAjustesStock(esAnulada);

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
        montoImpuesto: 0, // Sin IVA
        total: total,
        metodoPago: $('#metodoPagoEditar').val(),
        observaciones: $('#observacionesEditar').val(),
        cambiosRealizados: cambiosRealizados,
        esAnulada: esAnulada, // Enviar como booleano
        ajustesStock: ajustesStock
    };
}

// ===== CANCELAR EDICIÓN =====
async function cancelarEdicion() {
    if (cambiosRealizados.length > 0) {
        // Si hay cambios sin guardar, advertir al usuario
        Swal.fire({
            title: '¿Cancelar Edición?',
            html: `Tienes <strong>${cambiosRealizados.length}</strong> cambio(s) sin guardar.<br>¿Estás seguro de salir?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, salir sin guardar',
            cancelButtonText: 'Continuar editando'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Restaurar estado antes de salir
                await restaurarEstadoOriginal();
                window.location.href = '/Facturacion';
            }
        });
    } else {
        // Si NO hay cambios, restaurar el estado automáticamente
        await restaurarEstadoOriginal();
        window.location.href = '/Facturacion';
    }
}

// ===== RESTAURAR ESTADO ORIGINAL =====
async function restaurarEstadoOriginal() {
    if (!estadoOriginal) {
        console.log('ℹ️ No hay estado original para restaurar');
        return;
    }

    try {
        console.log('🔄 Restaurando estado original:', estadoOriginal);

        const response = await fetch(`/Facturacion/RestaurarEstadoFactura?facturaId=${window.facturaIdEditar}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estadoAnterior: estadoOriginal })
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✅ Estado restaurado exitosamente a:', estadoOriginal);
        } else {
            console.error('❌ Error restaurando estado:', resultado.message);
        }
    } catch (error) {
        console.error('❌ Error en restauración de estado:', error);
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

// ===== MANEJO DE ANULACIÓN DE FACTURA =====
async function manejarToggleAnulacion(activado) {
    if (activado) {
        // Solicitar PIN para anular
        const { value: pin } = await Swal.fire({
            title: '<i class="bi bi-shield-lock text-danger"></i> PIN de Seguridad',
            html: `
                <p class="mb-3">Para anular esta factura, ingrese el PIN de seguridad:</p>
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Advertencia:</strong> Al anular la factura, todos los productos se devolverán al inventario.
                </div>
            `,
            input: 'password',
            inputPlaceholder: 'Ingrese el PIN',
            inputAttributes: {
                maxlength: 10,
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Validar PIN',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debe ingresar el PIN';
                }
            }
        });

        if (!pin) {
            // Usuario canceló o no ingresó PIN
            $('#toggleAnularFactura').prop('checked', false);
            $('#facturaAnuladaFlag').val('false');
            $('#pinAnulacionValidado').val('false');
            return;
        }

        // Validar PIN
        try {
            const response = await fetch('/Facturacion/ValidarPinEdicion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin })
            });

            const resultado = await response.json();

            if (resultado.success) {
                // PIN correcto - AHORA ANULAR LA FACTURA INMEDIATAMENTE
                console.log('✅ PIN validado, anulando factura...');

                try {
                    const responseAnulacion = await fetch(`/Facturacion/MarcarFacturaParaAnulacion?facturaId=${window.facturaIdEditar}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin: pin })
                    });

                    const resultadoAnulacion = await responseAnulacion.json();

                    if (resultadoAnulacion.success) {
                        // Factura anulada exitosamente en la base de datos
                        $('#facturaAnuladaFlag').val('true');
                        $('#pinAnulacionValidado').val('true');
                        $('#labelAnularFactura').html('<span class="badge bg-danger">ANULADA</span>');

                        console.log('✅ Factura ANULADA exitosamente en la base de datos');
                        console.log('   - Estado cambiado a: Anulada');
                        console.log('   - Productos devueltos:', resultadoAnulacion.productosDevueltos);

                        registrarCambio('factura_anulada', 'Factura ANULADA - Stock devuelto al inventario', {
                            productosDevueltos: resultadoAnulacion.productosDevueltos
                        });

                        await Swal.fire({
                            icon: 'success',
                            title: 'Factura Anulada',
                            html: `
                                <p>La factura ha sido <strong>ANULADA</strong> exitosamente.</p>
                                <p class="text-muted mb-0">Productos devueltos al inventario: ${resultadoAnulacion.productosDevueltos}</p>
                            `,
                            confirmButtonColor: '#28a745',
                            confirmButtonText: 'Entendido'
                        });

                        // Redirigir automáticamente a la lista de facturas
                        window.location.href = '/Facturacion';

                    } else {
                        throw new Error(resultadoAnulacion.message || 'Error al anular la factura');
                    }
                } catch (errorAnulacion) {
                    console.error('❌ Error anulando factura:', errorAnulacion);

                    Swal.fire({
                        icon: 'error',
                        title: 'Error al Anular',
                        text: errorAnulacion.message || 'No se pudo anular la factura',
                        confirmButtonColor: '#dc3545'
                    });

                    // Revertir el toggle
                    $('#toggleAnularFactura').prop('checked', false);
                    $('#facturaAnuladaFlag').val('false');
                    $('#pinAnulacionValidado').val('false');
                }

            } else {
                // PIN incorrecto
                Swal.fire({
                    icon: 'error',
                    title: 'PIN Incorrecto',
                    text: resultado.message || 'El PIN ingresado no es válido',
                    confirmButtonColor: '#dc3545'
                });

                $('#toggleAnularFactura').prop('checked', false);
                $('#facturaAnuladaFlag').val('false');
                $('#pinAnulacionValidado').val('false');
            }
        } catch (error) {
            console.error('❌ Error validando PIN:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al validar el PIN. Intente nuevamente.',
                confirmButtonColor: '#dc3545'
            });

            $('#toggleAnularFactura').prop('checked', false);
            $('#facturaAnuladaFlag').val('false');
            $('#pinAnulacionValidado').val('false');
        }
    } else {
        // Desactivar anulación
        $('#facturaAnuladaFlag').val('false');
        $('#pinAnulacionValidado').val('false');
        $('#labelAnularFactura').html('<span class="badge bg-secondary">No Anulada</span>');

        // Remover el cambio de anulación si existe
        cambiosRealizados = cambiosRealizados.filter(c => c.tipo !== 'factura_anulada');

        console.log('ℹ️ Anulación cancelada');
    }
}

console.log('✅ Módulo de edición de facturas cargado');
