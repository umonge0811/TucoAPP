// ===== FACTURACIÓN - JAVASCRIPT PRINCIPAL =====

let productosEnVenta = [];
let clienteSeleccionado = null;
let modalInventario = null;
let modalFinalizarVenta = null;
let modalDetalleProducto = null;

// ===== CONFIGURACIÓN DE PRECIOS POR MÉTODO DE PAGO =====
const CONFIGURACION_PRECIOS = {
    efectivo: { multiplicador: 1.0, nombre: 'Efectivo' },
    transferencia: { multiplicador: 1.0, nombre: 'Transferencia' },
    sinpe: { multiplicador: 1.0, nombre: 'SINPE Móvil' },
    tarjeta: { multiplicador: 1.05, nombre: 'Tarjeta' } // 5% adicional para tarjeta
};

let metodoPagoSeleccionado = 'efectivo'; // Método por defecto

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

        // Cargar productos iniciales
        cargarProductosIniciales();

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
        abrirModalNuevoCliente();
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

        // El sistema usa autenticación por cookies, no necesitamos token manual
        const response = await fetch('/Inventario/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Incluir cookies de autenticación automáticamente
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al obtener productos');
        }

        const productos = resultado.data || [];

        // Filtrar productos por término de búsqueda y con stock
        const productosFiltrados = productos.filter(producto => {
            const tieneStock = (producto.cantidadEnInventario || 0) > 0;
            const coincideTermino = termino === '' || 
                (producto.nombreProducto && producto.nombreProducto.toLowerCase().includes(termino.toLowerCase())) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(termino.toLowerCase()));

            return tieneStock && coincideTermino;
        }).slice(0, 12); // Limitar a 12 resultados

        mostrarResultadosProductos(productosFiltrados);

    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        mostrarErrorBusqueda('productos', error.message);
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
        const imagenUrl = producto.imagenesProductos && producto.imagenesProductos.length > 0 
            ? producto.imagenesProductos[0].urlimagen 
            : '/images/no-image.png';

        // Calcular precios según método de pago
        const precioBase = producto.precio || 0;
        const precioEfectivo = precioBase * CONFIGURACION_PRECIOS.efectivo.multiplicador;
        const precioTarjeta = precioBase * CONFIGURACION_PRECIOS.tarjeta.multiplicador;

        const stockClase = producto.cantidadEnInventario <= 0 ? 'border-danger' : 
                          producto.cantidadEnInventario <= producto.stockMinimo ? 'border-warning' : '';

        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 producto-card ${stockClase}" data-producto-id="${producto.productoId}">
                    <div class="position-relative">
                        <img src="${imagenUrl}" 
                             class="card-img-top producto-imagen" 
                             alt="${producto.nombreProducto}"
                             style="height: 120px; object-fit: cover;"
                             onerror="this.src='/images/no-image.png'">
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

                        <!-- Precios diferenciados -->
                        <div class="precios-metodos mb-2">
                            <div class="row text-center">
                                <div class="col-6">
                                    <small class="text-muted d-block">Efectivo/SINPE</small>
                                    <span class="text-success fw-bold small">₡${formatearMoneda(precioEfectivo)}</span>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Tarjeta</small>
                                    <span class="text-warning fw-bold small">₡${formatearMoneda(precioTarjeta)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-primary">Stock: ${producto.cantidadEnInventario}</small>
                            ${producto.cantidadEnInventario <= producto.stockMinimo && producto.cantidadEnInventario > 0 ? 
                                '<small class="badge bg-warning">Stock Bajo</small>' : ''}
                        </div>

                        <div class="d-grid gap-1">
                            ${producto.cantidadEnInventario > 0 ? `
                                <button type="button" 
                                        class="btn btn-primary btn-sm btn-seleccionar-producto"
                                        data-producto='${JSON.stringify(producto)}'>
                                    <i class="bi bi-hand-index me-1"></i>Seleccionar
                                </button>
                            ` : `
                                <button type="button" class="btn btn-secondary btn-sm" disabled>
                                    <i class="bi bi-x-circle me-1"></i>Sin Stock
                                </button>
                            `}
                            <button type="button" 
                                    class="btn btn-outline-info btn-sm btn-ver-detalle"
                                    data-producto='${JSON.stringify(producto)}'>
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
    $('.btn-seleccionar-producto').on('click', function() {
        const producto = JSON.parse($(this).attr('data-producto'));
        mostrarModalSeleccionProducto(producto);
    });

    $('.btn-ver-detalle').on('click', function() {
        const producto = JSON.parse($(this).attr('data-producto'));
        verDetalleProducto(producto);
    });
}

// ===== BÚSQUEDA DE CLIENTES =====
async function buscarClientes(termino) {
    try {
        console.log(`👥 Buscando clientes: "${termino}"`);

        const response = await fetch(`/Clientes/BuscarClientes?termino=${encodeURIComponent(termino)}`);

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

// ===== MODAL DE SELECCIÓN DE PRODUCTO =====
function mostrarModalSeleccionProducto(producto) {
    const precioBase = producto.precio || 0;
    const imagenUrl = producto.imagenesProductos && producto.imagenesProductos.length > 0 
        ? producto.imagenesProductos[0].urlimagen 
        : '/images/no-image.png';

    const modalHtml = `
        <div class="modal fade" id="modalSeleccionProducto" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-cart-plus me-2"></i>Seleccionar Producto
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${imagenUrl}" 
                                     class="img-fluid rounded shadow-sm" 
                                     alt="${producto.nombreProducto}"
                                     onerror="this.src='/images/no-image.png'">
                            </div>
                            <div class="col-md-8">
                                <h4 class="mb-3">${producto.nombreProducto}</h4>
                                ${producto.descripcion ? `<p class="text-muted mb-3">${producto.descripcion}</p>` : ''}

                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <strong>Stock disponible:</strong> ${producto.cantidadEnInventario} unidades
                                </div>

                                <!-- Selección de método de pago -->
                                <div class="mb-4">
                                    <h6 class="mb-3">💳 Selecciona el método de pago:</h6>
                                    <div class="row g-2">
                                        ${Object.entries(CONFIGURACION_PRECIOS).map(([metodo, config]) => {
                                            const precio = precioBase * config.multiplicador;
                                            return `
                                                <div class="col-sm-6 col-lg-3">
                                                    <input type="radio" 
                                                           class="btn-check metodo-pago-radio" 
                                                           name="metodoPagoProducto" 
                                                           id="metodo-${metodo}" 
                                                           value="${metodo}"
                                                           ${metodo === 'efectivo' ? 'checked' : ''}>
                                                    <label class="btn btn-outline-primary w-100 text-center p-2" 
                                                           for="metodo-${metodo}">
                                                        <div class="fw-bold">${config.nombre}</div>
                                                        <div class="text-success">₡${formatearMoneda(precio)}</div>
                                                        ${metodo === 'tarjeta' ? '<small class="text-muted">+5%</small>' : ''}
                                                    </label>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>

                                <!-- Cantidad -->
                                <div class="mb-3">
                                    <label for="cantidadProducto" class="form-label">
                                        <i class="bi bi-123 me-1"></i>Cantidad:
                                    </label>
                                    <div class="input-group" style="max-width: 150px;">
                                        <button type="button" class="btn btn-outline-secondary" id="btnMenosCantidad">-</button>
                                        <input type="number" 
                                               class="form-control text-center" 
                                               id="cantidadProducto" 
                                               value="1" 
                                               min="1" 
                                               max="${producto.cantidadEnInventario}">
                                        <button type="button" class="btn btn-outline-secondary" id="btnMasCantidad">+</button>
                                    </div>
                                </div>

                                <!-- Total calculado -->
                                <div class="alert alert-success">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span><i class="bi bi-calculator me-2"></i><strong>Total:</strong></span>
                                        <span class="fs-4 fw-bold" id="totalCalculado">₡${formatearMoneda(precioBase)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-success btn-lg" id="btnConfirmarAgregarProducto">
                            <i class="bi bi-cart-plus me-1"></i>Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalSeleccionProducto').remove();
    $('body').append(modalHtml);

    const modal = new bootstrap.Modal(document.getElementById('modalSeleccionProducto'));
    modal.show();

    // Configurar eventos del modal
    configurarEventosModalProducto(producto, modal);
}

function configurarEventosModalProducto(producto, modal) {
    const precioBase = producto.precio || 0;

    // Actualizar total cuando cambie el método de pago o cantidad
    function actualizarTotal() {
        const metodoSeleccionado = $('input[name="metodoPagoProducto"]:checked').val();
        const cantidad = parseInt($('#cantidadProducto').val()) || 1;
        const precio = precioBase * CONFIGURACION_PRECIOS[metodoSeleccionado].multiplicador;
        const total = precio * cantidad;

        $('#totalCalculado').text(`₡${formatearMoneda(total)}`);
    }

    // Eventos de cambio de método de pago
    $('.metodo-pago-radio').on('change', actualizarTotal);

    // Eventos de cantidad
    $('#btnMenosCantidad').on('click', function() {
        const input = $('#cantidadProducto');
        const valorActual = parseInt(input.val()) || 1;
        if (valorActual > 1) {
            input.val(valorActual - 1);
            actualizarTotal();
        }
    });

    $('#btnMasCantidad').on('click', function() {
        const input = $('#cantidadProducto');
        const valorActual = parseInt(input.val()) || 1;
        const stockDisponible = producto.cantidadEnInventario;
        if (valorActual < stockDisponible) {
            input.val(valorActual + 1);
            actualizarTotal();
        }
    });

    $('#cantidadProducto').on('input', function() {
        const valor = parseInt($(this).val()) || 1;
        const min = parseInt($(this).attr('min')) || 1;
        const max = parseInt($(this).attr('max')) || producto.cantidadEnInventario;

        if (valor < min) $(this).val(min);
        if (valor > max) $(this).val(max);

        actualizarTotal();
    });

    // Confirmar agregar producto
    $('#btnConfirmarAgregarProducto').on('click', function() {
        const metodoSeleccionado = $('input[name="metodoPagoProducto"]:checked').val();
        const cantidad = parseInt($('#cantidadProducto').val()) || 1;
        const precio = precioBase * CONFIGURACION_PRECIOS[metodoSeleccionado].multiplicador;

        agregarProductoAVenta(producto, cantidad, precio, metodoSeleccionado);
        modal.hide();
    });

    // Inicializar total
    actualizarTotal();
}

// ===== GESTIÓN DEL CARRITO =====
function agregarProductoAVenta(producto, cantidad = 1, precioUnitario = null, metodoPago = 'efectivo') {
    // Si no se especifica precio, calcularlo
    if (precioUnitario === null) {
        precioUnitario = (producto.precio || 0) * CONFIGURACION_PRECIOS[metodoPago].multiplicador;
    }

    // Verificar si el producto ya está en la venta
    const productoExistente = productosEnVenta.find(p => p.productoId === producto.productoId);

    if (productoExistente) {
        // Incrementar cantidad si no supera el stock
        if (productoExistente.cantidad + cantidad <= producto.cantidadEnInventario) {
            productoExistente.cantidad += cantidad;
            mostrarToast('Producto actualizado', `Cantidad de ${producto.nombreProducto} incrementada`, 'success');
        } else {
            mostrarToast('Stock insuficiente', `No hay suficiente stock disponible para ${producto.nombreProducto}`, 'warning');
            return;
        }
    } else {
        // Agregar nuevo producto
        productosEnVenta.push({
            productoId: producto.productoId,
            nombreProducto: producto.nombreProducto,
            precioUnitario: precioUnitario,
            cantidad: cantidad,
            stockDisponible: producto.cantidadEnInventario,
            metodoPago: metodoPago,
            imagenUrl: producto.imagenesProductos && producto.imagenesProductos.length > 0 ? 
                      producto.imagenesProductos[0].urlimagen : null
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
        const metodoPago = producto.metodoPago || 'efectivo';
        const configMetodo = CONFIGURACION_PRECIOS[metodoPago];

        html += `
            <div class="producto-venta-item border rounded p-2 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${producto.nombreProducto}</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">₡${formatearMoneda(producto.precioUnitario)} c/u</small>
                            <small class="badge bg-info">${configMetodo.nombre}</small>
                        </div>
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

function mostrarErrorBusqueda(tipo, mensajeEspecifico = null) {
    const mensajeDefault = tipo === 'productos' ? 'Error al buscar productos' : 'Error al buscar clientes';
    const mensaje = mensajeEspecifico || mensajeDefault;

    $('#resultadosBusqueda').html(`
        <div class="col-12 text-center py-4 text-danger">
            <i class="bi bi-exclamation-triangle display-1"></i>
            <p class="mt-2">${mensaje}</p>
            <button class="btn btn-outline-primary mt-2" onclick="cargarProductosIniciales()">
                <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
            </button>
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
}

function verDetalleProducto(producto) {
    console.log('Ver detalle del producto:', producto);

    const imagenUrl = producto.imagenesProductos && producto.imagenesProductos.length > 0 
        ? producto.imagenesProductos[0].urlimagen 
        : '/images/no-image.png';

    const modalHtml = `
        <div class="modal fade" id="modalDetalleProducto" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-info-circle me-2"></i>Detalle del Producto
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${imagenUrl}" 
                                     class="img-fluid rounded shadow-sm" 
                                     alt="${producto.nombreProducto}"
                                     onerror="this.src='/images/no-image.png'">

                                <!-- Información de stock -->
                                <div class="mt-3">
                                    <div class="alert ${producto.cantidadEnInventario <= 0 ? 'alert-danger' : 
                                        producto.cantidadEnInventario <= producto.stockMinimo ? 'alert-warning' : 'alert-success'}">
                                        <div class="text-center">
                                            <i class="bi bi-box-seam display-6"></i>
                                            <h5 class="mt-2">Stock: ${producto.cantidadEnInventario}</h5>
                                            <small>Mínimo: ${producto.stockMinimo}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <h3 class="mb-3">${producto.nombreProducto}</h3>

                                ${producto.descripcion ? `
                                    <div class="mb-3">
                                        <h6><i class="bi bi-card-text me-2"></i>Descripción:</h6>
                                        <p class="text-muted">${producto.descripcion}</p>
                                    </div>
                                ` : ''}

                                <!-- Tabla de precios -->
                                <div class="mb-4">
                                    <h6><i class="bi bi-currency-exchange me-2"></i>Precios por método de pago:</h6>
                                    <div class="table-responsive">
                                        <table class="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Método de Pago</th>
                                                    <th class="text-end">Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${Object.entries(CONFIGURACION_PRECIOS).map(([metodo, config]) => {
                                                    const precio = (producto.precio || 0) * config.multiplicador;
                                                    return `
                                                        <tr>
                                                            <td>
                                                                <i class="bi bi-${metodo === 'tarjeta' ? 'credit-card' : 'cash'} me-2"></i>
                                                                ${config.nombre}
                                                                ${metodo === 'tarjeta' ? '<span class="text-muted">(+5%)</span>' : ''}
                                                            </td>
                                                            <td class="text-end fw-bold">₡${formatearMoneda(precio)}</td>
                                                        </tr>
                                                    `;
                                                }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Información adicional si es llanta -->
                                ${producto.llanta ? `
                                    <div class="mb-3">
                                        <h6><i class="bi bi-circle me-2"></i>Información de Llanta:</h6>
                                        <div class="row">
                                            <div class="col-6">
                                                <small class="text-muted">Marca:</small><br>
                                                <strong>${producto.llanta.marca || 'N/A'}</strong>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted">Modelo:</small><br>
                                                <strong>${producto.llanta.modelo || 'N/A'}</strong>
                                            </div>
                                            <div class="col-6 mt-2">
                                                <small class="text-muted">Medida:</small><br>
                                                <strong>${producto.llanta.ancho}/${producto.llanta.perfil} R${producto.llanta.diametro}</strong>
                                            </div>
                                            <div class="col-6 mt-2">
                                                <small class="text-muted">Índice de Velocidad:</small><br>
                                                <strong>${producto.llanta.indiceVelocidad || 'N/A'}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Información del sistema -->
                                <div class="text-muted small">
                                    <p class="mb-1"><strong>ID:</strong> ${producto.productoId}</p>
                                    ${producto.fechaUltimaActualizacion ? 
                                        `<p class="mb-0"><strong>Última actualización:</strong> ${new Date(producto.fechaUltimaActualizacion).toLocaleDateString()}</p>` 
                                        : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${producto.cantidadEnInventario > 0 ? `
                            <button type="button" class="btn btn-primary" onclick="mostrarModalSeleccionProducto(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                                <i class="bi bi-cart-plus me-1"></i>Agregar a Venta
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalDetalleProducto').remove();
    $('body').append(modalHtml);

    const modal = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));
    modal.show();
}

// ===== GESTIÓN DE CLIENTES =====
function abrirModalNuevoCliente() {
    // Crear el modal dinámicamente
    const modalHtml = `
        <div class="modal fade" id="modalNuevoClienteFacturacion" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-person-plus me-2"></i>Nuevo Cliente
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formNuevoClienteFacturacion">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="nombreClienteFacturacion" class="form-label">
                                        <i class="bi bi-person me-1"></i>Nombre *
                                    </label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="nombreClienteFacturacion" 
                                           name="nombre" 
                                           required>
                                    <div class="invalid-feedback"></div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="contactoClienteFacturacion" class="form-label">
                                        <i class="bi bi-person-badge me-1"></i>Contacto
                                    </label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="contactoClienteFacturacion" 
                                           name="contacto">
                                    <div class="invalid-feedback"></div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="emailClienteFacturacion" class="form-label">
                                        <i class="bi bi-envelope me-1"></i>Email
                                    </label>
                                    <input type="email" 
                                           class="form-control" 
                                           id="emailClienteFacturacion" 
                                           name="email">
                                    <div class="invalid-feedback"></div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="telefonoClienteFacturacion" class="form-label">
                                        <i class="bi bi-telephone me-1"></i>Teléfono
                                    </label>
                                    <input type="tel" 
                                           class="form-control" 
                                           id="telefonoClienteFacturacion" 
                                           name="telefono">
                                    <div class="invalid-feedback"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="direccionClienteFacturacion" class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Dirección
                                </label>
                                <textarea class="form-control" 
                                          id="direccionClienteFacturacion" 
                                          name="direccion" 
                                          rows="3"></textarea>
                                <div class="invalid-feedback"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" id="btnGuardarClienteFacturacion">
                            <span class="btn-normal-state">
                                <i class="bi bi-check-circle me-1"></i>Guardar Cliente
                            </span>
                            <span class="btn-loading-state d-none">
                                <span class="spinner-border spinner-border-sm me-2"></span>Guardando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalNuevoClienteFacturacion').remove();

    // Agregar modal al DOM
    $('body').append(modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalNuevoClienteFacturacion'));
    modal.show();

    // Configurar evento para guardar
    $('#btnGuardarClienteFacturacion').on('click', function() {
        guardarNuevoCliente();
    });

    // Limpiar validaciones en tiempo real
    $('#modalNuevoClienteFacturacion input, #modalNuevoClienteFacturacion textarea').on('input', function() {
        $(this).removeClass('is-invalid');
        $(this).siblings('.invalid-feedback').text('');
    });
}

async function guardarNuevoCliente() {
    try {
        // Validar formulario
        if (!validarFormularioNuevoCliente()) {
            return;
        }

        const btnGuardar = $('#btnGuardarClienteFacturacion');
        btnGuardar.prop('disabled', true);
        btnGuardar.find('.btn-normal-state').addClass('d-none');
        btnGuardar.find('.btn-loading-state').removeClass('d-none');

        // Recopilar datos (usar nombres de propiedades que coincidan con el modelo del servidor)
        const clienteData = {
            nombreCliente: $('#nombreClienteFacturacion').val().trim(),
            contacto: $('#contactoClienteFacturacion').val().trim(),
            email: $('#emailClienteFacturacion').val().trim(),
            telefono: $('#telefonoClienteFacturacion').val().trim(),
            direccion: $('#direccionClienteFacturacion').val().trim()
        };

        // Enviar datos
        const response = await fetch('/Clientes/CrearCliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(clienteData)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.success) {
            // Cerrar modal
            $('#modalNuevoClienteFacturacion').modal('hide');

            // Seleccionar el cliente creado automáticamente
            seleccionarCliente({
                id: resultado.clienteId,
                nombre: clienteData.nombreCliente,
                email: clienteData.email,
                telefono: clienteData.telefono
            });

            mostrarToast('Cliente creado', 'Cliente creado exitosamente y seleccionado para la venta', 'success');
        } else {
            // Manejar errores de validación específicos
            if (resultado.errores) {
                // Mostrar errores de validación en los campos correspondientes
                Object.keys(resultado.errores).forEach(campo => {
                    const mensajes = resultado.errores[campo];
                    if (mensajes && mensajes.length > 0) {
                        const campoSelector = getCampoSelector(campo);
                        if (campoSelector) {
                            mostrarErrorCampoFacturacion(campoSelector, mensajes[0]);
                        }
                    }
                });
                return; // No lanzar error, solo mostrar validaciones
            } else {
                throw new Error(resultado.message || 'Error al crear cliente');
            }
        }

    } catch (error) {
        console.error('❌ Error guardando cliente:', error);
        mostrarToast('Error', 'No se pudo crear el cliente: ' + error.message, 'danger');
    } finally {
        const btnGuardar = $('#btnGuardarClienteFacturacion');
        btnGuardar.prop('disabled', false);
        btnGuardar.find('.btn-normal-state').removeClass('d-none');
        btnGuardar.find('.btn-loading-state').addClass('d-none');
    }
}

function validarFormularioNuevoCliente() {
    let esValido = true;

    // Limpiar validaciones previas
    $('#modalNuevoClienteFacturacion .form-control').removeClass('is-invalid');
    $('#modalNuevoClienteFacturacion .invalid-feedback').text('');

    // Validar nombre (requerido)
    const nombre = $('#nombreClienteFacturacion').val().trim();
    if (!nombre) {
        mostrarErrorCampoFacturacion('#nombreClienteFacturacion', 'El nombre del cliente es requerido');
        esValido = false;
    }

    // Validar email (formato si se proporciona)
    const email = $('#emailClienteFacturacion').val().trim();
    if (email && !validarEmailFacturacion(email)) {
        mostrarErrorCampoFacturacion('#emailClienteFacturacion', 'El formato del email no es válido');
        esValido = false;
    }

    return esValido;
}

function mostrarErrorCampoFacturacion(selector, mensaje) {
    $(selector).addClass('is-invalid');
    $(selector).siblings('.invalid-feedback').text(mensaje);
}

function validarEmailFacturacion(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function getCampoSelector(nombreCampo) {
    const mapaCampos = {
        'nombre': '#nombreClienteFacturacion',
        'NombreCliente': '#nombreClienteFacturacion',
        'contacto': '#contactoClienteFacturacion',
        'Contacto': '#contactoClienteFacturacion',
        'email': '#emailClienteFacturacion',
        'Email': '#emailClienteFacturacion',
        'telefono': '#telefonoClienteFacturacion',
        'Telefono': '#telefonoClienteFacturacion',
        'direccion': '#direccionClienteFacturacion',
        'Direccion': '#direccionClienteFacturacion'
    };

    return mapaCampos[nombreCampo] || null;
}

// ===== FUNCIÓN CONSULTAR INVENTARIO =====
function consultarInventario() {
    console.log('📦 Abriendo consulta de inventario...');

    if (modalInventario) {
        modalInventario.show();
    } else {
        console.error('❌ Modal de inventario no está inicializado');
        mostrarToast('Error', 'No se pudo abrir el inventario', 'danger');
    }
}

// ===== FUNCIONES AUXILIARES ADICIONALES =====
function nuevaVenta() {
    limpiarVenta();
    console.log('🆕 Nueva venta iniciada');
}

function agregarProducto(producto) {
    agregarProductoAVenta(producto);
}

function finalizarVenta() {
    mostrarModalFinalizarVenta();
}

function eliminarProductoVenta(index) {
    if (index >= 0 && index < productosEnVenta.length) {
        productosEnVenta.splice(index, 1);
        actualizarVistaCarrito();
        actualizarTotales();
        mostrarToast('Producto eliminado', 'Producto removido de la venta', 'info');
    }
}

function actualizarCantidadProducto(index, nuevaCantidad) {
    if (index >= 0 && index < productosEnVenta.length) {
        const producto = productosEnVenta[index];
        if (nuevaCantidad >= 1 && nuevaCantidad <= producto.stockDisponible) {
            producto.cantidad = nuevaCantidad;
            actualizarVistaCarrito();
            actualizarTotales();
        }
    }
}

function procesarVenta() {
    procesarVentaFinal();
}

// ===== CARGAR PRODUCTOS INICIALES =====
async function cargarProductosIniciales() {
    try {
        console.log('📦 Cargando productos iniciales...');
        await buscarProductos(''); // Cargar todos los productos con stock
    } catch (error) {
        console.error('❌ Error cargando productos iniciales:', error);
        $('#resultadosBusqueda').html(`
            <div class="col-12 text-center py-4 text-danger">
                <i class="bi bi-exclamation-triangle display-1"></i>
                <p class="mt-2">Error al cargar productos</p>
                <button class="btn btn-outline-primary" onclick="cargarProductosIniciales()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
                </button>
            </div>
        `);
    }
}

// ===== HACER FUNCIONES GLOBALES =====
window.abrirModalNuevoCliente = abrirModalNuevoCliente;
window.seleccionarCliente = seleccionarCliente;
window.limpiarVenta = limpiarVenta;
window.mostrarModalFinalizarVenta = mostrarModalFinalizarVenta;
window.verDetalleProducto = verDetalleProducto;
window.consultarInventario = consultarInventario;
window.nuevaVenta = nuevaVenta;
window.agregarProducto = agregarProducto;
window.finalizarVenta = finalizarVenta;
window.eliminarProductoVenta = eliminarProductoVenta;
window.actualizarCantidadProducto = actualizarCantidadProducto;
window.procesarVenta = procesarVenta;