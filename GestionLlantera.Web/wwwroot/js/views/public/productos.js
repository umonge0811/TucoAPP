// ========================================
// VISTA PÚBLICA DE PRODUCTOS - JAVASCRIPT
// ========================================

// Variables globales
let todosLosProductos = [];
let productosLlantas = [];

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de productos públicos cargado');

    // Inicializar funcionalidades
    inicializarAnimaciones();
    configurarFiltrosLlantas();

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

    // ✅ GUARDAR PRODUCTOS GLOBALMENTE
    todosLosProductos = productos;
    productosLlantas = productos.filter(p => p.esLlanta && p.llanta);
    
    // ✅ POBLAR FILTROS CON DATOS REALES
    poblarFiltrosLlantas();

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
    card.className = 'col-lg-4 col-md-6 mb-4';
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

                <!-- Precio Final -->
                <div class="producto-precios">
                    <div class="precio-principal">
                        <span class="precio-valor-principal">₡${formatearMoneda(precioFinalEfectivo)}</span>
                        <small class="precio-condiciones">
                            * Precio válido para Efectivo, Transferencia o SINPE Móvil
                        </small>
                    </div>
                    <div class="precio-tarjeta-info">
                        <small class="texto-tarjeta">Tarjeta: ₡${formatearMoneda(precioFinalTarjeta)}</small>
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
// FUNCIONES GLOBALES
// ========================================
window.buscarProductos = buscarProductos;
window.verDetalleProducto = verDetalleProducto;
window.aplicarFiltrosLlantas = aplicarFiltrosLlantas;
window.limpiarFiltrosLlantas = limpiarFiltrosLlantas;