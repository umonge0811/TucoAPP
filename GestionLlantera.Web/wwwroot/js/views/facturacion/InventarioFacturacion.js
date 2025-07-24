// ===== MÓDULO DE INVENTARIO PARA FACTURACIÓN =====

let modalInventarioFacturacion = null;
let productosInventarioCompleto = [];
let productosFiltrados = [];
let filtrosInventarioActivos = {
    busqueda: '',
    categoria: '',
    stock: ''
};

// Variables de paginación
let paginacionConfig = {
    paginaActual: 1,
    productosPorPagina: 20,
    totalPaginas: 1,
    totalProductos: 0
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
 * Mostrar productos en el modal de inventario con paginación
 */
function mostrarProductosInventario(productos) {
    console.log('📦 === MOSTRANDO PRODUCTOS INVENTARIO CON PAGINACIÓN ===');
    console.log('📦 Productos totales:', productos?.length || 0);

    const tbody = $('#inventarioModalProductos');

    if (!tbody.length) {
        console.error('❌ No se encontró el tbody #inventarioModalProductos');
        mostrarErrorInventario('Error en la interfaz del modal');
        return;
    }

    if (!productos || productos.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-box-seam display-1 text-muted"></i>
                    <p class="mt-2 text-muted">No hay productos disponibles</p>
                </td>
            </tr>
        `);
        actualizarInfoPaginacion(0, 0);
        ocultarControlsPaginacion();
        $('#inventarioModalContent').show();
        return;
    }

    // Actualizar productos filtrados globalmente
    productosFiltrados = productos;
    
    // Calcular paginación
    paginacionConfig.totalProductos = productos.length;
    paginacionConfig.totalPaginas = Math.ceil(productos.length / paginacionConfig.productosPorPagina);
    
    // Validar página actual
    if (paginacionConfig.paginaActual > paginacionConfig.totalPaginas) {
        paginacionConfig.paginaActual = 1;
    }

    // Obtener productos de la página actual
    const inicio = (paginacionConfig.paginaActual - 1) * paginacionConfig.productosPorPagina;
    const fin = inicio + paginacionConfig.productosPorPagina;
    const productosPagina = productos.slice(inicio, fin);

    console.log(`📦 Mostrando página ${paginacionConfig.paginaActual} de ${paginacionConfig.totalPaginas}`);
    console.log(`📦 Productos en esta página: ${productosPagina.length}`);

    // Generar HTML solo para los productos de la página actual
    generarHTMLProductos(productosPagina, tbody);
    
    // Actualizar controles de paginación
    actualizarControlsPaginacion();
    actualizarInfoPaginacion(productosPagina.length, productos.length);

    $('#inventarioModalContent').show();
    console.log('✅ Productos de inventario mostrados con paginación');
}

/**
 * Generar HTML de productos
 */
function generarHTMLProductos(productos, tbody) {

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

        // OBJETO PRODUCTO LIMPIO EXACTAMENTE IGUAL AL INDEX DE FACTURACIÓN
        const productoLimpio = {
            productoId: productoId,
            nombreProducto: nombreProducto,
            precio: precio,
            cantidadEnInventario: cantidadInventario,
            stockMinimo: stockMinimo,
            imagenesUrls: producto.imagenesUrls || [],
            descripcion: descripcion,
            esLlanta: esLlanta || false,
            marca: producto.marca || null,
            modelo: producto.modelo || null,
            medidaCompleta: medidaLlanta || null
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
}

/**
 * Actualizar controles de paginación
 */
function actualizarControlsPaginacion() {
    const paginacionContainer = $('#paginacionInventarioModal');
    
    if (paginacionConfig.totalPaginas <= 1) {
        paginacionContainer.hide();
        return;
    }

    paginacionContainer.show();

    let html = `
        <nav aria-label="Paginación de inventario">
            <ul class="pagination pagination-sm justify-content-center mb-0">
    `;

    // Botón anterior
    html += `
        <li class="page-item ${paginacionConfig.paginaActual === 1 ? 'disabled' : ''}">
            <button class="page-link btn-pagina-inventario" data-pagina="${paginacionConfig.paginaActual - 1}" ${paginacionConfig.paginaActual === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;

    // Páginas
    const maxPaginasVisibles = 5;
    let inicio = Math.max(1, paginacionConfig.paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(paginacionConfig.totalPaginas, inicio + maxPaginasVisibles - 1);

    if (fin - inicio + 1 < maxPaginasVisibles) {
        inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }

    // Primera página si no está visible
    if (inicio > 1) {
        html += `
            <li class="page-item">
                <button class="page-link btn-pagina-inventario" data-pagina="1">1</button>
            </li>
        `;
        if (inicio > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Páginas visibles
    for (let i = inicio; i <= fin; i++) {
        html += `
            <li class="page-item ${i === paginacionConfig.paginaActual ? 'active' : ''}">
                <button class="page-link btn-pagina-inventario" data-pagina="${i}">${i}</button>
            </li>
        `;
    }

    // Última página si no está visible
    if (fin < paginacionConfig.totalPaginas) {
        if (fin < paginacionConfig.totalPaginas - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `
            <li class="page-item">
                <button class="page-link btn-pagina-inventario" data-pagina="${paginacionConfig.totalPaginas}">${paginacionConfig.totalPaginas}</button>
            </li>
        `;
    }

    // Botón siguiente
    html += `
        <li class="page-item ${paginacionConfig.paginaActual === paginacionConfig.totalPaginas ? 'disabled' : ''}">
            <button class="page-link btn-pagina-inventario" data-pagina="${paginacionConfig.paginaActual + 1}" ${paginacionConfig.paginaActual === paginacionConfig.totalPaginas ? 'disabled' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;

    html += `
            </ul>
        </nav>
    `;

    paginacionContainer.html(html);

    // Configurar eventos de paginación
    configurarEventosPaginacion();
}

/**
 * Configurar eventos de paginación
 */
function configurarEventosPaginacion() {
    $('.btn-pagina-inventario').off('click').on('click', function(e) {
        e.preventDefault();
        
        if ($(this).prop('disabled')) {
            return;
        }

        const nuevaPagina = parseInt($(this).data('pagina'));
        
        if (nuevaPagina >= 1 && nuevaPagina <= paginacionConfig.totalPaginas && nuevaPagina !== paginacionConfig.paginaActual) {
            paginacionConfig.paginaActual = nuevaPagina;
            mostrarProductosInventario(productosFiltrados);
            console.log(`📦 Navegando a página ${nuevaPagina}`);
        }
    });
}

/**
 * Actualizar información de paginación
 */
function actualizarInfoPaginacion(productosPagina, totalProductos) {
    const infoContainer = $('#infoPaginacionInventario');
    
    if (totalProductos === 0) {
        infoContainer.html('<small class="text-muted">No hay productos para mostrar</small>');
        return;
    }

    if (paginacionConfig.totalPaginas <= 1) {
        infoContainer.html(`<small class="text-muted">Mostrando ${totalProductos} producto${totalProductos !== 1 ? 's' : ''}</small>`);
        return;
    }

    const inicio = (paginacionConfig.paginaActual - 1) * paginacionConfig.productosPorPagina + 1;
    const fin = Math.min(inicio + productosPagina - 1, totalProductos);

    infoContainer.html(`
        <small class="text-muted">
            Mostrando ${inicio}-${fin} de ${totalProductos} productos 
            (Página ${paginacionConfig.paginaActual} de ${paginacionConfig.totalPaginas})
        </small>
    `);
}

/**
 * Ocultar controles de paginación
 */
function ocultarControlsPaginacion() {
    $('#paginacionInventarioModal').hide();
}

/**
 * Cambiar productos por página
 */
function cambiarProductosPorPagina(cantidad) {
    paginacionConfig.productosPorPagina = cantidad;
    paginacionConfig.paginaActual = 1; // Volver a la primera página
    mostrarProductosInventario(productosFiltrados);
    console.log(`📦 Productos por página cambiado a: ${cantidad}`);
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

    let productosFiltradosTemp = [...productosInventarioCompleto];

    // Filtro por texto de búsqueda
    if (filtrosInventarioActivos.busqueda) {
        const termino = filtrosInventarioActivos.busqueda.toLowerCase();
        productosFiltradosTemp = productosFiltradosTemp.filter(producto => {
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
        productosFiltradosTemp = productosFiltradosTemp.filter(producto => {
            return (producto.categoria || '').toLowerCase() === filtrosInventarioActivos.categoria.toLowerCase();
        });
    }

    // Filtro por stock
    if (filtrosInventarioActivos.stock) {
        switch (filtrosInventarioActivos.stock) {
            case 'disponible':
                productosFiltradosTemp = productosFiltradosTemp.filter(p => (p.cantidadEnInventario || 0) > 0);
                break;
            case 'agotado':
                productosFiltradosTemp = productosFiltradosTemp.filter(p => (p.cantidadEnInventario || 0) === 0);
                break;
            case 'bajo':
                productosFiltradosTemp = productosFiltradosTemp.filter(p => 
                    (p.cantidadEnInventario || 0) > 0 && 
                    (p.cantidadEnInventario || 0) <= (p.stockMinimo || 0)
                );
                break;
        }
    }

    console.log(`🔍 Filtros aplicados: ${productosFiltradosTemp.length} de ${productosInventarioCompleto.length} productos`);
    
    // Reiniciar a la primera página cuando se aplican filtros
    paginacionConfig.paginaActual = 1;
    
    mostrarProductosInventario(productosFiltradosTemp);
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

    // Reiniciar a la primera página
    paginacionConfig.paginaActual = 1;

    mostrarProductosInventario(productosInventarioCompleto);
}

/**
 * Limpiar datos del modal de inventario
 */
function limpiarInventarioModal() {
    console.log('🧹 Limpiando modal de inventario');

    $('#inventarioModalProductos').empty();
    productosInventarioCompleto = [];
    productosFiltrados = [];

    // Reiniciar paginación
    paginacionConfig = {
        paginaActual: 1,
        productosPorPagina: 20,
        totalPaginas: 1,
        totalProductos: 0
    };

    // Limpiar ordenamiento
    $('.sortable').removeClass('sorted-asc sorted-desc');
    $('.sortable i').removeClass('bi-arrow-up bi-arrow-down').addClass('bi-arrow-down-up');

    // Ocultar controles de paginación
    ocultarControlsPaginacion();

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







// ✅ NO NECESITAMOS FUNCIÓN DUPLICADA - SE USA LA DE FACTURACION.JS PRINCIPAL

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
window.cambiarProductosPorPagina = cambiarProductosPorPagina;

// ✅ VERIFICAR QUE verDetalleProducto ESTÉ DISPONIBLE DESDE FACTURACION.JS
if (typeof window.verDetalleProducto !== 'function') {
    console.warn('⚠️ verDetalleProducto no está disponible desde facturacion.js');
} else {
    console.log('✅ verDetalleProducto disponible desde facturacion.js');
}

console.log('📦 Módulo InventarioFacturacion.js cargado correctamente');