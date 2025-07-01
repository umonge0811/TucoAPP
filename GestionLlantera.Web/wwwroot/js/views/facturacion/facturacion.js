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
    tarjeta: { multiplicador: 1.05, nombre: 'Tarjeta', icono: 'bi-credit-card' } // 5% adicional para tarjeta
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

// ===== INICIALIZACIÓN =====
$(document).ready(function() {
    console.log('🚀 Inicializando módulo de facturación');
    inicializarFacturacion();
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

    // ===== BOTÓN FACTURAS PENDIENTES =====
    $('#btnFacturasPendientes').on('click', function() {
        abrirFacturasPendientes();
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
        facturaPendienteActual = null; // ✅ LIMPIAR FACTURA PENDIENTE
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

    console.log('📋 === DEPURACIÓN CLIENTE SELECCIONADO ===');
    console.log('📋 Cliente completo:', clienteSeleccionado);
    console.log('📋 Propiedades disponibles:', Object.keys(clienteSeleccionado || {}));
    console.log('📋 Factura pendiente actual:', facturaPendienteActual);

    // ===== MOSTRAR/OCULTAR INFORMACIÓN DE FACTURA PENDIENTE =====
    if (facturaPendienteActual && facturaPendienteActual.esFacturaPendiente) {
        console.log('📋 Mostrando información de factura pendiente');
        $('#infoFacturaPendiente').show();
        $('#numeroFacturaPendiente').text(facturaPendienteActual.numeroFactura || 'N/A');
    } else {
        console.log('📋 Ocultando información de factura pendiente');
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

    // ===== DEPURACIÓN: VERIFICAR QUE LOS CAMPOS SE LLENARON =====
    console.log('📋 === VERIFICACIÓN DE CAMPOS LLENADOS ===');
    console.log('📋 Nombre:', $('#clienteNombre').val());
    console.log('📋 Cédula:', $('#clienteCedula').val());
    console.log('📋 Teléfono:', $('#clienteTelefono').val());
    console.log('📋 Email:', $('#clienteEmail').val());
    console.log('📋 Dirección:', $('#clienteDireccion').val());

    // ===== CONFIGURAR MÉTODO DE PAGO INICIAL =====
    $('input[name="metodoPago"][value="efectivo"]').prop('checked', true);
    
    // ===== INICIALIZAR PAGOS MÚLTIPLES =====
    detallesPagoActuales = [];
    esPagoMultiple = false;
    $('#pagoMultipleContainer').hide();
    $('#pagoSimpleContainer').show();

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

function configurarModalSegunPermisos() {
    const $btnConfirmar = $('#btnConfirmarVenta');
    const $textoBoton = $('#textoBotonConfirmar');
    const $tituloModal = $('#modalFinalizarVentaLabel');

    console.log('🎯 === CONFIGURANDO MODAL SEGÚN PERMISOS ===');
    console.log('🎯 Permisos del usuario:', permisosUsuario);
    console.log('🎯 puedeCompletarFacturas:', permisosUsuario.puedeCompletarFacturas);
    console.log('🎯 puedeCrearFacturas:', permisosUsuario.puedeCrearFacturas);
    console.log('🎯 esAdmin:', permisosUsuario.esAdmin);

    // Resetear el botón completamente
    $btnConfirmar.removeClass('btn-warning btn-secondary btn-info btn-success btn-primary').prop('disabled', false);

    if (permisosUsuario.puedeCompletarFacturas || permisosUsuario.esAdmin) {
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

    console.log('🎯 Estado final del modal:', {
        titulo: $tituloModal.html(),
        disabled: $btnConfirmar.prop('disabled'),
        classes: $btnConfirmar.attr('class'),
        texto: $textoBoton.text(),
        permisos: permisosUsuario
    });
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
        // Deshabilitar el botón y mostrar el estado de carga
        $btnFinalizar.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...');

        // ✅ VERIFICAR SI ES UNA FACTURA PENDIENTE (tiene facturaId en algún producto)
        const esFacturaPendiente = productosEnVenta.some(p => p.facturaId);
        const facturaId = esFacturaPendiente ? productosEnVenta[0].facturaId : null;

        console.log('🔍 === DETERMINANDO TIPO DE OPERACIÓN ===');
        console.log('🔍 Es factura pendiente:', esFacturaPendiente);
        console.log('🔍 Factura ID:', facturaId);

        if (esFacturaPendiente && facturaId) {
            // ✅ COMPLETAR FACTURA EXISTENTE
            console.log('✅ Completando factura pendiente ID:', facturaId);
            await completarFacturaExistente(facturaId);
        } else {
            // ✅ CREAR NUEVA FACTURA
            console.log('🆕 Creando nueva factura');
            await crearNuevaFactura();
        }

    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        
        // ✅ MOSTRAR ERROR CON SWEETALERT
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
        // Restaurar botón
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

        const metodoPagoSeleccionado = $('input[name="metodoPago"]:checked').val() || 'efectivo';
        
        const datosCompletamiento = {
            metodoPago: metodoPagoSeleccionado,
            observaciones: $('#observacionesVenta').val() || '',
            fechaCompletamiento: new Date().toISOString()
        };

        const response = await fetch(`/Facturacion/CompletarFactura/${facturaId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor al completar factura:', errorText);
            throw new Error(`Error al completar la factura: ${response.status} - ${errorText}`);
        }

        const resultado = await response.json();
        console.log('✅ Factura completada:', resultado);

        if (resultado.success) {
            // ✅ GUARDAR PRODUCTOS ACTUALES ANTES DE LIMPIAR PARA EL RECIBO
            const productosParaRecibo = [...productosEnVenta];
            
            // ✅ CERRAR MODAL INMEDIATAMENTE
            modalFinalizarVenta.hide();
            
            // ✅ GENERAR E IMPRIMIR RECIBO ANTES DE LIMPIAR
            generarReciboFacturaCompletada(resultado, productosParaRecibo, metodoPagoSeleccionado);
            
            // ✅ LIMPIAR CARRITO COMPLETAMENTE
            productosEnVenta = [];
            clienteSeleccionado = null;
            facturaPendienteActual = null; // ✅ LIMPIAR FACTURA PENDIENTE
            $('#clienteBusqueda').val('');
            $('#clienteSeleccionado').addClass('d-none');
            actualizarVistaCarrito();
            actualizarTotales();
            actualizarEstadoBotonFinalizar();

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
            throw new Error(resultado.message || 'Error al completar la factura');
        }

    } catch (error) {
        console.error('❌ Error completando factura existente:', error);
        throw error;
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Crear nueva factura
 */
async function crearNuevaFactura() {
    try {
        console.log('🆕 === CREANDO NUEVA FACTURA ===');

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

        // ✅ DETERMINAR ESTADO Y PERMISOS SEGÚN LA LÓGICA CORRECTA
        let estadoFactura, mensajeExito, debeImprimir, debeAjustarInventario;

        console.log('🔐 === VERIFICACIÓN DE PERMISOS ===');
        console.log('🔐 puedeCompletarFacturas:', permisosUsuario.puedeCompletarFacturas);
        console.log('🔐 puedeCrearFacturas:', permisosUsuario.puedeCrearFacturas);

        if (permisosUsuario.puedeCompletarFacturas) {
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
            estadoFactura,
            debeImprimir,
            debeAjustarInventario,
            permisos: permisosUsuario
        });

        // Obtener información del usuario actual
        const usuarioActual = obtenerUsuarioActual();
        const usuarioId = usuarioActual?.usuarioId || usuarioActual?.id || 1;

        console.log('👤 Usuario actual para factura:', {
            usuario: usuarioActual,
            usuarioId: usuarioId
        });

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
            estado: estadoFactura, // ✅ Estado dinámico según permisos
            tipoDocumento: 'Factura',
            metodoPago: metodoPagoSeleccionado,
            observaciones: $('#observacionesVenta').val() || '',
            usuarioCreadorId: usuarioId, // ✅ ID del usuario actual
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

        console.log('📋 Datos de factura preparados:', facturaData);

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

        if (resultadoFactura.success) {
            // ✅ PROCESAR SEGÚN EL TIPO DE USUARIO Y PERMISOS
            if (estadoFactura === 'Pendiente') {
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
                    generarRecibo(resultadoFactura, productosEnVenta, {
                        subtotal: subtotal,
                        iva: iva,
                        total: total,
                        metodoPago: metodoPagoSeleccionado,
                        cliente: clienteSeleccionado,
                        usuario: obtenerUsuarioActual()
                    });
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

            // ✅ LIMPIAR CARRITO DESPUÉS DE PROCESAR (PARA AMBOS CASOS)
            productosEnVenta = [];
            clienteSeleccionado = null;
            $('#clienteBusqueda').val('');
            $('#clienteSeleccionado').addClass('d-none');
            actualizarVistaCarrito();
            actualizarTotales();
            actualizarEstadoBotonFinalizar();

            // ✅ ACTUALIZAR VISTA DE PRODUCTOS DESPUÉS DE COMPLETAR LA VENTA
            setTimeout(async () => {
                try {
                    await actualizarVistaProductosPostAjuste();
                } catch (error) {
                    console.error('❌ Error actualizando vista después de venta:', error);
                }
            }, 500);

        } else {
            // ✅ MOSTRAR ERROR CON SWEETALERT
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al procesar la venta',
                    text: resultadoFactura.message || 'Error desconocido',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#dc3545'
                });
            } else {
                alert('Error: ' + (resultadoFactura.message || 'Error al procesar la venta'));
            }
        }

    } catch (error) {
        console.error('❌ Error creando nueva factura:', error);
        throw error;
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

    // ✅ DETERMINAR NÚMERO DE FACTURA CORRECTAMENTE
    let numeroFactura = 'N/A';
    
    // Prioridad 1: Desde la factura pasada como parámetro
    if (factura && factura.numeroFactura) {
        numeroFactura = factura.numeroFactura;
    }
    // Prioridad 2: Desde factura pendiente global si existe
    else if (facturaPendienteActual && facturaPendienteActual.numeroFactura) {
        numeroFactura = facturaPendienteActual.numeroFactura;
    }
    // Prioridad 3: Verificar si los productos tienen facturaId (factura existente)
    else if (productos && productos.length > 0 && productos[0].facturaId) {
        numeroFactura = `FAC-${productos[0].facturaId}`;
    }

    console.log('🖨️ === GENERANDO RECIBO ===');
    console.log('🖨️ Número de factura determinado:', numeroFactura);
    console.log('🖨️ Fuente del número:', {
        desdeParametro: factura?.numeroFactura,
        desdePendiente: facturaPendienteActual?.numeroFactura,
        desdeProductos: productos?.[0]?.facturaId
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
                <div style="font-size: 8px;">No. ${numeroFactura}</div>
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
                <div style="margin-bottom: 2px.">Vuelva pronto</div>
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

        

    } catch (error) {
        console.error('❌ Error al imprimir recibo:', error);
        mostrarToast('Error de Impresión', 'No se pudo imprimir el recibo: ' + error.message, 'danger');

        // Fallback: mostrar el recibo en pantalla para copiar/imprimir manualmente
        mostrarReciboEnPantalla(reciboHTML, factura.numeroFactura);
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

        // Calcular totales basándose en los productos del carrito
        const configMetodo = CONFIGURACION_PRECIOS[metodoPago] || CONFIGURACION_PRECIOS['efectivo'];
        
        let subtotal = 0;
        productos.forEach(producto => {
            const precioAjustado = producto.precioUnitario * configMetodo.multiplicador;
            subtotal += precioAjustado * producto.cantidad;
        });

        const iva = subtotal * 0.13;
        const total = subtotal + iva;

        // ✅ CREAR OBJETO DE DATOS COMPLETO USANDO MÚLTIPLES FUENTES
        const datosRecibo = {
            numeroFactura: resultadoFactura.numeroFactura || 
                          facturaPendienteActual?.numeroFactura || 
                          'N/A',
            usuarioCreadorNombre: resultadoFactura.usuarioCreadorNombre || 
                                 facturaPendienteActual?.usuarioCreadorNombre || 
                                 'Sistema'
        };

        const totalesRecibo = {
            subtotal: subtotal,
            iva: iva,
            total: total,
            metodoPago: metodoPago,
            cliente: clienteSeleccionado,
            usuario: obtenerUsuarioActual()
        };

        console.log('🖨️ Datos del recibo preparados:', {
            datosRecibo,
            cantidadProductos: productos.length,
            totalCalculado: total
        });

        // Usar la función existente de generación de recibos
        generarRecibo(datosRecibo, productos, totalesRecibo);

        console.log('✅ Recibo de factura completada generado exitosamente');

    } catch (error) {
        console.error('❌ Error generando recibo para factura completada:', error);
        // No mostrar error al usuario para no interrumpir el flujo exitoso
        console.warn('⚠️ La factura se completó correctamente pero no se pudo imprimir el recibo');
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

    // ✅ IMPLEMENTACIÓN DE TOAST VISUAL
    try {
        // Verificar si existe un contenedor de toasts
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            // Crear contenedor de toasts
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Mapear tipos de toast a clases de Bootstrap
        const tipoClases = {
            'success': 'text-bg-success',
            'error': 'text-bg-danger',
            'danger': 'text-bg-danger',
            'warning': 'text-bg-warning',
            'info': 'text-bg-info'
        };

        const claseColor = tipoClases[tipo] || 'text-bg-info';

        // Crear toast HTML
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast ${claseColor}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">${titulo}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${mensaje}
                </div>
            </div>
        `;

        // Agregar toast al contenedor
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Mostrar toast usando Bootstrap
        const toastElement = document.getElementById(toastId);
        if (toastElement && typeof bootstrap !== 'undefined') {
            const toast = new bootstrap.Toast(toastElement, {
                delay: tipo === 'success' ? 5000 : 3000 // 5 segundos para éxito, 3 para otros
            });
            toast.show();

            // Limpiar toast después de que se oculte
            toastElement.addEventListener('hidden.bs.toast', function() {
                this.remove();
            });
        }

    } catch (error) {
        console.error('❌ Error mostrando toast:', error);
        // Fallback a alert si falla el toast
        alert(`${titulo}: ${mensaje}`);
    }
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
    console.log('📋 === ABRIENDO FACTURAS PENDIENTES ===');
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('facturasPendientesModal'));
    modal.show();
    
    // Mostrar loading y ocultar contenido
    $('#facturasPendientesLoading').show();
    $('#facturasPendientesContent').hide();
    $('#facturasPendientesEmpty').hide();
    
    try {
        console.log('📋 Enviando petición al servidor...');
        
        // Cargar facturas pendientes desde el servidor
        const response = await fetch('/Facturacion/ObtenerFacturasPendientes', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('📋 Respuesta recibida:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log('📋 === DEBUGGING RESPUESTA COMPLETA ===');
        console.log('📋 Resultado completo:', resultado);
        console.log('📋 Tipo de resultado:', typeof resultado);
        console.log('📋 Propiedades del resultado:', Object.keys(resultado || {}));

        // Procesar la estructura de respuesta del controlador Web
        let facturas = null;
        
        if (resultado) {
            // CASO 1: Respuesta directa como array de facturas
            if (Array.isArray(resultado)) {
                facturas = resultado;
                console.log('✅ Facturas encontradas como array directo:', facturas.length);
            }
            // CASO 2: Objeto con propiedad 'facturas'
            else if (resultado.facturas && Array.isArray(resultado.facturas)) {
                facturas = resultado.facturas;
                console.log('✅ Facturas encontradas en resultado.facturas:', facturas.length);
            }
            // CASO 3: Objeto con estructura anidada desde el API
            else if (typeof resultado === 'object' && !resultado.success) {
                // Si el objeto no tiene 'success: false', podría ser la estructura del API
                // Buscar cualquier propiedad que contenga un array
                for (const [key, value] of Object.entries(resultado)) {
                    if (Array.isArray(value) && value.length > 0) {
                        // Verificar si parece ser un array de facturas
                        const firstItem = value[0];
                        if (firstItem && typeof firstItem === 'object' && 
                            (firstItem.facturaId || firstItem.numeroFactura)) {
                            facturas = value;
                            console.log(`✅ Facturas encontradas en resultado.${key}:`, facturas.length);
                            break;
                        }
                    }
                }
                
                // Si no encontramos facturas en propiedades directas, buscar en 'data'
                if (!facturas && resultado.data) {
                    if (Array.isArray(resultado.data)) {
                        facturas = resultado.data;
                        console.log('✅ Facturas encontradas en resultado.data como array:', facturas.length);
                    }
                    else if (resultado.data.facturas && Array.isArray(resultado.data.facturas)) {
                        facturas = resultado.data.facturas;
                        console.log('✅ Facturas encontradas en resultado.data.facturas:', facturas.length);
                    }
                }
            }
            // CASO 4: Respuesta de error explícita
            else if (resultado.success === false) {
                console.log('❌ Respuesta de error del servidor:', resultado.message);
                facturas = [];
            }
            
            // Debug detallado si no encontramos facturas
            if (!facturas) {
                console.log('⚠️ No se encontraron facturas. Análisis detallado:');
                console.log('📋 Es array directo?:', Array.isArray(resultado));
                console.log('📋 Tiene propiedad facturas?:', 'facturas' in resultado);
                console.log('📋 Tiene propiedad data?:', 'data' in resultado);
                console.log('📋 Tiene propiedad success?:', 'success' in resultado);
                console.log('📋 Todas las propiedades:', Object.keys(resultado));
                
                // Intentar encontrar cualquier array en la respuesta
                const arrayProperties = Object.entries(resultado)
                    .filter(([key, value]) => Array.isArray(value))
                    .map(([key, value]) => ({ key, length: value.length }));
                console.log('📋 Propiedades tipo array encontradas:', arrayProperties);
                
                // Establecer array vacío como fallback
                facturas = [];
            }
        }

        if (facturas && facturas.length > 0) {
            console.log('📋 Mostrando', facturas.length, 'facturas pendientes');
            mostrarFacturasPendientes(facturas);
        } else {
            console.log('📋 No se encontraron facturas pendientes');
            mostrarSinFacturasPendientes();
        }

    } catch (error) {
        console.error('❌ Error cargando facturas pendientes:', error);
        $('#facturasPendientesLoading').hide();
        $('#facturasPendientesContent').html(`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al cargar las facturas pendientes: ${error.message}
                <br><small class="text-muted">Revisa la consola para más detalles</small>
            </div>
        `).show();
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
function procesarFacturaPendiente(facturaEscapada) {
    try {
        const factura = JSON.parse(facturaEscapada.replace(/&quot;/g, '"'));
        console.log('🔄 === PROCESANDO FACTURA PENDIENTE ===');
        console.log('🔄 Factura:', factura);
        
        // Cerrar modal de facturas pendientes
        $('#facturasPendientesModal').modal('hide');
        
        // Cargar los datos de la factura en el carrito
        cargarFacturaPendienteEnCarrito(factura);
        
        // Mostrar modal de finalización después de cargar los datos
        setTimeout(() => {
            mostrarModalFinalizarVenta();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error procesando factura pendiente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo procesar la factura seleccionada',
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

// ===== HACER FUNCIONES Y VARIABLES GLOBALES =====
window.facturaPendienteActual = facturaPendienteActual;
window.recargarPermisosUsuario = recargarPermisosUsuario;
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