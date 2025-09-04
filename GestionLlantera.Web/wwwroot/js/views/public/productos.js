// ========================================
// VISTA PÚBLICA DE PRODUCTOS - JAVASCRIPT
// ========================================

// Variables globales
let todosLosProductos = []; // Todos los productos cargados
let productosLlantas = []; // Solo las llantas para filtros
let paginaActual = 1; // Página actual de resultados
let tamañoPagina = 12; // Cantidad de productos por página
let totalProductos = 0; // Total de productos disponibles
let totalPaginas = 0; // Total de páginas calculadas
let productosActuales = []; // Productos mostrados en la vista actual (para lazy loading)
let cargandoProductos = false; // Flag para evitar cargas concurrentes
let modoLazyLoading = false; // Para alternar entre paginación y lazy loading

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de productos públicos cargado');

    // Inicializar texto de resultados
    const textoResultados = document.getElementById('textoResultados');
    if (textoResultados) {
        textoResultados.textContent = 'Cargando productos...';
    }

    // Inicializar funcionalidades
    inicializarEventos();
    inicializarFiltros();
    inicializarEventosPaginacion(); // Nueva función para eventos de paginación
    cargarProductosIniciales();
    inicializarAnimaciones();

    console.log('✅ Vista pública de productos inicializada correctamente');
});

// ========================================
// CARGAR PRODUCTOS INICIALES
// ========================================
async function cargarProductosIniciales() {
    try {
        console.log('🔄 Cargando productos iniciales para vista pública...');

        // Mostrar loading mientras se cargan los productos
        mostrarLoading();

        // Cargar productos usando el endpoint que sabemos que funciona
        // Se pasa página 1 y sin flag de carga adicional
        await buscarProductos('', 1, false);

        console.log('✅ Productos iniciales cargados exitosamente');

    } catch (error) {
        console.error('❌ Error cargando productos iniciales:', error);
        mostrarError('Error al cargar los productos iniciales: ' + error.message);
    }
}

// ========================================
// FUNCIÓN PRINCIPAL DE BÚSQUEDA (MODIFICADA PARA PAGINACIÓN)
// ========================================
async function buscarProductos(termino = '', pagina = 1, cargarMas = false) {
    if (cargandoProductos) {
        console.log('⏳ Ya se están cargando productos, se ignora esta solicitud.');
        return;
    }
    cargandoProductos = true;
    console.log(`🔍 === INICIO buscarProductos (Vista Pública) ===`);
    console.log(`🔍 Término recibido: "${termino}", Página: ${pagina}, Cargar Más: ${cargarMas}`);

    // Mostrar loading
    if (!cargarMas) {
        mostrarLoading(); // Mostrar loading general si no es "cargar más"
    } else {
        mostrarLoadingCargarMas(); // Mostrar loading específico para el botón "Cargar más"
    }

    // ✅ USAR LA MISMA URL Y LÓGICA QUE EL ENDPOINT EXITOSO DE FACTURACIÓN
    // Se agrega el parámetro de página a la URL si el backend lo soporta
    const url = `/Public/ObtenerProductosParaFacturacion?page=${pagina}&pageSize=${tamañoPagina}`;
    console.log(`🔍 URL de la solicitud: ${url}`);

    try {
        const response = await fetch(url, {
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
        console.log('📋 Respuesta del servidor recibida:', data);

        // ✅ GUARDAR RESPUESTA DEL SERVIDOR PARA EVITAR DUPLICACIONES
        window.lastServerResponse = data;

        if (data.success && data.productos) {
            console.log(`✅ Se encontraron ${data.productos.length} productos del servidor`);
            console.log('📋 Estructura de datos recibida:', data);

            // ✅ GESTIÓN DE PRODUCTOS SEGÚN TIPO DE CARGA
            if (cargarMas) {
                // Agregar productos sin duplicar
                productosActuales = [...productosActuales, ...data.productos];
                todosLosProductos = [...todosLosProductos, ...data.productos];
            } else {
                // Reemplazar productos completamente
                productosActuales = [...data.productos];
                todosLosProductos = [...data.productos];
            }

            // ✅ ACTUALIZAR VARIABLES DE PAGINACIÓN BASADAS EN SERVIDOR
            if (data.paginacion) {
                totalProductos = data.paginacion.totalRegistros;
                totalPaginas = data.paginacion.totalPaginas;
                paginaActual = data.paginacion.paginaActual;
                console.log('📊 Paginación del servidor:', data.paginacion);
            } else {
                totalProductos = data.productos.length;
                totalPaginas = 1;
                paginaActual = 1;
                console.log('📊 Sin paginación, usando conteo directo:', totalProductos);
            }

            // ✅ MOSTRAR PRODUCTOS Y ACTUALIZAR UI
            await mostrarResultados(data.productos, cargarMas);
            console.log('📦 Productos mostrados exitosamente en vista pública');

            // ✅ GESTIONAR PAGINACIÓN Y LAZY LOADING
            if (data.paginacion) {
                actualizarControlesPaginacion(data.paginacion);
                ocultarBotonCargarMas();
            } else {
                mostrarPaginacionSiEsNecesaria();
            }
        } else {
            console.warn('⚠️ Respuesta exitosa pero sin productos válidos:', data);
            mostrarMensaje('No se encontraron productos', 'info');
        }
    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        if (!cargarMas) {
            mostrarError('Error al buscar productos: ' + error.message);
        } else {
            // Si falla la carga adicional, mostrar un mensaje de error temporal
            $('#productosContainer').append(`
                <div class="col-12 text-center py-3 alert alert-danger">
                    Error al cargar más productos. Intenta de nuevo.
                </div>
            `);
            ocultarLoadingCargarMas();
        }
    } finally {
        cargandoProductos = false; // Liberar el flag de carga
        if (!cargarMas) {
            ocultarLoading(); // Ocultar loading general
        }
    }
    console.log(`🔍 === FIN buscarProductos (Vista Pública) ===`);
}


// ========================================
// ANIMACIONES AL CARGAR
// ========================================
function inicializarAnimaciones() {
    // Animar elementos al hacer scroll
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observar todas las cards de productos
    const productos = document.querySelectorAll('.producto-item');
    productos.forEach(function (producto) {
        observer.observe(producto);
    });
}

// ========================================
// FUNCIONES DE UI - IMPLEMENTACIÓN REAL
// ========================================
function mostrarLoading() {
    const container = document.getElementById('productosContainer') || document.getElementById('listaProductos');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <div class="mt-3">Buscando productos...</div>
            </div>
        `;
    }
}

function ocultarLoading() {
    // La función mostrarResultados y renderizarProductosAdicionales ya se encargan de limpiar el loading
    // o se usa el spinner específico para "cargar más"
}

function mostrarResultados(productos) {
    console.log('🔄 === INICIO mostrarResultados ===');
    console.log('🔄 Productos recibidos:', productos ? productos.length : 'null/undefined');

    const container = document.getElementById('productosContainer') || document.getElementById('listaProductos');
    const noResultadosDiv = document.getElementById('noResultados');

    if (!productos || productos.length === 0) {
        console.log('🔄 No hay productos, mostrando sin resultados');
        mostrarSinResultados();
        return;
    }

    if (!container) {
        console.error('❌ Container de productos no encontrado');
        return;
    }

    // ✅ GUARDAR PRODUCTOS GLOBALMENTE Y FILTRAR LLANTAS
    todosLosProductos = productos;
    productosLlantas = productos.filter(p => p.esLlanta && p.llanta);
    productosActuales = productos; // Actualizar productos actuales

    // ✅ POBLAR FILTROS CON DATOS REALES
    poblarFiltrosLlantas();

    // Limpiar container
    container.innerHTML = '';

    // Ocultar mensaje de sin resultados
    if (noResultadosDiv) {
        noResultadosDiv.style.display = 'none';
    }

    // Generar HTML para cada producto
    productos.forEach((producto, index) => {
        const card = crearCardProducto(producto);
        container.appendChild(card);

        // Animación escalonada
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    console.log(`✅ ${productos.length} productos mostrados en vista pública`);
}

function crearCardProducto(producto) {
    // ✅ EXTRAER DATOS DEL PRODUCTO (MISMA LÓGICA QUE FACTURACIÓN)
    const productoId = producto.productoId;
    const nombreProducto = producto.nombreProducto || 'Sin nombre';
    const descripcion = producto.descripcion || '';
    const precio = producto.precio || 0;
    const cantidadInventario = producto.cantidadEnInventario || 0;
    const stockMinimo = producto.stockMinimo || 0;
    const esLlanta = producto.esLlanta || false;

    // ✅ PROCESAR IMAGEN - LÓGICA MEJORADA Y CONSISTENTE
    let imagenUrl = '/images/no-image.png';
    try {
        console.log(`🖼️ Procesando imágenes para: ${nombreProducto}`, {
            imagenesUrls: producto.imagenesUrls,
            imagenesProductos: producto.imagenesProductos
        });

        let imagenEncontrada = false;

        // 1. Verificar imagenesUrls (formato directo)
        if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
            const urlDirecta = producto.imagenesUrls[0];
            if (urlDirecta && urlDirecta.trim() !== '') {
                imagenUrl = construirUrlImagen(urlDirecta);
                imagenEncontrada = true;
                console.log(`🖼️ ✅ Imagen desde imagenesUrls: ${imagenUrl}`);
            }
        }

        // 2. Si no se encontró, verificar imagenesProductos (formato con objetos)
        if (!imagenEncontrada && producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
            const primeraImagen = producto.imagenesProductos[0];
            if (primeraImagen) {
                // Intentar diferentes propiedades de URL (case-insensitive)
                const urlImagen = primeraImagen.Urlimagen || primeraImagen.urlimagen ||
                                 primeraImagen.UrlImagen || primeraImagen.urlImagen;

                if (urlImagen && urlImagen.trim() !== '') {
                    imagenUrl = construirUrlImagen(urlImagen);
                    imagenEncontrada = true;
                    console.log(`🖼️ ✅ Imagen desde imagenesProductos: ${imagenUrl}`);
                }
            }
        }

        if (!imagenEncontrada) {
            console.warn(`🖼️ ⚠️ No se encontró imagen válida para: ${nombreProducto}`);
        }

    } catch (error) {
        console.warn('⚠️ Error procesando imágenes del producto:', error);
        imagenUrl = '/images/no-image.png';
    }

    // ✅ FUNCIÓN AUXILIAR PARA CONSTRUIR URL COMPLETA DE IMAGEN
    function construirUrlImagen(url) {
        if (!url || url.trim() === '') {
            return '/images/no-image.png';
        }

        console.log(`🔧 construirUrlImagen - URL recibida:`, url);
        console.log(`🔧 construirUrlImagen - Hostname actual:`, window.location.hostname);
        console.log(`🔧 construirUrlImagen - Protocol actual:`, window.location.protocol);

        // DETECTAR ENTORNO
        const esDesarrollo = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost');

        const esHTTPS = window.location.protocol === 'https:';

        // Si es una URL completa del dominio de producción en desarrollo local, convertirla
        if (esDesarrollo && url.includes('apillantasymast.somee.com')) {
            // Extraer solo la parte relativa de la URL
            const match = url.match(/\/uploads\/productos\/.+$/);
            if (match) {
                const rutaRelativa = match[0];
                // Usar la API local con HTTPS si el frontend está en HTTPS
                const protocoloLocal = esHTTPS ? 'https' : 'http';
                const puertoLocal = esHTTPS ? '7273' : '5049'; // PUERTOS DE EJEMPLO, AJUSTAR SI ES NECESARIO
                const urlLocal = `${protocoloLocal}://localhost:${puertoLocal}${rutaRelativa}`;
                console.log(`🔧 ✅ URL convertida para desarrollo: ${urlLocal}`);
                return urlLocal;
            }
        }

        // Si ya es una URL completa y estamos en producción, asegurar HTTPS
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // En desarrollo local, mantener la URL tal como está si es de localhost
            if (esDesarrollo && url.includes('localhost')) {
                return url;
            }

            // En producción, asegurar HTTPS
            if (!esDesarrollo && url.startsWith('http://')) {
                const urlHTTPS = url.replace('http://', 'https://');
                console.log(`🔧 ✅ URL convertida a HTTPS: ${urlHTTPS}`);
                return urlHTTPS;
            }

            return url;
        }

        // Si es una URL relativa que empieza con /uploads/, construir URL completa
        if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
            // Asegurar que la URL empiece con /
            const urlLimpia = url.startsWith('/') ? url : `/${url}`;

            if (esDesarrollo) {
                // Para desarrollo local, usar localhost con el protocolo correcto
                const protocoloLocal = esHTTPS ? 'https' : 'http';
                const puertoLocal = esHTTPS ? '7273' : '5049'; // PUERTOS DE EJEMPLO
                const urlLocal = `${protocoloLocal}://localhost:${puertoLocal}${urlLimpia}`;
                console.log(`🔧 ✅ URL construida para desarrollo: ${urlLocal}`);
                return urlLocal;
            } else {
                // Para producción, usar HTTPS
                const urlProduccion = `https://apillantasymast.somee.com${urlLimpia}`;
                console.log(`🔧 ✅ URL construida para producción: ${urlProduccion}`);
                return urlProduccion;
            }
        }

        // Si es otro tipo de URL relativa, usar imagen por defecto
        console.log(`🔧 ⚠️ URL no reconocida, usando imagen por defecto`);
        return '/images/no-image.png';
    }

    // ✅ PROCESAR INFORMACIÓN DE LLANTA (MISMA LÓGICA QUE FACTURACIÓN)
    let medidaCompleta = '';
    let infoLlanta = '';

    if (esLlanta && producto.llanta) {
        try {
            const llantaInfo = producto.llanta;
            if (llantaInfo.medidaCompleta) {
                medidaCompleta = llantaInfo.medidaCompleta;
            } else if (llantaInfo.ancho && llantaInfo.diametro) {
                if (llantaInfo.perfil && llantaInfo.perfil > 0) {
                    medidaCompleta = `${llantaInfo.ancho}/${llantaInfo.perfil}/R${llantaInfo.diametro}`;
                } else {
                    medidaCompleta = `${llantaInfo.ancho}/R${llantaInfo.diametro}`;
                }
            }

            if (medidaCompleta) {
                infoLlanta = `<div class="medida-llanta"><span class="badge">${medidaCompleta}</span></div>`;
            }
        } catch (error) {
            console.warn('⚠️ Error procesando información de llanta:', error);
        }
    }

    // ✅ CALCULAR PRECIOS CON IVA INCLUIDO
    const CONFIGURACION_PRECIOS = {
        efectivo: { multiplicador: 1.0 },
        tarjeta: { multiplicador: 1.05 }
    };

    const precioBase = (typeof precio === 'number') ? precio : 0;

    // Calcular precio final con IVA (13%) para efectivo/transferencia/sinpe
    const precioFinalEfectivo = (precioBase * CONFIGURACION_PRECIOS.efectivo.multiplicador) * 1.13;

    // Para tarjeta se aplica el 5% adicional sobre el precio base + IVA
    const precioFinalTarjeta = (precioBase * CONFIGURACION_PRECIOS.tarjeta.multiplicador) * 1.13;

    // ✅ DETERMINAR ESTADO DEL STOCK
    const stockEstado = cantidadInventario <= 0 ? 'sin-stock' :
        cantidadInventario <= stockMinimo ? 'stock-bajo' : 'stock-normal';

    // ✅ CREAR CARD HTML MINIMALISTA
    const card = document.createElement('div');
    card.className = 'col-lg-4 col-md-6 mb-4 producto-item'; // Añadido clase producto-item para observador
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';



    card.innerHTML = `
        <div class="producto-card ${stockEstado}">
            <!-- Imagen del Producto -->
            <div class="producto-imagen-container">
                <img src="${imagenUrl}" 
                     class="producto-imagen" 
                     alt="${nombreProducto}"
                     onerror="this.onerror=null; this.src='/images/no-image.png';">
                ${infoLlanta}

                <!-- Overlay con botón -->
                <div class="producto-overlay">
                    <button class="btn-ver-detalle" onclick="verDetalleProducto(${productoId})">
                        <i class="bi bi-eye"></i>
                        Ver detalles
                    </button>
                </div>
            </div>

            <!-- Información del Producto -->
            <div class="producto-info">
                <h3 class="producto-titulo" title="${nombreProducto}">
                    ${nombreProducto}
                </h3>

                <p class="producto-descripcion">
                    ${descripcion.substring(0, 60)}${descripcion.length > 60 ? '...' : ''}
                </p>

                <!-- Precio Final -->
                <div class="producto-precios">
                    <div class="precio-principal">
                        <span class="precio-valor-principal">
                            <span>₡${formatearMoneda(precioFinalEfectivo)}</span>
                            <small style="color: #e60000; font-size: 0.7rem; font-weight: 500;">I.V.I.</small>
                        </span>
                        <small class="precio-condiciones">
                            * Precio válido para Efectivo, Transferencia o SINPE Móvil
                        </small>
                    </div>
                </div>

                <!-- Stock -->
                <div class="producto-stock">
                    <span class="stock-texto">
                        ${cantidadInventario} ${cantidadInventario === 1 ? 'unidad' : 'unidades'} disponible${cantidadInventario === 1 ? '' : 's'}
                    </span>
                </div>
            </div>
        </div>
    `;

    // Animación de entrada
    setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);

    return card;
}

function mostrarSinResultados() {
    console.log('🔄 Mostrando sin resultados...');
    const container = document.getElementById('productosContainer') || document.getElementById('listaProductos');
    const noResultadosDiv = document.getElementById('noResultados');

    if (container) {
        container.innerHTML = ''; // Limpiar productos
    }

    // NO actualizar automáticamente el texto de resultados aquí
    // Dejar que actualizarInfoResultados() maneje eso basándose en el estado real

    if (noResultadosDiv) {
        noResultadosDiv.style.display = 'block';
    } else if (container) {
        // Si no existe el div de no resultados, crearlo
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <i class="bi bi-search fs-1 d-block mb-3"></i>
                    <h5>No se encontraron productos</h5>
                    <p class="mb-0">Intenta con otros términos de búsqueda</p>
                </div>
            </div>
        `;
    }
}

function mostrarError(mensaje) {
    console.error('❌ Mostrando error:', mensaje);
    const container = document.getElementById('productosContainer') || document.getElementById('listaProductos');

    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle fs-1 d-block mb-3"></i>
                    <h5>Error al cargar productos</h5>
                    <p class="mb-0">${mensaje}</p>
                    <button class="btn btn-outline-danger mt-3" onclick="cargarProductosIniciales()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

// ========================================
// UTILIDADES
// ========================================
function formatearMoneda(precio) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function formatearPrecio(precio) {
    return formatearMoneda(precio);
}


function verDetalleProducto(productoId) {
    console.log('🔍 Navegando a detalle del producto:', productoId);
    // Redirigir a la página de detalle del producto
    window.location.href = `/Public/DetalleProducto/${productoId}`;
}


// ========================================
// FILTRADO DE LLANTAS
// ========================================

function configurarFiltrosLlantas() {
    console.log('🔧 Configurando filtros de llantas...');

    // Event listeners para los filtros con dependencias
    document.getElementById('filtroMarca').addEventListener('change', () => {
        actualizarFiltrosDependientes();
        aplicarFiltrosLlantas();
    });
    document.getElementById('filtroAncho').addEventListener('change', () => {
        actualizarFiltrosDependientes();
        aplicarFiltrosLlantas();
    });
    document.getElementById('filtroPerfil').addEventListener('change', () => {
        actualizarFiltrosDependientes();
        aplicarFiltrosLlantas();
    });
    document.getElementById('filtroDiametro').addEventListener('change', aplicarFiltrosLlantas);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltrosLlantas);
}

function poblarFiltrosLlantas() {
    console.log('📋 Poblando filtros con llantas disponibles...');

    if (!productosLlantas || productosLlantas.length === 0) {
        console.log('⚠️ No hay llantas disponibles para filtrar');
        return;
    }

    // Poblar solo el filtro de marcas inicialmente
    const marcas = [...new Set(productosLlantas
        .map(p => p.llanta.marca)
        .filter(marca => marca && marca.trim() !== ''))].sort();

    const selectMarca = document.getElementById('filtroMarca');
    selectMarca.innerHTML = '<option value="">Todas las marcas</option>';
    marcas.forEach(marca => {
        selectMarca.innerHTML += `<option value="${marca}">${marca}</option>`;
    });

    // Inicializar el resto de filtros
    actualizarFiltrosDependientes();

    console.log(`✅ Filtros iniciales poblados: ${marcas.length} marcas`);
}

function actualizarFiltrosDependientes() {
    console.log('🔄 Actualizando filtros dependientes...');

    // Obtener valores seleccionados actualmente
    const marcaSeleccionada = document.getElementById('filtroMarca').value;
    const anchoSeleccionado = document.getElementById('filtroAncho').value;
    const perfilSeleccionado = document.getElementById('filtroPerfil').value;
    const diametroSeleccionado = document.getElementById('filtroDiametro').value;

    // Filtrar llantas disponibles según las selecciones actuales
    let llantasParaAncho = productosLlantas;
    let llantasParaPerfil = productosLlantas;
    let llantasParaDiametro = productosLlantas;

    // Para ancho: solo filtrar por marca si está seleccionada
    if (marcaSeleccionada) {
        llantasParaAncho = llantasParaAncho.filter(p => p.llanta.marca === marcaSeleccionada);
    }

    // Para perfil: filtrar por marca y ancho si están seleccionados
    if (marcaSeleccionada) {
        llantasParaPerfil = llantasParaPerfil.filter(p => p.llanta.marca === marcaSeleccionada);
    }
    if (anchoSeleccionado) {
        llantasParaPerfil = llantasParaPerfil.filter(p => p.llanta.ancho == anchoSeleccionado);
    }

    // Para diámetro: filtrar por marca, ancho y perfil si están seleccionados
    if (marcaSeleccionada) {
        llantasParaDiametro = llantasParaDiametro.filter(p => p.llanta.marca === marcaSeleccionada);
    }
    if (anchoSeleccionado) {
        llantasParaDiametro = llantasParaDiametro.filter(p => p.llanta.ancho == anchoSeleccionado);
    }
    if (perfilSeleccionado) {
        llantasParaDiametro = llantasParaDiametro.filter(p => p.llanta.perfil == perfilSeleccionado);
    }

    // Actualizar opciones de ancho
    const anchosDisponibles = [...new Set(llantasParaAncho
        .map(p => p.llanta.ancho)
        .filter(ancho => ancho != null))].sort((a, b) => a - b);

    const selectAncho = document.getElementById('filtroAncho');
    selectAncho.innerHTML = '<option value="">Todos los anchos</option>';
    anchosDisponibles.forEach(ancho => {
        const selected = ancho == anchoSeleccionado ? 'selected' : '';
        selectAncho.innerHTML += `<option value="${ancho}" ${selected}>${ancho}</option>`;
    });

    // Actualizar opciones de perfil
    const perfilesDisponibles = [...new Set(llantasParaPerfil
        .map(p => p.llanta.perfil)
        .filter(perfil => perfil != null && perfil > 0))].sort((a, b) => a - b);

    const selectPerfil = document.getElementById('filtroPerfil');
    selectPerfil.innerHTML = '<option value="">Todos los perfiles</option>';
    perfilesDisponibles.forEach(perfil => {
        const selected = perfil == perfilSeleccionado ? 'selected' : '';
        selectPerfil.innerHTML += `<option value="${perfil}" ${selected}>${perfil}</option>`;
    });

    // Actualizar opciones de diámetro
    const diametrosDisponibles = [...new Set(llantasParaDiametro
        .map(p => p.llanta.diametro)
        .filter(diametro => diametro && diametro.trim() !== ''))].sort();

    const selectDiametro = document.getElementById('filtroDiametro');
    selectDiametro.innerHTML = '<option value="">Todos los diámetros</option>';
    diametrosDisponibles.forEach(diametro => {
        const selected = diametro === diametroSeleccionado ? 'selected' : '';
        selectDiametro.innerHTML += `<option value="${diametro}" ${selected}>R${diametro}</option>`;
    });

    console.log(`🔄 Filtros actualizados: ${anchosDisponibles.length} anchos, ${perfilesDisponibles.length} perfiles, ${diametrosDisponibles.length} diámetros disponibles`);
}

function aplicarFiltrosLlantas() {
    console.log('🔍 Aplicando filtros de llantas...');

    const marcaSeleccionada = document.getElementById('filtroMarca').value;
    const anchoSeleccionado = document.getElementById('filtroAncho').value;
    const perfilSeleccionado = document.getElementById('filtroPerfil').value;
    const diametroSeleccionado = document.getElementById('filtroDiametro').value;

    console.log('🔍 Filtros aplicados:', {
        marca: marcaSeleccionada,
        ancho: anchoSeleccionado,
        perfil: perfilSeleccionado,
        diametro: diametroSeleccionado
    });

    // Filtrar productos
    let productosFiltrados = todosLosProductos;

    // Si hay algún filtro activo, aplicar filtrado
    if (marcaSeleccionada || anchoSeleccionado || perfilSeleccionado || diametroSeleccionado) {
        productosFiltrados = todosLosProductos.filter(producto => {
            // Solo filtrar llantas
            if (!producto.esLlanta || !producto.llanta) {
                return false; // Ocultar accesorios cuando hay filtros activos
            }

            const llanta = producto.llanta;

            // Verificar marca
            if (marcaSeleccionada && llanta.marca !== marcaSeleccionada) {
                return false;
            }

            // Verificar ancho
            if (anchoSeleccionado && llanta.ancho != anchoSeleccionado) {
                return false;
            }

            // Verificar perfil
            if (perfilSeleccionado && llanta.perfil != perfilSeleccionado) {
                return false;
            }

            // Verificar diámetro
            if (diametroSeleccionado && llanta.diametro !== diametroSeleccionado) {
                return false;
            }

            return true;
        });
    }

    console.log(`🔍 Productos después del filtro: ${productosFiltrados.length} de ${todosLosProductos.length}`);

    // Mostrar productos filtrados
    mostrarProductosFiltrados(productosFiltrados);
}

function mostrarProductosFiltrados(productos) {
    const container = document.getElementById('productosContainer');
    const noResultadosDiv = document.getElementById('noResultados');

    if (!productos || productos.length === 0) {
        // Mostrar mensaje de sin resultados
        container.innerHTML = '';
        if (noResultadosDiv) {
            noResultadosDiv.style.display = 'block';
        }
        return;
    }

    // Ocultar mensaje de sin resultados
    if (noResultadosDiv) {
        noResultadosDiv.style.display = 'none';
    }

    // Limpiar container
    container.innerHTML = '';

    // Mostrar productos
    productos.forEach((producto, index) => {
        const card = crearCardProducto(producto);
        container.appendChild(card);

        // Animación escalonada
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function limpiarFiltrosLlantas() {
    console.log('🧹 Limpiando filtros de llantas...');

    // Limpiar selects
    document.getElementById('filtroMarca').value = '';
    document.getElementById('filtroAncho').value = '';
    document.getElementById('filtroPerfil').value = '';
    document.getElementById('filtroDiametro').value = '';

    // Reconstruir todos los filtros con todas las opciones disponibles
    poblarFiltrosLlantas();

    // Mostrar todos los productos
    mostrarProductosFiltrados(todosLosProductos);
}

// ========================================
// FUNCIONES DE PAGINACIÓN Y LAZYLOADING
// ========================================
function inicializarEventosPaginacion() {
    console.log('🔧 Inicializando eventos de paginación y lazy loading...');

    // Evento para controles de paginación
    $(document).on('click', '.page-link[data-pagina]', function(e) {
        e.preventDefault();
        const nuevaPagina = parseInt($(this).data('pagina'));
        if (nuevaPagina !== paginaActual && !cargandoProductos) {
            cambiarPagina(nuevaPagina);
        }
    });

    // Evento para botón de cargar más (lazy loading)
    $('#btnCargarMas').on('click', function() {
        if (!cargandoProductos && paginaActual < totalPaginas) {
            cargarMasProductos();
        }
    });

    // Toggle entre paginación y lazy loading (si existe el botón)
    $('#toggleModoVista').on('click', function() {
        modoLazyLoading = !modoLazyLoading;
        actualizarModoVisualizacion();
    });
}

function cambiarPagina(nuevaPagina) {
    console.log('📄 Cambiando a página:', nuevaPagina);
    paginaActual = nuevaPagina;

    // Obtener término de búsqueda actual (si se implementa búsqueda)
    const termino = obtenerTerminoBusqueda(); // Asegúrate que esta función devuelva el término actual

    // Hacer scroll hacia arriba suavemente para enfocar la lista de productos
    $('html, body').animate({
        scrollTop: $('#productosContainer').offset().top - 100 // Ajustar según sea necesario
    }, 500);

    // Buscar productos de la nueva página
    buscarProductos(termino, nuevaPagina, false); // false indica que no es "cargar más"
}

function cargarMasProductos() {
    console.log('➕ Cargando más productos...');
    const siguientePagina = paginaActual + 1;
    const termino = obtenerTerminoBusqueda(); // Asegúrate que esta función devuelva el término actual

    // Solo cargar si hay más páginas y no estamos cargando
    if (siguientePagina <= totalPaginas && !cargandoProductos) {
        buscarProductos(termino, siguientePagina, true); // true indica que es "cargar más"
    }
}

function actualizarInfoResultados() {
    console.log('📊 === ACTUALIZANDO INFO DE RESULTADOS ===');

    // ✅ DETERMINAR EL TOTAL REAL DE PRODUCTOS (SIN DUPLICAR)
    let totalReal = 0;

    // Prioridad 1: Si hay paginación, usar totalRegistros del servidor
    if (window.lastServerResponse && window.lastServerResponse.paginacion && 
        typeof window.lastServerResponse.paginacion.totalRegistros === 'number') {
        totalReal = window.lastServerResponse.paginacion.totalRegistros;
        console.log('🔍 ORIGEN: paginacion.totalRegistros del servidor =', totalReal);
    }
    // Prioridad 2: Contar productos únicos cargados
    else if (productosActuales && productosActuales.length > 0) {
        totalReal = productosActuales.length;
        console.log('🔍 ORIGEN: productosActuales.length =', totalReal);
    }
    // Fallback: usar variable global si existe
    else if (typeof totalProductos === 'number' && totalProductos > 0) {
        totalReal = totalProductos;
        console.log('🔍 ORIGEN: totalProductos global =', totalReal);
    }
    else {
        totalReal = 0;
        console.log('🔍 ORIGEN: fallback a 0');
    }

    // ✅ ACTUALIZAR VARIABLE GLOBAL SIN DUPLICAR
    totalProductos = totalReal;

    console.log('🔍 DIAGNÓSTICO:', {
        'productosActuales.length': productosActuales?.length || 0,
        'totalReal calculado': totalReal,
        'totalProductos final': totalProductos
    });

    // Calcular productos realmente mostrados
    const productosRealesMostrados = Math.min(productosActuales?.length || 0, totalReal);
    console.log('📊 Productos realmente mostrados:', productosRealesMostrados);

    // ✅ TEXTO SIMPLE BASADO EN DATOS REALES
    const texto = `Mostrando ${productosRealesMostrados} de ${totalReal} productos`;

    // Actualizar el texto en la interfaz
    const $infoResultados = $('#info-resultados, .info-resultados, [data-info="resultados"]');
    if ($infoResultados.length > 0) {
        $infoResultados.text(texto);
        console.log('📊 Texto de resultados actualizado:', texto);
    } else {
        console.warn('⚠️ Elemento de información de resultados no encontrado');
    }

    console.log('📊 Estado actual:', {
        paginaActual,
        tamañoPagina,
        totalProductos,
        productosEnPagina: productosActuales?.length || 0,
        texto
    });

    console.log('📊 === FIN ACTUALIZACIÓN INFO RESULTADOS ===');
}

function actualizarControlesPaginacion() {
    const container = $('#paginacionControles');
    container.empty();

    // Ocultar paginación si está en modo lazy loading o si solo hay una página
    if (modoLazyLoading || totalPaginas <= 1) {
        $('#paginacionContainer').hide();
        return;
    }

    $('#paginacionContainer').show(); // Mostrar el contenedor de paginación

    // Botón anterior
    if (paginaActual > 1) {
        container.append(`
            <li class="page-item">
                <a class="page-link" href="#" data-pagina="${paginaActual - 1}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `);
    } else {
        // Botón anterior deshabilitado si estamos en la primera página
        container.append(`
            <li class="page-item disabled">
                <span class="page-link"><i class="bi bi-chevron-left"></i></span>
            </li>
        `);
    }

    // Páginas numeradas
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, paginaActual + 2);

    // Mostrar el primer número si no estamos muy cerca de él
    if (inicio > 1) {
        container.append(`
            <li class="page-item">
                <a class="page-link" href="#" data-pagina="1">1</a>
            </li>
        `);
        // Mostrar puntos suspensivos si hay un salto grande
        if (inicio > 2) {
            container.append(`
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `);
        }
    }

    // Mostrar las páginas intermedias
    for (let i = inicio; i <= fin; i++) {
        const isActive = i === paginaActual;
        container.append(`
            <li class="page-item ${isActive ? 'active' : ''}">
                ${isActive ?
                    `<span class="page-link">${i}</span>` : // Página actual no es un enlace
                    `<a class="page-link" href="#" data-pagina="${i}">${i}</a>`
                }
            </li>
        `);
    }

    // Mostrar el último número si no estamos muy cerca de él
    if (fin < totalPaginas) {
        // Mostrar puntos suspensivos si hay un salto grande
        if (fin < totalPaginas - 1) {
            container.append(`
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `);
        }
        container.append(`
            <li class="page-item">
                <a class="page-link" href="#" data-pagina="${totalPaginas}">${totalPaginas}</a>
            </li>
        `);
    }

    // Botón siguiente
    if (paginaActual < totalPaginas) {
        container.append(`
            <li class="page-item">
                <a class="page-link" href="#" data-pagina="${paginaActual + 1}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `);
    } else {
        // Botón siguiente deshabilitado si estamos en la última página
        container.append(`
            <li class="page-item disabled">
                <span class="page-link"><i class="bi bi-chevron-right"></i></span>
            </li>
        `);
    }
}

function actualizarBotonCargarMas() {
    const btnCargarMas = $('#btnCargarMas');

    // Mostrar botón solo si estamos en modo lazy loading y hay más páginas por cargar
    if (modoLazyLoading && paginaActual < totalPaginas) {
        btnCargarMas.show();
    } else {
        btnCargarMas.hide();
    }
}

function actualizarModoVisualizacion() {
    console.log(`🔄 Actualizando modo de visualización: ${modoLazyLoading ? 'Lazy Loading' : 'Paginación'}`);
    // Aquí podrías mostrar/ocultar el botón de toggle y los controles de paginación
    actualizarControlesPaginacion();
    actualizarBotonCargarMas();
    actualizarInfoResultados(); // Actualizar el texto de resultados según el modo

    // Si cambiamos a lazy loading y no estamos en la primera página,
    // podríamos querer cargar más productos si la vista no está llena.
    // Por ahora, solo actualizamos la visibilidad de los controles.
}


// ========================================
// FUNCIONES DE LOADING ESPECÍFICAS
// ========================================
function mostrarLoadingCargarMas() {
    $('#btnCargarMas').hide(); // Ocultar el botón mientras carga
    $('#loadingCargarMas').removeClass('d-none'); // Mostrar el spinner
}

function ocultarLoadingCargarMas() {
    $('#loadingCargarMas').addClass('d-none'); // Ocultar el spinner
    $('#btnCargarMas').show(); // Mostrar el botón de nuevo
}

// ========================================
// FUNCIONES DE RENDERIZADO ADICIONAL
// ========================================
function renderizarProductosAdicionales(productos) {
    console.log('➕ Agregando productos adicionales:', productos.length);
    const container = $('#productosContainer');

    productos.forEach((producto, index) => {
        const html = crearCardProducto(producto); // Reutilizamos crearCardProducto
        container.append(html);

        // Aplicar la animación de entrada a los nuevos elementos
        // Usamos un pequeño delay para que la animación sea visible
        setTimeout(() => {
            const newCard = container.children().last(); // Obtener la última tarjeta añadida
            newCard.css({
                opacity: '1',
                transform: 'translateY(0)'
            });
        }, index * 50); // Retraso escalonado para cada tarjeta
    });

    // Reinicializar animaciones para nuevos elementos si se usa IntersectionObserver
    // Si las animaciones ya están en las tarjetas al crearlas, esto podría no ser necesario.
    // Sin embargo, si el observer se inicializa solo una vez, debemos añadir los nuevos elementos.
    // Como `inicializarAnimaciones` observa elementos con la clase `.producto-item`,
    // y `crearCardProducto` ya añade esta clase, solo necesitamos asegurarnos que el observer
    // detecte los nuevos elementos. Si el observer está correctamente configurado para
    // observar dinámicamente añadidos, no se requiere nada aquí.
    // Si no, se necesitaría re-inicializar o añadir los nuevos elementos al observer.
}

function obtenerTerminoBusqueda() {
    // Esta función debe retornar el término de búsqueda actual si hay un input de búsqueda.
    // Por ahora, la devolvemos vacía ya que no hay implementación de búsqueda de texto.
    return '';
}

// ========================================
// FUNCIONES DE CONTROL DE FILTROS (REUTILIZADAS Y ADAPTADAS)
// ========================================
function inicializarEventos() {
    // Llama a la configuración de filtros de llantas
    configurarFiltrosLlantas();
}

function inicializarFiltros() {
    // Llama a la función que maneja los eventos de los filtros
    inicializarEventosFiltros();
}

function limpiarFiltros() {
    console.log('🧹 Limpiando todos los filtros');

    // Limpiar selects
    $('#filtroMarca').val('');
    $('#filtroAncho').val('');
    $('#filtroPerfil').val('');
    $('#filtroDiametro').val('');

    // Limpiar filtros activos (si se usara una variable global para ellos)
    // filtrosActivos = {}; // Descomentar si se usa

    // Resetear paginación a la primera página
    paginaActual = 1;

    // Volver a poblar todos los filtros con datos originales
    poblarFiltrosLlantas();

    // Recargar productos desde el principio (página 1, sin filtros activos)
    cargarProductosIniciales();
}

function aplicarFiltros() {
    console.log('🔍 Aplicando filtros...');

    // Actualizar filtros activos (si se usara una variable global para ellos)
    // filtrosActivos = {
    //     marca: $('#filtroMarca').val(),
    //     ancho: $('#filtroAncho').val(),
    //     perfil: $('#filtroPerfil').val(),
    //     diametro: $('#filtroDiametro').val()
    // }; // Descomentar si se usa

    // Resetear paginación a la primera página al aplicar filtros
    paginaActual = 1;

    // Buscar con los filtros aplicados
    // Asegurarse de que `buscarProductos` pueda manejar filtros si se implementan
    // Por ahora, `buscarProductos` solo usa el término de búsqueda y la página.
    // Se necesitaría modificar `buscarProductos` para aceptar los filtros como parámetros.
    // temporalmente llamamos a `aplicarFiltrosLlantas` que sí maneja el filtrado
    aplicarFiltrosLlantas();

    // Si los filtros aplicados resultan en una lista vacía, `mostrarProductosFiltrados` se encargará de mostrar el mensaje.
}

// Agregar eventos a los filtros
function inicializarEventosFiltros() {
    $('#filtroMarca, #filtroAncho, #filtroPerfil, #filtroDiametro').on('change', function() {
        aplicarFiltros(); // Llama a la función que aplica los filtros y resetea la paginación
    });

    $('#btnLimpiarFiltros').on('click', function() {
        limpiarFiltros(); // Llama a la función para limpiar todos los filtros y recargar
    });
}

// ========================================
// FUNCIONES GLOBALES DE EXPOSICIÓN
// ========================================
window.buscarProductos = buscarProductos;
window.verDetalleProducto = verDetalleProducto;
window.aplicarFiltrosLlantas = aplicarFiltrosLlantas;
window.limpiarFiltrosLlantas = limpiarFiltrosLlantas;
// No exponemos `aplicarFiltros` y `limpiarFiltros` directamente a window,
// ya que están envueltas por las funciones específicas de llantas.