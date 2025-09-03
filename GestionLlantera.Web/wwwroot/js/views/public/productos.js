// ========================================
// VISTA PÚBLICA DE PRODUCTOS - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de productos públicos cargado');

    // Inicializar funcionalidades
    inicializarBusqueda();
    inicializarFiltros();
    inicializarAnimaciones();
    inicializarBuscadorLlantas();

    // Cargar productos iniciales
    cargarProductosIniciales();

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
        await buscarProductos('');

        console.log('✅ Productos iniciales cargados exitosamente');

    } catch (error) {
        console.error('❌ Error cargando productos iniciales:', error);
        mostrarError('Error al cargar los productos iniciales: ' + error.message);
    }
}

// ========================================
// BÚSQUEDA EN TIEMPO REAL
// ========================================
function inicializarBusqueda() {
    const inputBusqueda = document.getElementById('busquedaProductos');

    if (!inputBusqueda) {
        console.warn('⚠️ Input de búsqueda no encontrado');
        return;
    }

    console.log('✅ Inicializando búsqueda en tiempo real');

    // Filtrado en tiempo real con debounce
    let timeoutId;
    inputBusqueda.addEventListener('input', function () {
        clearTimeout(timeoutId);
        
        // Debounce de 300ms para mejor rendimiento
        timeoutId = setTimeout(() => {
            filtrarProductos();
        }, 300);
    });

    // También filtrar al presionar Enter
    inputBusqueda.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(timeoutId);
            filtrarProductos();
        }
    });
}

// ========================================
// FILTROS POR CATEGORÍA EN TIEMPO REAL
// ========================================
function inicializarFiltros() {
    const selectCategoria = document.getElementById('filtroCategoria');

    if (!selectCategoria) {
        console.warn('⚠️ Elemento filtroCategoria no encontrado');
        return;
    }

    console.log('✅ Inicializando filtros de categoría en tiempo real');

    selectCategoria.addEventListener('change', function () {
        const valor = this.value;
        console.log('🔄 Categoría seleccionada:', valor);

        // Gestión del buscador de llantas
        const buscadorLlantas = document.getElementById('buscadorLlantas');
        if (buscadorLlantas) {
            if (valor === 'llanta') {
                buscadorLlantas.classList.add('categoria-activa');
                buscadorLlantas.style.display = 'block';
                console.log('🎯 Buscador de llantas activado');
            } else {
                buscadorLlantas.classList.remove('categoria-activa');
                // Mantener visible pero con estilo diferente
                console.log('🎯 Buscador de llantas en modo general');
            }
        }

        // Aplicar filtros inmediatamente
        filtrarProductos();
    });

    // Configurar buscador de llantas
    const buscadorLlantas = document.getElementById('buscadorLlantas');
    if (buscadorLlantas) {
        console.log('✅ Buscador de llantas configurado');
        buscadorLlantas.style.display = 'block';
    } else {
        console.warn('⚠️ Buscador de llantas NO encontrado');
    }
}

// ========================================
// FUNCIÓN PRINCIPAL DE FILTRADO EN TIEMPO REAL
// ========================================
function filtrarProductos() {
    const termino = document.getElementById('busquedaProductos')?.value.toLowerCase().trim() || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';

    // Usar el selector correcto para las cards de productos
    const productos = document.querySelectorAll('.producto-card');
    const noResultados = document.getElementById('noResultados');
    let productosVisibles = 0;

    console.log(`🔍 Filtrando ${productos.length} productos con término: "${termino}" y categoría: "${categoria}"`);

    productos.forEach(function (producto, index) {
        // Obtener datos del producto desde atributos data-*
        const nombre = (producto.getAttribute('data-nombre') || '').toLowerCase();
        const categoriaProducto = producto.getAttribute('data-categoria') || '';
        
        // También buscar en el contenido visible del producto
        const textoCompleto = producto.textContent.toLowerCase();

        let mostrar = true;

        // Filtro por término de búsqueda (buscar en nombre y contenido completo)
        if (termino) {
            const coincideNombre = nombre.includes(termino);
            const coincideTexto = textoCompleto.includes(termino);
            if (!coincideNombre && !coincideTexto) {
                mostrar = false;
            }
        }

        // Filtro por categoría
        if (categoria && categoriaProducto !== categoria) {
            mostrar = false;
        }

        // Aplicar filtro con animación suave
        if (mostrar) {
            producto.style.display = 'block';
            producto.style.opacity = '1';
            producto.style.transform = 'translateY(0) scale(1)';
            productosVisibles++;

            // Animación escalonada más sutil
            setTimeout(() => {
                producto.style.transition = 'all 0.3s ease';
            }, index * 30);

        } else {
            // Ocultar inmediatamente sin animación para filtrado en tiempo real
            producto.style.display = 'none';
            producto.style.opacity = '0';
            producto.style.transform = 'translateY(10px) scale(0.95)';
        }
    });

    // Mostrar/ocultar mensaje de no resultados
    if (noResultados) {
        if (productosVisibles === 0) {
            noResultados.style.display = 'block';
            noResultados.style.opacity = '1';
        } else {
            noResultados.style.display = 'none';
            noResultados.style.opacity = '0';
        }
    }

    console.log(`✅ Filtrado completado: ${productosVisibles} productos visibles de ${productos.length} totales`);
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
// FUNCIÓN PRINCIPAL DE BÚSQUEDA - COPIA EXACTA DE FACTURACIÓN
// ========================================
async function buscarProductos(termino = '') {
    try {
        console.log('🔍 === INICIO buscarProductos (Vista Pública) ===');
        console.log('🔍 Término recibido:', `"${termino}"`);

        // Mostrar loading
        mostrarLoading();

        // ✅ USAR LA MISMA URL Y LÓGICA QUE EL ENDPOINT EXITOSO DE FACTURACIÓN
        const response = await fetch('/Public/ObtenerProductosParaFacturacion', {
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

        if (data && data.success && data.productos) {
            console.log(`✅ Se encontraron ${data.productos.length} productos disponibles`);
            console.log('📋 Estructura de datos recibida:', {
                total: data.productos.length,
                llantas: data.productos.filter(p => p.esLlanta).length,
                accesorios: data.productos.filter(p => !p.esLlanta).length,
                conImagenes: data.productos.filter(p => p.imagenesUrls && p.imagenesUrls.length > 0).length
            });
            mostrarResultados(data.productos);
            console.log('📦 Productos mostrados exitosamente en vista pública');
        } else {
            const errorMessage = data.message || 'Error desconocido al obtener productos';
            console.error('❌ Error en la respuesta:', errorMessage);
            console.error('❌ Datos recibidos:', data);
            mostrarSinResultados();
        }

    } catch (error) {
        console.error('❌ Error buscando productos:', error);
        mostrarError('Error al buscar productos: ' + error.message);
    } finally {
        ocultarLoading();
    }
    console.log('🔍 === FIN buscarProductos (Vista Pública) ===');
}

// ========================================
// FUNCIONES DE UI - IMPLEMENTACIÓN REAL
// ========================================
function mostrarLoading() {
    const container = document.getElementById('productosContainer') || document.getElementById('listaProductos');
    if (container) {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <span class="ms-3">Buscando productos...</span>
            </div>
        `;
    }
}

function ocultarLoading() {
    // La función mostrarResultados ya se encarga de limpiar el loading
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

    // Limpiar container
    container.innerHTML = '';

    // Ocultar mensaje de sin resultados
    if (noResultadosDiv) {
        noResultadosDiv.style.display = 'none';
    }

    // DIAGNÓSTICO DETALLADO DE IMÁGENES
    console.log('🖼️ === DIAGNÓSTICO DE IMÁGENES ===');
    productos.forEach((producto, index) => {
        console.log(`🖼️ Producto ${index + 1}: ${producto.nombreProducto}`);
        console.log(`🖼️   - imagenesUrls:`, producto.imagenesUrls);
        console.log(`🖼️   - imagenesProductos:`, producto.imagenesProductos);
        
        if (producto.imagenesProductos && producto.imagenesProductos.length > 0) {
            producto.imagenesProductos.forEach((img, imgIndex) => {
                console.log(`🖼️   - Imagen ${imgIndex + 1}:`, {
                    Urlimagen: img.Urlimagen,
                    urlimagen: img.urlimagen,
                    UrlImagen: img.UrlImagen,
                    urlImagen: img.urlImagen
                });
            });
        }
    });
    console.log('🖼️ === FIN DIAGNÓSTICO ===');

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
                const puertoLocal = esHTTPS ? '7273' : '5049';
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
                const puertoLocal = esHTTPS ? '7273' : '5049';
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
                infoLlanta = `<div class="medida-tag">${medidaCompleta}</div>`;
            }
        } catch (error) {
            console.warn('⚠️ Error procesando información de llanta:', error);
        }
    }

    // ✅ CALCULAR PRECIOS (MISMA LÓGICA QUE FACTURACIÓN)
    const CONFIGURACION_PRECIOS = {
        efectivo: { multiplicador: 1.0 },
        tarjeta: { multiplicador: 1.05 }
    };

    const precioBase = (typeof precio === 'number') ? precio : 0;
    const precioEfectivo = precioBase * CONFIGURACION_PRECIOS.efectivo.multiplicador;
    const precioTarjeta = precioBase * CONFIGURACION_PRECIOS.tarjeta.multiplicador;

    // ✅ DETERMINAR ESTADO DEL STOCK
    const stockEstado = cantidadInventario <= 0 ? 'sin-stock' :
        cantidadInventario <= stockMinimo ? 'stock-bajo' : 'stock-normal';

    // ✅ CREAR CARD HTML MINIMALISTA
    const card = document.createElement('div');
    card.className = 'col-lg-4 col-md-6 mb-4';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';

    // Agregar atributos data- al contenedor principal para filtrado
    card.setAttribute('data-nombre', nombreProducto.toLowerCase());
    card.setAttribute('data-categoria', esLlanta ? 'llanta' : 'accesorio');

    card.innerHTML = `
        <div class="producto-card ${stockEstado}">
            <!-- Imagen del Producto -->
            <div class="producto-imagen-container">
                <img src="${imagenUrl}" 
                     class="producto-imagen" 
                     alt="${nombreProducto}"
                     onerror="this.src='/images/no-image.png'">
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
                    ${descripcion}
                </p>

                <!-- Precios -->
                <div class="producto-precios">
                    <div class="precio-item">
                        <span class="precio-label">Efectivo/SINPE</span>
                        <span class="precio-valor efectivo">₡${formatearMoneda(precioEfectivo)}</span>
                    </div>
                    <div class="precio-item">
                        <span class="precio-label">Tarjeta</span>
                        <span class="precio-valor tarjeta">₡${formatearMoneda(precioTarjeta)}</span>
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

function limpiarFiltros() {
    const inputBusqueda = document.getElementById('busquedaProductos');
    const selectCategoria = document.getElementById('filtroCategoria');

    if (inputBusqueda) inputBusqueda.value = '';
    if (selectCategoria) selectCategoria.value = '';

    // Recargar todos los productos
    cargarProductosIniciales();
}

function verDetalleProducto(productoId) {
    console.log('🔍 Navegando a detalle del producto:', productoId);
    // Redirigir a la página de detalle del producto
    window.location.href = `/Public/DetalleProducto/${productoId}`;
}

// ========================================
// BUSCADOR INTELIGENTE DE LLANTAS
// ========================================
let medidas = {
    anchos: [],
    perfiles: [],
    diametros: []
};

let llantasDisponibles = [];

function inicializarBuscadorLlantas() {
    console.log('🔧 Inicializando buscador inteligente de llantas');

    // Cargar medidas disponibles
    cargarMedidasDisponibles();

    // Event listeners para los inputs
    const anchoInput = document.getElementById('anchoLlanta');
    const perfilSelect = document.getElementById('perfilLlanta');
    const diametroSelect = document.getElementById('diametroLlanta');

    if (anchoInput) {
        anchoInput.addEventListener('input', filtrarPorAncho);
    }

    if (perfilSelect) {
        perfilSelect.addEventListener('change', filtrarPorPerfil);
    }

    if (diametroSelect) {
        diametroSelect.addEventListener('change', actualizarContadorResultados);
    }

    // Event listeners para tipo de vehículo
    const radioAuto = document.getElementById('tipoAuto');
    const radioMoto = document.getElementById('tipoMoto');

    if (radioAuto) {
        radioAuto.addEventListener('change', filtrarPorTipoVehiculo);
    }

    if (radioMoto) {
        radioMoto.addEventListener('change', filtrarPorTipoVehiculo);
    }
}

async function cargarMedidasDisponibles() {
    try {
        console.log('📊 Cargando medidas disponibles...');

        // Usar el mismo endpoint que ya funciona
        const response = await fetch('/Public/ObtenerProductosParaFacturacion', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.productos) {
                llantasDisponibles = data.productos.filter(p => p.esLlanta && p.llanta);
                procesarMedidasDisponibles();
                console.log(`✅ Cargadas ${llantasDisponibles.length} llantas para filtros inteligentes`);
            }
        }
    } catch (error) {
        console.error('❌ Error cargando medidas:', error);
    }
}

function procesarMedidasDisponibles() {
    medidas.anchos = [...new Set(llantasDisponibles
        .filter(l => l.llanta && l.llanta.ancho)
        .map(l => l.llanta.ancho))].sort((a, b) => a - b);

    medidas.perfiles = [...new Set(llantasDisponibles
        .filter(l => l.llanta && l.llanta.perfil)
        .map(l => l.llanta.perfil))].sort((a, b) => a - b);

    medidas.diametros = [...new Set(llantasDisponibles
        .filter(l => l.llanta && l.llanta.diametro)
        .map(l => l.llanta.diametro))].sort();

    console.log('📐 Medidas procesadas:', {
        anchos: medidas.anchos.length,
        perfiles: medidas.perfiles.length,
        diametros: medidas.diametros.length
    });
}

function filtrarPorAncho() {
    const anchoInput = document.getElementById('anchoLlanta');
    const perfilSelect = document.getElementById('perfilLlanta');
    const diametroSelect = document.getElementById('diametroLlanta');

    const anchoValor = parseInt(anchoInput.value);

    // Limpiar selects dependientes
    perfilSelect.innerHTML = '<option value="">Selecciona perfil...</option>';
    diametroSelect.innerHTML = '<option value="">Selecciona diámetro...</option>';
    perfilSelect.disabled = true;
    diametroSelect.disabled = true;

    if (anchoValor && anchoValor >= 100) {
        // Filtrar llantas por ancho seleccionado
        const llantasFiltradas = llantasDisponibles.filter(l =>
            l.llanta && l.llanta.ancho === anchoValor
        );

        // Obtener perfiles disponibles para este ancho
        const perfilesDisponibles = [...new Set(llantasFiltradas
            .filter(l => l.llanta.perfil)
            .map(l => l.llanta.perfil))].sort((a, b) => a - b);

        if (perfilesDisponibles.length > 0) {
            perfilesDisponibles.forEach(perfil => {
                const option = document.createElement('option');
                option.value = perfil;
                option.textContent = perfil;
                perfilSelect.appendChild(option);
            });
            perfilSelect.disabled = false;

            mostrarSugerencias('ancho', `${perfilesDisponibles.length} perfiles disponibles`);
        }

        actualizarContadorResultados();
    } else {
        ocultarSugerencias();
    }
}

function filtrarPorPerfil() {
    const anchoInput = document.getElementById('anchoLlanta');
    const perfilSelect = document.getElementById('perfilLlanta');
    const diametroSelect = document.getElementById('diametroLlanta');

    const anchoValor = parseInt(anchoInput.value);
    const perfilValor = parseInt(perfilSelect.value);

    // Limpiar select de diámetro
    diametroSelect.innerHTML = '<option value="">Selecciona diámetro...</option>';
    diametroSelect.disabled = true;

    if (anchoValor && perfilValor) {
        // Filtrar llantas por ancho y perfil
        const llantasFiltradas = llantasDisponibles.filter(l =>
            l.llanta &&
            l.llanta.ancho === anchoValor &&
            l.llanta.perfil === perfilValor
        );

        // Obtener diámetros disponibles
        const diametrosDisponibles = [...new Set(llantasFiltradas
            .filter(l => l.llanta.diametro)
            .map(l => l.llanta.diametro))].sort();

        if (diametrosDisponibles.length > 0) {
            diametrosDisponibles.forEach(diametro => {
                const option = document.createElement('option');
                option.value = diametro;
                option.textContent = `R${diametro}"`;
                diametroSelect.appendChild(option);
            });
            diametroSelect.disabled = false;

            mostrarSugerencias('perfil', `${diametrosDisponibles.length} diámetros disponibles`);
        }

        actualizarContadorResultados();
    }
}

function filtrarPorTipoVehiculo() {
    // Por ahora, solo limpiar y recargar medidas
    // En el futuro se puede implementar lógica específica para motos
    limpiarBuscadorLlantas();
    const tipoSeleccionado = document.querySelector('input[name="tipoVehiculo"]:checked').value;
    console.log('🏍️ Tipo de vehículo seleccionado:', tipoSeleccionado);
}

function actualizarContadorResultados() {
    const anchoInput = document.getElementById('anchoLlanta');
    const perfilSelect = document.getElementById('perfilLlanta');
    const diametroSelect = document.getElementById('diametroLlanta');
    const contadorResultados = document.getElementById('contadorResultados');
    const resultadosDiv = document.getElementById('resultadosBusquedaLlantas');

    const anchoValor = parseInt(anchoInput.value);
    const perfilValor = parseInt(perfilSelect.value);
    const diametroValor = diametroSelect.value;

    let llantasFiltradas = llantasDisponibles;

    if (anchoValor && anchoValor >= 100) {
        llantasFiltradas = llantasFiltradas.filter(l => l.llanta && l.llanta.ancho === anchoValor);
    }

    if (perfilValor) {
        llantasFiltradas = llantasFiltradas.filter(l => l.llanta && l.llanta.perfil === perfilValor);
    }

    if (diametroValor) {
        llantasFiltradas = llantasFiltradas.filter(l => l.llanta && l.llanta.diametro === diametroValor);
    }

    const cantidad = llantasFiltradas.length;

    if (contadorResultados) {
        contadorResultados.textContent = `${cantidad} ${cantidad === 1 ? 'llanta encontrada' : 'llantas encontradas'}`;
    }

    if (resultadosDiv) {
        if (anchoValor && anchoValor >= 100) {
            resultadosDiv.style.display = 'block';
        } else {
            resultadosDiv.style.display = 'none';
        }
    }
}

function aplicarFiltroLlantas() {
    const anchoInput = document.getElementById('anchoLlanta');
    const perfilSelect = document.getElementById('perfilLlanta');
    const diametroSelect = document.getElementById('diametroLlanta');

    const anchoValor = parseInt(anchoInput.value);
    const perfilValor = parseInt(perfilSelect.value);
    const diametroValor = diametroSelect.value;

    // Construir término de búsqueda basado en la medida
    let terminoBusqueda = '';

    if (anchoValor) {
        terminoBusqueda += anchoValor;
        if (perfilValor) {
            terminoBusqueda += `/${perfilValor}`;
            if (diametroValor) {
                terminoBusqueda += `/R${diametroValor}`;
            }
        } else if (diametroValor) {
            terminoBusqueda += `/R${diametroValor}`;
        }
    }

    console.log('🎯 Aplicando filtro de llantas:', terminoBusqueda);

    // Aplicar filtro a los productos mostrados
    filtrarProductosPorMedida(anchoValor, perfilValor, diametroValor);

    // Scroll a los resultados
    document.getElementById('productosContainer').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function filtrarProductosPorMedida(ancho, perfil, diametro) {
    const productos = document.querySelectorAll('.producto-item');
    const noResultados = document.getElementById('noResultados');
    let productosVisibles = 0;

    productos.forEach(function (producto) {
        const esLlanta = producto.getAttribute('data-categoria') === 'llanta';
        let mostrar = true;

        if (esLlanta && ancho) {
            // Buscar en el contenido del producto la medida
            const contenidoProducto = producto.textContent.toLowerCase();
            const nombre = producto.getAttribute('data-nombre') || '';

            let cumpleFiltro = false;

            // Buscar patrones de medida en el nombre o contenido
            if (ancho) {
                const patronAncho = new RegExp(`\\b${ancho}\\b`, 'i');
                if (patronAncho.test(contenidoProducto) || patronAncho.test(nombre)) {
                    cumpleFiltro = true;

                    if (perfil) {
                        const patronPerfil = new RegExp(`\\b${perfil}\\b`, 'i');
                        if (!patronPerfil.test(contenidoProducto) && !patronPerfil.test(nombre)) {
                            cumpleFiltro = false;
                        }
                    }

                    if (diametro && cumpleFiltro) {
                        const patronDiametro = new RegExp(`\\bR?${diametro}\\b`, 'i');
                        if (!patronDiametro.test(contenidoProducto) && !patronDiametro.test(nombre)) {
                            cumpleFiltro = false;
                        }
                    }
                }
            }

            if (!cumpleFiltro) {
                mostrar = false;
            }
        }

        if (mostrar) {
            producto.style.display = 'block';
            producto.style.opacity = '1';
            producto.style.transform = 'translateY(0)';
            productosVisibles++;
        } else {
            producto.style.display = 'none';
        }
    });

    // Mostrar/ocultar mensaje de no resultados
    if (noResultados) {
        if (productosVisibles === 0) {
            noResultados.style.display = 'block';
        } else {
            noResultados.style.display = 'none';
        }
    }

    console.log(`🎯 Filtro de medidas aplicado: ${productosVisibles} productos visibles`);
}

function mostrarSugerencias(campo, mensaje) {
    const sugerenciasDiv = document.getElementById(`sugerencias${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
    if (sugerenciasDiv) {
        sugerenciasDiv.innerHTML = `
            <div class="suggestion-item">
                <small class="text-success">
                    <i class="bi bi-check-circle me-1"></i>${mensaje}
                </small>
            </div>
        `;
        sugerenciasDiv.style.display = 'block';

        setTimeout(() => {
            sugerenciasDiv.style.display = 'none';
        }, 3000);
    }
}

function ocultarSugerencias() {
    ['ancho', 'perfil', 'diametro'].forEach(campo => {
        const sugerenciasDiv = document.getElementById(`sugerencias${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
        if (sugerenciasDiv) {
            sugerenciasDiv.style.display = 'none';
        }
    });
}

function limpiarBuscadorLlantas() {
    console.log('🧹 Limpiando buscador de llantas');

    // Limpiar inputs
    const anchoInput = document.getElementById('anchoLlanta');
    const perfilSelect = document.getElementById('perfilLlanta');
    const diametroSelect = document.getElementById('diametroLlanta');
    const resultadosDiv = document.getElementById('resultadosBusquedaLlantas');

    if (anchoInput) anchoInput.value = '';
    if (perfilSelect) {
        perfilSelect.innerHTML = '<option value="">Selecciona perfil...</option>';
        perfilSelect.disabled = true;
    }
    if (diametroSelect) {
        diametroSelect.innerHTML = '<option value="">Selecciona diámetro...</option>';
        diametroSelect.disabled = true;
    }
    if (resultadosDiv) {
        resultadosDiv.style.display = 'none';
    }

    ocultarSugerencias();

    // Mostrar todos los productos de llantas
    const productos = document.querySelectorAll('.producto-item');
    productos.forEach(producto => {
        producto.style.display = 'block';
        producto.style.opacity = '1';
        producto.style.transform = 'translateY(0)';
    });

    const noResultados = document.getElementById('noResultados');
    if (noResultados) {
        noResultados.style.display = 'none';
    }
}

function limpiarTodosFiltros() {
    // Limpiar filtros normales
    limpiarFiltros();

    // Limpiar buscador de llantas
    limpiarBuscadorLlantas();

    // EL BUSCADOR NUNCA SE OCULTA - solo se limpia
    const buscadorLlantas = document.getElementById('buscadorLlantas');
    if (buscadorLlantas) {
        buscadorLlantas.classList.remove('categoria-activa');
        console.log('🧹 Buscador limpiado pero permanece visible');
    }

    // Resetear categoría
    const selectCategoria = document.getElementById('filtroCategoria');
    if (selectCategoria) {
        selectCategoria.value = '';
    }
}

// ========================================
// FUNCIONES GLOBALES
// ========================================
window.filtrarProductos = filtrarProductos;
window.limpiarFiltros = limpiarFiltros;
window.limpiarTodosFiltros = limpiarTodosFiltros;
window.buscarProductos = buscarProductos;
window.verDetalleProducto = verDetalleProducto;
window.limpiarBuscadorLlantas = limpiarBuscadorLlantas;
window.aplicarFiltroLlantas = aplicarFiltroLlantas;