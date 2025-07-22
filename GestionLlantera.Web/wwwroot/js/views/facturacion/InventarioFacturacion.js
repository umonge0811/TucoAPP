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
 * Ver detalle de producto desde inventario en facturación
 */
function verDetalleProductoInventario(producto) {
    console.log('👁️ === VER DETALLE PRODUCTO INVENTARIO ===');
    console.log('👁️ Producto:', producto);

    // Usar función de facturación principal
    if (typeof window.verDetalleProducto === 'function') {
        window.verDetalleProducto(producto);
    } else {
        console.error('❌ Función verDetalleProducto no disponible');
        mostrarToast('Error', 'No se puede mostrar el detalle del producto', 'danger');
    }
}

/**
 * ✅ FUNCIÓN: Cargar imágenes en modal de detalles de producto
 * Replicando EXACTAMENTE la lógica de detalleProducto.cshtml que funciona correctamente
 */
async function cargarImagenesDetallesProducto(producto) {
    try {
        console.log('🖼️ === INICIANDO CARGA DE IMÁGENES ===');
        console.log('🖼️ Producto ID:', producto.productoId);
        console.log('🖼️ Producto completo recibido:', producto);

        const contenedor = $('#contenedorImagenesDetalles');

        // Mostrar loading inicial
        contenedor.html(`
            <div id="loadingImagenes" class="text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mb-0">Obteniendo imágenes del servidor...</p>
            </div>
        `);

        // 🔥 PASO 1: OBTENER IMÁGENES DIRECTAMENTE DEL SERVIDOR (como hace detalleProducto.cshtml)
        console.log('🖼️ PASO 1: Consultando endpoint de imágenes...');
        console.log(`🖼️ URL: /Inventario/ObtenerImagenesProducto/${producto.productoId}`);

        const response = await fetch(`/Inventario/ObtenerImagenesProducto/${producto.productoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            },
            credentials: 'include'
        });

        console.log('🖼️ Response status:', response.status);
        console.log('🖼️ Response headers:', response.headers);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const imagenesDelServidor = await response.json();
        console.log('🖼️ PASO 2: Respuesta cruda del servidor:', imagenesDelServidor);
        console.log('🖼️ Tipo de respuesta:', typeof imagenesDelServidor);
        console.log('🖼️ Es array?:', Array.isArray(imagenesDelServidor));

        // 🔥 PASO 3: PROCESAR RESPUESTA IGUAL QUE EN DETALLEPRODUCTO.CSHTML
        let urlsImagenes = [];

        if (imagenesDelServidor) {
            const datosImagenes = imagenesDelServidor;

            // PASO 3A: Si la respuesta es un array, procesarlo
        if (Array.isArray(datosImagenes)) {
            console.log('🖼️ PASO 3A: Procesando array de imágenes...');

            datosImagenes.forEach((imagen, index) => {
                console.log(`🖼️ Imagen ${index}:`, imagen);

                // Intentar extraer la URL de diferentes formas
                let urlExtraida = null;

                if (typeof imagen === 'string') {
                    // Si la imagen es directamente una string URL
                    urlExtraida = imagen;
                } else if (imagen && typeof imagen === 'object') {
                    // Si es un objeto, intentar diferentes propiedades
                    urlExtraida = imagen.url || imagen.UrlCompleta || imagen.urlCompleta || 
                                  imagen.UrlImagen || imagen.urlImagen ||
                                  imagen.nombreArchivo || imagen.NombreArchivo;

                    // Si obtuvimos solo el nombre del archivo, construir la URL completa
                    if (urlExtraida && !urlExtraida.startsWith('http')) {
                        urlExtraida = `https://localhost:7273/uploads/productos/${urlExtraida}`;
                    }
                }

                console.log(`🖼️ URL extraída ${index}:`, urlExtraida);

                if (urlExtraida && typeof urlExtraida === 'string' && urlExtraida.length > 0) {
                    urlsImagenes.push(urlExtraida);
                }
            });
        }
        }

        console.log('🖼️ PASO 4: URLs extraídas del servidor:', urlsImagenes);

        // 🔥 PASO 5: SI NO HAY IMÁGENES DEL SERVIDOR, USAR DATOS LOCALES
        if (urlsImagenes.length === 0) {
            console.log('🖼️ PASO 5: No hay imágenes del servidor, intentando datos locales...');

        // Intentar obtener imágenes de diferentes propiedades del producto
        const propiedadesImagen = ['imagenesProductos', 'imagenes', 'imagenesUrls', 'ImagenesProductos', 'Imagenes', 'ImagenesUrls'];

        for (const propiedad of propiedadesImagen) {
            console.log(`🖼️ Intentando propiedad: ${propiedad}`);
            console.log(`🖼️ Valor de ${propiedad}:`, producto[propiedad]);

            const valorPropiedad = producto[propiedad];

            if (valorPropiedad) {
                if (Array.isArray(valorPropiedad)) {
                    // Si es array, procesarlo
                    valorPropiedad.forEach((imgLocal, index) => {
                        console.log(`🖼️ Imagen local ${index}:`, imgLocal);

                        let urlLocal = null;
                        if (typeof imgLocal === 'string') {
                            urlLocal = imgLocal;
                        } else if (imgLocal && typeof imgLocal === 'object') {
                            urlLocal = imgLocal.url || imgLocal.UrlCompleta || imgLocal.urlCompleta || 
                                      imgLocal.nombreArchivo || imgLocal.NombreArchivo ||
                                      imgLocal.UrlImagen || imgLocal.urlImagen;
                        }

                        // Construir URL completa si es necesario
                        if (urlLocal && typeof urlLocal === 'string') {
                            if (!urlLocal.startsWith('http')) {
                                urlLocal = `https://localhost:7273/uploads/productos/${urlLocal}`;
                            }
                            urlsImagenes.push(urlLocal);
                            console.log(`🖼️ URL local agregada: ${urlLocal}`);
                        }
                    });
                } else if (typeof valorPropiedad === 'string') {
                    // Si es string directo
                    let urlLocal = valorPropiedad;
                    if (!urlLocal.startsWith('http')) {
                        urlLocal = `https://localhost:7273/uploads/productos/${urlLocal}`;
                    }
                    urlsImagenes.push(urlLocal);
                    console.log(`🖼️ URL string local agregada: ${urlLocal}`);
                }

                if (urlsImagenes.length > 0) {
                    console.log(`🖼️ Encontradas ${urlsImagenes.length} imágenes en propiedad: ${propiedad}`);
                    break; // Si encontramos imágenes, salir del bucle
                }
            }
        }
        } else {
            console.log('🖼️ PASO 5: Usando imágenes del servidor, saltando datos locales');
        }

        console.log('🖼️ PASO 6: Array final de URLs de imágenes:', urlsImagenes);
        console.log('🖼️ PASO 6: Cantidad de imágenes encontradas:', urlsImagenes.length);

        // PASO 7: Construir el carrusel
        if (urlsImagenes.length > 0) {
            console.log('🖼️ PASO 7A: Construyendo carrusel con imágenes...');
            console.log('🖼️ PASO 7A: URLs a usar en carrusel:', urlsImagenes);

            let indicadoresHtml = '';
            let slidesHtml = '';

            urlsImagenes.forEach((url, index) => {
                const activeClass = index === 0 ? 'active' : '';
                const ariaCurrent = index === 0 ? 'aria-current="true"' : '';

                console.log(`🖼️ PASO 7A: Procesando imagen ${index + 1}: ${url}`);

                indicadoresHtml += `
                    <button type="button" data-bs-target="#carruselImagenesDetalle" 
                            data-bs-slide-to="${index}" class="${activeClass}" 
                            ${ariaCurrent} aria-label="Slide ${index + 1}"></button>
                `;

                slidesHtml += `
                    <div class="carousel-item ${activeClass}">
                        <img src="${url}" class="d-block w-100 imagen-producto-detalle" 
                             alt="Imagen ${index + 1}" 
                             style="max-height: 300px; object-fit: contain; background-color: white;"
                             onerror="this.onerror=null; this.src='/images/no-image.png'; console.error('❌ Error cargando imagen: ${url}');"
                             onload="console.log('✅ Imagen cargada exitosamente: ${url}');">
                    </div>
                `;
            });

            const carruselHtml = `
                <div id="carruselImagenesDetalle" class="carousel slide" data-bs-ride="false">
                    ${urlsImagenes.length > 1 ? `
                        <div class="carousel-indicators">
                            ${indicadoresHtml}
                        </div>
                    ` : ''}
                    <div class="carousel-inner">
                        ${slidesHtml}
                    </div>
                    ${urlsImagenes.length > 1 ? `
                        <button class="carousel-control-prev" type="button" data-bs-target="#carruselImagenesDetalle" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#carruselImagenesDetalle" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Siguiente</span>
                        </button>
                    ` : ''}
                </div>
            `;

            console.log('🖼️ PASO 7A: Insertando carrusel en el DOM...');
            
            // Ocultar el loading primero
            contenedor.find('#loadingImagenes').remove();
            
            // Insertar el carrusel
            contenedor.html(carruselHtml);
            
            // Asegurar que el carrusel sea visible
            contenedor.show();
            
            console.log('🖼️ PASO 7A: Carrusel construido e insertado exitosamente');
            console.log('🖼️ PASO 7A: HTML del carrusel:', carruselHtml);
            
            // Verificar que el carrusel esté en el DOM
            setTimeout(() => {
                const carruselEnDom = $('#carruselImagenesDetalle');
                console.log('🖼️ VERIFICACIÓN: Carrusel en DOM:', carruselEnDom.length > 0);
                if (carruselEnDom.length === 0) {
                    console.error('❌ El carrusel no se insertó correctamente en el DOM');
                }
            }, 100);
        } else {
            console.log('⚠️ PASO 7B: No hay imágenes disponibles');
            
            // Ocultar loading
            contenedor.find('#loadingImagenes').remove();
            
            // Mostrar mensaje sin imágenes
            contenedor.html(`
                <div class="text-center text-muted py-4">
                    <i class="bi bi-image fs-1"></i>
                    <p class="mt-2">Sin imágenes disponibles</p>
                </div>
            `);
            
            // Asegurar visibilidad
            contenedor.show();
        }

    } catch (error) {
        console.error('❌ ERROR CRÍTICO cargando imágenes:', error);
        console.error('❌ Stack trace:', error.stack);

        // Ocultar loading
        contenedor.find('#loadingImagenes').remove();

        // Mostrar error
        contenedor.html(`
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
                <p class="mb-1"><strong>Error cargando imágenes</strong></p>
                <small class="text-muted">${error.message}</small>
            </div>
        `);
        
        // Asegurar visibilidad
        contenedor.show();
    }
}

/**
 * ✅ FUNCIÓN AUXILIAR: Construir URL de imagen completa
 * Replicando exactamente como se construyen las URLs en detalleProducto.cshtml
 */
function construirUrlImagenCompleta(urlOriginal) {
    console.log('🔗 Construyendo URL para:', urlOriginal);

    if (!urlOriginal || urlOriginal.trim() === '') {
        console.log('🔗 URL vacía, usando imagen por defecto');
        return '/images/no-image.png';
    }

    const url = urlOriginal.trim();
    console.log('🔗 URL limpia:', url);

    // Si ya es una URL completa, usarla directamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('🔗 URL completa detectada:', url);
        return url;
    }

    // Construir URL para el servidor API (igual que funciona en detalleProducto.cshtml)
    let urlCompleta;
    if (url.startsWith('/uploads/productos/')) {
        urlCompleta = `https://localhost:7273${url}`;
    } else if (url.startsWith('uploads/productos/')) {
        urlCompleta = `https://localhost:7273/${url}`;
    } else if (url.startsWith('/')) {
        urlCompleta = `https://localhost:7273${url}`;
    } else {
        urlCompleta = `https://localhost:7273/uploads/productos/${url}`;
    }

    console.log('🔗 URL construida:', urlCompleta);
    return urlCompleta;
}

// Exportar funciones al objeto global para que facturacion.js pueda usarlas
window.cargarImagenesDetallesProducto = cargarImagenesDetallesProducto;
window.construirUrlImagen = construirUrlImagen;

/**
 * Mostrar detalles del producto en modal mejorado con carrusel de imágenes
 * Versión completa adaptada para el contexto de facturación
 */
function verDetalleProducto(producto) {
    console.log('👁️ === MOSTRANDO DETALLE PRODUCTO ===');
    console.log('👁️ Producto:', producto);

    try {
        // Mapear propiedades del producto
        const nombreProducto = producto.nombreProducto || producto.NombreProducto || 'Producto sin nombre';
        const productoId = producto.productoId || producto.ProductoId || 0;
        const precio = producto.precio || producto.Precio || 0;
        const cantidadInventario = producto.cantidadEnInventario || producto.CantidadEnInventario || 0;
        const stockMinimo = producto.stockMinimo || producto.StockMinimo || 0;
        const descripcion = producto.descripcion || producto.Descripcion || '';

        // Determinar si es llanta y extraer medidas
        let esLlanta = false;
        let infoLlanta = null;

        try {
            if (producto.llanta || (producto.Llanta && producto.Llanta.length > 0)) {
                esLlanta = true;
                const llantaInfo = producto.llanta || producto.Llanta[0];

                if (llantaInfo && llantaInfo.ancho && llantaInfo.diametro) {
                    let medidaCompleta = '';
                    if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                        medidaCompleta = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                    } else {
                        medidaCompleta = `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                    }

                    infoLlanta = {
                        medida: medidaCompleta,
                        marca: llantaInfo.marca || 'N/A',
                        modelo: llantaInfo.modelo || 'N/A',
                        ancho: llantaInfo.ancho || 'N/A',
                        perfil: llantaInfo.perfil || 'N/A',
                        diametro: llantaInfo.diametro || 'N/A',
                        indiceVelocidad: llantaInfo.indiceVelocidad || 'N/A',
                        capas: llantaInfo.capas || 'N/A',
                        tipoTerreno: llantaInfo.tipoTerreno || 'N/A'
                    };
                }
            }
        } catch (error) {
            console.warn('⚠️ Error procesando información de llanta para detalle:', error);
        }

        // Calcular precios por método de pago usando CONFIGURACION_PRECIOS del archivo principal
        let preciosHtml = '';
        if (typeof CONFIGURACION_PRECIOS !== 'undefined') {
            preciosHtml = Object.entries(CONFIGURACION_PRECIOS).map(([metodo, config]) => {
                const precioCalculado = precio * config.multiplicador;
                return `
                    <tr>
                        <td>
                            <i class="bi ${config.icono} me-2"></i>
                            ${config.nombre}
                            ${metodo === 'tarjeta' ? '<span class="text-muted">(+5%)</span>' : ''}
                        </td>
                        <td class="text-end fw-bold">₡${formatearMoneda(precioCalculado)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            // Fallback básico
            const precioEfectivo = precio;
            const precioTarjeta = precio * 1.05;
            preciosHtml = `
                <tr>
                    <td><i class="bi bi-cash me-2"></i>Efectivo/SINPE</td>
                    <td class="text-end fw-bold text-success">₡${formatearMoneda(precioEfectivo)}</td>
                </tr>
                <tr>
                    <td><i class="bi bi-credit-card me-2"></i>Tarjeta <span class="text-muted">(+5%)</span></td>
                    <td class="text-end fw-bold text-warning">₡${formatearMoneda(precioTarjeta)}</td>
                </tr>
            `;
        }

        // Construir HTML del modal con sección de imágenes
        const modalHtml = `
            <div class="modal fade" id="modalDetalleProductoInventario" tabindex="-1" aria-labelledby="modalDetalleProductoInventarioLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="modalDetalleProductoInventarioLabel">
                                <i class="bi bi-info-circle me-2"></i>Detalle del Producto
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Sección de imágenes -->
                                <div class="col-md-5 mb-3">
                                    <h6 class="text-primary mb-3">
                                        <i class="bi bi-images me-2"></i>Imágenes del Producto
                                    </h6>
                                    <div id="contenedorImagenesDetalles" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
                                        <!-- El contenido se cargará dinámicamente -->
                                    </div>
                                </div>

                                <!-- Información del producto -->
                                <div class="col-md-7 mb-3">
                                    <div class="card">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">
                                                <i class="bi bi-box-seam me-2"></i>${nombreProducto}
                                                <small class="text-muted ms-2">ID: ${productoId}</small>
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <!-- Precios -->
                                            <div class="mb-3">
                                                <h6 class="text-primary">💰 Precios por método de pago</h6>
                                                <div class="table-responsive">
                                                    <table class="table table-sm table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>Método de Pago</th>
                                                                <th class="text-end">Precio</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${preciosHtml}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <!-- Inventario -->
                                            <div class="mb-3">
                                                <h6 class="text-primary">📦 Información de Stock</h6>
                                                <div class="alert ${cantidadInventario <= 0 ? 'alert-danger' : 
                                                    cantidadInventario <= stockMinimo ? 'alert-warning' : 'alert-success'}">
                                                    <div class="row text-center">
                                                        <div class="col-4">
                                                            <i class="bi bi-box-seam display-6"></i>
                                                            <h5 class="mt-2">${cantidadInventario}</h5>
                                                            <small>Stock Actual</small>
                                                        </div>
                                                        <div class="col-4">
                                                            <i class="bi bi-exclamation-triangle display-6"></i>
                                                            <h5 class="mt-2">${stockMinimo}</h5>
                                                            <small>Stock Mínimo</small>
                                                        </div>
                                                        <div class="col-4">
                                                            <i class="bi bi-check-circle display-6"></i>
                                                            <h5 class="mt-2">
                                                                ${cantidadInventario <= 0 ? 
                                                                    '<span class="badge bg-danger">Sin Stock</span>' :
                                                                    cantidadInventario <= stockMinimo ?
                                                                        '<span class="badge bg-warning text-dark">Stock Bajo</span>' :
                                                                        '<span class="badge bg-success">Disponible</span>'
                                                                }
                                                            </h5>
                                                            <small>Estado</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Descripción -->
                            ${descripcion ? `
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <h6 class="text-primary">📝 Descripción</h6>
                                        <p class="text-muted">${descripcion}</p>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Información de llanta -->
                            ${esLlanta && infoLlanta ? `
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <h6 class="text-primary">
                                            <i class="bi bi-circle me-2"></i>Especificaciones de Llanta
                                        </h6>
                                        <div class="card bg-light">
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <div class="table-responsive">
                                                            <table class="table table-sm table-borderless mb-0">
                                                                <tbody>
                                                                    <tr>
                                                                        <td><strong>Medida:</strong></td>
                                                                        <td class="text-primary fw-bold">${infoLlanta.medida}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Marca:</strong></td>
                                                                        <td>${infoLlanta.marca}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Modelo:</strong></td>
                                                                        <td>${infoLlanta.modelo}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div class="table-responsive">
                                                            <table class="table table-sm table-borderless mb-0">
                                                                <tbody>
                                                                    <tr>
                                                                        <td><strong>Índice Velocidad:</strong></td>
                                                                        <td>${infoLlanta.indiceVelocidad}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Capas:</strong></td>
                                                                        <td>${infoLlanta.capas}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Tipo Terreno:</strong></td>
                                                                        <td>${infoLlanta.tipoTerreno}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cerrar
                            </button>
                            ${cantidadInventario > 0 ? `
                                <button type="button" class="btn btn-primary" onclick="agregarProductoDesdeDetalle('${JSON.stringify(producto).replace(/'/g, "\\'")}')">
                                    <i class="bi bi-cart-plus me-1"></i>Agregar al Carrito
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        $('#modalDetalleProductoInventario').remove();

        // Agregar nuevo modal al body
        $('body').append(modalHtml);

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleProductoInventario'));
        modal.show();

        // Cargar imágenes después de mostrar el modal
        cargarImagenesDetallesProducto(producto);

        console.log('✅ Modal de detalle mostrado correctamente con carrusel de imágenes');

    } catch (error) {
        console.error('❌ Error mostrando detalle del producto:', error);
        mostrarToast('Error', 'No se pudo mostrar el detalle del producto', 'danger');
    }
}

/**
 * Agregar producto al carrito desde el modal de detalle
 */
function agregarProductoDesdeDetalle(productoJson) {
    try {
        console.log('🛒 Agregando producto desde detalle...');

        const producto = typeof productoJson === 'string' ? JSON.parse(productoJson) : productoJson;

        // Cerrar modal de detalle
        $('#modalDetalleProductoInventario').modal('hide');

        // Mostrar modal de selección de producto después de un pequeño delay
        setTimeout(() => {
            if (typeof mostrarModalSeleccionProducto === 'function') {
                mostrarModalSeleccionProducto(producto);
            } else {
                console.error('❌ Función mostrarModalSeleccionProducto no disponible');
                mostrarToast('Error', 'No se pudo procesar el producto', 'danger');
            }
        }, 300);

    } catch (error) {
        console.error('❌ Error agregando producto desde detalle:', error);
        mostrarToast('Error', 'No se pudo procesar el producto', 'danger');
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
window.verDetalleProducto = verDetalleProducto;
window.agregarProductoDesdeDetalle = agregarProductoDesdeDetalle;

console.log('📦 Módulo InventarioFacturacion.js cargado correctamente');