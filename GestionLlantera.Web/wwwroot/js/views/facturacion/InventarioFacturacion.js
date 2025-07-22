

// ===== MÓDULO DE INVENTARIO PARA FACTURACIÓN =====

let modalInventarioFacturacion = null;
let productosInventarioCompleto = [];
let filtrosInventarioActivos = {
    busqueda: '',
    categoria: '',
    stock: ''
};

/**
 * Inicializar modal de inventario para facturación
 */
function inicializarModalInventario() {
    console.log('📦 === INICIALIZANDO MODAL INVENTARIO FACTURACIÓN ===');
    
    try {
        const modalElement = document.getElementById('modalInventario');
        if (modalElement) {
            modalInventarioFacturacion = new bootstrap.Modal(modalElement);
            console.log('✅ Modal de inventario inicializado correctamente');
            
            // Configurar eventos del modal
            configurarEventosModalInventario();
        } else {
            console.error('❌ No se encontró el elemento #modalInventario');
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Error inicializando modal inventario:', error);
        return false;
    }
}

/**
 * Configurar eventos del modal de inventario
 */
function configurarEventosModalInventario() {
    console.log('📦 Configurando eventos del modal inventario...');
    
    // Limpiar eventos anteriores
    $('#modalInventario').off('shown.bs.modal');
    $('#modalInventario').off('hidden.bs.modal');
    
    // Evento cuando se muestra el modal
    $('#modalInventario').on('shown.bs.modal', function() {
        console.log('📦 Modal inventario mostrado - cargando productos');
        cargarInventarioCompleto();
    });
    
    // Evento cuando se oculta el modal
    $('#modalInventario').on('hidden.bs.modal', function() {
        console.log('📦 Modal inventario ocultado - limpiando datos');
        limpiarInventarioModal();
    });
    
    // Configurar filtros
    configurarFiltrosInventario();
}

/**
 * Configurar filtros de inventario
 */
function configurarFiltrosInventario() {
    console.log('📦 Configurando filtros de inventario...');
    
    // Búsqueda por texto
    $('#busquedaInventarioModal').off('input').on('input', function() {
        const termino = $(this).val().trim();
        filtrosInventarioActivos.busqueda = termino;
        aplicarFiltrosInventario();
    });
    
    // Filtro por categoría
    $('#categoriaInventarioModal').off('change').on('change', function() {
        filtrosInventarioActivos.categoria = $(this).val();
        aplicarFiltrosInventario();
    });
    
    // Filtro por stock
    $('#stockInventarioModal').off('change').on('change', function() {
        filtrosInventarioActivos.stock = $(this).val();
        aplicarFiltrosInventario();
    });
    
    // Botón de limpiar filtros
    $('#btnLimpiarFiltrosInventario').off('click').on('click', function() {
        limpiarFiltrosInventario();
    });
}

/**
 * Abrir modal de inventario
 */
function consultarInventario() {
    console.log('📦 === ABRIENDO MODAL INVENTARIO ===');
    
    if (!modalInventarioFacturacion) {
        console.log('📦 Modal no inicializado, inicializando...');
        if (!inicializarModalInventario()) {
            console.error('❌ No se pudo inicializar el modal');
            mostrarToast('Error', 'No se pudo abrir el inventario', 'danger');
            return;
        }
    }
    
    try {
        modalInventarioFacturacion.show();
        console.log('📦 Modal mostrado exitosamente');
    } catch (error) {
        console.error('❌ Error mostrando modal:', error);
        mostrarToast('Error', 'No se pudo abrir el inventario', 'danger');
    }
}

/**
 * Cargar inventario completo
 */
async function cargarInventarioCompleto() {
    try {
        console.log('📦 === CARGANDO INVENTARIO COMPLETO ===');
        
        // Mostrar loading
        const loadingElement = $('#inventarioModalLoading');
        const contentElement = $('#inventarioModalContent');
        
        if (loadingElement.length) {
            loadingElement.show();
        }
        if (contentElement.length) {
            contentElement.hide();
        }
        
        console.log('📦 Realizando petición al servidor...');
        
        const response = await fetch('/Facturacion/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Respuesta del servidor:', data);
        
        if (data && data.productos) {
            productosInventarioCompleto = data.productos;
            console.log(`📦 Productos cargados: ${productosInventarioCompleto.length}`);
            mostrarProductosInventario(productosInventarioCompleto);
        } else {
            throw new Error('No se encontraron productos en la respuesta');
        }
        
    } catch (error) {
        console.error('❌ Error cargando inventario:', error);
        mostrarErrorInventario(error.message);
    } finally {
        const loadingElement = $('#inventarioModalLoading');
        if (loadingElement.length) {
            loadingElement.hide();
        }
    }
}

/**
 * Mostrar productos en el modal de inventario
 */
function mostrarProductosInventario(productos) {
    console.log('📦 === MOSTRANDO PRODUCTOS INVENTARIO ===');
    console.log('📦 Productos a mostrar:', productos?.length || 0);
    
    const container = $('#inventarioModalProductos');
    
    if (!container.length) {
        console.error('❌ No se encontró el contenedor #inventarioModalProductos');
        mostrarErrorInventario('Error en la interfaz del modal');
        return;
    }
    
    if (!productos || productos.length === 0) {
        container.html(`
            <div class="col-12 text-center py-4">
                <i class="bi bi-box-seam display-1 text-muted"></i>
                <p class="mt-2 text-muted">No hay productos disponibles</p>
            </div>
        `);
        $('#inventarioModalContent').show();
        return;
    }
    
    let html = '';
    productos.forEach(producto => {
        // Mapear propiedades del producto
        const nombreProducto = producto.nombreProducto || producto.NombreProducto || 'Producto sin nombre';
        const productoId = producto.productoId || producto.ProductoId || 0;
        const precio = producto.precio || producto.Precio || 0;
        const cantidadInventario = producto.cantidadEnInventario || producto.CantidadEnInventario || 0;
        const stockMinimo = producto.stockMinimo || producto.StockMinimo || 0;
        const descripcion = producto.descripcion || producto.Descripcion || '';
        
        // Determinar imagen
        let imagenUrl = '/images/no-image.png';
        try {
            if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
                const primeraImagen = producto.imagenesProductos[0];
                if (primeraImagen && primeraImagen.Urlimagen) {
                    imagenUrl = primeraImagen.Urlimagen.startsWith('http') ? 
                        primeraImagen.Urlimagen : 
                        `https://localhost:7273${primeraImagen.Urlimagen.startsWith('/') ? '' : '/'}${primeraImagen.Urlimagen}`;
                }
            } else if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
                imagenUrl = producto.imagenesUrls[0];
            }
        } catch (error) {
            console.warn('⚠️ Error procesando imagen:', error);
        }
        
        // Calcular precios por método de pago
        const precioEfectivo = precio;
        const precioTarjeta = precio * 1.05;
        
        // Determinar clase de stock
        const stockClase = cantidadInventario <= 0 ? 'border-danger' : 
                          cantidadInventario <= stockMinimo ? 'border-warning' : '';
        
        // Crear objeto producto limpio
        const productoLimpio = {
            productoId: productoId,
            nombreProducto: nombreProducto,
            precio: precio,
            cantidadEnInventario: cantidadInventario,
            stockMinimo: stockMinimo,
            descripcion: descripcion
        };
        
        const productoJson = JSON.stringify(productoLimpio).replace(/"/g, '&quot;');
        
        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 ${stockClase}" data-producto-id="${productoId}">
                    <div class="card-img-container" style="height: 150px; overflow: hidden; position: relative;">
                        <img src="${imagenUrl}" 
                             alt="${nombreProducto}" 
                             class="card-img-top" 
                             style="height: 100%; width: 100%; object-fit: cover;"
                             onerror="this.onerror=null; this.src='/images/no-image.png';">
                        ${cantidadInventario <= 0 ? '<div class="stock-badge badge bg-danger position-absolute top-0 end-0 m-2">Sin Stock</div>' : 
                          cantidadInventario <= stockMinimo ? '<div class="stock-badge badge bg-warning position-absolute top-0 end-0 m-2">Stock Bajo</div>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title text-truncate" title="${nombreProducto}">${nombreProducto}</h6>
                        <p class="card-text small text-muted flex-grow-1" style="font-size: 0.8rem;">
                            ${descripcion ? descripcion.substring(0, 60) + (descripcion.length > 60 ? '...' : '') : 'Sin descripción'}
                        </p>
                        
                        <div class="mb-2">
                            <div class="row text-center">
                                <div class="col-6">
                                    <small class="text-muted d-block">Efectivo</small>
                                    <span class="text-success fw-bold small">₡${formatearMoneda(precioEfectivo)}</span>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Tarjeta</small>
                                    <span class="text-warning fw-bold small">₡${formatearMoneda(precioTarjeta)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-primary fw-bold">Stock: ${cantidadInventario}</small>
                            <small class="text-muted">Mín: ${stockMinimo}</small>
                        </div>
                        
                        <div class="mt-auto">
                            <div class="btn-group w-100" role="group">
                                ${cantidadInventario > 0 ? `
                                    <button type="button" 
                                            class="btn btn-sm btn-primary btn-agregar-desde-inventario"
                                            data-producto="${productoJson}">
                                        <i class="bi bi-cart-plus me-1"></i>Agregar
                                    </button>
                                ` : `
                                    <button type="button" class="btn btn-sm btn-secondary" disabled>
                                        <i class="bi bi-x-circle me-1"></i>Sin Stock
                                    </button>
                                `}
                                <button type="button" 
                                        class="btn btn-sm btn-outline-info btn-ver-detalle-inventario"
                                        data-producto="${productoJson}">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
    
    // Configurar eventos de los botones
    configurarEventosProductosInventario();
    
    $('#inventarioModalContent').show();
    console.log('✅ Productos de inventario mostrados correctamente');
}

/**
 * Configurar eventos de los productos en el inventario
 */
function configurarEventosProductosInventario() {
    console.log('📦 Configurando eventos de productos...');
    
    // Botón agregar producto
    $('.btn-agregar-desde-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));
            
            console.log('📦 Agregando producto desde inventario:', producto.nombreProducto);
            
            // Cerrar modal de inventario
            if (modalInventarioFacturacion) {
                modalInventarioFacturacion.hide();
            }
            
            // Mostrar modal de selección de producto
            setTimeout(() => {
                if (typeof mostrarModalSeleccionProducto === 'function') {
                    mostrarModalSeleccionProducto(producto);
                } else {
                    console.error('❌ Función mostrarModalSeleccionProducto no disponible');
                    mostrarToast('Error', 'No se pudo procesar el producto', 'danger');
                }
            }, 300);
            
        } catch (error) {
            console.error('❌ Error agregando producto desde inventario:', error);
            mostrarToast('Error', 'No se pudo procesar el producto', 'danger');
        }
    });
    
    // Botón ver detalle
    $('.btn-ver-detalle-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));
            
            if (typeof verDetalleProducto === 'function') {
                verDetalleProducto(producto);
            } else {
                console.error('❌ Función verDetalleProducto no disponible');
                mostrarToast('Error', 'No se pudo mostrar el detalle', 'danger');
            }
        } catch (error) {
            console.error('❌ Error mostrando detalle desde inventario:', error);
            mostrarToast('Error', 'No se pudo mostrar el detalle', 'danger');
        }
    });
}

/**
 * Aplicar filtros al inventario
 */
function aplicarFiltrosInventario() {
    if (!productosInventarioCompleto || productosInventarioCompleto.length === 0) {
        return;
    }
    
    let productosFiltrados = [...productosInventarioCompleto];
    
    // Filtro por texto de búsqueda
    if (filtrosInventarioActivos.busqueda) {
        const termino = filtrosInventarioActivos.busqueda.toLowerCase();
        productosFiltrados = productosFiltrados.filter(producto => {
            const nombre = (producto.nombreProducto || '').toLowerCase();
            const descripcion = (producto.descripcion || '').toLowerCase();
            return nombre.includes(termino) || descripcion.includes(termino);
        });
    }
    
    // Filtro por categoría
    if (filtrosInventarioActivos.categoria && filtrosInventarioActivos.categoria !== 'todas') {
        productosFiltrados = productosFiltrados.filter(producto => {
            return (producto.categoria || '').toLowerCase() === filtrosInventarioActivos.categoria.toLowerCase();
        });
    }
    
    // Filtro por stock
    if (filtrosInventarioActivos.stock) {
        switch (filtrosInventarioActivos.stock) {
            case 'disponible':
                productosFiltrados = productosFiltrados.filter(p => (p.cantidadEnInventario || 0) > 0);
                break;
            case 'agotado':
                productosFiltrados = productosFiltrados.filter(p => (p.cantidadEnInventario || 0) === 0);
                break;
            case 'bajo':
                productosFiltrados = productosFiltrados.filter(p => 
                    (p.cantidadEnInventario || 0) > 0 && 
                    (p.cantidadEnInventario || 0) <= (p.stockMinimo || 0)
                );
                break;
        }
    }
    
    console.log(`🔍 Filtros aplicados: ${productosFiltrados.length} de ${productosInventarioCompleto.length} productos`);
    mostrarProductosInventario(productosFiltrados);
}

/**
 * Limpiar filtros de inventario
 */
function limpiarFiltrosInventario() {
    console.log('🧹 Limpiando filtros de inventario');
    
    filtrosInventarioActivos = {
        busqueda: '',
        categoria: '',
        stock: ''
    };
    
    $('#busquedaInventarioModal').val('');
    $('#categoriaInventarioModal').val('todas');
    $('#stockInventarioModal').val('');
    
    mostrarProductosInventario(productosInventarioCompleto);
}

/**
 * Limpiar datos del modal de inventario
 */
function limpiarInventarioModal() {
    console.log('🧹 Limpiando modal de inventario');
    
    $('#inventarioModalProductos').empty();
    productosInventarioCompleto = [];
    limpiarFiltrosInventario();
}

/**
 * Mostrar error en el modal de inventario
 */
function mostrarErrorInventario(mensaje) {
    const contentElement = $('#inventarioModalContent');
    const containerElement = $('#inventarioModalProductos');
    
    if (contentElement.length) {
        contentElement.show();
    }
    
    if (containerElement.length) {
        containerElement.html(`
            <div class="col-12 text-center py-4">
                <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                <p class="mt-2 text-danger">Error cargando inventario</p>
                <p class="text-muted">${mensaje}</p>
                <button class="btn btn-outline-primary" onclick="cargarInventarioCompleto()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
                </button>
            </div>
        `);
    } else {
        console.error('❌ No se encontró contenedor para mostrar error');
    }
}

/**
 * Actualizar vista de productos después de ajuste de stock
 */
async function actualizarVistaProductosPostAjuste() {
    try {
        console.log('📦 === ACTUALIZANDO VISTA POST-AJUSTE ===');
        
        // Solo actualizar si el modal está abierto
        if (modalInventarioFacturacion && $('#modalInventario').hasClass('show')) {
            await cargarInventarioCompleto();
            console.log('✅ Vista de inventario actualizada después del ajuste');
        }
        
        // También actualizar la búsqueda principal si hay productos cargados
        if (typeof cargarProductosIniciales === 'function') {
            // Limpiar estado de búsqueda para forzar actualización
            if (typeof limpiarEstadoBusqueda === 'function') {
                limpiarEstadoBusqueda();
            }
            await cargarProductosIniciales();
            console.log('✅ Vista principal de productos actualizada');
        }
        
    } catch (error) {
        console.error('❌ Error actualizando vista post-ajuste:', error);
    }
}

/**
 * Función auxiliar para formatear moneda
 */
function formatearMoneda(valor) {
    if (typeof valor !== 'number') {
        valor = parseFloat(valor) || 0;
    }
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

/**
 * Función auxiliar para mostrar toast
 */
function mostrarToast(titulo, mensaje, tipo = 'info') {
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(titulo, mensaje, tipo);
    } else {
        console.log(`${tipo.toUpperCase()}: ${titulo} - ${mensaje}`);
        alert(`${titulo}: ${mensaje}`);
    }
}

// ===== EXPORTAR FUNCIONES GLOBALMENTE =====
window.inicializarModalInventario = inicializarModalInventario;
window.consultarInventario = consultarInventario;
window.cargarInventarioCompleto = cargarInventarioCompleto;
window.actualizarVistaProductosPostAjuste = actualizarVistaProductosPostAjuste;

console.log('📦 Módulo InventarioFacturacion.js cargado correctamente');

