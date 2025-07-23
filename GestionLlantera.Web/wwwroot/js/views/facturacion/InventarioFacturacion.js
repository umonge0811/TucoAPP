

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
    
    const tbody = $('#inventarioModalProductos');
    
    if (!tbody.length) {
        console.error('❌ No se encontró el tbody #inventarioModalProductos');
        mostrarErrorInventario('Error en la interfaz del modal');
        return;
    }
    
    if (!productos || productos.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-box-seam display-1 text-muted"></i>
                    <p class="mt-2 text-muted">No hay productos disponibles</p>
                </td>
            </tr>
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
        
        // Determinar si es llanta y extraer medidas
        let esLlanta = false;
        let medidaLlanta = 'N/A';
        let medidaParaBusqueda = 'n/a';
        
        try {
            if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                esLlanta = true;
                const llantaInfo = producto.llanta || producto.Llanta[0];
                
                if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                    if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                        medidaLlanta = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                        // Crear múltiples formatos para búsqueda
                        medidaParaBusqueda = `${medidaLlanta} ${llantaInfo.ancho}/${llantaInfo.perfil} ${llantaInfo.ancho}x${llantaInfo.perfil}x${llantaInfo.diametro} ${llantaInfo.ancho} ${llantaInfo.perfil} ${llantaInfo.diametro}`.toLowerCase();
                    } else {
                        medidaLlanta = `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                        // Crear múltiples formatos para búsqueda
                        medidaParaBusqueda = `${medidaLlanta} ${llantaInfo.ancho} R${llantaInfo.diametro} ${llantaInfo.diametro}`.toLowerCase();
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Error procesando información de llanta:', error);
        }
        
        // Calcular precios por método de pago
        const precioEfectivo = precio;
        const precioTarjeta = precio * 1.05;
        
        // Determinar clases de fila según stock
        let rowClass = '';
        let stockBadge = '';
        if (cantidadInventario <= 0) {
            rowClass = 'table-danger';
            stockBadge = '<span class="badge bg-danger">Sin Stock</span>';
        } else if (cantidadInventario <= stockMinimo) {
            rowClass = 'table-warning';
            stockBadge = '<span class="badge bg-warning text-dark">Stock Bajo</span>';
        } else {
            stockBadge = '<span class="badge bg-success">Disponible</span>';
        }
        
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
            <tr class="${rowClass}" 
                data-producto-id="${productoId}"
                data-nombre="${nombreProducto.toLowerCase()}"
                data-descripcion="${descripcion.toLowerCase()}"
                data-stock="${cantidadInventario}"
                data-precio-efectivo="${precioEfectivo}"
                data-precio-tarjeta="${precioTarjeta}"
                data-medida="${medidaParaBusqueda}">
                <td>
                    <strong class="d-block">${nombreProducto}</strong>
                    <small class="text-muted">ID: ${productoId}</small>
                    ${esLlanta ? '<span class="badge bg-primary mt-1">Llanta</span>' : ''}
                </td>
                <td class="text-center">
                    ${esLlanta ? `<span class="fw-bold text-primary">${medidaLlanta}</span>` : '<span class="text-muted">N/A</span>'}
                </td>
                <td>
                    <span class="text-muted" title="${descripcion}">
                        ${descripcion ? (descripcion.length > 50 ? descripcion.substring(0, 50) + '...' : descripcion) : 'Sin descripción'}
                    </span>
                </td>
                <td class="text-center">
                    <div class="d-flex flex-column align-items-center">
                        <strong class="text-primary">${cantidadInventario}</strong>
                        <small class="text-muted">Mín: ${stockMinimo}</small>
                        ${stockBadge}
                    </div>
                </td>
                <td class="text-end">
                    <span class="text-success fw-bold">₡${formatearMoneda(precioEfectivo)}</span>
                </td>
                <td class="text-end">
                    <span class="text-warning fw-bold">₡${formatearMoneda(precioTarjeta)}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group-vertical btn-group-sm">
                        ${cantidadInventario > 0 ? `
                            <button type="button" 
                                    class="btn btn-primary btn-sm btn-agregar-desde-inventario mb-1"
                                    data-producto="${productoJson}"
                                    title="Agregar al carrito">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        ` : `
                            <button type="button" 
                                    class="btn btn-secondary btn-sm mb-1" 
                                    disabled
                                    title="Sin stock disponible">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `}
                        <button type="button" 
                                class="btn btn-outline-info btn-sm btn-ver-detalle-inventario"
                                data-producto="${productoJson}"
                                title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.html(html);
    
    // Configurar eventos de los botones
    configurarEventosProductosInventario();
    
    // Configurar ordenamiento de tabla
    configurarOrdenamientoTablaInventario();
    
    $('#inventarioModalContent').show();
    console.log('✅ Productos de inventario mostrados correctamente en formato tabla');
}

/**
 * Configurar ordenamiento de la tabla de inventario
 */
function configurarOrdenamientoTablaInventario() {
    console.log('📦 Configurando ordenamiento de tabla...');
    
    $('.sortable').off('click').on('click', function() {
        const column = $(this).data('column');
        const $table = $('#tablaInventarioModal');
        const $tbody = $table.find('tbody');
        const rows = $tbody.find('tr').toArray();
        
        // Determinar dirección de ordenamiento
        let ascending = true;
        if ($(this).hasClass('sorted-asc')) {
            ascending = false;
            $(this).removeClass('sorted-asc').addClass('sorted-desc');
        } else {
            $(this).removeClass('sorted-desc').addClass('sorted-asc');
            ascending = true;
        }
        
        // Limpiar iconos de otras columnas
        $('.sortable').not(this).removeClass('sorted-asc sorted-desc');
        
        // Actualizar icono
        $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');
        $(this).find('i').removeClass('bi-arrow-down-up').addClass(ascending ? 'bi-arrow-up' : 'bi-arrow-down');
        
        // Ordenar filas
        rows.sort(function(a, b) {
            let aVal, bVal;
            
            switch(column) {
                case 'nombre':
                    aVal = $(a).data('nombre');
                    bVal = $(b).data('nombre');
                    break;
                case 'medida':
                    aVal = $(a).data('medida');
                    bVal = $(b).data('medida');
                    break;
                case 'descripcion':
                    aVal = $(a).data('descripcion');
                    bVal = $(b).data('descripcion');
                    break;
                case 'stock':
                    aVal = parseInt($(a).data('stock')) || 0;
                    bVal = parseInt($(b).data('stock')) || 0;
                    break;
                case 'precioEfectivo':
                    aVal = parseFloat($(a).data('precio-efectivo')) || 0;
                    bVal = parseFloat($(b).data('precio-efectivo')) || 0;
                    break;
                case 'precioTarjeta':
                    aVal = parseFloat($(a).data('precio-tarjeta')) || 0;
                    bVal = parseFloat($(b).data('precio-tarjeta')) || 0;
                    break;
                default:
                    return 0;
            }
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
                return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return ascending ? aVal - bVal : bVal - aVal;
            }
        });
        
        // Reordenar filas en el DOM
        $tbody.empty().append(rows);
        
        console.log(`📦 Tabla ordenada por ${column} (${ascending ? 'ascendente' : 'descendente'})`);
    });
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
    
    // Botón ver detalle - Abrir modal de detalles existente
    $('.btn-ver-detalle-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));
            
            console.log('👁️ Abriendo modal de detalles para producto:', producto.nombreProducto);
            
            // Usar la función existente de verDetalleProducto
            if (typeof verDetalleProducto === 'function') {
                verDetalleProducto(producto);
            } else {
                console.error('❌ Función verDetalleProducto no disponible');
                mostrarToast('Error', 'No se pudo abrir el modal de detalles', 'danger');
            }
            
        } catch (error) {
            console.error('❌ Error abriendo modal de detalles desde inventario:', error);
            mostrarToast('Error', 'No se pudo abrir el modal de detalles', 'danger');
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
            
            // Buscar también en medidas de llantas
            let medidaTexto = '';
            try {
                if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                    const llantaInfo = producto.llanta || producto.Llanta[0];
                    
                    if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                        if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                            medidaTexto = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`.toLowerCase();
                        } else {
                            medidaTexto = `${llantaInfo.ancho}/R${llantaInfo.diametro}`.toLowerCase();
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error procesando medida para filtro:', error);
            }
            
            return nombre.includes(termino) || 
                   descripcion.includes(termino) || 
                   medidaTexto.includes(termino);
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
    
    // Limpiar ordenamiento
    $('.sortable').removeClass('sorted-asc sorted-desc');
    $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');
    
    limpiarFiltrosInventario();
}

/**
 * Mostrar error en el modal de inventario
 */
function mostrarErrorInventario(mensaje) {
    const contentElement = $('#inventarioModalContent');
    const tbody = $('#inventarioModalProductos');
    
    if (contentElement.length) {
        contentElement.show();
    }
    
    if (tbody.length) {
        tbody.html(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                    <p class="mt-2 text-danger">Error cargando inventario</p>
                    <p class="text-muted">${mensaje}</p>
                    <button class="btn btn-outline-primary" onclick="cargarInventarioCompleto()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
                    </button>
                </td>
            </tr>
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
 * ✅ FUNCIÓN AUXILIAR: Construir URL de imagen correcta
 */
function construirUrlImagen(urlOriginal) {
    if (!urlOriginal || urlOriginal.trim() === '') {
        return '/images/no-image.png';
    }

    const url = urlOriginal.trim();

    // Si ya es una URL completa, usarla directamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Construir URL para el servidor API
    if (url.startsWith('/uploads/productos/')) {
        return `https://localhost:7273${url}`;
    } else if (url.startsWith('uploads/productos/')) {
        return `https://localhost:7273/${url}`;
    } else if (url.startsWith('/')) {
        return `https://localhost:7273${url}`;
    } else {
        return `https://localhost:7273/${url}`;
    }
}







/**
 * ✅ FUNCIÓN: Ver detalle de producto (específica para modal de inventario)
 */
function verDetalleProducto(producto) {
    console.log('👁️ Ver detalle del producto desde inventario:', producto);

    // Validación robusta para imágenes con URL de la API
    let imagenUrl = '/images/no-image.png';
    try {
        console.log('🖼️ Procesando imágenes para detalle de producto:', producto.nombreProducto);
        console.log('🖼️ Datos del producto completos:', producto);

        let imagenesArray = [];

        // Usar múltiples fuentes de imágenes como fallback
        if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
            imagenesArray = producto.imagenesProductos
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
            console.log('🖼️ Imágenes desde imagenesProductos:', imagenesArray);
        } else if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
            imagenesArray = producto.imagenesUrls.filter(url => url && url.trim() !== '');
            console.log('🖼️ Imágenes desde imagenesUrls:', imagenesArray);
        } else if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
            imagenesArray = producto.imagenes
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
            console.log('🖼️ Imágenes desde imagenes:', imagenesArray);
        }

        if (imagenesArray.length > 0) {
            let urlImagen = imagenesArray[0];
            console.log('🖼️ URL original en detalle:', urlImagen);

            if (urlImagen && urlImagen.trim() !== '') {
                // Construir URL correcta para el servidor API
                if (urlImagen.startsWith('/uploads/productos/')) {
                    imagenUrl = `https://localhost:7273${urlImagen}`;
                } else if (urlImagen.startsWith('uploads/productos/')) {
                    imagenUrl = `https://localhost:7273/${urlImagen}`;
                } else if (urlImagen.startsWith('http://') || urlImagen.startsWith('https://')) {
                    imagenUrl = urlImagen; // URL completa
                } else if (urlImagen.startsWith('/')) {
                    imagenUrl = `https://localhost:7273${urlImagen}`;
                } else {
                    imagenUrl = `https://localhost:7273/${urlImagen}`;
                }
                console.log('🖼️ URL final en detalle:', imagenUrl);
            }
        } else {
            console.log('🖼️ No se encontraron imágenes válidas para detalle');
        }
    } catch (error) {
        console.warn('⚠️ Error procesando imágenes en detalle del producto:', error);
        imagenUrl = '/images/no-image.png';
    }

    const modalHtml = `
        <div class="modal fade" id="modalDetalleProductoInventario" tabindex="-1">
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
                                <div id="contenedorImagenesDetallesInventario">
                                    <img src="${imagenUrl}" 
                                         class="img-fluid rounded shadow-sm" 
                                         alt="${producto.nombreProducto}"
                                         onerror="this.onerror=null; this.src='/images/no-image.png';"">
                                </div>

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
                                                <tr>
                                                    <td><i class="bi bi-cash me-2"></i>Efectivo/SINPE</td>
                                                    <td class="text-end fw-bold">₡${formatearMoneda(producto.precio || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td><i class="bi bi-credit-card me-2"></i>Tarjeta <span class="text-muted">(+5%)</span></td>
                                                    <td class="text-end fw-bold">₡${formatearMoneda((producto.precio || 0) * 1.05)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Información del sistema -->
                                <div class="text-muted small">
                                    <p class="mb-1"><strong>ID:</strong> ${producto.productoId}</p>
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
    $('#modalDetalleProductoInventario').remove();
    $('body').append(modalHtml);

    const modal = new bootstrap.Modal(document.getElementById('modalDetalleProductoInventario'));
    
    // Cargar imágenes después de mostrar el modal
    setTimeout(() => {
        cargarImagenesDetallesProductoInventario(producto);
    }, 100);
    
    modal.show();
}

/**
 * ✅ FUNCIÓN: Cargar imágenes en modal de detalles de producto (inventario)
 */
async function cargarImagenesDetallesProductoInventario(producto) {
    try {
        console.log('🖼️ === CARGANDO IMÁGENES EN MODAL DE DETALLES INVENTARIO ===');
        console.log('🖼️ Producto:', producto.nombreProducto);
        console.log('🖼️ Datos del producto:', producto);

        const contenedor = $('#contenedorImagenesDetallesInventario');
        
        // Mostrar loading inicial
        contenedor.html(`
            <div class="text-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                Cargando imágenes...
            </div>
        `);

        let imagenesArray = [];

        // Usar la misma lógica que en otros modales para obtener imágenes
        if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
            imagenesArray = producto.imagenesProductos
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
        } else if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
            imagenesArray = producto.imagenesUrls.filter(url => url && url.trim() !== '');
        } else if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
            imagenesArray = producto.imagenes
                .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                .filter(url => url && url.trim() !== '');
        }

        console.log('🖼️ Imágenes encontradas:', imagenesArray.length);

        if (imagenesArray.length === 0) {
            // No hay imágenes
            contenedor.html(`
                <div class="sin-imagenes text-center p-4">
                    <i class="bi bi-image-fill display-1 text-muted"></i>
                    <p class="text-muted mt-2">No hay imágenes disponibles</p>
                </div>
            `);
            return;
        }

        if (imagenesArray.length === 1) {
            // Una sola imagen
            const urlImagen = construirUrlImagen(imagenesArray[0]);
            contenedor.html(`
                <img src="${urlImagen}" 
                     class="img-fluid rounded shadow-sm w-100" 
                     alt="${producto.nombreProducto}"
                     style="max-height: 300px; object-fit: contain;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes text-center p-4\\'><i class=\\'bi bi-image-fill display-1 text-muted\\'></i><p class=\\'text-muted mt-2\\'>Error cargando imagen</p></div>';">
            `);
        } else {
            // Múltiples imágenes - crear carrusel
            const carruselId = 'carruselImagenesDetallesInventario';
            let htmlCarrusel = `
                <div id="${carruselId}" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">
            `;

            imagenesArray.forEach((url, index) => {
                const urlImagen = construirUrlImagen(url);
                const activa = index === 0 ? 'active' : '';
                htmlCarrusel += `
                    <div class="carousel-item ${activa}">
                        <img src="${urlImagen}" 
                             class="img-fluid rounded shadow-sm w-100" 
                             alt="${producto.nombreProducto}"
                             style="max-height: 300px; object-fit: contain;"
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes text-center p-4\\'><i class=\\'bi bi-image-fill display-1 text-muted\\'></i><p class=\\'text-muted mt-2\\'>Error cargando imagen</p></div>';">
                    </div>
                `;
            });

            htmlCarrusel += `
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#${carruselId}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Anterior</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#${carruselId}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Siguiente</span>
                    </button>
                    <div class="carousel-indicators">
            `;

            imagenesArray.forEach((_, index) => {
                const activa = index === 0 ? 'active' : '';
                htmlCarrusel += `
                    <button type="button" data-bs-target="#${carruselId}" data-bs-slide-to="${index}" ${activa ? 'class="active" aria-current="true"' : ''}></button>
                `;
            });

            htmlCarrusel += `
                    </div>
                </div>
            `;

            contenedor.html(htmlCarrusel);
        }

        console.log('✅ Imágenes cargadas exitosamente en modal de detalles inventario');

    } catch (error) {
        console.error('❌ Error cargando imágenes en modal de detalles inventario:', error);
        $('#contenedorImagenesDetallesInventario').html(`
            <div class="sin-imagenes text-center p-4">
                <i class="bi bi-exclamation-triangle-fill display-1 text-danger"></i>
                <p class="text-danger mt-2">Error cargando imágenes</p>
            </div>
        `);
    }
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

