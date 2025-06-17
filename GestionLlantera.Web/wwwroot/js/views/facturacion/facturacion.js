
// ===== FACTURACIÓN - JAVASCRIPT PRINCIPAL =====

let productosEnVenta = [];
let clienteSeleccionado = null;
let modalInventario = null;
let modalFinalizarVenta = null;
let modalDetalleProducto = null;

// ===== INICIALIZACIÓN =====
$(document).ready(function() {
    console.log('🚀 Inicializando módulo de facturación');
    inicializarFacturacion();
});

function inicializarFacturacion() {
    try {
        // Inicializar modales
        inicializarModales();
        
        // Configurar eventos
        configurarEventos();
        
        // Actualizar totales
        actualizarTotales();
        
        console.log('✅ Facturación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando facturación:', error);
    }
}

function inicializarModales() {
    // Inicializar modales
    const modalInventarioElement = document.getElementById('modalInventario');
    if (modalInventarioElement) {
        modalInventario = new bootstrap.Modal(modalInventarioElement);
    }

    const modalFinalizarVentaElement = document.getElementById('modalFinalizarVenta');
    if (modalFinalizarVentaElement) {
        modalFinalizarVenta = new bootstrap.Modal(modalFinalizarVentaElement);
    }

    const modalDetalleProductoElement = document.getElementById('modalDetalleProducto');
    if (modalDetalleProductoElement) {
        modalDetalleProducto = new bootstrap.Modal(modalDetalleProductoElement);
    }
}

function configurarEventos() {
    // ===== BÚSQUEDA DE PRODUCTOS =====
    let timeoutBusqueda = null;
    $('#busquedaProducto').on('input', function() {
        const termino = $(this).val().trim();
        
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            if (termino.length >= 2) {
                buscarProductos(termino);
            } else if (termino.length === 0) {
                $('#resultadosBusqueda').html(`
                    <div class="col-12 text-center py-4 text-muted">
                        <i class="bi bi-search display-1"></i>
                        <p class="mt-2">Busca productos para agregar a la venta</p>
                    </div>
                `);
            }
        }, 300);
    });

    // ===== BÚSQUEDA DE CLIENTES =====
    let timeoutCliente = null;
    $('#clienteBusqueda').on('input', function() {
        const termino = $(this).val().trim();
        
        clearTimeout(timeoutCliente);
        timeoutCliente = setTimeout(() => {
            if (termino.length >= 2) {
                buscarClientes(termino);
            }
        }, 300);
    });

    // ===== BOTONES PRINCIPALES =====
    $('#btnAbrirInventario').on('click', function() {
        if (modalInventario) {
            modalInventario.show();
        }
    });

    $('#btnLimpiarVenta').on('click', function() {
        limpiarVenta();
    });

    $('#btnFinalizarVenta').on('click', function() {
        mostrarModalFinalizarVenta();
    });

    $('#btnNuevoCliente').on('click', function() {
        // Implementar modal para nuevo cliente
        console.log('🔄 Funcionalidad de nuevo cliente pendiente');
    });

    // ===== MODAL FINALIZAR VENTA =====
    $('#metodoPago').on('change', function() {
        const metodo = $(this).val();
        if (metodo === 'efectivo') {
            $('#pagoEfectivo').show();
        } else {
            $('#pagoEfectivo').hide();
            $('#montoRecibido').val('');
            $('#cambioCalculado').val('');
        }
    });

    $('#montoRecibido').on('input', function() {
        calcularCambio();
    });

    $('#btnConfirmarVenta').on('click', function() {
        procesarVentaFinal();
    });
}

// ===== BÚSQUEDA DE PRODUCTOS =====
async function buscarProductos(termino) {
    try {
        console.log(`🔍 Buscando productos: "${termino}"`);
        
        mostrarCargandoBusqueda();

        const response = await fetch(`/Facturacion/BuscarProductos?termino=${encodeURIComponent(termino)}&tamano=12`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            mostrarResultadosProductos(resultado.data);
        } else {
            mostrarSinResultados('productos');
        }

    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        mostrarErrorBusqueda('productos');
    }
}

function mostrarResultadosProductos(productos) {
    const container = $('#resultadosBusqueda');
    
    if (!productos || productos.length === 0) {
        mostrarSinResultados('productos');
        return;
    }

    let html = '';
    productos.forEach(producto => {
        const imagenUrl = producto.imagenes && producto.imagenes.length > 0 
            ? producto.imagenes[0].urlImagen 
            : '/images/no-image.png';

        const precioFormateado = formatearMoneda(producto.precio || 0);
        const stockClase = producto.cantidadEnInventario <= 0 ? 'border-danger' : 
                          producto.cantidadEnInventario <= producto.stockMinimo ? 'border-warning' : '';

        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 producto-card ${stockClase}" data-producto-id="${producto.productoId}">
                    <div class="position-relative">
                        <img src="${imagenUrl}" 
                             class="card-img-top producto-imagen" 
                             alt="${producto.nombreProducto}"
                             style="height: 120px; object-fit: cover;">
                        ${producto.cantidadEnInventario <= 0 ? 
                            '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Sin Stock</span>' :
                            producto.cantidadEnInventario <= producto.stockMinimo ?
                            '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Stock Bajo</span>' : ''
                        }
                    </div>
                    <div class="card-body p-2">
                        <h6 class="card-title mb-1" title="${producto.nombreProducto}">
                            ${producto.nombreProducto.length > 25 ? 
                                producto.nombreProducto.substring(0, 25) + '...' : 
                                producto.nombreProducto}
                        </h6>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-success fw-bold">${precioFormateado}</span>
                            <small class="text-muted">Stock: ${producto.cantidadEnInventario}</small>
                        </div>
                        <div class="d-grid gap-1">
                            ${producto.cantidadEnInventario > 0 ? `
                                <button type="button" 
                                        class="btn btn-primary btn-sm btn-agregar-producto"
                                        data-producto='${JSON.stringify(producto)}'>
                                    <i class="bi bi-plus-circle me-1"></i>Agregar
                                </button>
                            ` : `
                                <button type="button" class="btn btn-secondary btn-sm" disabled>
                                    <i class="bi bi-x-circle me-1"></i>Sin Stock
                                </button>
                            `}
                            <button type="button" 
                                    class="btn btn-outline-info btn-sm btn-ver-detalle"
                                    data-producto-id="${producto.productoId}">
                                <i class="bi bi-eye me-1"></i>Ver Detalle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);

    // Configurar eventos de los botones
    $('.btn-agregar-producto').on('click', function() {
        const producto = JSON.parse($(this).attr('data-producto'));
        agregarProductoAVenta(producto);
    });

    $('.btn-ver-detalle').on('click', function() {
        const productoId = $(this).attr('data-producto-id');
        verDetalleProducto(productoId);
    });
}

// ===== BÚSQUEDA DE CLIENTES =====
async function buscarClientes(termino) {
    try {
        console.log(`👥 Buscando clientes: "${termino}"`);

        const response = await fetch(`/Facturacion/ObtenerClientes?termino=${encodeURIComponent(termino)}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            mostrarResultadosClientes(resultado.data);
        }

    } catch (error) {
        console.error('❌ Error buscando clientes:', error);
    }
}

function mostrarResultadosClientes(clientes) {
    // Remover dropdown anterior si existe
    $('.dropdown-clientes').remove();

    if (!clientes || clientes.length === 0) {
        return;
    }

    let html = '<div class="dropdown-clientes position-absolute w-100 bg-white border rounded shadow-sm" style="z-index: 1000; top: 100%;">';
    
    clientes.forEach(cliente => {
        html += `
            <div class="dropdown-item-cliente p-2 border-bottom cursor-pointer" 
                 data-cliente='${JSON.stringify(cliente)}'>
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${cliente.nombre}</strong><br>
                        <small class="text-muted">${cliente.email}</small>
                    </div>
                    <small class="text-muted">${cliente.telefono || ''}</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';

    $('#clienteBusqueda').parent().append(html);

    // Configurar eventos
    $('.dropdown-item-cliente').on('click', function() {
        const cliente = JSON.parse($(this).attr('data-cliente'));
        seleccionarCliente(cliente);
        $('.dropdown-clientes').remove();
    });

    // Cerrar dropdown al hacer click fuera
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#clienteBusqueda').length) {
            $('.dropdown-clientes').remove();
        }
    });
}

function seleccionarCliente(cliente) {
    clienteSeleccionado = cliente;
    $('#clienteBusqueda').val(cliente.nombre);
    $('#nombreClienteSeleccionado').text(cliente.nombre);
    $('#emailClienteSeleccionado').text(cliente.email);
    $('#clienteSeleccionado').removeClass('d-none');
}

// ===== GESTIÓN DEL CARRITO =====
function agregarProductoAVenta(producto) {
    // Verificar si el producto ya está en la venta
    const productoExistente = productosEnVenta.find(p => p.productoId === producto.productoId);
    
    if (productoExistente) {
        // Incrementar cantidad si no supera el stock
        if (productoExistente.cantidad < producto.cantidadEnInventario) {
            productoExistente.cantidad++;
            mostrarToast('Producto actualizado', `Cantidad de ${producto.nombreProducto} incrementada`, 'success');
        } else {
            mostrarToast('Stock insuficiente', `No hay más stock disponible para ${producto.nombreProducto}`, 'warning');
            return;
        }
    } else {
        // Agregar nuevo producto
        productosEnVenta.push({
            productoId: producto.productoId,
            nombreProducto: producto.nombreProducto,
            precioUnitario: producto.precio || 0,
            cantidad: 1,
            stockDisponible: producto.cantidadEnInventario,
            imagenUrl: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0].urlImagen : null
        });
        
        mostrarToast('Producto agregado', `${producto.nombreProducto} agregado a la venta`, 'success');
    }

    actualizarVistaCarrito();
    actualizarTotales();
}

function actualizarVistaCarrito() {
    const container = $('#listaProductosVenta');
    const contador = $('#contadorProductos');

    if (productosEnVenta.length === 0) {
        container.html(`
            <div class="text-center py-4 text-muted">
                <i class="bi bi-cart-x display-4"></i>
                <p class="mt-2">No hay productos en la venta</p>
            </div>
        `);
        contador.text('0 productos');
        $('#btnLimpiarVenta, #btnFinalizarVenta').prop('disabled', true);
        return;
    }

    let html = '';
    productosEnVenta.forEach((producto, index) => {
        const subtotal = producto.precioUnitario * producto.cantidad;
        html += `
            <div class="producto-venta-item border rounded p-2 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${producto.nombreProducto}</h6>
                        <small class="text-muted">₡${formatearMoneda(producto.precioUnitario)} c/u</small>
                    </div>
                    <button type="button" 
                            class="btn btn-sm btn-outline-danger btn-eliminar-producto"
                            data-index="${index}"
                            title="Eliminar producto">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <div class="input-group input-group-sm" style="width: 120px;">
                        <button type="button" 
                                class="btn btn-outline-secondary btn-cantidad-menos"
                                data-index="${index}">-</button>
                        <input type="number" 
                               class="form-control text-center input-cantidad"
                               data-index="${index}"
                               value="${producto.cantidad}" 
                               min="1" 
                               max="${producto.stockDisponible}">
                        <button type="button" 
                                class="btn btn-outline-secondary btn-cantidad-mas"
                                data-index="${index}">+</button>
                    </div>
                    <strong class="text-success">₡${formatearMoneda(subtotal)}</strong>
                </div>
            </div>
        `;
    });

    container.html(html);
    contador.text(`${productosEnVenta.length} productos`);
    $('#btnLimpiarVenta, #btnFinalizarVenta').prop('disabled', false);

    // Configurar eventos de cantidad
    configurarEventosCantidad();
}

function configurarEventosCantidad() {
    $('.btn-cantidad-menos').on('click', function() {
        const index = parseInt($(this).attr('data-index'));
        if (productosEnVenta[index].cantidad > 1) {
            productosEnVenta[index].cantidad--;
            actualizarVistaCarrito();
            actualizarTotales();
        }
    });

    $('.btn-cantidad-mas').on('click', function() {
        const index = parseInt($(this).attr('data-index'));
        if (productosEnVenta[index].cantidad < productosEnVenta[index].stockDisponible) {
            productosEnVenta[index].cantidad++;
            actualizarVistaCarrito();
            actualizarTotales();
        } else {
            mostrarToast('Stock limitado', 'No hay más stock disponible', 'warning');
        }
    });

    $('.input-cantidad').on('change', function() {
        const index = parseInt($(this).attr('data-index'));
        const nuevaCantidad = parseInt($(this).val());
        const stockDisponible = productosEnVenta[index].stockDisponible;

        if (nuevaCantidad >= 1 && nuevaCantidad <= stockDisponible) {
            productosEnVenta[index].cantidad = nuevaCantidad;
            actualizarTotales();
        } else {
            $(this).val(productosEnVenta[index].cantidad);
            if (nuevaCantidad > stockDisponible) {
                mostrarToast('Stock limitado', 'Cantidad excede el stock disponible', 'warning');
            }
        }
    });

    $('.btn-eliminar-producto').on('click', function() {
        const index = parseInt($(this).attr('data-index'));
        productosEnVenta.splice(index, 1);
        actualizarVistaCarrito();
        actualizarTotales();
        mostrarToast('Producto eliminado', 'Producto removido de la venta', 'info');
    });
}

function actualizarTotales() {
    const subtotal = productosEnVenta.reduce((sum, producto) => 
        sum + (producto.precioUnitario * producto.cantidad), 0);
    
    const iva = subtotal * 0.13; // 13% IVA
    const total = subtotal + iva;

    $('#subtotalVenta').text(formatearMoneda(subtotal));
    $('#ivaVenta').text(formatearMoneda(iva));
    $('#totalVenta').text(formatearMoneda(total));
}

function limpiarVenta() {
    if (productosEnVenta.length === 0) return;

    if (confirm('¿Estás seguro de que deseas limpiar toda la venta?')) {
        productosEnVenta = [];
        clienteSeleccionado = null;
        $('#clienteBusqueda').val('');
        $('#clienteSeleccionado').addClass('d-none');
        actualizarVistaCarrito();
        actualizarTotales();
        mostrarToast('Venta limpiada', 'Se han removido todos los productos', 'info');
    }
}

// ===== FINALIZACIÓN DE VENTA =====
function mostrarModalFinalizarVenta() {
    if (productosEnVenta.length === 0) {
        mostrarToast('Venta vacía', 'Agrega productos antes de finalizar la venta', 'warning');
        return;
    }

    if (!clienteSeleccionado) {
        mostrarToast('Cliente requerido', 'Selecciona un cliente antes de finalizar la venta', 'warning');
        return;
    }

    // Llenar resumen en el modal
    $('#resumenNombreCliente').text(clienteSeleccionado.nombre);
    $('#resumenEmailCliente').text(clienteSeleccionado.email);

    const subtotal = productosEnVenta.reduce((sum, p) => sum + (p.precioUnitario * p.cantidad), 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    $('#resumenSubtotal').text(formatearMoneda(subtotal));
    $('#resumenIVA').text(formatearMoneda(iva));
    $('#resumenTotal').text(formatearMoneda(total));

    // Mostrar lista de productos
    let htmlProductos = '<table class="table table-sm"><tbody>';
    productosEnVenta.forEach(producto => {
        htmlProductos += `
            <tr>
                <td>${producto.nombreProducto}</td>
                <td class="text-center">${producto.cantidad}</td>
                <td class="text-end">₡${formatearMoneda(producto.precioUnitario * producto.cantidad)}</td>
            </tr>
        `;
    });
    htmlProductos += '</tbody></table>';
    $('#listaProductosResumen').html(htmlProductos);

    // Resetear formulario
    $('#metodoPago').val('efectivo').trigger('change');
    $('#observacionesVenta').val('');

    modalFinalizarVenta.show();
}

function calcularCambio() {
    const total = productosEnVenta.reduce((sum, p) => sum + (p.precioUnitario * p.cantidad), 0) * 1.13;
    const montoRecibido = parseFloat($('#montoRecibido').val()) || 0;
    const cambio = montoRecibido - total;

    $('#cambioCalculado').val(cambio >= 0 ? formatearMoneda(cambio) : '0.00');
}

async function procesarVentaFinal() {
    try {
        const btnConfirmar = $('#btnConfirmarVenta');
        btnConfirmar.prop('disabled', true);
        btnConfirmar.find('.btn-normal-state').addClass('d-none');
        btnConfirmar.find('.btn-loading-state').removeClass('d-none');

        // Preparar datos de la venta
        const subtotal = productosEnVenta.reduce((sum, p) => sum + (p.precioUnitario * p.cantidad), 0);
        const iva = subtotal * 0.13;
        const total = subtotal + iva;

        const ventaData = {
            clienteId: clienteSeleccionado.id,
            nombreCliente: clienteSeleccionado.nombre,
            emailCliente: clienteSeleccionado.email,
            productos: productosEnVenta,
            subtotal: subtotal,
            iva: iva,
            total: total,
            metodoPago: $('#metodoPago').val(),
            observaciones: $('#observacionesVenta').val()
        };

        // Simular procesamiento (aquí iría la llamada real a la API)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Éxito
        modalFinalizarVenta.hide();
        mostrarToast('¡Venta procesada!', 'La venta ha sido procesada exitosamente', 'success');
        
        // Limpiar venta
        productosEnVenta = [];
        clienteSeleccionado = null;
        $('#clienteBusqueda').val('');
        $('#clienteSeleccionado').addClass('d-none');
        actualizarVistaCarrito();
        actualizarTotales();

    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        mostrarToast('Error', 'No se pudo procesar la venta', 'danger');
    } finally {
        const btnConfirmar = $('#btnConfirmarVenta');
        btnConfirmar.prop('disabled', false);
        btnConfirmar.find('.btn-normal-state').removeClass('d-none');
        btnConfirmar.find('.btn-loading-state').addClass('d-none');
    }
}

// ===== FUNCIONES AUXILIARES =====
function mostrarCargandoBusqueda() {
    $('#resultadosBusqueda').html(`
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">Buscando productos...</p>
        </div>
    `);
}

function mostrarSinResultados(tipo) {
    const mensaje = tipo === 'productos' ? 'No se encontraron productos' : 'No se encontraron clientes';
    $('#resultadosBusqueda').html(`
        <div class="col-12 text-center py-4 text-muted">
            <i class="bi bi-search display-1"></i>
            <p class="mt-2">${mensaje}</p>
        </div>
    `);
}

function mostrarErrorBusqueda(tipo) {
    const mensaje = tipo === 'productos' ? 'Error al buscar productos' : 'Error al buscar clientes';
    $('#resultadosBusqueda').html(`
        <div class="col-12 text-center py-4 text-danger">
            <i class="bi bi-exclamation-triangle display-1"></i>
            <p class="mt-2">${mensaje}</p>
        </div>
    `);
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0);
}

function mostrarToast(titulo, mensaje, tipo = 'info') {
    // Implementar toast notifications
    console.log(`${tipo.toUpperCase()}: ${titulo} - ${mensaje}`);
}rBotones();
}

function configurarFormularios() {
    // Eventos de cantidad y precio
    $(document).on('input', '[data-campo="cantidad"], [data-campo="precio"]', function() {
        const fila = $(this).closest('tr');
        actualizarSubtotalFila(fila);
    });
    
    // Validar números
    $(document).on('input', 'input[type="number"]', function() {
        const valor = parseFloat($(this).val()) || 0;
        if (valor < 0) {
            $(this).val(0);
        }
    });
}

function configurarBotones() {
    // Botón de consultar inventario
    $('#btnConsultarInventario, [onclick="consultarInventario()"]').off('click').on('click', function(e) {
        e.preventDefault();
        consultarInventario();
    });
    
    // Botón de nueva venta
    $('#btnNuevaVenta, [onclick="nuevaVenta()"]').off('click').on('click', function(e) {
        e.preventDefault();
        nuevaVenta();
    });
    
    // Botón de agregar producto
    $('#btnAgregarProducto, [onclick="agregarProducto()"]').off('click').on('click', function(e) {
        e.preventDefault();
        agregarProducto();
    });
    
    // Botón de finalizar venta
    $('#btnFinalizarVenta, [onclick="finalizarVenta()"]').off('click').on('click', function(e) {
        e.preventDefault();
        finalizarVenta();
    });
    
    // Botón de limpiar
    $('#btnLimpiarVenta, [onclick="limpiarVenta()"]').off('click').on('click', function(e) {
        e.preventDefault();
        limpiarVenta();
    });
}

// ===== FUNCIONES PRINCIPALES =====

function consultarInventario() {
    console.log('🔍 Abriendo consulta de inventario');
    
    if (modalInventario) {
        modalInventario.show();
        cargarProductosInventario();
    } else {
        console.error('❌ Modal de inventario no encontrado');
        mostrarNotificacion('Error al abrir inventario', 'danger');
    }
}

function nuevaVenta() {
    console.log('📄 Iniciando nueva venta');
    limpiarVenta();
    mostrarNotificacion('Nueva venta iniciada', 'info');
}

function agregarProducto() {
    console.log('➕ Agregando producto a la venta');
    consultarInventario();
}

function finalizarVenta() {
    console.log('💰 Finalizando venta');
    
    if (productosEnVenta.length === 0) {
        mostrarNotificacion('No hay productos en la venta', 'warning');
        return;
    }
    
    // Validar datos del cliente
    const nombreCliente = $('#clienteNombre').val().trim();
    if (!nombreCliente) {
        mostrarNotificacion('Ingrese el nombre del cliente', 'warning');
        $('#clienteNombre').focus();
        return;
    }
    
    // Mostrar modal de confirmación o procesar venta
    mostrarModalFinalizarVenta();
}

function limpiarVenta() {
    console.log('🧹 Limpiando venta');
    
    // Limpiar productos
    productosEnVenta = [];
    actualizarTablaProductos();
    
    // Limpiar formulario
    $('#clienteNombre').val('');
    $('#clienteTelefono').val('');
    $('#observaciones').val('');
    $('#tipoDocumento').val('factura');
    
    // Actualizar totales
    actualizarTotales();
    
    mostrarNotificacion('Venta limpiada', 'info');
}

// ===== FUNCIONES DE PRODUCTOS =====

async function cargarProductosInventario() {
    try {
        console.log('📦 Cargando productos del inventario');
        
        const response = await fetch('/Facturacion/BuscarProductos', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarProductosEnModal(resultado.data);
        } else {
            throw new Error(resultado.message || 'Error al cargar productos');
        }
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        mostrarNotificacion('Error al cargar productos: ' + error.message, 'danger');
    }
}

function mostrarProductosEnModal(productos) {
    const tbody = document.querySelector('#modalInventario tbody');
    if (!tbody) {
        console.error('❌ No se encontró la tabla en el modal');
        return;
    }
    
    if (!productos || productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay productos disponibles
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    productos.forEach(producto => {
        html += `
            <tr>
                <td>${producto.nombre || 'Sin nombre'}</td>
                <td>${producto.categoria || 'Sin categoría'}</td>
                <td>${producto.cantidad || 0}</td>
                <td>₡${formatearNumero(producto.precio || 0)}</td>
                <td>
                    <span class="badge ${producto.cantidad > 0 ? 'bg-success' : 'bg-danger'}">
                        ${producto.cantidad > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                </td>
                <td>
                    ${producto.cantidad > 0 ? 
                        `<button class="btn btn-primary btn-sm" onclick="seleccionarProducto(${producto.productoID})">
                            <i class="bi bi-plus-circle"></i> Agregar
                        </button>` : 
                        `<button class="btn btn-secondary btn-sm" disabled>
                            <i class="bi bi-x-circle"></i> Agotado
                        </button>`
                    }
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function seleccionarProducto(productoId) {
    try {
        console.log('🎯 Seleccionando producto:', productoId);
        
        const response = await fetch(`/Facturacion/ObtenerProducto/${productoId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.success) {
            agregarProductoAVenta(resultado.data);
            if (modalInventario) {
                modalInventario.hide();
            }
        } else {
            throw new Error(resultado.message || 'Error al obtener producto');
        }
        
    } catch (error) {
        console.error('❌ Error seleccionando producto:', error);
        mostrarNotificacion('Error al seleccionar producto: ' + error.message, 'danger');
    }
}

function agregarProductoAVenta(producto) {
    // Verificar si ya está en la venta
    const productoExistente = productosEnVenta.find(p => p.productoID === producto.productoID);
    
    if (productoExistente) {
        productoExistente.cantidad += 1;
        mostrarNotificacion('Cantidad actualizada', 'info');
    } else {
        productosEnVenta.push({
            productoID: producto.productoID,
            nombre: producto.nombre,
            precio: producto.precio || 0,
            cantidad: 1,
            subtotal: producto.precio || 0
        });
        mostrarNotificacion('Producto agregado a la venta', 'success');
    }
    
    actualizarTablaProductos();
    actualizarTotales();
}

function actualizarTablaProductos() {
    const tbody = document.querySelector('#productosVentaBody');
    if (!tbody) return;
    
    if (productosEnVenta.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-cart-x fs-1 d-block mb-2"></i>
                    No hay productos agregados a la venta
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    productosEnVenta.forEach((producto, index) => {
        html += `
            <tr>
                <td>${producto.nombre}</td>
                <td>
                    <input type="number" class="form-control" value="${producto.cantidad}" 
                           min="1" data-index="${index}" data-campo="cantidad"
                           onchange="actualizarCantidadProducto(${index}, this.value)">
                </td>
                <td>₡${formatearNumero(producto.precio)}</td>
                <td>₡${formatearNumero(producto.subtotal)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProductoVenta(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function actualizarCantidadProducto(index, nuevaCantidad) {
    const cantidad = parseInt(nuevaCantidad) || 1;
    if (cantidad <= 0) return;
    
    productosEnVenta[index].cantidad = cantidad;
    productosEnVenta[index].subtotal = productosEnVenta[index].precio * cantidad;
    
    actualizarTotales();
}

function eliminarProductoVenta(index) {
    const producto = productosEnVenta[index];
    productosEnVenta.splice(index, 1);
    
    actualizarTablaProductos();
    actualizarTotales();
    
    mostrarNotificacion(`${producto.nombre} eliminado de la venta`, 'info');
}

// ===== FUNCIONES DE CÁLCULOS =====

function actualizarTotales() {
    const subtotal = productosEnVenta.reduce((total, producto) => total + producto.subtotal, 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    
    // Actualizar elementos del DOM
    $('#subtotalVenta').text('₡' + formatearNumero(subtotal));
    $('#ivaVenta').text('₡' + formatearNumero(iva));
    $('#totalVenta').text('₡' + formatearNumero(total));
    
    // Habilitar/deshabilitar botón de finalizar
    const btnFinalizar = $('#btnFinalizarVenta');
    if (productosEnVenta.length > 0) {
        btnFinalizar.prop('disabled', false);
    } else {
        btnFinalizar.prop('disabled', true);
    }
}

function actualizarSubtotalFila(fila) {
    const cantidad = parseFloat(fila.find('[data-campo="cantidad"]').val()) || 0;
    const precio = parseFloat(fila.find('[data-campo="precio"]').val()) || 0;
    const subtotal = cantidad * precio;
    
    fila.find('.subtotal').text('₡' + formatearNumero(subtotal));
    actualizarTotales();
}

// ===== FUNCIONES DE MODAL =====

function mostrarModalFinalizarVenta() {
    // Implementar modal de finalización
    const modalHtml = `
        <div class="modal fade" id="modalFinalizarVenta" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Finalizar Venta</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Está seguro de finalizar esta venta?</p>
                        <p><strong>Total: ${$('#totalVenta').text()}</strong></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success" onclick="procesarVenta()">Confirmar Venta</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    $('#modalFinalizarVenta').remove();
    
    // Agregar nuevo modal
    $('body').append(modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalFinalizarVenta'));
    modal.show();
}

function procesarVenta() {
    console.log('💳 Procesando venta...');
    
    // Cerrar modal
    $('#modalFinalizarVenta').modal('hide');
    
    // Simular procesamiento (aquí iría la llamada real a la API)
    setTimeout(() => {
        mostrarNotificacion('Venta procesada exitosamente', 'success');
        limpiarVenta();
    }, 1000);
}

// ===== FUNCIONES UTILITARIAS =====

function formatearNumero(numero) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero);
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Usar el sistema de notificaciones existente si está disponible
    if (typeof mostrarAlertaBootstrap === 'function') {
        mostrarAlertaBootstrap(mensaje, tipo);
    } else if (typeof mostrarAlerta === 'function') {
        mostrarAlerta(mensaje, tipo);
    } else {
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
        
        // Crear alerta básica
        const alertClass = tipo === 'danger' ? 'alert-danger' : 
                          tipo === 'warning' ? 'alert-warning' :
                          tipo === 'success' ? 'alert-success' : 'alert-info';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        $('body').append(alertHtml);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            $('.alert').fadeOut();
        }, 5000);
    }
}

// ===== EXPOSICIÓN GLOBAL =====
window.consultarInventario = consultarInventario;
window.nuevaVenta = nuevaVenta;
window.agregarProducto = agregarProducto;
window.finalizarVenta = finalizarVenta;
window.limpiarVenta = limpiarVenta;
window.seleccionarProducto = seleccionarProducto;
window.eliminarProductoVenta = eliminarProductoVenta;
window.actualizarCantidadProducto = actualizarCantidadProducto;
window.procesarVenta = procesarVenta;
