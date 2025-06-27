
// ===== FACTURACIÓN - MÓDULO PRINCIPAL =====
console.log('🧾 Inicializando módulo de facturación...');

// ===== VARIABLES GLOBALES =====
let productosEnCarrito = [];
let clienteSeleccionado = null;
let configuracionFacturacion = null;
let totalVenta = 0;
let descuentoActual = 0;

// ===== INICIALIZACIÓN =====
$(document).ready(function() {
    console.log('🚀 INICIO: inicializarModuloFacturacion');
    inicializarModuloFacturacion();
});

function inicializarModuloFacturacion() {
    try {
        console.log('📋 Configuración de facturación cargada:', configuracionFacturacion);
        console.log('🧾 Inicializando módulo de facturación...');
        
        cargarConfiguracionFacturacion();
        inicializarEventos();
        inicializarSelectores();
        actualizarTotales();
        
        console.log('✅ Módulo de facturación inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de facturación:', error);
        mostrarNotificacion('Error inicializando el módulo de facturación', 'error');
    }
}

// ===== CONFIGURACIÓN =====
function cargarConfiguracionFacturacion() {
    console.log('📥 Cargando productos iniciales...');
    
    configuracionFacturacion = {
        // Configuración por defecto
        iva: 15,
        descuentoMaximo: 50,
        metodosPago: ['efectivo', 'tarjeta', 'transferencia', 'credito'],
        tiposFactura: ['factura', 'boleta', 'nota_credito']
    };
    
    console.log('📋 Configuración cargada:', configuracionFacturacion);
    cargarProductosIniciales();
}

function cargarProductosIniciales() {
    console.log('🔍 Buscando productos...');
    
    // Simular carga inicial de productos más vendidos
    setTimeout(() => {
        console.log('✅ Productos iniciales cargados');
        mostrarProductosEnGrid([]);
    }, 500);
}

// ===== EVENTOS =====
function inicializarEventos() {
    console.log('🎯 Configurando eventos...');
    
    // Búsqueda de productos
    $('#buscarProducto').on('input', function() {
        const termino = $(this).val();
        if (termino.length >= 2) {
            buscarProductos(termino);
        } else if (termino.length === 0) {
            mostrarProductosEnGrid([]);
        }
    });
    
    // Búsqueda de clientes
    $('#buscarCliente').on('input', function() {
        const termino = $(this).val();
        if (termino.length >= 2) {
            buscarClientes(termino);
        }
    });
    
    // Selección de cliente
    $(document).on('click', '.cliente-item', function() {
        seleccionarCliente($(this));
    });
    
    // Agregar al carrito
    $(document).on('click', '.btn-agregar-carrito', function() {
        const productoId = $(this).data('producto-id');
        agregarAlCarrito(productoId);
    });
    
    // Modificar cantidad en carrito
    $(document).on('change', '.cantidad-carrito', function() {
        const productoId = $(this).data('producto-id');
        const nuevaCantidad = parseInt($(this).val()) || 1;
        modificarCantidadCarrito(productoId, nuevaCantidad);
    });
    
    // Eliminar del carrito
    $(document).on('click', '.btn-eliminar-carrito', function() {
        const productoId = $(this).data('producto-id');
        eliminarDelCarrito(productoId);
    });
    
    // Aplicar descuento
    $('#aplicarDescuento').on('click', function() {
        aplicarDescuento();
    });
    
    // Finalizar venta
    $('#finalizarVenta').on('click', function() {
        abrirModalFinalizarVenta();
    });
    
    // Procesar venta
    $('#procesarVenta').on('click', function() {
        procesarVenta();
    });
    
    // Nuevo cliente
    $('#btnNuevoCliente').on('click', function() {
        abrirModalNuevoCliente();
    });
    
    // Guardar nuevo cliente
    $('#guardarNuevoCliente').on('click', function() {
        guardarNuevoCliente();
    });
    
    // Ver detalle de producto
    $(document).on('click', '.btn-ver-detalle', function() {
        const productoId = $(this).data('producto-id');
        verDetalleProducto(productoId);
    });
    
    console.log('✅ Eventos configurados');
}

function inicializarSelectores() {
    // Inicializar Select2 para búsquedas
    if ($.fn.select2) {
        $('#buscarCliente').select2({
            placeholder: 'Buscar cliente...',
            allowClear: true,
            width: '100%'
        });
    }
}

// ===== BÚSQUEDA DE PRODUCTOS =====
function buscarProductos(termino) {
    console.log('🔍 Buscando productos:', termino);
    
    $.ajax({
        url: '/Facturacion/BuscarProductos',
        method: 'GET',
        data: { termino: termino },
        success: function(response) {
            if (response.success) {
                console.log('📦 Productos encontrados:', response.data.length);
                mostrarProductosEnGrid(response.data);
            } else {
                console.warn('⚠️ Error en búsqueda:', response.message);
                mostrarNotificacion(response.message, 'warning');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error en búsqueda de productos:', error);
            mostrarNotificacion('Error al buscar productos', 'error');
        }
    });
}

function mostrarProductosEnGrid(productos) {
    const grid = $('#productosGrid');
    grid.empty();
    
    if (productos.length === 0) {
        grid.html(`
            <div class="col-12">
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-search fa-3x mb-3"></i>
                    <p>No se encontraron productos</p>
                    <small>Intenta con otro término de búsqueda</small>
                </div>
            </div>
        `);
        return;
    }
    
    productos.forEach(producto => {
        const card = crearTarjetaProducto(producto);
        grid.append(card);
    });
}

function crearTarjetaProducto(producto) {
    const imagenUrl = producto.imagen || '/images/no-image.png';
    const stockBajo = producto.stock <= producto.stockMinimo;
    const stockClass = stockBajo ? 'text-danger' : 'text-success';
    const stockIcon = stockBajo ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100 producto-card" data-producto-id="${producto.id}">
                <div class="card-img-container">
                    <img src="${imagenUrl}" class="card-img-top producto-imagen" 
                         alt="${producto.nombre}" 
                         onerror="this.src='/images/no-image.png'">
                    <div class="stock-badge ${stockClass}">
                        <i class="${stockIcon}"></i> ${producto.stock}
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title text-truncate" title="${producto.nombre}">
                        ${producto.nombre}
                    </h6>
                    <p class="card-text small text-muted mb-2">
                        Código: ${producto.codigo}
                    </p>
                    <div class="precio-info mb-3">
                        <div class="precio-principal">
                            $${formatearPrecio(producto.precio)}
                        </div>
                        ${producto.precioOferta && producto.precioOferta < producto.precio ? `
                            <div class="precio-oferta">
                                Oferta: $${formatearPrecio(producto.precioOferta)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="mt-auto">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-info btn-sm btn-ver-detalle" 
                                    data-producto-id="${producto.id}" title="Ver detalle">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button class="btn btn-primary btn-sm btn-agregar-carrito flex-grow-1" 
                                    data-producto-id="${producto.id}"
                                    ${producto.stock <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== BÚSQUEDA DE CLIENTES =====
function buscarClientes(termino) {
    console.log('👤 Buscando clientes:', termino);
    
    $.ajax({
        url: '/Facturacion/BuscarClientes',
        method: 'GET',
        data: { termino: termino },
        success: function(response) {
            if (response.success) {
                console.log('👥 Clientes encontrados:', response.data.length);
                mostrarResultadosClientes(response.data);
            } else {
                console.warn('⚠️ Error en búsqueda de clientes:', response.message);
                mostrarNotificacion(response.message, 'warning');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error en búsqueda de clientes:', error);
            mostrarNotificacion('Error al buscar clientes', 'error');
        }
    });
}

function mostrarResultadosClientes(clientes) {
    let resultados = $('#resultadosClientes');
    if (resultados.length === 0) {
        // Crear contenedor si no existe
        resultados = $('<div id="resultadosClientes" class="mt-2"></div>');
        $('#buscarCliente').parent().append(resultados);
    }
    
    resultados.empty();
    
    if (clientes.length === 0) {
        resultados.html(`
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No se encontraron clientes
            </div>
        `);
        return;
    }
    
    const lista = $('<div class="list-group"></div>');
    
    clientes.forEach(cliente => {
        const item = $(`
            <a href="#" class="list-group-item list-group-item-action cliente-item" 
               data-cliente-id="${cliente.id}">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${cliente.nombre}</h6>
                    <small class="text-muted">${cliente.tipoDocumento}</small>
                </div>
                <p class="mb-1 text-muted">${cliente.documento}</p>
                <small class="text-muted">
                    <i class="fas fa-envelope"></i> ${cliente.email || 'Sin email'}
                    ${cliente.telefono ? `<i class="fas fa-phone ml-2"></i> ${cliente.telefono}` : ''}
                </small>
            </a>
        `);
        lista.append(item);
    });
    
    resultados.append(lista);
}

function seleccionarCliente(clienteElement) {
    const clienteId = clienteElement.data('cliente-id');
    console.log('👤 Seleccionando cliente:', clienteId);
    
    // Obtener datos completos del cliente
    $.ajax({
        url: `/Facturacion/ObtenerCliente/${clienteId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                clienteSeleccionado = response.data;
                mostrarClienteSeleccionado();
                $('#resultadosClientes').empty();
                console.log('✅ Cliente seleccionado:', clienteSeleccionado.nombre);
            } else {
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error obteniendo cliente:', error);
            mostrarNotificacion('Error al obtener datos del cliente', 'error');
        }
    });
}

function mostrarClienteSeleccionado() {
    const info = $('#infoClienteSeleccionado');
    
    if (clienteSeleccionado) {
        info.html(`
            <div class="alert alert-success">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <i class="fas fa-user"></i> ${clienteSeleccionado.nombre}
                        </h6>
                        <p class="mb-1">
                            <strong>${clienteSeleccionado.tipoDocumento}:</strong> ${clienteSeleccionado.documento}
                        </p>
                        <small class="text-muted">
                            ${clienteSeleccionado.email ? `<i class="fas fa-envelope"></i> ${clienteSeleccionado.email}` : ''}
                            ${clienteSeleccionado.telefono ? `<i class="fas fa-phone ml-2"></i> ${clienteSeleccionado.telefono}` : ''}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="limpiarClienteSeleccionado()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `);
        info.show();
    } else {
        info.hide();
    }
}

function limpiarClienteSeleccionado() {
    clienteSeleccionado = null;
    $('#buscarCliente').val('');
    $('#infoClienteSeleccionado').hide();
    $('#resultadosClientes').empty();
    console.log('🧹 Cliente deseleccionado');
}

// ===== CARRITO DE COMPRAS =====
function agregarAlCarrito(productoId) {
    console.log('🛒 Agregando producto al carrito:', productoId);
    
    // Obtener información del producto
    $.ajax({
        url: `/Facturacion/ObtenerProducto/${productoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const producto = response.data;
                
                // Verificar si ya está en el carrito
                const existente = productosEnCarrito.find(p => p.id === productoId);
                
                if (existente) {
                    // Incrementar cantidad
                    if (existente.cantidad < producto.stock) {
                        existente.cantidad++;
                        console.log(`📈 Cantidad incrementada: ${existente.cantidad}`);
                    } else {
                        mostrarNotificacion('No hay suficiente stock disponible', 'warning');
                        return;
                    }
                } else {
                    // Agregar nuevo producto
                    productosEnCarrito.push({
                        id: producto.id,
                        nombre: producto.nombre,
                        codigo: producto.codigo,
                        precio: producto.precioOferta || producto.precio,
                        precioOriginal: producto.precio,
                        cantidad: 1,
                        stock: producto.stock,
                        imagen: producto.imagen
                    });
                    console.log(`➕ Producto agregado: ${producto.nombre}`);
                }
                
                actualizarVistaCarrito();
                actualizarTotales();
                mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
            } else {
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error obteniendo producto:', error);
            mostrarNotificacion('Error al agregar producto al carrito', 'error');
        }
    });
}

function modificarCantidadCarrito(productoId, nuevaCantidad) {
    const producto = productosEnCarrito.find(p => p.id === productoId);
    
    if (!producto) return;
    
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(productoId);
        return;
    }
    
    if (nuevaCantidad > producto.stock) {
        mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'warning');
        $(`input[data-producto-id="${productoId}"]`).val(producto.cantidad);
        return;
    }
    
    producto.cantidad = nuevaCantidad;
    console.log(`🔄 Cantidad modificada: ${producto.nombre} -> ${nuevaCantidad}`);
    
    actualizarTotales();
}

function eliminarDelCarrito(productoId) {
    const index = productosEnCarrito.findIndex(p => p.id === productoId);
    
    if (index !== -1) {
        const producto = productosEnCarrito[index];
        productosEnCarrito.splice(index, 1);
        console.log(`🗑️ Producto eliminado del carrito: ${producto.nombre}`);
        
        actualizarVistaCarrito();
        actualizarTotales();
        mostrarNotificacion(`${producto.nombre} eliminado del carrito`, 'info');
    }
}

function actualizarVistaCarrito() {
    const container = $('#carritoProductos');
    container.empty();
    
    if (productosEnCarrito.length === 0) {
        container.html(`
            <div class="text-center py-4 text-muted">
                <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                <p>El carrito está vacío</p>
                <small>Agrega productos para comenzar</small>
            </div>
        `);
        $('#finalizarVenta').prop('disabled', true);
        return;
    }
    
    productosEnCarrito.forEach(producto => {
        const item = crearItemCarrito(producto);
        container.append(item);
    });
    
    $('#finalizarVenta').prop('disabled', false);
}

function crearItemCarrito(producto) {
    const subtotal = producto.precio * producto.cantidad;
    const imagenUrl = producto.imagen || '/images/no-image.png';
    
    return `
        <div class="carrito-item border-bottom py-3" data-producto-id="${producto.id}">
            <div class="row align-items-center">
                <div class="col-2">
                    <img src="${imagenUrl}" class="img-thumbnail" 
                         alt="${producto.nombre}" style="width: 50px; height: 50px; object-fit: cover;"
                         onerror="this.src='/images/no-image.png'">
                </div>
                <div class="col-4">
                    <h6 class="mb-1 text-truncate">${producto.nombre}</h6>
                    <small class="text-muted">${producto.codigo}</small>
                </div>
                <div class="col-2">
                    <div class="input-group input-group-sm">
                        <input type="number" class="form-control cantidad-carrito" 
                               value="${producto.cantidad}" min="1" max="${producto.stock}"
                               data-producto-id="${producto.id}">
                    </div>
                    <small class="text-muted">Stock: ${producto.stock}</small>
                </div>
                <div class="col-2 text-center">
                    <div class="precio-unitario">$${formatearPrecio(producto.precio)}</div>
                    ${producto.precioOriginal !== producto.precio ? `
                        <small class="text-muted"><s>$${formatearPrecio(producto.precioOriginal)}</s></small>
                    ` : ''}
                </div>
                <div class="col-1 text-center">
                    <strong>$${formatearPrecio(subtotal)}</strong>
                </div>
                <div class="col-1 text-center">
                    <button class="btn btn-sm btn-outline-danger btn-eliminar-carrito" 
                            data-producto-id="${producto.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== CÁLCULOS Y TOTALES =====
function actualizarTotales() {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento(subtotal);
    const iva = calcularIVA(subtotal - descuento);
    const total = subtotal - descuento + iva;
    
    totalVenta = total;
    
    // Actualizar vista
    $('#subtotalFactura').text(`$${formatearPrecio(subtotal)}`);
    $('#descuentoFactura').text(`-$${formatearPrecio(descuento)}`);
    $('#ivaFactura').text(`$${formatearPrecio(iva)}`);
    $('#totalFactura').text(`$${formatearPrecio(total)}`);
    
    // Actualizar contador de productos
    const totalProductos = productosEnCarrito.reduce((total, p) => total + p.cantidad, 0);
    $('#contadorProductos').text(totalProductos);
    
    console.log(`💰 Totales actualizados: Subtotal: $${subtotal}, Total: $${total}`);
}

function calcularSubtotal() {
    return productosEnCarrito.reduce((total, producto) => {
        return total + (producto.precio * producto.cantidad);
    }, 0);
}

function calcularDescuento(subtotal) {
    return subtotal * (descuentoActual / 100);
}

function calcularIVA(baseImponible) {
    const porcentajeIVA = configuracionFacturacion?.iva || 15;
    return baseImponible * (porcentajeIVA / 100);
}

// ===== DESCUENTOS =====
function aplicarDescuento() {
    const porcentaje = parseFloat($('#porcentajeDescuento').val()) || 0;
    const maxDescuento = configuracionFacturacion?.descuentoMaximo || 50;
    
    if (porcentaje < 0 || porcentaje > maxDescuento) {
        mostrarNotificacion(`El descuento debe estar entre 0% y ${maxDescuento}%`, 'warning');
        $('#porcentajeDescuento').val(descuentoActual);
        return;
    }
    
    descuentoActual = porcentaje;
    actualizarTotales();
    
    console.log(`💸 Descuento aplicado: ${porcentaje}%`);
    mostrarNotificacion(`Descuento del ${porcentaje}% aplicado`, 'success');
}

// ===== FINALIZACIÓN DE VENTA =====
function abrirModalFinalizarVenta() {
    if (productosEnCarrito.length === 0) {
        mostrarNotificacion('Agrega productos al carrito antes de finalizar', 'warning');
        return;
    }
    
    if (!clienteSeleccionado) {
        mostrarNotificacion('Selecciona un cliente antes de finalizar', 'warning');
        return;
    }
    
    // Llenar información en el modal
    $('#modalClienteInfo').html(`
        <strong>${clienteSeleccionado.nombre}</strong><br>
        <small>${clienteSeleccionado.tipoDocumento}: ${clienteSeleccionado.documento}</small>
    `);
    
    $('#modalTotalVenta').text(`$${formatearPrecio(totalVenta)}`);
    
    // Mostrar resumen de productos
    const resumenProductos = $('#modalResumenProductos');
    resumenProductos.empty();
    
    productosEnCarrito.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        resumenProductos.append(`
            <tr>
                <td>${producto.nombre}</td>
                <td class="text-center">${producto.cantidad}</td>
                <td class="text-right">$${formatearPrecio(producto.precio)}</td>
                <td class="text-right">$${formatearPrecio(subtotal)}</td>
            </tr>
        `);
    });
    
    $('#modalFinalizarVenta').modal('show');
}

function procesarVenta() {
    const metodoPago = $('#metodoPago').val();
    const observaciones = $('#observacionesVenta').val();
    
    if (!metodoPago) {
        mostrarNotificacion('Selecciona un método de pago', 'warning');
        return;
    }
    
    const datosVenta = {
        clienteId: clienteSeleccionado.id,
        productos: productosEnCarrito.map(p => ({
            productoId: p.id,
            cantidad: p.cantidad,
            precio: p.precio
        })),
        metodoPago: metodoPago,
        descuentoPorcentaje: descuentoActual,
        observaciones: observaciones,
        subtotal: calcularSubtotal(),
        descuento: calcularDescuento(calcularSubtotal()),
        iva: calcularIVA(calcularSubtotal() - calcularDescuento(calcularSubtotal())),
        total: totalVenta
    };
    
    console.log('💳 Procesando venta:', datosVenta);
    
    // Deshabilitar botón mientras procesa
    $('#procesarVenta').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Procesando...');
    
    $.ajax({
        url: '/Facturacion/ProcesarVenta',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(datosVenta),
        success: function(response) {
            if (response.success) {
                console.log('✅ Venta procesada exitosamente');
                mostrarNotificacion('Venta procesada exitosamente', 'success');
                
                // Limpiar formulario
                limpiarFormularioVenta();
                $('#modalFinalizarVenta').modal('hide');
                
                // Mostrar opciones post-venta
                mostrarOpcionesPostVenta(response.data);
            } else {
                console.error('❌ Error procesando venta:', response.message);
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error en solicitud de venta:', error);
            mostrarNotificacion('Error procesando la venta', 'error');
        },
        complete: function() {
            $('#procesarVenta').prop('disabled', false).html('Procesar Venta');
        }
    });
}

function limpiarFormularioVenta() {
    // Limpiar carrito
    productosEnCarrito = [];
    actualizarVistaCarrito();
    
    // Limpiar cliente
    limpiarClienteSeleccionado();
    
    // Limpiar búsquedas
    $('#buscarProducto').val('');
    $('#productosGrid').empty();
    
    // Limpiar descuento
    descuentoActual = 0;
    $('#porcentajeDescuento').val('');
    
    // Actualizar totales
    actualizarTotales();
    
    console.log('🧹 Formulario de venta limpiado');
}

function mostrarOpcionesPostVenta(facturaData) {
    const modal = $(`
        <div class="modal fade" id="modalPostVenta" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle"></i> Venta Completada
                        </h5>
                    </div>
                    <div class="modal-body text-center">
                        <h4>Factura N° ${facturaData.numeroFactura}</h4>
                        <p class="mb-4">Total: <strong>$${formatearPrecio(facturaData.total)}</strong></p>
                        
                        <div class="btn-group-vertical w-100">
                            <button class="btn btn-primary mb-2" onclick="imprimirFactura('${facturaData.id}')">
                                <i class="fas fa-print"></i> Imprimir Factura
                            </button>
                            <button class="btn btn-info mb-2" onclick="enviarFacturaPorEmail('${facturaData.id}')">
                                <i class="fas fa-envelope"></i> Enviar por Email
                            </button>
                            <button class="btn btn-secondary" onclick="$('#modalPostVenta').modal('hide')">
                                <i class="fas fa-times"></i> Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    modal.modal('show');
    
    // Limpiar modal después de cerrar
    modal.on('hidden.bs.modal', function() {
        modal.remove();
    });
}

// ===== NUEVO CLIENTE =====
function abrirModalNuevoCliente() {
    $('#modalNuevoClienteFacturacion').modal('show');
    limpiarFormularioNuevoCliente();
}

function limpiarFormularioNuevoCliente() {
    $('#formNuevoCliente')[0].reset();
    $('#formNuevoCliente .is-invalid').removeClass('is-invalid');
    $('#formNuevoCliente .invalid-feedback').remove();
}

function guardarNuevoCliente() {
    const formData = {
        nombre: $('#nombreCliente').val(),
        tipoDocumento: $('#tipoDocumentoCliente').val(),
        documento: $('#documentoCliente').val(),
        telefono: $('#telefonoCliente').val(),
        email: $('#emailCliente').val(),
        direccion: $('#direccionCliente').val()
    };
    
    // Validaciones básicas
    if (!validarFormularioCliente(formData)) {
        return;
    }
    
    console.log('👤 Guardando nuevo cliente:', formData);
    
    $('#guardarNuevoCliente').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');
    
    $.ajax({
        url: '/Facturacion/CrearCliente',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function(response) {
            if (response.success) {
                console.log('✅ Cliente creado exitosamente');
                mostrarNotificacion('Cliente creado exitosamente', 'success');
                
                // Seleccionar el cliente recién creado
                clienteSeleccionado = response.data;
                mostrarClienteSeleccionado();
                
                $('#modalNuevoClienteFacturacion').modal('hide');
            } else {
                console.error('❌ Error creando cliente:', response.message);
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error en solicitud de cliente:', error);
            mostrarNotificacion('Error creando el cliente', 'error');
        },
        complete: function() {
            $('#guardarNuevoCliente').prop('disabled', false).html('Guardar Cliente');
        }
    });
}

function validarFormularioCliente(datos) {
    let esValido = true;
    
    // Limpiar validaciones previas
    $('#formNuevoCliente .is-invalid').removeClass('is-invalid');
    $('#formNuevoCliente .invalid-feedback').remove();
    
    // Validar nombre
    if (!datos.nombre || datos.nombre.trim().length < 2) {
        marcarCampoInvalido('#nombreCliente', 'El nombre es requerido y debe tener al menos 2 caracteres');
        esValido = false;
    }
    
    // Validar documento
    if (!datos.documento || datos.documento.trim().length < 5) {
        marcarCampoInvalido('#documentoCliente', 'El documento es requerido');
        esValido = false;
    }
    
    // Validar email (opcional pero debe ser válido si se proporciona)
    if (datos.email && !esEmailValido(datos.email)) {
        marcarCampoInvalido('#emailCliente', 'El email no tiene un formato válido');
        esValido = false;
    }
    
    return esValido;
}

function marcarCampoInvalido(selector, mensaje) {
    const campo = $(selector);
    campo.addClass('is-invalid');
    campo.after(`<div class="invalid-feedback">${mensaje}</div>`);
}

function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ===== DETALLE DE PRODUCTO =====
function verDetalleProducto(productoId) {
    console.log('📋 Viendo detalle del producto:', productoId);
    
    $.ajax({
        url: `/Facturacion/ObtenerProducto/${productoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                mostrarModalDetalleProducto(response.data);
            } else {
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error obteniendo detalle del producto:', error);
            mostrarNotificacion('Error obteniendo información del producto', 'error');
        }
    });
}

function mostrarModalDetalleProducto(producto) {
    const imagenUrl = producto.imagen || '/images/no-image.png';
    const stockBajo = producto.stock <= producto.stockMinimo;
    
    const modal = $(`
        <div class="modal fade" id="modalDetalleProducto" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-info-circle"></i> Detalle del Producto
                        </h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${imagenUrl}" class="img-fluid rounded" 
                                     alt="${producto.nombre}"
                                     onerror="this.src='/images/no-image.png'">
                            </div>
                            <div class="col-md-8">
                                <h4>${producto.nombre}</h4>
                                <p class="text-muted mb-3">${producto.descripcion || 'Sin descripción'}</p>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-6">
                                        <strong>Código:</strong> ${producto.codigo}
                                    </div>
                                    <div class="col-sm-6">
                                        <strong>Categoría:</strong> ${producto.categoria || 'Sin categoría'}
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-6">
                                        <strong>Stock:</strong> 
                                        <span class="${stockBajo ? 'text-danger' : 'text-success'}">
                                            ${producto.stock} unidades
                                            ${stockBajo ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
                                        </span>
                                    </div>
                                    <div class="col-sm-6">
                                        <strong>Stock Mínimo:</strong> ${producto.stockMinimo}
                                    </div>
                                </div>
                                
                                <div class="pricing-info">
                                    <div class="row">
                                        <div class="col-sm-6">
                                            <strong>Precio:</strong> 
                                            <span class="h5 text-primary">$${formatearPrecio(producto.precio)}</span>
                                        </div>
                                        ${producto.precioOferta && producto.precioOferta < producto.precio ? `
                                            <div class="col-sm-6">
                                                <strong>Precio Oferta:</strong> 
                                                <span class="h5 text-success">$${formatearPrecio(producto.precioOferta)}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="agregarAlCarrito(${producto.id}); $('#modalDetalleProducto').modal('hide');"
                                ${producto.stock <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    modal.modal('show');
    
    // Limpiar modal después de cerrar
    modal.on('hidden.bs.modal', function() {
        modal.remove();
    });
}

// ===== UTILIDADES =====
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const iconos = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const colores = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    
    const notificacion = $(`
        <div class="alert ${colores[tipo]} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <i class="${iconos[tipo]}"></i> ${mensaje}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `);
    
    $('body').append(notificacion);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notificacion.alert('close');
    }, 5000);
    
    console.log(`📢 Notificación [${tipo}]: ${mensaje}`);
}

// ===== FUNCIONES EXTERNAS =====
function imprimirFactura(facturaId) {
    console.log('🖨️ Imprimiendo factura:', facturaId);
    
    // Abrir ventana de impresión
    const url = `/Facturacion/ImprimirFactura/${facturaId}`;
    window.open(url, '_blank', 'width=800,height=600');
}

function enviarFacturaPorEmail(facturaId) {
    console.log('📧 Enviando factura por email:', facturaId);
    
    $.ajax({
        url: `/Facturacion/EnviarFacturaPorEmail/${facturaId}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                mostrarNotificacion('Factura enviada por email exitosamente', 'success');
            } else {
                mostrarNotificacion(response.message, 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error enviando factura por email:', error);
            mostrarNotificacion('Error enviando la factura por email', 'error');
        }
    });
}

// ===== DEBUGGING =====
function debugInfo() {
    console.log('🐛 Estado actual del módulo:');
    console.log('- Productos en carrito:', productosEnCarrito);
    console.log('- Cliente seleccionado:', clienteSeleccionado);
    console.log('- Total venta:', totalVenta);
    console.log('- Descuento actual:', descuentoActual);
    console.log('- Configuración:', configuracionFacturacion);
}

// Exponer función de debug globalmente para testing
window.facturationDebug = debugInfo;

console.log('✅ Módulo de facturación cargado completamente');
