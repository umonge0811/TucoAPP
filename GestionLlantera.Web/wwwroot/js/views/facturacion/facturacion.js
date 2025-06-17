
/* ========================================
   MÓDULO DE FACTURACIÓN - JAVASCRIPT
   ======================================== */

$(document).ready(function () {
    console.log('🚀 Facturación - Inicializando módulo...');
    
    // ========================================
    // CONFIGURACIÓN Y VARIABLES GLOBALES
    // ========================================
    
    const CONFIG = {
        baseUrl: '/Facturacion',
        pageSize: 20,
        debounceDelay: 300,
        maxQuantity: 999,
        currency: '₡'
    };
    
    let carritoVenta = [];
    let productosCache = [];
    let currentPage = 1;
    let totalPages = 1;
    let searchTimeout = null;
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    inicializarEventos();
    cargarEstadisticas();
    cargarVentasRecientes();
    
    // ========================================
    // EVENTOS PRINCIPALES
    // ========================================
    
    function inicializarEventos() {
        console.log('📝 Inicializando eventos...');
        
        // Botones principales
        $('#btnNuevaVenta').on('click', limpiarCarritoYEmpezar);
        $('#btnConsultarInventario').on('click', abrirModalInventario);
        
        // Búsqueda de productos
        $('#busquedaProducto').on('input', debounce(buscarProductos, CONFIG.debounceDelay));
        $('#btnEscanearCodigo').on('click', activarEscaneoCodigo);
        
        // Filtros rápidos
        $('.filter-chip').on('click', aplicarFiltroRapido);
        
        // Carrito de venta
        $('#btnLimpiarCarrito').on('click', confirmarLimpiarCarrito);
        $('#btnFinalizarVenta').on('click', abrirModalFinalizarVenta);
        $('#btnGenerarProforma').on('click', generarProforma);
        
        // Modal inventario
        $('#btnBuscarInventario').on('click', buscarEnInventario);
        $('#btnExportarInventario').on('click', exportarInventario);
        
        // Modal finalizar venta
        $('input[name="metodoPago"]').on('change', cambiarMetodoPago);
        $('#efectivoRecibido').on('input', calcularCambio);
        $('#btnConfirmarVenta').on('click', confirmarVenta);
        $('#btnGuardarProforma').on('click', guardarProforma);
        
        // Modal detalle producto
        $('#btnRestarCantidad').on('click', () => ajustarCantidad(-1));
        $('#btnSumarCantidad').on('click', () => ajustarCantidad(1));
        $('#cantidadProducto').on('input', validarCantidad);
        $('#btnAgregarAlCarrito').on('click', agregarProductoAlCarrito);
        
        // Eventos de cantidad en carrito
        $(document).on('click', '.btn-increase-qty', function() {
            const productId = $(this).data('product-id');
            cambiarCantidadCarrito(productId, 1);
        });
        
        $(document).on('click', '.btn-decrease-qty', function() {
            const productId = $(this).data('product-id');
            cambiarCantidadCarrito(productId, -1);
        });
        
        $(document).on('click', '.btn-remove-item', function() {
            const productId = $(this).data('product-id');
            eliminarDelCarrito(productId);
        });
        
        console.log('✅ Eventos inicializados correctamente');
    }
    
    // ========================================
    // FUNCIONES DE BÚSQUEDA Y PRODUCTOS
    // ========================================
    
    async function buscarProductos() {
        const termino = $('#busquedaProducto').val().trim();
        const filtroActivo = $('.filter-chip.active').data('filter');
        
        if (termino.length < 2) {
            mostrarMensajeBusqueda('Ingresa al menos 2 caracteres para buscar');
            return;
        }
        
        try {
            mostrarLoadingProductos();
            
            const response = await $.ajax({
                url: `${CONFIG.baseUrl}/BuscarProductos`,
                method: 'GET',
                data: {
                    termino: termino,
                    categoria: filtroActivo !== 'todos' ? filtroActivo : '',
                    page: currentPage,
                    pageSize: CONFIG.pageSize
                }
            });
            
            if (response.success) {
                productosCache = response.data.productos;
                totalPages = response.data.totalPages;
                renderizarProductos(response.data.productos);
                actualizarPaginacion();
            } else {
                mostrarError('Error al buscar productos: ' + response.message);
            }
            
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            mostrarError('Error de conexión al buscar productos');
        }
    }
    
    function renderizarProductos(productos) {
        const $container = $('#resultadosBusqueda');
        
        if (!productos || productos.length === 0) {
            $container.html(`
                <div class="text-center text-muted py-4">
                    <i class="bi bi-search-heart display-1 opacity-25"></i>
                    <p class="mt-3">No se encontraron productos</p>
                    <small>Intenta con otros términos de búsqueda</small>
                </div>
            `);
            return;
        }
        
        const productosHtml = productos.map(producto => `
            <div class="producto-card" data-product-id="${producto.id}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <img src="${producto.imagenUrl || '/images/no-image.png'}" 
                             alt="${producto.nombre}" 
                             class="producto-imagen">
                    </div>
                    <div class="col">
                        <div class="producto-info">
                            <h6 class="text-truncate-2 mb-1">${producto.nombre}</h6>
                            <small class="text-muted d-block mb-1">Código: ${producto.codigo}</small>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="producto-precio">${CONFIG.currency}${formatearPrecio(producto.precio)}</span>
                                <span class="producto-stock ${getClaseStock(producto.stock)}">${producto.stock} un.</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-info btn-ver-detalle" data-product-id="${producto.id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-primary btn-agregar-rapido" 
                                    data-product-id="${producto.id}" 
                                    ${producto.stock <= 0 ? 'disabled' : ''}>
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        $container.html(productosHtml);
        
        // Eventos para los productos
        $('.btn-ver-detalle').on('click', function() {
            const productId = $(this).data('product-id');
            abrirDetalleProducto(productId);
        });
        
        $('.btn-agregar-rapido').on('click', function() {
            const productId = $(this).data('product-id');
            agregarRapidoAlCarrito(productId);
        });
    }
    
    function aplicarFiltroRapido() {
        $('.filter-chip').removeClass('active');
        $(this).addClass('active');
        
        currentPage = 1;
        if ($('#busquedaProducto').val().trim().length >= 2) {
            buscarProductos();
        }
    }
    
    // ========================================
    // FUNCIONES DEL CARRITO
    // ========================================
    
    function agregarRapidoAlCarrito(productId) {
        const producto = productosCache.find(p => p.id == productId);
        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }
        
        if (producto.stock <= 0) {
            mostrarWarning('Este producto no tiene stock disponible');
            return;
        }
        
        const itemExistente = carritoVenta.find(item => item.id == productId);
        
        if (itemExistente) {
            if (itemExistente.cantidad + 1 > producto.stock) {
                mostrarWarning('No hay suficiente stock disponible');
                return;
            }
            itemExistente.cantidad++;
        } else {
            carritoVenta.push({
                id: producto.id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagenUrl,
                cantidad: 1,
                stockDisponible: producto.stock,
                subtotal: producto.precio
            });
        }
        
        actualizarVistaCarrito();
        mostrarSuccess(`${producto.nombre} agregado al carrito`);
        
        // Efecto visual
        $(`.btn-agregar-rapido[data-product-id="${productId}"]`)
            .addClass('btn-success')
            .html('<i class="bi bi-check"></i>')
            .delay(1000)
            .queue(function() {
                $(this).removeClass('btn-success').addClass('btn-primary').html('<i class="bi bi-plus"></i>').dequeue();
            });
    }
    
    function cambiarCantidadCarrito(productId, cambio) {
        const item = carritoVenta.find(item => item.id == productId);
        if (!item) return;
        
        const nuevaCantidad = item.cantidad + cambio;
        
        if (nuevaCantidad <= 0) {
            eliminarDelCarrito(productId);
            return;
        }
        
        if (nuevaCantidad > item.stockDisponible) {
            mostrarWarning('No hay suficiente stock disponible');
            return;
        }
        
        item.cantidad = nuevaCantidad;
        item.subtotal = item.cantidad * item.precio;
        
        actualizarVistaCarrito();
    }
    
    function eliminarDelCarrito(productId) {
        carritoVenta = carritoVenta.filter(item => item.id != productId);
        actualizarVistaCarrito();
        mostrarInfo('Producto eliminado del carrito');
    }
    
    function actualizarVistaCarrito() {
        const $container = $('#itemsCarrito');
        const $resumen = $('#resumenCarrito');
        const $acciones = $('#accionesCarrito');
        const $contador = $('#contadorItems');
        
        if (carritoVenta.length === 0) {
            $container.html(`
                <div class="empty-cart text-center py-4">
                    <i class="bi bi-cart-x display-2 text-muted"></i>
                    <p class="text-muted mt-2">No hay productos seleccionados</p>
                    <small class="text-muted">Busca y agrega productos al carrito</small>
                </div>
            `);
            $resumen.hide();
            $acciones.hide();
            $contador.text('0');
            return;
        }
        
        const itemsHtml = carritoVenta.map(item => `
            <div class="cart-item">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <img src="${item.imagen || '/images/no-image.png'}" 
                             alt="${item.nombre}" 
                             class="cart-item-image">
                    </div>
                    <div class="col">
                        <div class="cart-item-info">
                            <h6 class="text-truncate-2">${item.nombre}</h6>
                            <small class="text-muted">Código: ${item.codigo}</small>
                            <div class="cart-item-precio">${CONFIG.currency}${formatearPrecio(item.precio)}</div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="quantity-controls">
                            <button class="btn btn-outline-secondary btn-sm btn-decrease-qty" 
                                    data-product-id="${item.id}">
                                <i class="bi bi-dash"></i>
                            </button>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${item.cantidad}" readonly>
                            <button class="btn btn-outline-secondary btn-sm btn-increase-qty" 
                                    data-product-id="${item.id}">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                        <button class="btn btn-outline-danger btn-sm mt-1 btn-remove-item" 
                                data-product-id="${item.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="text-end mt-2">
                    <strong>Subtotal: ${CONFIG.currency}${formatearPrecio(item.subtotal)}</strong>
                </div>
            </div>
        `).join('');
        
        $container.html(itemsHtml);
        
        // Calcular totales
        const subtotal = carritoVenta.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.13;
        const total = subtotal + iva;
        
        $('#subtotalCarrito').text(`${CONFIG.currency}${formatearPrecio(subtotal)}`);
        $('#ivaCarrito').text(`${CONFIG.currency}${formatearPrecio(iva)}`);
        $('#totalCarrito').text(`${CONFIG.currency}${formatearPrecio(total)}`);
        
        $contador.text(carritoVenta.length);
        $resumen.show();
        $acciones.show();
    }
    
    function confirmarLimpiarCarrito() {
        if (carritoVenta.length === 0) {
            mostrarInfo('El carrito ya está vacío');
            return;
        }
        
        Swal.fire({
            title: '¿Limpiar carrito?',
            text: 'Se eliminarán todos los productos del carrito',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                carritoVenta = [];
                actualizarVistaCarrito();
                mostrarSuccess('Carrito limpiado correctamente');
            }
        });
    }
    
    // ========================================
    // FUNCIONES DE MODAL DETALLE PRODUCTO
    // ========================================
    
    async function abrirDetalleProducto(productId) {
        try {
            const response = await $.ajax({
                url: `${CONFIG.baseUrl}/ObtenerProducto/${productId}`,
                method: 'GET'
            });
            
            if (response.success) {
                llenarModalDetalleProducto(response.data);
                $('#modalDetalleProducto').modal('show');
            } else {
                mostrarError('Error al obtener detalles del producto');
            }
            
        } catch (error) {
            console.error('❌ Error al obtener producto:', error);
            mostrarError('Error de conexión');
        }
    }
    
    function llenarModalDetalleProducto(producto) {
        $('#productoImagen').attr('src', producto.imagenUrl || '/images/no-image.png');
        $('#productoNombre').text(producto.nombre);
        $('#productoDescripcion').text(producto.descripcion || 'Sin descripción');
        $('#productoCodigo').text(producto.codigo);
        $('#productoCategoria').text(producto.categoria || 'General');
        $('#productoPrecio').text(`${CONFIG.currency}${formatearPrecio(producto.precio)}`);
        $('#productoStock').text(`${producto.stock} unidades`);
        $('#stockMaximo').text(producto.stock);
        
        // Configurar cantidad
        $('#cantidadProducto').attr('max', producto.stock).val(1);
        
        // Información de llanta si aplica
        if (producto.esLlanta && producto.llanta) {
            $('#llantaMedida').text(producto.llanta.medida || 'N/A');
            $('#llantaMarca').text(producto.llanta.marca || 'N/A');
            $('#llantaTipo').text(producto.llanta.tipo || 'N/A');
            $('#llantaUso').text(producto.llanta.uso || 'N/A');
            $('#llantaInfo').show();
        } else {
            $('#llantaInfo').hide();
        }
        
        // Calcular subtotal inicial
        calcularSubtotalPreview();
        
        // Deshabilitar agregar si no hay stock
        $('#btnAgregarAlCarrito').prop('disabled', producto.stock <= 0);
        
        // Guardar referencia del producto
        $('#modalDetalleProducto').data('producto', producto);
    }
    
    function ajustarCantidad(cambio) {
        const $input = $('#cantidadProducto');
        const valorActual = parseInt($input.val()) || 1;
        const maximo = parseInt($input.attr('max')) || 999;
        const nuevaCantidad = Math.max(1, Math.min(maximo, valorActual + cambio));
        
        $input.val(nuevaCantidad);
        calcularSubtotalPreview();
    }
    
    function validarCantidad() {
        const $input = $('#cantidadProducto');
        const valor = parseInt($input.val()) || 1;
        const maximo = parseInt($input.attr('max')) || 999;
        
        if (valor < 1) {
            $input.val(1);
        } else if (valor > maximo) {
            $input.val(maximo);
            mostrarWarning(`Cantidad máxima disponible: ${maximo}`);
        }
        
        calcularSubtotalPreview();
    }
    
    function calcularSubtotalPreview() {
        const producto = $('#modalDetalleProducto').data('producto');
        const cantidad = parseInt($('#cantidadProducto').val()) || 1;
        const subtotal = producto.precio * cantidad;
        
        $('#subtotalPreview').text(`${CONFIG.currency}${formatearPrecio(subtotal)}`);
    }
    
    function agregarProductoAlCarrito() {
        const producto = $('#modalDetalleProducto').data('producto');
        const cantidad = parseInt($('#cantidadProducto').val()) || 1;
        
        if (cantidad > producto.stock) {
            mostrarWarning('No hay suficiente stock disponible');
            return;
        }
        
        const itemExistente = carritoVenta.find(item => item.id == producto.id);
        
        if (itemExistente) {
            const nuevaCantidad = itemExistente.cantidad + cantidad;
            if (nuevaCantidad > producto.stock) {
                mostrarWarning('No hay suficiente stock para esa cantidad');
                return;
            }
            itemExistente.cantidad = nuevaCantidad;
            itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
        } else {
            carritoVenta.push({
                id: producto.id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagenUrl,
                cantidad: cantidad,
                stockDisponible: producto.stock,
                subtotal: producto.precio * cantidad
            });
        }
        
        actualizarVistaCarrito();
        $('#modalDetalleProducto').modal('hide');
        mostrarSuccess(`${producto.nombre} agregado al carrito (${cantidad} un.)`);
    }
    
    // ========================================
    // FUNCIONES AUXILIARES
    // ========================================
    
    function formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(precio);
    }
    
    function getClaseStock(stock) {
        if (stock <= 0) return 'stock-agotado';
        if (stock <= 5) return 'stock-bajo';
        return 'stock-disponible';
    }
    
    function mostrarLoadingProductos() {
        $('#resultadosBusqueda').html(`
            <div class="text-center py-4">
                <div class="loading-spinner"></div>
                <p class="mt-2">Buscando productos...</p>
            </div>
        `);
    }
    
    function mostrarMensajeBusqueda(mensaje) {
        $('#resultadosBusqueda').html(`
            <div class="text-center text-muted py-4">
                <i class="bi bi-search display-1 opacity-25"></i>
                <p class="mt-3">${mensaje}</p>
            </div>
        `);
    }
    
    function debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(searchTimeout);
                func(...args);
            };
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(later, wait);
        };
    }
    
    // Funciones de notificación (usando las existentes del proyecto)
    function mostrarSuccess(mensaje) {
        if (typeof toastr !== 'undefined') {
            toastr.success(mensaje);
        } else {
            console.log('✅ ' + mensaje);
        }
    }
    
    function mostrarError(mensaje) {
        if (typeof toastr !== 'undefined') {
            toastr.error(mensaje);
        } else {
            console.error('❌ ' + mensaje);
        }
    }
    
    function mostrarWarning(mensaje) {
        if (typeof toastr !== 'undefined') {
            toastr.warning(mensaje);
        } else {
            console.warn('⚠️ ' + mensaje);
        }
    }
    
    function mostrarInfo(mensaje) {
        if (typeof toastr !== 'undefined') {
            toastr.info(mensaje);
        } else {
            console.info('ℹ️ ' + mensaje);
        }
    }
    
    // ========================================
    // FUNCIONES PENDIENTES DE IMPLEMENTAR
    // ========================================
    
    function limpiarCarritoYEmpezar() {
        // TODO: Implementar lógica para limpiar carrito y comenzar nueva venta
        console.log('🔄 Iniciando nueva venta...');
    }
    
    function abrirModalInventario() {
        $('#modalInventario').modal('show');
        // TODO: Cargar datos del inventario
    }
    
    function cargarEstadisticas() {
        // TODO: Implementar carga de estadísticas del día
        console.log('📊 Cargando estadísticas...');
    }
    
    function cargarVentasRecientes() {
        // TODO: Implementar carga de ventas recientes
        console.log('📋 Cargando ventas recientes...');
    }
    
    function abrirModalFinalizarVenta() {
        if (carritoVenta.length === 0) {
            mostrarWarning('Agrega productos al carrito antes de finalizar la venta');
            return;
        }
        $('#modalFinalizarVenta').modal('show');
        // TODO: Llenar datos del modal
    }
    
    function generarProforma() {
        // TODO: Implementar generación de proforma
        console.log('📄 Generando proforma...');
    }
    
    function buscarEnInventario() {
        // TODO: Implementar búsqueda en inventario
        console.log('🔍 Buscando en inventario...');
    }
    
    function exportarInventario() {
        // TODO: Implementar exportación de inventario
        console.log('📤 Exportando inventario...');
    }
    
    function cambiarMetodoPago() {
        // TODO: Implementar cambio de método de pago
        console.log('💳 Cambiando método de pago...');
    }
    
    function calcularCambio() {
        // TODO: Implementar cálculo de cambio
        console.log('💰 Calculando cambio...');
    }
    
    function confirmarVenta() {
        // TODO: Implementar confirmación de venta
        console.log('✅ Confirmando venta...');
    }
    
    function guardarProforma() {
        // TODO: Implementar guardado de proforma
        console.log('💾 Guardando proforma...');
    }
    
    function activarEscaneoCodigo() {
        // TODO: Implementar escáner de código de barras
        console.log('📷 Activando escáner...');
    }
    
    function actualizarPaginacion() {
        // TODO: Implementar paginación
        console.log('📄 Actualizando paginación...');
    }
    
    console.log('✅ Módulo de facturación inicializado correctamente');
});
