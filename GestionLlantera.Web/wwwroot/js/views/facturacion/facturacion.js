// ===== FACTURACIÓN - JAVASCRIPT PRINCIPAL =====
// ===== FACTURACIÓN - JAVASCRIPT PRINCIPAL =====

let productosEnVenta = [];
let clienteSeleccionado = null;
let modalInventario = null;
let modalFinalizarVenta = null;
let modalDetalleProducto = null;

// Variables de control para evitar múltiples llamadas
let busquedaEnProceso = false;
let cargaInicialCompletada = false;
let ultimaBusqueda = '';
let timeoutBusquedaActivo = null;

// ===== CONTADORES DE DEPURACIÓN =====
let contadorLlamadasBusqueda = 0;
let contadorLlamadasMostrarResultados = 0;
let contadorLlamadasCargandoBusqueda = 0;
let contadorEventosInput = 0;

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
    console.log('🚀 === INICIO inicializarFacturacion ===');
    try {
        // Inicializar modales
        console.log('🚀 Inicializando modales...');
        inicializarModales();

        // Configurar eventos
        console.log('🚀 Configurando eventos...');
        configurarEventos();

        // Actualizar totales
        console.log('🚀 Actualizando totales...');
        actualizarTotales();

        // Cargar productos iniciales
        console.log('🚀 Iniciando carga de productos iniciales...');
        cargarProductosIniciales();

        console.log('✅ Facturación inicializada correctamente');
        console.log('🚀 === FIN inicializarFacturacion ===');
    } catch (error) {
        console.error('❌ Error inicializando facturación:', error);
        console.log('🚀 === FIN inicializarFacturacion (con error) ===');
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
    let ultimoEventoInput = 0; // Para throttling adicional

    $('#busquedaProducto').on('input', function() {
        contadorEventosInput++;
        const termino = $(this).val().trim();
        const ahora = Date.now();

        console.log('🎯 === EVENTO INPUT BÚSQUEDA ===');
        console.log('🎯 CONTADOR DE EVENTOS:', contadorEventosInput);
        console.log('🎯 Término ingresado:', `"${termino}"`);
        console.log('🎯 timeoutBusquedaActivo:', timeoutBusquedaActivo !== null);
        console.log('🎯 busquedaEnProceso:', busquedaEnProceso);

        // ✅ THROTTLING ADICIONAL - PREVENIR EVENTOS MUY RÁPIDOS
        if (ahora - ultimoEventoInput < 100) {
            console.log('⏸️ Evento demasiado rápido, ignorando');
            return;
        }
        ultimoEventoInput = ahora;

        // ✅ NO PROCESAR SI YA HAY UNA BÚSQUEDA EN PROCESO
        if (busquedaEnProceso) {
            console.log('⏸️ Búsqueda en proceso, ignorando evento de input');
            return;
        }

        // Limpiar timeout anterior
        if (timeoutBusquedaActivo) {
            console.log('🎯 Limpiando timeout anterior...');
            clearTimeout(timeoutBusquedaActivo);
            timeoutBusquedaActivo = null;
        }

        timeoutBusquedaActivo = setTimeout(() => {
            console.log('🎯 === EJECUTANDO TIMEOUT DE BÚSQUEDA ===');
            console.log('🎯 Término a buscar:', `"${termino}"`);
            console.log('🎯 ultimaBusqueda:', `"${ultimaBusqueda}"`);
            console.log('🎯 busquedaEnProceso:', busquedaEnProceso);

            // ✅ VERIFICAR NUEVAMENTE EL ESTADO ANTES DE PROCEDER
            if (busquedaEnProceso) {
                console.log('⏸️ Búsqueda iniciada en otro lugar, omitiendo timeout');
                timeoutBusquedaActivo = null;
                return;
            }

            // Prevenir búsquedas duplicadas del mismo término
            if (termino === ultimaBusqueda) {
                console.log('⏸️ Búsqueda duplicada omitida:', termino);
                timeoutBusquedaActivo = null;
                return;
            }

            if (termino.length >= 2) {
                console.log('🎯 Iniciando búsqueda con término:', termino);
                buscarProductos(termino);
            } else if (termino.length === 0) {
                console.log('🎯 Campo vacío, verificando carga inicial...');
                // Mostrar productos iniciales si el campo está vacío
                if (cargaInicialCompletada) {
                    console.log('🎯 Carga inicial completada, buscando todos los productos');
                    buscarProductos('');
                } else {
                    console.log('🎯 Carga inicial no completada, mostrando mensaje de búsqueda');
                    $('#resultadosBusqueda').html(`
                        <div class="col-12 text-center py-4 text-muted">
                            <i class="bi bi-search display-1"></i>
                            <p class="mt-2">Busca productos para agregar a la venta</p>
                        </div>
                    `);
                }
            }
            timeoutBusquedaActivo = null;
            console.log('🎯 === FIN TIMEOUT DE BÚSQUEDA ===');
        }, 800); // Aumentar debounce para mayor estabilidad
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

// ===== FUNCIÓN CENTRALIZADA PARA CONSTRUCCIÓN DE URLs DE IMÁGENES =====
function construirUrlImagen(producto) {
    let imagenUrl = '/images/no-image.png'; // Imagen por defecto
    
    try {
        console.log('🖼️ Construyendo URL para producto:', producto.nombreProducto || producto.NombreProducto);
        console.log('🖼️ Datos del producto:', producto);
        
        let imagenesArray = [];
        
        // Buscar imágenes en múltiples fuentes (EXACTO como verDetalleProducto)
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
            console.log('🖼️ URL original encontrada:', urlImagen);
            
            if (urlImagen && urlImagen.trim() !== '') {
                // Lógica robusta de construcción de URLs (EXACTO como verDetalleProducto)
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
                console.log('🖼️ URL final construida:', imagenUrl);
            }
        } else {
            console.log('🖼️ No se encontraron imágenes válidas');
        }
    } catch (error) {
        console.warn('⚠️ Error construyendo URL de imagen:', error);
        imagenUrl = '/images/no-image.png';
    }
    
    return imagenUrl;
}

// ===== BÚSQUEDA DE PRODUCTOS =====
async function buscarProductos(termino) {
    contadorLlamadasBusqueda++;
    console.log('🔍 === INICIO buscarProductos ===');
    console.log('🔍 CONTADOR DE LLAMADAS:', contadorLlamadasBusqueda);
    console.log('🔍 Término recibido:', `"${termino}"`);
    console.log('🔍 busquedaEnProceso:', busquedaEnProceso);
    console.log('🔍 ultimaBusqueda:', `"${ultimaBusqueda}"`);

    // ✅ PREVENIR MÚLTIPLES LLAMADAS SIMULTÁNEAS
    if (busquedaEnProceso) {
        console.log('⏸️ Búsqueda ya en proceso, omitiendo llamada duplicada');
        return;
    }

    // ✅ PREVENIR BÚSQUEDAS DUPLICADAS (EXCEPTO LA PRIMERA CARGA)
    if (termino === ultimaBusqueda && cargaInicialCompletada) {
        console.log('⏸️ Búsqueda duplicada del mismo término omitida:', termino);
        return;
    }

    try {
        console.log('🔍 Iniciando búsqueda válida...');
        busquedaEnProceso = true;
        ultimaBusqueda = termino;

        // ✅ NO MOSTRAR LOADING PARA PREVENIR PARPADEO - El contenido se actualiza solo si hay cambios reales

        const response = await fetch('/Facturacion/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📋 Respuesta del servidor recibida');
        console.log('📋 DATOS COMPLETOS DEL SERVIDOR:', JSON.stringify(data, null, 2));

        if (data && data.productos) {
            console.log(`✅ Se encontraron ${data.productos.length} productos disponibles`);

            // ✅ FILTRAR PRODUCTOS SEGÚN EL TÉRMINO DE BÚSQUEDA (si es necesario)
            let productosFiltrados = data.productos;
            if (termino && termino.length >= 2) {
                productosFiltrados = data.productos.filter(producto => {
                    const nombre = (producto.nombreProducto || producto.nombre || '').toLowerCase();
                    return nombre.includes(termino.toLowerCase());
                });
                console.log(`🔍 Productos filtrados por término "${termino}": ${productosFiltrados.length}`);
            }

            mostrarResultadosProductos(productosFiltrados);

            // ✅ MARCAR CARGA INICIAL COMO COMPLETADA SI ES UNA BÚSQUEDA VACÍA (PRIMERA CARGA)
            if (termino === '' && !cargaInicialCompletada) {
                cargaInicialCompletada = true;
                console.log('📦 Carga inicial marcada como completada después de primera búsqueda exitosa');
            }

            console.log('📦 Productos mostrados exitosamente');
        } else {
            const errorMessage = data.message || 'Error desconocido al obtener productos';
            console.error('❌ Error en la respuesta:', errorMessage);
            mostrarResultadosProductos([]);
            mostrarToast('Error', errorMessage, 'danger');
        }

    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        mostrarErrorBusqueda('productos', error.message);
    } finally {
        busquedaEnProceso = false;
        console.log('🔍 === FIN buscarProductos ===');
    }
}

function mostrarResultadosProductos(productos) {
    contadorLlamadasMostrarResultados++;
    console.log('🔄 === INICIO mostrarResultadosProductos ===');
    console.log('🔄 CONTADOR DE LLAMADAS:', contadorLlamadasMostrarResultados);
    console.log('🔄 Productos recibidos:', productos ? productos.length : 'null/undefined');

    const container = $('#resultadosBusqueda');

    if (!productos || productos.length === 0) {
        console.log('🔄 No hay productos, mostrando sin resultados');
        mostrarSinResultados('productos');
        return;
    }

    // ✅ CREAR HASH ÚNICO DEL CONTENIDO PARA DETECTAR CAMBIOS REALES
    const productosHash = JSON.stringify(productos.map(p => ({
        id: p.productoId || p.id,
        nombre: p.nombreProducto || p.nombre,
        precio: p.precio,
        stock: p.cantidadEnInventario || p.stock
    })));

    // ✅ VARIABLE GLOBAL PARA RASTREAR EL ÚLTIMO HASH
    if (window.lastProductsHash === productosHash) {
        console.log('🔄 Productos idénticos detectados, omitiendo actualización DOM para prevenir parpadeo');
        console.log('🔄 === FIN mostrarResultadosProductos (sin cambios) ===');
        return;
    }

    // ✅ VERIFICAR SI EL CONTENEDOR YA TIENE CONTENIDO SIMILAR
    const currentContent = container.html().trim();
    if (currentContent && !currentContent.includes('spinner-border') && !currentContent.includes('Cargando')) {
        // Si ya hay contenido de productos, no actualizar a menos que haya cambios reales
        if (window.lastProductsHash && productos.length === container.find('.producto-card').length) {
            console.log('🔄 Mismo número de productos detectado, verificando si actualización es necesaria');
            // Solo continuar si realmente hay cambios
        }
    }

    console.log('🔄 Construyendo HTML para', productos.length, 'productos');
    let html = '';
    productos.forEach((producto, index) => {
        // MAPEO DE PROPIEDADES
        const nombreProducto = producto.nombreProducto || producto.NombreProducto || 'Producto sin nombre';
        const productoId = producto.productoId || producto.ProductoId || 'unknown';
        const precio = producto.precio || producto.Precio || 0;
        const cantidadInventario = producto.cantidadEnInventario || producto.CantidadEnInventario || 0;
        const stockMinimo = producto.stockMinimo || producto.StockMinimo || 0;

        // USAR FUNCIÓN CENTRALIZADA PARA CONSTRUIR URL DE IMAGEN
        const imagenUrl = construirUrlImagen(producto);

        // CÁLCULO DE PRECIOS
        const precioBase = (typeof precio === 'number') ? precio : 0;
        const precioEfectivo = precioBase * CONFIGURACION_PRECIOS.efectivo.multiplicador;
        const precioTarjeta = precioBase * CONFIGURACION_PRECIOS.tarjeta.multiplicador;

        const stockClase = cantidadInventario <= 0 ? 'border-danger' : cantidadInventario <= stockMinimo ? 'border-warning' : '';

        // OBJETO PRODUCTO LIMPIO - INCLUYENDO TODAS LAS FUENTES DE IMÁGENES
        const productoLimpio = {
            productoId: productoId,
            nombreProducto: nombreProducto,
            precio: precioBase,
            cantidadEnInventario: cantidadInventario,
            stockMinimo: stockMinimo,
            // Preservar todas las fuentes de imágenes (igual que verDetalleProducto)
            imagenesProductos: producto.imagenesProductos || [],
            imagenesUrls: producto.imagenesUrls || [],
            imagenes: producto.imagenes || [],
            descripcion: producto.descripcion || producto.Descripcion || '',
            esLlanta: producto.esLlanta || false,
            marca: producto.marca || null,
            modelo: producto.modelo || null,
            medidaCompleta: producto.medidaCompleta || null
        };

        // ESCAPAR DATOS
        const nombreEscapado = nombreProducto.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
        const productoJson = JSON.stringify(productoLimpio).replace(/"/g, '&quot;');

        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 producto-card ${stockClase}" data-producto-id="${productoId}">
                    <div class="position-relative">
                        <img src="${imagenUrl}" 
                             class="card-img-top producto-imagen" 
                             alt="${nombreEscapado}"
                             style="height: 120px; object-fit: cover;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVDOTEuNzE1NyA3NSA4NSAwMS43MTU3IDg1IDkwQzg1IDk4LjI4NDMgOTEuNzE1NyAxMDUgMTAwIDEwNUMxMDguMjg0IDEwNSAxMTUgOTguMjg0MyAxMTUgOTBDMTE1IDgxLjcxNTcgMTA4LjI4NCA3NSAxMDAgNzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xNzUgNTBINDBDMzUgNTAgMzAgNTUgMzAgNjBWMTQwQzMwIDE0NSAzNSAxNTAgNDAgMTUwSDE3NUMxODAgMTUwIDE4NSAxNDUgMTg1IDE0MFY2MEMxODUgNTUgMTgwIDUwIDE3NSA1MFpNNTAgNzBIMTYwVjEzMEg1MFY3MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'">
                        ${cantidadInventario <= 0 ? 
                            '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Sin Stock</span>' :
                            cantidadInventario <= stockMinimo ?
                            '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Stock Bajo</span>' : ''
                        }
                    </div>
                    <div class="card-body p-2">
                        <h6 class="card-title mb-1" title="${nombreEscapado}">
                            ${nombreProducto.length > 25 ? nombreProducto.substring(0, 25) + '...' : nombreProducto}
                        </h6>
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
                            <small class="text-primary">Stock: ${cantidadInventario}</small>
                            ${cantidadInventario <= stockMinimo && cantidadInventario > 0 ? 
                                '<small class="badge bg-warning">Stock Bajo</small>' : ''}
                        </div>
                        <div class="d-grid gap-1">
                            ${cantidadInventario > 0 ? `
                                <button type="button" 
                                        class="btn btn-primary btn-sm btn-seleccionar-producto"
                                        data-producto="${productoJson}">
                                    <i class="bi bi-hand-index me-1"></i>Seleccionar
                                </button>
                            ` : `
                                <button type="button" class="btn btn-secondary btn-sm" disabled>
                                    <i class="bi bi-x-circle me-1"></i>Sin Stock
                                </button>
                            `}
                            <button type="button" 
                                    class="btn btn-outline-info btn-sm btn-ver-detalle"
                                    data-producto="${productoJson}">
                                <i class="bi bi-eye me-1"></i>Ver Detalle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    console.log('🔄 Actualizando DOM (longitud HTML:', html.length, 'caracteres)');

    // ✅ ACTUALIZAR DOM Y GUARDAR HASH
    container.html(html);
    window.lastProductsHash = productosHash;

    // ✅ CONFIGURAR EVENTOS UNA SOLA VEZ
    $('.btn-seleccionar-producto').off('click.facturacion').on('click.facturacion', function(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));
            mostrarModalSeleccionProducto(producto);
        } catch (error) {
            console.error('❌ Error parseando producto para selección:', error);
            mostrarToast('Error', 'No se pudo procesar el producto seleccionado', 'danger');
        }
    });

    $('.btn-ver-detalle').off('click.facturacion').on('click.facturacion', function(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            const productoJson = $(this).attr('data-producto');
            const producto = JSON.parse(productoJson.replace(/&quot;/g, '"'));
            verDetalleProducto(producto);
        } catch (error) {
            console.error('❌ Error parseando producto para detalle:', error);
            mostrarToast('Error', 'No se pudo mostrar el detalle del producto', 'danger');
        }
    });

    console.log('🔄 === FIN mostrarResultadosProductos ===');
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

    // USAR FUNCIÓN CENTRALIZADA PARA CONSTRUIR URL DE IMAGEN
    const imagenUrl = construirUrlImagen(producto);

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
                                     onerror="this.onerror=null; this.src='/images/no-image.png';"">
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
        // Extraer imágenes del producto
        const imagenesProducto = producto.imagenesProductos || producto.imagenes || [];

        // Construir carrusel de imágenes
        let imagenesParaModal = [];
        if (Array.isArray(imagenesProducto) && imagenesProducto.length > 0) {
            imagenesParaModal = imagenesProducto.map(img => {
                const url = img.urlImagen || img.Urlimagen || '';
                if (url && url.trim() !== '') {
                    // Construir la URL completa con la API base
                    if (url.startsWith('/uploads/productos/')) {
                        return `https://localhost:7273${url}`;
                    } else if (url.startsWith('uploads/productos/')) {
                        return `https://localhost:7273/${url}`;
                    } else {
                        return url; // URL completa
                    }
                }
                return '/images/no-image.png';
            });
        } else {
            imagenesParaModal = ['/images/no-image.png'];
        }

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
        if (valorActual < stockDisponible){
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
        // Validación robusta para imagen URL
        let imagenUrl = null;
        if (producto.imagenesProductos && 
            Array.isArray(producto.imagenesProductos) && 
            producto.imagenesProductos.length > 0) {

            const primeraImagen = producto.imagenesProductos[0];
            if (primeraImagen && primeraImagen.Urlimagen) {
                imagenUrl = primeraImagen.Urlimagen;
            }
        }

        productosEnVenta.push({
            productoId: producto.productoId,
            nombreProducto: producto.nombreProducto,
            precioUnitario: precioUnitario,
            cantidad: cantidad,
            stockDisponible: producto.cantidadEnInventario,
            metodoPago: metodoPago,
            imagenUrl: imagenUrl
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
    contadorLlamadasCargandoBusqueda++;
    console.log('⏳ === mostrarCargandoBusqueda llamada ===');
    console.log('⏳ CONTADOR DE LLAMADAS:', contadorLlamadasCargandoBusqueda);
    console.log('⏳ Stack trace:', new Error().stack);
    $('#resultadosBusqueda').html(`
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">Buscando productos...</p>
        </div>
    `);
    console.log('⏳ Loading mostrado');
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

    // USAR FUNCIÓN CENTRALIZADA PARA CONSTRUIR URL DE IMAGEN
    const imagenUrl = construirUrlImagen(producto);

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
                                     onerror="this.onerror=null; this.src='/images/no-image.png';"">

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
    console.log('📦 === INICIO cargarProductosIniciales ===');
    console.log('📦 cargaInicialCompletada:', cargaInicialCompletada);

    // ✅ PREVENIR MÚLTIPLES CARGAS INICIALES
    if (cargaInicialCompletada) {
        console.log('📦 Productos iniciales ya cargados, omitiendo');
        return;
    }

    //// ✅ PREVENIR CARGA SI YA HAY UNA BÚSQUEDA EN PROCESO
    if (busquedaEnProceso) {
        console.log('📦 Búsqueda en proceso, posponiendo carga inicial');
        setTimeout(() => cargarProductosIniciales(), 500);
        return;
    }

    try {
        console.log('📦 Iniciando carga de productos iniciales...');

        // ✅ MOSTRAR LOADING INMEDIATAMENTE
        $('#resultadosBusqueda').html(`
            <div class="col-12 text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
                <p class="mt-2 text-muted">Cargando productos disponibles...</p>
            </div>
        `);

        // ✅ REALIZAR BÚSQUEDA INICIAL
        await buscarProductos('');

        // ✅ La carga se marca como completada dentro de buscarProductos() cuando es exitosa
        console.log('📦 Búsqueda inicial ejecutada');

        console.log('📦 === FIN cargarProductosIniciales (exitosa) ===');
    } catch (error) {
        console.error('❌ Error cargando productos iniciales:', error);
        cargaInicialCompletada = false;
        $('#resultadosBusqueda').html(`
            <div class="col-12 text-center py-4 text-danger">
                <i class="bi bi-exclamation-triangle display-1"></i>
                <p class="mt-2">Error al cargar productos</p>
                <button class="btn btn-outline-primary" onclick="reiniciarCargaProductos()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
                </button>
            </div>
        `);
        console.log('📦 === FIN cargarProductosIniciales (con error) ===');
    }
}

// Nueva función para reiniciar la carga (para el botón de reintentar)
function reiniciarCargaProductos() {
    console.log('🔄 Reiniciando carga de productos...');

    // Limpiar completamente el estado
    cargaInicialCompletada = false;
    busquedaEnProceso = false;
    ultimaBusqueda = '';
    window.lastProductsHash = null; // ✅ LIMPIAR HASH PARA FORZAR ACTUALIZACIÓN

    // Limpiar timeouts activos
    if (timeoutBusquedaActivo) {
        clearTimeout(timeoutBusquedaActivo);
        timeoutBusquedaActivo = null;
    }

    // Limpiar contenido actual
    $('#resultadosBusqueda').empty();

    // Recargar productos inmediatamente
    cargarProductosIniciales();
}

// ✅ FUNCIÓN PARA LIMPIAR ESTADO COMPLETAMENTE CUANDO SEA NECESARIO
function limpiarEstadoBusqueda() {
    console.log('🧹 Limpiando estado de búsqueda...');
    cargaInicialCompletada = false;
    busquedaEnProceso = false;
    ultimaBusqueda = '';
    window.lastProductsHash = null;

    if (timeoutBusquedaActivo) {
        clearTimeout(timeoutBusquedaActivo);
        timeoutBusquedaActivo = null;
    }
}

// ===== FUNCIÓN DE DEPURACIÓN =====
function mostrarResumenDepuracion() {
    console.log('📊 === RESUMEN DE DEPURACIÓN ===');
    console.log('📊 Llamadas a buscarProductos:', contadorLlamadasBusqueda);
    console.log('📊 Llamadas a mostrarResultadosProductos:', contadorLlamadasMostrarResultados);
    console.log('📊 Llamadas a mostrarCargandoBusqueda:', contadorLlamadasCargandoBusqueda);
    console.log('📊 Eventos input disparados:', contadorEventosInput);
    console.log('📊 busquedaEnProceso:', busquedaEnProceso);
    console.log('📊 cargaInicialCompletada:', cargaInicialCompletada);
    console.log('📊 ultimaBusqueda:', `"${ultimaBusqueda}"`);
    console.log('📊 timeoutBusquedaActivo:', timeoutBusquedaActivo !== null);
    console.log('📊 === FIN RESUMEN ===');
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
window.reiniciarCargaProductos = reiniciarCargaProductos;
window.mostrarResumenDepuracion = mostrarResumenDepuracion;