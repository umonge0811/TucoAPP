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

// ===== VARIABLES DE PERMISOS =====
let permisosUsuario = {
    puedeCrearFacturas: false,
    puedeCompletarFacturas: false,
    puedeEditarFacturas: false,
    puedeAnularFacturas: false,
    esAdmin: false
};

// ===== CONTADORES DE DEPURACIÓN =====
let contadorLlamadasBusqueda = 0;
let contadorLlamadasMostrarResultados = 0;
let contadorLlamadasCargandoBusqueda = 0;
let contadorEventosInput = 0;

// ===== CONFIGURACIÓN DE PRECIOS POR MÉTODO DE PAGO =====
const CONFIGURACION_PRECIOS = {
    efectivo: { multiplicador: 1.0, nombre: 'Efectivo', icono: 'bi-cash' },
    transferencia: { multiplicador: 1.0, nombre: 'Transferencia', icono: 'bi-bank' },
    sinpe: { multiplicador: 1.0, nombre: 'SINPE Móvil', icono: 'bi-phone' },
    tarjeta: { multiplicador: 1.09, nombre: 'Tarjeta', icono: 'bi-credit-card' }, // 8% adicional para tarjeta
};

let metodoPagoSeleccionado = 'efectivo'; // Método por defecto
let detallesPagoActuales = []; // Array para manejar múltiples pagos
let esPagoMultiple = false; // Flag para determinar si es pago múltiple

// ===== FUNCIÓN AUXILIAR PARA BUSCAR PERMISOS =====
function buscarPermiso(permisos, nombrePermiso) {
    if (!permisos) return false;

    // Lista de posibles variaciones del nombre del permiso
    const variaciones = [
        nombrePermiso,
        nombrePermiso.replace(/\s+/g, ''), // Sin espacios
        nombrePermiso.toLowerCase(),
        nombrePermiso.toLowerCase().replace(/\s+/g, ''),
        nombrePermiso.replace(/\s+/g, '_'), // Con guiones bajos
        nombrePermiso.replace(/\s+/g, '-'), // Con guiones
        `puede${nombrePermiso.replace(/\s+/g, '')}`, // Con prefijo "puede"
        `puede${nombrePermiso.replace(/\s+/g, '').toLowerCase()}`
    ];

    for (const variacion of variaciones) {
        if (permisos[variacion] === true || permisos[variacion] === 'true') {
            console.log(`✅ Permiso encontrado con variación: "${variacion}" = ${permisos[variacion]}`);
            return true;
        }
    }

    console.log(`❌ Permiso "${nombrePermiso}" no encontrado en ninguna variación`);
    return false;
}

// ===== CARGA DE PERMISOS =====
function cargarPermisosUsuario() {
    try {
        console.log('🔍 === INICIANDO CARGA DE PERMISOS EN FACTURACIÓN ===');
        console.log('🔍 Configuración recibida:', JSON.stringify(window.facturaConfig, null, 2));

        if (!window.facturaConfig || !window.facturaConfig.permisos) {
            throw new Error('No se encontró configuración de permisos');
        }

        const permisos = window.facturaConfig.permisos;
        
        // ✅ MAPEO DIRECTO DE PERMISOS (sin complicaciones)
        permisosUsuario = {
            puedeCrearFacturas: permisos.puedeCrearFacturas === true,
            puedeCompletarFacturas: permisos.puedeCompletarFacturas === true,
            puedeEditarFacturas: permisos.puedeEditarFacturas === true,
            puedeAnularFacturas: permisos.puedeAnularFacturas === true,
            esAdmin: permisos.esAdmin === true
        };

        console.log('🔐 === PERMISOS CARGADOS CORRECTAMENTE ===');
        console.log('🔐 puedeCrearFacturas:', permisosUsuario.puedeCrearFacturas);
        console.log('🔐 puedeCompletarFacturas:', permisosUsuario.puedeCompletarFacturas);
        console.log('🔐 puedeEditarFacturas:', permisosUsuario.puedeEditarFacturas);
        console.log('🔐 puedeAnularFacturas:', permisosUsuario.puedeAnularFacturas);
        console.log('🔐 esAdmin:', permisosUsuario.esAdmin);

        // ✅ CONFIGURAR INTERFAZ SEGÚN PERMISOS
        configurarInterfazSegunPermisos();

    } catch (error) {
        console.error('❌ Error cargando permisos:', error);
        
        // Permisos por defecto en caso de error
        permisosUsuario = {
            puedeCrearFacturas: false,
            puedeCompletarFacturas: false,
            puedeEditarFacturas: false,
            puedeAnularFacturas: false,
            esAdmin: false
        };
        
        console.log('🔧 Permisos de emergencia aplicados:', permisosUsuario);
        configurarInterfazSegunPermisos();
    }
}

function configurarInterfazSegunPermisos() {
    console.log('🎯 === CONFIGURANDO INTERFAZ SEGÚN PERMISOS ===');
    console.log('🎯 Permisos actuales del usuario:', permisosUsuario);
    console.log('🎯 puedeCompletarFacturas:', permisosUsuario.puedeCompletarFacturas, '(tipo:', typeof permisosUsuario.puedeCompletarFacturas, ')');
    console.log('🎯 puedeCrearFacturas:', permisosUsuario.puedeCrearFacturas, '(tipo:', typeof permisosUsuario.puedeCrearFacturas, ')');

    const $btnFinalizar = $('#btnFinalizarVenta');

    if (!$btnFinalizar.length) {
        console.error('❌ No se encontró el botón #btnFinalizarVenta');
        return;
    }

    // Resetear completamente el botón
    $btnFinalizar.prop('disabled', false)
                 .removeClass('btn-secondary btn-success btn-primary btn-warning btn-outline-secondary')
                 .addClass('btn-primary')
                 .removeAttr('title');

    // ✅ VERIFICACIÓN EXPLÍCITA DE PERMISOS CON LOGGING DETALLADO
    const puedeCompletar = permisosUsuario.puedeCompletarFacturas === true;
    const puedeCrear = permisosUsuario.puedeCrearFacturas === true;

    console.log('🎯 Evaluación de permisos:');
    console.log('🎯   - puedeCompletar (CompletarFacturas):', puedeCompletar);
    console.log('🎯   - puedeCrear (CrearFacturas):', puedeCrear);

    if (puedeCompletar) {
        // ✅ USUARIO PUEDE COMPLETAR FACTURAS (CON PERMISO ESPECÍFICO)
        $btnFinalizar.removeClass('btn-primary btn-secondary btn-warning')
                    .addClass('btn-success')
                    .prop('disabled', false)
                    .html(`<i class="bi bi-check-circle me-2"></i>Completar Venta`)
                    .attr('title', 'Procesar venta completa, ajustar stock e imprimir factura');

        console.log('👑 === INTERFAZ CONFIGURADA: USUARIO CON PERMISO COMPLETAR ===');
        console.log('👑 Botón: Verde - "Completar Venta"');
        console.log('👑 Flujo: Factura pagada inmediatamente con ajuste de stock');

    } else if (puedeCrear && !puedeCompletar) {
        // ✅ USUARIO SOLO PUEDE CREAR FACTURAS (COLABORADOR)
        $btnFinalizar.removeClass('btn-success btn-secondary btn-primary')
                    .addClass('btn-warning')
                    .prop('disabled', false)
                    .html(`<i class="bi bi-send me-2"></i>Enviar Factura`)
                    .attr('title', 'Crear factura pendiente y enviar a caja (sin ajuste de stock)');

        console.log('📝 === INTERFAZ CONFIGURADA: COLABORADOR ===');
        console.log('📝 Botón: Amarillo - "Enviar Factura"');
        console.log('📝 Flujo: Factura pendiente SIN ajuste de stock');

    } else {
        // ❌ SIN PERMISOS
        $btnFinalizar.removeClass('btn-primary btn-success btn-warning')
                    .addClass('btn-secondary')
                    .prop('disabled', true)
                    .html(`<i class="bi bi-lock me-2"></i>Sin Permisos`)
                    .attr('title', 'No tienes permisos para procesar ventas');

        console.log('🔒 === INTERFAZ CONFIGURADA: SIN PERMISOS ===');
        console.log('🔒 Botón: Gris - Deshabilitado');
        console.log('🔒 Debug completo de permisos:', {
            puedeCrear: permisosUsuario.puedeCrearFacturas,
            puedeCompletar: permisosUsuario.puedeCompletarFacturas,
            esAdmin: permisosUsuario.esAdmin,
            evaluacionCompletar: puedeCompletar,
            evaluacionCrear: puedeCrear
        });
    }

    // ✅ CONFIGURAR BOTÓN DE FACTURAS PENDIENTES
    const $btnFacturasPendientes = $('#btnFacturasPendientes');
    if (puedeCompletar) {
        $btnFacturasPendientes.show();
        console.log('📋 Botón Facturas Pendientes habilitado para usuario con permisos de completar');
    } else {
        $btnFacturasPendientes.hide();
        console.log('📋 Botón Facturas Pendientes oculto - usuario sin permisos de completar');
    }

    // ✅ VERIFICACIÓN FINAL DEL ESTADO DEL BOTÓN
    setTimeout(() => {
        const estadoFinal = {
            classes: $btnFinalizar.attr('class'),
            disabled: $btnFinalizar.prop('disabled'),
            text: $btnFinalizar.text(),
            title: $btnFinalizar.attr('title')
        };
        console.log('🎯 === ESTADO FINAL DEL BOTÓN FINALIZAR ===');
        console.log('🎯 Clases CSS:', estadoFinal.classes);
        console.log('🎯 Deshabilitado:', estadoFinal.disabled);
        console.log('🎯 Texto:', estadoFinal.text);
        console.log('🎯 Título:', estadoFinal.title);
        console.log('🎯 === FIN CONFIGURACIÓN INTERFAZ ===');
    }, 100);
}

// ===== EXPORTAR FUNCIONES GLOBALMENTE =====
if (typeof window !== 'undefined') {
    window.verDetalleProforma = verDetalleProforma;
    window.imprimirProforma = imprimirProforma;
    window.convertirProformaAFactura = convertirProformaAFactura;
    window.mostrarDetalleProformaModal = mostrarDetalleProformaModal;
    window.verDetalleProducto = verDetalleProducto; // ✅ EXPORTAR FUNCIÓN DE VER DETALLE
    
    console.log('📋 Funciones de proformas y detalles exportadas globalmente');
}

// ===== INICIALIZACIÓN =====
$(document).ready(function() {
    console.log('🚀 Inicializando módulo de facturación');
    inicializarFacturacion();
    inicializarModalInventario();
});

function inicializarFacturacion() {
    console.log('🚀 === INICIO inicializarFacturacion ===');
    try {
        // ✅ CARGAR PERMISOS PRIMERO
        console.log('🔐 Cargando permisos del usuario...');
        cargarPermisosUsuario();

        // Inicializar modales
        console.log('🚀 Inicializando modales...');
        inicializarModales();
        inicializarModalInventario();

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
        console.log('🔍 Botón inventario clickeado - llamando consultarInventario()');
        consultarInventario();
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

    // ===== BOTÓN FACTURAS PENDIENTES =====
    $('#btnFacturasPendientes').on('click', function() {
        abrirFacturasPendientes();
    });

    // ===== BOTÓN PROFORMAS =====
    $('#btnProformas').on('click', function() {
        abrirProformas();
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

    $('#btnGuardarProforma').on('click', function() {
        procesarProforma();
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
                        .map(img => img.urlimagen || img.Urlimagen || img.urlImagen || img.UrlImagen)
                        .filter(url => url && url.trim() !== '');
                    console.log('🖼️ Imágenes desde imagenesProductos:', imagenesArray);
                } 
                // Verificar imagenesUrls como alternativa (ya vienen con URLs completas)
                if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
                    imagenesArray = producto.imagenesUrls.filter(url => url && url.trim() !== '');
                    console.log('🖼️ Imágenes desde imagenesUrls:', imagenesArray);
                }
                // Verificar imagenesProductos (formato principal desde la API)
                else if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
                    imagenesArray = producto.imagenesProductos
                        .map(img => img.urlimagen || img.Urlimagen || img.urlImagen || img.UrlImagen)
                        .filter(url => url && url.trim() !== '');
                    console.log('🖼️ Imágenes desde imagenesProductos:', imagenesArray);
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
                        // Las URLs ya vienen completas desde la API, usar directamente
                        if (urlImagen.startsWith('http://') || urlImagen.startsWith('https://')) {
                            imagenUrl = urlImagen; // URL completa desde la API
                        } else {
                            // Fallback para URLs relativas
                            imagenUrl = urlImagen.startsWith('/') ? 
                                `https://localhost:7273${urlImagen}` : 
                                `https://localhost:7273/${urlImagen}`;
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
                                <div class="producto-card-imagen-container">
                                    ${imagenUrl ? 
                                        `<img src="${imagenUrl}" alt="${nombreEscapado}" class="producto-card-imagen" 
                                              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                                              onload="this.style.opacity='1';" 
                                              style="opacity:0; transition: opacity 0.3s ease;">
                                         <div class="producto-card-sin-imagen" style="display:none;">
                                             <i class="bi bi-image"></i>
                                         </div>` :
                                        `<div class="producto-card-sin-imagen">
                                             <i class="bi bi-image"></i>
                                         </div>`
                                    }
                                </div>
                                <div class="producto-card-body">
                                    <h6 class="producto-card-titulo" title="${nombreEscapado}">
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
                                    <div class="producto-card-acciones">
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
                        <strong>${cliente.nombre}</strong><br><small class="text-muted">${cliente.email}</small>
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
                .filter(url => url && url.trim() !== '');        }

        if (imagenesArray.length > 0) {
            let urlImagen = imagenesArray[0];
            console.log('🖼️ URL original en modal:', urlImagen);

            if (urlImagen && urlImagen.trim() !== '') {
                // Construir URL correcta para el servidor API (puerto 7273 HTTPS)
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
                                                            <td class="text-end fw-bold text-success">₡${formatearMoneda(precio)}</span>
                                                            </td>
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

    // ✅ LIMPIAR TODOS LOS EVENTOS ANTERIORES DEL MODAL ESPECÍFICO
    $('#modalSeleccionProducto').off('.modalProducto');
    $('#modalSeleccionProducto #btnMenosCantidad').off('.modalProducto');
    $('#modalSeleccionProducto #btnMasCantidad').off('.modalProducto');
    $('#modalSeleccionProducto #cantidadProducto').off('.modalProducto');
    $('#modalSeleccionProducto #btnConfirmarAgregarProducto').off('.modalProducto');

    // Eventos de cantidad - CORREGIDOS con namespace específico
    $('#modalSeleccionProducto #btnMenosCantidad').on('click.modalProducto', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const input = $('#modalSeleccionProducto #cantidadProducto');
        const valorActual = parseInt(input.val()) || 1;
        const minimo = parseInt(input.attr('min')) || 1;

        if (valorActual > minimo) {
            input.val(valorActual - 1);
            console.log('➖ Cantidad decrementada a:', valorActual - 1);
        }
    });

    $('#modalSeleccionProducto #btnMasCantidad').on('click.modalProducto', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const input = $('#modalSeleccionProducto #cantidadProducto');
        const valorActual = parseInt(input.val()) || 1;
        const stockDisponible = producto.cantidadEnInventario;

        if (valorActual < stockDisponible) {
            input.val(valorActual + 1);
            console.log('➕ Cantidad incrementada a:', valorActual + 1);
        } else {
            mostrarToast('Stock limitado', `Solo hay ${stockDisponible} unidades disponibles`, 'warning');
        }
    });

    // Validación del input con selector específico
    $('#modalSeleccionProducto #cantidadProducto').on('input.modalProducto', function() {
        const valor = parseInt($(this).val()) || 1;
        const min = parseInt($(this).attr('min')) || 1;
        const max = parseInt($(this).attr('max')) || producto.cantidadEnInventario;

        if (valor < min) {
            $(this).val(min);
        } else if (valor > max) {
            $(this).val(max);
            mostrarToast('Stock limitado', `Solo hay ${max} unidades disponibles`, 'warning');
        }
    }).on('keydown.modalProducto', function(e) {
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

    // ✅ CONFIRMAR AGREGAR PRODUCTO - PREVENIR MÚLTIPLES EJECUCIONES
    $('#modalSeleccionProducto #btnConfirmarAgregarProducto').one('click.modalProducto', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // ✅ DESHABILITAR BOTÓN INMEDIATAMENTE PARA PREVENIR DOBLE CLICK
        const $boton = $(this);
        if ($boton.prop('disabled')) {
            console.log('🛑 Botón ya está deshabilitado, evitando ejecución duplicada');
            return;
        }

        $boton.prop('disabled', true);
        $boton.html('<span class="spinner-border spinner-border-sm me-2"></span>Agregando...');

        const cantidad = parseInt($('#modalSeleccionProducto #cantidadProducto').val()) || 1;

        console.log('🛒 === INICIO AGREGAR PRODUCTO ===');
        console.log('🛒 Producto:', producto.nombreProducto);
        console.log('🛒 Cantidad:', cantidad);
        console.log('🛒 Precio base:', precioBase);
        console.log('🛒 Stock disponible:', producto.cantidadEnInventario);

        // Validar cantidad antes de agregar
        if (cantidad < 1) {
            mostrarToast('Cantidad inválida', 'La cantidad debe ser mayor a 0', 'warning');
            $boton.prop('disabled', false);
            $boton.html('<i class="bi bi-cart-plus me-1"></i>Agregar al Carrito');
            return;
        }

        if (cantidad > producto.cantidadEnInventario) {
            mostrarToast('Stock insuficiente', `Solo hay ${producto.cantidadEnInventario} unidades disponibles`, 'warning');
            $boton.prop('disabled', false);
            $boton.html('<i class="bi bi-cart-plus me-1"></i>Agregar al Carrito');
            return;
        }

        // ✅ AGREGAR PRODUCTO UNA SOLA VEZ
        try {
            agregarProductoAVenta(producto, cantidad, precioBase, 'efectivo');
            console.log('✅ Producto agregado exitosamente');

            // Cerrar modal después de un breve delay
            setTimeout(() => {
                modal.hide();
            }, 300);

        } catch (error) {
            console.error('❌ Error agregando producto:', error);
            mostrarToast('Error', 'No se pudo agregar el producto', 'danger');
            $boton.prop('disabled', false);
            $boton.html('<i class="bi bi-cart-plus me-1"></i>Agregar al Carrito');
        }

        console.log('🛒 === FIN AGREGAR PRODUCTO ===');
    });

    // Limpiar eventos cuando se cierre el modal
    $('#modalSeleccionProducto').on('hidden.bs.modal.modalProducto', function() {
        console.log('🧹 Limpiando eventos del modal de producto');
        $('#modalSeleccionProducto #btnMenosCantidad, #modalSeleccionProducto #btnMasCantidad, #modalSeleccionProducto #cantidadProducto, #modalSeleccionProducto #btnConfirmarAgregarProducto').off('.modalProducto');
        $(this).off('hidden.bs.modal.modalProducto');
        $(this).off('.modalProducto');
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

       /* mostrarToast('Producto agregado', `${producto.nombreProducto} agregado a la venta`, 'success');*/
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
        const configMetodo = CONFIGURACION_PRECIOS[metodoPago] || CONFIGURACION_PRECIOS['efectivo'];

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

async function limpiarVenta() {
    if (productosEnVenta.length === 0) return;

    const confirmacion = await Swal.fire({
        title: '¿Limpiar carrito?',
        text: '¿Estás seguro de que deseas limpiar toda la venta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        productosEnVenta = [];
        clienteSeleccionado = null;
        facturaPendienteActual = null; // ✅ LIMPIAR FACTURA PENDIENTE
        $('#clienteBusqueda').val('');
        $('#clienteSeleccionado').addClass('d-none');
        
        // ✅ LIMPIAR CÓDIGOS DE SEGUIMIENTO Y PRODUCTOS PENDIENTES
        if (window.codigosSeguimientoPendientes) {
            delete window.codigosSeguimientoPendientes;
        }
        if (window.productosPendientesEntrega) {
            delete window.productosPendientesEntrega;
        }
        if (window.facturaConPendientes) {
            delete window.facturaConPendientes;
        }
        
        actualizarVistaCarrito();
        actualizarTotales();

        // ✅ ACTUALIZAR ESTADO DEL BOTÓN FINALIZAR DESPUÉS DE LIMPIAR
        actualizarEstadoBotonFinalizar();
        $('#btnGuardarProforma').show();
        mostrarToast('Venta limpiada', 'Se han removido todos los productos', 'info');
    }
}

// ===== FINALIZACIÓN DE VENTA =====
function mostrarModalFinalizarVenta() {

    // ✅ CERRAR MODAL DE FACTURAS PENDIENTES SI ESTÁ ABIERTO
    const modalFacturasPendientes = bootstrap.Modal.getInstance(document.getElementById('facturasPendientesModal'));
    if (modalFacturasPendientes) {
        modalFacturasPendientes.hide();
        console.log('🚪 Modal de facturas pendientes cerrado antes de abrir modal finalizar');
    }
    if (productosEnVenta.length === 0) {
        mostrarToast('Venta vacía', 'Agrega productos antes de finalizar la venta', 'warning');
        return;
    }

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

    console.log('📋 === DEPURACIÓN CLIENTE SELECCIONADO ===');
    console.log('📋 Cliente completo:', clienteSeleccionado);
    console.log('📋 Propiedades disponibles:', Object.keys(clienteSeleccionado || {}));
    console.log('📋 Factura pendiente actual:', facturaPendienteActual);
    console.log('📋 Proforma original para conversión:', window.proformaOriginalParaConversion);

    // ===== MOSTRAR/OCULTAR INFORMACIÓN DE FACTURA PENDIENTE O CONVERSIÓN DE PROFORMA =====
    if (facturaPendienteActual && facturaPendienteActual.esFacturaPendiente) {
        console.log('📋 Mostrando información de factura pendiente');
        $('#infoFacturaPendiente').show();
        $('#alertaFacturaPendiente').removeClass('alert-info').addClass('alert-warning');
        $('#iconoFacturaPendiente').removeClass('bi-file-earmark-arrow-up').addClass('bi-clock-history');
        $('#tituloFacturaPendiente').text('Completando Factura Pendiente');
        $('#descripcionFacturaPendiente').html(`Número de Factura: <span id="numeroFacturaPendiente" class="fw-bold text-primary">${facturaPendienteActual.numeroFactura || 'N/A'}</span>`);
        $('#iconoDerechaFacturaPendiente').removeClass('bi-file-earmark-arrow-up text-info').addClass('bi-receipt text-warning');
    } else if (window.proformaOriginalParaConversion) {
        console.log('📋 Mostrando información de conversión de proforma');
        $('#infoFacturaPendiente').show();
        $('#alertaFacturaPendiente').removeClass('alert-warning').addClass('alert-info');
        $('#iconoFacturaPendiente').removeClass('bi-clock-history').addClass('bi-file-earmark-arrow-up');
        $('#tituloFacturaPendiente').text('Convirtiendo Proforma a Factura');
        $('#descripcionFacturaPendiente').html(`Proforma origen: <span id="numeroFacturaPendiente" class="fw-bold text-primary">${window.proformaOriginalParaConversion.numeroProforma || 'N/A'}</span>`);
        $('#iconoDerechaFacturaPendiente').removeClass('bi-receipt text-warning').addClass('bi-file-earmark-arrow-up text-info');
    } else {
        console.log('📋 Ocultando información especial');
        $('#infoFacturaPendiente').hide();
        $('#numeroFacturaPendiente').text('');
    }

    // ===== CONFIGURAR MODAL SEGÚN PERMISOS =====
    configurarModalSegunPermisos();

    // ===== LLENAR INFORMACIÓN DEL CLIENTE EN EL RESUMEN =====
    const nombreCliente = clienteSeleccionado.nombre ||
        clienteSeleccionado.nombreCliente ||
        'Cliente';
    const emailCliente = clienteSeleccionado.email ||
        clienteSeleccionado.emailCliente ||
        'Sin email';

    $('#resumenNombreCliente').text(nombreCliente);
    $('#resumenEmailCliente').text(emailCliente);

    // ===== LLENAR CAMPOS DEL FORMULARIO CON MAPEO EXHAUSTIVO =====
    const datosCliente = {
        nombre: clienteSeleccionado.nombre ||
            clienteSeleccionado.nombreCliente ||
            clienteSeleccionado.NombreCliente || '',

        cedula: clienteSeleccionado.identificacion ||
            clienteSeleccionado.identificacionCliente ||
            clienteSeleccionado.cedula ||
            clienteSeleccionado.contacto ||
            clienteSeleccionado.Contacto || '',

        telefono: clienteSeleccionado.telefono ||
            clienteSeleccionado.telefonoCliente ||
            clienteSeleccionado.TelefonoCliente ||
            clienteSeleccionado.Telefono || '',

        email: clienteSeleccionado.email ||
            clienteSeleccionado.emailCliente ||
            clienteSeleccionado.EmailCliente ||
            clienteSeleccionado.Email || '',

        direccion: clienteSeleccionado.direccion ||
            clienteSeleccionado.direccionCliente ||
            clienteSeleccionado.DireccionCliente ||
            clienteSeleccionado.Direccion || ''
    };

    console.log('📋 Datos mapeados para formulario:', datosCliente);

    // Llenar campos del formulario
    $('#clienteNombre').val(datosCliente.nombre);
    $('#clienteCedula').val(datosCliente.cedula);
    $('#clienteTelefono').val(datosCliente.telefono);
    $('#clienteEmail').val(datosCliente.email);
    $('#clienteDireccion').val(datosCliente.direccion);

    // ===== CONFIGURAR MÉTODO DE PAGO INICIAL =====
    $('input[name="metodoPago"][value="efectivo"]').prop('checked', true);

    // ===== INICIALIZAR PAGOS MÚLTIPLES =====
    detallesPagoActuales = [];
    esPagoMultiple = false;
    $('#pagoMultipleContainer').hide();
    $('#pagoSimpleContainer').show();

    // ===== CONFIGURAR OBSERVACIONES AUTOMÁTICAS PARA CONVERSIÓN DE PROFORMA =====
    if (window.proformaOriginalParaConversion) {
        $('#observacionesVenta').val(`Convertido desde proforma ${window.proformaOriginalParaConversion.numeroProforma}`);
    } else {
        $('#observacionesVenta').val('');
    }

    // ===== ACTUALIZAR RESUMEN CON MÉTODO DE PAGO INICIAL =====
    actualizarResumenVentaModal();

    // ===== CONFIGURAR EVENTOS DEL MODAL =====
    configurarEventosModalFinalizar();

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

function configurarModalSegunPermisos() {
    const $btnConfirmar = $('#btnConfirmarVenta');
    const $textoBoton = $('#textoBotonConfirmar');
    const $tituloModal = $('#modalFinalizarVentaLabel');
    const $btnGuardarProforma = $('#btnGuardarProforma'); // ✅ AGREGAR ESTA LÍNEA

    console.log('🎯 === CONFIGURANDO MODAL SEGÚN PERMISOS ===');
    console.log('🎯 Permisos del usuario:', permisosUsuario);
    console.log('🎯 puedeCompletarFacturas:', permisosUsuario.puedeCompletarFacturas);
    console.log('🎯 puedeCrearFacturas:', permisosUsuario.puedeCrearFacturas);
    console.log('🎯 esAdmin:', permisosUsuario.esAdmin);
    console.log('🎯 Es conversión de proforma:', !!window.proformaOriginalParaConversion);
    console.log('🎯 Es factura pendiente:', !!(facturaPendienteActual && facturaPendienteActual.esFacturaPendiente)); // ✅ AGREGAR ESTA LÍNEA

    // Resetear el botón completamente
    $btnConfirmar.removeClass('btn-warning btn-secondary btn-info btn-success btn-primary').prop('disabled', false);

    // ✅ AGREGAR LÓGICA PARA OCULTAR BOTÓN DE PROFORMA
    if (facturaPendienteActual && facturaPendienteActual.esFacturaPendiente) {
        // Si es una factura pendiente, ocultar botón de proforma
        $btnGuardarProforma.hide();
        console.log('🎯 Botón de proforma ocultado - Es factura pendiente');
    } else {
        // Si no es factura pendiente, mostrar botón de proforma
        $btnGuardarProforma.show();
        console.log('🎯 Botón de proforma mostrado - No es factura pendiente');
    }

    // ===== DETERMINAR TÍTULO Y COMPORTAMIENTO SEGÚN EL CONTEXTO =====
    if (window.proformaOriginalParaConversion) {
        // ✅ CONVERSIÓN DE PROFORMA A FACTURA
        $tituloModal.html('<i class="bi bi-file-earmark-arrow-up me-2"></i>Convertir Proforma a Factura');
        // Ocultar botón de proforma también en conversiones
        $btnGuardarProforma.hide();

        if (permisosUsuario.puedeCompletarFacturas || permisosUsuario.esAdmin) {
            $btnConfirmar.addClass('btn-success');
            $textoBoton.text('Convertir y Completar');
            $btnConfirmar.attr('title', 'Convertir proforma a factura, procesar pago y ajustar stock');
        } else if (permisosUsuario.puedeCrearFacturas) {
            $btnConfirmar.addClass('btn-warning');
            $textoBoton.text('Convertir y Enviar a Caja');
            $btnConfirmar.attr('title', 'Convertir proforma a factura pendiente de pago');
        }

        console.log('📄 Modal configurado para conversión de proforma');

    } else if (permisosUsuario.puedeCompletarFacturas || permisosUsuario.esAdmin) {
        // ✅ USUARIO PUEDE COMPLETAR FACTURAS - PROCESAR PAGO INMEDIATAMENTE
        $tituloModal.html('<i class="bi bi-check-circle me-2"></i>Finalizar Venta Completa');
        $btnConfirmar.addClass('btn-success');
        $textoBoton.text('Completar y Pagar');
        $btnConfirmar.attr('title', 'Procesar venta completa, marcar como pagada, ajustar stock e imprimir factura');

        console.log('👑 Modal configurado para administrador/cajero - Venta completa con ajuste de stock');

    } else if (permisosUsuario.puedeCrearFacturas && !permisosUsuario.puedeCompletarFacturas) {
        // ✅ USUARIO SOLO PUEDE CREAR FACTURAS - ENVIAR A CAJA (SIN AJUSTE DE STOCK)
        $tituloModal.html('<i class="bi bi-send me-2"></i>Enviar Factura a Caja');
        $btnConfirmar.addClass('btn-warning');
        $textoBoton.text('Enviar a Caja');
        $btnConfirmar.attr('title', 'Crear factura pendiente y enviar a caja para procesamiento de pago (sin ajuste de stock)');

        console.log('📝 Modal configurado para colaborador - Envío a caja SIN ajuste de stock');

        // ✅ AGREGAR MENSAJE INFORMATIVO EN EL MODAL PARA COLABORADORES
        const $infoColaborador = $('#infoColaboradorModal');
        if ($infoColaborador.length === 0) {
            const alertaInfo = `
                <div id="infoColaboradorModal" class="alert alert-info mt-3">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Modo Colaborador:</strong> Esta factura será enviada a caja para procesamiento. 
                    El stock se ajustará cuando el cajero complete el pago.
                </div>
            `;
            $('#modalFinalizarVenta .modal-body').append(alertaInfo);
        }

    } else {
        // ❌ SIN PERMISOS
        $tituloModal.html('<i class="bi bi-lock me-2"></i>Sin Permisos');
        $btnConfirmar.addClass('btn-secondary').prop('disabled', true);
        $textoBoton.text('Sin Permisos');
        $btnConfirmar.attr('title', 'No tienes permisos para procesar ventas');

        console.log('🔒 Modal configurado sin permisos');
    }

    // ✅ VERIFICACIÓN FINAL DEL ESTADO DEL BOTÓN
    setTimeout(() => {
        const estadoFinal = {
            classes: $btnConfirmar.attr('class'),
            disabled: $btnConfirmar.prop('disabled'),
            text: $btnConfirmar.text(),
            title: $btnConfirmar.attr('title'),
            proformaVisible: $btnGuardarProforma.is(':visible') // ✅ AGREGAR ESTA LÍNEA
        };
        console.log('🎯 === ESTADO FINAL DEL BOTÓN FINALIZAR ===');
        console.log('🎯 Clases CSS:', estadoFinal.classes);
        console.log('🎯 Deshabilitado:', estadoFinal.disabled);
        console.log('🎯 Texto:', estadoFinal.text);
        console.log('🎯 Título:', estadoFinal.title);
        console.log('🎯 Botón Proforma Visible:', estadoFinal.proformaVisible); // ✅ AGREGAR ESTA LÍNEA
        console.log('🎯 === FIN CONFIGURACIÓN INTERFAZ ===');
    }, 100);
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
    $('#btnPagoMultiple').off('click.modalFinalizar');
    $('#btnPagoSimple').off('click.modalFinalizar');

    // Configurar eventos de método de pago
    $('input[name="metodoPago"]').on('change.modalFinalizar', function() {
        if (!esPagoMultiple) {
            actualizarResumenVentaModal();
        }
    });

    // Configurar evento de cambio en efectivo recibido
    $('#efectivoRecibido').on('input.modalFinalizar', function() {
        calcularCambioModal();
    });
    
    // Configurar botones de pago múltiple/simple
    $('#btnPagoMultiple').on('click.modalFinalizar', function() {
        activarPagoMultiple();
    });
    
    $('#btnPagoSimple').on('click.modalFinalizar', function() {
        activarPagoSimple();
    });
}

// ===== FUNCIONES PARA PAGOS MÚLTIPLES =====
function activarPagoMultiple() {
    esPagoMultiple = true;
    $('#pagoSimpleContainer').hide();
    $('#pagoMultipleContainer').show();
    $('#btnPagoMultiple').addClass('active');
    $('#btnPagoSimple').removeClass('active');
    
    // Inicializar con el total completo si no hay pagos
    if (detallesPagoActuales.length === 0) {
        const total = calcularTotalFactura();
        inicializarPagoMultiple(total);
    }
    
    actualizarVistaPagosMultiples();
}

function activarPagoSimple() {
    esPagoMultiple = false;
    detallesPagoActuales = [];
    $('#pagoMultipleContainer').hide();
    $('#pagoSimpleContainer').show();
    $('#btnPagoSimple').addClass('active');
    $('#btnPagoMultiple').removeClass('active');
    
    actualizarResumenVentaModal();
}

function inicializarPagoMultiple(totalFactura) {
    detallesPagoActuales = [{
        metodoPago: 'efectivo',
        monto: totalFactura,
        referencia: '',
        observaciones: ''
    }];
}

function agregarNuevoPago() {
    const montoRestante = calcularMontoRestante();
    if (montoRestante <= 0) {
        mostrarToast('Pago completo', 'El total de la factura ya está cubierto', 'warning');
        return;
    }
    
    detallesPagoActuales.push({
        metodoPago: 'efectivo',
        monto: montoRestante,
        referencia: '',
        observaciones: ''
    });
    
    actualizarVistaPagosMultiples();
}

function eliminarPago(index) {
    if (detallesPagoActuales.length <= 1) {
        mostrarToast('Error', 'Debe haber al menos un método de pago', 'warning');
        return;
    }
    
    detallesPagoActuales.splice(index, 1);
    actualizarVistaPagosMultiples();
}

function actualizarVistaPagosMultiples() {
    const container = $('#pagoMultiplesList');
    const totalFactura = calcularTotalFactura();
    
    let html = '';
    detallesPagoActuales.forEach((pago, index) => {
        const config = CONFIGURACION_PRECIOS[pago.metodoPago] || CONFIGURACION_PRECIOS.efectivo;
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="card-title mb-0">
                            <i class="${config.icono} me-2"></i>Pago ${index + 1}
                        </h6>
                        ${detallesPagoActuales.length > 1 ? 
                            `<button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarPago(${index})">
                                <i class="bi bi-trash"></i>
                            </button>` : ''}
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Método de Pago</label>
                            <select class="form-select metodo-pago-multiple" data-index="${index}">
                                ${Object.entries(CONFIGURACION_PRECIOS).map(([key, value]) => 
                                    `<option value="${key}" ${pago.metodoPago === key ? 'selected' : ''}>
                                        ${value.nombre}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Monto</label>
                            <div class="input-group">
                                <span class="input-group-text">₡</span>
                                <input type="number" 
                                       class="form-control monto-pago-multiple" 
                                       data-index="${index}"
                                       value="${pago.monto.toFixed(2)}" 
                                       min="0.01" 
                                       max="${totalFactura}" 
                                       step="0.01">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <label class="form-label">Referencia</label>
                            <input type="text" 
                                   class="form-control referencia-pago-multiple" 
                                   data-index="${index}"
                                   value="${pago.referencia || ''}" 
                                   placeholder="Ej: Voucher, Transferencia #123">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Observaciones</label>
                            <input type="text" 
                                   class="form-control observaciones-pago-multiple" 
                                   data-index="${index}"
                                   value="${pago.observaciones || ''}" 
                                   placeholder="Opcional">
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
    
    // Configurar eventos para los nuevos elementos
    $('.metodo-pago-multiple').on('change', function() {
        const index = $(this).data('index');
        detallesPagoActuales[index].metodoPago = $(this).val();
        actualizarResumenPagosMultiples();
    });
    
    $('.monto-pago-multiple').on('input', function() {
        const index = $(this).data('index');
        detallesPagoActuales[index].monto = parseFloat($(this).val()) || 0;
        actualizarResumenPagosMultiples();
    });
    
    $('.referencia-pago-multiple').on('input', function() {
        const index = $(this).data('index');
        detallesPagoActuales[index].referencia = $(this).val();
    });
    
    $('.observaciones-pago-multiple').on('input', function() {
        const index = $(this).data('index');
        detallesPagoActuales[index].observaciones = $(this).val();
    });
    
    actualizarResumenPagosMultiples();
}

function actualizarResumenPagosMultiples() {
    const totalFactura = calcularTotalFactura();
    const totalPagado = detallesPagoActuales.reduce((sum, pago) => sum + pago.monto, 0);
    const montoRestante = totalFactura - totalPagado;
    
    $('#totalFacturaMultiple').text(`₡${formatearMoneda(totalFactura)}`);
    $('#totalPagadoMultiple').text(`₡${formatearMoneda(totalPagado)}`);
    $('#montoRestanteMultiple').text(`₡${formatearMoneda(montoRestante)}`);
    
    // Cambiar color según si está completo o no
    if (montoRestante < 0) {
        $('#montoRestanteMultiple').removeClass('text-success text-warning').addClass('text-danger');
        $('#estadoPagoMultiple').html('<span class="badge bg-danger">Excede el total</span>');
    } else if (montoRestante === 0) {
        $('#montoRestanteMultiple').removeClass('text-danger text-warning').addClass('text-success');
        $('#estadoPagoMultiple').html('<span class="badge bg-success">Pago completo</span>');
    } else {
        $('#montoRestanteMultiple').removeClass('text-danger text-success').addClass('text-warning');
        $('#estadoPagoMultiple').html('<span class="badge bg-warning">Pago pendiente</span>');
    }
    
    // Habilitar/deshabilitar botón de agregar pago
    $('#btnAgregarPago').prop('disabled', montoRestante <= 0);
    
    // Habilitar/deshabilitar botón de confirmar
    $('#btnConfirmarVenta').prop('disabled', montoRestante !== 0);
}

function calcularTotalFactura() {
    const metodoBase = esPagoMultiple ? 'efectivo' : ($('input[name="metodoPago"]:checked').val() || 'efectivo');
    const configMetodo = CONFIGURACION_PRECIOS[metodoBase];
    
    let subtotal = 0;
    productosEnVenta.forEach(producto => {
        const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
        subtotal += precioAjustado * producto.cantidad;
    });
    
    const iva = subtotal * 0.13;
    return subtotal + iva;
}

function calcularMontoRestante() {
    const totalFactura = calcularTotalFactura();
    const totalPagado = detallesPagoActuales.reduce((sum, pago) => sum + pago.monto, 0);
    return Math.max(0, totalFactura - totalPagado);
}

function validarPagosMultiples() {
    if (!esPagoMultiple) return true;
    
    const totalFactura = calcularTotalFactura();
    const totalPagado = detallesPagoActuales.reduce((sum, pago) => sum + pago.monto, 0);
    
    if (Math.abs(totalFactura - totalPagado) > 0.01) {
        mostrarToast('Error de pago', 'El total de los pagos no coincide con el total de la factura', 'danger');
        return false;
    }
    
    for (let i = 0; i < detallesPagoActuales.length; i++) {
        const pago = detallesPagoActuales[i];
        if (pago.monto <= 0) {
            mostrarToast('Error de pago', `El monto del pago ${i + 1} debe ser mayor a 0`, 'danger');
            return false;
        }
    }
    
    return true;
}

async function procesarVentaFinal() {
    const $btnFinalizar = $('#btnConfirmarVenta');

    try {
        $btnFinalizar.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...');

        console.log('🔍 === PROCESANDO VENTA FINAL ===');

        const esFacturaPendiente = productosEnVenta.some(p => p.facturaId);
        const facturaId = esFacturaPendiente ? productosEnVenta[0].facturaId : null;

        console.log('🔍 Es factura pendiente:', esFacturaPendiente);
        console.log('🔍 Factura ID:', facturaId);

        if (esFacturaPendiente && facturaId) {
            // ✅ COMPLETAR FACTURA EXISTENTE
            console.log('✅ Completando factura pendiente ID:', facturaId);
            await completarFacturaExistente(facturaId);
        } else {
            // ✅ CREAR NUEVA FACTURA NORMAL
            console.log('🆕 Creando nueva factura');
            await crearNuevaFactura();
        }

    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error procesando la venta',
                text: 'Hubo un problema inesperado al procesar la venta',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc3545'
            });
        } else {
            alert('Error: Hubo un problema procesando la venta');
        }
    } finally {
        $btnFinalizar.prop('disabled', false).html('<i class="bi bi-check-circle me-2"></i>Finalizar Venta');
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Completar factura existente
 */
async function completarFacturaExistente(facturaId) {
    try {
        console.log('💰 === COMPLETANDO FACTURA EXISTENTE ===');
        console.log('💰 Factura ID:', facturaId);

        // ✅ VALIDACIÓN INICIAL
        //if (!facturaId) {
        //    console.error('❌ FacturaId es requerido');
        //    mostrarToast('Error', 'ID de factura no válido', 'danger');
        //    return;
        //}


        const metodoPagoSeleccionado = $('input[name="metodoPago"]:checked').val() || 'efectivo';
        
        // ✅ DATOS COMPLETOS Y VALIDADOS PARA EL CONTROLADOR (SOLO FACTURAS PENDIENTES)
        const datosCompletamiento = {
            facturaId: parseInt(facturaId), // Asegurar que sea número
            metodoPago: esPagoMultiple ? 'Multiple' : metodoPagoSeleccionado,
            observaciones: $('#observacionesVenta').val() || '',
            forzarVerificacionStock: false,
            esProforma: false // Esta función solo maneja facturas pendientes
        };

        // ✅ AGREGAR DETALLES DE PAGO SOLO SI ES PAGO MÚLTIPLE
        if (esPagoMultiple && detallesPagoActuales && detallesPagoActuales.length > 0) {
            datosCompletamiento.detallesPago = detallesPagoActuales.map(pago => ({
                metodoPago: pago.metodoPago,
                monto: pago.monto,
                referencia: pago.referencia || '',
                observaciones: pago.observaciones || '',
                fechaPago: new Date().toISOString()
            }));
        }

        console.log('📋 Datos de completamiento para factura pendiente:', datosCompletamiento);

        console.log('📋 Datos de completamiento:', datosCompletamiento);

        const response = await fetch('/Facturacion/CompletarFactura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosCompletamiento),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Factura completada exitosamente:', result);
            
            // ✅ PRESERVAR INFORMACIÓN COMPLETA DE FACTURA ANTES DE PROCESAR
            console.log('📋 === PRESERVANDO INFORMACIÓN DE FACTURA PARA RECIBO ===');
            if (facturaPendienteActual) {
                window.facturaParaRecibo = {
                    numeroFactura: facturaPendienteActual.numeroFactura || `FAC-${facturaId}`,
                    nombreCliente: facturaPendienteActual.nombreCliente || 
                                  facturaPendienteActual.NombreCliente ||
                                  clienteSeleccionado?.nombre || 
                                  clienteSeleccionado?.nombreCliente ||
                                  'Cliente General',
                    usuarioCreadorNombre: facturaPendienteActual.usuarioCreadorNombre ||
                                         facturaPendienteActual.UsuarioCreadorNombre ||
                                         obtenerUsuarioActual()?.nombre ||
                                         'Sistema'
                };
                console.log('📋 Información preservada:', window.facturaParaRecibo);
            }
            
            // ✅ REGISTRAR PRODUCTOS PENDIENTES SI EXISTEN
            if (window.productosPendientesEntrega && window.productosPendientesEntrega.length > 0) {
                console.log('📦 === REGISTRANDO PRODUCTOS PENDIENTES DESPUÉS DE COMPLETAR FACTURA ===');
                console.log('📦 Productos pendientes:', window.productosPendientesEntrega);
                console.log('📦 Factura completada ID:', facturaId);
                
                await registrarProductosPendientesEntrega(facturaId, window.productosPendientesEntrega);
            }
            
            // ✅ GUARDAR PRODUCTOS ACTUALES ANTES DE LIMPIAR PARA EL RECIBO
            const productosParaRecibo = [...productosEnVenta];
            
            // ✅ CERRAR MODAL INMEDIATAMENTE
            modalFinalizarVenta.hide();
            
            // ✅ GENERAR E IMPRIMIR RECIBO ANTES DE LIMPIAR CON DATOS COMPLETOS
            console.log('🖨️ Llamando a generarReciboFacturaCompletada con:', {
                result: result,
                productos: productosParaRecibo.length,
                metodoPago: metodoPagoSeleccionado,
                facturaPendiente: facturaPendienteActual
            });
            
            generarReciboFacturaCompletada(result, productosParaRecibo, metodoPagoSeleccionado);
            
            // ✅ LIMPIAR CARRITO COMPLETAMENTE
            productosEnVenta = [];
            clienteSeleccionado = null;
            facturaPendienteActual = null; // ✅ LIMPIAR FACTURA PENDIENTE
            $('#clienteBusqueda').val('');
            $('#clienteSeleccionado').addClass('d-none');
            actualizarVistaCarrito();
            actualizarTotales();
            actualizarEstadoBotonFinalizar();
            
            // ✅ LIMPIAR VARIABLES DE PRODUCTOS PENDIENTES
            if (window.productosPendientesEntrega) {
                delete window.productosPendientesEntrega;
            }
            if (window.facturaConPendientes) {
                delete window.facturaConPendientes;
            }

            // ✅ LIMPIAR ESTADO DE BÚSQUEDA PARA FORZAR ACTUALIZACIÓN
            window.lastProductsHash = null;
            ultimaBusqueda = '';
            busquedaEnProceso = false;
            cargaInicialCompletada = false;

            // ✅ ACTUALIZAR VISTA DE PRODUCTOS
            await actualizarVistaProductosPostAjuste();

            // ✅ MOSTRAR SWEETALERT DE CONFIRMACIÓN
            Swal.fire({
                icon: 'success',
                title: '¡Factura Completada!',
                text: `La factura ha sido completada exitosamente y marcada como pagada`,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#28a745',
                timer: 4000,
                timerProgressBar: true,
                showConfirmButton: true
            });

        } else {
            throw new Error(result.message || 'Error al completar la factura');
        }

    } catch (error) {
        console.error('❌ Error completando factura existente:', error);
        throw error;
    }
}

async function crearNuevaFactura(tipoDocumento = 'Factura') {
    try {
        console.log('🆕 === CREANDO NUEVO DOCUMENTO ===');
        console.log('🆕 Tipo de documento:', tipoDocumento);
        console.log('🆕 Es conversión de proforma:', !!window.proformaOriginalParaConversion);
        
        // ✅ NOTA: Esta función maneja:
        // - Creación de facturas normales
        // - Creación de proformas 
        // - Conversión de proformas a facturas (marca automáticamente la proforma como "Facturada")
        // Preparar datos de la venta con método de pago seleccionado
        const metodoPagoSeleccionado = esPagoMultiple ? 'multiple' : ($('input[name="metodoPago"]:checked').val() || 'efectivo');
        const configMetodo = esPagoMultiple ? CONFIGURACION_PRECIOS.efectivo : CONFIGURACION_PRECIOS[metodoPagoSeleccionado];
        // Validar pagos múltiples si es necesario
        if (esPagoMultiple && !validarPagosMultiples()) {
            return;
        }
        let subtotal = 0;
        productosEnVenta.forEach(producto => {
            const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
            subtotal += precioAjustado * producto.cantidad;
        });
        const iva = subtotal * 0.13;
        const total = subtotal + iva;
        // ✅ DETERMINAR ESTADO Y PERMISOS SEGÚN EL TIPO DE DOCUMENTO
        let estadoFactura, mensajeExito, debeImprimir, debeAjustarInventario;
        let fechaVencimiento = null;
        console.log('🔐 === VERIFICACIÓN DE PERMISOS ===');
        console.log('🔐 puedeCompletarFacturas:', permisosUsuario.puedeCompletarFacturas);
        console.log('🔐 puedeCrearFacturas:', permisosUsuario.puedeCrearFacturas);
        console.log('🔐 tipoDocumento:', tipoDocumento);
        if (tipoDocumento === 'Proforma') {
            // ✅ PROFORMAS: Siempre estado "Vigente" con fecha de vencimiento
            estadoFactura = 'Vigente';
            mensajeExito = 'Proforma creada exitosamente';
            debeImprimir = true;
            debeAjustarInventario = false; // Las proformas NO ajustan inventario
            // ✅ CALCULAR FECHA DE VENCIMIENTO (30 días desde hoy)
            const fechaActual = new Date();
            fechaVencimiento = new Date(fechaActual.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 días
            console.log('📋 Creando proforma con estado VIGENTE');
            console.log('📅 Fecha de vencimiento calculada:', fechaVencimiento);
        } else if (permisosUsuario.puedeCompletarFacturas) {
            // ✅ USUARIOS CON PERMISO COMPLETAR: Venta completa e inmediata
            estadoFactura = 'Pagada';
            mensajeExito = 'Venta procesada exitosamente y marcada como pagada';
            debeImprimir = true;
            debeAjustarInventario = true;
            console.log('👑 Procesando con permiso CompletarFacturas - Factura pagada inmediatamente con ajuste de stock');
        } else if (permisosUsuario.puedeCrearFacturas) {
            // ✅ COLABORADORES: Factura pendiente para caja SIN AJUSTE DE STOCK
            estadoFactura = 'Pendiente';
            mensajeExito = 'Factura creada y enviada a Cajas para procesamiento de pago';
            debeImprimir = false;
            debeAjustarInventario = false; // ✅ CRUCIAL: NO ajustar stock para colaboradores
            console.log('📝 Procesando como colaborador - Factura pendiente para caja SIN ajuste de stock');
        } else {
            // ❌ SIN PERMISOS: No debería llegar aquí, pero como fallback
            throw new Error('No tienes permisos para procesar ventas');
        }
        console.log('📋 Estado determinado:', {
            tipoDocumento,
            estadoFactura,
            fechaVencimiento,
            debeImprimir,
            debeAjustarInventario,
            permisos: permisosUsuario
        });
        // Obtener información del usuario actual
        const usuarioActual = obtenerUsuarioActual();
        const usuarioId = usuarioActual?.usuarioId || usuarioActual?.id || 1;
        console.log('👤 Usuario actual para documento:', {
            usuario: usuarioActual,
            usuarioId: usuarioId
        });
        // ✅ CAPTURAR PRODUCTOS PENDIENTES DESDE LAS VARIABLES GLOBALES (solo para facturas)
        let productosPendientesParaEnvio = [];
        let tieneProductosPendientes = false;
        if (tipoDocumento === 'Factura' && window.productosPendientesEntrega && window.productosPendientesEntrega.length > 0) {
            console.log('📦 Productos pendientes detectados:', window.productosPendientesEntrega);
            productosPendientesParaEnvio = window.productosPendientesEntrega.map(producto => ({
                productoId: producto.productoId,
                nombreProducto: producto.nombreProducto || 'Sin nombre',
                cantidadSolicitada: producto.cantidadRequerida || producto.cantidadSolicitada || producto.cantidad || 0,
                cantidadPendiente: producto.cantidadPendiente || Math.max(0, (producto.cantidadRequerida || 0) - (producto.stockDisponible || 0)),
                stockDisponible: producto.stockDisponible || 0,
                precioUnitario: producto.precioUnitario || 0,
                observaciones: `Stock insuficiente al momento de la facturación`
            }));
            tieneProductosPendientes = true;
        }
        // ✅ CONSTRUIR OBSERVACIONES DINÁMICAMENTE
        let observacionesFinal = $('#observacionesVenta').val() || '';

        // Si es conversión de proforma, agregar información en observaciones
        if (window.proformaOriginalParaConversion) {
            const numeroProforma = window.proformaOriginalParaConversion.numeroProforma;
            const textoProforma = `Convertido desde proforma ${numeroProforma}`;

            if (observacionesFinal && !observacionesFinal.includes(textoProforma)) {
                observacionesFinal = `${observacionesFinal}. ${textoProforma}`;
            } else if (!observacionesFinal) {
                observacionesFinal = textoProforma;
            }

            console.log('📝 Observaciones con información de proforma:', observacionesFinal);
        }
        // Crear objeto de factura para enviar a la API
        const facturaData = {
            clienteId: clienteSeleccionado?.clienteId || clienteSeleccionado?.id || null,
            nombreCliente: clienteSeleccionado?.nombre || 'Cliente General',
            identificacionCliente: clienteSeleccionado?.identificacion || '',
            telefonoCliente: clienteSeleccionado?.telefono || '',
            emailCliente: clienteSeleccionado?.email || '',
            direccionCliente: clienteSeleccionado?.direccion || '',
            fechaFactura: new Date().toISOString(),
            fechaVencimiento: fechaVencimiento ? fechaVencimiento.toISOString() : null,
            subtotal: subtotal,
            descuentoGeneral: 0,
            porcentajeImpuesto: 13,
            montoImpuesto: iva,
            total: total,
            estado: estadoFactura,
            tipoDocumento: tipoDocumento,
            metodoPago: metodoPagoSeleccionado,
            observaciones: observacionesFinal, // ✅ USAR OBSERVACIONES CONSTRUIDAS DINÁMICAMENTE
            usuarioCreadorId: usuarioId,
            // ✅ INCLUIR PRODUCTOS PENDIENTES SI EXISTEN (solo para facturas)
            productosPendientesEntrega: productosPendientesParaEnvio,
            tieneProductosPendientes: tieneProductosPendientes,
            detallesPago: esPagoMultiple ? detallesPagoActuales.map(pago => ({
                metodoPago: pago.metodoPago,
                monto: pago.monto,
                referencia: pago.referencia || '',
                observaciones: pago.observaciones || '',
                fechaPago: new Date().toISOString()
            })) : [],
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
        console.log('📋 Datos de documento preparados:', facturaData);
        // Crear la factura/proforma
        const response = await fetch('/Facturacion/CrearFactura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(facturaData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor al crear documento:', errorText);
            throw new Error(`Error al crear el documento: ${response.status} - ${errorText}`);
        }
        const resultadoFactura = await response.json();
        console.log('✅ Documento creado:', resultadoFactura);
        if (resultadoFactura.success) {
            // ✅ MARCAR PROFORMA COMO FACTURADA SI ES UNA CONVERSIÓN
            if (window.proformaOriginalParaConversion) {
                console.log('🔄 === MARCANDO PROFORMA COMO FACTURADA ===');
                console.log('🔄 Proforma original:', window.proformaOriginalParaConversion);
                
                // ✅ VALIDAR QUE TENEMOS EL ID DE LA PROFORMA
                const proformaId = window.proformaOriginalParaConversion.proformaId || window.proformaOriginalParaConversion.facturaId;
                console.log('🔄 ID de proforma a marcar:', proformaId);
                
                if (!proformaId) {
                    console.error('❌ No se pudo obtener el ID de la proforma para marcar como facturada');
                } else {
                    try {
                        const responseConversion = await fetch(`/Facturacion/MarcarProformaFacturada?proformaId=${proformaId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({})
                        });
                        
                        const responseText = await responseConversion.text();
                        console.log('🔄 Respuesta del servidor:', responseText);
                        
                        if (responseConversion.ok) {
                            const resultadoConversion = JSON.parse(responseText);
                            console.log('✅ Proforma marcada como facturada exitosamente:', resultadoConversion);
                        } else {
                            console.warn('⚠️ Error marcando proforma como facturada:', responseConversion.status, responseText);
                        }
                    } catch (error) {
                        console.warn('⚠️ Error en conversión de proforma, pero la factura se creó:', error);
                    }
                }
                
                // Limpiar referencia
                delete window.proformaOriginalParaConversion;
            }

            // ✅ REGISTRAR PRODUCTOS PENDIENTES SI EXISTEN (solo para facturas)
            if (tipoDocumento === 'Factura' && tieneProductosPendientes && productosPendientesParaEnvio.length > 0) {
                console.log('📦 === REGISTRANDO PRODUCTOS PENDIENTES DESPUÉS DE CREAR FACTURA ===');
                console.log('📦 Productos pendientes:', productosPendientesParaEnvio);
                console.log('📦 Factura creada ID:', resultadoFactura.facturaId || resultadoFactura.data?.facturaId);
                const facturaIdCreada = resultadoFactura.facturaId || resultadoFactura.data?.facturaId;
                if (facturaIdCreada) {
                    await registrarProductosPendientesEntrega(facturaIdCreada, productosPendientesParaEnvio);
                } else {
                    console.warn('⚠️ No se pudo obtener ID de factura para registrar pendientes');
                }
            }

            // ✅ PROCESAR SEGÚN EL TIPO DE DOCUMENTO Y USUARIO
            if (tipoDocumento === 'Proforma') {
                // ✅ PROFORMAS: Mostrar confirmación y generar recibo
                console.log('📋 Proforma creada - Generando recibo');
                // ✅ CERRAR MODAL DE FINALIZAR VENTA INMEDIATAMENTE
                modalFinalizarVenta.hide();
                // ✅ GENERAR RECIBO PARA PROFORMA
                generarReciboFacturaCompletada(resultadoFactura, productosEnVenta, metodoPagoSeleccionado);
                // ✅ MOSTRAR SWEETALERT DE CONFIRMACIÓN
                Swal.fire({
                    icon: 'success',
                    title: '¡Proforma Creada!',
                    html: `
                        <div class="text-center">
                            <p><strong>Proforma:</strong> ${resultadoFactura.numeroFactura || 'N/A'}</p>
                            <p><strong>Válida hasta:</strong> ${fechaVencimiento ? fechaVencimiento.toLocaleDateString('es-CR') : 'N/A'}</p>
                            <div class="alert alert-info mt-3">
                                <small><strong>Nota:</strong> Esta proforma tiene validez por 30 días calendario</small>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#28a745',
                    timer: 5000,
                    timerProgressBar: true
                });
            } else if (estadoFactura === 'Pendiente') {
                // ✅ COLABORADORES: Modal específico de envío a cajas
                console.log('📋 Factura pendiente - Mostrando modal de envío a cajas');
                // ✅ CERRAR MODAL DE FINALIZAR VENTA INMEDIATAMENTE
                modalFinalizarVenta.hide();
                // ✅ ACTUALIZAR VISTA DE PRODUCTOS (sin ajuste de stock)
                await actualizarVistaProductosPostAjuste();
                // Para colaboradores: mostrar modal específico de envío a cajas
                setTimeout(() => {
                    mostrarModalFacturaPendiente(resultadoFactura);
                }, 300);
            } else if (estadoFactura === 'Pagada') {
                // ✅ ADMINISTRADORES/CAJEROS: Venta completa con ajuste de stock
                console.log('💰 Factura pagada - Procesando venta completa');
                // ✅ AJUSTAR STOCK SOLO PARA FACTURAS PAGADAS
                if (debeAjustarInventario) {
                    console.log('💰 === INICIO AJUSTE INVENTARIO FRONTEND ===');
                    console.log('💰 Usuario autorizado - Ajustando inventario automáticamente');
                    // ✅ PROTECCIÓN CONTRA DOBLE EJECUCIÓN
                    const facturaNumero = resultadoFactura.numeroFactura || 'N/A';
                    const cacheKey = `stock_ajustado_${facturaNumero}`;
                    if (window[cacheKey]) {
                        console.log('⚠️ Stock ya fue ajustado para esta factura, saltando ajuste');
                    } else {
                        // Marcar como en proceso
                        window[cacheKey] = true;
                        try {
                            const productosParaAjuste = productosEnVenta.map(producto => ({
                                ProductoId: producto.productoId,
                                NombreProducto: producto.nombreProducto,
                                Cantidad: producto.cantidad
                            }));
                            const requestData = {
                                NumeroFactura: facturaNumero,
                                Productos: productosParaAjuste
                            };
                            console.log('📦 Ajustando stock para productos:', productosParaAjuste);
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
                                console.log('✅ Stock ajustado exitosamente');
                                // ✅ ACTUALIZAR VISTA DE PRODUCTOS DESPUÉS DEL AJUSTE
                                await actualizarVistaProductosPostAjuste();
                            } else {
                                console.error('❌ Error ajustando stock');
                                console.warn('❌ Error ajustando stock - sin toast');
                            }
                        } catch (error) {
                            console.error('❌ Error general ajustando stock:', error);
                            console.warn('❌ Error inesperado ajustando inventario - sin toast');
                            delete window[cacheKey];
                        }
                    }
                    console.log('💰 === FIN AJUSTE INVENTARIO FRONTEND ===');
                }
                // ✅ GENERAR E IMPRIMIR RECIBO PARA FACTURAS PAGADAS
                if (debeImprimir) {
                    console.log('🖨️ Generando recibo para nueva factura pagada:', resultadoFactura);
                    // ✅ USAR LA FUNCIÓN ESPECÍFICA PARA FACTURAS COMPLETADAS
                    generarReciboFacturaCompletada(resultadoFactura, productosEnVenta, metodoPagoSeleccionado);
                }
                // ✅ CERRAR MODAL INMEDIATAMENTE DESPUÉS DE PROCESAR
                modalFinalizarVenta.hide();
                // ✅ MOSTRAR SWEETALERT EN LUGAR DE TOAST
                Swal.fire({
                    icon: 'success',
                    title: '¡Venta Completada!',
                    text: `Factura ${resultadoFactura.numeroFactura || 'N/A'} procesada exitosamente`,
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#28a745',
                    timer: 3000,
                    timerProgressBar: true
                });
            }

            // ✅ LIMPIAR CARRITO DESPUÉS DE PROCESAR (PARA TODOS LOS CASOS)
            productosEnVenta = [];
            clienteSeleccionado = null;
            $('#clienteBusqueda').val('');
            $('#clienteSeleccionado').addClass('d-none');
            actualizarVistaCarrito();
            actualizarTotales();
            actualizarEstadoBotonFinalizar();

            // ✅ LIMPIAR VARIABLES DE PRODUCTOS PENDIENTES Y CÓDIGOS DE SEGUIMIENTO
            if (window.productosPendientesEntrega) {
                delete window.productosPendientesEntrega;
            }
            if (window.facturaConPendientes) {
                delete window.facturaConPendientes;
            }

            // ✅ LIMPIAR CÓDIGOS DE SEGUIMIENTO DESPUÉS DE UN DELAY PARA QUE SE USEN EN EL RECIBO
            setTimeout(() => {
                if (window.codigosSeguimientoPendientes) {
                    console.log('🧹 Limpiando códigos de seguimiento después del recibo');
                    delete window.codigosSeguimientoPendientes;
                }
            }, 3000); // 3 segundos de delay para que se use en el recibo

            // ✅ ACTUALIZAR VISTA DE PRODUCTOS DESPUÉS DE COMPLETAR LA OPERACIÓN
            setTimeout(async () => {
                try {
                    await actualizarVistaProductosPostAjuste();
                } catch (error) {
                    console.error('❌ Error actualizando vista después de operación:', error);
                }
            }, 500);
        } else {
            // ✅ MOSTRAR ERROR CON SWEETALERT
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al procesar',
                    text: resultadoFactura.message || 'Error desconocido',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#dc3545'
                });
            } else {
                alert('Error: ' + (resultadoFactura.message || 'Error al procesar'));
            }
        }
    } catch (error) {
        console.error('❌ Error creando nuevo documento:', error);
        throw error;
    }
}


/**
 * ✅ NUEVA FUNCIÓN: Crear proforma específicamente
 */
function crearProforma() {
    console.log('📋 === CREANDO PROFORMA ===');
    return crearNuevaFactura('Proforma');
}

/**
 * ✅ FUNCIÓN PARA PROCESAR PROFORMA DESDE EL MODAL
 */
async function procesarProforma() {
    const $btnProforma = $('#btnGuardarProforma');

    try {
        // Deshabilitar el botón y mostrar el estado de carga
        $btnProforma.prop('disabled', true);
        $btnProforma.find('.btn-normal-state').addClass('d-none');
        $btnProforma.find('.btn-loading-state').removeClass('d-none');

        console.log('📋 === PROCESANDO PROFORMA DESDE MODAL ===');
        
        // Validar que hay productos en la venta
        if (productosEnVenta.length === 0) {
            mostrarToast('Venta vacía', 'Agrega productos antes de crear la proforma', 'warning');
            return;
        }

        // Validar que hay cliente seleccionado
        if (!clienteSeleccionado) {
            mostrarToast('Cliente requerido', 'Debes seleccionar un cliente antes de crear la proforma', 'warning');
            return;
        }

        // ✅ CREAR PROFORMA
        await crearProforma();

    } catch (error) {
        console.error('❌ Error procesando proforma:', error);
        
        // ✅ MOSTRAR ERROR CON SWEETALERT
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error creando proforma',
                text: 'Hubo un problema inesperado al crear la proforma',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc3545'
            });
        } else {
            alert('Error: Hubo un problema creando la proforma');
        }
    } finally {
        // Restaurar botón
        $btnProforma.prop('disabled', false);
        $btnProforma.find('.btn-normal-state').removeClass('d-none');
        $btnProforma.find('.btn-loading-state').addClass('d-none');
    }
}

// ===== GESTIÓN DE PROFORMAS =====

/**
 * ✅ FUNCIÓN: Abrir modal de proformas
 */
async function abrirProformas() {
    try {
        console.log('📋 === ABRIENDO MODAL DE PROFORMAS ===');

        const modal = new bootstrap.Modal(document.getElementById('proformasModal'));
        
        // Configurar evento para cuando el modal sea completamente visible
        $('#proformasModal').on('shown.bs.modal', async function() {
            console.log('📋 *** MODAL DE PROFORMAS COMPLETAMENTE VISIBLE ***');
            console.log('📋 Elementos disponibles en el DOM:');
            console.log('📋 - Input búsqueda:', $('#busquedaProformas').length);
            console.log('📋 - Select estado:', $('#estadoProformas').length);
            console.log('📋 - Tabla body:', $('#proformasTableBody').length);
            console.log('📋 - Loading:', $('#proformasLoading').length);
            console.log('📋 - Content:', $('#proformasContent').length);
            
            // Ejecutar verificación de vencimiento automáticamente al abrir el modal
            console.log('📅 Ejecutando verificación automática de vencimiento...');
            try {
                await verificarVencimientoProformasAutomatico();
            } catch (error) {
                console.error('❌ Error en verificación automática:', error);
            }
            
            // Inicializar filtros usando el módulo dedicado
            if (typeof inicializarFiltrosProformas === 'function') {
                console.log('✅ Inicializando filtros de proformas...');
                inicializarFiltrosProformas();
            } else {
                console.error('❌ Función inicializarFiltrosProformas no está disponible');
                // Cargar proformas básicas como fallback
                cargarProformasBasico();
            }
        });
        
        modal.show();

    } catch (error) {
        console.error('❌ Error abriendo modal de proformas:', error);
        mostrarToast('Error', 'No se pudo abrir el modal de proformas', 'danger');
    }
}

/**
 * ✅ FUNCIÓN: Cargar proformas básico (sin filtros)
 */
async function cargarProformasBasico(pagina = 1) {
    try {
        console.log('📋 === CARGANDO PROFORMAS BÁSICO ===');

        // Mostrar loading
        $('#proformasLoading').show();
        $('#proformasContent').hide();
        $('#proformasEmpty').hide();

        const params = new URLSearchParams({
            pagina: pagina,
            tamano: 20
        });

        const response = await fetch(`/Facturacion/ObtenerProformas?${params}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado obtenido:', resultado);

        if (resultado.success && resultado.proformas && resultado.proformas.length > 0) {
            mostrarProformas(resultado.proformas);
            mostrarPaginacionProformas(resultado.pagina, resultado.totalPaginas);
        } else {
            mostrarProformasVacias();
        }

    } catch (error) {
        console.error('❌ Error cargando proformas:', error);
        mostrarProformasVacias();
        mostrarToast('Error', 'Error al cargar proformas: ' + error.message, 'danger');
    } finally {
        $('#proformasLoading').hide();
    }
}

/**
 * ✅ FUNCIÓN: Mostrar proformas en la tabla
 */
function mostrarProformas(proformas) {
    console.log('📋 Mostrando proformas:', proformas.length);

    const tbody = $('#proformasTableBody');
    tbody.empty();

    proformas.forEach(proforma => {
        const fecha = new Date(proforma.fechaFactura).toLocaleDateString('es-CR');
        const estadoBadge = obtenerBadgeEstadoProforma(proforma.estado);

        // ✅ ESCAPAR DATOS DE LA PROFORMA (igual que facturas pendientes)
        const proformaEscapada = JSON.stringify(proforma).replace(/"/g, '&quot;');

        const fila = `
            <tr data-proforma-id="${proforma.facturaId}" class="proforma-row">
                <td>
                    <strong class="text-success">${proforma.numeroFactura}</strong>
                    <br><small class="text-muted">${proforma.tipoDocumento}</small>
                </td>
                <td>
                    <strong>${proforma.nombreCliente}</strong>
                    <br><small class="text-muted">${proforma.identificacionCliente || 'Sin cédula'}</small>
                </td>
                <td>
                    <small class="text-muted">Fecha:</small> ${fecha}
                    <br><small class="text-muted">Por:</small> ${proforma.usuarioCreadorNombre || 'Sistema'}
                </td>
                <td>
                    <strong class="text-success">₡${formatearMoneda(proforma.total)}</strong>
                    <br><small class="text-muted">${proforma.metodoPago || 'N/A'}</small>
                </td>
                <td>
                    ${estadoBadge}
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" 
                                class="btn btn-outline-info btn-ver-proforma"
                                data-proforma-id="${proforma.facturaId}"
                                title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" 
                                class="btn btn-outline-success btn-imprimir-proforma"
                                data-proforma-id="${proforma.facturaId}"
                                title="Imprimir">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${proforma.estado === 'Vigente' ? `
                        <button type="button" 
                                class="btn btn-outline-primary btn-convertir-proforma"
                                data-proforma-escapada="${proformaEscapada}"
                                title="Convertir a factura">
                            <i class="bi bi-arrow-right-circle"></i>
                        </button>
                        ` : proforma.estado === 'Facturada' ? `
                        <button type="button" 
                                class="btn btn-outline-secondary"
                                disabled
                                title="Ya fue convertida a factura">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
        tbody.append(fila);
    });

    // Configurar eventos de los botones (excepto convertir que ya tiene onclick)
    configurarEventosProformas();

    $('#proformasContent').show();
}


/**
 * ✅ FUNCIÓN: Obtener badge según el estado de la proforma
 */
function obtenerBadgeEstadoProforma(estado) {
    switch (estado) {
        case 'Vigente':
            return '<span class="badge bg-success">Vigente</span>';
        case 'Expirada':
            return '<span class="badge bg-danger">Expirada</span>';
        case 'Vencida':
            return '<span class="badge bg-warning">Vencida</span>';
        case 'Convertida':
            return '<span class="badge bg-info">Convertida</span>';
        case 'Facturada':
            return '<span class="badge bg-primary">Facturada</span>';
        case 'Anulada':
            return '<span class="badge bg-secondary">Anulada</span>';
        default:
            console.warn('Estado de proforma desconocido:', estado);
            return '<span class="badge bg-secondary">Desconocido</span>';
    }
}

/**
 * ✅ FUNCIÓN: Configurar eventos de los botones de proformas
 */
function configurarEventosProformas() {
    // Limpiar eventos anteriores
    $('.btn-ver-proforma').off('click.proforma');
    $('.btn-imprimir-proforma').off('click.proforma');

    // Ver proforma
    $('.btn-ver-proforma').on('click.proforma', function() {
        const proformaId = $(this).data('proforma-id');
        verDetalleProforma(proformaId);
    });

    // Imprimir proforma
    $('.btn-imprimir-proforma').on('click.proforma', function() {
        const proformaId = $(this).data('proforma-id');
        imprimirProforma(proformaId);
    });

    // Convertir proforma - IGUAL QUE FACTURAS PENDIENTES
    $('.btn-convertir-proforma').on('click.proforma', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const proformaEscapada = $(this).data('proforma-escapada');
        if (proformaEscapada) {
            console.log('🔄 Convirtiendo proforma con datos:', proformaEscapada);
            console.log('🔄 Tipo de datos:', typeof proformaEscapada);
            convertirProformaAFactura(proformaEscapada);
        } else {
            console.error('❌ No se encontraron datos de proforma para convertir');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron obtener los datos de la proforma',
                confirmButtonColor: '#dc3545'
            });
        }
    });
}

/**
 * ✅ FUNCIÓN: Mostrar mensaje cuando no hay proformas
 */
function mostrarProformasVacias() {
    $('#proformasContent').hide();
    $('#proformasEmpty').show();
}

/**
 * ✅ FUNCIÓN: Mostrar paginación de proformas
 */
function mostrarPaginacionProformas(paginaActual, totalPaginas) {
    console.log('📋 Configurando paginación - Página:', paginaActual, 'Total:', totalPaginas);

    if (totalPaginas <= 1) {
        $('#paginacionProformas').hide();
        return;
    }

    const paginacion = $('#paginacionProformas ul');
    paginacion.empty();

    // Anterior
    const anteriorDisabled = paginaActual <= 1 ? 'disabled' : '';
    paginacion.append(`
        <li class="page-item ${anteriorDisabled}">
            <a class="page-link" href="#" data-pagina="${paginaActual - 1}">Anterior</a>
        </li>
    `);

    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const activa = i === paginaActual ? 'active' : '';
        paginacion.append(`
            <li class="page-item ${activa}">
                <a class="page-link" href="#" data-pagina="${i}">${i}</a>
            </li>
        `);
    }

    // Siguiente
    const siguienteDisabled = paginaActual >= totalPaginas ? 'disabled' : '';
    paginacion.append(`
        <li class="page-item ${siguienteDisabled}">
            <a class="page-link" href="#" data-pagina="${paginaActual + 1}">Siguiente</a>
        </li>
    `);

    // Configurar eventos de paginación
    $('#paginacionProformas .page-link').on('click', function(e) {
        e.preventDefault();
        if (!$(this).parent().hasClass('disabled') && !$(this).parent().hasClass('active')) {
            const pagina = parseInt($(this).data('pagina'));
            
            // Usar función de filtros si está disponible, sino usar función básica
            if (typeof cambiarPaginaProformas === 'function') {
                cambiarPaginaProformas(pagina);
            } else {
                cargarProformasBasico(pagina);
            }
        }
    });

    $('#paginacionProformas').show();
}

/**
 * ✅ FUNCIÓN: Ver detalle de proforma
 */
async function verDetalleProforma(proformaId) {
    try {
        console.log('👁️ === VIENDO DETALLE DE PROFORMA ===');
        console.log('👁️ Proforma ID:', proformaId);

        // Mostrar loading
        Swal.fire({
            title: 'Cargando...',
            text: 'Obteniendo detalles de la proforma',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/Facturacion/ObtenerFacturaPorId/${proformaId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('👁️ Detalles obtenidos:', resultado);

        if (resultado.success || resultado.facturaId) {
            const proforma = resultado.success ? resultado.data : resultado;
            mostrarDetalleProformaModal(proforma);
        } else {
            throw new Error(resultado.message || 'Error al obtener detalles');
        }

    } catch (error) {
        console.error('❌ Error viendo detalle de proforma:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al obtener detalles de la proforma: ' + error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

/**
 * ✅ FUNCIÓN: Mostrar modal con detalles de proforma
 */
function mostrarDetalleProformaModal(proforma) {
    console.log('📋 Mostrando modal de detalles:', proforma);

    const fecha = new Date(proforma.fechaFactura).toLocaleDateString('es-CR');
    const fechaVencimiento = proforma.fechaVencimiento ? 
        new Date(proforma.fechaVencimiento).toLocaleDateString('es-CR') : 'N/A';

    // Generar HTML de productos
    let productosHtml = '';
    if (proforma.detallesFactura && proforma.detallesFactura.length > 0) {
        productosHtml = proforma.detallesFactura.map(detalle => `
            <tr>
                <td>${detalle.nombreProducto}</td>
                <td class="text-center">${detalle.cantidad}</td>
                <td class="text-end">₡${formatearMoneda(detalle.precioUnitario)}</td>
                <td class="text-end">₡${formatearMoneda(detalle.subtotal)}</td>
            </tr>
        `).join('');
    }

    Swal.fire({
        title: `<i class="bi bi-file-earmark-text me-2"></i>Detalles de Proforma`,
        html: `
            <div class="text-start">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Número:</strong><br>
                        <span class="text-success fs-5">${proforma.numeroFactura}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Estado:</strong><br>
                        <span class="badge bg-${proforma.estado === 'Vigente' ? 'success' : 'warning'}">${proforma.estado}</span>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Cliente:</strong><br>
                        ${proforma.nombreCliente}<br>
                        <small class="text-muted">${proforma.identificacionCliente || 'Sin cédula'}</small>
                    </div>
                    <div class="col-md-6">
                        <strong>Fechas:</strong><br>
                        <small>Emisión: ${fecha}</small><br>
                        <small>Vencimiento: ${fechaVencimiento}</small>
                    </div>
                </div>

                <div class="mb-3">
                    <strong>Productos:</strong>
                    <div class="table-responsive mt-2">
                        <table class="table table-sm table-striped">
                            <thead class="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center">Cant.</th>
                                    <th class="text-end">Precio</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productosHtml}
                            </tbody>
                            <tfoot class="table-light">
                                <tr>
                                    <th colspan="3" class="text-end">Subtotal:</th>
                                    <th class="text-end">₡${formatearMoneda(proforma.subtotal)}</th>
                                </tr>
                                <tr>
                                    <th colspan="3" class="text-end">IVA (13%):</th>
                                    <th class="text-end">₡${formatearMoneda(proforma.montoImpuesto)}</th>
                                </tr>
                                <tr class="table-success">
                                    <th colspan="3" class="text-end">TOTAL:</th>
                                    <th class="text-end">₡${formatearMoneda(proforma.total)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                ${proforma.observaciones ? `
                <div class="mb-3">
                    <strong>Observaciones:</strong><br>
                    <div class="alert alert-info">${proforma.observaciones}</div>
                </div>
                ` : ''}

                <div class="alert alert-warning">
                    <strong><i class="bi bi-exclamation-triangle me-2"></i>Importante:</strong>
                    Esta proforma tiene validez hasta el ${fechaVencimiento}. 
                    Para proceder con la facturación oficial, utilice la opción "Convertir a Factura".
                </div>
            </div>
        `,
        width: '800px',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#6c757d',
        customClass: {
            popup: 'text-start'
        }
    });
}

/**
 * ✅ FUNCIÓN: Imprimir proforma
 */
async function imprimirProforma(proformaId) {
    try {
        console.log('🖨️ === IMPRIMIENDO PROFORMA ===');
        console.log('🖨️ Proforma ID:', proformaId);

        // Mostrar loading
        Swal.fire({
            title: 'Preparando impresión...',
            text: 'Obteniendo datos de la proforma',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener datos completos de la proforma
        const response = await fetch(`/Facturacion/ObtenerFacturaPorId/${proformaId}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('🖨️ Datos de proforma obtenidos:', resultado);

        let proforma;
        if (resultado.success && resultado.data) {
            proforma = resultado.data;
        } else if (resultado.facturaId) {
            proforma = resultado;
        } else {
            throw new Error(resultado.message || 'No se pudieron obtener los datos de la proforma');
        }

        // Cerrar loading
        Swal.close();

        // Preparar datos para el recibo
        const productosParaRecibo = proforma.detallesFactura ? proforma.detallesFactura.map(detalle => ({
            nombreProducto: detalle.nombreProducto || 'Producto',
            cantidad: detalle.cantidad || 1,
            precioUnitario: detalle.precioUnitario || 0
        })) : [];

        const totalesRecibo = {
            subtotal: proforma.subtotal || 0,
            iva: proforma.montoImpuesto || 0,
            total: proforma.total || 0,
            metodoPago: 'Proforma',
            cliente: {
                nombre: proforma.nombreCliente || 'Cliente General',
                nombreCliente: proforma.nombreCliente || 'Cliente General'
            },
            usuario: {
                nombre: proforma.usuarioCreadorNombre || 'Sistema',
                nombreUsuario: proforma.usuarioCreadorNombre || 'Sistema'
            }
        };

        const datosProforma = {
            numeroFactura: proforma.numeroFactura || 'PROF-001',
            nombreCliente: proforma.nombreCliente || 'Cliente General',
            usuarioCreadorNombre: proforma.usuarioCreadorNombre || 'Sistema'
        };

        console.log('🖨️ Generando recibo de proforma...');
        console.log('🖨️ Productos:', productosParaRecibo.length);
        console.log('🖨️ Total:', totalesRecibo.total);

        // Generar recibo usando la función existente
        generarRecibo(datosProforma, productosParaRecibo, totalesRecibo);

        // Mostrar confirmación
        setTimeout(() => {
            mostrarToast('Impresión', `Proforma ${proforma.numeroFactura} enviada a impresión`, 'success');
        }, 1000);

    } catch (error) {
        console.error('❌ Error imprimiendo proforma:', error);
        
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Error de impresión',
            text: 'No se pudo imprimir la proforma: ' + (error.message || 'Error desconocido'),
            confirmButtonColor: '#dc3545'
        });
    }
}

///**
// * ✅ FUNCIÓN PRINCIPAL: Convertir proforma a factura (ÚNICA Y DEFINITIVA)
// */
/**
 * ✅ FUNCIÓN PRINCIPAL: Convertir proforma a factura (SIMPLIFICADA)
 */
async function convertirProformaAFactura(proformaEscapada) {
    try {
        console.log('🔄 === CONVIRTIENDO PROFORMA A FACTURA ===');
        console.log('🔄 Proforma escapada recibida:', proformaEscapada);
        console.log('🔄 Tipo de dato recibido:', typeof proformaEscapada);

        // ✅ MANEJO ROBUSTO DE DIFERENTES FORMATOS DE ENTRADA
        let proforma;

        if (typeof proformaEscapada === 'string') {
            // Si es una cadena, verificar si está escapada
            if (proformaEscapada.includes('&quot;')) {
                // Cadena escapada, aplicar replace y parsear
                proforma = JSON.parse(proformaEscapada.replace(/&quot;/g, '"'));
                console.log('🔄 Proforma parseada desde cadena escapada');
            } else {
                // Cadena JSON normal
                proforma = JSON.parse(proformaEscapada);
                console.log('🔄 Proforma parseada desde cadena JSON');
            }
        } else if (typeof proformaEscapada === 'object' && proformaEscapada !== null) {
            // Si ya es un objeto, usarlo directamente
            proforma = proformaEscapada;
            console.log('🔄 Proforma recibida como objeto directo');
        } else {
            throw new Error('Formato de proforma no válido: ' + typeof proformaEscapada);
        }

        console.log('🔄 Proforma deserializada:', proforma);

        // Confirmar conversión
        const confirmacion = await Swal.fire({
            title: '¿Convertir proforma a factura?',
            html: `
                <div class="text-start">
                    <p><strong>Proforma:</strong> ${proforma.numeroFactura || 'N/A'}</p>
                    <p><strong>Cliente:</strong> ${proforma.nombreCliente || 'Cliente General'}</p>
                    <p><strong>Total:</strong> ₡${formatearMoneda(proforma.total)}</p>
                    <hr>
                    <p><strong>Esta acción:</strong></p>
                    <ul>
                        <li>Cargará los productos de la proforma en el carrito</li>
                        <li>Procesará la venta directamente</li>
                        <li>Creará una factura oficial inmediatamente</li>
                    </ul>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, convertir',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        // Verificar que la proforma esté vigente
        if (proforma.estado !== 'Vigente') {
            Swal.fire({
                icon: 'warning',
                title: 'Proforma no vigente',
                text: `Solo se pueden convertir proformas vigentes. Estado actual: ${proforma.estado}`,
                confirmButtonColor: '#ffc107'
            });
            return;
        }

        // Limpiar carrito actual
        productosEnVenta = [];
        clienteSeleccionado = null;

        console.log('🔄 === CARGANDO DATOS DE PROFORMA EN EL CARRITO ===');

        // Cargar cliente de la proforma
        clienteSeleccionado = {
            clienteId: proforma.clienteId || null,
            nombre: proforma.nombreCliente || 'Cliente General',
            identificacion: proforma.identificacionCliente || '',
            telefono: proforma.telefonoCliente || '',
            email: proforma.emailCliente || '',
            direccion: proforma.direccionCliente || ''
        };

        console.log('👤 Cliente cargado desde proforma:', clienteSeleccionado);

        // Cargar productos de la proforma
        if (proforma.detallesFactura && Array.isArray(proforma.detallesFactura)) {
            console.log('📦 Cargando productos desde proforma:', proforma.detallesFactura.length);

            proforma.detallesFactura.forEach((detalle, index) => {
                const producto = {
                    productoId: detalle.productoId || 0,
                    nombreProducto: detalle.nombreProducto || 'Producto',
                    precioUnitario: detalle.precioUnitario || 0,
                    cantidad: detalle.cantidad || 1,
                    stockDisponible: detalle.stockDisponible || 999,
                    metodoPago: 'efectivo',
                    imagenUrl: null
                };

                productosEnVenta.push(producto);
                console.log(`📦 Producto ${index + 1} cargado:`, producto.nombreProducto, 'x', producto.cantidad);
            });
        }

        console.log('📦 Total productos cargados en carrito:', productosEnVenta.length);

        // Actualizar interfaz del cliente
        $('#clienteBusqueda').val(clienteSeleccionado.nombre);
        $('#nombreClienteSeleccionado').text(clienteSeleccionado.nombre);
        $('#emailClienteSeleccionado').text(clienteSeleccionado.email || 'Sin email');
        $('#clienteSeleccionado').removeClass('d-none');

        // Actualizar carrito y totales
        actualizarVistaCarrito();
        actualizarTotales();
        actualizarEstadoBotonFinalizar();

        console.log('🔄 Interfaz actualizada con datos de la proforma');

        // Cerrar modal de proformas
        const modalProformas = bootstrap.Modal.getInstance(document.getElementById('proformasModal'));
        if (modalProformas) {
            modalProformas.hide();
        }

        // Guardar referencia a la proforma original para el proceso de facturación
        window.proformaOriginalParaConversion = {
            proformaId: proforma.facturaId || proforma.id || proforma.proformaId,
            facturaId: proforma.facturaId || proforma.id || proforma.proformaId,
            numeroProforma: proforma.numeroFactura
        };

        console.log('📋 Referencia de proforma guardada:', window.proformaOriginalParaConversion);
        console.log('📋 ID que se usará:', window.proformaOriginalParaConversion.proformaId);

        // ✅ MOSTRAR MODAL DE FINALIZAR VENTA DESPUÉS DE UN BREVE DELAY
        setTimeout(() => {
            console.log('🎯 === ABRIENDO MODAL FINALIZAR VENTA ===');
            console.log('🎯 Productos en carrito:', productosEnVenta.length);
            console.log('🎯 Cliente seleccionado:', clienteSeleccionado?.nombre);

            // Verificar que tenemos todo lo necesario
            if (productosEnVenta.length > 0 && clienteSeleccionado) {
                mostrarModalFinalizarVenta();
                console.log('✅ Modal de finalizar venta mostrado correctamente');
            } else {
                console.error('❌ No se puede mostrar modal - faltan datos');
                console.error('❌ Productos:', productosEnVenta.length);
                console.error('❌ Cliente:', !!clienteSeleccionado);

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos de la proforma correctamente',
                    confirmButtonColor: '#dc3545'
                });
            }
        }, 800); // Delay de 800ms para asegurar que todo esté cargado

    } catch (error) {
        console.error('❌ Error convirtiendo proforma:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al convertir',
            text: 'No se pudo convertir la proforma: ' + (error.message || 'Error desconocido'),
            confirmButtonColor: '#dc3545'
        });
    }
}

/**
 * ✅ FUNCIÓN GLOBAL PARA COMPATIBILIDAD CON BOTONES HTML
 */
window.convertirProformaAFacturaGlobal = function (proformaId) {
    console.log('🌐 Función global llamada para convertir proforma:', proformaId);
    convertirProformaAFactura(proformaId);
};




/**
 * ✅ FUNCIÓN: Verificar vencimiento de proformas
 */
async function verificarVencimientoProformas() {
    try {
        console.log('📅 === VERIFICANDO VENCIMIENTO DE PROFORMAS ===');
        
        const confirmacion = await Swal.fire({
            title: '¿Verificar vencimiento?',
            html: `
                <div class="text-start">
                    <p><strong>Esta acción:</strong></p>
                    <ul>
                        <li>Revisará todas las proformas vigentes</li>
                        <li>Marcará como "Expiradas" las que pasaron 30 días</li>
                        <li>Actualizará automáticamente los estados</li>
                    </ul>
                    <p class="text-info"><strong>¿Desea continuar?</strong></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#17a2b8',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, verificar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Verificando...',
            text: 'Revisando vencimiento de proformas',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('/Facturacion/VerificarVencimientoProformas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📅 Resultado verificación:', resultado);

        if (resultado.success) {
            const proformasExpiradas = resultado.proformasExpiradas || 0;
            
            Swal.fire({
                icon: 'success',
                title: '¡Verificación Completada!',
                html: `
                    <div class="text-center">
                        <p><strong>${proformasExpiradas}</strong> proformas han sido marcadas como expiradas</p>
                        ${proformasExpiradas > 0 ? 
                            '<p class="text-muted">Los estados han sido actualizados automáticamente</p>' : 
                            '<p class="text-success">Todas las proformas están dentro de su período de validez</p>'
                        }
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#28a745',
                timer: 4000,
                timerProgressBar: true
            });

            // Recargar la tabla si hay cambios
            if (proformasExpiradas > 0) {
                await cargarProformas();
            }
        } else {
            throw new Error(resultado.message || 'Error en la verificación');
        }

    } catch (error) {
        console.error('❌ Error verificando vencimiento:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error en verificación',
            text: 'No se pudo completar la verificación de vencimiento: ' + error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

/**
 * ✅ FUNCIÓN: Verificar vencimiento de proformas automáticamente (sin confirmación)
 */
async function verificarVencimientoProformasAutomatico() {
    try {
        console.log('📅 === VERIFICANDO VENCIMIENTO AUTOMÁTICAMENTE ===');

        const response = await fetch('/Facturacion/VerificarVencimientoProformas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📅 Resultado verificación automática:', resultado);

        if (resultado.success) {
            const proformasExpiradas = resultado.proformasExpiradas || 0;
            console.log(`📅 Verificación automática completada: ${proformasExpiradas} proformas expiradas`);
            
            // Solo mostrar notificación si se encontraron proformas expiradas
            if (proformasExpiradas > 0) {
                mostrarToast('Verificación completada', 
                           `${proformasExpiradas} proformas han sido marcadas como expiradas`, 
                           'info');
            }
        } else {
            console.warn('⚠️ Error en verificación automática:', resultado.message);
        }

    } catch (error) {
        console.error('❌ Error en verificación automática:', error);
        // No mostrar error al usuario para la verificación automática
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
        minute: '2-digit' 
    });

    console.log('🖨️ === GENERANDO RECIBO ===');
    console.log('🖨️ Factura recibida:', factura);
    console.log('🖨️ Productos recibidos:', productos);
    console.log('🖨️ Totales recibidos:', totales);

    // ✅ DETERMINAR NÚMERO DE FACTURA CORRECTAMENTE CON LOGS DETALLADOS
    let numeroFactura = 'N/A';
    
    // Prioridad 1: Desde la factura pasada como parámetro
    if (factura && factura.numeroFactura) {
        numeroFactura = factura.numeroFactura;
        console.log('🖨️ Número desde factura.numeroFactura:', numeroFactura);
    }
    // Prioridad 2: Desde factura pendiente global si existe
    else if (facturaPendienteActual && facturaPendienteActual.numeroFactura) {
        numeroFactura = facturaPendienteActual.numeroFactura;
        console.log('🖨️ Número desde facturaPendienteActual:', numeroFactura);
    }
    // Prioridad 3: Verificar si los productos tienen facturaId (factura existente)
    else if (productos && productos.length > 0 && productos[0].facturaId) {
        numeroFactura = `FAC-${productos[0].facturaId}`;
        console.log('🖨️ Número generado desde facturaId:', numeroFactura);
    }
    // Prioridad 4: Buscar en otras propiedades de factura
    else if (factura) {
        console.log('🖨️ Buscando número en otras propiedades de factura:', Object.keys(factura));
        if (factura.data && factura.data.numeroFactura) {
            numeroFactura = factura.data.numeroFactura;
            console.log('🖨️ Número desde factura.data.numeroFactura:', numeroFactura);
        }
    }

    console.log('🖨️ Número de factura final determinado:', numeroFactura);
    console.log('🖨️ Método de pago:', totales.metodoPago);
    console.log('🖨️ Es pago múltiple:', esPagoMultiple);
    console.log('🖨️ Detalles de pago actuales:', detallesPagoActuales);

    // Función para truncar texto según el ancho de la impresora
    function truncarTexto(texto, maxCaracteres) {
        if (!texto) return '';
        return texto.length > maxCaracteres ? texto.substring(0, maxCaracteres - 3) + '...' : texto;
    }

    // Función para formatear línea con espacios para mini impresora
    function formatearLinea(izquierda, derecha, anchoTotal = 32) {
        const espacios = anchoTotal - izquierda.length - derecha.length;
        return izquierda + ' '.repeat(Math.max(0, espacios)) + derecha;
    }

    // ===== SECCIÓN PRODUCTOS PENDIENTES =====
    let seccionProductosPendientes = '';
    
    // Verificar si hay productos pendientes (desde variables globales o datos de factura)
    const tieneProductosPendientes = window.productosPendientesEntrega && window.productosPendientesEntrega.length > 0;
    const tieneCodigosSeguimiento = window.codigosSeguimientoPendientes && window.codigosSeguimientoPendientes.length > 0;
    const facturaConPendientes = window.facturaConPendientes || facturaPendienteActual?.tieneProductosPendientes;
    
    console.log('🎫 === DEBUG PRODUCTOS PENDIENTES EN RECIBO ===');
    console.log('🎫 tieneProductosPendientes:', tieneProductosPendientes);
    console.log('🎫 tieneCodigosSeguimiento:', tieneCodigosSeguimiento);
    console.log('🎫 facturaConPendientes:', facturaConPendientes);
    console.log('🎫 window.codigosSeguimientoPendientes:', window.codigosSeguimientoPendientes);
    console.log('🎫 window.productosPendientesEntrega:', window.productosPendientesEntrega);
    
    if (tieneProductosPendientes || facturaConPendientes || tieneCodigosSeguimiento) {
        console.log('🎫 Agregando sección de productos pendientes al recibo');
        
        seccionProductosPendientes = `
            <div class="separador"></div>
            <div class="seccion-pendientes">
                <div class="titulo-seccion">⏳ PRODUCTOS PENDIENTES</div>
                <div class="info-pendientes">
                    <div>IMPORTANTE: Algunos productos</div>
                    <div>quedan pendientes de entrega</div>
                    <div>por falta de stock.</div>
                </div>
                <div class="separador-pendientes"></div>
                ${tieneCodigosSeguimiento ? 
                    window.codigosSeguimientoPendientes.map(pendiente => {
                        const cantidadPendiente = pendiente.cantidadPendiente || 0;
                        const nombreProducto = truncarTexto(pendiente.nombreProducto || 'Producto', 22);
                        const codigoSeguimiento = pendiente.codigoSeguimiento || `${numeroFactura}-${pendiente.productoId}`;
                        console.log(`🎫 Procesando pendiente: ${nombreProducto} - ${codigoSeguimiento}`);
                        return `
                            <div class="producto-pendiente">
                                <div class="pendiente-nombre">${nombreProducto}</div>
                                <div class="pendiente-cantidad">Pendiente: ${cantidadPendiente} unidad(es)</div>
                                <div class="pendiente-codigo">Código: ${codigoSeguimiento}</div>
                            </div>
                        `;
                    }).join('') :
                    tieneProductosPendientes ? 
                    window.productosPendientesEntrega.map(pendiente => {
                        const cantidadPendiente = pendiente.cantidadPendiente || pendiente.cantidad || 0;
                        const nombreProducto = truncarTexto(pendiente.nombreProducto || 'Producto', 25);
                        console.log(`🎫 Procesando pendiente sin código: ${nombreProducto}`);
                        return `
                            <div class="producto-pendiente">
                                <div class="pendiente-nombre">${nombreProducto}</div>
                                <div class="pendiente-cantidad">Pendiente: ${cantidadPendiente} unidad(es)</div>
                                <div class="pendiente-codigo">Código: ${numeroFactura}-${pendiente.productoId || 'PEND'}</div>
                            </div>
                        `;
                    }).join('') :
                    `<div class="producto-pendiente">
                        <div class="pendiente-nombre">Consulte detalles en caja</div>
                        <div class="pendiente-codigo">Código: ${numeroFactura}-PEND</div>
                    </div>`
                }
                <div class="separador-pendientes"></div>
                <div class="instrucciones-pendientes">
                    <div>📞 Le notificaremos cuando</div>
                    <div>llegue el stock faltante</div>
                    <div>🎫 CONSERVE ESTE RECIBO</div>
                    <div>como respaldo de entrega</div>
                </div>
                ${tieneCodigosSeguimiento ? 
                    `<div class="codigos-seguimiento">
                        <div>📋 Códigos de seguimiento:</div>
                        ${window.codigosSeguimientoPendientes.map(p => 
                            `<div class="codigo-recuadro">${p.codigoSeguimiento}</div>`
                        ).join('')}
                    </div>` :
                    `<div class="codigo-seguimiento">
                        <div>📋 Código de seguimiento:</div>
                        <div class="codigo-recuadro">${numeroFactura}-PEND</div>
                    </div>`
                }
            </div>
        `;
        
        console.log('🎫 Sección de productos pendientes generada:', seccionProductosPendientes.length, 'caracteres');
    } else {
        console.log('🎫 No se agregará sección de productos pendientes - no hay datos');
    }

    // ===== SECCIÓN MÉTODO DE PAGO =====
    let seccionMetodoPago = '';
    
    // Verificar si es pago múltiple
    if (esPagoMultiple && detallesPagoActuales && detallesPagoActuales.length > 1) {
        seccionMetodoPago = `
            <div class="seccion-pago">
                <div class="titulo-seccion">DETALLE DE PAGOS MÚLTIPLES</div>
                ${detallesPagoActuales.map((pago, index) => {
                    const metodoPagoNombre = CONFIGURACION_PRECIOS[pago.metodoPago]?.nombre || pago.metodoPago;
                    return `
                        <div class="linea-pago">
                            <div class="metodo-monto">${formatearLinea(metodoPagoNombre + ':', '₡' + pago.monto.toFixed(0))}</div>
                            ${pago.referencia ? `<div class="referencia">Ref: ${truncarTexto(pago.referencia, 28)}</div>` : ''}
                        </div>
                    `;
                }).join('')}
                <div class="separador-pago"></div>
                <div class="total-pagado">${formatearLinea('Total Pagado:', '₡' + detallesPagoActuales.reduce((sum, p) => sum + p.monto, 0).toFixed(0))}</div>
            </div>
        `;
    } else if (totales.metodoPago && totales.metodoPago.toLowerCase() === 'multiple') {
        // Fallback para pagos múltiples sin detalles
        seccionMetodoPago = `
            <div class="seccion-pago">
                <div class="titulo-seccion">MÉTODO DE PAGO: MÚLTIPLE</div>
            </div>
        `;
    } else {
        // Pago simple
        const metodoPagoTexto = totales.metodoPago || 'Efectivo';
        seccionMetodoPago = `
            <div class="seccion-pago">
                <div class="titulo-seccion">MÉTODO DE PAGO: ${metodoPagoTexto.toUpperCase()}</div>
            </div>
        `;
    }

    // ✅ RECIBO OPTIMIZADO PARA MINI IMPRESORAS TÉRMICAS
    const reciboHTML = `
        <div class="recibo-container">
            <!-- ENCABEZADO -->
            <div class="encabezado">
                <div class="nombre-empresa">GESTIÓN LLANTERA</div>
                <div class="info-empresa">Sistema de Facturación</div>
                <div class="telefono">Tel: (506) 0000-0000</div>
                <div class="tipo-documento">${numeroFactura && numeroFactura.startsWith('PROF') ? 'PROFORMA' : 'FACTURA DE VENTA'}</div>
                <div class="numero-factura">No. ${numeroFactura}</div>
            </div>

            <!-- INFORMACIÓN DE TRANSACCIÓN -->
            <div class="info-transaccion">
                <div>Fecha: ${fecha}</div>
                <div>Hora: ${hora}</div>
                <div>Cliente: ${truncarTexto(totales.cliente?.nombre || totales.cliente?.nombreCliente || factura?.nombreCliente || 'Cliente General', 25)}</div>
                <div>Cajero: ${totales.usuario?.nombre || totales.usuario?.nombreUsuario || factura?.usuarioCreadorNombre || 'Sistema'}</div>
            </div>

            <div class="separador"></div>

            <!-- PRODUCTOS -->
            <div class="seccion-productos">
                <div class="titulo-seccion">DETALLE DE PRODUCTOS</div>
                ${productos.map(p => {
                    const nombreTruncado = truncarTexto(p.nombreProducto, 28);
                    const subtotalProducto = p.precioUnitario * p.cantidad;
                    return `
                        <div class="producto-item">
                            <div class="producto-nombre">${nombreTruncado}</div>
                            <div class="producto-detalle">${formatearLinea(p.cantidad + ' x ₡' + p.precioUnitario.toFixed(0), '₡' + subtotalProducto.toFixed(0))}</div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="separador"></div>

            <!-- TOTALES -->
            <div class="seccion-totales">
                <div class="linea-total">${formatearLinea('Subtotal:', '₡' + totales.subtotal.toFixed(0))}</div>
                <div class="linea-total">${formatearLinea('IVA (13%):', '₡' + totales.iva.toFixed(0))}</div>
                <div class="separador-total"></div>
                <div class="total-final">${formatearLinea('TOTAL:', '₡' + totales.total.toFixed(0))}</div>
            </div>

            <div class="separador"></div>

            <!-- MÉTODO DE PAGO -->
            ${seccionMetodoPago}

            <!-- PRODUCTOS PENDIENTES DE ENTREGA -->
            ${seccionProductosPendientes}

            <!-- ADVERTENCIA PARA PROFORMAS -->
            ${numeroFactura && numeroFactura.startsWith('PROF') ? `
            <div class="separador"></div>
            <div class="seccion-proforma">
                <div class="titulo-seccion">⚠️ IMPORTANTE - PROFORMA</div>
                <div class="advertencia-proforma">
                    <div class="info-proforma">
                        <div><strong>VALIDEZ:</strong> Esta proforma tiene</div>
                        <div>validez por 30 días calendario</div>
                        <div>desde su fecha de emisión.</div>
                    </div>
                    <div class="separador-proforma"></div>
                    <div class="info-proforma">
                        <div><strong>CONDICIONES:</strong></div>
                        <div>• Los precios están sujetos a</div>
                        <div>  cambios sin previo aviso</div>
                        <div>• La disponibilidad de productos</div>
                        <div>  está sujeta al stock actual</div>
                        <div>• Para facturación presente</div>
                        <div>  este documento</div>
                    </div>
                    <div class="separador-proforma"></div>
                    <div class="info-proforma">
                        <div><strong>NOTA LEGAL:</strong></div>
                        <div>Este documento NO constituye</div>
                        <div>una factura fiscal. Es una</div>
                        <div>cotización formal que requiere</div>
                        <div>confirmación para proceder con</div>
                        <div>la facturación oficial.</div>
                    </div>
                    <div class="separador-proforma"></div>
                    <div class="codigo-proforma">
                        <div>📋 Código de Proforma:</div>
                        <div class="codigo-recuadro">${numeroFactura}</div>
                        <div class="conservar-documento">🎫 CONSERVE ESTE DOCUMENTO</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- PIE DE PÁGINA -->
            <div class="pie-pagina">
                <div>¡Gracias por su compra!</div>
                <div>Vuelva pronto</div>
                <div>www.gestionllantera.com</div>
                <div class="fecha-generacion">Recibo: ${fecha} ${hora}</div>
            </div>

            <!-- ESPACIADO FINAL -->
            <div class="espaciado-final"></div>
        </div>
    `;

    // ✅ CONFIGURACIÓN ESPECÍFICA PARA MINI IMPRESORAS TÉRMICAS
    try {
        console.log('🖨️ Iniciando impresión de recibo térmico...');

        // Crear ventana de impresión con configuración optimizada
        const ventanaImpresion = window.open('', '_blank', 'width=320,height=600,scrollbars=yes,resizable=yes');

        if (!ventanaImpresion) {
            console.warn('⚠️ No se pudo abrir ventana emergente para impresión automática');
            imprimirReciboDirecto(reciboHTML, numeroFactura);
            return;
        }

        const documentoCompleto = `
            <!DOCTYPE html>
            <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${numeroFactura && numeroFactura.startsWith('PROF') ? 'Proforma' : 'Recibo Térmico'} - ${numeroFactura}</title>
                    <style>
                        /* ===== ESTILOS PARA MINI IMPRESORAS TÉRMICAS ===== */
                        
                        /* Configuración de página para impresión */
                        @page {
                            size: 58mm auto;
                            margin: 2mm;
                            padding: 0;
                        }

                        /* Estilos generales */
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        body {
                            font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
                            font-size: 8px;
                            line-height: 1.2;
                            color: #000;
                            background: #fff;
                            width: 100%;
                            max-width: 58mm;
                        }

                        .recibo-container {
                            width: 100%;
                            max-width: 58mm;
                            padding: 2mm;
                        }

                        /* Encabezado */
                        .encabezado {
                            text-align: center;
                            margin-bottom: 4mm;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 3mm;
                        }

                        .nombre-empresa {
                            font-size: 10px;
                            font-weight: bold;
                            margin-bottom: 1mm;
                        }

                        .info-empresa, .telefono {
                            font-size: 7px;
                            margin-bottom: 0.5mm;
                        }

                        .tipo-documento {
                            font-size: 9px;
                            font-weight: bold;
                            margin: 1mm 0;
                        }

                        .numero-factura {
                            font-size: 8px;
                            font-weight: bold;
                        }

                        /* Información de transacción */
                        .info-transaccion {
                            font-size: 7px;
                            margin-bottom: 3mm;
                        }

                        .info-transaccion div {
                            margin-bottom: 0.5mm;
                        }

                        /* Separadores */
                        .separador {
                            border-top: 1px dashed #000;
                            margin: 3mm 0;
                            height: 0;
                        }

                        .separador-pago {
                            border-top: 1px dashed #000;
                            margin: 1mm 0;
                            padding-top: 1mm;
                        }

                        .separador-total {
                            border-top: 1px solid #000;
                            margin: 1mm 0;
                        }

                        /* Secciones */
                        .titulo-seccion {
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 2mm;
                            font-size: 8px;
                        }

                        .seccion-productos {
                            margin-bottom: 3mm;
                        }

                        .producto-item {
                            margin-bottom: 1mm;
                        }

                        .producto-nombre {
                            font-size: 7px;
                            margin-bottom: 0.5mm;
                        }

                        .producto-detalle {
                            font-size: 7px;
                            font-family: 'Courier New', monospace;
                        }

                        /* Totales */
                        .seccion-totales {
                            margin-bottom: 3mm;
                        }

                        .linea-total {
                            font-size: 7px;
                            font-family: 'Courier New', monospace;
                            margin-bottom: 0.5mm;
                        }

                        .total-final {
                            font-size: 8px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                            padding-top: 1mm;
                        }

                        /* Método de pago */
                        .seccion-pago {
                            margin-bottom: 3mm;
                        }

                        .linea-pago {
                            margin-bottom: 1mm;
                        }

                        .metodo-monto {
                            font-size: 7px;
                            font-family: 'Courier New', monospace;
                        }

                        .referencia {
                            font-size: 6px;
                            color: #666;
                            margin-top: 0.5mm;
                        }

                        .total-pagado {
                            font-size: 7px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                        }

                        /* Pie de página */
                        .pie-pagina {
                            text-align: center;
                            font-size: 7px;
                            border-top: 1px dashed #000;
                            padding-top: 3mm;
                            margin-top: 3mm;
                        }

                        .pie-pagina div {
                            margin-bottom: 0.5mm;
                        }

                        .fecha-generacion {
                            font-size: 6px;
                            color: #666;
                            margin-top: 2mm;
                        }

                        .espaciado-final {
                            height: 5mm;
                        }

                        /* Estilos para productos pendientes */
                        .seccion-pendientes {
                            margin-bottom: 3mm;
                            border: 1px solid #000;
                            padding: 2mm;
                        }

                        /* Estilos para proformas */
                        .seccion-proforma {
                            margin-bottom: 3mm;
                            border: 2px solid #000;
                            padding: 2mm;
                            background: #f9f9f9;
                        }

                        .advertencia-proforma {
                            font-size: 6px;
                            text-align: center;
                        }

                        .info-proforma {
                            margin-bottom: 1mm;
                        }

                        .info-proforma div {
                            margin-bottom: 0.5mm;
                        }

                        .separador-proforma {
                            border-top: 1px dashed #000;
                            margin: 1mm 0;
                        }

                        .codigo-proforma {
                            text-align: center;
                            margin-top: 2mm;
                        }

                        .codigo-proforma div:first-child {
                            font-size: 6px;
                            margin-bottom: 0.5mm;
                        }

                        .conservar-documento {
                            font-size: 7px;
                            font-weight: bold;
                            margin-top: 1mm;
                            color: #d63384;
                        }

                        .info-pendientes {
                            text-align: center;
                            font-size: 7px;
                            margin-bottom: 2mm;
                        }

                        .info-pendientes div {
                            margin-bottom: 0.5mm;
                        }

                        .separador-pendientes {
                            border-top: 1px dashed #000;
                            margin: 1mm 0;
                        }

                        .producto-pendiente {
                            margin-bottom: 1mm;
                            font-size: 7px;
                        }

                        .pendiente-nombre {
                            font-weight: bold;
                            margin-bottom: 0.5mm;
                        }

                        .pendiente-cantidad {
                            font-size: 6px;
                            color: #666;
                        }

                        .instrucciones-pendientes {
                            text-align: center;
                            font-size: 6px;
                            margin: 2mm 0;
                        }

                        .instrucciones-pendientes div {
                            margin-bottom: 0.5mm;
                        }

                        .codigo-seguimiento, .codigos-seguimiento {
                            text-align: center;
                            margin-top: 2mm;
                            width: 100%;
                        }

                        .codigo-seguimiento div:first-child, .codigos-seguimiento div:first-child {
                            font-size: 6px;
                            margin-bottom: 0.5mm;
                            text-align: center;
                        }

                        .codigo-recuadro {
                            font-size: 8px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                            border: 2px solid #000;
                            padding: 2mm;
                            margin: 1mm auto;
                            display: block;
                            background: #f9f9f9;
                            text-align: center;
                            width: 80%;
                            max-width: 40mm;
                        }

                        /* Estilos específicos para vista previa en pantalla */
                        @media screen {
                            body {
                                background: #f5f5f5;
                                padding: 10px;
                                display: flex;
                                justify-content: center;
                                min-height: 100vh;
                            }

                            .recibo-container {
                                background: white;
                                box-shadow: 0 0 15px rgba(0,0,0,0.2);
                                border: 1px solid #ddd;
                                border-radius: 3px;
                                max-width: 300px;
                                padding: 15px;
                            }
                        }

                        /* Estilos para impresión */
                        @media print {
                            body {
                                background: none !important;
                                padding: 0 !important;
                                margin: 0 !important;
                            }

                            .recibo-container {
                                box-shadow: none !important;
                                border: none !important;
                                border-radius: 0 !important;
                                padding: 2mm !important;
                                margin: 0 !important;
                                background: none !important;
                            }

                            .seccion-proforma {
                                background: #f0f0f0 !important;
                                border: 2px solid #000 !important;
                            }

                            .conservar-documento {
                                color: #000 !important;
                                font-weight: bold !important;
                            }

                            /* Asegurar que todo se imprima en negro */
                            * {
                                -webkit-print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${reciboHTML}

                    <script>
                        console.log('📄 Documento de recibo cargado');
                        
                        let impresionRealizada = false;
                        
                        function ejecutarImpresion() {
                            if (impresionRealizada) {
                                console.log('🖨️ Impresión ya ejecutada');
                                return;
                            }
                            
                            impresionRealizada = true;
                            console.log('🖨️ Ejecutando impresión automática...');
                            
                            // Esperar un momento para asegurar que todo esté renderizado
                            setTimeout(() => {
                                try {
                                    window.print();
                                    console.log('✅ Comando de impresión enviado');
                                } catch (error) {
                                    console.error('❌ Error al imprimir:', error);
                                }
                            }, 500);
                        }

                        // Detectar cuando el documento esté completamente cargado
                        if (document.readyState === 'complete') {
                            ejecutarImpresion();
                        } else {
                            window.addEventListener('load', ejecutarImpresion);
                            document.addEventListener('DOMContentLoaded', ejecutarImpresion);
                        }

                        // Cerrar ventana después de imprimir
                        window.addEventListener('afterprint', function() {
                            console.log('🖨️ Evento afterprint detectado');
                            setTimeout(() => {
                                try {
                                    window.close();
                                } catch (e) {
                                    console.log('⚠️ No se pudo cerrar la ventana automáticamente');
                                }
                            }, 1000);
                        });

                        // Cerrar ventana por timeout (fallback)
                        setTimeout(() => {
                            if (!window.closed) {
                                console.log('🖨️ Cerrando ventana por timeout');
                                try {
                                    window.close();
                                } catch (e) {
                                    console.log('⚠️ No se pudo cerrar por timeout');
                                }
                            }
                        }, 15000);

                        // Agregar información de debug al documento
                        console.log('🔍 Información del recibo:', {
                            numeroFactura: '${numeroFactura}',
                            productos: ${productos.length},
                            total: '${totales.total}',
                            metodoPago: '${totales.metodoPago}'
                        });
                    </script>
                </body>
            </html>
        `;

        // Escribir el documento completo
        ventanaImpresion.document.open();
        ventanaImpresion.document.write(documentoCompleto);
        ventanaImpresion.document.close();
        
        console.log('✅ Ventana de impresión creada exitosamente');

        // Enfocar la ventana para asegurar que sea visible
        setTimeout(() => {
            try {
                ventanaImpresion.focus();
            } catch (e) {
                console.log('⚠️ No se pudo enfocar la ventana');
            }
        }, 100);

    } catch (error) {
        console.error('❌ Error al crear ventana de impresión:', error);
        imprimirReciboDirecto(reciboHTML, numeroFactura);
    }
}

/**
 * Generar e imprimir recibo para factura completada (reutilizando lógica existente)
 */
function generarReciboFacturaCompletada(resultadoFactura, productos, metodoPago) {
    try {
        console.log('🖨️ === GENERANDO RECIBO PARA FACTURA COMPLETADA ===');
        console.log('🖨️ Resultado factura:', resultadoFactura);
        console.log('🖨️ Productos:', productos);
        console.log('🖨️ Método de pago:', metodoPago);
        console.log('🖨️ Factura pendiente actual:', facturaPendienteActual);
        console.log('🖨️ Factura preservada para recibo:', window.facturaParaRecibo);

        // ✅ EXTRACCIÓN MEJORADA DEL NÚMERO DE FACTURA CON MÚLTIPLES FUENTES
        let numeroFactura = 'N/A';
        let nombreCliente = 'Cliente General';
        let usuarioCreadorNombre = 'Sistema';
        
        // ✅ PRIORIZAR INFORMACIÓN DE FACTURA PENDIENTE ACTUAL
        if (facturaPendienteActual && facturaPendienteActual.numeroFactura) {
            numeroFactura = facturaPendienteActual.numeroFactura;
            nombreCliente = facturaPendienteActual.nombreCliente || facturaPendienteActual.NombreCliente || nombreCliente;
            usuarioCreadorNombre = facturaPendienteActual.usuarioCreadorNombre || facturaPendienteActual.UsuarioCreadorNombre || usuarioCreadorNombre;
            console.log('🖨️ Datos desde facturaPendienteActual:', { numeroFactura, nombreCliente, usuarioCreadorNombre });
        }
        // Prioridad 2: Desde información preservada
        else if (window.facturaParaRecibo && window.facturaParaRecibo.numeroFactura) {
            numeroFactura = window.facturaParaRecibo.numeroFactura;
            nombreCliente = window.facturaParaRecibo.nombreCliente || nombreCliente;
            usuarioCreadorNombre = window.facturaParaRecibo.usuarioCreadorNombre || usuarioCreadorNombre;
            console.log('🖨️ Datos desde información preservada:', { numeroFactura, nombreCliente, usuarioCreadorNombre });
        }
        // Prioridad 3: Desde resultadoFactura (respuesta del servidor)
        else if (resultadoFactura && resultadoFactura.numeroFactura) {
            numeroFactura = resultadoFactura.numeroFactura;
            nombreCliente = resultadoFactura.nombreCliente || nombreCliente;
            usuarioCreadorNombre = resultadoFactura.usuarioCreadorNombre || usuarioCreadorNombre;
            console.log('🖨️ Datos desde resultadoFactura:', { numeroFactura, nombreCliente, usuarioCreadorNombre });
        }
        // Prioridad 4: Desde resultadoFactura.data
        else if (resultadoFactura && resultadoFactura.data && resultadoFactura.data.numeroFactura) {
            numeroFactura = resultadoFactura.data.numeroFactura;
            nombreCliente = resultadoFactura.data.nombreCliente || nombreCliente;
            usuarioCreadorNombre = resultadoFactura.data.usuarioCreadorNombre || usuarioCreadorNombre;
            console.log('🖨️ Datos desde resultadoFactura.data:', { numeroFactura, nombreCliente, usuarioCreadorNombre });
        }
        // Prioridad 5: Desde los productos si tienen facturaId
        else if (productos && productos.length > 0 && productos[0].facturaId) {
            numeroFactura = `FAC-${productos[0].facturaId}`;
            console.log('🖨️ Número de factura generado desde facturaId:', numeroFactura);
        }

        // ✅ COMPLETAR INFORMACIÓN FALTANTE CON CLIENTE SELECCIONADO Y USUARIO ACTUAL
        if (nombreCliente === 'Cliente General' && clienteSeleccionado) {
            nombreCliente = clienteSeleccionado.nombre || 
                           clienteSeleccionado.nombreCliente || 
                           clienteSeleccionado.NombreCliente || 
                           'Cliente General';
            console.log('🖨️ Nombre cliente completado desde clienteSeleccionado:', nombreCliente);
        }

        if (usuarioCreadorNombre === 'Sistema') {
            const usuarioActual = obtenerUsuarioActual();
            usuarioCreadorNombre = usuarioActual?.nombre || 
                                  usuarioActual?.nombreUsuario || 
                                  usuarioActual?.NombreUsuario || 
                                  'Sistema';
            console.log('🖨️ Usuario creador completado desde usuarioActual:', usuarioCreadorNombre);
        }

        console.log('🖨️ Información final determinada:', { numeroFactura, nombreCliente, usuarioCreadorNombre });

        // Calcular totales basándose en los productos del carrito
        const configMetodo = CONFIGURACION_PRECIOS[metodoPago] || CONFIGURACION_PRECIOS['efectivo'];
        
        let subtotal = 0;
        productos.forEach(producto => {
            const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
            subtotal += precioAjustado * producto.cantidad;
        });

        const iva = subtotal * 0.13;
        const total = subtotal + iva;

        // ✅ CREAR OBJETO DE DATOS COMPLETO PARA EL RECIBO
        const datosRecibo = {
            numeroFactura: numeroFactura,
            nombreCliente: nombreCliente,
            usuarioCreadorNombre: usuarioCreadorNombre
        };

        const totalesRecibo = {
            subtotal: subtotal,
            iva: iva,
            total: total,
            metodoPago: metodoPago,
            cliente: {
                nombre: nombreCliente,
                nombreCliente: nombreCliente
            },
            usuario: {
                nombre: usuarioCreadorNombre,
                nombreUsuario: usuarioCreadorNombre
            }
        };

        console.log('🖨️ Datos del recibo preparados:', {
            datosRecibo,
            cantidadProductos: productos.length,
            totalCalculado: total,
            numeroFactura: numeroFactura,
            cliente: nombreCliente,
            usuario: usuarioCreadorNombre
        });

        // ✅ LLAMAR A LA FUNCIÓN DE GENERACIÓN DE RECIBOS CON DATOS COMPLETOS
        generarRecibo(datosRecibo, productos, totalesRecibo);

        // ✅ LIMPIAR INFORMACIÓN PRESERVADA DESPUÉS DE USAR
        if (window.facturaParaRecibo) {
            console.log('🧹 Limpiando información preservada de factura');
            delete window.facturaParaRecibo;
        }

        console.log('✅ Recibo de factura completada generado exitosamente');
        console.log('✅ Número:', numeroFactura);
        console.log('✅ Cliente:', nombreCliente);
        console.log('✅ Cajero:', usuarioCreadorNombre);

    } catch (error) {
        console.error('❌ Error generando recibo para factura completada:', error);
        // Mostrar error específico al usuario
        Swal.fire({
            icon: 'warning',
            title: 'Recibo no impreso',
            text: 'La factura se completó correctamente pero no se pudo imprimir el recibo automáticamente',
            confirmButtonText: 'Entendido',
            timer: 4000,
            timerProgressBar: true
        });
    }
}

/**
 * Función de impresión directa cuando falla la ventana emergente
 */
function imprimirReciboDirecto(reciboHTML, numeroFactura) {
    console.log('🖨️ === IMPRESIÓN DIRECTA DE RECIBO ===');
    
    try {
        // Crear un div temporal invisible para la impresión
        const printDiv = document.createElement('div');
        printDiv.id = 'recibo-impresion-temporal';
        printDiv.style.position = 'fixed';
        printDiv.style.left = '-9999px';
        printDiv.style.top = '-9999px';
        printDiv.style.visibility = 'hidden';
        printDiv.innerHTML = reciboHTML;
        
        // Agregar al DOM temporalmente
        document.body.appendChild(printDiv);
        
        // Crear estilos específicos para impresión
        const printStyles = document.createElement('style');
        printStyles.id = 'recibo-print-styles';
        printStyles.innerHTML = `
            @media print {
                * {
                    visibility: hidden;
                }
                #recibo-impresion-temporal,
                #recibo-impresion-temporal * {
                    visibility: visible;
                }
                #recibo-impresion-temporal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 58mm;
                    font-family: 'Courier New', monospace;
                    font-size: 9px;
                    line-height: 1.2;
                }
                @page {
                    size: 58mm auto;
                    margin: 0;
                }
            }
        `;
        
        document.head.appendChild(printStyles);
        
        // Imprimir
        window.print();
        
        // Limpiar después de imprimir
        setTimeout(() => {
            if (printDiv.parentNode) {
                printDiv.parentNode.removeChild(printDiv);
            }
            if (printStyles.parentNode) {
                printStyles.parentNode.removeChild(printStyles);
            }
        }, 1000);
        
        console.log('✅ Impresión directa iniciada');
        mostrarToast('Impresión', 'Recibo enviado a impresión', 'success');
        
    } catch (error) {
        console.error('❌ Error en impresión directa:', error);
        
        // Último recurso: mostrar notificación simple
        Swal.fire({
            icon: 'info',
            title: 'Recibo Generado',
            text: `Factura ${numeroFactura} completada. Active las ventanas emergentes para impresión automática.`,
            confirmButtonText: 'Entendido',
            timer: 5000,
            timerProgressBar: true
        });
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

    // ✅ IMPLEMENTACIÓN DE TOAST VISUAL MODERNO
    try {
        // Verificar si existe un contenedor de toasts
        let toastContainer = document.getElementById('toast-container-moderno');
        if (!toastContainer) {
            // Crear contenedor de toasts moderno
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-moderno';
            toastContainer.className = 'toast-container-moderno position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Configuración moderna para diferentes tipos
        const tipoConfiguracion = {
            'success': {
                icono: 'bi-check-circle-fill',
                gradiente: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            },
            'error': {
                icono: 'bi-exclamation-triangle-fill',
                gradiente: 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(220, 53, 69, 0.3)'
            },
            'danger': {
                icono: 'bi-exclamation-triangle-fill',
                gradiente: 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(220, 53, 69, 0.3)'
            },
            'warning': {
                icono: 'bi-exclamation-circle-fill',
                gradiente: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                color: '#212529',
                shadow: '0 8px 32px rgba(255, 193, 7, 0.3)'
            },
            'info': {
                icono: 'bi-info-circle-fill',
                gradiente: 'linear-gradient(135deg, #17a2b8 0%, #007bff 100%)',
                color: '#ffffff',
                shadow: '0 8px 32px rgba(23, 162, 184, 0.3)'
            }
        };

        const config = tipoConfiguracion[tipo] || tipoConfiguracion['info'];

        // Crear toast HTML moderno
        const toastId = 'toast-moderno-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast-moderno" role="alert" aria-live="assertive" aria-atomic="true" 
                 style="background: ${config.gradiente}; 
                        color: ${config.color}; 
                        box-shadow: ${config.shadow};
                        border: none;
                        border-radius: 16px;
                        backdrop-filter: blur(10px);
                        margin-bottom: 12px;
                        min-width: 350px;
                        max-width: 450px;
                        opacity: 0;
                        transform: translateX(100%);
                        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
                <div class="toast-moderno-content" style="display: flex; 
                                                          align-items: flex-start; 
                                                          padding: 16px 20px;
                                                          gap: 12px;">
                    <div class="toast-moderno-icon" style="display: flex;
                                                           align-items: center;
                                                           justify-content: center;
                                                           width: 24px;
                                                           height: 24px;
                                                           flex-shrink: 0;
                                                           margin-top: 2px;">
                        <i class="bi ${config.icono}" style="font-size: 20px;"></i>
                    </div>
                    <div class="toast-moderno-text" style="flex: 1; min-width: 0;">
                        <div class="toast-moderno-titulo" style="font-weight: 600;
                                                                font-size: 15px;
                                                                line-height: 1.3;
                                                                margin-bottom: 4px;
                                                                letter-spacing: -0.2px;">
                            ${titulo}
                        </div>
                        <div class="toast-moderno-mensaje" style="font-weight: 400;
                                                                  font-size: 13px;
                                                                  line-height: 1.4;
                                                                  opacity: 0.95;
                                                                  word-wrap: break-word;">
                            ${mensaje}
                        </div>
                    </div>
                    <button type="button" 
                            class="toast-moderno-close" 
                            onclick="cerrarToastModerno('${toastId}')"
                            style="background: rgba(255, 255, 255, 0.2);
                                   border: none;
                                   border-radius: 50%;
                                   width: 28px;
                                   height: 28px;
                                   display: flex;
                                   align-items: center;
                                   justify-content: center;
                                   cursor: pointer;
                                   transition: all 0.2s ease;
                                   flex-shrink: 0;
                                   color: inherit;"
                            onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='scale(1.1)'"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'">
                        <i class="bi bi-x-lg" style="font-size: 12px; font-weight: bold;"></i>
                    </button>
                </div>
                <div class="toast-moderno-progress" style="position: absolute;
                                                           bottom: 0;
                                                           left: 0;
                                                           height: 3px;
                                                           background: rgba(255, 255, 255, 0.3);
                                                           border-radius: 0 0 16px 16px;
                                                           transform-origin: left;
                                                           animation: toastProgress ${tipo === 'success' ? '5000' : '3000'}ms linear;">
                </div>
            </div>
        `;

        // Agregar estilos CSS para animaciones si no existen
        if (!document.getElementById('toast-moderno-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-moderno-styles';
            styles.innerHTML = `
                @keyframes toastProgress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                .toast-moderno.mostrar {
                    opacity: 1 !important;
                    transform: translateX(0) !important;
                }
                
                .toast-moderno.ocultar {
                    opacity: 0 !important;
                    transform: translateX(100%) scale(0.8) !important;
                }
                
                .toast-container-moderno {
                    max-height: 100vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                
                .toast-container-moderno::-webkit-scrollbar {
                    width: 4px;
                }
                
                .toast-container-moderno::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .toast-container-moderno::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 2px;
                }
            `;
            document.head.appendChild(styles);
        }

        // Agregar toast al contenedor
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Mostrar toast con animación
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            // Mostrar con animación
            setTimeout(() => {
                toastElement.classList.add('mostrar');
            }, 50);

            // Auto-ocultar después del tiempo especificado
            const delay = tipo === 'success' ? 5000 : 3000;
            setTimeout(() => {
                cerrarToastModerno(toastId);
            }, delay);

            // Agregar evento de click para cerrar
            toastElement.addEventListener('click', function(e) {
                if (e.target === toastElement || e.target.closest('.toast-moderno-content')) {
                    // Solo cerrar si se hace click fuera del botón close
                    if (!e.target.closest('.toast-moderno-close')) {
                        cerrarToastModerno(toastId);
                    }
                }
            });
        }

    } catch (error) {
        console.error('❌ Error mostrando toast moderno:', error);
        // Fallback a alert si falla el toast
        alert(`${titulo}: ${mensaje}`);
    }
}

// Función auxiliar para cerrar toast moderno
function cerrarToastModerno(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        toastElement.classList.add('ocultar');
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 400);
    }
}

function verDetalleProducto(producto) {
    console.log('Ver detalle del producto:', producto);

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
                                <div id="contenedorImagenesDetalles"></div>

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

    // Cargar imágenes después de mostrar el modal usando la función del módulo zoomImagenes.js
    setTimeout(() => {
        if (typeof window.cargarImagenesDetallesProducto === 'function') {
            window.cargarImagenesDetallesProducto(producto);
        } else {
            console.error('❌ Función cargarImagenesDetallesProducto no disponible desde zoomImagenes.js');
        }
    }, 100);
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
                                           placeholder="Juan Pérez González"
                                           required>
                                    <div class="invalid-feedback"></div>
                                    <small class="form-text text-muted">Ingrese el nombre completo del cliente</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="contactoClienteFacturacion" class="form-label">
                                        <i class="bi bi-person-badge me-1"></i>Identificación
                                    </label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="contactoClienteFacturacion" 
                                           name="contacto"
                                           placeholder="1-2345-6789"
                                           maxlength="20">
                                    <div class="invalid-feedback"></div>
                                    <small class="form-text text-muted">Cédula o documento de identidad</small>
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
                                           name="email"
                                           placeholder="cliente@ejemplo.com">
                                    <div class="invalid-feedback"></div>
                                    <small class="form-text text-muted">Correo electrónico válido</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="telefonoClienteFacturacion" class="form-label">
                                        <i class="bi bi-telephone me-1"></i>Teléfono
                                    </label>
                                    <input type="tel" 
                                           class="form-control" 
                                           id="telefonoClienteFacturacion" 
                                           name="telefono"
                                           placeholder="8888-8888"
                                           maxlength="15">
                                    <div class="invalid-feedback"></div>
                                    <small class="form-text text-muted">Número de teléfono (8 dígitos)</small>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="direccionClienteFacturacion" class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Dirección
                                </label>
                                <textarea class="form-control" 
                                          id="direccionClienteFacturacion" 
                                          name="direccion" 
                                          rows="3"
                                          placeholder="San José, Costa Rica. Del Parque Central 200m norte..."
                                          maxlength="500"></textarea>
                                <div class="invalid-feedback"></div>
                                <small class="form-text text-muted">Dirección completa del cliente</small>
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
    $('#btnGuardarClienteFacturacion').on('click', function () {
        guardarNuevoCliente();
    });
    // Limpiar validaciones y validar en tiempo real
    $('#modalNuevoClienteFacturacion input, #modalNuevoClienteFacturacion textarea').on('input blur', function () {
        validarCampoEnTiempoReal($(this));
    });
}
// Función para validar campos en tiempo real
function validarCampoEnTiempoReal(campo) {
    const valor = campo.val().trim();
    const tipo = campo.attr('type') || campo.prop('tagName').toLowerCase();
    const id = campo.attr('id');
    let esValido = true;
    let mensaje = '';
    // Limpiar validación previa
    campo.removeClass('is-invalid is-valid');
    campo.siblings('.invalid-feedback').text('');
    switch (id) {
        case 'nombreClienteFacturacion':
            if (!valor) {
                esValido = false;
                mensaje = 'El nombre del cliente es obligatorio';
            } else if (valor.length < 2) {
                esValido = false;
                mensaje = 'El nombre debe tener al menos 2 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El nombre solo puede contener letras y espacios';
            }
            break;
        case 'contactoClienteFacturacion':
            if (valor && !/^[\d\-\s]+$/.test(valor)) {
                esValido = false;
                mensaje = 'La identificación solo puede contener números y guiones';
            }
            break;
        case 'emailClienteFacturacion':
            if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
                esValido = false;
                mensaje = 'Ingrese un email válido (ejemplo: cliente@ejemplo.com)';
            }
            break;
        case 'telefonoClienteFacturacion':
            if (valor && !/^[\d\-\s\+\(\)]+$/.test(valor)) {
                esValido = false;
                mensaje = 'El teléfono solo puede contener números, espacios y guiones';
            } else if (valor && valor.replace(/[\D]/g, '').length < 8) {
                esValido = false;
                mensaje = 'El teléfono debe tener al menos 8 dígitos';
            }
            break;
        case 'direccionClienteFacturacion':
            if (valor && valor.length > 500) {
                esValido = false;
                mensaje = 'La dirección no puede exceder 500 caracteres';
            }
            break;
    }
    if (!esValido) {
        campo.addClass('is-invalid');
        campo.siblings('.invalid-feedback').text(mensaje);
    } else if (valor) {
        campo.addClass('is-valid');
    }
    return esValido;
}
// Función mejorada para validar formulario completo
function validarFormularioNuevoCliente() {
    let esValido = true;
    const campos = $('#modalNuevoClienteFacturacion input, #modalNuevoClienteFacturacion textarea');
    campos.each(function () {
        if (!validarCampoEnTiempoReal($(this))) {
            esValido = false;
        }
    });
    // Validación especial para nombre (obligatorio)
    const nombre = $('#nombreClienteFacturacion').val().trim();
    if (!nombre) {
        $('#nombreClienteFacturacion').addClass('is-invalid');
        $('#nombreClienteFacturacion').siblings('.invalid-feedback').text('El nombre del cliente es obligatorio');
        esValido = false;
    }
    return esValido;
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

    // Validar identificación (requerida)
    const contacto = $('#contactoClienteFacturacion').val().trim();
    if (!contacto) {
        mostrarErrorCampoFacturacion('#contactoClienteFacturacion', 'La identificación es requerida');
        esValido = false;
    }

    // Validar email (requerido y formato)
    const email = $('#emailClienteFacturacion').val().trim();
    if (!email) {
        mostrarErrorCampoFacturacion('#emailClienteFacturacion', 'El email es requerido');
        esValido = false;
    } else if (!validarEmailFacturacion(email)) {
        mostrarErrorCampoFacturacion('#emailClienteFacturacion', 'El formato del email no es válido');
        esValido = false;
    }

    // Validar teléfono (requerido)
    const telefono = $('#telefonoClienteFacturacion').val().trim();
    if (!telefono) {
        mostrarErrorCampoFacturacion('#telefonoClienteFacturacion', 'El teléfono es requerido');
        esValido = false;
    }

    // Validar dirección (requerida)
    const direccion = $('#direccionClienteFacturacion').val().trim();
    if (!direccion) {
        mostrarErrorCampoFacturacion('#direccionClienteFacturacion', 'La dirección es requerida');
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

function obtenerUsuarioActual() {
    try {
        console.log('👤 === OBTENIENDO USUARIO ACTUAL EN FACTURACIÓN ===');
        console.log('👤 facturaConfig disponible:', !!window.facturaConfig);
        
        // ✅ PRIMERA OPCIÓN: Desde configuración de facturación (método principal)
        if (window.facturaConfig && window.facturaConfig.usuario) {
            console.log('👤 Usuario encontrado en facturaConfig:', window.facturaConfig.usuario);
            console.log('👤 Tipo de usuario obtenido:', typeof window.facturaConfig.usuario);
            console.log('👤 Propiedades del usuario:', Object.keys(window.facturaConfig.usuario));
            console.log('👤 ID de usuario:', window.facturaConfig.usuario.usuarioId || window.facturaConfig.usuario.id);
            console.log('👤 Nombre de usuario:', window.facturaConfig.usuario.nombre || window.facturaConfig.usuario.nombreUsuario);
            return window.facturaConfig.usuario;
        } else {
            console.error('❌ No se encontró usuario en facturaConfig');
            if (window.facturaConfig) {
                console.log('🔍 Estructura de facturaConfig:', Object.keys(window.facturaConfig));
            }
        }

        // Segunda opción: desde configuración global de inventario
        if (window.inventarioConfig && window.inventarioConfig.usuario) {
            console.log('👤 Usuario desde inventarioConfig:', window.inventarioConfig.usuario);
            return window.inventarioConfig.usuario;
        }

        // Tercera opción: desde elemento DOM o meta tags
        const userDataElement = document.querySelector('[data-user-info]');
        if (userDataElement && userDataElement.dataset.userInfo) {
            try {
                const userData = JSON.parse(userDataElement.dataset.userInfo);
                console.log('👤 Usuario desde DOM:', userData);
                return userData;
            } catch (e) {
                console.warn('⚠️ Error parseando datos de usuario desde DOM:', e);
            }
        }

        console.warn('⚠️ No se pudo obtener información del usuario, usando valores por defecto');
        console.log('🔍 Debug completo de configuraciones disponibles:');
        console.log('🔍 window.facturaConfig:', window.facturaConfig);
        console.log('🔍 window.inventarioConfig:', window.inventarioConfig);

        // Fallback básico
        return {
            usuarioId: 1,
            id: 1,
            nombre: 'Usuario Sistema',
            nombreUsuario: 'sistema'
        };
    } catch (error) {
        console.error('❌ Error obteniendo usuario actual:', error);
        return {
            usuarioId: 1,
            id: 1,
            nombre: 'Usuario Error',
            nombreUsuario: 'error'
        };
    }
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
    if (!token) {        const metaToken = document.querySelector('meta[name="auth-token"]');
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

// ===== MODAL FACTURA PENDIENTE =====
function mostrarModalFacturaPendiente(resultadoFactura) {
    console.log('📋 === MODAL FACTURA PENDIENTE ===');
    console.log('📋 Datos recibidos:', resultadoFactura);
    
    // ✅ EXTRACCIÓN DIRECTA Y SIMPLIFICADA DEL NÚMERO DE FACTURA
    const numeroFactura = resultadoFactura?.numeroFactura || 'N/A';
    
    console.log('🔢 Número de factura extraído:', numeroFactura);

    // Determinar título y mensaje según permisos
    let tituloModal = 'Factura Procesada';
    let mensajePrincipal = 'Factura guardada como pendiente';
    let descripcionMensaje = 'La factura ha sido guardada y está pendiente de procesamiento.';

    if (permisosUsuario.puedeCrearFacturas && !permisosUsuario.puedeCompletarFacturas && !permisosUsuario.esAdmin) {
        tituloModal = 'Factura Enviada Exitosamente';
        mensajePrincipal = '¡Factura enviada a caja!';
        descripcionMensaje = 'La factura ha sido enviada exitosamente al área de caja para procesamiento de pago.';
    }

    const modalHtml = `
        <div class="modal fade" id="modalFacturaPendiente" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle me-2"></i>${tituloModal}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-send-check-fill me-3 fs-4"></i>
                                <div>
                                    <h6 class="mb-1">${mensajePrincipal}</h6>
                                    <p class="mb-0">${descripcionMensaje}</p>
                                </div>
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Número de Factura:</strong><br>
                                <span class="text-primary fs-5">${numeroFactura}</span>
                            </div>
                            <div class="col-md-6">
                                <strong>Estado:</strong><br>
                                <span class="badge bg-warning fs-6">Pendiente de Pago</span>
                            </div>
                        </div></div>

                        <div class="alert alert-info">
                            <h6><i class="bi bi-info-circle me-2"></i>Siguiente paso:</h6>
                            <ul class="mb-0">
                                <li>La factura está disponible en el sistema de caja</li>
                                <li>El cajero procesará el pago cuando el cliente se presente</li>
                                <li>Una vez pagada, se ajustará automáticamente el inventario</li>
                                <li>Se generará el comprobante de pago final</li>
                            </ul>
                        </div>

                        <div class="bg-light p-3 rounded text-center">
                            <h6 class="text-primary mb-2">
                                <i class="bi bi-clipboard-check me-2"></i>Instrucciones para el cliente
                            </h6>
                            <p class="mb-1"><strong>Presente este número de factura en caja:</strong></p>
                            <div class="bg-white p-2 rounded border">
                                <code class="fs-4 text-primary">${numeroFactura}</code>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-check me-1"></i>Entendido
                        </button>
                        <button type="button" class="btn btn-primary" onclick="irAFacturasPendientes()">
                            <i class="bi bi-list-check me-1"></i>Ver Facturas Pendientes
                        </button>
                        <button type="button" class="btn btn-success" onclick="imprimirComprobanteEnvio('${numeroFactura}')">
                            <i class="bi bi-printer me-1"></i>Imprimir Comprobante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    $('#modalFacturaPendiente').remove();
    $('body').append(modalHtml);

    const modal = new bootstrap.Modal(document.getElementById('modalFacturaPendiente'));
    modal.show();
}

function irAFacturasPendientes() {
    // Cerrar modal
    $('#modalFacturaPendiente').modal('hide');

    // Redirigir a módulo de facturas (ajustar ruta según tu estructura)
    window.location.href = '/Facturacion/Pendientes';
}

/**
 * Verificar stock de productos de una factura pendiente
 */
async function verificarStockFacturaPendiente(facturaId) {
    try {
        console.log('📦 === VERIFICANDO STOCK PARA FACTURA ===');
        console.log('📦 Factura ID:', facturaId);
        
        const response = await fetch('/Facturacion/VerificarStockFactura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ facturaId: facturaId }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', response.status, errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📦 === RESPUESTA DEL SERVIDOR ===');
        console.log('📦 Resultado completo:', JSON.stringify(resultado, null, 2));
        console.log('📦 Tipo:', typeof resultado);
        console.log('📦 Propiedades:', Object.keys(resultado || {}));
        
        // ✅ PROCESAMIENTO SIMPLIFICADO Y ROBUSTO
        let tieneProblemas = false;
        let productosConProblemas = [];
        let success = true;
        let message = 'Verificación completada';

        if (resultado) {
            // 1. Verificar si la operación fue exitosa
            if (resultado.success === false || resultado.error) {
                success = false;
                message = resultado.message || resultado.error || 'Error en la verificación';
            }

            // 2. Detectar problemas de stock
            tieneProblemas = resultado.hayProblemasStock === true || 
                           resultado.tieneProblemas === true ||
                           (resultado.productosConProblemas && Array.isArray(resultado.productosConProblemas) && resultado.productosConProblemas.length > 0);

            // 3. Extraer productos con problemas
            if (resultado.productosConProblemas) {
                if (Array.isArray(resultado.productosConProblemas)) {
                    productosConProblemas = resultado.productosConProblemas;
                } else if (typeof resultado.productosConProblemas === 'object') {
                    // Si es un objeto, buscar arrays dentro
                    for (const [key, value] of Object.entries(resultado.productosConProblemas)) {
                        if (Array.isArray(value)) {
                            productosConProblemas = value;
                            console.log(`📦 Productos encontrados en '${key}':`, value.length);
                            break;
                        }
                    }
                }
            }

            // 4. Normalizar productos con problemas
            productosConProblemas = productosConProblemas.map(producto => ({
                productoId: producto.productoId || producto.ProductoId || 0,
                nombreProducto: producto.nombreProducto || producto.NombreProducto || 'Producto sin nombre',
                descripcion: producto.descripcion || producto.Descripcion || '',
                precio: producto.precio || producto.Precio || 0,
                cantidadRequerida: producto.cantidadRequerida || producto.CantidadRequerida || 0,
                stockDisponible: producto.stockDisponible || producto.StockDisponible || 0,
                problema: producto.problema || 'Stock insuficiente'
            }));

            // 5. Actualizar mensaje
            if (tieneProblemas) {
                message = `Se encontraron ${productosConProblemas.length} productos con problemas de stock`;
            }
        }
        
        console.log('📦 === RESULTADO FINAL ===');
        console.log('📦 Success:', success);
        console.log('📦 Tiene problemas:', tieneProblemas);
        console.log('📦 Productos con problemas:', productosConProblemas.length);
        console.log('📦 Productos normalizados:', productosConProblemas);
        
        return {
            success: success,
            tieneProblemas: tieneProblemas,
            productosConProblemas: productosConProblemas,
            message: message
        };
        
    } catch (error) {
        console.error('❌ Error verificando stock:', error);
        return { 
            success: false, 
            tieneProblemas: false, 
            productosConProblemas: [],
            message: error.message || 'Error de conexión'
        };
    }
}

/**
 * Mostrar modal con problemas de stock
 */
function mostrarModalProblemasStock(productosConProblemas, factura) {
    console.log('⚠️ === MOSTRANDO MODAL PROBLEMAS DE STOCK ===');
    console.log('⚠️ Productos recibidos:', productosConProblemas);
    console.log('⚠️ Factura:', factura);
    
    // Validar entrada
    if (!Array.isArray(productosConProblemas) || productosConProblemas.length === 0) {
        console.error('❌ Array de productos inválido o vacío');
        Swal.fire({
            icon: 'warning',
            title: 'Sin problemas de stock',
            text: 'No se encontraron productos con problemas de stock para mostrar',
            confirmButtonColor: '#ffc107'
        });
        return;
    }
    
    try {
        console.log('⚠️ Inicializando modal de problemas de stock...');
        
        // Verificar que el modal existe en el DOM
        const modalElement = document.getElementById('problemasStockModal');
        if (!modalElement) {
            console.error('❌ Modal problemasStockModal no encontrado en el DOM');
            Swal.fire({
                icon: 'error',
                title: 'Error del sistema',
                text: 'El modal de problemas de stock no está disponible',
                confirmButtonColor: '#dc3545'
            });
            return;
        }
        
        // ✅ VARIABLE PARA CONTROLAR SI EL MODAL SE CERRÓ POR UNA ACCIÓN VÁLIDA
        let modalCerradoPorAccion = false;
        
        // ✅ LIMPIAR EVENTOS ANTERIORES Y CONFIGURAR NUEVO COMPORTAMIENTO
        $(modalElement).off('hidden.bs.modal.problemasStock').on('hidden.bs.modal.problemasStock', function() {
            console.log('🔍 === MODAL PROBLEMAS STOCK CERRADO ===');
            console.log('🔍 Modal cerrado por acción válida:', modalCerradoPorAccion);
            
            // Solo limpiar carrito si NO fue cerrado por una acción válida
            if (!modalCerradoPorAccion) {
                console.log('❌ === MODAL CERRADO SIN ACCIÓN VÁLIDA ===');
                console.log('❌ Limpiando carrito por cancelación del usuario');
                
                // Limpiar carrito completamente
                productosEnVenta = [];
                clienteSeleccionado = null;
                facturaPendienteActual = null;
                
                // Limpiar interfaz
                $('#clienteBusqueda').val('');
                $('#clienteSeleccionado').addClass('d-none');
                actualizarVistaCarrito();
                actualizarTotales();
                actualizarEstadoBotonFinalizar();
                
                // Mostrar notificación
                mostrarToast('Operación cancelada', 'El carrito ha sido limpiado', 'info');
                
                console.log('✅ Carrito limpiado por cancelación');
            } else {
                console.log('✅ Modal cerrado por acción válida - carrito mantenido');
            }
            
            // Resetear la variable para futuros usos
            modalCerradoPorAccion = false;
        });
        
        // ✅ FUNCIÓN HELPER PARA MARCAR CIERRE VÁLIDO
        window.marcarCierreValidoProblemasStock = function() {
            modalCerradoPorAccion = true;
        };
        
        // ✅ CONFIGURAR EVENTOS DE LOS BOTONES DEL MODAL
        configurarEventosModalProblemasStock();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Estado inicial: mostrar loading
        $('#problemasStockLoading').show();
        $('#problemasStockContent').hide();
        
        // Procesar y mostrar productos después de un breve delay
        setTimeout(() => {
            mostrarProductosConProblemas(productosConProblemas, factura);
        }, 300);
        
    } catch (error) {
        console.error('❌ Error mostrando modal de problemas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo mostrar el modal de problemas de stock',
            confirmButtonColor: '#dc3545'
        });
    }
}

function mostrarProductosConProblemas(productos, factura) {
    console.log('⚠️ === MOSTRANDO PRODUCTOS CON PROBLEMAS ===');
    console.log('⚠️ Cantidad de productos:', productos?.length || 0);
    console.log('⚠️ Productos detallados:', productos);
    console.log('⚠️ Factura:', factura);
    
    try {
        // Validar productos
        if (!Array.isArray(productos) || productos.length === 0) {
            console.error('❌ No hay productos válidos para mostrar');
            $('#problemasStockLoading').hide();
            $('#problemasStockContent').html(`
                <div class="alert alert-warning">
                    <i class="bi bi-info-circle me-2"></i>
                    No se encontraron productos con problemas de stock específicos.
                </div>
            `).show();
            return;
        }
        
        // Extraer información de la factura
        const numeroFactura = factura?.numeroFactura || facturaPendienteActual?.numeroFactura || 'N/A';
        const nombreCliente = factura?.nombreCliente || clienteSeleccionado?.nombre || 'Cliente General';
        
        console.log('⚠️ Información de la factura extraída:', {
            numeroFactura,
            nombreCliente
        });
        
        // Generar HTML de la tabla
        let html = '';
        let productosValidos = 0;
        
        productos.forEach((producto, index) => {
            try {
                // Validar estructura del producto
                const productoId = producto.productoId || producto.ProductoId || index;
                const nombreProducto = producto.nombreProducto || producto.NombreProducto || `Producto ${index + 1}`;
                const cantidadRequerida = parseInt(producto.cantidadRequerida || producto.CantidadRequerida || 0);
                const stockDisponible = parseInt(producto.stockDisponible || producto.StockDisponible || 0);
                const faltante = Math.max(0, cantidadRequerida - stockDisponible);
                
                console.log(`⚠️ Procesando producto ${index + 1}:`, {
                    productoId,
                    nombreProducto,
                    cantidadRequerida,
                    stockDisponible,
                    faltante
                });
                
                // Solo mostrar si realmente hay problema
                if (cantidadRequerida > stockDisponible) {
                    html += `
                        <tr class="problema-stock-row" data-producto-id="${productoId}">
                            <td>
                                <strong>${nombreProducto}</strong>
                                <br><small class="text-muted">ID: ${productoId}</small>
                                ${producto.descripcion ? `<br><small class="text-muted">${producto.descripcion}</small>` : ''}
                            </td>
                            <td class="text-center">
                                <span class="badge bg-info">${cantidadRequerida}</span>
                            </td>
                            <td class="text-center">
                                <span class="badge ${stockDisponible > 0 ? 'bg-warning' : 'bg-danger'}">${stockDisponible}</span>
                            </td>
                            <td class="text-center">
                                <span class="badge bg-danger">${faltante}</span>
                            </td>
                            <td class="text-center">
                                <button type="button" 
                                        class="btn btn-sm btn-outline-danger btn-eliminar-problema" 
                                        data-producto-id="${productoId}"
                                        title="Eliminar este producto de la factura">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    productosValidos++;
                }
            } catch (error) {
                console.error(`❌ Error procesando producto ${index}:`, error, producto);
            }
        });
        
        console.log('⚠️ Productos válidos con problemas:', productosValidos);
        
        if (productosValidos === 0) {
            $('#problemasStockLoading').hide();
            $('#problemasStockContent').html(`
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    Todos los productos tienen stock suficiente.
                </div>
            `).show();
            return;
        }
        
        // Actualizar información de la factura
        $('#problemasStockFactura').text(numeroFactura);
        $('#problemasStockCliente').text(nombreCliente);
        
        // Actualizar tabla
        $('#problemasStockTableBody').html(html);
        
        // ✅ CONFIGURAR EVENTOS PARA BOTONES DE ELIMINAR PRODUCTO
        $(document).off('click.eliminarProblema', '.btn-eliminar-problema').on('click.eliminarProblema', '.btn-eliminar-problema', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productoId = $(this).data('producto-id');
            console.log('🗑️ Eliminar producto problema ID:', productoId);
            eliminarProductoProblema(productoId);
        });
        
        // Mostrar contenido y ocultar loading
        $('#problemasStockLoading').hide();
        $('#problemasStockContent').show();
        
        console.log('✅ Modal de problemas de stock mostrado correctamente');
        
    } catch (error) {
        console.error('❌ Error en mostrarProductosConProblemas:', error);
        $('#problemasStockLoading').hide();
        $('#problemasStockContent').html(`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al procesar los problemas de stock: ${error.message}
            </div>
        `).show();
    }
}

/**
 * Eliminar producto con problema de stock
 */
function eliminarProductoProblema(productoId) {
    console.log('🗑️ === ELIMINANDO PRODUCTO CON PROBLEMA ===');
    console.log('🗑️ Producto ID:', productoId);
    console.log('🗑️ Factura pendiente actual:', facturaPendienteActual);
    
    // ✅ VERIFICAR SI ES UNA FACTURA PENDIENTE
    if (facturaPendienteActual && facturaPendienteActual.facturaId) {
        // Si es factura pendiente, usar endpoint del servidor
        eliminarProductoConProblema(facturaPendienteActual.facturaId, productoId);
    } else {
        // Si es carrito local, eliminar directamente
        const indiceEnCarrito = productosEnVenta.findIndex(p => p.productoId === productoId);
        if (indiceEnCarrito !== -1) {
            const nombreProducto = productosEnVenta[indiceEnCarrito].nombreProducto;
            productosEnVenta.splice(indiceEnCarrito, 1);
            actualizarVistaCarrito();
            actualizarTotales();
            
            // Ocultar fila en la tabla
            $(`.problema-stock-row[data-producto-id="${productoId}"]`).fadeOut(300, function() {
                $(this).remove();
            });
            
            mostrarToast('Producto eliminado', `${nombreProducto} removido de la factura`, 'info');
        }
    }
}

/**
 * Registrar productos pendientes de entrega y capturar códigos de seguimiento
 */
async function registrarProductosPendientesEntrega(facturaId, productosConProblemas) {
    try {
        console.log('📦 === REGISTRANDO PRODUCTOS PENDIENTES DE ENTREGA ===');
        console.log('📦 Factura ID:', facturaId);
        console.log('📦 Productos con problemas recibidos:', productosConProblemas);
        
        if (!productosConProblemas || productosConProblemas.length === 0) {
            console.log('📦 No hay productos pendientes para registrar');
            return { success: true, message: 'No hay productos pendientes' };
        }

        // Obtener información del usuario actual
        const usuarioActual = obtenerUsuarioActual();
        const usuarioId = usuarioActual?.usuarioId || usuarioActual?.id || 1;

        // Estructura correcta que espera el controlador
        const datosRegistro = {
            facturaId: facturaId,
            usuarioCreacion: usuarioId,
            productosPendientes: productosConProblemas.map(producto => {
                // Normalizar datos del producto
                const cantidadRequerida = producto.cantidadRequerida || producto.cantidadRequirida || producto.cantidad || 0;
                const stockDisponible = producto.stockDisponible || producto.stock || 0;
                const cantidadPendiente = Math.max(0, cantidadRequerida - stockDisponible);
                
                console.log(`📦 Procesando producto ${producto.productoId}:`, {
                    cantidadRequerida,
                    stockDisponible,
                    cantidadPendiente
                });
                
                return {
                    productoId: producto.productoId,
                    nombreProducto: producto.nombreProducto || 'Sin nombre',
                    cantidadSolicitada: cantidadRequerida,
                    cantidadPendiente: cantidadPendiente,
                    stockDisponible: stockDisponible,
                    precioUnitario: producto.precioUnitario || 0,
                    observaciones: `Stock insuficiente al momento de la facturación. Disponible: ${stockDisponible}, Requerido: ${cantidadRequerida}`
                };
            })
        };

        console.log('📦 Datos a enviar al servidor:', JSON.stringify(datosRegistro, null, 2));

        const response = await fetch('/Facturacion/RegistrarPendientesEntrega', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(datosRegistro),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📦 === RESPUESTA COMPLETA DEL SERVIDOR ===');
        console.log('📦 Resultado completo:', resultado);
        console.log('📦 Tipo de resultado:', typeof resultado);
        console.log('📦 Propiedades:', Object.keys(resultado || {}));

        if (resultado.success) {
            console.log('✅ Productos pendientes registrados exitosamente');
            
            // ✅ CAPTURAR CÓDIGOS DE SEGUIMIENTO CON MÚLTIPLES ESTRATEGIAS
            let codigosCapturados = [];
            
            // Estrategia 1: Desde pendientesCreados directo
            if (resultado.pendientesCreados && Array.isArray(resultado.pendientesCreados)) {
                console.log('🎫 Capturando desde resultado.pendientesCreados...');
                codigosCapturados = resultado.pendientesCreados.map(pendiente => ({
                    productoId: pendiente.productoId,
                    nombreProducto: pendiente.nombreProducto,
                    cantidadPendiente: pendiente.cantidadPendiente,
                    codigoSeguimiento: pendiente.codigoSeguimiento
                }));
            }
            // Estrategia 2: Desde data.pendientesCreados
            else if (resultado.data && resultado.data.pendientesCreados && Array.isArray(resultado.data.pendientesCreados)) {
                console.log('🎫 Capturando desde resultado.data.pendientesCreados...');
                codigosCapturados = resultado.data.pendientesCreados.map(pendiente => ({
                    productoId: pendiente.productoId,
                    nombreProducto: pendiente.nombreProducto,
                    cantidadPendiente: pendiente.cantidadPendiente,
                    codigoSeguimiento: pendiente.codigoSeguimiento
                }));
            }
            // Estrategia 3: Buscar en cualquier propiedad que sea array
            else {
                console.log('🔍 Buscando códigos en otras propiedades...');
                for (const [key, value] of Object.entries(resultado)) {
                    if (Array.isArray(value) && value.length > 0) {
                        const firstItem = value[0];
                        if (firstItem && firstItem.codigoSeguimiento) {
                            console.log(`🎫 Códigos encontrados en resultado.${key}`);
                            codigosCapturados = value.map(pendiente => ({
                                productoId: pendiente.productoId,
                                nombreProducto: pendiente.nombreProducto,
                                cantidadPendiente: pendiente.cantidadPendiente,
                                codigoSeguimiento: pendiente.codigoSeguimiento
                            }));
                            break;
                        }
                    }
                }
            }
            
            // ✅ GUARDAR CÓDIGOS GLOBALMENTE
            if (codigosCapturados.length > 0) {
                window.codigosSeguimientoPendientes = codigosCapturados;
                console.log('🎫 === CÓDIGOS DE SEGUIMIENTO CAPTURADOS ===');
                console.log('🎫 Cantidad:', codigosCapturados.length);
                console.log('🎫 Códigos:', window.codigosSeguimientoPendientes);
                codigosCapturados.forEach((codigo, index) => {
                    console.log(`🎫 ${index + 1}. ${codigo.nombreProducto}: ${codigo.codigoSeguimiento}`);
                });
            } else {
                console.warn('⚠️ No se pudieron capturar códigos de seguimiento de la respuesta');
                // Fallback: generar códigos básicos
                window.codigosSeguimientoPendientes = productosConProblemas.map((producto, index) => ({
                    productoId: producto.productoId,
                    nombreProducto: producto.nombreProducto,
                    cantidadPendiente: producto.cantidadPendiente || Math.max(0, (producto.cantidadRequerida || 0) - (producto.stockDisponible || 0)),
                    codigoSeguimiento: `FAC-${facturaId}-${producto.productoId}`
                }));
                console.log('🎫 Códigos fallback generados:', window.codigosSeguimientoPendientes);
            }
            
            const cantidadRegistrados = resultado.pendientesCreados?.length || codigosCapturados.length || productosConProblemas.length;
            mostrarToast('Productos Pendientes', 
                `Se registraron ${cantidadRegistrados} productos para entrega posterior`, 
                'info');
            return resultado;
        } else {
            throw new Error(resultado.message || 'Error al registrar productos pendientes');
        }

    } catch (error) {
        console.error('❌ Error registrando productos pendientes:', error);
        mostrarToast('Error', 'No se pudieron registrar los productos pendientes: ' + error.message, 'warning');
        return { success: false, message: error.message };
    }
}

/**
 * Eliminar producto con problema de stock desde el endpoint del servidor
 */
async function eliminarProductoConProblema(facturaId, productoId) {
    try {
        console.log('🗑️ === ELIMINANDO PRODUCTO CON PROBLEMA DE STOCK ===');
        console.log('🗑️ Factura ID:', facturaId);
        console.log('🗑️ Producto ID:', productoId);
        
        const confirmacion = await Swal.fire({
            title: '¿Eliminar producto?',
            text: '¿Está seguro de que desea eliminar este producto de la factura?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        const response = await fetch('/Facturacion/EliminarProductosFactura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                facturaId: facturaId,
                productosAEliminar: [productoId]
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📋 Respuesta del servidor:', resultado);

        if (resultado.success) {
            // Eliminar producto del carrito local
            const indiceEnCarrito = productosEnVenta.findIndex(p => p.productoId === productoId);
            if (indiceEnCarrito !== -1) {
                const nombreProducto = productosEnVenta[indiceEnCarrito].nombreProducto;
                productosEnVenta.splice(indiceEnCarrito, 1);
                
                // Actualizar vista del carrito
                actualizarVistaCarrito();
                actualizarTotales();
                actualizarEstadoBotonFinalizar();
                
                // Mostrar confirmación de eliminación con SweetAlert
                Swal.fire({
                    icon: 'success',
                    title: '¡Producto Eliminado!',
                    text: `${nombreProducto} ha sido eliminado exitosamente de la factura`,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#28a745',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: true
                });
                
                // Ocultar fila en la tabla de problemas
                $(`.problema-stock-row[data-producto-id="${productoId}"]`).fadeOut(300, function() {
                    $(this).remove();
                    
                    // Verificar si quedan productos con problemas
                    const problemasRestantes = $('.problema-stock-row').length;
                    console.log('🔍 Problemas restantes:', problemasRestantes);
                    
                    if (problemasRestantes === 0) {
                        console.log('✅ No quedan productos con problemas - cerrando modal y abriendo finalización');
                        
                        // ✅ PRESERVAR INFORMACIÓN DE LA FACTURA ANTES DE CONTINUAR
                        if (facturaPendienteActual && facturaPendienteActual.numeroFactura) {
                            console.log('📋 Preservando número de factura:', facturaPendienteActual.numeroFactura);
                            
                            // Asegurar que la factura pendiente mantenga su información
                            window.facturaParaRecibo = {
                                numeroFactura: facturaPendienteActual.numeroFactura,
                                nombreCliente: facturaPendienteActual.nombreCliente || clienteSeleccionado?.nombre,
                                usuarioCreadorNombre: facturaPendienteActual.usuarioCreadorNombre
                            };
                        }
                        
                        // Marcar cierre válido para evitar limpiar carrito
                        if (window.marcarCierreValidoProblemasStock) {
                            window.marcarCierreValidoProblemasStock();
                        }
                        
                        // Cerrar modal de problemas
                        $('#problemasStockModal').modal('hide');
                        
                        // Abrir modal de finalización después de un breve delay
                        setTimeout(() => {
                            if (productosEnVenta.length > 0) {
                                mostrarModalFinalizarVenta();
                            } else {
                                mostrarToast('Carrito vacío', 'No quedan productos para finalizar la venta', 'warning');
                            }
                        }, 500);
                    }
                });
                
                console.log('✅ Producto eliminado exitosamente');
            }
            
            // Actualizar carrito después de eliminar
            actualizarCarritoDespuesDeEliminar([productoId]);
            
        } else {
            throw new Error(resultado.message || 'Error al eliminar el producto');
        }

    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el producto: ' + error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

/**
 * Actualizar carrito después de eliminar productos de una factura
 */
function actualizarCarritoDespuesDeEliminar(productosEliminados) {
    console.log('🔄 === ACTUALIZANDO CARRITO DESPUÉS DE ELIMINAR ===');
    console.log('🔄 Productos a eliminar del carrito:', productosEliminados);
    console.log('🔄 Estado inicial del carrito:', productosEnVenta.length, 'productos');

    try {
        // ✅ ELIMINAR PRODUCTOS DEL CARRITO LOCAL
        productosEliminados.forEach(productoId => {
            const indiceEnCarrito = productosEnVenta.findIndex(p => p.productoId == productoId);
            if (indiceEnCarrito !== -1) {
                const nombreProducto = productosEnVenta[indiceEnCarrito].nombreProducto;
                productosEnVenta.splice(indiceEnCarrito, 1);
                console.log('🗑️ Producto eliminado del carrito:', nombreProducto);
            }
        });

        console.log('🔄 Estado final del carrito:', productosEnVenta.length, 'productos');

        // ✅ ACTUALIZAR VISTA DEL CARRITO
        actualizarVistaCarrito();
        actualizarTotales();
        actualizarEstadoBotonFinalizar();

        // ✅ LIMPIAR ESTADO DE FACTURA PENDIENTE SI NO QUEDAN PRODUCTOS
        if (productosEnVenta.length === 0) {
            facturaPendienteActual = null;
            clienteSeleccionado = null;
            $('#clienteBusqueda').val('');
            $('#clienteSeleccionado').addClass('d-none');
            console.log('🧹 Carrito limpiado completamente - no quedan productos');
        }

        console.log('✅ Carrito actualizado exitosamente después de eliminar productos');

    } catch (error) {
        console.error('❌ Error actualizando carrito después de eliminar:', error);
    }
}

/**
 * Configurar eventos de los botones del modal de problemas de stock
 */
function configurarEventosModalProblemasStock() {
    console.log('⚙️ === CONFIGURANDO EVENTOS MODAL PROBLEMAS STOCK ===');
    
    // ✅ LIMPIAR EVENTOS ANTERIORES PARA EVITAR DUPLICADOS
    $(document).off('click.problemasStock', '#btnFacturarTodosModos');
    $(document).off('click.problemasStock', '#btnCancelarProblemasStock');
    
    // ✅ CONFIGURAR EVENTO FACTURAR DE TODOS MODOS (delegación de eventos)
    $(document).on('click.problemasStock', '#btnFacturarTodosModos', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ BOTÓN FACTURAR DE TODOS MODOS CLICKEADO');
        facturarTodosModos();
    });
    
    // ✅ CONFIGURAR EVENTO CANCELAR (delegación de eventos)
    $(document).on('click.problemasStock', '#btnCancelarProblemasStock', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ BOTÓN CANCELAR CLICKEADO');
        cancelarProblemasStock();
    });
    
    console.log('✅ Eventos del modal de problemas de stock configurados con delegación');
}

/**
 * Facturar de todos modos - Crear registros pendientes para productos sin stock
 */
async function facturarTodosModos() {
    console.log('⚠️ === FACTURAR DE TODOS MODOS ===');
    console.log('⚠️ Usuario decidió facturar con productos pendientes de entrega');
    
    try {
        // ✅ CONFIRMAR LA ACCIÓN CON EL USUARIO
        const confirmacion = await Swal.fire({
            title: '¿Facturar de todos modos?',
            html: `
                <div class="text-start">
                    <p><strong>Esta acción:</strong></p>
                    <ul>
                        <li>Creará la factura con todos los productos</li>
                        <li>Los productos sin stock quedarán pendientes de entrega</li>
                        <li>Se registrarán automáticamente para entrega posterior</li>
                        <li>El cliente recibirá notificación cuando llegue el stock</li>
                    </ul>
                    <p class="text-warning"><strong>¿Desea continuar?</strong></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Facturar de todos modos',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        // ✅ OBTENER PRODUCTOS CON PROBLEMAS DESDE EL DOM CORRECTAMENTE
        const productosConProblemas = [];
        $('.problema-stock-row').each(function() {
            const $fila = $(this);
            const productoId = $fila.data('producto-id');
            const nombreProducto = $fila.find('td:first strong').text().trim();
            
            // ✅ CAPTURAR CANTIDADES CORRECTAMENTE DESDE LAS COLUMNAS DE LA TABLA
            const cantidadSolicitada = parseInt($fila.find('td:eq(1) .badge.bg-info').text().trim()) || 0;
            const stockDisponible = parseInt($fila.find('td:eq(2) .badge.bg-warning, td:eq(2) .badge.bg-danger').text().trim()) || 0;
            const cantidadPendiente = parseInt($fila.find('td:eq(3) .badge.bg-danger').text().trim()) || 0;
            
            console.log(`📦 Procesando producto ${productoId}:`, {
                nombreProducto,
                cantidadSolicitada,
                stockDisponible,
                cantidadPendiente
            });
            
            if (productoId && cantidadSolicitada > 0) {
                // Buscar el producto en el carrito para obtener precio
                const productoEnCarrito = productosEnVenta.find(p => p.productoId == productoId);
                
                productosConProblemas.push({
                    productoId: parseInt(productoId),
                    nombreProducto: nombreProducto,
                    cantidadSolicitada: cantidadSolicitada,
                    cantidadRequerida: cantidadSolicitada, // Alias
                    cantidadRequirida: cantidadSolicitada, // Alias adicional
                    cantidad: cantidadSolicitada, // Otro alias
                    cantidadPendiente: cantidadPendiente > 0 ? cantidadPendiente : Math.max(0, cantidadSolicitada - stockDisponible),
                    stockDisponible: stockDisponible,
                    stock: stockDisponible, // Alias adicional
                    precioUnitario: productoEnCarrito?.precioUnitario || 0
                });
            }
        });
        
        console.log('🔍 Productos con problemas capturados correctamente:', productosConProblemas);
        
        // ✅ VALIDAR QUE SE CAPTURARON DATOS
        if (productosConProblemas.length === 0) {
            console.warn('⚠️ No se capturaron productos con problemas');
            mostrarToast('Advertencia', 'No se detectaron productos con problemas para procesar', 'warning');
            return;
        }
        
        // ✅ MARCAR QUE EL MODAL SE CIERRA POR ACCIÓN VÁLIDA
        if (window.marcarCierreValidoProblemasStock) {
            window.marcarCierreValidoProblemasStock();
        }
        
        // ✅ GUARDAR INFORMACIÓN DE PRODUCTOS PENDIENTES PARA EL PROCESO DE FACTURACIÓN
        window.productosPendientesEntrega = productosConProblemas;
        window.codigosSeguimientoPendientes = []; // Inicializar array para códigos
        
        console.log('💾 Productos pendientes guardados globalmente:', window.productosPendientesEntrega);
        
        // ✅ CERRAR MODAL DE PROBLEMAS
        $('#problemasStockModal').modal('hide');
        
        // ✅ CONTINUAR CON MODAL DE FINALIZACIÓN DESPUÉS DE UN BREVE DELAY
        setTimeout(() => {
            // Agregar flag para indicar que hay pendientes
            window.facturaConPendientes = true;
            mostrarModalFinalizarVenta();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error en facturarTodosModos:', error);
        mostrarToast('Error', 'No se pudo procesar la facturación con pendientes', 'danger');
    }
}


function cancelarProblemasStock() {
    console.log('❌ === CANCELANDO MODAL PROBLEMAS DE STOCK ===');
    console.log('❌ Usuario canceló modal de problemas de stock');
    
    // Cerrar modal
    $('#problemasStockModal').modal('hide');
    
    // El evento hidden.bs.modal se encargará de limpiar el carrito
}

function imprimirComprobanteEnvio(numeroFactura) {
    const fecha = new Date().toLocaleDateString('es-CR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    const hora = new Date().toLocaleTimeString('es-CR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const comprobanteHTML = `
        <div id="comprobante-envio" style="width: 58mm; max-width: 58mm; font-family: 'Courier New', monospace; font-size: 9px; line-height: 1.2; margin: 0; padding: 0;">
            <!-- ENCABEZADO -->
            <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
                <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">GESTIÓN LLANTERA</div>
                <div style="font-size: 8px; margin-bottom: 1px;">Sistema de Facturación</div>
                <div style="font-size: 9px; font-weight: bold;">COMPROBANTE DE ENVÍO</div>
            </div>

            <!-- INFORMACIÓN -->
            <div style="margin-bottom: 6px; font-size: 8px;">
                <div>Fecha: ${fecha}</div>
                <div>Hora: ${hora}</div>
                <div>Factura: ${numeroFactura}</div>
                <div>Estado: ENVIADA A CAJA</div>
            </div>

            <!-- SEPARADOR -->
            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            <!-- INSTRUCCIONES -->
            <div style="text-align: center; margin-bottom: 8px;">
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">INSTRUCCIONES PARA EL CLIENTE</div>
                <div style="font-size: 8px; margin-bottom: 2px;">Presente este número en caja:</div>
                <div style="font-size: 12px; font-weight: bold; border: 1px solid #000; padding: 4px; margin: 4px 0;">${numeroFactura}</div>
            </div>

            <!-- PIE -->
            <div style="text-align: center; margin-top: 8px; font-size: 7px; border-top: 1px dashed #000; padding-top: 6px;">
                <div>Gracias por su preferencia</div>
                <div>Comprobante generado: ${fecha} ${hora}</div>
            </div>

            <!-- ESPACIADO FINAL -->
            <div style="height: 20px;"></div>
        </div>
    `;

    try {
        const ventanaImpresion = window.open('', '_blank', 'width=300,height=400,scrollbars=no,resizable=no');
        if (!ventanaImpresion) {
            throw new Error('No se pudo abrir ventana de impresión');
        }

        ventanaImpresion.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Comprobante de Envío - ${numeroFactura}</title>
                    <meta charset="utf-8">
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        @media print {
                            body { margin: 0; padding: 0; }
                            #comprobante-envio { page-break-inside: avoid; }
                        }
                        body { font-family: 'Courier New', monospace; }
                    </style>
                </head>
                <body>
                    ${comprobanteHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => window.close(), 1000);
                        };
                    </script>
                </body>
            </html>
        `);
        ventanaImpresion.document.close();

        mostrarToast('Impresión', 'Comprobante de envío generado', 'success');
    } catch (error) {
        console.error('Error al imprimir comprobante:', error);
        mostrarToast('Error', 'No se pudo imprimir el comprobante', 'danger');
    }
}

// ===== FUNCIÓN PARA RECARGAR PERMISOS DINÁMICAMENTE =====
function recargarPermisosUsuario() {
    console.log('🔄 === RECARGANDO PERMISOS DE USUARIO ===');
    
    // Limpiar permisos actuales
    permisosUsuario = {
        puedeCrearFacturas: false,
        puedeCompletarFacturas: false,
        puedeEditarFacturas: false,
        puedeAnularFacturas: false,
        esAdmin: false
    };
    
    // Recargar configuración desde el servidor si es necesario
    // O simplemente recargar desde las variables globales existentes
    cargarPermisosUsuario();
    
    console.log('🔄 Permisos recargados y aplicados');
}

// ===== FUNCIÓN PARA ACTUALIZAR VISTA DE PRODUCTOS POST-AJUSTE =====
async function actualizarVistaProductosPostAjuste() {
    try {
        console.log('🔄 === ACTUALIZANDO VISTA DE PRODUCTOS POST-AJUSTE ===');
        
        // ✅ LIMPIAR COMPLETAMENTE EL ESTADO DE BÚSQUEDA PARA FORZAR ACTUALIZACIÓN
        window.lastProductsHash = null;
        ultimaBusqueda = '';
        busquedaEnProceso = false;
        cargaInicialCompletada = false;
        
        // ✅ LIMPIAR TIMEOUT SI EXISTE
        if (timeoutBusquedaActivo) {
            clearTimeout(timeoutBusquedaActivo);
            timeoutBusquedaActivo = null;
        }
        
        // ✅ OBTENER TÉRMINO DE BÚSQUEDA ACTUAL
        const terminoActual = $('#busquedaProducto').val().trim();
        
        // ✅ MOSTRAR INDICADOR DE CARGA MIENTRAS SE ACTUALIZA
        $('#resultadosBusqueda').html(`
            <div class="col-12 text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Actualizando productos...</span>
                </div>
                <p class="mt-2 text-muted">Actualizando información de productos...</p>
            </div>
        `);
        
        // ✅ ESPERAR UN MOMENTO PARA QUE SE VEAN LOS CAMBIOS EN LA UI
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // ✅ BUSCAR PRODUCTOS NUEVAMENTE
        if (terminoActual.length >= 2) {
            console.log('🔄 Actualizando con término de búsqueda:', terminoActual);
            await buscarProductos(terminoActual);
        } else {
            console.log('🔄 Actualizando productos iniciales');
            await buscarProductos('');
        }
        
        console.log('✅ Vista de productos actualizada exitosamente');
        
    } catch (error) {
        console.error('❌ Error al actualizar vista de productos:', error);
        console.warn('❌ No se pudo actualizar la vista de productos - sin toast');
        
        // ✅ INTENTAR RECARGAR PRODUCTOS INICIALES COMO FALLBACK
        try {
            await cargarProductosIniciales();
        } catch (fallbackError) {
            console.error('❌ Error en fallback de productos:', fallbackError);
        }
    }
}

// ===== FACTURAS PENDIENTES =====
async function abrirFacturasPendientes() {
    try {
        console.log('📋 === ABRIENDO MODAL DE FACTURAS PENDIENTES ===');

        const modal = new bootstrap.Modal(document.getElementById('facturasPendientesModal'));

        // Configurar evento para cuando el modal sea completamente visible
        $('#facturasPendientesModal').on('shown.bs.modal', function () {
            console.log('📋 *** MODAL DE FACTURAS PENDIENTES COMPLETAMENTE VISIBLE ***');
            console.log('📋 Elementos disponibles en el DOM:');
            console.log('📋 - Input búsqueda:', $('#busquedaFacturasPendientes').length);
            console.log('📋 - Select estado:', $('#estadoFacturasPendientes').length);
            console.log('📋 - Tabla body:', $('#facturasPendientesTableBody').length);
            console.log('📋 - Loading:', $('#facturasPendientesLoading').length);
            console.log('📋 - Content:', $('#facturasPendientesContent').length);

            // Inicializar filtros usando el módulo dedicado
            if (typeof inicializarFiltrosFacturasPendientes === 'function') {
                console.log('✅ Inicializando filtros de facturas pendientes...');
                inicializarFiltrosFacturasPendientes();
            } else {
                console.error('❌ Función inicializarFiltrosFacturasPendientes no está disponible');
                // Cargar facturas básicas como fallback
                cargarFacturasPendientesBasico();
            }
        });

        modal.show();

    } catch (error) {
        console.error('❌ Error abriendo modal de facturas pendientes:', error);
        mostrarToast('Error', 'No se pudo abrir el modal de facturas pendientes', 'danger');
    }
}
/**
 * ✅ FUNCIÓN: Cargar facturas pendientes básico (sin filtros)
 */
async function cargarFacturasPendientesBasico(pagina = 1) {
    try {
        console.log('📋 === CARGANDO FACTURAS PENDIENTES BÁSICO ===');

        // Mostrar loading
        $('#facturasPendientesLoading').show();
        $('#facturasPendientesContent').hide();
        $('#facturasPendientesEmpty').hide();

        const params = new URLSearchParams({
            pagina: pagina,
            tamano: 20
        });

        const response = await fetch(`/Facturacion/ObtenerFacturasPendientes?${params}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('📋 Resultado obtenido:', resultado);

        if (resultado.success && resultado.facturas && resultado.facturas.length > 0) {
            mostrarFacturasPendientesEnTabla(resultado.facturas);
            // Mostrar paginación si es necesario
            if (resultado.totalPaginas > 1) {
                mostrarPaginacionFacturas(resultado.pagina, resultado.totalPaginas);
            }
        } else {
            mostrarFacturasPendientesVacias();
        }

    } catch (error) {
        console.error('❌ Error cargando facturas pendientes:', error);
        mostrarFacturasPendientesVacias();
        mostrarToast('Error', 'Error al cargar facturas pendientes: ' + error.message, 'danger');
    } finally {
        $('#facturasPendientesLoading').hide();
    }
}

function mostrarFacturasPendientes(facturas) {
    console.log('📋 Mostrando', facturas.length, 'facturas pendientes');
    
    let html = '';
    facturas.forEach(factura => {
        const fecha = new Date(factura.fechaFactura).toLocaleDateString('es-CR');
        const hora = factura.fechaCreacion ? new Date(factura.fechaCreacion).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : '';
        const total = factura.total || 0;
        const cantidadItems = factura.cantidadItems || factura.detallesFactura?.length || 0;
        
        // Escapar datos para JavaScript con TODA la información del cliente
        const facturaEscapada = JSON.stringify({
            facturaId: factura.facturaId,
            numeroFactura: factura.numeroFactura,
            clienteId: factura.clienteId || factura.ClienteId,
            nombreCliente: factura.nombreCliente || factura.NombreCliente,
            emailCliente: factura.emailCliente || factura.EmailCliente,
            identificacionCliente: factura.identificacionCliente || factura.IdentificacionCliente,
            telefonoCliente: factura.telefonoCliente || factura.TelefonoCliente,
            direccionCliente: factura.direccionCliente || factura.DireccionCliente,
            total: factura.total,
            metodoPago: factura.metodoPago,
            detallesFactura: factura.detallesFactura
        }).replace(/"/g, '&quot;');
        
        html += `
            <tr class="factura-pendiente-row" style="cursor: pointer;" 
                data-factura="${facturaEscapada}"
                onclick="seleccionarFacturaPendiente(this)"
                title="Click para seleccionar esta factura">
                <td>
                    <strong class="text-primary">${factura.numeroFactura || 'N/A'}</strong>
                    <br><small class="text-muted">ID: ${factura.facturaId}</small>
                </td>
                <td>
                    <strong>${factura.nombreCliente || 'Cliente General'}</strong>
                    ${factura.emailCliente ? `<br><small class="text-muted">${factura.emailCliente}</small>` : ''}
                    ${factura.identificacionCliente ? `<br><small class="text-muted">ID: ${factura.identificacionCliente}</small>` : ''}
                </td>
                <td>
                    <strong>${fecha}</strong>
                    ${hora ? `<br><small class="text-muted">${hora}</small>` : ''}
                    <br><small class="badge bg-info">${factura.usuarioCreadorNombre || 'Sistema'}</small>
                </td>
                <td>
                    <strong class="text-success fs-6">₡${formatearMoneda(total)}</strong>
                    <br><small class="text-muted">${factura.metodoPago || 'Efectivo'}</small>
                    <br><small class="text-info">${cantidadItems} item(s)</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-warning text-dark">Pendiente</span>
                    <br><small class="text-muted">${factura.tipoDocumento || 'Factura'}</small>
                </td>
                <td>
                    <div class="btn-group-vertical btn-group-sm">
                        <button type="button" 
                                class="btn btn-success btn-sm mb-1" 
                                onclick="event.stopPropagation(); completarFacturaPendienteDirecto(${factura.facturaId}, '${factura.numeroFactura}', ${total})"
                                title="Marcar como pagada directamente">
                            <i class="bi bi-check-circle me-1"></i>Completar
                        </button>
                        <button type="button" 
                                class="btn btn-outline-primary btn-sm mb-1" 
                                onclick="event.stopPropagation(); procesarFacturaPendiente('${facturaEscapada}')"
                                title="Procesar con modal de finalización">
                            <i class="bi bi-credit-card me-1"></i>Procesar
                        </button>
                        <button type="button" 
                                class="btn btn-outline-info btn-sm" 
                                onclick="event.stopPropagation(); verDetalleFacturaPendiente(${factura.facturaId})"
                                title="Ver detalles">
                            <i class="bi bi-eye me-1"></i>Detalle
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    $('#facturasPendientesTableBody').html(html);
    $('#facturasPendientesLoading').hide();
    $('#facturasPendientesContent').show();
}

function mostrarSinFacturasPendientes() {
    $('#facturasPendientesLoading').hide();
    $('#facturasPendientesEmpty').show();
}

// ===== FUNCIONES PARA FACTURAS PENDIENTES =====

/**
 * Seleccionar una factura pendiente haciendo click en la fila
 */
function seleccionarFacturaPendiente(row) {
    // Remover selección anterior
    $('.factura-pendiente-row').removeClass('table-primary');
    
    // Agregar selección a la fila actual
    $(row).addClass('table-primary');
    
    console.log('📋 Factura pendiente seleccionada');
}

/**
 * Procesar factura pendiente usando el modal de finalización
 */
async function procesarFacturaPendiente(facturaEscapada) {
    try {
        // ✅ CERRAR MODAL DE FACTURAS PENDIENTES INMEDIATAMENTE
        const modalFacturasPendientes = bootstrap.Modal.getInstance(document.getElementById('facturasPendientesModal'));
        if (modalFacturasPendientes) {
            modalFacturasPendientes.hide();
            console.log('🚪 Modal de facturas pendientes cerrado al inicio del procesamiento');
        }

        // ✅ PEQUEÑO DELAY PARA ASEGURAR QUE EL MODAL SE CIERRE COMPLETAMENTE
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log('💰 === PROCESANDO FACTURA PENDIENTE ===');
        console.log('💰 Factura escapada recibida:', facturaEscapada);

        // ✅ DESERIALIZAR FACTURA (manejo robusto para ambos formatos)
        let factura;
        if (typeof facturaEscapada === 'string') {
            // Si es cadena, verificar si está escapada
            if (facturaEscapada.includes('&quot;')) {
                factura = JSON.parse(facturaEscapada.replace(/&quot;/g, '"'));
            } else {
                factura = JSON.parse(facturaEscapada);
            }
        } else if (typeof facturaEscapada === 'object' && facturaEscapada !== null) {
            // Si ya es un objeto, usarlo directamente
            factura = facturaEscapada;
        } else {
            throw new Error('Formato de factura no válido');
        }

        console.log('💰 Factura deserializada:', factura);

        // ✅ MARCAR COMO FACTURA PENDIENTE PARA EL MODAL
        facturaPendienteActual = {
            ...factura,
            esFacturaPendiente: true  // ✅ AGREGAR ESTA PROPIEDAD
        };

        // Verificar permisos
        if (!permisosUsuario.puedeCompletarFacturas) {
            throw new Error('No tienes permisos para completar facturas');
        }

        // ✅ VERIFICAR STOCK ANTES DE PROCESAR
        console.log('📦 Verificando stock de la factura...');
        const verificacionStock = await verificarStockFacturaPendiente(factura.facturaId);
        console.log('📦 Resultado verificación stock:', verificacionStock);

        if (!verificacionStock.success) {
            throw new Error(verificacionStock.message || 'Error verificando stock');
        }

        if (verificacionStock.tieneProblemas && verificacionStock.productosConProblemas.length > 0) {
            console.log('⚠️ Se encontraron problemas de stock:', verificacionStock.productosConProblemas);

            // ✅ LIMPIAR CARRITO ANTES DE CARGAR FACTURA PENDIENTE
            productosEnVenta = [];
            clienteSeleccionado = null;

            // ✅ ESTABLECER FACTURA PENDIENTE ACTUAL
            facturaPendienteActual = {
                ...factura,
                esFacturaPendiente: true
            };

            // ✅ CARGAR PRODUCTOS DE LA FACTURA EN EL CARRITO
            if (factura.detallesFactura && Array.isArray(factura.detallesFactura)) {
                factura.detallesFactura.forEach(detalle => {
                    productosEnVenta.push({
                        productoId: detalle.productoId,
                        nombreProducto: detalle.nombreProducto,
                        precioUnitario: detalle.precioUnitario,
                        cantidad: detalle.cantidad,
                        stockDisponible: detalle.stockDisponible || 999,
                        facturaId: factura.facturaId,
                        metodoPago: 'efectivo'
                    });
                });
            }

            // ✅ CARGAR CLIENTE DE LA FACTURA
            clienteSeleccionado = {
                clienteId: factura.clienteId,
                nombre: factura.nombreCliente || factura.NombreCliente,
                identificacion: factura.identificacionCliente || factura.IdentificacionCliente,
                telefono: factura.telefonoCliente || factura.TelefonoCliente,
                email: factura.emailCliente || factura.EmailCliente,
                direccion: factura.direccionCliente || factura.DireccionCliente
            };

            // ✅ ACTUALIZAR INTERFAZ
            $('#clienteBusqueda').val(clienteSeleccionado.nombre);
            $('#nombreClienteSeleccionado').text(clienteSeleccionado.nombre);
            $('#emailClienteSeleccionado').text(clienteSeleccionado.email || 'Sin email');
            $('#clienteSeleccionado').removeClass('d-none');

            actualizarVistaCarrito();
            actualizarTotales();
            actualizarEstadoBotonFinalizar();

            // ✅ GUARDAR PRODUCTOS PENDIENTES GLOBALMENTE
            window.productosPendientesEntrega = verificacionStock.productosConProblemas;

            // ✅ MOSTRAR MODAL DE PROBLEMAS DE STOCK
            mostrarModalProblemasStock(verificacionStock.productosConProblemas, factura);

        } else {
            // ✅ NO HAY PROBLEMAS DE STOCK - PROCESAR DIRECTAMENTE
            console.log('✅ No hay problemas de stock, procesando factura directamente');

            // ✅ LIMPIAR CARRITO ANTES DE CARGAR FACTURA PENDIENTE
            productosEnVenta = [];
            clienteSeleccionado = null;

            // ✅ CARGAR PRODUCTOS DE LA FACTURA EN EL CARRITO
            if (factura.detallesFactura && Array.isArray(factura.detallesFactura)) {
                factura.detallesFactura.forEach(detalle => {
                    productosEnVenta.push({
                        productoId: detalle.productoId,
                        nombreProducto: detalle.nombreProducto,
                        precioUnitario: detalle.precioUnitario,
                        cantidad: detalle.cantidad,
                        stockDisponible: detalle.stockDisponible || 999,
                        facturaId: factura.facturaId,
                        metodoPago: 'efectivo'
                    });
                });
            }

            // ✅ CARGAR CLIENTE DE LA FACTURA
            clienteSeleccionado = {
                clienteId: factura.clienteId,
                nombre: factura.nombreCliente || factura.NombreCliente,
                identificacion: factura.identificacionCliente || factura.IdentificacionCliente,
                telefono: factura.telefonoCliente || factura.TelefonoCliente,
                email: factura.emailCliente || factura.EmailCliente,
                direccion: factura.direccionCliente || factura.DireccionCliente
            };

            // ✅ ACTUALIZAR INTERFAZ
            $('#clienteBusqueda').val(clienteSeleccionado.nombre);
            $('#nombreClienteSeleccionado').text(clienteSeleccionado.nombre);
            $('#emailClienteSeleccionado').text(clienteSeleccionado.email || 'Sin email');
            $('#clienteSeleccionado').removeClass('d-none');

            actualizarVistaCarrito();
            actualizarTotales();
            actualizarEstadoBotonFinalizar();

            // ✅ ABRIR MODAL DE FINALIZAR VENTA DIRECTAMENTE
            setTimeout(() => {
                mostrarModalFinalizarVenta();
            }, 500);
        }

    } catch (error) {
        console.error('❌ Error procesando factura pendiente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error procesando factura',
            text: error.message || 'Hubo un problema procesando la factura pendiente',
            confirmButtonColor: '#dc3545'
        });
    }
}
/**
 * Cargar datos de factura pendiente en el carrito
 */
// Variable global para almacenar datos de factura pendiente
let facturaPendienteActual = null;

function cargarFacturaPendienteEnCarrito(factura) {
    console.log('📦 === CARGANDO FACTURA EN CARRITO ===');
    console.log('📦 Datos completos de la factura recibida:', factura);
    console.log('📦 === ANÁLISIS COMPLETO DE DATOS DEL CLIENTE ===');
    console.log('📦 Factura completa recibida:', JSON.stringify(factura, null, 2));
    console.log('📦 Datos del cliente extraídos:', {
        clienteId: factura.clienteId,
        ClienteId: factura.ClienteId,
        nombreCliente: factura.nombreCliente,
        NombreCliente: factura.NombreCliente,
        emailCliente: factura.emailCliente,
        EmailCliente: factura.EmailCliente,
        telefonoCliente: factura.telefonoCliente,
        TelefonoCliente: factura.TelefonoCliente,
        identificacionCliente: factura.identificacionCliente,
        IdentificacionCliente: factura.IdentificacionCliente,
        direccionCliente: factura.direccionCliente,
        DireccionCliente: factura.DireccionCliente,
        Cliente: factura.Cliente
    });
    console.log('📦 Todas las propiedades de factura:', Object.keys(factura));
    
    // ✅ GUARDAR DATOS DE FACTURA PENDIENTE GLOBALMENTE
    facturaPendienteActual = {
        facturaId: factura.facturaId,
        numeroFactura: factura.numeroFactura,
        esFacturaPendiente: true,
        fechaCreacion: factura.fechaCreacion || new Date().toISOString(),
        usuarioCreadorNombre: factura.usuarioCreadorNombre || 'Sistema'
    };
    
    console.log('💾 Factura pendiente guardada globalmente:', facturaPendienteActual);
    
    // Limpiar carrito actual
    productosEnVenta = [];
    
    // Cargar datos del cliente con mapeo completo y exhaustivo
    clienteSeleccionado = {
        id: factura.clienteId || factura.ClienteId || 1,
        clienteId: factura.clienteId || factura.ClienteId || 1,
        
        // Mapeo para nombre
        nombre: factura.nombreCliente || 
               factura.NombreCliente || 
               factura.Cliente?.Nombre || 
               'Cliente General',
        nombreCliente: factura.nombreCliente || 
                      factura.NombreCliente || 
                      factura.Cliente?.Nombre || 
                      'Cliente General',
        
        // Mapeo para email
        email: factura.emailCliente || 
              factura.EmailCliente || 
              factura.Cliente?.Email || 
              factura.email || 
              '',
        emailCliente: factura.emailCliente || 
                     factura.EmailCliente || 
                     factura.Cliente?.Email || 
                     '',
        
        // Mapeo para teléfono
        telefono: factura.telefonoCliente || 
                 factura.TelefonoCliente || 
                 factura.Cliente?.Telefono || 
                 factura.telefono || 
                 '',
        telefonoCliente: factura.telefonoCliente || 
                        factura.TelefonoCliente || 
                        factura.Cliente?.Telefono || 
                        '',
        
        // Mapeo para identificación
        identificacion: factura.identificacionCliente || 
                       factura.IdentificacionCliente || 
                       factura.Cliente?.Contacto || 
                       factura.cedula || 
                       factura.contacto || 
                       '',
        identificacionCliente: factura.identificacionCliente || 
                              factura.IdentificacionCliente || 
                              factura.Cliente?.Contacto || 
                              '',
        
        // Mapeo para dirección
        direccion: factura.direccionCliente || 
                  factura.DireccionCliente || 
                  factura.Cliente?.Direccion || 
                  factura.direccion || 
                  '',
        direccionCliente: factura.direccionCliente || 
                         factura.DireccionCliente || 
                         factura.Cliente?.Direccion || 
                         ''
    };
    
    console.log('👤 Cliente seleccionado creado:', clienteSeleccionado);
    
    // Mostrar cliente seleccionado
    $('#clienteBusqueda').val(factura.nombreCliente);
    $('#nombreClienteSeleccionado').text(factura.nombreCliente);
    $('#emailClienteSeleccionado').text(factura.emailCliente || 'Sin email');
    $('#clienteSeleccionado').removeClass('d-none');
    
    // Cargar productos de la factura
    if (factura.detallesFactura && factura.detallesFactura.length > 0) {
        factura.detallesFactura.forEach(detalle => {
            productosEnVenta.push({
                productoId: detalle.productoId,
                nombreProducto: detalle.nombreProducto,
                precioUnitario: detalle.precioUnitario,
                cantidad: detalle.cantidad,
                stockDisponible: 999, // Asumir stock suficiente para facturas pendientes
                metodoPago: factura.metodoPago || 'efectivo',
                imagenUrl: null,
                facturaId: factura.facturaId // Marcar como factura existente
            });
        });
    }
    
    // Actualizar vista del carrito
    actualizarVistaCarrito();
    actualizarTotales();
    actualizarEstadoBotonFinalizar();
    
    console.log('✅ Factura cargada en carrito:', {
        cliente: clienteSeleccionado,
        productos: productosEnVenta.length,
        facturaPendiente: facturaPendienteActual
    });
    
    // Mostrar notificación
    Swal.fire({
        icon: 'info',
        title: 'Factura Cargada',
        text: `Factura ${factura.numeroFactura} cargada para completar el pago`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

/**
 * Completar factura pendiente directamente (sin modal)
 */
async function completarFacturaPendienteDirecto(facturaId, numeroFactura, total) {
    console.log('💰 === COMPLETANDO FACTURA PENDIENTE DIRECTAMENTE ===');
    console.log('💰 ID:', facturaId, 'Número:', numeroFactura, 'Total:', total);
    
    const confirmacion = await Swal.fire({
        title: '¿Completar Factura?',
        text: `¿Confirma que desea marcar como pagada la factura ${numeroFactura} por ₡${formatearMoneda(total)}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, Completar',
        cancelButtonText: 'Cancelar'
    });
    
    if (!confirmacion.isConfirmed) {
        return;
    }
    
    try {
        const response = await fetch('/Facturacion/CompletarFacturaPendiente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                facturaId: facturaId,
                numeroFactura: numeroFactura
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        
        if (resultado.success) {
            Swal.fire({
                icon: 'success',
                title: 'Factura Completada',
                text: `La factura ${numeroFactura} ha sido marcada como pagada exitosamente`,
                confirmButtonColor: '#28a745'
            });
            
            // Recargar lista de facturas pendientes
            abrirFacturasPendientes();
            
            // Actualizar vista de productos si es necesario
            await actualizarVistaProductosPostAjuste();
            
        } else {
            throw new Error(resultado.message || 'Error al completar la factura');
        }
        
    } catch (error) {
        console.error('❌ Error completando factura:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo completar la factura: ' + error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

function verDetalleFacturaPendiente(facturaId) {
    console.log('👀 Ver detalle de factura:', facturaId);
    // Aquí puedes implementar la vista de detalles si es necesaria
    Swal.fire({
        icon: 'info',
        title: 'Funcionalidad en desarrollo',
        text: 'La vista de detalles estará disponible próximamente',
        confirmButtonColor: '#17a2b8'
    });
}

/**
 * ✅ FUNCIÓN: Cargar imágenes en modal de detalles de producto
 */
async function cargarImagenesDetallesProducto(producto) {
    try {
        console.log('🖼️ === CARGANDO IMÁGENES EN MODAL DE DETALLES ===');
        console.log('🖼️ Producto:', producto.nombreProducto);
        console.log('🖼️ Datos del producto:', producto);

        const contenedor = $('#contenedorImagenesDetalles');

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
                <div class="sin-imagenes">
                    <i class="bi bi-image-fill"></i>
                    <span>No hay imágenes disponibles</span>
                </div>
            `);
            return;
        }

        if (imagenesArray.length === 1) {
            // Una sola imagen
            const urlImagen = construirUrlImagen(imagenesArray[0]);
            contenedor.html(`
                <img src="${urlImagen}" 
                     class="imagen-producto-detalle" 
                     alt="${producto.nombreProducto}"
                     style="cursor: pointer;"
                     onclick="abrirZoomImagenMejorado(this.src, '${producto.nombreProducto}')"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'sin-imagenes\\'><i class=\\'bi bi-image-fill\\'></i><span>Error cargando imagen</span></div>';">
            `);
        } else {
            // Múltiples imágenes - crear carrusel
            const carruselId = 'carruselImagenesDetalles';
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
                             class="imagen-producto-detalle" 
                             alt="${producto.nombreProducto}"
                             style="cursor: pointer;"
                             onclick="abrirZoomImagenMejorado(this.src, '${producto.nombreProducto}')"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="imagen-error" style="display:none;">
                            <i class="bi bi-image-fill"></i>
                            <span>Error cargando imagen</span>
                        </div>
                    </div>
                `;
            });

            htmlCarrusel += `
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#${carruselId}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#${carruselId}" data-bs-slide="next">
                        <span class="carousel-control-next-icon"></span>
                    </button>
                </div>
            `;

            contenedor.html(htmlCarrusel);
        }

    } catch (error) {
        console.error('❌ Error cargando imágenes:', error);
        $('#contenedorImagenesDetalles').html(`
            <div class="sin-imagenes">
                <i class="bi bi-exclamation-triangle"></i>
                <span>Error al cargar imágenes</span>
            </div>
        `);
    }
}

/**
 * ✅ FUNCIÓN MEJORADA: Abrir zoom de imagen con mejor estilo
 */
function abrirZoomImagenMejorado(urlImagen, nombreProducto) {
    console.log('🔍 Abriendo zoom mejorado:', urlImagen);

    // Ocultar modal de detalles temporalmente
    const modalDetalles = $('#modalDetalleProducto, #modalSeleccionProducto');
    if (modalDetalles.length) {
        modalDetalles.css('opacity', '0');
    }

    // Crear modal mejorado
    const modalHTML = `
        <div class="modal fade" id="modalZoomMejorado" tabindex="-1" data-bs-backdrop="true" data-bs-keyboard="true">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content bg-dark">
                    <div class="modal-header border-0">
                        <h5 class="modal-title text-white d-flex align-items-center">
                            <i class="bi bi-arrows-fullscreen me-2 text-info"></i>
                            <span>${nombreProducto || 'Imagen Ampliada'}</span>
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body d-flex justify-content-center align-items-center p-4">
                        <div class="zoom-image-container">
                            <img src="${urlImagen}" 
                                 alt="${nombreProducto}" 
                                 class="zoom-image-mejorada"
                                 onload="this.style.opacity='1'"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                            <div class="error-load-zoom" style="display: none;">
                                <i class="bi bi-exclamation-triangle text-warning"></i>
                                <p class="text-white mt-2">Error al cargar la imagen</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <div class="zoom-controls">
                            <button type="button" class="btn btn-outline-light me-2" onclick="descargarImagen('${urlImagen}', '${nombreProducto}')">
                                <i class="bi bi-download me-1"></i>Descargar
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior
    $('#modalZoomMejorado').remove();

    // Agregar nuevo modal
    $('body').append(modalHTML);

    // Configurar eventos
    $('#modalZoomMejorado').on('hidden.bs.modal', function () {
        // Restaurar visibilidad del modal de detalles
        const modalDetalles = $('#modalDetalleProducto, #modalSeleccionProducto');
        if (modalDetalles.length) {
            modalDetalles.css('opacity', '1');
        }
        // Remover del DOM
        $(this).remove();
    });

    // Mostrar modal
    $('#modalZoomMejorado').modal('show');
}

/**
 * ✅ FUNCIÓN AUXILIAR: Construir URL de imagen
 */
function construirUrlImagen(url) {
    if (!url) return '/images/no-image.png';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

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
 * ✅ FUNCIÓN AUXILIAR: Descargar imagen
 */
function descargarImagen(urlImagen, nombreProducto) {
    try {
        const nombreArchivo = `${nombreProducto.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_imagen.jpg`;

        const link = document.createElement('a');
        link.href = urlImagen;
        link.download = nombreArchivo;
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        mostrarToast('Descarga', 'Imagen descargada correctamente', 'success');
    } catch (error) {
        console.error('Error descargando imagen:', error);
        mostrarToast('Error', 'No se pudo descargar la imagen', 'danger');
    }
}

// Exportar funciones globalmente
window.cargarImagenesDetallesProducto = cargarImagenesDetallesProducto;
window.abrirZoomImagenMejorado = abrirZoomImagenMejorado;
window.construirUrlImagen = construirUrlImagen;
window.descargarImagen = descargarImagen;

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

// ===== HACER FUNCIONES Y VARIABLES GLOBALES =====
window.facturaPendienteActual = facturaPendienteActual;
window.recargarPermisosUsuario = recargarPermisosUsuario;
window.cerrarToastModerno = cerrarToastModerno;
window.configurarEventosModalProblemasStock = configurarEventosModalProblemasStock;
window.abrirModalNuevoCliente = abrirModalNuevoCliente;
window.seleccionarCliente = seleccionarCliente;
window.limpiarVenta = limpiarVenta;
window.mostrarModalFinalizarVenta = mostrarModalFinalizarVenta;
window.verDetalleProducto = verDetalleProducto;
window.nuevaVenta = nuevaVenta;
window.agregarProducto = agregarProducto;
window.finalizarVenta = finalizarVenta;
window.eliminarProductoVenta = eliminarProductoVenta;
window.actualizarCantidadProducto = actualizarCantidadProducto;
window.procesarVenta = procesarVenta;
window.reiniciarCargaProductos = reiniciarCargaProductos;
window.mostrarResumenDepuracion = mostrarResumenDepuracion;
window.actualizarEstadoBotonFinalizar = actualizarEstadoBotonFinalizar;
window.cargarPermisosUsuario = cargarPermisosUsuario;
window.configurarInterfazSegunPermisos = configurarInterfazSegunPermisos;
window.configurarModalSegunPermisos = configurarModalSegunPermisos;
window.mostrarModalFacturaPendiente = mostrarModalFacturaPendiente;
window.irAFacturasPendientes = irAFacturasPendientes;
window.imprimirComprobanteEnvio = imprimirComprobanteEnvio;
window.actualizarVistaProductosPostAjuste = actualizarVistaProductosPostAjuste;
window.abrirFacturasPendientes = abrirFacturasPendientes;
window.completarFacturaPendienteDirecto = completarFacturaPendienteDirecto;
window.procesarFacturaPendiente = procesarFacturaPendiente;
window.seleccionarFacturaPendiente = seleccionarFacturaPendiente;
window.cargarFacturaPendienteEnCarrito = cargarFacturaPendienteEnCarrito;
window.verDetalleFacturaPendiente = verDetalleFacturaPendiente;
window.completarFacturaExistente = completarFacturaExistente;
window.crearNuevaFactura = crearNuevaFactura;
window.generarReciboFacturaCompletada = generarReciboFacturaCompletada;
window.activarPagoMultiple = activarPagoMultiple;
window.activarPagoSimple = activarPagoSimple;
window.agregarNuevoPago = agregarNuevoPago;
window.eliminarPago = eliminarPago;
window.validarPagosMultiples = validarPagosMultiples;
window.eliminarProductoProblema = eliminarProductoProblema;
window.eliminarProductoConProblema = eliminarProductoConProblema;
window.facturarTodosModos = facturarTodosModos;
window.cancelarProblemasStock = cancelarProblemasStock;
window.registrarProductosPendientesEntrega = registrarProductosPendientesEntrega;

// Estilos CSS para cards de productos
const estilosCSS = `
/* ===== ESTILOS PARA CARDS DE PRODUCTOS ===== */
.producto-card-imagen-container {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    overflow: hidden; /* Importante para que la imagen no se desborde */
}

.producto-card-imagen {
    width: 100%;
    height: 100%;
    object-fit: cover; /* La imagen cubre el contenedor manteniendo su relación de aspecto */
    transition: transform 0.3s ease; /* Transición suave para efectos hover */
}

.producto-card:hover .producto-card-imagen {
    transform: scale(1.05); /* Ligeramente más grande al hacer hover */
}

.producto-card-sin-imagen {
    color: #6c757d;
    font-size: 3rem;
}

.producto-card-body {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
}

.producto-card-titulo {
    margin-bottom: 0.3rem;
    font-size: 1rem;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.producto-card-descripcion {
    font-size: 0.8rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
    flex-grow: 1;
}

.producto-card-precio {
    font-size: 1rem;
    color: #28a745;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.producto-card-stock {
    font-size: 0.75rem;
    color: #fff;
    padding: 0.2rem 0.4rem;
    border-radius: 0.2rem;
    margin-bottom: 0.5rem;
}

.producto-card-acciones {
    display: grid;
    gap: 0.3rem;
}

/* ===== MEDIA QUERIES PARA RESPONSIVE ===== */
/* Para pantallas más pequeñas, como teléfonos */
@media (max-width: 576px) {
    .producto-card-imagen-container {
        height: 150px; /* Aumenta la altura en pantallas pequeñas */
    }

    .producto-card-titulo {
        font-size: 0.9rem; /* Reduce el tamaño del título */
    }

    .producto-card-descripcion {
        display: none; /* Oculta la descripción en pantallas muy pequeñas */
    }
}

/* Para tabletas */
@media (min-width: 577px) and (max-width: 992px) {
    .producto-card-imagen-container {
        height: 180px; /* Altura moderada para tabletas */
    }

    .producto-card-titulo {
        font-size: 0.95rem; /* Tamaño de título ligeramente menor */
    }
}
`;

// Agregar estilos al head del documento
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = estilosCSS;
document.head.appendChild(styleSheet);


// =====================================
// FUNCIÓN DEBOUNCE PARA BÚSQUEDA
// =====================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}