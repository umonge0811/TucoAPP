
// ===== FACTURACIÓN - JAVASCRIPT PRINCIPAL =====

let productosEnVenta = [];
let modalInventario = null;

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
    // Inicializar modal de inventario si existe
    const modalInventarioElement = document.getElementById('modalInventario');
    if (modalInventarioElement) {
        modalInventario = new bootstrap.Modal(modalInventarioElement);
    }
}

function configurarEventos() {
    // Configurar formularios
    configurarFormularios();
    
    // Configurar botones
    configurarBotones();
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
