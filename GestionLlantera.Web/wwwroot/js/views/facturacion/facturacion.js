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

        // ✅ ESTABLECER ESTADO INICIAL DEL BOTÓN FINALIZAR
        actualizarEstadoBotonFinalizar();

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

        // ✅ LIMPIAR CLIENTE SELECCIONADO CUANDO SE CAMBIA EL TEXTO
        if (clienteSeleccionado && termino !== clienteSeleccionado.nombre) {
            clienteSeleccionado = null;
            $('#clienteSeleccionado').addClass('d-none');
            actualizarEstadoBotonFinalizar();
        }

        // ✅ LIMPIAR VALIDACIÓN VISUAL SI EXISTE
        $(this).removeClass('is-invalid');

        clearTimeout(timeoutCliente);
        timeoutCliente = setTimeout(() => {
            if (termino.length >= 2) {
                buscarClientes(termino);
            } else {
                // Ocultar dropdown de resultados si el término es muy corto
                $('.dropdown-clientes').remove();
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

        // VALIDACIÓN DE IMÁGENES - MEJORADA (basada en verDetalleProducto)
        let imagenUrl = '/images/no-image.png'; // Imagen por defecto
        try {
            if (producto && typeof producto === 'object') {
                console.log('🖼️ Procesando imágenes para producto:', producto.nombreProducto);
                console.log('🖼️ Datos del producto:', {
                    imagenesProductos: producto.imagenesProductos,
                    imagenesUrls: producto.imagenesUrls,
                    imagenes: producto.imagenes
                });

                let imagenesArray = [];

                // Verificar imagenesProductos (formato principal desde la API)
                if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
                    imagenesArray = producto.imagenesProductos
                        .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                        .filter(url => url && url.trim() !== '');
                    console.log('🖼️ Imágenes desde imagenesProductos:', imagenesArray);
                } 
                // Verificar imagenesUrls como alternativa
                else if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
                    imagenesArray = producto.imagenesUrls.filter(url => url && url.trim() !== '');
                    console.log('🖼️ Imágenes desde imagenesUrls:', imagenesArray);
                }
                // Verificar imagenes como última alternativa
                else if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
                    imagenesArray = producto.imagenes
                        .map(img => img.Urlimagen || img.urlImagen || img.UrlImagen)
                        .filter(url => url && url.trim() !== '');
                    console.log('🖼️ Imágenes desde imagenes:', imagenesArray);
                }

                if (imagenesArray.length > 0) {
                    let urlImagen = imagenesArray[0];
                    console.log('🖼️ URL original:', urlImagen);

                    if (urlImagen && urlImagen.trim() !== '') {
                        // Lógica mejorada de construcción de URLs (igual que verDetalleProducto)
                        if (urlImagen.startsWith('/uploads/productos/')) {
                            imagenUrl = `https://localhost:7273${urlImagen}`;
                        } else if (urlImagen.startsWith('uploads/productos/')) {
                            imagenUrl = `https://localhost:7273/${urlImagen}`;
                        } else if (urlImagen.startsWith('http://') || urlImagen.startsWith('https://')) {
                            imagenUrl = urlImagen; // URL completa
                        } else if (urlImagen.startsWith('/')) {
                            // URL relativa que empieza con /
                            imagenUrl = `https://localhost:7273${urlImagen}`;
                        } else {
                            // URL relativa sin /
                            imagenUrl = `https://localhost:7273/${urlImagen}`;
                        }
                        console.log('🖼️ URL final construida:', imagenUrl);
                    }
                } else {
                    console.log('🖼️ No se encontraron imágenes válidas, usando imagen por defecto');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error procesando imágenes del producto:', error);
            imagenUrl = '/images/no-image.png';
        }

        // CÁLCULO DE PRECIOS
        const precioBase = (typeof precio === 'number') ? precio : 0;
        const precioEfectivo = precioBase * CONFIGURACION_PRECIOS.efectivo.multiplicador;
        const precioTarjeta = precioBase * CONFIGURACION_PRECIOS.tarjeta.multiplicador;

        const stockClase = cantidadInventario <= 0 ? 'border-danger' : cantidadInventario <= stockMinimo ? 'border-warning' : '';

        // OBJETO PRODUCTO LIMPIO
        const productoLimpio = {
            productoId: productoId,
            nombreProducto: nombreProducto,
            precio: precioBase,
            cantidadEnInventario: cantidadInventario,
            stockMinimo: stockMinimo,
            imagenesUrls: producto.imagenesUrls || [],
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

    // ✅ ACTUALIZAR ESTADO DEL BOTÓN FINALIZAR CUANDO SE SELECCIONA CLIENTE
    actualizarEstadoBotonFinalizar();

    // Debug: verificar que tenemos todos los datos del cliente
    console.log('Cliente seleccionado:', cliente);
}

// ===== MODAL DE SELECCIÓN DE PRODUCTO =====
function mostrarModalSeleccionProducto(producto) {
    const precioBase = producto.precio || 0;

    // Validación robusta para imágenes con URL de la API (mejorada)
    let imagenUrl = '/images/no-image.png';
    try {
        console.log('🖼️ Procesando imágenes para modal de producto:', producto.nombreProducto);
        let imagenesArray = [];

        // Usar la misma lógica que verDetalleProducto
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

        if (imagenesArray.length > 0) {
            let urlImagen = imagenesArray[0];
            console.log('🖼️ URL original en modal:', urlImagen);

            if (urlImagen && urlImagen.trim() !== '') {
                // Lógica mejorada de construcción de URLs
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
                console.log('🖼️ URL final en modal:', imagenUrl);
            }
        }
    } catch (error) {
        console.warn('⚠️ Error procesando imágenes del producto en modal:', error);
        imagenUrl = '/images/no-image.png';
    }

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

                                <!-- Mostrar precios por método de pago -->
                                <div class="mb-4">
                                    <h6 class="mb-3">💰 Precios por método de pago:</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-striped">
                                            <tbody>
                                                ${Object.entries(CONFIGURACION_PRECIOS).map(([metodo, config]) => {
                                                    const precio = precioBase * config.multiplicador;
                                                    return `
                                                        <tr>
                                                            <td>
                                                                <i class="bi bi-${metodo === 'tarjeta' ? 'credit-card' : metodo === 'sinpe' ? 'phone' : 'cash'} me-2"></i>
                                                                ${config.nombre}
                                                            </td>
                                                            <td class="text-end fw-bold text-success">₡${formatearMoneda(precio)}</td>
                                                        </tr>
                                                    `;
                                                }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                    <small class="text-muted">* El método de pago se seleccionará al finalizar la venta</small>
                                </div>

                                <!-- Cantidad -->
                                <div class="mb-3">
                                    <label for="cantidadProducto" class="form-label">
                                        <i class="bi bi-123 me-1"></i>Cantidad:
                                    </label>
                                    <div class="input-group" style="max-width: 200px;">
                                        <button type="button" class="btn btn-outline-secondary" id="btnMenosCantidad">-</button>
                                        <input type="number" 
                                               class="form-control text-center fw-bold" 
                                               id="cantidadProducto" 
                                               value="1" 
                                               min="1" 
                                               max="${producto.cantidadEnInventario}"
                                               style="font-size: 16px; min-width: 80px; -moz-appearance: textfield; -webkit-appearance: none;"
                                               onwheel="return false;">
                                        <button type="button" class="btn btn-outline-secondary" id="btnMasCantidad">+</button>
                                    </div>
                                </div>

                                <!-- Precio base para referencia -->
                                <div class="alert alert-light">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span><i class="bi bi-tag me-2"></i><strong>Precio base:</strong></span>
                                        <span class="fs-5 fw-bold text-primary">₡${formatearMoneda(precioBase)}</span>
                                    </div>
                                    <small class="text-muted">El precio final dependerá del métodode pago seleccionado</small>
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

    // Limpiar eventos anteriores para evitar duplicación
    $('#btnMenosCantidad, #btnMasCantidad, #cantidadProducto, #btnConfirmarAgregarProducto').off();

    // Eventos de cantidad - CORREGIDOS
    $('#btnMenosCantidad').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const input = $('#cantidadProducto');
        const valorActual = parseInt(input.val()) || 1;
        const minimo = parseInt(input.attr('min')) || 1;
        
        if (valorActual > minimo) {
            input.val(valorActual - 1);
            console.log('➖ Cantidad decrementada a:', valorActual - 1);
        }
    });

    $('#btnMasCantidad').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const input = $('#cantidadProducto');
        const valorActual = parseInt(input.val()) || 1;
        const stockDisponible = producto.cantidadEnInventario;
        
        if (valorActual < stockDisponible) {
            input.val(valorActual + 1);
            console.log('➕ Cantidad incrementada a:', valorActual + 1);
        } else {
            mostrarToast('Stock limitado', `Solo hay ${stockDisponible} unidades disponibles`, 'warning');
        }
    });

    // Validación del input
    $('#cantidadProducto').on('input', function() {
        const valor = parseInt($(this).val()) || 1;
        const min = parseInt($(this).attr('min')) || 1;
        const max = parseInt($(this).attr('max')) || producto.cantidadEnInventario;

        if (valor < min) {
            $(this).val(min);
        } else if (valor > max) {
            $(this).val(max);
            mostrarToast('Stock limitado', `Solo hay ${max} unidades disponibles`, 'warning');
        }
    }).on('keydown', function(e) {
        // Prevenir las teclas de flecha arriba/abajo para evitar conflicto con botones
        if (e.which === 38 || e.which === 40) {
            e.preventDefault();
        }
        // Permitir solo números, backspace, delete, tab, escape, enter
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
            // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Permitir home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        // Asegurar que es un número
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    // Confirmar agregar producto - MEJORADO
    $('#btnConfirmarAgregarProducto').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const cantidad = parseInt($('#cantidadProducto').val()) || 1;
        
        console.log('🛒 Agregando producto a venta:', {
            nombre: producto.nombreProducto,
            cantidad: cantidad,
            precio: precioBase,
            stock: producto.cantidadEnInventario
        });

        // Validar cantidad antes de agregar
        if (cantidad < 1) {
            mostrarToast('Cantidad inválida', 'La cantidad debe ser mayor a 0', 'warning');
            return;
        }
        
        if (cantidad > producto.cantidadEnInventario) {
            mostrarToast('Stock insuficiente', `Solo hay ${producto.cantidadEnInventario} unidades disponibles`, 'warning');
            return;
        }

        // Agregar producto con la cantidad seleccionada
        agregarProductoAVenta(producto, cantidad, precioBase, 'efectivo');
        
        // Cerrar modal
        modal.hide();
        
        // Mostrar confirmación
        mostrarToast('Producto agregado', `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de ${producto.nombreProducto} agregadas`, 'success');
    });
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
    
    // ✅ HABILITAR BOTÓN LIMPIAR SOLO SI HAY PRODUCTOS
    $('#btnLimpiarVenta').prop('disabled', false);
    
    // ✅ HABILITAR BOTÓN FINALIZAR SOLO SI HAY PRODUCTOS Y CLIENTE SELECCIONADO
    actualizarEstadoBotonFinalizar();

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
        
        // ✅ ACTUALIZAR ESTADO DEL BOTÓN FINALIZAR DESPUÉS DE LIMPIAR
        actualizarEstadoBotonFinalizar();
        
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
        mostrarToast('Cliente requerido', 'Debes seleccionar un cliente antes de finalizar la venta', 'warning');
        
        // ✅ ENFOCAR EL CAMPO DE BÚSQUEDA DE CLIENTE
        $('#clienteBusqueda').focus();
        
        // ✅ RESALTAR EL CAMPO DE CLIENTE
        $('#clienteBusqueda').addClass('is-invalid');
        setTimeout(() => {
            $('#clienteBusqueda').removeClass('is-invalid');
        }, 3000);
        
        return;
    }

    // ===== LLENAR INFORMACIÓN DEL CLIENTE =====
    $('#resumenNombreCliente').text(clienteSeleccionado.nombre || clienteSeleccionado.nombreCliente || 'Cliente');
    $('#resumenEmailCliente').text(clienteSeleccionado.email || 'Sin email');

    // Llenar campos de cliente en el formulario
    $('#clienteNombre').val(clienteSeleccionado.nombre || clienteSeleccionado.nombreCliente || '');
    $('#clienteCedula').val(clienteSeleccionado.identificacion || clienteSeleccionado.contacto || '');
    $('#clienteTelefono').val(clienteSeleccionado.telefono || '');
    $('#clienteEmail').val(clienteSeleccionado.email || '');
    $('#clienteDireccion').val(clienteSeleccionado.direccion || '');

    // ===== CONFIGURAR MÉTODO DE PAGO INICIAL =====
    $('input[name="metodoPago"][value="efectivo"]').prop('checked', true);

    // ===== ACTUALIZAR RESUMEN CON MÉTODO DE PAGO INICIAL =====
    actualizarResumenVentaModal();

    // ===== CONFIGURAR EVENTOS DEL MODAL =====
    configurarEventosModalFinalizar();

    // Limpiar observaciones
    $('#observacionesVenta').val('');

    // Mostrar modal
    modalFinalizarVenta.show();
}

function actualizarResumenVentaModal() {
    const metodoSeleccionado = $('input[name="metodoPago"]:checked').val() || 'efectivo';
    const configMetodo = CONFIGURACION_PRECIOS[metodoSeleccionado];

    // Recalcular precios según método de pago seleccionado
    let subtotal = 0;

    // ===== MOSTRAR RESUMEN DE PRODUCTOS =====
    let htmlResumen = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Producto</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-end">Precio Unit.</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    productosEnVenta.forEach(producto => {
        // Calcular precio según método de pago seleccionado
        const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
        const subtotalProducto = precioAjustado * producto.cantidad;
        subtotal += subtotalProducto;

        htmlResumen += `
            <tr>
                <td>
                    <strong>${producto.nombreProducto}</strong>
                </td>
                <td class="text-center">${producto.cantidad}</td>
                <td class="text-end">₡${formatearMoneda(precioAjustado)}</td>
                <td class="text-end">₡${formatearMoneda(subtotalProducto)}</td>
            </tr>
        `;
    });

    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    htmlResumen += `
                </tbody>
                <tfoot class="table-light">
                    <tr>
                        <th colspan="3" class="text-end">Subtotal:</th>
                        <th class="text-end">₡${formatearMoneda(subtotal)}</th>
                    </tr>
                    <tr>
                        <th colspan="3" class="text-end">IVA (13%):</th>
                        <th class="text-end">₡${formatearMoneda(iva)}</th>
                    </tr>
                    <tr class="table-success">
                        <th colspan="3" class="text-end">TOTAL (${configMetodo.nombre}):</th>
                        <th class="text-end">₡${formatearMoneda(total)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    $('#resumenVentaFinal').html(htmlResumen);
    $('#totalFinalVenta').text(`₡${formatearMoneda(total)}`);

    // Mostrar/ocultar campos según el método de pago
    if (metodoSeleccionado === 'efectivo') {
        $('#campoEfectivoRecibido').show();
        $('#campoCambio').show();
        $('#efectivoRecibido').val(total.toFixed(2));
        calcularCambioModal();
    } else {
        $('#campoEfectivoRecibido').hide();
        $('#campoCambio').hide();
    }
}

function calcularCambio() {
    const total = productosEnVenta.reduce((sum, p) => sum + (p.precioUnitario * p.cantidad), 0) * 1.13;
    const montoRecibido = parseFloat($('#montoRecibido').val()) || 0;
    const cambio = montoRecibido - total;

    $('#cambioCalculado').val(cambio >= 0 ? formatearMoneda(cambio) : '0.00');
}

function calcularCambioModal() {
    const metodoSeleccionado = $('input[name="metodoPago"]:checked').val() || 'efectivo';
    const configMetodo = CONFIGURACION_PRECIOS[metodoSeleccionado];

    // Calcular total con el método de pago seleccionado
    let subtotal = 0;
    productosEnVenta.forEach(producto => {
        const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
        subtotal += precioAjustado * producto.cantidad;
    });

    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    const efectivoRecibido = parseFloat($('#efectivoRecibido').val()) || 0;
    const cambio = efectivoRecibido - total;

    $('#cambioCalculado').val(cambio >= 0 ? formatearMoneda(cambio) : '0.00');

    // Cambiar color según si es suficiente o no
    if (efectivoRecibido >= total) {
        $('#efectivoRecibido').removeClass('is-invalid').addClass('is-valid');
        $('#cambioCalculado').removeClass('text-danger').addClass('text-success');
    } else {
        $('#efectivoRecibido').removeClass('is-valid').addClass('is-invalid');
        $('#cambioCalculado').removeClass('text-success').addClass('text-danger');
    }
}

function configurarEventosModalFinalizar() {
    // Remover eventos anteriores para evitar duplicados
    $('input[name="metodoPago"]').off('change.modalFinalizar');
    $('#efectivoRecibido').off('input.modalFinalizar');

    // Configurar eventos de método de pago
    $('input[name="metodoPago"]').on('change.modalFinalizar', function() {
        // Actualizar todo el resumen cuando cambie el método de pago
        actualizarResumenVentaModal();
    });

    // Configurar evento de cambio en efectivo recibido
    $('#efectivoRecibido').on('input.modalFinalizar', function() {
        calcularCambioModal();
    });
}

async function procesarVentaFinal() {
    const $btnFinalizar = $('#btnConfirmarVenta');

    try {
        // Deshabilitar el botón y mostrar el estado de carga
        $btnFinalizar.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...');

        // Preparar datos de la venta con método de pago seleccionado
        const metodoPagoSeleccionado = $('input[name="metodoPago"]:checked').val() || 'efectivo';
        const configMetodo = CONFIGURACION_PRECIOS[metodoPagoSeleccionado];

        let subtotal = 0;
        productosEnVenta.forEach(producto => {
            const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
            subtotal += precioAjustado * producto.cantidad;
        });

        const iva = subtotal * 0.13;
        const total = subtotal + iva;

        // Crear objeto de factura para enviar a la API
        const facturaData = {
            clienteId: clienteSeleccionado?.clienteId || clienteSeleccionado?.id || null,
            nombreCliente: clienteSeleccionado?.nombre || 'Cliente General',
            identificacionCliente: clienteSeleccionado?.identificacion || '',
            telefonoCliente: clienteSeleccionado?.telefono || '',
            emailCliente: clienteSeleccionado?.email || '',
            direccionCliente: clienteSeleccionado?.direccion || '',
            fechaFactura: new Date().toISOString(),
            fechaVencimiento: null,
            subtotal: subtotal,
            descuentoGeneral: 0,
            porcentajeImpuesto: 13,
            montoImpuesto: iva,
            total: total,
            estado: 'Pagada',
            tipoDocumento: 'Factura',
            metodoPago: metodoPagoSeleccionado,
            observaciones: $('#observacionesVenta').val(),
            usuarioCreadorId: 1, // Obtener del contexto del usuario
            detallesFactura: productosEnVenta.map(producto => {
                const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
                return {
                    productoId: producto.productoId,
                    nombreProducto: producto.nombreProducto,
                    descripcionProducto: producto.descripcion || '',
                    cantidad: producto.cantidad,
                    precioUnitario: precioAjustado,
                    porcentajeDescuento: 0,
                    montoDescuento: 0,
                    subtotal: precioAjustado * producto.cantidad
                };
            })
        };

        // Crear la factura
        const responseFactura = await fetch('/Facturacion/CrearFactura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(facturaData)
        });

        if (!responseFactura.ok) {
            const errorText = await responseFactura.text();
            console.error('❌ Error del servidor al crear factura:', errorText);
            throw new Error(`Error al crear la factura: ${responseFactura.status} - ${errorText}`);
        }

        const resultadoFactura = await responseFactura.json();
        console.log('✅ Factura creada:', resultadoFactura);

        if (!resultadoFactura.success) {
            throw new Error(resultadoFactura.message || 'Error desconocido al crear la factura');
        }

        // Ajustar stock usando el endpoint interno del controlador
        try {
            const productosParaAjuste = productosEnVenta.map(producto => ({
                ProductoId: producto.productoId,
                NombreProducto: producto.nombreProducto,
                Cantidad: producto.cantidad
            }));

            const requestData = {
                NumeroFactura: resultadoFactura.numeroFactura || 'N/A',
                Productos: productosParaAjuste
            };

            console.log('📦 Ajustando stock para todos los productos...');

            const responseStock = await fetch('/Facturacion/AjustarStockFacturacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData)
            });

            if (responseStock.ok) {
                const resultadoStock = await responseStock.json();
                
                if (resultadoStock.success) {
                    console.log('✅ Stock ajustado exitosamente para todos los productos');
                    
                    // Mostrar resumen de ajustes exitosos
                    const ajustesExitosos = resultadoStock.resultados.filter(r => r.success);
                    if (ajustesExitosos.length > 0) {
                        console.log(`📦 ${ajustesExitosos.length} productos actualizados correctamente`);
                    }
                } else {
                    console.warn('⚠️ Algunos ajustes de stock fallaron:', resultadoStock.errores);
                    mostrarToast('Advertencia Stock', `${resultadoStock.errores.length} productos no se pudieron actualizar`, 'warning');
                }

                // Mostrar detalles de cada resultado
                if (resultadoStock.resultados) {
                    resultadoStock.resultados.forEach(resultado => {
                        if (resultado.success) {
                            console.log(`✅ ${resultado.nombreProducto}: ${resultado.stockAnterior} → ${resultado.stockNuevo}`);
                        } else {
                            console.warn(`⚠️ ${resultado.nombreProducto}: ${resultado.error}`);
                        }
                    });
                }
            } else {
                const errorText = await responseStock.text();
                console.error('❌ Error en endpoint de ajuste de stock:', errorText);
                mostrarToast('Error Stock', 'No se pudo conectar con el sistema de inventario', 'warning');
            }
        } catch (error) {
            console.error('❌ Error general ajustando stock:', error);
            mostrarToast('Error Stock', 'Error inesperado ajustando inventario', 'warning');
        }

        // Generar e imprimir recibo
        generarRecibo(resultadoFactura, productosEnVenta, {
            subtotal: subtotal,
            iva: iva,
            total: total,
            metodoPago: metodoPagoSeleccionado,
            cliente: clienteSeleccionado,
            usuario: obtenerUsuarioActual()
        });

        // Éxito
        modalFinalizarVenta.hide();
        mostrarToast('¡Venta procesada!', 'La venta ha sido procesada exitosamente. Actualizando inventario...', 'success');

        // Limpiar venta
        productosEnVenta = [];
        clienteSeleccionado = null;
        $('#clienteBusqueda').val('');
        $('#clienteSeleccionado').addClass('d-none');
        actualizarVistaCarrito();
        actualizarTotales();

        // Recargar la página después de un breve delay para mostrar el toast
        setTimeout(() => {
            console.log('🔄 Recargando página para refrescar inventario...');
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        mostrarToast('Error', 'Hubo un problema procesando la venta', 'error');
    } finally {
        // Restaurar botón
        $btnFinalizar.prop('disabled', false).html('<i class="bi bi-check-circle me-2"></i>Finalizar Venta');
    }
}

/**
 * Generar e imprimir recibo de venta optimizado para mini impresoras térmicas
 */
function generarRecibo(factura, productos, totales) {
    const fecha = new Date().toLocaleDateString('es-CR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    const hora = new Date().toLocaleTimeString('es-CR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });

    // Función para truncar texto según el ancho de la impresora
    function truncarTexto(texto, maxCaracteres) {
        if (!texto) return '';
        return texto.length > maxCaracteres ? texto.substring(0, maxCaracteres - 3) + '...' : texto;
    }

    // Función para formatear línea con espacios
    function formatearLineaEspacios(izquierda, derecha, anchoTotal = 32) {
        const espacios = anchoTotal - izquierda.length - derecha.length;
        return izquierda + ' '.repeat(Math.max(0, espacios)) + derecha;
    }

    // ✅ RECIBO OPTIMIZADO PARA MINI IMPRESORAS TÉRMICAS (58mm/80mm)
    const reciboHTML = `
        <div id="recibo-termica" style="width: 58mm; max-width: 58mm; font-family: 'Courier New', 'Consolas', monospace; font-size: 9px; line-height: 1.2; margin: 0; padding: 0; color: #000;">

            <!-- ENCABEZADO -->
            <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
                <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">GESTIÓN LLANTERA</div>
                <div style="font-size: 8px; margin-bottom: 1px;">Sistema de Facturación</div>
                <div style="font-size: 8px; margin-bottom: 2px;">Tel: (506) 0000-0000</div>
                <div style="font-size: 9px; font-weight: bold;">FACTURA DE VENTA</div>
                <div style="font-size: 8px;">No. ${factura.numeroFactura || 'N/A'}</div>
            </div>

            <!-- INFORMACIÓN DE TRANSACCIÓN -->
            <div style="margin-bottom: 6px; font-size: 8px;">
                <div>Fecha: ${fecha}</div>
                <div>Hora: ${hora}</div>
                <div>Cliente: ${truncarTexto(totales.cliente?.nombre || totales.cliente?.nombreCliente || factura.nombreCliente || 'Cliente General', 25)}</div>
                <div>Método: ${totales.metodoPago || 'Efectivo'}</div>
                <div>Cajero: ${totales.usuario?.nombre || totales.usuario?.nombreUsuario || factura.usuarioCreadorNombre || 'Sistema'}</div>
            </div>

            <!-- SEPARADOR -->
            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            <!-- PRODUCTOS -->
            <div style="margin-bottom: 6px;">
                <div style="font-size: 8px; font-weight: bold; text-align: center; margin-bottom: 3px;">DETALLE DE PRODUCTOS</div>
                ${productos.map(p => {
                    const nombreTruncado = truncarTexto(p.nombreProducto, 20);
                    const subtotalProducto = p.precioUnitario * p.cantidad;
                    return `
                        <div style="margin-bottom: 2px;">
                            <div style="font-size: 8px;">${nombreTruncado}</div>
                            <div style="font-size: 8px; display: flex; justify-content: space-between;">
                                <span>${p.cantidad} x ₡${p.precioUnitario.toFixed(0)}</span>
                                <span>₡${subtotalProducto.toFixed(0)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- SEPARADOR -->
            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            <!-- TOTALES -->
            <div style="margin-bottom: 8px; font-size: 8px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal:</span>
                    <span>₡${totales.subtotal.toFixed(0)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>IVA (13%):</span>
                    <span>₡${totales.iva.toFixed(0)}</span>
                </div>
                <div style="border-top: 1px solid #000; margin: 3px 0; padding-top: 3px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 9px;">
                        <span>TOTAL:</span>
                        <span>₡${totales.total.toFixed(0)}</span>
                    </div>
                </div>
            </div>

            <!-- PIE DE PÁGINA -->
            <div style="text-align: center; margin-top: 8px; font-size: 8px; border-top: 1px dashed #000; padding-top: 6px;">
                <div style="margin-bottom: 2px;">¡Gracias por su compra!</div>
                <div style="margin-bottom: 2px;">Vuelva pronto</div>
                <div style="margin-bottom: 4px;">www.gestionllantera.com</div>
                <div style="font-size: 7px;">Recibo generado: ${new Date().toLocaleString('es-CR')}</div>
            </div>

            <!-- ESPACIADO FINAL PARA CORTE -->
            <div style="height: 20px;"></div>
        </div>
    `;

    // ✅ CONFIGURACIÓN ESPECÍFICA PARA MINI IMPRESORAS TÉRMICAS
    try {
        console.log('🖨️ Iniciando impresión de recibo térmico...');

        // Crear ventana de impresión con configuración optimizada
        const ventanaImpresion = window.open('', '_blank', 'width=300,height=600,scrollbars=no,resizable=no');

        if (!ventanaImpresion) {
            throw new Error('No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén habilitados.');
        }

        ventanaImpresion.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Recibo Térmico - ${factura.numeroFactura}</title>
                    <meta charset="utf-8">
                    <style>
                        /* CONFIGURACIÓN ESPECÍFICA PARA IMPRESORAS TÉRMICAS */
                        @page {
                            size: 58mm auto; /* Ancho estándar para mini impresoras */
                            margin: 0;
                            padding: 0;
                        }

                        @media screen {
                            body {
                                background: #f5f5f5;
                                padding: 10px;
                                font-family: 'Courier New', 'Consolas', monospace;
                            }
                            #recibo-termica {
                                background: white;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                                padding: 8px;
                                margin: 0 auto;
                            }
                        }

                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                                background: none;
                                -webkit-print-color-adjust: exact;
                                color-adjust: exact;
                            }

                            #recibo-termica {
                                box-shadow: none;
                                padding: 0;
                                margin: 0;
                                page-break-inside: avoid;
                            }

                            /* Optimizar para impresión térmica */
                            * {
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                        }

                        /* Fuente monoespaciada para alineación perfecta */
                        body, * {
                            font-family: 'Courier New', 'Consolas', 'Monaco', monospace !important;
                        }
                    </style>
                </head>
                <body>
                    ${reciboHTML}

                    <script>
                        // Función para imprimir automáticamente
                        function imprimirRecibo() {
                            console.log('🖨️ Iniciando impresión...');

                            // Configurar para impresoras térmicas
                            if (window.chrome) {
                                // Para navegadores basados en Chrome
                                window.print();
                            } else {
                                // Para otros navegadores
                                setTimeout(() => window.print(), 500);
                            }
                        }

                        // Imprimir cuando la página esté completamente cargada
                        if (document.readyState === 'complete') {
                            imprimirRecibo();
                        } else {
                            window.addEventListener('load', imprimirRecibo);
                        }

                        // Cerrar ventana después de intentar imprimir
                        window.addEventListener('afterprint', function() {
                            console.log('🖨️ Impresión completada, cerrando ventana...');
                            setTimeout(() => window.close(), 1000);
                        });

                        // Fallback para cerrar si no se detecta evento afterprint
                        setTimeout(() => {
                            if (!window.closed) {
                                console.log('🖨️ Cerrando ventana por timeout...');
                                window.close();
                            }
                        }, 5000);
                    </script>
                </body>
            </html>
        `);

        ventanaImpresion.document.close();

        // Mostrar mensaje de éxito
        mostrarToast('Impresión', 'Recibo enviado a impresora', 'success');

    } catch (error) {
        console.error('❌ Error al imprimir recibo:', error);
        mostrarToast('Error de Impresión', 'No se pudo imprimir el recibo: ' + error.message, 'danger');

        // Fallback: mostrar el recibo en pantalla para copiar/imprimir manualmente
        mostrarReciboEnPantalla(reciboHTML, factura.numeroFactura);
    }
}

/**
 * Función fallback para mostrar recibo en pantalla si falla la impresión
 */
function mostrarReciboEnPantalla(reciboHTML, numeroFactura) {
    const modalHtml = `
        <div class="modal fade" id="modalReciboFallback" tabindex="-1">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-printer me-2"></i>Recibo de Venta
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div class="alert alert-warning m-2">
                            <small><i class="bi bi-exclamation-triangle me-1"></i>
                            La impresión automática falló. Use los botones de abajo para imprimir.</small>
                        </div>
                        ${reciboHTML}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Cerrar
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.print()">
                            <i class="bi bi-printer me-1"></i>Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalReciboFallback').remove();
    $('body').append(modalHtml);

    const modal = new bootstrap.Modal(document.getElementById('modalReciboFallback'));
    modal.show();
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

    // Validación robusta para imágenes con URL de la API (lógica consistente)
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
                // Lógica robusta de construcción de URLs
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
                                        <i class="bi bi-person-badge me-1"></i>Identificación
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

// ===== FUNCIÓN PARA OBTENER USUARIO ACTUAL =====
function obtenerUsuarioActual() {
    // Intentar obtener el nombre del usuario desde diferentes fuentes
    const nombreUsuario = document.querySelector('[data-usuario-nombre]')?.getAttribute('data-usuario-nombre') ||
                         document.querySelector('.user-name')?.textContent?.trim() ||
                         document.querySelector('#nombreUsuario')?.textContent?.trim() ||
                         'Usuario';

    return {
        nombre: nombreUsuario,
        nombreUsuario: nombreUsuario
    };
}

// ===== FUNCIÓN PARA OBTENER TOKEN JWT =====
function obtenerTokenJWT() {
    // Intentar obtener el token desde localStorage, sessionStorage o cookies
    let token = localStorage.getItem('jwt_token') || 
                sessionStorage.getItem('jwt_token') ||
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken');
    
    // Si no está en storage, intentar desde cookie
    if (!token) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'jwt_token' || name === 'authToken') {
                token = value;
                break;
            }
        }
    }
    
    // Si aún no tenemos token, intentar desde meta tag
    if (!token) {
        const metaToken = document.querySelector('meta[name="auth-token"]');
        if (metaToken) {
            token = metaToken.getAttribute('content');
        }
    }
    
    console.log('🔑 Token JWT obtenido:', token ? 'Presente' : 'No encontrado');
    return token;
}

// ===== FUNCIÓN PARA ACTUALIZAR ESTADO DEL BOTÓN FINALIZAR =====
function actualizarEstadoBotonFinalizar() {
    const tieneProductos = productosEnVenta.length > 0;
    const tieneCliente = clienteSeleccionado !== null;
    const puedeFinalizarVenta = tieneProductos && tieneCliente;
    
    const $btnFinalizar = $('#btnFinalizarVenta');
    
    if (puedeFinalizarVenta) {
        $btnFinalizar.prop('disabled', false)
                    .removeClass('btn-outline-secondary')
                    .addClass('btn-success')
                    .attr('title', 'Finalizar venta');
    } else {
        $btnFinalizar.prop('disabled', true)
                    .removeClass('btn-success')
                    .addClass('btn-outline-secondary');
        
        if (!tieneProductos && !tieneCliente) {
            $btnFinalizar.attr('title', 'Agrega productos y selecciona un cliente');
        } else if (!tieneProductos) {
            $btnFinalizar.attr('title', 'Agrega productos a la venta');
        } else if (!tieneCliente) {
            $btnFinalizar.attr('title', 'Selecciona un cliente para continuar');
        }
    }
    
    console.log('🔄 Estado botón finalizar actualizado:', {
        tieneProductos,
        tieneCliente,
        puedeFinalizarVenta,
        disabled: $btnFinalizar.prop('disabled')
    });
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
window.actualizarEstadoBotonFinalizar = actualizarEstadoBotonFinalizar;