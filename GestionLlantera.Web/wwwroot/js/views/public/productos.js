
// ========================================
// VISTA PÚBLICA DE PRODUCTOS - JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Módulo de productos públicos cargado');

    // Inicializar funcionalidades
    inicializarBusqueda();
    inicializarFiltros();
    inicializarAnimaciones();
    
    // Cargar productos iniciales
    cargarProductosIniciales();

    console.log('✅ Vista pública de productos inicializada correctamente');
});

// ========================================
// CARGAR PRODUCTOS INICIALES
// ========================================
async function cargarProductosIniciales() {
    try {
        console.log('🔄 Cargando productos iniciales...');
        await buscarProductos('');
    } catch (error) {
        console.error('❌ Error cargando productos iniciales:', error);
        mostrarError('Error al cargar los productos iniciales');
    }
}

// ========================================
// BÚSQUEDA DE PRODUCTOS
// ========================================
function inicializarBusqueda() {
    const inputBusqueda = document.getElementById('busquedaProductos');

    if (!inputBusqueda) return;

    inputBusqueda.addEventListener('input', function() {
        const termino = this.value.toLowerCase().trim();
        if (termino.length >= 2 || termino.length === 0) {
            buscarProductos(termino);
        }
    });
}

// ========================================
// FILTROS POR CATEGORÍA
// ========================================
function inicializarFiltros() {
    const selectCategoria = document.getElementById('filtroCategoria');

    if (!selectCategoria) return;

    selectCategoria.addEventListener('change', function() {
        filtrarProductos();
    });
}

// ========================================
// FUNCIÓN PRINCIPAL DE FILTRADO
// ========================================
function filtrarProductos() {
    const termino = document.getElementById('busquedaProductos')?.value.toLowerCase().trim() || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';

    const productos = document.querySelectorAll('.producto-item');
    const noResultados = document.getElementById('noResultados');
    let productosVisibles = 0;

    productos.forEach(function(producto) {
        const nombre = producto.getAttribute('data-nombre') || '';
        const categoriaProducto = producto.getAttribute('data-categoria') || '';

        let mostrar = true;

        // Filtro por término de búsqueda
        if (termino && !nombre.includes(termino)) {
            mostrar = false;
        }

        // Filtro por categoría
        if (categoria && categoriaProducto !== categoria) {
            mostrar = false;
        }

        if (mostrar) {
            producto.style.display = 'block';
            productosVisibles++;

            // Agregar animación escalonada
            setTimeout(() => {
                producto.style.opacity = '1';
                producto.style.transform = 'translateY(0)';
            }, productosVisibles * 50);

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

    console.log(`🔍 Filtros aplicados: ${productosVisibles} productos visibles`);
}

// ========================================
// ANIMACIONES AL CARGAR
// ========================================
function inicializarAnimaciones() {
    // Animar elementos al hacer scroll
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
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
    productos.forEach(function(producto) {
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
            mostrarResultados(data.productos);
            console.log('📦 Productos mostrados exitosamente en vista pública');
        } else {
            const errorMessage = data.message || 'Error desconocido al obtener productos';
            console.error('❌ Error en la respuesta:', errorMessage);
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

    // Generar HTML para cada producto (igual que facturación)
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

    // ✅ PROCESAR IMAGEN (MISMA LÓGICA QUE FACTURACIÓN)
    let imagenUrl = '/images/no-image.png';
    try {
        if (producto.imagenesUrls && Array.isArray(producto.imagenesUrls) && producto.imagenesUrls.length > 0) {
            imagenUrl = producto.imagenesUrls[0];
        } else if (producto.imagenesProductos && Array.isArray(producto.imagenesProductos) && producto.imagenesProductos.length > 0) {
            const primeraImagen = producto.imagenesProductos[0];
            if (primeraImagen && primeraImagen.Urlimagen) {
                imagenUrl = primeraImagen.Urlimagen;
            }
        }
    } catch (error) {
        console.warn('⚠️ Error procesando imágenes del producto:', error);
        imagenUrl = '/images/no-image.png';
    }

    // ✅ PROCESAR INFORMACIÓN DE LLANTA (MISMA LÓGICA QUE FACTURACIÓN)
    let medidaCompleta = '';
    let infoLlanta = '';
    
    if (esLlanta && producto.llanta) {
        try {
            const llanta = producto.llanta;
            if (llanta.medidaCompleta) {
                medidaCompleta = llanta.medidaCompleta;
            } else if (llanta.ancho && llanta.diametro) {
                if (llanta.perfil && llanta.perfil > 0) {
                    medidaCompleta = `${llanta.ancho}/${llanta.perfil}R${llanta.diametro}`;
                } else {
                    medidaCompleta = `${llanta.ancho}/R${llanta.diametro}`;
                }
            }
            
            if (medidaCompleta) {
                infoLlanta = `
                    <div class="medida-llanta mb-2">
                        <span class="badge bg-info">${medidaCompleta}</span>
                    </div>
                `;
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

    // ✅ CREAR CARD HTML (SIMILAR A FACTURACIÓN PERO ADAPTADO PARA VISTA PÚBLICA)
    const card = document.createElement('div');
    card.className = 'col-lg-4 col-md-6 mb-4';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';

    const stockClase = cantidadInventario <= 0 ? 'border-danger' : cantidadInventario <= stockMinimo ? 'border-warning' : '';

    card.innerHTML = `
        <div class="card h-100 producto-item ${stockClase}" data-nombre="${nombreProducto.toLowerCase()}" data-categoria="${esLlanta ? 'llanta' : 'accesorio'}">
            <div class="card-img-container" style="height: 200px; overflow: hidden;">
                <img src="${imagenUrl}" 
                     class="card-img-top h-100 w-100" 
                     style="object-fit: cover;" 
                     alt="${nombreProducto}"
                     onerror="this.src='/images/no-image.png'">
            </div>
            <div class="card-body d-flex flex-column">
                <h6 class="card-title" title="${nombreProducto}">
                    ${nombreProducto.length > 30 ? nombreProducto.substring(0, 30) + '...' : nombreProducto}
                </h6>
                
                ${infoLlanta}
                
                <p class="card-text text-muted small mb-3">
                    ${descripcion.length > 80 ? descripcion.substring(0, 80) + '...' : descripcion}
                </p>
                
                <div class="mt-auto">
                    <div class="precios-container mb-3">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted d-block">Efectivo/SINPE</small>
                                <span class="text-success fw-bold">₡${formatearMoneda(precioEfectivo)}</span>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Tarjeta</small>
                                <span class="text-warning fw-bold">₡${formatearMoneda(precioTarjeta)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stock-info mb-3">
                        <small class="text-muted">Stock disponible: </small>
                        <span class="${cantidadInventario <= 0 ? 'text-danger' : cantidadInventario <= stockMinimo ? 'text-warning' : 'text-success'} fw-bold">
                            ${cantidadInventario} ${cantidadInventario === 1 ? 'unidad' : 'unidades'}
                        </span>
                    </div>
                    
                    <div class="d-grid">
                        <button class="btn btn-primary btn-sm" onclick="verDetalleProducto(${productoId})">
                            <i class="bi bi-eye"></i> Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

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
// FUNCIONES GLOBALES
// ========================================
window.filtrarProductos = filtrarProductos;
window.limpiarFiltros = limpiarFiltros;
window.buscarProductos = buscarProductos;
window.verDetalleProducto = verDetalleProducto;
